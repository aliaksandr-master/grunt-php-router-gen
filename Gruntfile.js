/*
 * grunt-php-router-gen
 * https://github.com/master/grunt-php-router-gen
 *
 * Copyright (c) 2014 Aliaksandr Pasynkau
 * Licensed under the MIT license.
 */

'use strict';

var _ = require('lodash');

module.exports = function (grunt) {

	// Project configuration.
	grunt.initConfig({

		jshint: {
			all: [ 'Gruntfile.js', 'tasks/*.js' ],
			options: {
				jshintrc: '.jshintrc'
			}
		},

		// Before generating any new files, remove any previously-created files.
		clean: {
			tests: ['tmp']
		},

		// Configuration to be run (and then tested).
		php_router_gen: {
			test_one: {
				options:{
					beautify: true
				},
				files: [
					{
						expand: true,
						cwd: './test/one',
						src: 'routes_one.json',
						dest: 'tmp'
					}
				]
			},
			test_two: {
				options: {

					map: function () {
						var json = grunt.file.readJSON('test/two/map_two.json');

						var getAllResources = function (currObj, _prevName, options, _result) {
							options = options || {};

							_result   = _result == null ? {} : _result;
							_prevName = _prevName == null ? '' : _prevName + '.';

							var resourceNodeExp = /^<([^>]+)>$/;

							var resources = {};
							_.each(currObj, function (v, k) {
								if (resourceNodeExp.test(k)) {
									resources[_prevName + k.replace(resourceNodeExp, '$1')] = v;
								} else {
									options[k] = v;
								}
							});

							_.each(resources, function (v, name) {
								_result[name] = getAllResources(v, name, _.clone(options), _result).options;
							});

							return {
								options: options,
								result: _result
							};
						};

						return getAllResources(json).result;
					},

					aliases: {
						"": "[^\/]+",
						"decimal": "[0-9]+"
					},

					parse: function (fileContent) {

						var routes = [];

						var rows = fileContent
							.trim()
							.replace(/^\s+/mg, '').replace(/\s+$/mg, '')
							.replace(/\s*->\s*([^\s]*)$/gm, '  $1')
							.split(/\n\s*/);

						_.each(rows, function (row) {
							row = row.replace(/#.+$/, '');

							if (!row.length) {
								return;
							}

							var rowObj = {
								name: null,
								method: null,
								url: null
							};

							var rowSegments = row.trim().split(/\s+/);

							var root = '/test/two/';

							if (rowSegments.length === 3) {
								rowObj.method = rowSegments[0];
								rowObj.url = rowSegments[1];
								rowObj.name = rowSegments[2];
							} else if (rowSegments.length === 2) {
								rowObj.method = null;
								rowObj.url = rowSegments[0];
								rowObj.name = rowSegments[1];
							}

							if (rowObj.url) {
								rowObj.url = rowObj.url.trim();
								if (!/^\/.+$/.test(rowObj.url)) {
									rowObj.url = root + rowObj.url;
								}
							}

							routes.push(rowObj);
						});

						return routes; // must be [{method: 'get', url: '/needed/url/string', name: 'resource.name'}]
					},

					caseSensitive: true,
					unicodeSensitive: true,
					trailingSensitive: true,

					beautify: true
				},
				files: [
					{
						expand: true,
						cwd: 'test/two',
						src: 'routes_two.txt',
						dest: 'tmp',
						ext: '.json'
					}
				]
			}
		},

	});

	// Actually load this plugin's task(s).
	grunt.loadTasks('tasks');

	// These plugins provide necessary tasks.
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-clean');

	// By default, lint and run all tests.
	grunt.registerTask('default', ['clean', 'jshint', 'php_router_gen']);

};
