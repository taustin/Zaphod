var Zaphod = {
  RESET_ON_SHUTDOWN: true,
  init: function() {
    var appcontent = document.getElementById("appcontent");
    if(appcontent) {
      appcontent.addEventListener("DOMContentLoaded", Zaphod.onPageLoad, true);
    }

    // Initialize mozJSPref so that it can be used to disable SpiderMonkey
    var Cc = Components.classes;
    var Ci = Components.interfaces;
    var prefSrv = this.prefService = Cc["@mozilla.org/preferences-service;1"]
        .getService(Ci.nsIPrefService).QueryInterface(Ci.nsIPrefBranch);
    var PBI = Ci.nsIPrefBranch2;
    Zaphod.mozJSPref = prefSrv.getBranch("javascript.").QueryInterface(PBI);

    // Get icon
    Zaphod.statusImage = document.getElementById("narcissus-logo");

    // Initialize engine and icons
    if (Zaphod.isActive()) {
      Zaphod.setNarcissusAsEngine();
    }
    else {
      Zaphod.setSpidermonkeyAsEngine();
    }
  },

  // Reset spidermonkey as the JS engine on shutdown.
  shutdown: function() {
    if (Zaphod.RESET_ON_SHUTDOWN) { Zaphod.setSpidermonkeyAsEngine(); }
  },

  // Listener for uninstallation of this plugin
  uninstallationListener: {
    onUninstalling: function(addon) {
      if (addon.id == "zaphod@mozilla.com") {
        // Reset spidermonkey as the JS engine.
        Zaphod.setSpidermonkeyAsEngine(true);
      }
    }
  },

  // Set Narcissus to be used as the JS engine
  setNarcissusAsEngine: function(verbose) {
    Zaphod.statusImage.src = "chrome://zaphod/content/mozilla_activated.ico";
    Zaphod.statusImage.tooltipText = "JS engine = Narcissus";
    Zaphod.mozJSPref.setBoolPref("enabled", false);
    if (verbose) { alert("Narcissus has been set as your JavaScript engine"); }
  },

  // Set Spidermonkey to be used as the JS engine
  setSpidermonkeyAsEngine: function(verbose) {
    Zaphod.statusImage.src = "chrome://zaphod/content/mozilla_deactivated.ico";
    Zaphod.statusImage.tooltipText = "JS engine = SpiderMonkey";
    Zaphod.mozJSPref.setBoolPref("enabled", true);
    if (verbose) { alert("SpiderMonkey has been reset as your JavaScript engine"); }
  },

  // Assumes that Narcissus is the JS engine if javascript is disabled.
  isActive: function() {
    return !Zaphod.mozJSPref.getBoolPref("enabled");
  },

  // Switch between narcissus and spidermonkey as the JS engine
  toggleJSEngine: function() {
    if (Zaphod.isActive()) {
      Zaphod.setSpidermonkeyAsEngine(true);
    }
    else {
      Zaphod.setNarcissusAsEngine(true);
    }

  },

  // Parse a JS url and return a string of the body
  snarf: function(url) {
    var lastInd = content.location.href.lastIndexOf('/');
    var baseUrl = (lastInd > 0) ?
        content.location.href.substring(0,lastInd) :
        content.location.href;

    var Cc = Components.classes;
    var Ci = Components.interfaces;
    var xhrClass = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"];

    var req = xhrClass.createInstance(Ci.nsIXMLHttpRequest);
    // TODO: need a better way to determine if the JS url is relative.
    if (url.indexOf('://') === -1) {
      url = baseUrl + '/' + url;
    }
    req.open('GET', url, false);
    req.send(null);
    if (req.status !== 200) {
      throw new Error("Error loading " + url);
    }
    return req.responseText;
  },

  // Load and execute the specified JS url
  loadExternalScript: function(url) {
    Narcissus.interpreter.evaluate(Zaphod.snarf(url), url, 1);
  },


  // Run a JS command through Narcissus
  runSnippet: function() {
    var code = prompt("Please enter some Narcissus JavaScript code");
    try {
      Narcissus.interpreter.evaluate(code);
    }
    catch(e) {
      alert("Error evaluating code: " + e);
    }
  },

  // Run the src attribute and the body of the specified script node
  runScript: function(script) {
    let src = script.getAttribute('src');
    try {
      if (src) {
        Zaphod.loadExternalScript(src);
      }
      if (script['firstChild']) {
        Narcissus.interpreter.evaluate(script['firstChild'].data);
      }
    }
    catch (e) {
      if (this.console) { console.debug("NARCISSUS ERROR: " + e); }
    }

  },

  // Run only scripts where the type specifies narcissus
  runNarcissusScripts: function() {
    var scripts = content.document.getElementsByTagName('script');
    for (var i=0; i<scripts.length; i++) {
      let script = scripts[i];
      if (Zaphod.isNarcissusType(script.getAttribute('type'))) {
        Zaphod.runScript(script);
      }
    }
  },

  // Run all scripts on the page, regardless of the specified type
  runAllScripts: function() {
    var scripts = content.document.getElementsByTagName('script');
    for (var i=0; i<scripts.length; i++) {
      Zaphod.runScript(scripts[i]);
    }
  },

  // Set listeners to use Narcissus
  handleListeners: function() {
    var actions = [ 'abort', 'blur', 'change', 'click', 'dblclick', 'error',
        'focus', 'keydown', 'keypress', 'keyup', 'load', 'mousedown', 'mouseup',
        'mouseout', 'mouseover', 'mousemove', 'reset', 'resize', 'select', 'submit', 'unload' ];
    var elems = content.document.getElementsByTagName('*');
    for (var i=0; i<elems.length; i++) {
      let elem = elems[i];
      for (let j=0; j<actions.length; j++) {
        let action = actions[j];
        if (elem.getAttribute('on' + action)) {
          (function() {
            let code = elem.getAttribute('on' + action);
            // Add ids to elements with listeners that currently do not have ids
            if (!elem.id) {
              let newID = Zaphod.generateUniqueId();
              elem.setAttribute('id', newID);
            }
            // TODO: figure out what variables should be available.  All from elem?
            let f = '(function() { var style=this.style; ' + code + '}).apply(' + elem.id + ');';
            //let f = '(function() { with (' + elem.id + ') {' + code + '}).apply(' + elem.id + ');';
            let fun = function(evnt){
              Narcissus.interpreter.global.event = evnt;
              Narcissus.interpreter.evaluate(f);
              Narcissus.interpreter.global.event = undefined;
            };
            elem.addEventListener(action,
                fun,
                false);
            /*Zaphod.registeredListeners.push({
                  elem: elem,
                  action: action,
                  fun: fun});*/
            // Fire load actions immediately
            if (action === "load") {
              fun();
            }
          })();
        }
      }
    }
  },

  // Generate unique ids for tagging elements without ids
  generateUniqueId: function() {
    var id=0;
    return function() {
      return "narcUid" + id++;
    }
  }(),

  // Return true if the page explicitly sets the default script type to 'text/narcissus'
  isPageScriptEngine: function() {
    var metaElems = content.document.getElementsByTagName('meta');
    for (var i=0; i<metaElems.length; i++) {
      var elem = metaElems[i];
      if (elem.getAttribute('http-equiv') === "Content-Script-Type"
          && Zaphod.isNarcissusType(elem.getAttribute('content'))) {
        return true;
      }
    }
    return false;
  },

  // Return true if the script tag specifies narcissus
  isNarcissusType: function(scriptType) {
    return scriptType === "application/narcissus" || scriptType === "text/narcissus";
  },

  // Create a handler to search for child elements for unknown properties
  createElementHandler: function(elem) {
    var handler = Narcissus.definitions.makePassthruHandler(elem);
    handler.has = function(name) {
      if (name in elem) { return true; }

      var children = elem.getElementsByTagName('*');
      for (let i=0; i<children.length; i++) {
        let child = children[i];
        if (child.name === name) {
          return true;
        }
      }
      return false;
    }
    handler.get = function(receiver, name) {
      if (elem[name]) {
        if (Narcissus.definitions.isNativeCode(elem[name])) {
          return function() { return elem[name].apply(elem, arguments); };
        }
        else return elem[name];
      }

      var matches = [];
      var children = elem.getElementsByTagName('*');
      for (let i=0; i<children.length; i++) {
        let child = children[i];
        if (child.name === name) {
          matches.push(child);
        }
      }
      switch (matches.length) {
        case 0:
          return undefined;
        case 1:
          return Proxy.create(Zaphod.createElementHandler(matches[0]));
        default:
          return matches;
      }
    }
    return handler;
  },

  onPageLoad: function(aEvent) {
    //Zaphod.registeredListeners = [];

    Narcissus.interpreter.resetEnvironment();

    var documentHandler = Zaphod.createElementHandler(content.document);
    Narcissus.interpreter.global.document = Proxy.create(documentHandler);

    Narcissus.interpreter.evaluate("window = this");

    Narcissus.definitions.noPropFound = function(name) {
      var value = content.document.getElementById(name);
      if (value) {
        return Proxy.create(Zaphod.createElementHandler(value));
      }
      else return undefined;
    }

    // Execute the JS on the page with Narcissus, if it is the specified engine.
    if (Zaphod.isActive() || Zaphod.isPageScriptEngine()) {
      Zaphod.runAllScripts();
      Zaphod.handleListeners();
    }
    // Otherwise only load the scripts that are explicitly set to use Narcissus.
    else {
      Zaphod.runNarcissusScripts();
    }
  },

  onPageUnload: function(aEvent) {
    /*
    for (let i=0; i<Zaphod.registeredListeners; i++) {
      let listener = Zaphod.registeredListeners[i];
      if (listener.action === 'unload') {
        fun();
      }
    }
    */
  }
}

window.addEventListener('load', function() { Zaphod.init(); }, false);
window.addEventListener('unload', function() { Zaphod.shutdown(); }, false);

window.addEventListener('pagehide', Zaphod.onPageUnload, false);

// Add listener for uninstalling this plugin
try {
  Components.utils.import("resource://gre/modules/AddonManager.jsm");
  AddonManager.addAddonListener(uninstallationListener);
}
catch (e) {}

