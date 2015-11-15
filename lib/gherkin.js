'use strict';
(function(window) {
  
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
  
  Gherkin.prototype.processStep = function processStep(step) {
    var definitions = this.getDefinitions();
    if (definitions.steps.hasOwnProperty(step.text)) {
      var stepFn = definitions.steps[step.text];
      it(step.text, stepFn);
    }
  }
  
  Gherkin.prototype.processScenario = function processScenario(scenario) {
    var definitions = this.getDefinitions();
    if (definitions.scenarios.hasOwnProperty(scenario.name)) {
      var scenarioFn = definitions.scenarios[scenario.name];
      describe(scenario.name, scenarioFn);

      scenario.steps.forEach(this.processStep, this);
    }
  }
  
  Gherkin.prototype.processFeature = function processFeature(feature) {
    var definitions = this.getDefinitions();
    if (definitions.features.hasOwnProperty(feature.name)) {
      var featureFn = definitions.features[feature.name];
      describe(feature.name, featureFn);

      feature.scenarioDefinitions.forEach(this.processScenario, this);
    }
  }
  
  Gherkin.prototype.run = function run() {
    this.getFeatures().forEach(this.processFeature, this);
  }
  
  Gherkin.prototype.loadFeature = function loadFeature(feature) {
    this.addFeature(feature);
  };
  
  var gherkin = new Gherkin();
  window.gherkin = gherkin;
  window.feature = gherkin.feature.bind(gherkin);
  window.scenario = gherkin.scenario.bind(gherkin);
  window.step = gherkin.step.bind(gherkin);
  
  var initLoadedFn = window.__karma__.loaded;
  window.__karma__.loaded = function() {
    gherkin.run();
    initLoadedFn.call(window.__karma__);
  }
})(typeof window !== 'undefined' ? window : global);