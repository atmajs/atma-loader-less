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
				
			var css, parser;
			var base = options && options.base || '/';

			if (base[0] === '/') {
				base = net.Uri.combine(process.cwd(), base);
			}

			paths.push(new net.Uri(base).toLocalDir());
			
			
			
			var options = {
				async: false,
				syncImport: true,
				
				sourceMap: true,
				sourceMapURL: uri.file + '.map',
				sourceMapRootpath: 'file:///',
				outputSourceFiles: true,

				filename: path,
				paths: paths
			}

			_Less.render(source, options, function (error, data) {
				if (error) {
					out.content = out.error = error;
					return;
				}
				out.content = data.css;
				out.sourceMap = data.map;
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