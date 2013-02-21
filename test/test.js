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
				'kitten1.jpg',
				'kitten2.jpg',
				'kitten3.jpg',
				'kitten4.jpg'
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


	qunit.test('adding selectors', function() {

		var	images,
			expected = [
				'kitten1.jpg',
				'kitten2.jpg',
				'kitten5.jpg',
				'kitten7.jpg',
				'kitten3.jpg',
				'kitten6.jpg',
				'kitten4.jpg',
				'kitten8.jpg'
			],
			i;

		images = win.autopreload.add('.more').add(['.this', '.that']).run();

		qunit.strictEqual(Object.prototype.toString.call(images), '[object Array]', 'preload list exists and is an array');
		qunit.strictEqual(images.length, expected.length, 'expected images to preload number and actually preloaded match');
		for(i = 0; i < expected.length; i++) {
			qunit.strictEqual(images[i].tagName.toLowerCase(), 'img', 'item ' + i + ' is an image');
			qunit.strictEqual(images[i].src, resourcesRoot + expected[i], 'image ' + expected[i] + ' set properly');
		}
		
	});

	
	qunit.test('ignoring selectors', function() {
		
		var	images,
			expected = [
				'kitten3.jpg',
			],
			i;

		images = win.autopreload.ignore('.kitten:hover').ignore(['.kitten:active', '.kitten.other.media:active']).run();

		qunit.strictEqual(Object.prototype.toString.call(images), '[object Array]', 'preload list exists and is an array');
		qunit.strictEqual(images.length, expected.length, 'expected images to preload number and actually preloaded match');
		for(i = 0; i < expected.length; i++) {
			qunit.strictEqual(images[i].tagName.toLowerCase(), 'img', 'item ' + i + ' is an image');
			qunit.strictEqual(images[i].src, resourcesRoot + expected[i], 'image ' + expected[i] + ' set properly');
		}	
	});

	qunit.test('onload event', function() {

		var	expected = [
				'kitten1.jpg',
				'kitten2.jpg',
				'kitten3.jpg',
				'kitten4.jpg'
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
