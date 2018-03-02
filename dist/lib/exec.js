// run v0.0.8 (2018-03-02T09:29:02.474Z)
// https://github.com/mikol/run
// http://creativecommons.org/licenses/by-sa/4.0/

'use strict';

var _require = require('child_process');
var spawnSync = _require.spawnSync;

var _require2 = require('vm');
var Script = _require2.Script;

var script = void 0;

function js(argv) {
  try {
    if (!script) {
      var filename = argv[0];
      var source = '((r,s,a,m)=>{m=r(\'' + filename + '\');m[s].apply(m,a)})';

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
