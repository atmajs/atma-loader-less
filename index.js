if (typeof include === 'undefined' ) 
	throw new Error('<atma-loader-less> should be loaded in `atma` environment');


include.exports = {
	
	/* >>> Atma.Toolkit (registered via server)*/
	register: function(rootConfig){},
	
	/* >>> Atma.Server */
	attach: function(app){
		_extensions.forEach(function(ext){
			var rgx = '((\\.EXT$)|(\\.EXT\\?))'.replace(/EXT/g, ext),
				rgx_map = '((\\.EXT\\.map$)|(\\.EXT\\.map\\?))'.replace(/EXT/g, ext);
			
			app.handlers.registerHandler(rgx, HttpHandler);
			app.handlers.registerHandler(rgx_map, HttpHandler);
		});
	}
};

var net = global.net;
var _extensions = [ 'less' ],
	_options = {};

(function(config){
	
	if (config == null) 
		return;
	
	var ext = config.$get('settings.less_loader.extension');
	if (ext == null)
		return;
	
	_extensions = Array.isArray(ext)
		?   ext
		: [ ext ]
		;
	
}(global.app && global.app.config));



/* ==== `io.File` extension */

(function(File){
	if (File == null)
		return;

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

}(global.io && global.io.File));


/* ==== `IncludeJS` extension */
(function(){
	include.cfg({
		loader: obj_createMany(_extensions, {
			
			process: function(source, resource){
				var compiled = less_compile(source, new net.Uri(resource.url));
				
				return compiled.content || compiled.error;
			}
		})
	});
}());

/* ==== Http */
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
			if (io.File.exists(path))
				file = new io.File(path);
		}
		
		if (file == null && config.base) {
			path =  net.Uri.combine(config.base, url);
			if (io.File.exists(path))
				file = new io.File(path);
		}
		
		if (file == null) {
			path =  net.Uri.combine(process.cwd(), url);
			if (io.File.exists(path))
				file = new io.File(path);
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