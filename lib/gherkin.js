'use strict';
(function(window) {
  function Gherkin() {}

  Gherkin.prototype.feature = function feature() {
    console.log('defining a feature');
  };
  
  Gherkin.prototype.processFeature = function processFeature(feature) {
    console.log("running a feature");
  };
  
  var gherkin = new Gherkin();
  window.gherkin = gherkin;
  window.feature = gherkin.feature;
  
  // save the link to the initial __karma__.loaded function
  var initLoadedFn = window.__karma__.loaded;
  // re-define __karma__.loaded function
  window.__karma__.loaded = function() {
    console.log('loaded after all'); // after load everything, lets run the features
    initLoadedFn.call(window.__karma__); // execute that initial __karma.loaded function
  }
})(typeof window !== 'undefined' ? window : global);