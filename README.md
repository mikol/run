# `run` – Simple development task automation

## Briefly

`run` is a simple, enhanced replacement for `npm run-script <command> [--
<args>...]` with zero third-party dependencies. If you already use `npm run`,
you can use `run` immediately. But `run` can do a bit more as well.

## Installation

```
npm install -g run-simple
```

## Usage

### Command Line

```
run [--version] [-h | --help] [-q | --quiet | -s | --silent] <command> [-- <args>...]
```

### Module

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
  console.log(`${runner.appName}: ${runner.moduleRoot} scripts:`)
  Object.keys(scripts).forEach((name) => console.log(`  ${name}:\n    ${scripts[name]}`))
  process.exit()
})

runner.on('run', (spec) => {
  console.log()
  console.log(`> ${spec.name}${spec.version ? `@${spec.version}` : ''} ${spec.wd}`)
  console.log(`> ${spec.script}`)
  console.log()
})

runner.run()
```

## Why not `npm run-script`?

Obviously, `npm` is a fine piece of software. And `npm run-script` (AKA `npm
run`) is [one of the simplest development automation tools
available](https://goo.gl/cuA7TD). I love it, and as a result, I have never
wanted to waste time learning more featureful alternatives like
[`gulp`](https://goo.gl/WLyxEK) or [`grunt`](https://goo.gl/g779Qk).

But… it could be better. One thing that `npm run` doesn’t support well is
[signal handling](https://goo.gl/w6eQze). When `npm run` executes scripts,
handling signals like `'SIGINT'` within the scripts themselves is unreliable at
best, which means a script that should clean up before exiting simply can’t. The
implications go beyond signal handling – scripts behave differently when `npm`
runs them than they do when they run by themselves. `npm run` just isn’t
satisfied to run something and then get out out of the way.

Which may explain why `npm run` [is verbose to a fault](https://goo.gl/CoFLVr).
`npm` has a lot more on its mind than just running your scripts so by default
you’re going to see more output than you really need. Sure, you can pass it
`--silent` or redirect output to `/dev/null`, but other people (your teammates
and mine, for example) will need to do the same or they’ll get a bunch of `npm`
disclaimer boilerplate when what they really want to see is what the script
itself did.

Finally, `package.json` is great for project configuration, but it’s a pretty
poor place to write scripts. There’s no way to comment or document your scripts.
And being forced to write everything on a single line either hinders readability
or forces artificial factoring of script logic.

## Why `run`?

Although `run` is quieter and will cede more control to scripts, it is designed
to work as much like `npm run` as possible. In fact, you can easily use it as if
it was nothing more than an alias for `npm run`; it’ll happily find and execute
all the scripts you have already defined in `package.json`.

But if you create a `scripts.js` file, `run` will look there for tasks as well.
Here’s what the `run` project’s own `scripts.js` looks like:

```js
const {
  binPathname
} = require('./scripts/vars')

module.exports = {
  // ---------------------------------------------------------------------------
  // Dist

  predist: `mkdir -p dist`,
  dist: 'rollup -c',
  postdist: `chmod 755 ${binPathname}`,
  watchdist: 'run dist -- --watch',

  // ---------------------------------------------------------------------------

  echo: console.log,

  // ---------------------------------------------------------------------------
  // Publish

  prepublish: 'run test',
  publish: 'npm publish',

  // ---------------------------------------------------------------------------
  // Test

  pretest: 'run dist',
  test: "mocha -s 400 test/init.js './test/*.test.js' './test/**/*.test.js'",
  watchtest: 'run test -- --watch'

  // ---------------------------------------------------------------------------
}
```

The first thing you’ll see is that `run` supports imports. Now you can share
modules between the code you build and the code that builds it.

Then there are comments and whitespace, which make automation tasks easier to
write, read, and maintain.

Finally, you might have noticed that the `echo` script is actually a plain-old
JavaScript function reference. Just like other scripts, functions will be passed
whatever arguments you define after the `--` in `run <command> [-- <args>...]`.

```
$ run echo -- Hello, World!

> echo /path/to/com/github/mikol/run
> echo("Hello,", "World!")

Hello, World!
```

Imagine that.

## Compatibility

### Environment Variables

#### `npm_package_*`

Because `npm_package_*` variables are useful to shell scripts that depend on
values stored in `package.json`, `run` will define most of them exactly as `npm`
does. However, there are a couple of exceptions.

Unlike, `npm run`, `run` will _not_ attempt to normalize `package.json` keys or
values. For example, `run` won’t produce the following environment variables
unless they are explicitly included in `package.json`:

  * `npm_package_bugs_url`
  * `npm_package_homepage`
  * `npm_package_readmeFilename`

Similarly, `run` does not transform values like `npm_package_repository_url`.

For a complete description of how `npm run` transforms `package.json`, see:
[npm/normalize-package-data](https://goo.gl/9H922P).

#### `npm_config_*`

In the interest of simplicity in both implementation and behavior, `run` does
not read `npm`’s configuration nor does it define `npm_config_*` variables.

#### Other `npm_*`

`run` defines a few miscellaneous `npm` environment variables as well:

  * `npm_execpath` (as `run_execpath` – `npm` isn’t running)
  * `npm_lifecycle_event`
  * `npm_lifecycle_script`
  * `npm_node_execpath`

## Credits

`run` was inspired in part by “[An alternative to npm
scripts](https://goo.gl/KLJjDC)” by [James Forbes](https://goo.gl/k3gQrG).
