// Code for handling the DOM without dom.js
// Dom.js seems like a better overall approach, so I might deprecate this code.

(function(Zaphod) {
  // Create a handler to search for child elements for unknown properties
  function createElementHandler(elem) {
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
          return Proxy.create(createElementHandler(matches[0]));
        default:
          return matches;
      }
    }
    return handler;
  }

  // Generate unique ids for tagging elements without ids
  var generateUniqueId = (function() {
    var id=0;
    return function() {
      return "narcUid" + id++;
    }
  })();

  // Initializes the DOM by wrapping the host DOM in a proxy and making
  // it available to Narcissus
  Zaphod.nativeLoadDOM = function() {
    // Use the underlying DOM within Zaphod
    var documentHandler = createElementHandler(content.document);
    Narcissus.interpreter.global.document = Proxy.create(documentHandler);

    Narcissus.interpreter.getValueHook = function(name) {
      var value = content.document.getElementById(name);
      if (value) {
        return Proxy.create(createElementHandler(value));
      }
      else return undefined;
    }
    evaluate("window = this");
  }

  // Set listeners to use Narcissus
  Zaphod.nativeHandleListeners = function() {
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
              let newID = generateUniqueId();
              elem.setAttribute('id', newID);
            }
            // TODO: Fix this -- there has to be a cleaner way.  Also, need more than just style.
            let f = '(function() { var style=this.style; ' + code + '}).apply(' + elem.id + ');';
            let fun = function(evnt){
              Narcissus.interpreter.global.event = evnt;
              evaluate(f);
              Narcissus.interpreter.global.event = undefined;
            };
            elem.addEventListener(action,
                fun,
                false);
            // Fire load actions immediately
            if (action === "load") {
              fun();
            }
          })();
        }
      }
    }
  }
}(Zaphod));

