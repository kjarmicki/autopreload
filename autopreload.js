/*
 * autopreload.js v0.1
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

			// management of user-defined selectors
			_userSelectors: { 

				modify: function(action, selector) {
					var i;

					if(Object.prototype.toString.call(selector) === '[object Array]') {
						for(i = 0; i < selector.length; i++) {
							this.modify(action, selector[i]);
						}
					}
					else if(this[action].indexOf('selector') === -1) {
						this[action].push(selector);
					}
				},

				add: [],

				ignore: []

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
			_fullPathSource: function(style, fileRoot) {
			
				style = style.replace(/\"/g, '');
				if(style.indexOf(fileRoot) === -1) {
					style = style.replace('url(', fileRoot).replace(')', '');
				}
				else {
					style = style.replace('url(', '').replace(')', '');
				}

				return style;
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
					foundSelector = false;

				// perform extraction only if current selector is not on ignore list
				if(this._userSelectors.ignore.indexOf(node.selectorText) === -1) {

					for(i = 0; i < this._states.length; i++) {
						if(node.selectorText.indexOf(this._states[i]) > -1) {
							foundSelector = true;	
						}
					}
				
					if(!foundSelector) {
						if(this._userSelectors.add.indexOf(node.selectorText) > -1) {
							foundSelector = true;	
						}						
					}

					if(foundSelector) {
					
						// if there is a possibility to get straight to property value, try it	
						if(typeof node.style.getPropertyValue === 'function') {
							style = node.style.getPropertyValue('background-image');
							if(style && this._sources.indexOf(this._fullPathSource(style, fileRoot)) === -1) {
								this._sources.push(this._fullPathSource(style, fileRoot));
							}
						}
						else {
							// otherwise (yup, IE), iterate through properties until it's something that resembles background-image
							for(style in node.style) {
								if(
									node.style[style] && 
									typeof node.style[style] === 'string' && 
									node.style[style].indexOf('url(') === 0 && 
									node.style[style].indexOf(')') === node.style[style].length - 1 && 
									this._sources.indexOf(this._fullPathSource(node.style[style], fileRoot)) === -1
								) {
									this._sources.push(this._fullPathSource(node.style[style], fileRoot));
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
					this._walkSubtree(win.document.styleSheets[i], this._getFileDir(win.document.styleSheets[i].href));
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

			// add selector(s) to seek for 
			// chainable
			add: function(selectors) {
			
				this._userSelectors.modify('add', selectors);

				return this;
			},

			// add selector(s) to ignore 
			// chainable
			ignore: function(selectors) {
			
				this._userSelectors.modify('ignore', selectors);

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

				this._userSelectors.add.length = this._userSelectors.ignore.length = this._sources.length = this._loaded = 0;
				this._images = [];
				this._onload = null;

				return this;
			}

		};

		// mini-shims for crappy browsers, drop when Array.indexOf and Function.bind become safe to assume
		if(!Array.prototype.indexOf) {
			
			_inner._userSelectors.add.indexOf = _inner._userSelectors.ignore.indexOf = _inner._sources.indexOf = function(value) {
				
				var i;
				for(i = 0; i < this.length; i++) {
					if(this[i] === value) {
						return value;	
					}
				}

				return -1;
			};
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
			add: _bind(_inner.add, _inner),
			ignore: _bind(_inner.ignore, _inner),
			onload: _bind(_inner.onload, _inner),
			reset: _bind(_inner.reset, _inner)
		};

	}(win));
	
}(this));
