// run v0.1.0 (2018-03-10T20:39:59.807Z)
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

var slicedToArray = function () {
  function sliceIterator(arr, i) {
    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;

    try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);

        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"]) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  return function (arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError("Invalid attempt to destructure non-iterable instance");
    }
  };
}();

var argumentRegExp = /^(-{0,2})(?:([^-].*?)(?:=(.*))?)?$/;
var booleanTrueRegExp = /^(?:true|1)$/i;
var decimalRegExp = /^[-+]?(?:(?:(?:0|[1-9][0-9]*)(?:\.[0-9]*)?)|(?:\.[0-9]*))(?:[eE][-+]?[0-9]+)?$/;
var hexidecimalRegExp = /^0x[0-9a-f]+$/;
var negationRegExp = /^no-([^-].*)$/;

var ArgvParser = function () {
  function ArgvParser(input) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    classCallCheck(this, ArgvParser);

    var aliases = { '-': '-', '--': '--' };

    if (options.aliases) {
      for (var key in options.aliases) {
        aliases[key] = key;

        var x = options.aliases[key];

        if (Array.isArray(x)) {
          for (var i = 0, ni = x.length; i < ni; ++i) {
            aliases[x[i]] = key;
          }
        } else {
          aliases[x] = key;
        }
      }
    }

    this.aliases = aliases;
    this.cache = [];
    this.defaults = options.defaults;
    this.validate = options.validate ? function (k, v) {
      return options.validate(k, v);
    } : function () {
      return true;
    };
    this.input = input;
    this.output = Object.assign({ '': [], '-': false, '--': [] }, this.defaults);
  }

  createClass(ArgvParser, [{
    key: 'isBoolean',
    value: function isBoolean(key) {
      return typeof this.defaults[key] === 'boolean';
    }
  }, {
    key: 'isString',
    value: function isString(key) {
      return typeof this.defaults[key] === 'string';
    }
  }, {
    key: 'parseKey',
    value: function parseKey(key) {
      var k = (negationRegExp.exec(key) || [, key])[1];
      if (k in this.aliases) {
        return this.aliases[k];
      }

      return key;
    }
  }, {
    key: 'parseValue',
    value: function parseValue(key, value, isBoolean) {
      if (this.isBoolean(key)) {
        return booleanTrueRegExp.test(value);
      }

      if (this.isString(key)) {
        return value;
      }

      if (decimalRegExp.test(value) || hexidecimalRegExp.test(value)) {
        return Number(value);
      }

      return isBoolean ? true : value;
    }
  }, {
    key: 'set',
    value: function set$$1(index, hyphen, key, value) {
      var input = this.input;
      var n = input.length;
      var next = this.parseInput(index + 1);
      var output = this.output;

      if (!hyphen && key) {
        output[''].push(key);
        return index;
      }

      if (hyphen === '-' && key.length > 1) {
        var ni = key.length - 1;
        var i = 0;

        for (; i < ni; ++i) {
          var k = this.parseKey(key[i]);
          var v = key.slice(i + 1);
          var p = this.parseValue(k, v, true);

          if (this.validate(k, p)) {
            output[k] = p;
            if (typeof v === 'number') {
              i = -1;
              break;
            }
          }
        }

        if (i > -1) {
          this.set(index, hyphen, key[i], value);
        }

        return index;
      }

      if (hyphen === '-' || hyphen === '--') {
        if (key) {
          var _k = this.parseKey(key);
          var isBoolean = this.isBoolean(_k) || !!next.hyphen;
          var _i = value != null || isBoolean ? index : index + 1;
          var _v = value != null ? value : isBoolean ? true : next.key;

          if (this.validate(_k, _v)) {
            this.output[_k] = this.parseValue(_k, _v);
            return _i;
          }

          return index;
        }

        if (hyphen === '--') {
          for (var _i2 = index + 1; _i2 < n; ++_i2) {
            output['--'].push(input[_i2]);
          }

          return n;
        }

        if (hyphen === '-') {
          output['-'] = true;
          return index;
        }
      }

      throw Error('Unexpected: ' + input[index]);
    }
  }, {
    key: 'parseInput',
    value: function parseInput(index) {
      var cached = this.cache[index];
      if (!cached) {
        var _argumentRegExp$exec = argumentRegExp.exec(this.input[index]),
            _argumentRegExp$exec2 = slicedToArray(_argumentRegExp$exec, 4),
            hyphen = _argumentRegExp$exec2[1],
            key = _argumentRegExp$exec2[2],
            value = _argumentRegExp$exec2[3];

        return this.cache[index] = { hyphen: hyphen, key: key, value: value };
      }

      return cached;
    }
  }, {
    key: 'parse',
    value: function parse() {
      for (var index = 0, n = this.input.length; index < n; ++index) {
        var _parseInput = this.parseInput(index),
            hyphen = _parseInput.hyphen,
            key = _parseInput.key,
            value = _parseInput.value;

        index = this.set(index, hyphen, key, value);
      }

      return this.output;
    }
  }]);
  return ArgvParser;
}();

module.exports = ArgvParser;
