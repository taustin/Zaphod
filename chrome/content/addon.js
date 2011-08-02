/* -*- Mode: JS; tab-width: 2; indent-tabs-mode: nil; -*-
 * vim: set sw=2 ts=2 et tw=100:*/
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

  log: function(msg) {
    //Components.utils.reportError(msg);
    var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
          .getService(Components.interfaces.nsIConsoleService);
    consoleService.logStringMessage("Zaphod: " + msg);
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
    Zaphod.log('Running script from ' + url);
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
      Components.utils.reportError(e);
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
    /*///// Is 'has' needed?
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
    //*///////////
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

  // Reads a file from the chrome code and returns a string of its contents
  read: function(file) {
    var ioService=Components.classes["@mozilla.org/network/io-service;1"]
        .getService(Components.interfaces.nsIIOService);
    var scriptableStream=Components
        .classes["@mozilla.org/scriptableinputstream;1"]
        .getService(Components.interfaces.nsIScriptableInputStream);

    var channel=ioService.newChannel(file,null,null);
    var input=channel.open();

    scriptableStream.init(input);
    var str=scriptableStream.read(input.available());
    scriptableStream.close();
    input.close();

    return str;
  },

  // Creates a deep clone of the host node into the dom.js node
  /*cloneDocument: function(doc) {
    //var cmd = '';

    // Builds a string to evaluate with Narcissus
    function cloneNodeStr(n) {
      var cmd = '', i;
      if (!n.nodeType) return '';
      Zaphod.log('Copying ' + n.nodeName);
      cmd += '(function(){';
      // Builds string to evaluate
      switch (n.nodeType) {
        case Node.ELEMENT_NODE:
          cmd += 'var n' + ' = document.createElement(' + n.nodeName + ');'
          for(i = 0, len = n.attributes.length; i < len; i++) {
            var a = n.attributes[i];
            //cmd += 'n.setAttributeNS(' + a.namespaceURI + ',' + a.qname + ',' + a.value + ');';
          }
          cmd += 'var oldP = this.parnt;';
          cmd += 'var parnt = n;';
          for (i in n.childNodes) {
            cmd += cloneNodeStr(n.childNodes[i]);
          }
          cmd += 'parnt = oldP';
          cmd += 'parnt.appendChild(n);';
          break;
        case Node.TEXT_NODE:
          cmd += 'parnt.appendChild(document.createTextNode(' + n.data + '));';
          break;
        case Node.COMMENT_NODE:
          cmd += 'parnt.appendChild(document.createComment(' + n.data + '));';
          break;
        case Node.PROCESSING_INSTRUCTION_NODE:
          cmd += 'parnt.appendChild(document.createProcessingInstruction(';
          cmd += n.target + ',' + n.data + '));';
          break;
        case Node.DOCUMENT_TYPE_NODE:
          // do nothing for now
          break;
        default:
          throw new Error("Unexpected node type in copyNodes: " + n.nodeType);
      }
      cmd += '})();';
      Narcissus.interpreter.evaluate('try { ' + cmd + '} catch(e){alert(e);}');
      return cmd;
    }

    try {
      let cmd = cloneNodeStr(doc);
      Zaphod.log('The command: ' + cmd);
      Narcissus.interpreter.evaluate(cmd);
    }
    catch (e) {
      alert("Error " + e);
    }
  },
  //*/

  // Evaluate code using block scope within Narcissus
  eval: function(cmd) {
    Narcissus.interpreter.evaluate(cmd);
  },

  /*cloneNode = function(n) {
    switch (n.nodeType) {
      case Node.ELEMENT_NODE:
        let cmd += 'var n' + ' = document.createElement(' + n.nodeName + ');'
        for(let i = 0, len = n.attributes.length; i < len; i++) {
          var a = n.attributes[i];
          cmd += 'n.setAttributeNS(' + a.namespaceURI + ',' + a.qname + ',' + a.value + ');';
        }
        cmd += 'parnt.appendChild(n);';
        cmd += 'parnt = n;';
        Zaphod.evalInBlock(cmd);
        for (let i in n.childNodes) {
          Zaphod.evalInBlock(cloneNodeStr(n.childNodes[i]));
        }
      case Node.TEXT_NODE:
        let cmd += 'parnt.appendChild(document.createTextNode(' + n.data + ');';
        Zaphod.evalInBlock(cmd);
        break;
      case Node.COMMENT_NODE:
        let cmd += 'parnt.appendChild(document.createComment(' + n.data + ');';
        Zaphod.evalInBlock(cmd);
        break;
      case Node.PROCESSING_INSTRUCTION_NODE:
        let cmd += 'parnt.appendChild(document.createProcessingInstruction('
            + n.target + ',' + n.data + ');';
        Zaphod.evalInBlock(cmd);
        break;
      case Node.DOCUMENT_TYPE_NODE:
        // do nothing for now
        break;
      default:
        throw new Error("Unexpected node type in copyNodes: " + n.nodeType);
    }
  },*/
  /*cloneNodes: function(hostNode) {
    for(var n = hostNode.firstChild; n !== null; n = n.nextSibling) {
      switch(n.nodeType) {
        case Node.ELEMENT_NODE:
          let cmd += 'var n' + ' = document.createElement(' + n.nodeName + ');'
          for(let i = 0, len = n.attributes.length; i < len; i++) {
            var a = n.attributes[i];
            cmd += 'n.setAttributeNS(' + a.namespaceURI + ',' + a.qname + ',' + a.value + ');';
          }
          cmd += 'parnt.appendChild(n);';
          Zaphod.evalInBlock(cmd);
        case Node.TEXT_NODE:
          let cmd += 'parnt.appendChild(document.createTextNode(' + n.data + ');';
          Zaphod.eval(cmd);
          break;
        case Node.COMMENT_NODE:
          let cmd += 'parnt.appendChild(document.createComment(' + n.data + ');';
          Zaphod.eval(cmd);
          break;
        case Node.PROCESSING_INSTRUCTION_NODE:
          let cmd += 'parnt.appendChild(document.createProcessingInstruction('
              + n.target + ',' + n.data + ');';
          Zaphod.eval(cmd);
          break;
        case Node.DOCUMENT_TYPE_NODE:
          // do nothing for now
      }
    }
  },*/

  /*copynodes: function(from, to) {
    for(var n = from.firstChild; n !== null; n = n.nextSibling) {
      switch(n.nodeType) {
        case Node.ELEMENT_NODE:
            var copy = ownerDocument.createElement(n.nodeName);
            // copy attributes
            for(var i = 0, len = n.attributes.length; i < len; i++) {
                var a = n.attributes[i];
                copy.setAttributeNS(a.namespaceURI, a.qname, a.value);
            }
            // copy kids
            copynodes(n,copy);
            if (n.nodeName === 'HTML') {
                mydom.appendChild(n);
            }
            else {
                to.appendChild(copy);
            }

            // If it was a <script> tag, execute the script
            if (n.tagName === "SCRIPT" && !n.hasAttribute("src")) {
                var script = n.firstChild.data;
                runscript(script);
            }

            break;
        case Node.TEXT_NODE:
            to.appendChild(ownerDocument.createTextNode(n.data));
            break;
        case Node.COMMENT_NODE:
            to.appendChild(ownerDocument.createComment(n.data));
            break;
        case Node.PROCESSING_INSTRUCTION_NODE:
            to.appendChild(ownerDocument.createProcessingInstruction(
                n.target,
                n.data));
            break;
        case Node.DOCUMENT_TYPE_NODE:
            // XXX: do nothing for now
            break;
        default:
            throw new Error("Unexpected node type in copynodes: " + n.nodeType);
        }
    }
  },//*/

  // Initializes the DOM, either by wrapping the host DOM in a proxy and making
  // it available to Narcissus, or by loading dom.js and connecting that to
  // the host DOM.
  loadDOM: function() {
    if (Narcissus.options.useDomjs) {
      var domjs = Zaphod.read('chrome://zaphod/content/domNarc.js');
      Zaphod.eval(domjs);

      // Utilities needed for dom.js
      var utils = Zaphod.read('chrome://zaphod/content/utils.js');
      Zaphod.eval(utils);

      // Copy the host DOM
      Narcissus.interpreter.global['hostDoc'] = content.document.documentElement;
      Zaphod.eval('copynodes(hostDoc,document.documentElement)');
    }
    else {
      // Use the underlying DOM within Zaphod
      var documentHandler = Zaphod.createElementHandler(content.document);
      Narcissus.interpreter.global.document = Proxy.create(documentHandler);
    }

    Zaphod.eval("window = this");
  },

  onPageLoad: function(aEvent) {
    //Zaphod.registeredListeners = [];

    Narcissus.interpreter.resetEnvironment();
    Zaphod.loadDOM();

    Narcissus.interpreter.getValueHook = function(name) {
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
    Narcissus.interpreter.clearAllTimers();
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

