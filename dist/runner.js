// run v0.0.5 (2018-02-19T08:38:04.018Z)
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
var spawnSync = _require.spawnSync;

var EventEmitter = require('events');
var fs = require('fs');
var path = require('path');

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

      this.emit('error', appName + ': Did not find ' + this.packageBasename + ' or ' + this.scriptsBasename + ' starting from ' + this.cwd);
    }
  }, {
    key: 'run',
    value: function run() {
      var runnableScripts = this.findRunnableScripts();

      if (Object.keys(runnableScripts).length === 0) {
        if (this.scriptName) {
          this.emit('error', this.appName + ': ' + this.moduleRoot + ': Script ' + this.scriptName + ' is not defined in ' + this.packageBasename + ' or ' + this.scriptsBasename);
        } else {
          this.emit('list', Object.assign(this.scripts));
        }
      } else {
        this.exportEnvironmentVariables();
        process.chdir(this.moduleRoot);

        for (var name in runnableScripts) {
          var script = runnableScripts[name];

          env.npm_lifecycle_event = env.run_event = name;

          var spec = {
            cwd: this.moduleRoot,
            name: this.package.name,
            version: this.package.version
          };

          if (typeof script === 'function') {
            var args = name === this.scriptName && this.unscannedArguments.length > 0 ? quoteFunctionArguments(this.unscannedArguments) : '';

            spec.script = env.npm_lifecycle_script = env.run_script = name + '(' + args + ')';

            this.emit('run', spec);

            try {
              script.apply(null, args.split(/\s+/));
            } catch (error) {
              this.emit('error', error);
            }
          } else {
            spec.script = env.npm_lifecycle_script = env.run_script = '' + script;

            this.emit('run', spec);

            var _spawnSync = spawnSync('sh', ['-c', '' + script], { stdio: 'inherit' }),
                error = _spawnSync.error,
                status = _spawnSync.status;

            if (error) {
              this.emit('error', error);
            }

            if (status) {
              this.emit('exit', status);
            }
          }
        }
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
