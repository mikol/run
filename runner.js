const {execSync, spawnSync} = require('child_process')
const EventEmitter = require('events')
const fs = require('fs')
const path = require('path')

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
      env.npm_package_gitHead = execSync("git log -1 --format='%H'", {
        stdio: ['ignore', 'pipe', 'ignore']
      })
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

  findScripts() {
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

      return this
    }

    this.moduleRoot = this.moduleRoot.split(path.sep).slice(0, -1).join(path.sep)

    if (this.moduleRoot) {
      return this.findScripts()
    }

    this.emit('error', `${appName}: Did not find ${this.packageBasename} or ${this.scriptsBasename} starting from ${this.cwd}`)
  }

  run() {
    const runnableScripts = this.findRunnableScripts()

    if (Object.keys(runnableScripts).length === 0) {
      if (this.scriptName) {
        this.emit('error', `${this.appName}: ${this.moduleRoot}: Script ${this.scriptName} is not defined in ${this.packageBasename} or ${this.scriptsBasename}`)
      } else {
        this.emit('list', Object.assign(this.scripts))
      }
    } else {
      this.exportEnvironmentVariables()
      process.chdir(this.moduleRoot)

      for (const name in runnableScripts) {
        const script = runnableScripts[name]

        env.npm_lifecycle_event = env.run_event = name

        const spec = {
          cwd: this.moduleRoot,
          name: this.package.name,
          version: this.package.version
        }

        if (typeof script === 'function') {
          const args = (name === this.scriptName && this.unscannedArguments.length > 0)
            ? quoteFunctionArguments(this.unscannedArguments)
            : ''

          spec.script = env.npm_lifecycle_script = env.run_script = `${name}(${args})`

          this.emit('run', spec)

          try {
            script.apply(null, args.split(/\s+/))
          } catch (error) {
            this.emit('error', error)
          }
        } else {
          spec.script = env.npm_lifecycle_script = env.run_script = `${script}`

          this.emit('run', spec)
          const {error, status} = spawnSync('sh', ['-c', `${script}`], {stdio: 'inherit'})

          if (error) {
            this.emit('error', error)
          }

          if (status) {
            this.emit('exit', status)
          }
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
