'use strict';
(function(window) {
  
  var gherkin = new Gherkin(),
      karma = window.__karma__,
      initLoadedFn = karma.loaded;
  
  karma.loaded = function loaded() {
    gherkin.run();
    initLoadedFn.call(karma);
    gherkin.reset();
  }
  
  /**
   * Private class.
   * @class Gherkin
   */
  function Gherkin() {
    var _defs = {
      features: {},
      scenarios: {},
      steps: {}
    }, _features = [], lastId = 1;
    
    function nextId() {
      return lastId++;
    }
    
    /**
     * Add a definition to the stack.
     * @param {RegExp, String} name - The identificator to match with a defition from .feature content.
     * @param {Function} fn - The function that will be executed.
     * @param {String} type - can be one of the values "feature", "scenario" or "step"
     */
    function addDefinition(name, fn, type) {
      if (type === "feature") {
        // TODO> think about how to identify a feature
        _defs.features[nextId()] = {
          name: name,
          fn: fn
        };
      }
      if (type === "scenario") {
        // TODO> think about how to identify an scenario
        _defs.scenarios[nextId()] = {
          name: name,
          fn: fn
        };
      }
      if (type === "step") {
        // TODO> think about how to identify an step
        _defs.steps[nextId()] = {
          name: name,
          fn: fn
        };
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
  
  // TODO> as developed for Gherkin.prototype.processFeature let's develope for processStep
  Gherkin.prototype.processStep = function processStep(step) {
    var definitions = this.getDefinitions();
    if (definitions.steps.hasOwnProperty(step.text)) {
      var stepFn = definitions.steps[step.text];
      it(step.text, stepFn);
    }
    else {
      // TODO> make the standard format for this warning
      karma.log('WARNING', ["Step not found", step.text]);
    }
  }
  
  // TODO> unify the way to execute processFeature and processScenario
  Gherkin.prototype.processScenario = function processScenario(scenario) {
    var scenarios = this.getDefinitions().scenarios,
        item, args, scenarioFn;
    for (item in scenarios) {
      scenarioFn = args = undefined;
      if (scenarios[item].name.constructor === RegExp) {
        args = scenarios[item].name.exec(scenario.name);
        if (args) {
          if (args[0] === scenario.name) {
            args = args.slice(1);
          }
          scenarioFn = scenarios[item].fn;
        }
      }
      else if (scenarios[item].name.constructor === String) {
        if (scenarios[item].name === scenario.name) {
          scenarioFn = scenarios[item].fn;
        }
      }
      else {
        console.error('undefined type to identify the scenario', scenario.name, ". This should be a regexp or an string object");
      }
      if (scenarioFn) { // if featureFn found
        function enveloper() { // enveloper function to pass to describe process 
          return scenarioFn.apply(null, args); // TODO> define a world context by default. And override the context if neccessary
        }
        describe(scenario.name, enveloper); // send to describe the final version for featureFn enveloped into an enveloper
        scenario.steps.forEach(this.processStep, this);
      }
      else {
        // TODO> make the standard format for this warning
        karma.log('WARNING', ["Scenario not found", scenario.name]);
      }
    }
  }
  
  // TODO> unify the way to execute processFeature and processScenario
  Gherkin.prototype.processFeature = function processFeature(feature) {
    var features = this.getDefinitions().features,
        item, args, featureFn;
    for (item in features) {
      featureFn = args = undefined;
      if (features[item].name.constructor === RegExp) {
        args = features[item].name.exec(feature.name);
        if (args) { // the given regexp seems to fit the feature.name
          // TODO> seems that I need to study how to match strings to regexp
          if (args[0] === feature.name) { // TODO> because here I do an strange comparison
            args = args.slice(1); // TODO> and then eliminate the first element
          }
          featureFn = features[item].fn; // TODO> how to determinate if featureFn has the last parametr as done?
        }
      }
      else if (features[item].name.constructor === String) {
        if (features[item].name === feature.name) {
          featureFn = features[item].fn; // TODO> how to determinate if featureFn has the last parametr as done?
        }
      }
      else {
        console.error('undefined type to identify the feature', feature.name, ". This should be a regexp or an string object");
      }
      if (featureFn) { // if featureFn found
        function enveloper() { // enveloper function to pass to describe process
          return featureFn.apply(null, args); // TODO> define a world context by default. And override the context if neccessary
        }
        describe(feature.name, enveloper); // send to describe the final version for featureFn enveloped into an enveloper 
        feature.scenarioDefinitions.forEach(this.processScenario, this); // and then let's search for this feature its scenarios
      }
      else {
        // TODO> make the standard format for this warning
        karma.log('WARNING', ["Feature not found", feature.file.path, feature.name]);
      }
    }
  }
  
  Gherkin.prototype.run = function run() {
    this.getFeatures().forEach(this.processFeature, this);
  }
  
  Gherkin.prototype.loadFeature = function loadFeature(feature, file) {
    feature.file = file;
    this.addFeature(feature);
  };
  
  // private function
  window.___loadFeature___ = function loadFeature(feature, file){ 
    return gherkin.loadFeature(feature, file);
  }
  
  /**
   * Function that is passed to describe|it process.
   *
   * @function bodyTestFn
   * @param {...*} args - multiple args filled by matching a given description from feature with the RegExp
   * @param {Function} done - used for the test framework to indicate async execution
   */
  
  /**
   * Function to define a feature
   * @param {String|RegExp} name
   * @param {bodyTestFn} fn
   */
  window.feature = function feature(name, fn) {
    return gherkin.feature(name, fn);
  }
  /**
   * Function to define an scenario
   * @param {String|RegExp} name
   * @param {bodyTestFn} fn
   */
  window.scenario = function scenario(name, fn) {
    return gherkin.scenario(name, fn);
  }
  /**
   * Function to define an step.
   * @param {String|RegExp} name
   * @param {bodyTestFn} fn
   */
  window.step = function step(name, fn) {
    return gherkin.step(name, fn);
  }
  /**
   * Function to define a given step.
   * @param {String|RegExp} name
   * @param {bodyTestFn} fn
   */
  window.given = function given(name, fn) {
    return gherkin.given(name, fn);
  }
  /**
   * Function to define a when step.
   * @param {String|RegExp} name
   * @param {bodyTestFn} fn
   */
  window.when = function when(name, fn) {
    return gherkin.when(name, fn);
  }
  /**
   * Function to define a then step.
   * @param {String|RegExp} name
   * @param {bodyTestFn} fn
   */
  window.then = function then(name, fn) {
    return gherkin.then(name, fn);
  }
  
})(typeof window !== 'undefined' ? window : global);