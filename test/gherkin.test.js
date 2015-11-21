'use strict';
/** TODO> Include some test for lib/gherkin.js
 * For example:
 *  - load the module into an environment that already has a gherkin variable defined
 *  - test if feature, scenario, step's name like string are being matched with a test definition
 *  - test if feature, scenario, step's name like regexp are being matched with a test definition
 *  - test the expected behavoiur>
 *     if a feature(...) contains an scenario and in another place an scenario was written as stand-alone definition
 *     then the stand-alone definition becomes a global definition and the scenario inside the feature belongs
 *     to the feature
 *  - do not accept recursive features, scenarios nor steps!
 */


/**
 * One added a Definition must know who is calling it, and when the runner is the caller then its parent is null
 *  Example:
 *
feature('name1', function featureName1() {
  feature('incorrectEmbeddedFeature1', function incorrectEmbeddedFeature1() { }); // not allowed
  scenario('name2', function scenarioName2() {
    feature('incorrectEmbeddedFeature2', function incorrectEmbeddedFeature2() { }); // not allowed
    scenario('incorrectEmbeddedScenario1', function incorrectEmbeddedScenario1() { }); // not allowed
    step('name3', function stepName3() {
      feature('incorrectEmbeddedFeature3', function incorrectEmbeddedFeature3() { }); // not allowed
      scenario('incorrectEmbeddedScenario2', function incorrectEmbeddedScenario2() { }); // not allowed
      step('incorrectEmbeddedStep1', function incorrectEmbeddedStep1() { }); // not allowed
    }); // stepName3.caller = { fn: scenarioName2, type: 'scenario' }
  }); // scenarioName2.caller = { fn: featureName1, type: 'feature' } // [[this definition can be step too]]
}); // featureName1.caller = null // [[this definition can be scenario or step too]]

gherkin.definitions = {
  0: {
    fn: featureName1,
    name: 'name1',
    type: 'feature',
    definitions: {
      0: {
        fn: scenarioName1,
        name: 'name1',
        type: 'scenario',
        definitions: {
          0: {
            fn: stepName1,
            name: 'name1',
            type: 'step'
            // definitions is undefined
          },
          1: {
            fn: stepName2,
            name: 'name2',
            type: 'step'
            // definitions is undefined
          }
        }
      },
      1: {
        fn: scenarioName1,
        name: 'name1',
        type: 'scenario',
        definitions: {}
      }
    }
  },
  1: {
    fn: featureName1,
    name: 'name2',
    type: 'feature',
    definitions: {}
  }
} // after running the feature-driven process
 *
 */
describe("The construction of embedded definitions", function() {

  describe("Has an interface that", function() {
    beforeEach(function() {
      window.gherkin = new Gherkin();
    });

    it("contains> feature(name, fn, thisArg)", function() {
      expect(gherkin.feature instanceof Function).toBe(true);
      expect(gherkin.feature.length).toBe(3);
    });
    it("contains> scenario(name, fn, thisArg)", function() {
      expect(gherkin.scenario instanceof Function).toBe(true);
      expect(gherkin.scenario.length).toBe(3);
    });
    it("contains> step(name, fn, thisArg)", function() {
      expect(gherkin.step instanceof Function).toBe(true);
      expect(gherkin.step.length).toBe(3);
    });

    it("contains> definitions()", function() {
      expect(gherkin.definitions instanceof Function).toBe(true);
      var definitions = gherkin.definitions();
      expect(definitions instanceof Object).toBe(true);
    })

    // TODO> check if name, fn and thisArg are regExp|string, function and object|undefined types
  })
});
