// run v0.0.5 (2018-02-25T02:46:59.077Z)
// https://github.com/mikol/run
// http://creativecommons.org/licenses/by-sa/4.0/

'use strict';

var _require = require('child_process');
var fork = _require.fork;
var spawn = _require.spawn;

var _require2 = require('os');
var signals = _require2.constants.signals;

var path = require('path');

var forkjs = path.join(__dirname, 'fork.js');

var child = null;

Object.keys(signals).forEach(function (signal) {
  // Ignore signals that can’t have a listener, can’t be sent, or that log warnings.
  if (!/^(?:SIGBREAK|SIGBUS|SIGCHLD|SIGFPE|SIGILL|SIGKILL|SIGPROF|SIGSEGV|SIGSTOP)$/.test(signal)) {
    process.on(signal, function () {
      if (child) {
        try {
          child.kill(signal);
        } catch (_) {
          // Ignore.
        }
      }
    });
  }
});

function on(resolve, reject, stdout, stderr) {
  child.once('error', function (error) {
    child = null;
    reject({ error: error });
  });

  child.once('exit', function (code, signal) {
    child = null;

    if (code) {
      return reject({ code: code });
    }

    if (signal) {
      return reject({ signal: signal });
    }

    resolve();
  });
}

function js(argv, resolve, reject) {
  child = fork(forkjs, argv, { stdio: 'inherit' });
  on(resolve, reject);
}

function sh(argv, resolve, reject) {
  child = spawn('sh', ['-c'].concat(argv), { stdio: 'inherit' });
  on(resolve, reject);
}

module.exports = { js: js, sh: sh };
