// run v0.0.5 (2018-02-25T02:46:59.077Z)
// https://github.com/mikol/run
// http://creativecommons.org/licenses/by-sa/4.0/

'use strict';

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

var inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};

var possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};

var _require = require('child_process');
var execSync = _require.execSync;

var EventEmitter = require('events');
var fs = require('fs');
var path = require('path');

var exec = require('./lib/exec');

var argv = process.argv;
var env = process.env;
var expandableRegEx = /\bnpm run\s+(\S+)\b/g;

var defaultEnvScript = 'env';
var defaultRestartNames = ['prestop', 'stop', 'poststop', 'prestart', 'start', 'poststart'];

var Runner = function (_EventEmitter) {
  inherits(Runner, _EventEmitter);
  createClass(Runner, null, [{
    key: 'defaults',
    value: function defaults$$1() {
      return {

        packageBasename: 'package.json',
        scriptsBasename: 'scripts.js',

        moduleRoot: env.INIT_CWD || process.cwd(),

        execPath: argv[1],
        appName: path.basename(argv[1]),
        scriptName: argv[2],
        unscannedArguments: function (x) {
          return ++x ? argv.slice(x) : [];
        }(argv.indexOf('--'))
      };
    }
  }]);

  function Runner() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    classCallCheck(this, Runner);

    var _this = possibleConstructorReturn(this, (Runner.__proto__ || Object.getPrototypeOf(Runner)).call(this));

    Object.assign(_this, Runner.defaults(), options);
    _this.wd = _this.moduleRoot;
    return _this;
  }

  createClass(Runner, [{
    key: 'appendUnscannedArguments',
    value: function appendUnscannedArguments(source) {
      var _this2 = this;

      if (source && this.unscannedArguments.length > 0) {
        if (typeof source === 'function') {
          return function () {
            return source.apply(null, _this2.unscannedArguments);
          };
        }

        return source + ' ' + quoteCommandArguments(this.unscannedArguments);
      }

      return source;
    }
  }, {
    key: 'exportEnvironmentVariables',
    value: function exportEnvironmentVariables() {
      env.NODE = env.npm_node_execpath = process.execPath;
      env.PATH = this.dotBin + ':' + env.PATH;
      env.run_execpath = this.execPath;

      var object = Object.assign(this.package);

      if (!object.scripts) {
        object.scripts = {};
      }

      if (!object.scripts.env) {
        object.scripts.env = defaultEnvScript;
      }

      try {
        env.npm_package_gitHead = execSync("git log -1 --format='%H'", {
          stdio: ['ignore', 'pipe', 'ignore']
        });
      } catch (_) {

      }

      for (var k in object) {
        envifyValue('npm_package_' + k, object[k]);
      }

      return this;
    }
  }, {
    key: 'findRunnableScripts',
    value: function findRunnableScripts() {
      var _this3 = this;

      this.findScripts();

      var scriptName = this.scriptName;
      var found = !!this.scripts[scriptName];
      var names = found ? [scriptName] : scriptName === 'restart' ? defaultRestartNames.slice() : [];

      if (!/^(?:pre|post)/.test(scriptName)) {
        names.unshift('pre' + scriptName);
        names.push('post' + scriptName);
      }

      return names.reduce(function (accumulator, name) {
        var source = _this3.scripts[name];

        if (source) {
          var interpolatedSource = interpolateScriptSource(source);

          if (name === scriptName) {
            accumulator[name] = _this3.appendUnscannedArguments(interpolatedSource);
          } else {
            accumulator[name] = interpolatedSource;
          }
        }

        return accumulator;
      }, {});
    }
  }, {
    key: 'findScripts',
    value: function findScripts() {
      this.package = ignoreModuleNotFound(path.join(this.moduleRoot, this.packageBasename));
      this.scripts = ignoreModuleNotFound(path.join(this.moduleRoot, this.scriptsBasename));

      if (this.package || this.scripts) {
        this.package = this.package || {};
        this.scripts = Object.assign(this.package.scripts || {}, this.scripts);

        var scriptName = this.scriptName;
        if (scriptName && !this.scripts[scriptName]) {
          if (scriptName === 'env') {
            this.scripts.env = 'env';
          } else if (scriptName === 'start') {
            try {
              fs.statSync(path.join(this.moduleRoot, 'server.js'));
              this.scripts.start = 'node server.js';
            } catch (_) {

            }
          }
        }

        this.dotBin = path.join(this.moduleRoot, 'node_modules', '.bin');

        return this;
      }

      this.moduleRoot = this.moduleRoot.split(path.sep).slice(0, -1).join(path.sep);

      if (this.moduleRoot) {
        return this.findScripts();
      }

      this.emit('error', this.appName + ': Did not find ' + this.packageBasename + ' or ' + this.scriptsBasename + ' starting from ' + this.wd);
    }
  }, {
    key: 'run',
    value: function run() {
      var runnableScripts = this.findRunnableScripts();
      var scriptNames = Object.keys(runnableScripts);
      var nScripts = scriptNames.length;

      if (nScripts === 0) {
        if (this.scriptName) {
          this.emit('error', this.appName + ': ' + this.moduleRoot + ': Script ' + this.scriptName + ' is not defined in ' + this.packageBasename + ' or ' + this.scriptsBasename);
        } else {
          this.emit('list', Object.assign(this.scripts));
        }
      } else {
        var scriptsPathname = path.join(this.moduleRoot, this.scriptsBasename);
        var self = this;

        var index = 0;

        this.exportEnvironmentVariables();
        process.chdir(this.moduleRoot);(function next() {
          if (index < nScripts) {
            var name = scriptNames[index];
            var script = runnableScripts[name];

            env.npm_lifecycle_event = env.run_event = name;

            var spec = {
              wd: self.moduleRoot,
              name: self.package.name,
              version: self.package.version
            };

            new Promise(function (resolve, reject) {
              var argv = name === self.scriptName ? self.unscannedArguments : [];

              if (typeof script === 'function') {
                spec.script = env.npm_lifecycle_script = env.run_script = name + '(' + (argv.length ? quoteFunctionArguments(argv) : '') + ')';

                self.emit('run', spec);
                exec.js([scriptsPathname, name].concat(argv), resolve, reject);
              } else {
                spec.script = env.npm_lifecycle_script = env.run_script = script;

                self.emit('run', spec);
                exec.sh([script].concat(argv), resolve, reject);
              }
            }).then(function () {
              ++index;
              next();
            }).catch(function (reason) {
              if (reason.code) {
                self.emit('exit', reason.code);
              } else if (reason.error) {
                self.emit('error', reason.error);
              } else if (reason.signal) {
                self.emit('signal', reason.signal);
              } else {
                throw reason;
              }
            });
          }
        })();
      }
    }
  }]);
  return Runner;
}(EventEmitter);

function escapeDoubleQuote(string) {
  return string.replace(/"/g, '\\"');
}

function envifyValue(key, value) {
  if (value != null) {
    if (value.constructor === Object) {
      for (var k in value) {
        envifyValue(key + '_' + k.replace(/[^a-zA-Z0-9_]/g, '_'), value[k]);
      }
    } else if (value.constructor === Array) {
      for (var i = 0, n = value.length; i < n; ++i) {
        envifyValue(key + '_' + i, value[i]);
      }
    } else {
      return env[key] = value;
    }
  }
}

function ignoreModuleNotFound(pathname) {
  try {
    return require(pathname);
  } catch (error) {
    if (error.code !== 'MODULE_NOT_FOUND') {
      throw error;
    }
  }
}

function interpolateScriptSource(source) {
  if (source && typeof source !== 'function') {
    if (expandableRegEx.test(source)) {
      return source.replace(expandableRegEx, 'run $1');
    }
  }

  return source;
}

function quoteCommandArguments(args) {
  return '"' + args.map(escapeDoubleQuote).join('" "') + '"';
}

function quoteFunctionArguments(args) {
  return '"' + args.map(escapeDoubleQuote).join('", "') + '"';
}

module.exports = Runner;
