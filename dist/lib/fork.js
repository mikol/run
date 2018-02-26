// run v0.0.7 (2018-02-26T08:55:51.096Z)
// https://github.com/mikol/run
// http://creativecommons.org/licenses/by-sa/4.0/

'use strict';

var pathname = process.argv[2];
var scriptName = process.argv[3];
var argv = process.argv.slice(4);

require(pathname)[scriptName].apply(null, argv);
