'use strict';
(function(window) {
  function Gherkin() {
    var defs = {
      features: [],
      scenarios: [],
      steps: []
    };
    this.defined = defs;
  }

  Gherkin.prototype.feature = function feature(name, fn) {
    console.log('defining a feature', name);
    fn();
  };
  
  Gherkin.prototype.scenario = function feature(name, fn) {
    console.log('defining a scenario');
    fn();
  };
  
  Gherkin.prototype.step = function feature(name, fn) {
    console.log('defining a step');
    fn();
  };
  
  Gherkin.prototype.loadFeature = function loadFeature(feature) {
    console.log("running a feature", feature);
  };
  
  Gherkin.prototype.run = function run() {
    console.log('run all');
  }
  
  var gherkin = new Gherkin();
  window.gherkin = gherkin;
  window.feature = gherkin.feature;
  window.scenario = gherkin.scenario;
  window.step = gherkin.step;
  
  // save the link to the initial __karma__.loaded function
  var initLoadedFn = window.__karma__.loaded;
  // re-define __karma__.loaded function
  window.__karma__.loaded = function() {
    gherkin.run(); // after load everything, lets run the features
    initLoadedFn.call(window.__karma__); // execute that initial __karma.loaded function
  }
})(typeof window !== 'undefined' ? window : global);