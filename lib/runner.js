const {execSync} = require('child_process')
const EventEmitter = require('events')
const fs = require('fs')
const path = require('path')

const exec = require('./exec')

const argv = process.argv
const env = process.env
const expandableRegEx = /\bnpm run\s+(\S+)\b/g

const defaultEnvScript = 'env'
const defaultStartScript = 'node server.js'
const defaultRestartNames = [
  'prestop',
  'stop',
  'poststop',
  'prestart',
  'start',
  'poststart'
]

class Runner extends EventEmitter {
  static defaults() {
    return {
      // Constants
      packageBasename: 'package.json',
      scriptsBasename: 'scripts.js',
      // Environment Variables
      moduleRoot: env.INIT_CWD || process.cwd(),
      // Arguments
      execPath: argv[1],
      appName: path.basename(argv[1]),
      scriptName: argv[2],
      unscannedArguments: ((x) => (++x ? argv.slice(x) : []))(argv.indexOf('--'))
    }
  }

  constructor(options = {}) {
    super()
    Object.assign(this, Runner.defaults(), options)
    this.initialDirectory = process.cwd()
    this.wd = this.moduleRoot
  }

  appendUnscannedArguments(source) {
    if (source && this.unscannedArguments.length > 0) {
      if (typeof source === 'function') {
        return () => source.apply(null, this.unscannedArguments)
      }

      return `${source} ${quoteCommandArguments(this.unscannedArguments)}`
    }

    return source
  }

  exportEnvironmentVariables() {
    env.NODE = env.npm_node_execpath = process.execPath
    env.PATH = `${this.dotBin}:${env.PATH}`
    env.run_execpath = this.execPath

    const object = Object.assign(this.package)

    if (!object.scripts) {
      object.scripts = {}
    }

    if (!object.scripts.env) {
      object.scripts.env = defaultEnvScript
    }

    try {
      const buffer = execSync("git log -1 --format='%H'", {
        stdio: ['ignore', 'pipe', 'ignore']
      })

      env.npm_package_gitHead = `${buffer}`.trim()
    } catch (_) {
      // Ignore.
    }

    for (const k in object) {
      envifyValue(`npm_package_${k}`, object[k])
    }

    return this
  }

  findRunnableScripts() {
    this.findScripts()

    if (this.scripts) {
      const scriptName = this.scriptName
      const found = !!this.scripts[scriptName]
      const names = found
        ? [scriptName]
        : (scriptName === 'restart' ? defaultRestartNames.slice() : [])

      if (!/^(?:pre|post)/.test(scriptName)) {
        names.unshift(`pre${scriptName}`)
        names.push(`post${scriptName}`)
      }

      return names.reduce((accumulator, name) => {
        const source = this.scripts[name]

        if (source) {
          const interpolatedSource = interpolateScriptSource(source)

          if (name === scriptName) {
            accumulator[name] = this.appendUnscannedArguments(interpolatedSource)
          } else {
            accumulator[name] = interpolatedSource
          }
        }

        return accumulator
      }, {})
    }
  }

  findScripts() {
    try {
      process.chdir(this.moduleRoot)
    } catch (error) {
      process.chdir(this.initialDirectory)
      this.emit('error', `${this.appName}: Could not change to ${this.moduleRoot} starting from ${this.wd}\n${error}`)
      return
    }

    this.package = ignoreModuleNotFound(path.join(this.moduleRoot, this.packageBasename))
    this.scripts = ignoreModuleNotFound(path.join(this.moduleRoot, this.scriptsBasename))

    if (this.package || this.scripts) {
      this.package = this.package || {}
      this.scripts = Object.assign(this.package.scripts || {}, this.scripts)

      const scriptName = this.scriptName
      if (scriptName && !this.scripts[scriptName]) {
        if (scriptName === 'env') {
          this.scripts.env = 'env'
        } else if (scriptName === 'start') {
          try {
            fs.statSync(path.join(this.moduleRoot, 'server.js'))
            this.scripts.start = 'node server.js'
          } catch (_) {
            // Ignore.
          }
        }
      }

      this.dotBin = path.join(this.moduleRoot, 'node_modules', '.bin')
      return
    }

    this.moduleRoot = this.moduleRoot.split(path.sep).slice(0, -1).join(path.sep)

    if (this.moduleRoot) {
      return this.findScripts()
    }

    process.chdir(this.initialDirectory)
    this.emit('error', `${this.appName}: Did not find ${this.packageBasename} or ${this.scriptsBasename} starting from ${this.wd}`)
  }

  run() {
    const runnableScripts = this.findRunnableScripts()

    if (!this.scripts) {
      return // Not found.
    }

    const scriptNames = Object.keys(runnableScripts)
    const nScripts = scriptNames.length

    if (nScripts === 0) {
      if (this.scriptName) {
        this.emit('error', `${this.appName}: ${this.moduleRoot}: Script ${this.scriptName} is not defined in ${this.packageBasename} or ${this.scriptsBasename}`)
      } else {
        this.emit('list', Object.assign(this.scripts))
      }
    } else {
      const scriptsPathname = path.join(this.moduleRoot, this.scriptsBasename)

      this.exportEnvironmentVariables()

      for (let i = 0, code, error, signal; i < nScripts && (!code && !error && !signal); ++i) {
        const name = scriptNames[i]
        const script = runnableScripts[name]
        const argv = name === this.scriptName ? this.unscannedArguments : []
        const spec = {
          wd: this.moduleRoot,
          name: this.package.name,
          version: this.package.version
        }

        env.npm_lifecycle_event = env.run_event = name

        if (typeof script === 'function') {
          spec.script =
          env.npm_lifecycle_script =
          env.run_script =
            `${name}(${argv.length ? quoteFunctionArguments(argv) : ''})`

          this.emit('run', spec)

          ;({error} = exec.js([scriptsPathname, name].concat(argv)))
        } else {
          spec.script =
          env.npm_lifecycle_script =
          env.run_script = script

          this.emit('run', spec)

          ;({error, signal, status: code} = exec.sh([script].concat(argv)))
        }

        if (error) {
          this.emit('error', error)
        } else if (code) {
          this.emit('exit', code)
        } else if (signal) {
          this.emit('signal', signal)
        }
      }
    }
  }
}

// -----------------------------------------------------------------------------
// Utilities

function escapeDoubleQuote(string) {
  return string.replace(/"/g, '\\"')
}

function envifyValue(key, value) {
  if (value != null) {
    if (value.constructor === Object) {
      for (const k in value) {
        envifyValue(`${key}_${k.replace(/[^a-zA-Z0-9_]/g, '_')}`, value[k])
      }
    } else if (value.constructor === Array) {
      for (let i = 0, n = value.length; i < n; ++i) {
        envifyValue(`${key}_${i}`, value[i])
      }
    } else {
      return env[key] = value
    }
  }
}

function ignoreModuleNotFound(pathname) {
  try {
    return require(pathname)
  } catch (error) {
    if (error.code !== 'MODULE_NOT_FOUND') {
      throw error
    }
  }
}

function interpolateScriptSource(source) {
  if (source && typeof source !== 'function') {
    if (expandableRegEx.test(source)) {
      return source.replace(expandableRegEx, 'run $1')
    }
  }

  return source
}

function quoteCommandArguments(args) {
  return `"${args.map(escapeDoubleQuote).join('" "')}"`
}

function quoteFunctionArguments(args) {
  return `"${args.map(escapeDoubleQuote).join('", "')}"`
}

// -----------------------------------------------------------------------------

module.exports = Runner
