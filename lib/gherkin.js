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
     * @param {Object} thisArg.
     * @param {String} type - can be one of the values "feature", "scenario" or "step"
     */
    function addDefinition(type, name, fn, thisArg) {
      var id = nextId();
      if (type === "feature") {
        _defs.features[id] = {
          id: id,
          name: name,
          fn: fn,
          thisArg: thisArg
        };
      }
      if (type === "scenario") {
        _defs.scenarios[id] = {
          id: id,
          name: name,
          fn: fn,
          thisArg: thisArg
        };
      }
      if (type === "step") {
        _defs.steps[id] = {
          id: id,
          name: name,
          fn: fn,
          thisArg: thisArg
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

  /**
   * apply definition to describe() or it()
   * @param {object} feature given from .feature
   * @param {function} definitionFn given from .test.js
   * @param {array} args given by matching feature.name with definitionFn.regExp
   */
  Gherkin.prototype.applyDefinition = function applyDefinition(feature, definitionFn, args) {
    function enveloper() { // enveloper function to pass to describe process
      console.log("enveloper" + feature.type, feature.name);
       // TODO> how to determinate if definitionFn has the last parametr as done?
      return definitionFn.apply(null, args); // TODO> define a world context by default. And override the context if neccessary
    }
    describe(feature.name, enveloper); // send to describe the final version for definitionFn enveloped into an enveloper
    if (feature.hasOwnProperty('scenarioDefinitions')) {
      feature.scenarioDefinitions.forEach(this.processScenario, this); // and then let's search for this feature its scenarios
    }
    else if (feature.hasOwnProperty('steps')) {
      feature.steps.forEach(this.processStep, this);
    }
  }
  
  /**
   * applying (object)feature.name against the regexp (feature)definition.(regexp)name
   * in order to define the args and define the fn
   * @param {object} feature - a feature from parsing the .feature file
   * @param {object} definition - a definition given by using feature(regexp|string, function)
   * @return {function} definitionFn, {array}args
   */
  Gherkin.prototype.match = function match(feature, definition) {
    var definitionFn = undefined,
        args = undefined;
    if (definition.name.constructor === RegExp) {
      args = definition.name.exec(feature.name);
      if (args) { // the given regexp seems to fit the feature.name
        // seems that I need to study how to match strings to regexp
        if (args[0] === feature.name) { // because here I do an strange comparison
          args = args.slice(1); // and then eliminate the first element
        }
        definitionFn = definition.fn;
      }
    }
    // just define the fn
    else if (definition.name.constructor === String) {
      if (definition.name === feature.name) {
        definitionFn = definition.fn;
      }
    }
    // show error if nothing was found
    else {
      console.error('undefined type to identify the', feature.type, feature.name, ". This should be a regexp or an string object");
    }
    return {
      definitionFn: definitionFn,
      args: args
    };
  }
  
  // TODO> take care about the thisArg context parameter for all the following functions
  Gherkin.prototype.feature = function feature(name, fn, thisArg) {
    this.addDefinition("feature", name, fn, thisArg);
  };
  
  Gherkin.prototype.scenario = function scenario(name, fn, thisArg) {
    this.addDefinition("scenario", name, fn, thisArg);
  };
  
  Gherkin.prototype.step = function step(name, fn, thisArg) {
    this.addDefinition("step", name, fn, thisArg);
  };
  
  Gherkin.prototype.given = function given(name, fn, thisArg) {
    this.addDefinition("step", name, fn, thisArg);
  };
  
  Gherkin.prototype.when = function when(name, fn, thisArg) {
    this.addDefinition("step", name, fn, thisArg);
  };
  
  Gherkin.prototype.then = function then(name, fn, thisArg) {
    this.addDefinition("step", name, fn, thisArg);
  };
  
  // TODO> unify the way to execute processFeature and processScenario and take care when call "it" and when "describe"
  Gherkin.prototype.processStep = function processStep(step) {
    var definitions = this.getDefinitions().steps,
        item, args, definitionFn, result;
    for (item in definitions) {
      step.name = step.text;
      result = this.match(step, definitions[item]);
      definitionFn = result.definitionFn;
      args = result.args;
      
      if (definitionFn) { // if definitionFn found
        function enveloper() { // enveloper function to pass to it process 
          console.log("enveloperStep", step.text);
          return definitionFn.apply(null, args); // TODO> define a world context by default. And override the context if neccessary
        }
        it(step.text, enveloper); // send to it the final version for definitionFn enveloped into an enveloper
        return;
      }
      else {
        // TODO> make the standard format for this warning
        karma.log('WARNING', ["Step not found", step.text]);
      }
    }
  }
  
  // TODO> unify the way to execute processFeature and processScenario
  Gherkin.prototype.processScenario = function processScenario(definition) {
    var definitions = this.getDefinitions().scenarios,
        item, args, definitionFn, result;
    for (item in definitions) {
      result = this.match(definition, definitions[item]);
      definitionFn = result.definitionFn;
      args = result.args;
      
      if (definitionFn) { // if definitionFn found
        return this.applyDefinition(definition, definitionFn, args);
      }
      else {
        // TODO> make the standard format for this warning
        karma.log('WARNING', ["Scenario not found", definition.name]);
      }
    }
  }
  
  // TODO> identify what steps are being executed and refactor them
  Gherkin.prototype.processDefinition = function processDefinition(definition) {
    var definitions = this.getDefinitions().features,
        item, args, definitionFn, result;
    
    // run for every (definition)definition
    for (item in definitions) {
      result = this.match(definition, definitions[item]);
      definitionFn = result.definitionFn;
      args = result.args;
      
      // if definitionFn found
      if (definitionFn) {
        return this.applyDefinition(definition, definitionFn, args);
      }
      else {
        // TODO> make the standard format for this warning
        karma.log('WARNING', [definition.type, "not found", definition.file.path, definition.name]);
      }
    }
  }
  
  Gherkin.prototype.run = function run() {
    this.getFeatures().forEach(this.processDefinition, this);
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
   * @param {Object} thisArg
   */
  window.feature = function feature(name, fn, thisArg) {
    return gherkin.feature(name, fn, thisArg);
  }
  /**
   * Function to define an scenario
   * @param {String|RegExp} name
   * @param {bodyTestFn} fn
   * @param {Object} thisArg
   */
  window.scenario = function scenario(name, fn, thisArg) {
    return gherkin.scenario(name, fn, thisArg);
  }
  /**
   * Function to define an step.
   * @param {String|RegExp} name
   * @param {bodyTestFn} fn
   * @param {Object} thisArg
   */
  window.step = function step(name, fn, thisArg) {
    return gherkin.step(name, fn, thisArg);
  }
  /**
   * Function to define a given step.
   * @param {String|RegExp} name
   * @param {bodyTestFn} fn
   * @param {Object} thisArg
   */
  window.given = function given(name, fn, thisArg) {
    return gherkin.given(name, fn, thisArg);
  }
  /**
   * Function to define a when step.
   * @param {String|RegExp} name
   * @param {bodyTestFn} fn
   * @param {Object} thisArg
   */
  window.when = function when(name, fn, thisArg) {
    return gherkin.when(name, fn, thisArg);
  }
  /**
   * Function to define a then step.
   * @param {String|RegExp} name
   * @param {bodyTestFn} fn
   * @param {Object} thisArg
   */
  window.then = function then(name, fn, thisArg) {
    return gherkin.then(name, fn, thisArg);
  }
  
})(typeof window !== 'undefined' ? window : global);