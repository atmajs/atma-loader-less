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