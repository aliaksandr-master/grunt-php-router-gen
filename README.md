# grunt-php-router-gen

> Create a Fastest Php router by grunt

> Generate JSON routing behavior file

> Php Router read the file and find match

> that's all.

> routerphp--class in attached

## Getting Started
This plugin requires Grunt `~0.4.4`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-php-router-gen --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-php-router-gen');
```

## The "php_router_gen" task

### Overview
In your project's Gruntfile, add a section named `php_router_gen` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  php_router_gen: {
    options: {
      // Task-specific options go here.
    },
    your_target: {
      options: {
        // Target-specific options go here.
      },
      files: [
        {
          expand: true,
          cwd: 'path/to/source/dir/',
          src: 'filesForRouteParsing.json'
          dest: 'path/to/destination/dir/',
          ext: 'json'
        }
      ]
      // Target-specific file lists and/or options go here.
    },
  },
});
```

### Options

#### options.read (fpath)
Type: `function`

Method to open file.

```js
// example (default)
read: function (fpath) {
  var readMethod = 'read';
    if (/.json$/.test(fpath)) {
      readMethod = 'readJSON';
    } else if (/.yml$/.test(fpath)) {
      readMethod = 'readYML';
    }
  return grunt.file[readMethod](fpath);
},
```

#### options.parse (fileContent)
Type: `function`

Method for parsing file

```js
// example (default)
parse: function (fileContent) {
  return fileContent; // must return array of rows of routes
},
```

> MUST RETURN ARRAY of OBJECTS

> [

>   {

>     name: 'someName', // required

>     method: 'get',

>     url: 'url/to/parse/(:args)/(...)'  // required

>   }

> ]

#### options.collect
Type: `function`

Method for compile route to json

```js
collect: function (route) {
  return _.pick(route, 'name', 'method', 'args', 'reverse', 'pattern', 'data');
},
```

#### options.collectPattern (urlPattern, route)
Type: `function`

Method for compile url-pattern from urlSegments and route options

```js
collectPattern: function (urlSegments, routeOptions) {

  var url = _.map(urlSegments,function (segmentObj) {
    return segmentObj.pattern;
  }).join('/');

  var lastSlash = (routeOptions.trailingSensitive ? (routeOptions.hasLastSlash ? '/' : '') : '[/]?');
  var flags = routeOptions.caseSensitive ? '' : 'i';
  flags += routeOptions.unicodeSensitive ? 'u' : '';

  url = '#^/?' + url.replace(/^\s*\/+/, '') + lastSlash + '$#' + flags;

  return url;
},
```

#### options.collectReverse
Type: `function`

Method for compile reverse url-pattern from urlSegments and route options

```js
collectReverse: function (urlSegments, routeOptions) {
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
```

#### options.caseSensitive
Type: `boolean`
Default value: `true`

option for reg exp of end url-pattern

#### options.unicodeSensitive
Type: `boolean`
Default value: `true`

option for reg exp of end url-pattern

#### options.trailingSensitive
Type: `boolean`
Default value: `true`

Option for reg exp of end url-pattern.
Last slash sensitivity.
Url dependence of slash if true.
add [\/]? in end if else

#### options.beautify
Type: `boolean`
Default value: `false`

JSON stringify option (add indent if true)

#### options.map
Type: `object|function|null`
Default value: `null`

route's data (such as params and other).
This object will be returned if route found match with route.uri

```js
{
  someRouteName: {
    params: {
      someUrlParamName: defaultValue1,
      someParamName: defaultValue2
    }
  }
}
```

#### options.getRouteParamsByMap (routeName, map)

Get route data from route-data-map.

```js
// example
getRouteParamsByMap: function (routeName, map) {
  if (map[routeName] == null) {
    grunt.fail.fatal('Undefined route "' + routeName + '" in data-map');
  }
  return map[routeName];
}
```

#### options.aliases
Type: `object`
Default value: `{}`

Constraint aliases. for use in url patterns as (decimal:paramName)

```js
{
  'decimal': '\\d+',
  'integer': '-?\\d+'
}
```

#### options.parseUrlSegment
Type: `function`

Detect args in current url segment.

default detection format of simple url param: (PATTERN_OR_ALIAS:PARAM_NAME)
default detection format of infinite url params: (...)

> MUST RETURN

> return {

>   args: [

>     {

>       name: 'strName',  // string name mast compatible with template /^[a-z][a-zA-Z0-9_]$/

>       pattern: '(?P<strName>.+)'  // VALID NAMING REG_EXP PATTERN FOR DETECT PARAM FROM THIS SEGMENT STRING

>     },

>     {

>       name: 'strName',

>       pattern: '(?P<strName>.+)'

>     }

>   ],

>   segment: strSegmentPattern  //    string

> };

### Usage Examples

##### source/routes.json

```
[
  {
    "name": "hello-1",
    "url": "test/one/((\\d+|_\\d+):var1)/",
    "method": "get"
  },
  {
    "name": "one-hello",
    "url": "test/one/(:var1)/",
    "method": "get"
  },
  {
    "name": "two-hello",
    "url": "test/one/(:var1)",
    "method": "get"
  },
  {
    "name": "tree-hello",
    "url": "test/one/(:var1)/222",
    "method": "get"
  }
]
```

#### gruntfile
In this example, custom options are used to do something else with whatever else. So if the `testing` file has the content `Testing` and the `123` file had the content `1 2 3`, the generated result in this case would be `Testing: 1 2 3 !!!`

```js
grunt.initConfig({
  php_router_gen: {
    options: {
      separator: ': ',
      punctuation: ' !!!',
    },
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
  },
});
```

### ADVANCE USAGE

#### routes test/two/routes_two.txt

this file translate into need format. but this format better for routing
```
get     /                        ->   user.post
get     user/(...)?              ->   user.post
get     user                     ->   user.get.one  #line comment
post    user                     ->   user.post
put     user/(...)               ->   user.post
get     user/(...)?/123          ->   user.post
get     session/(...)?/123       ->   session.get
\#line comment
get     /user/(decimal:id)?/asd  ->   user.get.all
get     user/(\d+:id)?           ->   user.get.all2
get     hello/(\d+:ggg)?         ->   hello.get
```

#### map test/two/map_two.json

```js
{
  "root": "/controllers",
  "<user>": {
    "path": "/user",
    "<get>": {
      "<all>": {},
      "<all2>": {},
      "<one>": {}
    },
    "<post>": {}
  },
  "<hello>": {
    "params": {
      "ggg": 111
    },
    "<get>": {
      "params": {
         "ggg": 222
      }
    }
  },
  "<session>": {
    "params": {
      "aaaa": 111
    },
    "<get>": {
      "params": {
        "aaaa": 222
      }
    }
  }
}
```

#### gruntfile

```js
grunt.initConfig({
  php_router_gen: {
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
```

## usage in PHP

### detect current route

```php
require_once('Router.php');

$routes = json_decode(file_get_contents('../../tmp/routes_one.json'), true);

$router = new Router($routes);
$result = $router->match($_SERVER['REQUEST_METHOD'], $_SERVER['REQUEST_URI']);

var_dump($result);
```

### get url by route name and params (reverse)

```
require_once('Router.php');

$routes = json_decode(file_get_contents('routes_two.json'), true);

$router = new Router($routes);

$result = $router->reverse('GET', 'user.get.all', array('version'=>333, 'id' => 3));

$result = $router->reverse('post', 'user.post', array('version'=>333, 'id' => 3));
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).
