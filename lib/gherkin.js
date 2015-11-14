'use strict';
(function(window) {
  
  function Gherkin() {}

  Gherkin.prototype.feature = function feature() {
    console.log('defining a feature');
  };
  
  Gherkin.prototype.processFeature = function processFeature(feature) {
    console.log("running a feature", feature);
  };
  
  var gherkin = new Gherkin();
  window.gherkin = gherkin;
  window.feature = gherkin.feature;

})(typeof window !== 'undefined' ? window : global);