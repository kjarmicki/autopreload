# What is autopreload.js?

This small utility is designed to automatically preload images from your CSS stylesheets.


## Problem

Consider following rules:

 ```css
.link {
	background: url(image.png) center center no-repeat;
}

.link:hover {
	background-image: url(image-hover.png);
}
 ```

If user the does not have `image-hover.png` cached, the browser will make an HTTP request to the server to grab that image. Visual result of this is unpleasant flicker effect - while `image-hover.png` is loading, the background will disappear entirely. Most of the time it looks awful.


## Solutions

The are multiple ways you could approach this problem, for example by using sprites, hidden elements, or preloading images with simple JavaScript like:

 ```javascript
var	preload = ['image-hover.png', 'other-image-hover.png'],
	loading = [],
	i;

for(i = 0; i < preload.length; i++) {
	loading[i] = document.createElement('img');
	loading[i].src = 'http://my-website/images/' + preload[i];
}
 ```

They're all fine, except for one thing: they require extra work. Each time you introduce new image you have to include it in spritesheet (and use correct positioning), hidden element or preload array.


## Introducing autopreload.js

With autopreload.js you can just write your stylesheets like the problem didn't exist, and it will automatically find images that should be preloaded based on pseudoclasses (`:hover`, `:active`, `:checked`, `:focus`).


### Usage

Include `autopreload.min.js` in your page source and then in your code call `autopreload.run();` whenever you'd like to start preloading your images. Probably the best time to do it is when window is loaded entirely, that way you won't clog up the browser with all those images before those that need to be shown immediately finished loading:

 ```javascript
window.addEventListener('load', function() {
	autopreload.run();
}, false);
 ```

 
#### Adding images

Sometimes you'll have backgrounds that won't be shown on :hover or any other CSS event, but you'd like to preload them anyway. Let's say that you have warning box with icon that is shown after failed validation:

```css
.box {
	background: blue;
}

.box.warning {
	background: red url(warning.png) top left no-repeat;
}
 ```
Autopreload.js won't load this image by deafult, but you can specify additional images with chainable `.addImages()` method. This method accepts single image as a string or multiple images as an array, for example:

 ```javascript
 autopreload.addImages(['warning.png', 'cool.png']).run();
 ```

Note that if an image of given name is not found in your stylesheet, it won't be loaded.


#### Ignoring images

If for some reason you'd like to exclude images from preloading, you can do that with chainable `.ignoreImages()` method. This method accepts single image as a string or multiple images as an array, for example:

 ```javascript
autopreload.ignoreImages('image-hover.png').run();
 ```


#### Ignoring files

Just like with images, you can ignore whole CSS files with chainable `.ignoreFiles()` method. This method accepts single file as a string or multiple files as an array, for example:

 ```javascript
autopreload.ignoreFiles(['jquery-ui.css', 'tooltip.css']).run();
 ```


#### Returned values and onload event

`addImages`, `ignoreImages`, `ignoreFiles` and `onload` are chainable methods:

 ```javascript
autopreload.addImages(['warning.png', 'cool.png']).ignoreImages('image-hover.png').ignoreFiles(['jquery-ui.css', 'tooltip.css']).onload(function(imgs) {
	 console.log('loaded', imgs); 
}).run();
 ```

You can pass a single callback to `onload` method and it will be called when all the images finished loading, with references to those images in a first argument.

`run()` method also returns references to images, but this is done right away, when they did not finished loading.


### Browser support

This tool should work fine with IE8+ and current versions of Firefox, Chrome, Safari and Opera.

Keep in mind that there were no attempts to fix missing features in old browsers, so in IE8 media queries are entirely ignored. This can be fixed with other external libraries (like respond.js), but note that in general they load missing styles asynchronously, so you have to make sure you're calling `autopreload.run()` when all the additional stylesheets are loaded.
