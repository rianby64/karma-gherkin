'use strict';
(function(window) {
  
  var gherkin = new Gherkin(),
      karma = window.__karma__,
      initLoadedFn = karma.loaded;
  
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
    
    function reset() {
      _defs = {
        features: {},
        scenarios: {},
        steps: {}
      }, _features = [];
    }
    
    this.addDefinition = addDefinition;
    this.addFeature = addFeature;
    
    this.getDefinitions = getDefinitions;
    this.getFeatures = getFeatures;
    
    this.reset = reset;
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
  
  Gherkin.prototype.given = function feature(name, fn) {
    this.addDefinition(name, fn, "step");
  };
  
  Gherkin.prototype.when = function feature(name, fn) {
    this.addDefinition(name, fn, "step");
  };
  
  Gherkin.prototype.then = function feature(name, fn) {
    this.addDefinition(name, fn, "step");
  };
  
  Gherkin.prototype.processStep = function processStep(step) {
    var definitions = this.getDefinitions();
    if (definitions.steps.hasOwnProperty(step.text)) {
      var stepFn = definitions.steps[step.text];
      it(step.text, stepFn);
    }
    else {
      karma.log('WARNING', ["Step not found", step.text]);
    }
  }
  
  Gherkin.prototype.processScenario = function processScenario(scenario) {
    var definitions = this.getDefinitions();
    if (definitions.scenarios.hasOwnProperty(scenario.name)) {
      var scenarioFn = definitions.scenarios[scenario.name];
      describe(scenario.name, scenarioFn);

      scenario.steps.forEach(this.processStep, this);
    }
    else {
      karma.log('WARNING', ["Scenario not found", scenario.name]);
    }
  }
  
  Gherkin.prototype.processFeature = function processFeature(feature) {
    var definitions = this.getDefinitions();
    if (definitions.features.hasOwnProperty(feature.name)) {
      var featureFn = definitions.features[feature.name];
      describe(feature.name, featureFn);

      feature.scenarioDefinitions.forEach(this.processScenario, this);
    }
    else {
      karma.log('WARNING', ["Feature not found", feature.file.path, feature.name]);
    }
  }
  
  Gherkin.prototype.run = function run() {
    this.getFeatures().forEach(this.processFeature, this);
  }
  
  Gherkin.prototype.loadFeature = function loadFeature(feature, file) {
    feature.file = file;
    this.addFeature(feature);
  };
  
  window.gherkin = gherkin;
  // PhantomJS compatibility. This browser doesn't support Function.bind
  window.feature = function(name, fn) { return gherkin.feature(name, fn); }
  window.scenario = function(name, fn) { return gherkin.scenario(name, fn); }
  window.step = function(name, fn) { return gherkin.step(name, fn); }
  window.given = function(name, fn) { return gherkin.given(name, fn); }
  window.when = function(name, fn) { return gherkin.when(name, fn); }
  window.then = function(name, fn) { return gherkin.then(name, fn); }
  
  karma.loaded = function() {
    gherkin.run();
    initLoadedFn.call(karma);
    gherkin.reset();
  }
})(typeof window !== 'undefined' ? window : global);