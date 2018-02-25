// run v0.0.5 (2018-02-25T02:46:59.077Z)
// https://github.com/mikol/run
// http://creativecommons.org/licenses/by-sa/4.0/

'use strict';

var pathname = process.argv[2];
var scriptName = process.argv[3];
var argv = process.argv.slice(4);

require(pathname)[scriptName].apply(null, argv);
