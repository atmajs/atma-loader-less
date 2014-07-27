
module.exports = {
	'settings': {
		io: {
			extensions: {
				js: ['condcomments:read', 'importer:read']
			}
		}
	},
	'process': {
		action: 'import',
		files: 'src/index.js',
		output: '/'
	},
	'uglify': {
		files: 'index.js',
		output: 'index.js',
		defines: {
			DEBUG: false
		}
	},
	
	'defaults': ['process'],
	'full': [
		'import',
		'process',
		'export'
	],
	
	'import': {
		action: 'copy',
		files: {
			'../loaders/atma-loader/index.js':
				'node_modules/atma-loader/index.js'
		}
	},
	'export': {
		action: 'copy',
		files: {
			'index.js':
				'test/node_modules/atma-loader-traceur/index.js'
		}
	},
	
	
};