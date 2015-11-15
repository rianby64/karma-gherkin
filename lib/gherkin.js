'use strict';
(function(window) {
  
  // I feel here I must implement a composition pattern!
  function Gherkin() {
    var _defs = {
      features: {},
      scenarios: {},
      steps: {}
    }, _features = [];
    
    function addDefinition(name, element, type) {
      if (type === "feature") {
        _defs.features["" + name] = element;
      }
      if (type === "scenario") {
        _defs.scenarios["" + name] = element;
      }
      if (type === "step") {
        _defs.steps["" + name] = element;
      }
    }
    
    function getDefinitions() {
      return _defs;
    }
    
    function addFeature(feature) {
      _features.push(feature)
    }
    
    function getFeatures() {
      return _features;
    }
    
    this.addDefinition = addDefinition;
    this.addFeature = addFeature;
    
    this.getDefinitions = getDefinitions;
    this.getFeatures = getFeatures;
  }

  Gherkin.prototype.feature = function feature(name, fn) {
    this.addDefinition(name, fn, "feature");
  };
  
  Gherkin.prototype.scenario = function feature(name, fn) {
    this.addDefinition(name, fn, "feature");
  };
  
  Gherkin.prototype.step = function feature(name, fn) {
    this.addDefinition(name, fn, "feature");
  };
  
  Gherkin.prototype.loadFeature = function loadFeature(feature) {
    this.addFeature(feature);
  };
  
  Gherkin.prototype.run = function run() {
    console.log('run all', this.getDefinitions(), this.getFeatures());
  }
  
  var gherkin = new Gherkin();
  window.gherkin = gherkin;
  window.feature = gherkin.feature.bind(gherkin);
  window.scenario = gherkin.scenario.bind(gherkin);
  window.step = gherkin.step.bind(gherkin);
  
  // save the link to the initial __karma__.loaded function
  var initLoadedFn = window.__karma__.loaded;
  // re-define __karma__.loaded function
  window.__karma__.loaded = function() {
    gherkin.run(); // after load everything, lets run the features
    initLoadedFn.call(window.__karma__); // execute that initial __karma.loaded function
  }
})(typeof window !== 'undefined' ? window : global);