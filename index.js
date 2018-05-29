
// source ./RootModule.js
(function(){
	
	var _src_compiler = {};

// source ./ModuleSimplified.js
var _src_compiler;
(function () {
	var exports = {};
	var module = { exports: exports };
	"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var less = require("less");
var atma_utils_1 = require("atma-utils");
function processFn(source, file, compiler) {
    var uri = file.uri, paths = [uri.toLocalDir()], out = {
        error: null,
        content: null,
        sourceMap: null
    };
    var css, parser;
    var base = compiler.getOption('base') || '/';
    if (base[0] === '/') {
        base = atma_utils_1.class_Uri.combine(process.cwd(), base);
    }
    paths.push(new atma_utils_1.class_Uri(base).toLocalDir());
    var options = {
        async: false,
        syncImport: true,
        sourceMap: {
            sourceMapURL: uri.file + '.map',
            sourceMapRootpath: 'file:///',
            outputSourceFiles: true,
        },
        filename: uri.toLocalFile(),
        paths: paths
    };
    less.render(source, options, function (error, data) {
        if (error) {
            out.content = out.error = error;
            return;
        }
        out.content = data.css;
        out.sourceMap = data.map;
    });
    return out;
}
exports.default = processFn;
function error_format(error) {
    return error.message
        + '\n\tat ('
        + error.filename
        + ':'
        + error.line
        + error.column
        + ')';
}
;

	function isObject(x) {
		return x != null && typeof x === 'object' && x.constructor === Object;
	}
	if (isObject(_src_compiler) && isObject(module.exports)) {
		Object.assign(_src_compiler, module.exports);
		return;
	}
	_src_compiler = module.exports;
}());
// end:source ./ModuleSimplified.js

"use strict";
var Base = require("atma-io-middleware-base");
var compiler_1 = _src_compiler;
module.exports = Base.create({
    name: 'atma-loader-less',
    textOnly: true,
    cacheable: true,
    defaultOptions: {
        mimeType: 'text/css',
        extensions: ['less'],
        base: '/',
        less: {}
    },
    process: compiler_1.default
});


}());
// end:source ./RootModule.js
