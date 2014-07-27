(function(){
	
	var Loader;
	(function(module){
		//source /node_modules/atma-loader/index.js
		// should be used in DEV environment only. Compile es6 scripts for production afterwards.
		
		if (typeof include === 'undefined') 
			throw new Error('<atma-loader> should be loaded by the `atma` toolkit.');
		
		module.exports = {
			create: create
		};
		
		/**
		 *	data:
		 *		name:
		 *		options:
		 *			mimeType:
		 *			extensions:
		 *		sourceMapType: 'embedded|separate|none'
		 *
		 *	Compiler:
		 *		compile: function(source, filepath, config): { content, ?sourceMap}
		 *		?compileAsync: function(source, filepath, config, function(error, {content, ?sourceMap})):
		 */
		function create(data, Compiler, Loader){
			var name = data.name,
				options = getOptions(name, data.options)
				;
			
			create_IncludeLoader(name, options, Compiler, Loader);
			
			Compiler
				&& create_FileMiddleware(name, options, Compiler);
			Loader
				&& create_FileLoader(name, options, Loader);
			
			var HttpHandler = create_HttpHandler(name, options, Compiler);
			return {
				attach: function(app){
					options.extensions.forEach(function(ext){
						var rgx = '((\\.EXT$)|(\\.EXT\\?))'.replace(/EXT/g, ext),
							rgx_map = '((\\.EXT\\.map$)|(\\.EXT\\.map\\?))'.replace(/EXT/g, ext);
						
						app.handlers.registerHandler(rgx, HttpHandler);
						app.handlers.registerHandler(rgx_map, HttpHandler);
					});
				},
				register: function(rootConfig){}
			}
		}
		
		var net = global.net,
			File = global.io.File
			;
			
		function create_FileMiddleware(name, options, Compiler){
			var Middleware = File.middleware[name] = {
				read: function(file, config){
					ensureContent(file);
					
					var compiled = compile('compile', file, config);
					applyResult(file, compiled);
				}
			};
			if (Compiler.compileAsync) {
				Middleware.readAsync = function(file, config, done){
					ensureContent(file);
					compile('compileAsync', file, config, function(error, compiled){
						if (error) {
							done(error);
							return;
						}
						applyResult(file, compiled);
						done();
					});
				};
			}
			File.registerExtensions(createExtensionsMeta());
			
			// Virtual Map Files
			var SourceMapFile = Class({
				Base: File,
				Override: {
					read: function(opts){
						if (this.exists('mapOnly')) 
							return this.super(opts)
						
						var path = this.getSourcePath();
						if (path == null) 
							return null;
						
						var file = new File(path);
						file.read(opts);
						return (this.content = file.sourceMap);
					},
					readAsync: function(opts){
						if (this.exists('mapOnly')) 
							return this.super(opts)
						
						var path = this.getSourcePath();
						if (path == null) 
							return new Class.Deferred().reject({code: 404});
						
						var file = new File(path),
							self = this;
						
						return file
							.readAsync(opts)
							.pipe(function(){
								return (self.content = file.sourceMap);
							});
					},
					exists: function(check){
						if (this.super()) 
							return true;
						if (check === 'mapOnly') 
							return false;
						
						var path = this.getSourcePath();
						return path != null
							? File.exists(path)
							: false;
					}
				},
				getSourcePath: function(){
					var path = this.uri.toString(),
						source = path.replace(/\.map$/i, '');
					return path === source
						? null
						: source;
				}
			});
			
			var Factory = File.getFactory();
			options.extensions.forEach(function(ext){
				Factory.registerHandler(
					new RegExp('\\.' + ext + '.map$', 'i')
					, SourceMapFile
				);
			});
			
			function compile(method, file, config, cb){
				var source = file.content,
					path = file.uri.toString(),
					opts = obj_extend(null, options, config)
					;
				
				return Compiler[method](source, path, opts, cb)
			}
			function ensureContent(file){
				if (typeof file.content !== 'string')
					file.content = file.content.toString();
			}
			function applyResult(file, compiled){
				file.sourceMap = compiled.sourceMap;
				file.content = compiled.content;
			}
			function createExtensionsMeta(){
				return obj_createMany(options.extensions, [ name + ':read' ]);
			}
		}
		function create_FileLoader(name, options, Loader) {
			var read = Loader.load || function(path, options){
					throw Error('Sync read is not Supported');
				},
				readAsync = Loader.loadAsync || function(path, options, cb){
					cb(null, this.read(options));
				},
				readSourceMapAsync = Loader.loadSourceMapAsync
				;
				
			var Virtual = Class({
				exists: function(){
					return true;
				},
				existsAsync: function(cb){
					cb(null, true)
				},
				read: function(options){
					return this.content
						|| (this.content = read.call(this, options));
				},
				readAsync: function(options) {
					var dfr = new Class.Deferred(),
						self = this;
					if (self.content) 
						return dfr.resolve(self.content);
					
					readAsync.call(this, options, function(error, content){
						if (error) {
							dfr.reject(error);
							return;
						}
						dfr.resolve(self.content = content);
					});
					return dfr;
				},
				readSourceMapAsync: readSourceMapAsync == null ? null : function(options){
					var dfr = new Class.Deferred(),
						self = this;
					if (self.sourceMap) 
						return dfr.resolve(self.sourceMap);
					
					readSourceMapAsync.call(this, options, function(error, content){
						if (error) {
							dfr.reject(error);
							return;
						}
						dfr.resolve(self.sourceMap = sourceMap);
					});
					return dfr;
				},
				write: Loader.write  || function(){
					throw Error('Write is not supported')
				},
				writeAsync: Loader.writeAsync || function(){
					throw Error('Write is not supported')
				}
			});
			var Factory = File.getFactory();
			options.extensions.forEach(function(ext){
				Factory.registerHandler(
					new RegExp('\\.' + ext + '$', 'i')
					, Virtual
				);
			});
		}
		function create_IncludeLoader(name, options, Compiler, Loader){
			include.cfg({
				loader: obj_createMany(options.extensions, {
					load: Loader == null ? null : function(resource, cb){
						
						if (Loader.loadAsync) {
							Loader.loadAsync(resource.url, {}, function(err, content){
								cb(resource, content);
							});
							return;
						}
						cb(resource, Loader.load(resource.url));
					},
					process: function(source, resource){
						options = obj_extend({}, options);
						// source map for include in nodejs is not required
						options.sourceMap = false;
						return Compiler.compile(source, resource.url, options).content;
					}
				})
			});
		}
		function create_HttpHandler(name, options, Compiler){
			function try_createFile(base, url, onSuccess, onFailure) {
				var path = net.Uri.combine(base, url);
				File
					.existsAsync(path)
					.fail(onFailure)
					.done(function(exists){
						if (exists) 
							return onSuccess(new File(path));
						onFailure();
					});
			};
			function try_createFile_byConfig(config, property, url, onSuccess, onFailure){
				var base = config && config[property];
				if (base == null) {
					onFailure();
					return;
				}
				try_createFile(base, url, onSuccess, onFailure);
			}
			
			return Class({
				Base: Class.Deferred,
				process: function(req, res, config){
					var handler = this,
						url = req.url,
						q = req.url.indexOf('?');
					if (q !== -1) 
						url = url.substring(0, q);
					
					var isSourceMap = url.substr(-4) === '.map';
					if (isSourceMap) 
						url = url.substring(0, url.length - 4);
						
					if (url[0] === '/') 
						url = url.substring(1);
						
					options.base = config.base;
					
					try_createFile_byConfig(config, 'static', url, onSuccess, try_Base);
					
					function try_Base() {
						try_createFile_byConfig(config, 'base', url, onSuccess, try_Cwd);
					}
					function try_Cwd() {
						try_createFile(process.cwd(), url, onSuccess, onFailure);
					}
					function onFailure(){
						handler.resolve('Not Found - ' + url, 404, 'plain/text');
					}
					function onSuccess(file){
						var fn = file.readAsync;
						if (isSourceMap && file.readSourceMapAsync) 
							fn = file.readSourceMapAsync;
						
						fn
							.call(file)
							.fail(handler.rejectDelegate())
							.done(function(){
								var source = isSourceMap
									? file.sourceMap
									: file.content;
									
								var mimeType = isSourceMap
									? 'application/json'
									: (file.mimeType || options.mimeType)
									;
									
								handler.resolve(source, 200, mimeType);
							})
					}
				}
			})
		}
		
		
		function getOptions(loaderName, default_) {
			var options = global.app && app.config.$get('settings.' + loaderName);
			
			options = obj_extend(default_, options);
			if (typeof options.extensions === 'string') 
				options.extensions = [ options.extensions ];
			
			return options;
		}
		function obj_extend(obj, source) {
			if (obj == null) 
				obj = {};
			if (source == null) 
				return obj;
			for (var key in source) 
				obj[key] = source[key];
			return obj;
		}
		function obj_createMany(properties, value){
			var obj = {};
			properties.forEach(function(prop){
				obj[prop] = value;
			});
			
			return obj;
		}
		//end:source /node_modules/atma-loader/index.js
	}(Loader = {}));
	
	var Compiler;
	(function(module){
		// source compiler.js
		(function(){
			var _Less;
			
			module.exports = {
				compile: function(source, path, options){
					if (_Less == null) {
						_Less = require('less');
					}
						
					var uri = new net.Uri(path),
						paths = [ uri.toLocalDir() ],
						out = {
							error: null,
							content: null,
							sourceMap: null
						};
						
					var base, css, parser;
					if (options && options.base) {
						base = options.base;
						if (base[0] === '/') {
							base = net.Uri.combine(process.cwd(), base);
						}
						paths.push(new net.Uri(base).toLocalDir());
					}
					
					parser = new _Less.Parser({
						syncImport: true,
						filename: path,
						paths: paths
					});
					
					parser.parse(source, function(error, tree) {
						if (error) {
							logger.error('<less parser %s>', path, error);
							
							out.content = out.error = error_format(error);
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
							out.content = out.error = error_format(error);
							logger.error('<less builder %s>', path, error);
						}
					});
					return out;
				}
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
		// end:source compiler.js
	}(Compiler = {}));
	
	(function(){
		
		include.exports = Loader.exports.create({
			name: 'atma-loader-less',
			options: {
				mimeType: 'text/css',
				extensions: [ 'less' ]
			},
		}, Compiler.exports)
		
	}());
	
}());