# grunt-php-router-gen

> Create a Fastest Php router by grunt

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
      // Target-specific file lists and/or options go here.
    },
  },
});
```

### Options

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

#### options.aliases
Type: `object`
Default value: `{}`

Constraint aliases. for use in url patterns as (*decimal*:paramName)
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


### Usage Examples

#### Default Options
In this example, the default options are used to do something with whatever. So if the `testing` file has the content `Testing` and the `123` file had the content `1 2 3`, the generated result would be `Testing, 1 2 3.`

```js
grunt.initConfig({
  php_router_gen: {
    options: {},
    files: [
    	{
          'dest/routes.json': 'source/routes.json',
        }
    ],
  },
});
```

##### source/routes.json
```
[
  {
    "name": "some route name", // correct string.
    "url": "/pattern/(:to)/detect/(...)", // correct url string with regExp parts and route-get-args
    "method": "get" // if method not matter use NULL
  }
]
```

#### Custom Options
In this example, custom options are used to do something else with whatever else. So if the `testing` file has the content `Testing` and the `123` file had the content `1 2 3`, the generated result in this case would be `Testing: 1 2 3 !!!`

```js
grunt.initConfig({
  php_router_gen: {
    options: {
      separator: ': ',
      punctuation: ' !!!',
    },
    files: {
      'dest/default_options': ['src/testing', 'src/123'],
    },
  },
});
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
_(Nothing yet)_
