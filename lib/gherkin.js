'use strict';
(function(window) {

  var CONST_FEATURE = "Feature",
      CONST_SCENARIO = "Scenario",
      CONST_STEP = "step",
      CONST_WHEN = "when",
      CONST_THEN = "then",
      CONST_GIVEN = "given";

  /**
   * Private class.
   * @class Gherkin
   */
  function Gherkin() {
    var _definitions = {},
        _features = [],
        _parent;

    function setParent(parent) {
      _parent = parent;
    }
    function getParent() {
      return _parent;
    }

    /**
     * Add a definition to the stack.
     * @param {RegExp, String} name - The identificator to match with a defition from .feature content.
     * @param {Function} fn - The function that will be executed.
     * @param {Object} thisArg.
     * @param {String} type - can be one of the values "feature", "scenario" or "step"
     */
    function addDefinition(type, name, fn, thisArg) {
      var definitions,
          id,
          parent = getParent();

      console.log();
      console.log();
      console.log(type, name, fn, thisArg, "addDefinition", parent);
      console.log();
      console.log();

      if ((type === CONST_FEATURE) || (type === CONST_SCENARIO)) {
        definitions = {};
      }

      if (type === CONST_FEATURE) { id = fn.featureId; }
      else if (type === CONST_SCENARIO) { id = fn.scenarioId; }
      else { id = fn.stepId; }

      if (parent) {
        parent.definitions[id] = {
          id: id,
          name: name,
          type: type,
          fn: fn,
          thisArg: thisArg,
          definitions: definitions
        }
      }
      else {
        _definitions[id] = {
          id: id,
          name: name,
          type: type,
          fn: fn,
          thisArg: thisArg,
          definitions: definitions
        }
      }
    }

    function getDefinitions() {
      return _definitions;
    }

    function addFeature(feature) {
      _features.push(feature)
    }

    function getFeatures() {
      return _features;
    }

    function reset() {
      _definitions = {};
      _features = [];
      _parent = undefined;
    }

    this.addDefinition = addDefinition;
    this.addFeature = addFeature;

    this.getDefinitions = getDefinitions;
    this.getFeatures = getFeatures;

    this.setParent = setParent;
    this.getParent = getParent;
    this.reset = reset;
  }

  /**
   * apply definition to describe() or it()
   * @param {object} feature given from .feature
   * @param {function} definitionFn given from .test.js
   * @param {array} args given by matching feature.name with definitionFn.regExp
   */
  Gherkin.prototype.applyDefinition = function applyDefinition(feature, definition, args) {
    var that = this,
        currentParent = this.getParent();

    console.log(feature, definition, args, currentParent, "START applyDefinition");

    function enveloper() { // enveloper function to pass to describe process
      console.log("enveloper" + feature.type, feature.name);
      //console.log(definitionFn.parent, "parent");
       // TODO> how to determinate if definitionFn has the last parametr as done?
      that.setParent(definition);
      return definition.fn.apply(null, args); // TODO> define a world context by default. And override the context if neccessary
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
    this.setParent(currentParent);
  }

  /**
   * applying (object)feature.name against the regexp (feature)definition.(regexp)name
   * in order to define the args and define the fn
   * @param {object} feature - a feature from parsing the .feature file
   * @param {object} definition - a definition given by using feature(regexp|string, function)
   * @return {function} definitionFn, {array}args
   */
  Gherkin.prototype.match = function match(feature, definition) {
    var result, args;
    if (definition.name.constructor === RegExp) {
      args = definition.name.exec(feature.name);
      if (args) { // the given regexp seems to fit the feature.name
        // seems that I need to study how to match strings to regexp
        if (args[0] === feature.name) { // because here I do an strange comparison
          args = args.slice(1); // and then eliminate the first element
        }
        result = definition;
      }
    }
    // just define the fn
    else if (definition.name.constructor === String) {
      if (definition.name === feature.name) {
        result = definition;
      }
    }
    // show error if nothing was found
    else {
      console.error('undefined type to identify the', feature.type, feature.name, ". This should be a regexp or an string object");
    }

    if (result) {
      //console.log("matched", parent);
      return {
        definition: result,
        args: args
      };
    }
    return;
  }

  // TODO> unify the way to execute processFeature and processScenario and take care when call "it" and when "describe"
  Gherkin.prototype.processStep = function processStep(step) {
    var definitions, item, args, definitionFn, result, parent = this.getParent();

    if (parent) {
      definitions = parent.definitions;
    }
    else {
      // TODO> Search program to go upper than current parent!
      definitions = this.getDefinitions();
    }

    for (item in definitions) {
      step.name = step.text;
      result = this.match(step, definitions[item]);

      if (!result) {
        continue;
      }

      definitionFn = result.definition.fn;
      args = result.args;

      if (definitionFn) { // if definitionFn found
        function enveloper() { // enveloper function to pass to it process
          //console.log("enveloperStep", step.text);
          //console.log(definitionFn.parent, "parent");
          return definitionFn.apply(null, args); // TODO> define a world context by default. And override the context if neccessary
        }
        it(step.text, enveloper); // send to it the final version for definitionFn enveloped into an enveloper
        return;
      }
    }

    // If no definition matchet at all
    if (!result) {
      // TODO> make the standard format for this warning
      console.error('WARNING Step:"' + step.text + '" not found');
    }
  }

  // TODO> identify what steps are being executed and refactor them
  Gherkin.prototype.processDefinition = function processDefinition(type, definition) {
    var definitions, item, args, definitionFn, result, parent = this.getParent();

    if (parent) {
      definitions = parent.definitions;
    }
    else {
      // TODO> Search program to go upper than current parent!
      definitions = this.getDefinitions();
    }
    console.log(type, definition, "START [[processDefinition]]");

    // run for every (definition)definition
    for (item in definitions) {
      result = this.match(definition, definitions[item]);

      if (!result) {
        continue;
      }

      console.log(result, "@@@ result = this.match(definition, definitions[item]) @@@ [[processDefinition]]");

      // if definitionFn found
      if (result) {
        console.log("entering in applyDefinition");
        return this.applyDefinition(definition, result.definition, result.args);
      }

    }
    // If no definition matchet at all
    if (!result) {
      console.log("!!");
      console.log("!!");
      console.log("!!");
      console.log("!!");
      console.log(this.getDefinitions());
      console.log("!!");
      console.log("!!");
      console.log("!!");
      console.log("!!");
      // TODO> make the standard format for this warning
      console.log('WARNING:' + definition.type + '" not found "' + definition.name + '" ' + definition.file.path);
    }
  }

  Gherkin.prototype.run = function run() {
    console.log("RUN!")
    this.getFeatures().forEach(this.processDefinition.bind(this, CONST_FEATURE), this);
    console.log("PARENT MUST BE UNDEFINED", this.getParent());
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
