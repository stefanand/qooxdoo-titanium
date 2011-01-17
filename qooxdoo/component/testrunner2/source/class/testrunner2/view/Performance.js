qx.Class.define("testrunner2.view.Performance", {

  extend : testrunner2.view.Console,
  
  properties :
  {
    profile :
    {
      check : "Boolean",
      init : true
    }
  },
  
  construct : function()
  {
    this.base(arguments);
    var profileToggle = qx.bom.Input.create("checkbox", {id: "profile", checked : "checked"});
    document.body.appendChild(profileToggle);
    document.body.innerHTML += '<label for="profile">Enable console profiling</label><br/>';
    document.body.innerHTML += '<input type="submit" id="qxtestrunner_run" value="Run Tests"></input><br/>';
    
    var cb = document.getElementById("profile");
    qx.event.Registration.addListener(cb, "change", function(ev) {
      var value = ev.getData();
      this.setProfile(value);
    }, this);
    
    var runButton = document.getElementById("qxtestrunner_run");
    qx.event.Registration.addListener(runButton, "click", function(ev) {
      this.fireEvent("runTests");
    }, this);
  },
  
  members :
  {
    _onTestChangeState : function(testResultData)
    {
      // No log output needed
    },

    
    __measurements : [],
    
    logMeasurement : function(clazz, msg, iterations, ownTime, renderTime) {
      this.__measurements.push([clazz, msg, iterations, ownTime, renderTime].join("; "));
    },
    
    
    _applyTestSuiteState : function(value, old)
    {
      switch(value) 
      {
        case "loading" :
          console.log("Loading tests");
          break;
        case "ready" :
          console.log("Test suite ready");
          break;
        case "running":
          console.log("Running tests...");
          break;
        case "error" :
          console.log("Couldn't load test suite!");
          break;
        case "finished" :
          console.log(this.__measurements.join("\n"));
          break;
      };
    }
  }
  
});