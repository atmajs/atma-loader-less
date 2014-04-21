if (typeof include === 'undefined' ) 
	throw new Error('<atma-loader-less> should be loaded in `atma` environment');

var _extensions = [ 'less' ],
	_options = {}
	;
var config = global.app && global.app.config;
if (config){
	
	var ext = config.$get('settings.less_loader.extension');
	if (ext) {
		_extensions = Array.isArray(ext)
			? ext
			: [ ext ]
			;
	}
}



/* >>> `io.File` extension */
var net = global.net,
	File = global.io.File;
if (File) {
	File.middleware['atma-loader-less'] = function(file){
			
		if (typeof file.content !== 'string')
			file.content = file.content.toString();
		
		var compiled = less_compile(file.content, file.uri);
		
		file.error = compiled.error;
		file.sourceMap = compiled.sourceMap;
		file.content = compiled.content || compiled.error;
		
	};
	
	
	File
		.registerExtensions(obj_createMany(_extensions, [ 'atma-loader-less:read' ]));
}

/* >>> `IncludeJS` extension */
include.cfg({
	loader: obj_createMany(_extensions, {
		
		process: function(source, resource){
			var compiled = less_compile(source, new net.Uri(resource.url));
			
			return compiled.content || compiled.error;
		}
	})
});

/* >>> Http */
var HttpHandler = Class({
	Base: Class.Deferred,
	process: function(req, res, config){
		
		var url = req.url,
			isSourceMap = url.substr(-4) === '.map';

		if (isSourceMap) 
			url = url.substring(0, url.length - 4);
			
		if (url[0] === '/') 
			url = url.substring(1);
		
		var file, path;
		if (config.static) {
			path =  net.Uri.combine(config.static, url);
			if (File.exists(path))
				file = new File(path);
		}
		
		if (file == null && config.base) {
			path =  net.Uri.combine(config.base, url);
			if (File.exists(path))
				file = new File(path);
		}
		
		if (file == null) {
			path =  net.Uri.combine(process.cwd(), url);
			if (File.exists(path))
				file = new File(path);
		}
		
		if (file == null) {
			this.reject('Not Found - ' + url, 404, 'plain/text');
			return;
		}
		
		
		file.read();
		
		var source = isSourceMap
			? file.sourceMap
			: file.content;
			
		var mimeType = isSourceMap
			? 'application/json'
			: 'text/css'
			;
			
		this.resolve(source, 200, mimeType);
	}
});

include.exports = {
	
	/* >>> Atma.Toolkit */
	register: function(rootConfig){
		
		var handlers = {};
		_extensions.forEach(function(ext){
			handlers['(\\.' + ext + '$)'] = HttpHandler;	
			handlers['(\\.' + ext + '\\.map$)'] = HttpHandler;
		});
		
		rootConfig.$extend({
			
			server: {
				handlers: handlers
			}
		});
	},
	
	/* >>> Atma.Server */
	attach: function(app){
		_extensions.forEach(function(ext){
			app.handlers.registerHandler('(\\.' + ext + '$)', HttpHandler);
			app.handlers.registerHandler('(\\.' + ext + '\\.map$)', HttpHandler);
		});
	}
};



var less_compile;
(function(){
	var _less;
	
	less_compile = function(source, uri){
		if (_less == null)
			_less = require('less');
			
		var filename = uri.toLocalFile(),
			parser = new _less.Parser({
					syncImport: true,
					filename: filename,
					paths: [ uri.toLocalDir() ]
				}),
				css;
        
		var out = {
			error: null,
			content: null,
			sourceMap: null
		};
		
		parser.parse(source, function(error, tree) {
			if (error) {
				logger.error('<less parser %s>', filename, error);
				
				out.error = error_format(error);
				return;
			}
			try {
				out.content = tree.toCSS({ 
					
					sourceMap: true,
					sourceMapURL: uri.file + '.map',
					sourceMapRootpath: 'file:///',
					outputSourceFiles: true,
					writeSourceMap: function(sourceMap){
						out.sourceMap = sourceMap;
					}
				});
			
			} catch (error) {
				out.error = error_format(error);
				logger.error('<less builder %s>', filename, error);
			}
		});
		return out;
	};
	
	
	function error_format(error) {
		return error.message
			+ '\n\tat ('
			+ error.filename
			+ ':'
			+ error.line
			+ error.column
			+ ')';
	}
}());

function obj_createMany(properties, value){
	var obj = {};
	properties.forEach(function(prop){
		obj[prop] = value;
	});
	
	return obj;
}

function obj_setProperty(obj, prop, value){
	obj[prop] = value;
	return obj;
}

function obj_extend(target){
	var imax = arguments.length,
		i = 1,
		obj;
	for(; i < imax; i++){
		obj = arguments[0];
		
		for(var key in obj)
			target[key] = obj[key]
	}

	return target;
}