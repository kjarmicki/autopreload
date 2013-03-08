/*
 * autopreload.js v0.2
 *
 *
 * Purpose of this utility is to automatically preload images 
 * from css stylesheets in order to avoid unpleasant flicker effect.
 *
 * Krystian Jarmicki, 2013; Licensed MIT
 * @preserve
 */

;(function(win) {

	'use strict';

	// inject public interface into global object as autopreload
	win.autopreload = (function(win) {

		var _inner = {

			/* private properties */

			_states: [':hover', ':active', ':focus', ':checked'], // what element states are we searching for

			_sources: [], // found sources

			_images: [], // image elements

			_loaded: 0, // images loaded so far

			// management of user-defined images
			_userDefined: { 

				modify: function(topic, action, items) {
					var i;

					if(Object.prototype.toString.call(items) === '[object Array]') {
						for(i = 0; i < items.length; i++) {
							this.modify(topic, action, items[i]);
						}
					}
					else if(this[topic][action].indexOf(items) === -1) {
						this[topic][action].push(items);
					}
				},

				is: function(topic, action, item) {
					var i;

					for(i = 0; i < this[topic][action].length; i++) {
						if(this[topic][action][i] === item) {
							return true;	
						}
					}
					
					return false;

				},

				images: {
					add: [],
					ignore: []	
				},

				files: {
					ignore: []	
				}

			},

			_onload: null,

			// get css file directory for dealing with relative url() paths
			_getFileDir: function(path) { 
				
				var rev = path.split('').reverse().join('');
				
				if(rev.indexOf('/') > -1) {
					return rev.substr(rev.indexOf('/')).split('').reverse().join('');
				}
				else {
					return path;
				}
			},

			// return formatted absolute path for file
			_getFullPathSource: function(style, fileRoot) {

				var match;
			
				style = style.replace(/\"/g, '').replace('url(', '').replace(')', '');

				if(style.indexOf(fileRoot) !== 0) {
					if(style[0] === '/') {
						style = this._getFileDomain(fileRoot) + style;
					}
					else {
						match = style.match(/^(?:(ht|f)tp(s?)\:\/\/)?/g);
						if(!match || (match.length === 1 && !match[0])) {
							style = fileRoot + style;
						}
					}
						
				}


				return style;
			},

			// get filename from style
			_getFileName: function(style) {

				style = style.replace(/\"/g, '').replace('url(', '').replace(')', '');
				
				// if source contains path, get rid of a path
				if(style.indexOf('data:') !== 0 && style.indexOf('/') > -1) {
					style = style.split('').reverse().join('');
					style = style.substr(0, style.indexOf('/')).split('').reverse().join('');
				}

				return style;
			},

			// get domain and protocol from path
			_getFileDomain: function(path) {

				var protocol = path.match(/^(?:(ht|f)tp(s?)\:\/\/)?/g)[0];

				path = path.replace(protocol, '');
				path = path.substr(0, path.indexOf('/'));

				return protocol + path;
			},

			// recursively walk through document.styleSheets and it's subtrees
			_walkSubtree: function(node, fileRoot) {

				var i;

				if(node.cssRules || node.rules) { // node has rules, step into it
					this._walkSubtree(node.cssRules || node.rules, fileRoot);
				}
				else if(node.length) { // node is an array, spread inside it
					for(i = 0; i < node.length; i++) {
						this._walkSubtree(node[i], fileRoot);
					}
				}
				else if(node.selectorText) { // node has selectorText, search it for images
					this._extractUrls(node, fileRoot);
				}
			},

			// extract file urls from subtree
			_extractUrls: function(node, fileRoot) {

				var i,
					style,
					fullPath,
					fileName,
					checkUserAdded = false,
					searchCurrentNode = false;

				for(i = 0; i < this._states.length; i++) {
					if(node.selectorText.indexOf(this._states[i]) > -1) {
						searchCurrentNode = true;	
					}
				}
			
				// if there are user-defined images to be found, force search
				if(!searchCurrentNode && this._userDefined.images.add.length > 0) {
					searchCurrentNode = true;
					checkUserAdded = true;
				}

				if(searchCurrentNode) {

				
					// if there is a possibility to get straight to property value, try it	
					if(typeof node.style.getPropertyValue === 'function') {
						style = node.style.getPropertyValue('background-image');
						if(style) {
							fullPath = this._getFullPathSource(style, fileRoot);
							fileName = this._getFileName(style);
							if(
								this._sources.indexOf(fullPath) === -1 && 
								!this._userDefined.is('images', 'ignore', fileName) &&
								fileName.indexOf('data:') !== 0  &&
								((checkUserAdded) ? this._userDefined.is('images', 'add', fileName) : true)
							) {
								this._sources.push(fullPath);
							}
						}
					}
					// otherwise (yup, IE), iterate through properties until it's something that resembles background-image
					else {
						for(style in node.style) {
							if(
								node.style[style] && 
								typeof node.style[style] === 'string' && 
								node.style[style].indexOf('url(') === 0 && 
								node.style[style].indexOf(')') === node.style[style].length - 1
							) {
								fullPath = this._getFullPathSource(node.style[style], fileRoot);
								fileName = this._getFileName(node.style[style]);
								if(
									this._sources.indexOf(fullPath) === -1 &&
									!this._userDefined.is('images', 'ignore', fileName) &&
									fileName.indexOf('data:') !== 0 &&
									((checkUserAdded) ? this._userDefined.is('images', 'add', fileName) : true)
								) {
									this._sources.push(fullPath);
								}
							}
						}
					}
				}	

			},

			// gather sources from available stylesheets
			getSources: function() {

				var	i;

				this._sources.length = 0;

				for(i = 0; i < win.document.styleSheets.length; i++) {
					if(!this._userDefined.is('files', 'ignore', this._getFileName(win.document.styleSheets[i].href))) {
						this._walkSubtree(win.document.styleSheets[i], this._getFileDir(win.document.styleSheets[i].href));
					}
				}

				return this._sources;
			},

			// create image references and run onload callback
			_createImages: function() {

				var	that = this,
					i;

				this._images = [];
				this._loaded = 0;
				
				for(i = 0; i < this._sources.length; i++) {
					this._images[i] = win.document.createElement('img');
					this._images[i].onload = function() {
						if(++that._loaded === that._sources.length && typeof that._onload === 'function') {
							that._onload.call(that, that._images);
						}
					};
					this._images[i].src = this._sources[i];
				}

				return this._images;
				
			},


			/* public properties */

			// add image(s) to seek for 
			// chainable
			addImages: function(images) {
			
				this._userDefined.modify('images', 'add', images);

				return this;
			},

			// add image(s) to ignore 
			// chainable
			ignoreImages: function(images) {
			
				this._userDefined.modify('images', 'ignore', images);

				return this;
			},

			// add file(s) to ignore 
			// chainable
			ignoreFiles: function(files) {
				
				this._userDefined.modify('files', 'ignore', files);

				return this;
			},

			// main runner, performs search for images and loads them  
			// not chainable, inteded to call as a last method in chain
			run: function() {

				this.getSources();

				return this._createImages();
				
			},

			// event fired when all the images finished loading
			// chainable 
			// callback recieves array of preloaded image references
			onload: function(callback) {

				if(typeof callback === 'function') {
					this._onload = callback;	
				}

				return this;
			},

			// resets the internal state of utility
			// chainable
			reset: function() {

				var i;

				this._userDefined.images.add.length = this._userDefined.images.ignore.length = this._userDefined.files.ignore.length = this._sources.length = this._loaded = 0;
				for(i = 0; i < this._images.length; i++) {
					this._images[i].onload = function() { };
				}
				this._images = [];
				this._onload = null;

				return this;
			}

		};

		// mini-shims for crappy browsers, drop when Array.indexOf and Function.bind become safe to assume
		if(!Array.prototype.indexOf) {

			(function(_inner) {

				var toDecorate = [
						_inner._userDefined.images.add,
						_inner._userDefined.images.ignore,
						_inner._userDefined.files.ignore,
						_inner._sources		
					],
					i;
			
				for(i = 0; i < toDecorate.length; i++) {
					
					toDecorate[i].indexOf = function(value) {
				
						var i;
						for(i = 0; i < this.length; i++) {
							if(this[i] === value) {
								return value;	
							}
						}

						return -1;
					};
				}

			}(_inner));
		}

		var _bind = function() {

			var	args = Array.prototype.slice.call(arguments),
				func = args.shift(),
				ctx = args.shift();

			return function() {
				return func.apply(ctx, arguments);
			};	
		};



		// public interface
		return {
			run: _bind(_inner.run, _inner),
			getSources: _bind(_inner.getSources, _inner),
			addImages: _bind(_inner.addImages, _inner),
			ignoreImages: _bind(_inner.ignoreImages, _inner),
			ignoreFiles: _bind(_inner.ignoreFiles, _inner),
			onload: _bind(_inner.onload, _inner),
			reset: _bind(_inner.reset, _inner)
		};

	}(win));
	
}(this));
