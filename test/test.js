;(function(win) {

	'use strict';

	var	qunit = win.QUnit,
		resourcesRoot = win.location.protocol + '//' + win.location.hostname + win.location.pathname + 'test-resources/';

	qunit.testDone(function() {
		win.autopreload.reset();
	});

	qunit.test('basic usage', function() {

		var	images,
			expected = [
				'image-1.png',
				'image-2.png',
				'image-3.png',
				'image-4.png',
				'image-5.png',
				'image-6.png',
				'image-7.png',
				'image-8.png',
				'image-10.png',
				'image-11.png',
				'image-12.png',
				'image-13.png',
				'image-17.png',
				'image-18.png'
			],
			i;
	
		images = win.autopreload.run();

		qunit.strictEqual(Object.prototype.toString.call(images), '[object Array]', 'preload list exists and is an array');
		qunit.strictEqual(images.length, expected.length, 'expected images to preload number and actually preloaded match');
		for(i = 0; i < expected.length; i++) {
			qunit.strictEqual(images[i].tagName.toLowerCase(), 'img', 'item ' + i + ' is an image');
			qunit.strictEqual(images[i].src, resourcesRoot + expected[i], 'image ' + expected[i] + ' set properly');
		}
		
	});


	qunit.test('adding images', function() {

		var	images,
			expected = [
				'image-1.png',
				'image-2.png',
				'image-3.png',
				'image-4.png',
				'image-5.png',
				'image-6.png',
				'image-7.png',
				'image-8.png',
				'image-10.png',
				'image-11.png',
				'image-12.png',
				'image-13.png',
				'image-14.png',
				'image-15.png',
				'image-16.png',
				'image-17.png',
				'image-18.png'
			],
			i;

		images = win.autopreload.addImages('image-14.png').addImages(['image-15.png', 'image-16.png']).run();

		qunit.strictEqual(Object.prototype.toString.call(images), '[object Array]', 'preload list exists and is an array');
		qunit.strictEqual(images.length, expected.length, 'expected images to preload number and actually preloaded match');
		for(i = 0; i < expected.length; i++) {
			qunit.strictEqual(images[i].tagName.toLowerCase(), 'img', 'item ' + i + ' is an image');
			qunit.strictEqual(images[i].src, resourcesRoot + expected[i], 'image ' + expected[i] + ' set properly');
		}
		
	});

	
	qunit.test('ignoring images', function() {
		
		var	images,
			expected = [
				'image-1.png',
				'image-2.png',
				'image-3.png',
				'image-4.png',
				'image-5.png',
				'image-6.png',
				'image-7.png',
				'image-8.png',
				'image-17.png',
				'image-18.png'
			],
			i;

		images = win.autopreload.ignoreImages('image-10.png').ignoreImages(['image-11.png', 'image-12.png', 'image-13.png']).run();

		qunit.strictEqual(Object.prototype.toString.call(images), '[object Array]', 'preload list exists and is an array');
		qunit.strictEqual(images.length, expected.length, 'expected images to preload number and actually preloaded match');
		for(i = 0; i < expected.length; i++) {
			qunit.strictEqual(images[i].tagName.toLowerCase(), 'img', 'item ' + i + ' is an image');
			qunit.strictEqual(images[i].src, resourcesRoot + expected[i], 'image ' + expected[i] + ' set properly');
		}	
	});

	qunit.test('ignoring files', function() {
		
		var	images,
			expected = [
				'image-18.png'
			],
			i;

		images = win.autopreload.ignoreFiles('styles.css').run();

		qunit.strictEqual(Object.prototype.toString.call(images), '[object Array]', 'preload list exists and is an array');
		qunit.strictEqual(images.length, expected.length, 'expected images to preload number and actually preloaded match');
		for(i = 0; i < expected.length; i++) {
			qunit.strictEqual(images[i].tagName.toLowerCase(), 'img', 'item ' + i + ' is an image');
			qunit.strictEqual(images[i].src, resourcesRoot + expected[i], 'image ' + expected[i] + ' set properly');
		}	
	});

	qunit.test('onload event', function() {

		var	expected = [
				'image-1.png',
				'image-2.png',
				'image-3.png',
				'image-4.png',
				'image-5.png',
				'image-6.png',
				'image-7.png',
				'image-8.png',
				'image-10.png',
				'image-11.png',
				'image-12.png',
				'image-13.png',
				'image-17.png',
				'image-18.png'
			],
			i;

		qunit.stop();
	
		win.autopreload.onload(function(images) {
			
			qunit.strictEqual(Object.prototype.toString.call(images), '[object Array]', 'preload list exists and is an array');
			qunit.strictEqual(images.length, expected.length, 'expected images to preload number and actually preloaded match');
			for(i = 0; i < expected.length; i++) {
				qunit.strictEqual(images[i].tagName.toLowerCase(), 'img', 'item ' + i + ' is an image');
				qunit.strictEqual(images[i].src, resourcesRoot + expected[i], 'image ' + expected[i] + ' set properly');
				qunit.strictEqual(images[i].complete, true, 'image ' + expected[i] + ' loaded');
			}
			
			qunit.start();

		}).run();

	});

}(this));
