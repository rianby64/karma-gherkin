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
    this.addDefinition(name, fn, "scenario");
  };
  
  Gherkin.prototype.step = function feature(name, fn) {
    this.addDefinition(name, fn, "step");
  };
  
  Gherkin.prototype.loadFeature = function loadFeature(feature) {
    this.addFeature(feature);
  };
  
  Gherkin.prototype.run = function run() {
    var definitions = this.getDefinitions(); // from TEST
    this.getFeatures().forEach(function(feature) { // forEach FEATURE
      
      if (definitions.features.hasOwnProperty(feature.name)) { // find in TEST feature.name
        var featureFn = definitions.features[feature.name];  // connected feature.name with feature from TEST
        featureFn(); // call the feature from TEST
        
        feature.scenarioDefinitions.forEach(function(scenario) { // forEach scenario in FEATURE
          
          if (definitions.scenarios.hasOwnProperty(scenario.name)) { // find in TEST scenario.name
            var scenarioFn = definitions.scenarios[scenario.name]; // connect scenario.name with scenario from TEST
            scenarioFn(); // call the scenario from TEST
            
            scenario.steps.forEach(function(step) { // forEach step in scenario from FEATURE
              if (definitions.steps.hasOwnProperty(step.text)) {
                var stepFn = definitions.steps[step.text];
                stepFn();
              }
            });
          }
        });
      }
    });
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