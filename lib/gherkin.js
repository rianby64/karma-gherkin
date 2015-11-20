'use strict';
(function(window) {

  var CONST_FEATURE = "feature",
      CONST_SCENARIO = "scenario",
      CONST_STEP = "step",
      CONST_WHEN = "when",
      CONST_THEN = "then",
      CONST_GIVEN = "given";

  /**
   * Private class.
   * @class Gherkin
   */
  function Gherkin() {
    var _defs = {
      features: {},
      scenarios: {},
      steps: {}
    },
        _features = [],
        lastFeatureId = 0,
        lastScenarioId = 0,
        lastStepId = 0;

    /**
     * Add a definition to the stack.
     * @param {RegExp, String} name - The identificator to match with a defition from .feature content.
     * @param {Function} fn - The function that will be executed.
     * @param {Object} thisArg.
     * @param {String} type - can be one of the values "feature", "scenario" or "step"
     */
    function addDefinition(type, name, fn, thisArg) {
      if (type === CONST_FEATURE) {
        _defs.features[fn.featureId] = {
          id: fn.featureId,
          name: name,
          fn: function getFeatureParentId() {
            lastScenarioId = lastStepId = 0;
            var featureId = ++lastFeatureId;
            return {
              fn: fn,
              featureId: featureId,
              type: type
            };
          },
          thisArg: thisArg
        };
      }
      if (type === CONST_SCENARIO) {
        _defs.scenarios[fn.scenarioId] = {
          id: fn.scenarioId,
          name: name,
          fn: function getScenarioIdParentId() {
            lastStepId = 0;
            var featureId = lastFeatureId,
                scenarioId = ++lastScenarioId;
            return {
              fn: fn,
              featureId: featureId,
              scenarioId: scenarioId,
              type: type
            };
          },
          thisArg: thisArg
        };
      }
      if (type === CONST_STEP) {
        _defs.steps[fn.stepId] = {
          id: fn.stepId,
          name: name,
          fn: function getStepParentId() {
            var featureId = lastFeatureId,
                scenarioId = lastScenarioId,
                stepId = ++lastStepId;
            return {
              fn: fn,
              featureId: featureId,
              scenarioId: scenarioId,
              stepId: stepId,
              type: type
            };
          },
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
      console.log(definitionFn.parent, "parent");
       // TODO> how to determinate if definitionFn has the last parametr as done?
      return definitionFn.apply(null, args); // TODO> define a world context by default. And override the context if neccessary
    }
    describe(feature.name, enveloper); // send to describe the final version for definitionFn enveloped into an enveloper
    if (feature.hasOwnProperty('scenarioDefinitions')) {
      function appendFilePath(scenario) {
        scenario.file = feature.file;
        return this.processDefinition(CONST_SCENARIO, scenario);
      }
      feature.scenarioDefinitions.forEach(appendFilePath, this); // and then let's search for this feature its scenarios
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
    var parent, definitionFn, args;
    if (definition.name.constructor === RegExp) {
      args = definition.name.exec(feature.name);
      if (args) { // the given regexp seems to fit the feature.name
        // seems that I need to study how to match strings to regexp
        if (args[0] === feature.name) { // because here I do an strange comparison
          args = args.slice(1); // and then eliminate the first element
        }
        parent = definition.fn();
      }
    }
    // just define the fn
    else if (definition.name.constructor === String) {
      if (definition.name === feature.name) {
        parent = definition.fn();
      }
    }
    // show error if nothing was found
    else {
      console.error('undefined type to identify the', feature.type, feature.name, ". This should be a regexp or an string object");
    }

    if (parent) {
      console.log("matched", parent);
      definitionFn = parent.fn;
      definitionFn.parent = parent;
      return {
        definitionFn: definitionFn,
        args: args
      };
    }
    return;
  }

  // TODO> unify the way to execute processFeature and processScenario and take care when call "it" and when "describe"
  Gherkin.prototype.processStep = function processStep(step) {
    var definitions = this.getDefinitions().steps,
        item, args, definitionFn, result;
    for (item in definitions) {
      step.name = step.text;
      result = this.match(step, definitions[item]);

      if (!result) {
        continue;
      }

      definitionFn = result.definitionFn;
      args = result.args;

      if (definitionFn) { // if definitionFn found
        function enveloper() { // enveloper function to pass to it process
          console.log("enveloperStep", step.text);
          console.log(definitionFn.parent, "parent");
          return definitionFn.apply(null, args); // TODO> define a world context by default. And override the context if neccessary
        }
        it(step.text, enveloper); // send to it the final version for definitionFn enveloped into an enveloper
        return;
      }
    }

    // If no definition matchet at all
    if (!definitionFn) {
      // TODO> make the standard format for this warning
      console.log('WARNING Step:"' + step.text + '" not found');
    }
  }

  // TODO> identify what steps are being executed and refactor them
  Gherkin.prototype.processDefinition = function processDefinition(type, definition) {
    var definitions, item, args, definitionFn, result;
    if (type === CONST_FEATURE) {
      definitions = this.getDefinitions().features;
    }
    else if (type === CONST_SCENARIO) {
      definitions = this.getDefinitions().scenarios;
    }
    else {
      console.error("Type:" + type + ', undefined while processing "' + definition.name + '" at ' + definition.file.path);
    }
    // run for every (definition)definition
    for (item in definitions) {
      result = this.match(definition, definitions[item]);

      if (!result) {
        continue;
      }

      definitionFn = result.definitionFn;
      args = result.args;

      // if definitionFn found
      if (definitionFn) {
        return this.applyDefinition(definition, definitionFn, args);
      }

    }

    // If no definition matchet at all
    if (!definitionFn) {
      // TODO> make the standard format for this warning
      console.log('WARNING:' + definition.type + '" not found "' + definition.name + '" ' + definition.file.path);
    }
  }

  Gherkin.prototype.run = function run() {
    this.getFeatures().forEach(this.processDefinition.bind(this, CONST_FEATURE), this);
  }

  Gherkin.prototype.loadFeature = function loadFeature(feature, file) {
    feature.file = file;
    this.addFeature(feature);
  };

  // TODO> take care about the thisArg context parameter for all the following functions
  Gherkin.prototype.feature = function feature(name, fn, thisArg) {
    return this.addDefinition(CONST_FEATURE, name, fn, thisArg);
  };

  Gherkin.prototype.scenario = function scenario(name, fn, thisArg) {
    return this.addDefinition(CONST_SCENARIO, name, fn, thisArg);
  };

  Gherkin.prototype.step = function step(name, fn, thisArg) {
    return this.addDefinition(CONST_STEP, name, fn, thisArg);
  };

  Gherkin.prototype.given = function given(name, fn, thisArg) {
    return this.addDefinition(CONST_STEP, name, fn, thisArg);
  };

  Gherkin.prototype.when = function when(name, fn, thisArg) {
    return this.addDefinition(CONST_STEP, name, fn, thisArg);
  };

  Gherkin.prototype.then = function then(name, fn, thisArg) {
    return this.addDefinition(CONST_STEP, name, fn, thisArg);
  };

  window.Gherkin = Gherkin;
})(typeof window !== 'undefined' ? window : global);
