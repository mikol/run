# 0.0.1 Initial implementation

  * Core compatibility with `npm run-script <command> [-- <args>...]`
  * Define scripts using JavaScript in `scripts.js`
  * Use plain-old JavaScript function references as scripts
  * Minimal unit tests

# 0.0.2 Module implementation

  * Extends EventEmitter, which can be used like so:

    ```js
    const Runner = require('run')
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
