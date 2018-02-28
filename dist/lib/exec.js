// run v0.0.7 (2018-02-28T07:50:26.038Z)
// https://github.com/mikol/run
// http://creativecommons.org/licenses/by-sa/4.0/

'use strict';

var _require = require('child_process');
var spawnSync = _require.spawnSync;

var _require2 = require('fs');
var readFileSync = _require2.readFileSync;

var _require3 = require('vm');
var Script = _require3.Script;

var script = void 0;

function js(argv) {
  try {
    if (!script) {
      var filename = argv[0];
      var source = '((r, s, a) => r(\'' + filename + '\')[s].apply(null, a))';

      script = new Script(source, { filename: filename });
    }

    script.runInThisContext()(require, argv[1], argv.slice(2));
    return {};
  } catch (error) {
    return { error: error };
  }
}

function sh(argv) {
  return spawnSync('sh', ['-c'].concat(argv), { stdio: 'inherit' });
}

module.exports = { js: js, sh: sh };
