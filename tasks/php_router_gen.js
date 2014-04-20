/*
 * grunt-php-router-gen
 * https://github.com/aliaksandr-pasynkau/grunt-php-router-gen
 *
 * Copyright (c) 2014 Aliaksandr Pasynkau
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function (grunt) {

	grunt.registerMultiTask('php_router_gen', 'Create a Fastest Php router by grunt', function () {

		var thisTaskObj = this;

		var INFINITE_ARG_NAME = '__INFINITE__';
		var INFINITE_ARG_PATTERN = '(?P<' + INFINITE_ARG_NAME + '>.+)';

		var _ = require('lodash');



		var utils = {

			// Iterate over all specified file groups.
			gruntFilesIterate: function (callback) {
				thisTaskObj.files.forEach(function (file) {
					file.src.forEach(function (filepath) {
						// Warn on and remove invalid source files (if nonull was set).
						if (!grunt.file.exists(filepath)) {
							grunt.log.warn('Source file "' + filepath + '" not found.');
							return;
						}

						// call callback , that will return {dest: 'strPath', content: 'string'};
						var obj = callback(filepath, file.dest, file);
						if (obj != null) {
							var fileDest = obj.dest || file.dest;

							// Write the destination file.
							grunt.file.write(fileDest, obj.content);

							// Print a success message.
							grunt.log.writeln('File "' + fileDest + '" created.');
						}
					});
				});
			},

			cleanUrl: function (url) {
				return url.replace(/^\s*\/*/g, '/').replace(/\/+\s*$/g, '').replace(/\/+/, '/');
			},

			prepare: {
				httpMethod: function (method) {
					method = (method || '').trim().toUpperCase();
					return method ? method : null;
				}
			},

			validRoute: function (route, values) {
				if (!route.name || !(route.url || '').trim().length) {
					grunt.fail.fatal('Invalid Route ' + JSON.stringify(route));
					return false;
				}

				var AVAILABLE_METHODS_REG_EXP = /^GET|PUT|POST|DELETE|OPTIONS|HEAD|CONNECT|TRACE$/;
				var method = this.prepare.httpMethod(route.method);

				if (method && !AVAILABLE_METHODS_REG_EXP.test(method)) {
					grunt.fail.fatal('Invalid Method "' + route.method + '" you can use "' + AVAILABLE_METHODS_REG_EXP.source + '"');
					return false;
				}

				if (values != null && !values[route.name]) {
					grunt.fail.fatal('Undefined Value "' + route.name + '"');
					return false;
				}

				return true;
			},

			validUrlArg: function (arg, args, segmentObj) {

				if (/^\d+$/.test(arg.name)) {
					grunt.fail.fatal('Invalid Argument Name "' + arg.name + '" -> "' + arg.pattern + '"');
					return false;
				}

				if (args[arg.name] != null) {
					grunt.fail.fatal('Duplicate Argument name "' + arg.name + '"');
					return false;
				}

				if (!arg.pattern) {
					grunt.fail.fatal('"' + segmentObj.source + '" has empty pattern of argument');
					return false;
				}

				if (segmentObj.pattern && segmentObj.pattern.indexOf(arg.pattern) === -1) {
					grunt.fail.fatal('Undefined argument "' + arg.name + '" ("' + arg.pattern + '") pattern in segment pattern "' + segmentObj.pattern + '"');
					return false;
				}

				return true;
			}
		};

		var defaultAliases = {
			"": "[^\/]+",
			"decimal": "[0-9]+"
		};

		// Merge task-specific and/or target-specific options with these defaults.
		var options = this.options({

			map: null,

			aliases: {},

			// NEED RETURN
			// return {
			//     args: [],                   //
			//     segment: strSegmentPattern  //    string
			// };

			// args = [{name: 'strName', pattern: 'strPattern'}, {name: 'strName', pattern: 'strPattern'}];
			parseUrlSegment: function (segment) {

				var ARG_PATTERN = /\((.*?):([a-zA-Z0-9_]*)\)/g;  // (:id)  , ([0-9]+:id) , ([^\/]+:id)
				var INFINITE_PATTERN = /\(\.\.\.\)/g; // (...)
				var INFINITE_STR = '(...)';

				var obj = {
					args: [],
					pattern: segment
				};

				obj.pattern = obj.pattern.replace(INFINITE_PATTERN, function () {
					obj.args.push({
						infinite: true,
						pattern: INFINITE_STR
					});
					return INFINITE_STR;
				});

				obj.pattern = obj.pattern.replace(ARG_PATTERN, function ($0, exp, name) {
					var pattern = '(?P<' + name + '>' + (options.aliases[exp] ? options.aliases[exp] : exp) + ')';
					obj.args.push({
						name: name,
						pattern: pattern
					});
					return pattern;
				});
				return obj;
			},

			getRouteParamsByMap: function (routeName, map) {
				if (map[routeName] == null) {
					grunt.fail.fatal('undefined route "' + routeName + '"');
				}
				return map[routeName];
			},

			parse: function (fileContent) {
				return fileContent;
			},

			collect: function (route) {
				return _.pick(route, 'name', 'method', 'args', 'reverse', 'pattern', 'data');
			},

			read: function (fpath) {
				var readMethod = 'read';
				if (/.json$/.test(fpath)) {
					readMethod = 'readJSON';
				} else if (/.yml$/.test(fpath)) {
					readMethod = 'readYML';
				}
				return grunt.file[readMethod](fpath);
			},

			collectPattern: function (urlSegments, route) {
				var url = _.map(urlSegments,function (segmentObj) {
					return segmentObj.pattern;
				}).join('/');
				url = '#^/?' + url.replace(/^\s*\/+/, '') + (route.trailingSensitive ? (route.hasLastSlash ? '/' : '') : '[/]?') + '$#';
				url += route.caseSensitive ? '' : 'i';
				url += route.unicodeSensitive ? 'u' : '';
				return url;
			},

			collectReverse: function (urlSegments, route) {
				var r = _.map(urlSegments, function (segmentObj) {
					var url = segmentObj.pattern;
					_.each(segmentObj.args, function (arg) {
						url = url.replace(arg.pattern + '?', '<' + arg.name + '?>');
						url = url.replace(arg.pattern, '<' + arg.name + '>');
					});
					return url;
				});

				r = r.join('/');
				r = utils.cleanUrl(r);

				return r;
			},

			caseSensitive: true,
			unicodeSensitive: true,
			trailingSensitive: true,

			beautify: false
		});

		options.aliases = _.extend(defaultAliases, options.aliases);

		utils.gruntFilesIterate(function (fpath, dest, fileObj) {

			// read current available routes file
			var fileContent = options.read(fpath);

			// parse routes file content to json format [{method: }]
			var routes = options.parse(fileContent);

			// set default values as Null
			var map = _.isFunction(options.map) ? options.map(fpath, dest, fileObj) : options.map;
			map = map == null ? null : map;

			// generate result JSON
			var resultJSON = _.map(routes, function (route) {

				if (!utils.validRoute(route)) {
					return null;
				}

				route = _.extend(_.pick(options, ['unicodeSensitive', 'caseSensitive', 'trailingSensitive']), {
					name: route.name.trim(),
					url: route.url.trim(),
					method: (route.method || '').trim() ? route.method.trim().toUpperCase() : null
				});

				route.hasLastSlash = route.url.length > 1 ? /\/+$/.test(route.url) : true;

				var segments = utils.cleanUrl(route.url).replace(/^\/+/g, '').split(/\/+/);

				var args = {};
				segments = _.map(segments, function (segment) {
					var obj = options.parseUrlSegment(segment);

					if (obj == null || obj.pattern == null) {
						return null;
					}

					obj = _.cloneDeep(obj);
					obj.source = segment;
					obj.args = obj.args == null ? [] : obj.args;

					_.each(obj.args, function (arg) {
						if (!utils.validUrlArg(arg, args, obj)) {
							return false;
						}
						if (arg.infinite) {
							arg.name = INFINITE_ARG_NAME;
							obj.pattern = obj.pattern.replace(arg.pattern, INFINITE_ARG_PATTERN);
							arg.pattern = INFINITE_ARG_PATTERN;
						}
						args[arg.name] = arg;
					});

					return obj;
				});

				segments = _.compact(segments);

				route.data = map == null ? null : options.getRouteParamsByMap(route.name, map);

				route.pattern = options.collectPattern(segments, route);

				route.reverse = options.collectReverse(segments, route);

				route.args = _.keys(args);

				return options.collect(route);
			});

			resultJSON = _.compact(resultJSON);

			return {
				content: JSON.stringify(resultJSON, null, options.beautify ? 4 : null)
			};
		});
	});

};