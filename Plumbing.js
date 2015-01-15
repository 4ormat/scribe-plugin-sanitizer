/*
 * Warning: shameless self-plug!
 * Plumber is the Guardian’s tool of choice for build systems.
 * https://github.com/plumberjs/plumber
 */

var all       = require('plumber-all');
var glob      = require('plumber-glob');
var requireJS = require('plumber-requirejs');
var uglifyJS  = require('plumber-uglifyjs')();
var write     = require('plumber-write');

module.exports = function (pipelines) {
  var sanitizerPluginRequireJS = requireJS({
    paths: {
      'html-janitor':  '../bower_components/html-janitor/html-janitor',
      'lodash-amd': '../bower_components/lodash-amd'
    }
  });

  var toBuildDir = write('./build');
  var writeBoth = all(
    // Send the resource along these branches
    [uglifyJS, toBuildDir],
    toBuildDir
  );

  // We probably won't ever need this default build process at Format,
  // since we're unlikely to start using RequireJS or another AMD dep
  // management lib. Let's keep it around in case upstream decides to
  // optimize/change the default build process. Merging upstream will
  // be easier to do if this code block is kept intact.
  pipelines['build'] = [
    glob('src/scribe-plugin-sanitizer.js'),
    sanitizerPluginRequireJS,
    writeBoth
  ];

  // This is the build process for Format. It creates a UMD version of
  // the Scribe sanitizer plugin in the build/format directory. The file
  // is called scribe-plugin-sanitizer.js.
  var rename = require('plumber-rename');
  var umdRequireJS = requireJS({
    paths: {
      'html-janitor':  '../bower_components/html-janitor/html-janitor',
      'lodash-amd': '../bower_components/lodash-amd'
    },
    include: ['scribe-plugin-sanitizer'],
    wrap: {
      start:
      "(function (root, factory) {\n" +
      "  if (typeof define === 'function' && define.amd) {\n" +
      "    define([], factory);\n" +
      "  } else {\n" +
      "    root._4ORMAT_scribePluginSanitizer = factory();\n" +
      "  }\n" +
      "}(this, function () {\n\n",
      end:
      "return require('scribe-plugin-sanitizer');\n" +
      "}));"
    }
  });
  var toFormatBuildDir = write('./build/format');
  var sources = glob.within('src');
  pipelines['format'] = [
    sources('almond.js'),
    rename('scribe-plugin-sanitizer'),
    umdRequireJS,
    toFormatBuildDir.omitSourceMap
  ]
};
