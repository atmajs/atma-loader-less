[Less Compiler](http://lesscss.org) (Atma Plugin)
-----
[![Build Status](https://travis-ci.org/atmajs/atma-loader-less.png?branch=master)](https://travis-ci.org/atmajs/atma-loader-less)

The Plugin extends:
- [`IncludeJS`](https://github.com/atmajs/IncludeJS) with a custom loader
- [`atma-io`](https://github.com/atmajs/atma-io) with a custom middleware to read Less files
- [`atma-server`](https://github.com/atmajs/atma-server) and [`Atma Toolkit`](https://github.com/atmajs/Atma.Toolkit) with a `HTTPHandler` to serve compiled sources (with **sourceMap** support)



##### How to use

###### Embed into the Project

+ `atma plugin install atma-loader-less`
	
	This adds `atma-loader-less` npm dependency and the `package.json` would look like:
	```json
	{
		"dependency": {
			"atma-loader-less"
		},
		"atma": {
			"plugins": [
				"atma-loader-less"
			],
			"settings": {
				"less_loader": {
					"extension": "less"
				}
			}
		}
	}
	```
+ That's all. Now, you are ready to use 'dynamic stylesheets' in your project

##### Quick Try

+ install atma: `$ npm install atma -g`
+ install plugin: `$ atma plugin install atma-loader-less`
+ add `test.html` to the directory

    ```html
    <!DOCTYPE html>
    <link href='test.less' rel='stylesheet' />
    ```
+ add `test.less`
    
    ```css
    @color: green;
	body { background: @color; }
    ```
+ start the server: `$ atma server`
+ open the browser: `http://localhost:5777/test.html`



----
_(c) MIT License - Atma.js Project_