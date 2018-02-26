# `run` Changelog

## 0.0.1 Initial implementation

  * Core compatibility with `npm run-script <command> [-- <args>...]`
  * Define scripts using JavaScript in `scripts.js`
  * Use plain-old JavaScript function references as scripts
  * Minimal unit tests

## 0.0.2 Module implementation

  * Extends EventEmitter, which can be used like so:

    ```js
    const Runner = require('run-simple')
    const runner = new Runner()

    runner.on('error', (error) => {
      console.error(error)
      process.exit(1)
    })

    runner.on('exit', (code) => {
      process.exit(code)
    })

    runner.on('list', (scripts) => {
      Object.keys(scripts).forEach((name) => console.log(`  ${name}:\n    ${scripts[name]}`))
      process.exit()
    })

    runner.on('run', (spec) => {
      console.log()
      console.log(`> ${spec.name}${spec.version ? `@${spec.version}` : ''} ${spec.cwd}`)
      console.log(`> ${spec.script}`)
      console.log()
    })

    runner.run()
    ```

  * Includes `@${version}` specified in `package.json` in script preambles

## 0.0.3 Initial npm release

## 0.0.4 Refactor executable and module

  * Split module into `runner.js`
  * Update docs and scripts accordingly
  * Drop plans for hooks scripts and prepending node path

### 0.0.5 Script name mangling correctness

  * Fall back to a default `start` script if and only if `server.js` exists
  * Check that `<command>` does not begin with `pre` or `post` before prefixing

### 0.0.6 Prepare for programmatic handling of stdio

  * Use `spawn()` to run shell scripts and `fork()` to run JS functions
  * Move `runner.js` into `lib` directory

### 0.0.7 Process command line arguments

  * Implement `--version`, `--help`, and `--quiet` (with `--silent` alias)
