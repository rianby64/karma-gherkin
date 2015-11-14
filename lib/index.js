'use strict';
var path = require('path');

var createPattern = function(path) {
  return {pattern: path, included: true, served: true, watched: false};
};

var Gherkin = require('gherkin');
var parser = new Gherkin.Parser();

var createPreprocessor = function(logger, files) {
  files.unshift(createPattern(__dirname + '/gherkin.js'));
  var log = logger.create('preprocessor.gherkin');
  log.info("loading Gherkin parser");
  
  return function processor(content, file, done) {
    var result = parser.parse(content);
    return done('gherkin.processFeature(' + JSON.stringify(result) + ');');
  }
}

createPreprocessor.$inject = ['logger', 'config.files']

module.exports = {
  'preprocessor:gherkin': ['factory', createPreprocessor]
};