// This file was automatically generated; DO NOT EDIT.
/************************************************************************
Copyright (c) 2011 The Mozilla Foundation.
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are
met:

    Redistributions of source code must retain the above copyright
    notice, this list of conditions and the following disclaimer.

    Redistributions in binary form must reproduce the above copyright
    notice, this list of conditions and the following disclaimer in the
    documentation and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
************************************************************************/
(function closure(global) {
"use strict";



/************************************************************************
 *  src/snapshot.js
 ************************************************************************/

//@line 1 "src/snapshot.js"
/*
 * We want to be sure that we only use the built-in versions of standard
 * functions and methods like Object.create and Array.prototype.pop.
 * So here we make snapshots of all the system objects, and then define
 * utility functions that use them.  
 *
 * It is an error if any of the built-in methods are used anywhere else
 * in dom.js after this initial snapshot.
 *
 * The utilities defined here use a functional syntax rather than the
 * OO syntax of the JS builtins.  Instead of a.map(f), we call map(a, f)
 * for example.
 * 
 * See ../test/monkey.js for code that patches all the built-in
 * functions and methods to test whether we avoid using them.
 */


// XXX
// For now, we just snapshot everything that seems like it might be
// important. Later, we might come back and optimize this to just take
// copies of the stuff we actually use.

const
    shallow_frozen_copy = function(o) {
        var r = {};
        Object.getOwnPropertyNames(o).forEach(function(n) {
            Object.defineProperty(r, n, Object.getOwnPropertyDescriptor(o, n));
        });
        return Object.freeze(r);
    },


    // Copy the original state of constructor functions
    // This is not a complete list. I've left out error types I'm unlikely
    // to ever throw.
    Array = global.Array,
    Boolean = global.Boolean,
    Date = global.Date,
    Error = global.Error,
    Function = global.Function,
    Number = global.Number,
    Object = global.Object,
    RangeError = global.RangeError,
    RegExp = global.RegExp,
    String = global.String,
    TypeError = global.TypeError,
    WeakMap = global.WeakMap,

    // Some global functions.
    // Note that in strict mode we're not allowed to create new identifiers
    // named eval.  But if we give eval any other name then it does a
    // global eval instead of a local eval. I shouldn't ever need to use it,
    // so just omit it here.
    parseInt = global.parseInt,
    parseFloat = global.parseFloat,
    isNaN = global.isNaN,
    isFinite = global.isFinite,

    // Snapshot objects that hold a lot of static methods
    JSON = shallow_frozen_copy(global.JSON),
    Math = shallow_frozen_copy(global.Math),
    Proxy = shallow_frozen_copy(global.Proxy),

    // We also want to make a snapshot of the static methods of Object, Array,
    // and String. (Firefox defines useful "Array generics" and "String
    // generics" that are quite helpful to us).  Since we've already bound
    // the names Object, Array, and String, we use O, A, and S as shorthand
    // notation for these frequently-accessed sets of methods.
    O = shallow_frozen_copy(Object),
    A = shallow_frozen_copy(Array), 
    S = shallow_frozen_copy(String),

    // Copy some individual static methods from types that don't 
    // define very many.
    now = Date.now,

    // Note that it is never safe to invoke a method of a built-in
    // object except in code that is going to run right now. The
    // functions defined below provide a safe alternative, but mandate
    // a functional style of programming rather than an OO style.

    // Functions
    // call(f, o, args...)
    call = Function.prototype.call.bind(Function.prototype.call),
    // apply(f, o, [args])
    apply = Function.prototype.call.bind(Function.prototype.apply),
    // bind(f, o)
    bind = Function.prototype.call.bind(Function.prototype.bind),   

    // WeakMap functions
    wmget = Function.prototype.call.bind(WeakMap.prototype.get),
    wmset = Function.prototype.call.bind(WeakMap.prototype.set),

    // Object functions
    hasOwnProperty =
      Function.prototype.call.bind(Object.prototype.hasOwnProperty),

    // Array functions are all defined as generics like A.pop, but its
    // convenient to give the most commonly-used ones unqualified
    // names.  The less-commonly used functions (and those that have
    // name collisions like indexOf, lastIndexOf and slice) can be
    // accessed on the A or S objects.
    concat = A.concat,
    every = A.every,
    foreach = A.forEach,  // Note lowercase e
    isArray = A.isArray,
    join = A.join,
    map = A.map,
    push = A.push,
    pop = A.pop,
    reduce = A.reduce,
    sort = A.sort,
    splice = A.splice,

    // Ditto for the String generic functions
    fromCharCode = S.fromCharCode,
    match = S.match,
    replace = S.replace,
    search = S.search,
    split = S.split,
    substring = S.substring,
    toLowerCase = S.toLowerCase,
    toUpperCase = S.toUpperCase,
    trim = S.trim,

    // RegExp functions, too
    exec = Function.prototype.call.bind(RegExp.prototype.exec),
    test = Function.prototype.call.bind(RegExp.prototype.test)

    ;



/************************************************************************
 *  src/globals.js
 ************************************************************************/

//@line 1 "src/globals.js"
// These constants and variables aren't really globals.  They're all within
// the closure added by the Makefile, so they don't affect the global
// environment.  But they are visible everywhere within dom.js

// Namespaces
const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
const XML_NAMESPACE = "http://www.w3.org/XML/1998/namespace";
const XMLNS_NAMESPACE = "http://www.w3.org/2000/xmlns/";
const MATHML_NAMESPACE = "http://www.w3.org/1998/Math/MathML";
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";


// Anything I want to define lazily using defineLazyProperty above has
// to be a property of something; it can't just be a local variable.
// So these objects are holders for lazy properties.  
const impl = {}; // implementation construtors defined here
const idl = {};  // interface constructors defined here





/************************************************************************
 *  src/utils.js
 ************************************************************************/

//@line 1 "src/utils.js"
// Utility functions and other globals used throughout dom.js

function assert(expr, msg) {
    if (!expr) throw new Error("Assertion failed " + (msg||""));
}

// For stuff that I haven't implemented yet
function nyi() {
    var e = new Error();
    var where = split(e.stack, "\n")[1];
    throw new Error("Not Yet Implemented at " + where);
}

// Called by deprecated functions, etc.
function warn(msg) {
    if (global.console) console.warn(msg);
    else if (global.print) {
        print("WARNING: " + msg);
    }
}

// Pass in a function that operates on a node.
// Returns a function that operates recursively on that node and all
// of its descendants.  It should work for any DOM or DOM-like tree structure.
// Note, however, that the function f must not add or remove siblings of
// the element it is called on or the recursion won't work correctly.
// If you pass an optional second argument to the returned function, that
// argument will be passed unmodified to each invocation fo f
function recursive(f) {
    return function recurse(node, extra) {
        f(node, extra);
        for(var i = 0, n = node.childNodes.length;  i < n; i++) 
            recurse(node.childNodes[i], extra);
    };
}


// Utility functions that return property descriptors
function constant(v) { return { value: v }; }
function attribute(get, set) {
    if (set) 
        return { get: get, set: set};
    else 
        return { get: get };
}

// some functions that do very simple stuff
// Note that their names begin with f.
// This is good for things like attribute(fnull,fnoop) 
function fnull() { return null; }
function ftrue() { return true; }
function ffalse() { return false; }
function fnoop() { /* do nothing */ }

const readonlyPropDesc = {writable:false,enumerable:true,configurable: true};
const hiddenPropDesc = {writable: true,enumerable: false,configurable: true};
const constantPropDesc = {writable: false,enumerable: true,configurable: false};
const hiddenConstantPropDesc = {
    writable: false, enumerable: false, configurable: false
};

// Set o.p to v, but make the property read-only
function defineReadonlyProp(o,p,v) {
    readonlyPropDesc.value = v;
    O.defineProperty(o, p, readonlyPropDesc);
}

// Set o.p to v, but make the property non-enumerable
function defineHiddenProp(o,p,v) {
    hiddenPropDesc.value = v;
    O.defineProperty(o, p, hiddenPropDesc);
}

// Set o.p to v, and make it constant
function defineConstantProp(o,p,v) {
    constantPropDesc.value = v;
    O.defineProperty(o, p, constantPropDesc);
}

// Set o.p to v, and make it constant and non-enumerable
function defineHiddenConstantProp(o,p,v) {
    hiddenConstantPropDesc.value = v;
    O.defineProperty(o, p, hiddenConstantPropDesc);
}

//
// Define a property p of the object o whose value is the return value of f().
// But don't invoke f() until the property is actually used for the first time.
// The property will be writeable, enumerable and configurable.
// If the property is made read-only before it is used, then it will throw
// an exception when used.
// Based on Andreas's AddResolveHook function.
// 
function defineLazyProperty(o, p, f, hidden, readonly) {
    O.defineProperty(o, p, {
        get: function() {          // When the property is first retrieved
            var realval = f();     // compute its actual value
            O.defineProperty(o, p, // Store that value, keeping the other
                           { value: realval }); // attributes unchanged
            return realval;        // And return the computed value
        },
        set: readonly ? undefined : function(newval) {
            // If the property is writable and is set before being read,
            // just replace the value and f() will never be invoked
            O.defineProperty(o, p, { value: newval });
        },
        enumerable: !hidden,
        configurable: true
    });
}

// Compare two nodes based on their document order. This function is intended
// to be passed to sort(). Assumes that the array being sorted does not
// contain duplicates.  And that all nodes are connected and comparable.
// Clever code by ppk via jeresig.
function documentOrder(n,m) {
    return 3 - (n.compareDocumentPosition(m) & 6); 
}



/************************************************************************
 *  src/wrapmap.js
 ************************************************************************/

//@line 1 "src/wrapmap.js"
// dom.js uses two kinds of tree node objects.  nodes (with a
// lowercase n) are the internal data structures that hold the actual
// document data. They are implemented by the files in impl/* Nodes
// (with a capital N) are the public objects that implement DOM
// interfaces and do not have any properties other than the accessor
// properties and methods defined by the DOM.  They are implemented by 
// the files in idl/*
//
// Every Node must have a node to hold its actual data.
// But nodes can exist without any corresponding Node: Nodes are created
// as needed, when scripts use the DOM API to inspect the document tree.
//
// Since Node objects can't have properties, the mapping from Node to node
// is done with a WeakMap.  The mapping from node to Node is simpler:
// if a Node exists for the node, it is simply set on a property of the node.
//
// The methods in this file manage the mapping between nodes and Nodes
// 
const [unwrap, unwrapOrNull, wrap] = (function() {
    var idlToImplMap = new WeakMap(), lastkey = {}, lastvalue = undefined;

    // Return the implementation object for the DOM Node n
    // This method will throw a TypeError if n is
    // null, undefined, a primitive, or an object with no mapping.
    // This provides basic error checking for methods like Node.appendChild().
    // XXX: We used to throw NOT_FOUND_ERR here, but ms2ger's tests
    // expect TypeError
    function unwrap(n) {
        // Simple optimization
        // If I ever remove or alter mappings, then this won't be valid anymore.
        if (n === lastkey) return lastvalue;

        try {
            var impl = wmget(idlToImplMap, n);

            // This happens if someone passes a bogus object to 
            // appendChild, for example. 
            if (!impl) NotFoundError();

            lastkey = n;
            lastvalue = impl;
            return impl;
        }
        catch(e) {
            // If n was null or not an object the WeakMap will raise a TypeError
            // TypeError might be the best thing to propagate, but there is also
            // some precendent for raising a DOMException with code
            // NOT_FOUND_ERR;
            throw TypeError();
        }
    }

    function unwrapOrNull(n) {
        if (!n) return null;
        return unwrap(n);
    }

    // Return the interface object (a DOM node) for the implementation node n,
    // creating it if necessary
    function wrap(n, idltype) {
        if (n === null) return null;

        if (!n._idl) {
            if (idltype !== idl.Node) {
                n._idl = idltype.factory(n);
            }
            else {
                // Special case for Nodes. To wrap a Node, we have to create
                // an object of the appropriate subtype. 
                // 
                // XXX Once we start on HTML5, we're going to have to
                // expand this special case to handle lots of element
                // subtypes based on n.tagName, I think. This may be a general
                // issue with the DOM anywhere there is an IDL type hierarchy.
                //
                // Note that we know for sure that none of these types require
                // a proxy handler, and therefore we do not have to pass
                // the implementation object n to the factory function.
                // 
                switch(n.nodeType) {
                case ELEMENT_NODE:
                    n._idl = idl.Element.factory();
                    break;
                case TEXT_NODE:
                    n._idl = idl.Text.factory();
                    break;
                case COMMENT_NODE:
                    n._idl = idl.Comment.factory();
                    break;
                case PROCESSING_INSTRUCTION_NODE:
                    n._idl = idl.ProcessingInstruction.factory();
                    break;
                case DOCUMENT_NODE:
                    n._idl = idl.Document.factory();
                    break;
                case DOCUMENT_FRAGMENT_NODE:
                    n._idl = idl.DocumentFragment.factory();
                    break;
                case DOCUMENT_TYPE_NODE:
                    n._idl = idl.DocumentType.factory();
                    break;
                }
            }

            wmset(idlToImplMap, n._idl, n);
        }

        return n._idl;
    }

    return [unwrap, unwrapOrNull, wrap];
}());


/************************************************************************
 *  src/xmlnames.js
 ************************************************************************/

//@line 1 "src/xmlnames.js"
// This grammar is from the XML and XML Namespace specs. It specifies whether
// a string (such as an element or attribute name) is a valid Name or QName.
// 
// Name            ::=          NameStartChar (NameChar)*
// NameStartChar   ::=          ":" | [A-Z] | "_" | [a-z] |
//                              [#xC0-#xD6] | [#xD8-#xF6] | [#xF8-#x2FF] |
//                              [#x370-#x37D] | [#x37F-#x1FFF] |
//                              [#x200C-#x200D] | [#x2070-#x218F] |
//                              [#x2C00-#x2FEF] | [#x3001-#xD7FF] |
//                              [#xF900-#xFDCF] | [#xFDF0-#xFFFD] |
//                              [#x10000-#xEFFFF]
//
// NameChar        ::=          NameStartChar | "-" | "." | [0-9] |
//                                 #xB7 | [#x0300-#x036F] | [#x203F-#x2040]
//
// QName           ::=          PrefixedName| UnprefixedName
// PrefixedName    ::=          Prefix ':' LocalPart
// UnprefixedName  ::=          LocalPart
// Prefix          ::=          NCName
// LocalPart       ::=          NCName
// NCName          ::=          Name - (Char* ':' Char*) 
//                              # An XML Name, minus the ":"        
//
const [isValidName, isValidQName] = (function() {

    // Most names will be ASCII only. Try matching against simple regexps first
    var simplename = /^[_:A-Za-z][-.:\w]+$/;
    var simpleqname = /^([_A-Za-z][-.\w]+|[_A-Za-z][-.\w]+:[_A-Za-z][-.\w]+)$/

    // If the regular expressions above fail, try more complex ones that work
    // for any identifiers using codepoints from the Unicode BMP
    var ncnamestartchars = "_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02ff\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD";
    var ncnamechars = "-._A-Za-z0-9\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02ff\u0300-\u037D\u037F-\u1FFF\u200C\u200D\u203f\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD";

    var ncname = "[" + ncnamestartchars + "][" + ncnamechars + "]*";
    var namestartchars = ncnamestartchars + ":";
    var namechars = ncnamechars + ":";
    var name = new RegExp("^[" + namestartchars + "]" +
                          "[" + namechars + "]*$");
    var qname = new RegExp("^(" + ncname + "|" +
                           ncname + ":" + ncname + ")$");

    // XML says that these characters are also legal:
    // [#x10000-#xEFFFF].  So if the patterns above fail, and the
    // target string includes surrogates, then try the following
    // patterns that allow surrogates and then run an extra validation
    // step to make sure that the surrogates are in valid pairs and in
    // the right range.  Note that since the characters \uf0000 to \u1f0000 
    // are not allowed, it means that the high surrogate can only go up to
    // \uDB7f instead of \uDBFF.
    var hassurrogates = /[\uD800-\uDB7F\uDC00-\uDFFF]/;
    var surrogatechars = /[\uD800-\uDB7F\uDC00-\uDFFF]/g;
    var surrogatepairs = /[\uD800-\uDB7F][\uDC00-\uDFFF]/g;

    // Modify the variables above to allow surrogates
    ncnamestartchars += "\uD800-\uDB7F\uDC00-\uDFFF";
    ncnamechars += "\uD800-\uDB7F\uDC00-\uDFFF";
    ncname = "[" + ncnamestartchars + "][" + ncnamechars + "]*";
    namestartchars = ncnamestartchars + ":";
    namechars = ncnamechars + ":";

    // Build another set of regexps that include surrogates
    var surrogatename = new RegExp("^[" + namestartchars + "]" +
                                   "[" + namechars + "]*$");
    var surrogateqname = new RegExp("^(" + ncname + "|" +
                                    ncname + ":" + ncname + ")$");

    function isValidName(s) {
        if (test(simplename, s)) return true;  // Plain ASCII
        if (test(name, s)) return true;        // Unicode BMP

        // Maybe the tests above failed because s includes surrogate pairs
        // Most likely, though, they failed for some more basic syntax problem
        if (!test(hassurrogates, s)) return false;

        // Is the string a valid name if we allow surrogates?
        if (!test(surrogatename, s)) return false;

        // Finally, are the surrogates all correctly paired up?
        var chars = match(s, surrogatechars), pairs = match(s, surrogatepairs);
        return pairs != null && 2*pairs.length === chars.length;
    }


    function isValidQName(s) {
        if (test(simpleqname, s)) return true;  // Plain ASCII
        if (test(qname, s)) return true;        // Unicode BMP
        
        if (!test(hassurrogates, s)) return false;
        if (!test(surrogateqname, s)) return false;
        var chars = match(s, surrogatechars), pairs = match(s, surrogatepairs);
        return pairs != null && 2*pairs.length === chars.length;
    }

    return [isValidName, isValidQName];
}());



/************************************************************************
 *  src/idl.js
 ************************************************************************/

//@line 1 "src/idl.js"
// This file defines functions for satisfying the requirements of WebIDL
// See also ../tools/idl2domjs

// WebIDL requires value conversions in various places.

// Convert x to an unsigned long and return it
// WebIDL currently says to use ES ToUint32() unless there is a [Clamp]
// attribute on the operation.  We can invoke the ToUint32 operation 
// with the >>> operator.
//
function toULong(x) {
    return x >>> 0;  // The >>> operator does ToUint32
}

function toLong(x) {
    return x & 0xFFFFFFFF; // This should do ToInt32
}

function undef2null(x) { return x === undefined ? null : x; }

// Convert x to a string as with the String() conversion function.
// But if x is null, return the empty string insead of "null".
// If a WebIDL method argument is just DOMString, convert with String()
// But if it is [TreatNullAs=EmptyString] DOMString then use this function.
function StringOrEmpty(x) {
    return (x === null) ? "" : String(x);
}

function StringOrNull(x) {
    return (x === null) ? null : String(x);
}

function OptionalBoolean(x) {
    return (x === undefined) ? undefined : Boolean(x);
}

function OptionalObject(x) {
    return (x === undefined) ? undefined : Object(x);
}

function toCallback(x) {
    var t = typeof x;
    if (t === "function" || t === "object") return x;
    else throw TypeError("Expected callback; got: " + x);
}

function toCallbackOrNull(x) {
    return (x === null) ? null : toCallback(x);
}

// This constructor takes a single object as its argument and looks for
// the following properties of that object:
//
//    name         // The name of the interface
//    superclass   // The superclass constructor
//    proxyHandler // The proxy handler constructor, if one is needed
//    constants    // constants defined by the interface
//    members      // interface attributes and methods
//    constructor  // optional public constructor. 
//
// It returns a new object with the following properties:
//   publicInterface // The public interface to be placed in the global scope
//                   // The input constructor or a synthetic no-op one.
//   prototype       // The prototype object for the interface
//                   // Also available as publicInterface.prototype
//   factory         // A factory function for creating an instance
//
function IDLInterface(o) {
    var name = o.name || "";
    var superclass = o.superclass;
    var proxyFactory = o.proxyFactory;
    var constants = o.constants || {};
    var members = o.members || {};
    var prototype, interfaceObject;

    // Set up the prototype object
    prototype = superclass ? O.create(superclass.prototype) : {};

    if (hasOwnProperty(o, "constructor")) {
        interfaceObject = o.constructor;
    }
    else {
        // The interface object is supposed to work with instanceof, but is 
        // not supposed to be callable.  We can't conform to both requirements
        // so we make the interface object a function that throws when called.
        interfaceObject = function() { 
            throw new TypeError(name + " is not (supposed to be) a function");
        };
    }

    // WebIDL says that the interface object has this prototype property
    defineHiddenConstantProp(interfaceObject, "prototype", prototype);

    // WebIDL also says that the prototype points back to the interface object
    // instead of the real constructor.
    defineHiddenProp(prototype, "constructor", interfaceObject);

    // Constants must be defined on both the prototype and interface objects
    // And they must read-only and non-configurable
    for(var c in constants) {
        var value = constants[c];
        defineConstantProp(prototype, c, value);
        defineConstantProp(interfaceObject, c, value);
    }

    // Now copy attributes and methods onto the prototype object.
    // Members should just be an ordinary object.  Attributes should be
    // defined with getters and setters. Methods should be regular properties.
    // This will mean that the members will all be enumerable, configurable
    // and writable (unless there is no setter) as they are supposed to be.
    for(var m in members) {
        // Get the property descriptor of the member
        var desc = O.getOwnPropertyDescriptor(members, m);

        // Now copy the property to the prototype object
        O.defineProperty(prototype, m, desc);
    }

    // If the interface does not already define a toString method, add one.
    // This will help to make debugging easier.
    // 
    // XXX: I'm not sure if this is legal according to WebIDL and DOM Core.
    // XXX Maybe I could move it down to an object on the prototype chain
    // above Object.prototype.  But then I'd need some way to determine
    // the type name.  Maybe the name of the public "constructor" function?
    // But then I'd have to create that function with eval, I think.
    if (!hasOwnProperty(members, "toString")) {
        prototype.toString = function() { return "[object " + name + "]"; };
    }

    // Now set up the fields of this object
    this.prototype = prototype;
    this.publicInterface = interfaceObject;
    this.factory = proxyFactory
        ? proxyFactory
        : O.create.bind(Object, prototype, {});
}




/************************************************************************
 *  src/domcore.js
 ************************************************************************/

//@line 1 "src/domcore.js"
//
// DO NOT EDIT.
// This file was generated by idl2domjs from src/domcore.idl
//


//
// Interface Event
//

// Constants defined by Event
const CAPTURING_PHASE = 1;
const AT_TARGET = 2;
const BUBBLING_PHASE = 3;

defineLazyProperty(global, "Event", function() {
    return idl.Event.publicInterface;
}, true);

defineLazyProperty(idl, "Event", function() {
    return new IDLInterface({
        name: "Event",
        constructor: function Event(
                                type,
                                eventInitDict)
        {
            return wrap(new impl.Event(
                               String(type),
                               OptionalEventInit(eventInitDict)),
                        idl.Event);
        },
        constants: {
            CAPTURING_PHASE: CAPTURING_PHASE,
            AT_TARGET: AT_TARGET,
            BUBBLING_PHASE: BUBBLING_PHASE,
        },
        members: {
            get type() {
                return unwrap(this).type;
            },

            get target() {
                return wrap(unwrap(this).target, idl.EventTarget);
            },

            get currentTarget() {
                return wrap(unwrap(this).currentTarget, idl.EventTarget);
            },

            get eventPhase() {
                return unwrap(this).eventPhase;
            },

            stopPropagation: function stopPropagation() {
                return unwrap(this).stopPropagation();
            },

            stopImmediatePropagation: function stopImmediatePropagation() {
                return unwrap(this).stopImmediatePropagation();
            },

            get bubbles() {
                return unwrap(this).bubbles;
            },

            get cancelable() {
                return unwrap(this).cancelable;
            },

            preventDefault: function preventDefault() {
                return unwrap(this).preventDefault();
            },

            get defaultPrevented() {
                return unwrap(this).defaultPrevented;
            },

            get isTrusted() {
                return unwrap(this).isTrusted;
            },

            get timeStamp() {
                return wrap(unwrap(this).timeStamp, idl.DOMTimeStamp);
            },

            initEvent: function initEvent(
                                    type,
                                    bubbles,
                                    cancelable)
            {
                return unwrap(this).initEvent(
                    String(type),
                    Boolean(bubbles),
                    Boolean(cancelable));
            },

        },
    });
});

//
// Dictionary EventInit
//

function EventInit(o) {
    var rv = O.create(EventInit.prototype);
    if ('bubbles' in o) rv['bubbles'] = Boolean(o['bubbles']);
    if ('cancelable' in o) rv['cancelable'] = Boolean(o['cancelable']);
    return rv;
}
function OptionalEventInit(o) {
    return (o === undefined) ? undefined : EventInit(o);
}
EventInit.prototype = {};

//
// Interface CustomEvent
//

defineLazyProperty(global, "CustomEvent", function() {
    return idl.CustomEvent.publicInterface;
}, true);

defineLazyProperty(idl, "CustomEvent", function() {
    return new IDLInterface({
        name: "CustomEvent",
        superclass: idl.Event,
        constructor: function CustomEvent(
                                type,
                                eventInitDict)
        {
            return wrap(new impl.CustomEvent(
                               String(type),
                               OptionalCustomEventInit(eventInitDict)),
                        idl.CustomEvent);
        },
        members: {
            get detail() {
                return unwrap(this).detail;
            },

        },
    });
});

//
// Dictionary CustomEventInit
//

function CustomEventInit(o) {
    var rv = O.create(CustomEventInit.prototype);
    if ('bubbles' in o) rv['bubbles'] = Boolean(o['bubbles']);
    if ('cancelable' in o) rv['cancelable'] = Boolean(o['cancelable']);
    if ('detail' in o) rv['detail'] = o['detail'];
    return rv;
}
function OptionalCustomEventInit(o) {
    return (o === undefined) ? undefined : CustomEventInit(o);
}
CustomEventInit.prototype = O.create(EventInit.prototype);

//
// Interface EventTarget
//

defineLazyProperty(global, "EventTarget", function() {
    return idl.EventTarget.publicInterface;
}, true);

defineLazyProperty(idl, "EventTarget", function() {
    return new IDLInterface({
        name: "EventTarget",
        members: {
            addEventListener: function addEventListener(
                                    type,
                                    listener,
                                    capture)
            {
                return unwrap(this).addEventListener(
                    String(type),
                    toCallbackOrNull(listener),
                    OptionalBoolean(capture));
            },

            removeEventListener: function removeEventListener(
                                    type,
                                    listener,
                                    capture)
            {
                return unwrap(this).removeEventListener(
                    String(type),
                    toCallbackOrNull(listener),
                    OptionalBoolean(capture));
            },

            dispatchEvent: function dispatchEvent(event) {
                return unwrap(this).dispatchEvent(unwrap(event));
            },

        },
    });
});

//
// Interface Node
//

// Constants defined by Node
const ELEMENT_NODE = 1;
const ATTRIBUTE_NODE = 2;
const TEXT_NODE = 3;
const CDATA_SECTION_NODE = 4;
const ENTITY_REFERENCE_NODE = 5;
const ENTITY_NODE = 6;
const PROCESSING_INSTRUCTION_NODE = 7;
const COMMENT_NODE = 8;
const DOCUMENT_NODE = 9;
const DOCUMENT_TYPE_NODE = 10;
const DOCUMENT_FRAGMENT_NODE = 11;
const NOTATION_NODE = 12;
const DOCUMENT_POSITION_DISCONNECTED = 0x01;
const DOCUMENT_POSITION_PRECEDING = 0x02;
const DOCUMENT_POSITION_FOLLOWING = 0x04;
const DOCUMENT_POSITION_CONTAINS = 0x08;
const DOCUMENT_POSITION_CONTAINED_BY = 0x10;
const DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC = 0x20;

defineLazyProperty(global, "Node", function() {
    return idl.Node.publicInterface;
}, true);

defineLazyProperty(idl, "Node", function() {
    return new IDLInterface({
        name: "Node",
        superclass: idl.EventTarget,
        constants: {
            ELEMENT_NODE: ELEMENT_NODE,
            ATTRIBUTE_NODE: ATTRIBUTE_NODE,
            TEXT_NODE: TEXT_NODE,
            CDATA_SECTION_NODE: CDATA_SECTION_NODE,
            ENTITY_REFERENCE_NODE: ENTITY_REFERENCE_NODE,
            ENTITY_NODE: ENTITY_NODE,
            PROCESSING_INSTRUCTION_NODE: PROCESSING_INSTRUCTION_NODE,
            COMMENT_NODE: COMMENT_NODE,
            DOCUMENT_NODE: DOCUMENT_NODE,
            DOCUMENT_TYPE_NODE: DOCUMENT_TYPE_NODE,
            DOCUMENT_FRAGMENT_NODE: DOCUMENT_FRAGMENT_NODE,
            NOTATION_NODE: NOTATION_NODE,
            DOCUMENT_POSITION_DISCONNECTED: DOCUMENT_POSITION_DISCONNECTED,
            DOCUMENT_POSITION_PRECEDING: DOCUMENT_POSITION_PRECEDING,
            DOCUMENT_POSITION_FOLLOWING: DOCUMENT_POSITION_FOLLOWING,
            DOCUMENT_POSITION_CONTAINS: DOCUMENT_POSITION_CONTAINS,
            DOCUMENT_POSITION_CONTAINED_BY: DOCUMENT_POSITION_CONTAINED_BY,
            DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC: DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC,
        },
        members: {
            get nodeType() {
                return unwrap(this).nodeType;
            },

            get nodeName() {
                return unwrap(this).nodeName;
            },

            get baseURI() {
                return unwrap(this).baseURI;
            },

            get ownerDocument() {
                return wrap(unwrap(this).ownerDocument, idl.Document);
            },

            get parentNode() {
                return wrap(unwrap(this).parentNode, idl.Node);
            },

            get parentElement() {
                return wrap(unwrap(this).parentElement, idl.Element);
            },

            hasChildNodes: function hasChildNodes() {
                return unwrap(this).hasChildNodes();
            },

            get childNodes() {
                return wrap(unwrap(this).childNodes, idl.NodeList);
            },

            get firstChild() {
                return wrap(unwrap(this).firstChild, idl.Node);
            },

            get lastChild() {
                return wrap(unwrap(this).lastChild, idl.Node);
            },

            get previousSibling() {
                return wrap(unwrap(this).previousSibling, idl.Node);
            },

            get nextSibling() {
                return wrap(unwrap(this).nextSibling, idl.Node);
            },

            compareDocumentPosition: function compareDocumentPosition(other) {
                return unwrap(this).compareDocumentPosition(unwrap(other));
            },

            get nodeValue() {
                return unwrap(this).nodeValue;
            },
            set nodeValue(newval) {
                unwrap(this).nodeValue = StringOrNull(newval);
            },

            get textContent() {
                return unwrap(this).textContent;
            },
            set textContent(newval) {
                unwrap(this).textContent = StringOrNull(newval);
            },

            insertBefore: function insertBefore(
                                    newChild,
                                    refChild)
            {
                var rv = unwrap(this).insertBefore(
                    unwrap(newChild),
                    unwrapOrNull(refChild));
                return wrap(rv, idl.Node);
            },

            replaceChild: function replaceChild(
                                    newChild,
                                    oldChild)
            {
                var rv = unwrap(this).replaceChild(
                    unwrap(newChild),
                    unwrap(oldChild));
                return wrap(rv, idl.Node);
            },

            removeChild: function removeChild(oldChild) {
                var rv = unwrap(this).removeChild(unwrap(oldChild));
                return wrap(rv, idl.Node);
            },

            appendChild: function appendChild(newChild) {
                var rv = unwrap(this).appendChild(unwrap(newChild));
                return wrap(rv, idl.Node);
            },

            cloneNode: function cloneNode(deep) {
                var rv = unwrap(this).cloneNode(Boolean(deep));
                return wrap(rv, idl.Node);
            },

            isSameNode: function isSameNode(node) {
                return unwrap(this).isSameNode(unwrapOrNull(node));
            },

            isEqualNode: function isEqualNode(node) {
                return unwrap(this).isEqualNode(unwrapOrNull(node));
            },

            lookupPrefix: function lookupPrefix(namespace) {
                return unwrap(this).lookupPrefix(StringOrEmpty(namespace));
            },

            lookupNamespaceURI: function lookupNamespaceURI(prefix) {
                return unwrap(this).lookupNamespaceURI(StringOrNull(prefix));
            },

            isDefaultNamespace: function isDefaultNamespace(namespace) {
                return unwrap(this).isDefaultNamespace(StringOrEmpty(namespace));
            },

        },
    });
});

//
// Interface DocumentFragment
//

defineLazyProperty(global, "DocumentFragment", function() {
    return idl.DocumentFragment.publicInterface;
}, true);

defineLazyProperty(idl, "DocumentFragment", function() {
    return new IDLInterface({
        name: "DocumentFragment",
        superclass: idl.Node,
        members: {
        },
    });
});

//
// Interface Document
//

defineLazyProperty(global, "Document", function() {
    return idl.Document.publicInterface;
}, true);

defineLazyProperty(idl, "Document", function() {
    return new IDLInterface({
        name: "Document",
        superclass: idl.Node,
        members: {
            get implementation() {
                return wrap(unwrap(this).implementation, idl.DOMImplementation);
            },

            get documentURI() {
                return unwrap(this).documentURI;
            },
            set documentURI(newval) {
                unwrap(this).documentURI = String(newval);
            },

            get compatMode() {
                return unwrap(this).compatMode;
            },

            get doctype() {
                return wrap(unwrap(this).doctype, idl.DocumentType);
            },

            get documentElement() {
                return wrap(unwrap(this).documentElement, idl.Element);
            },

            getElementsByTagName: function getElementsByTagName(qualifiedName) {
                var rv = unwrap(this).getElementsByTagName(String(qualifiedName));
                return wrap(rv, idl.NodeList);
            },

            getElementsByTagNameNS: function getElementsByTagNameNS(
                                    namespace,
                                    localName)
            {
                var rv = unwrap(this).getElementsByTagNameNS(
                    String(namespace),
                    String(localName));
                return wrap(rv, idl.NodeList);
            },

            getElementsByClassName: function getElementsByClassName(classNames) {
                var rv = unwrap(this).getElementsByClassName(String(classNames));
                return wrap(rv, idl.NodeList);
            },

            getElementById: function getElementById(elementId) {
                var rv = unwrap(this).getElementById(String(elementId));
                return wrap(rv, idl.Element);
            },

            createElement: function createElement(localName) {
                var rv = unwrap(this).createElement(StringOrEmpty(localName));
                return wrap(rv, idl.Element);
            },

            createElementNS: function createElementNS(
                                    namespace,
                                    qualifiedName)
            {
                var rv = unwrap(this).createElementNS(
                    String(namespace),
                    String(qualifiedName));
                return wrap(rv, idl.Element);
            },

            createDocumentFragment: function createDocumentFragment() {
                var rv = unwrap(this).createDocumentFragment();
                return wrap(rv, idl.DocumentFragment);
            },

            createTextNode: function createTextNode(data) {
                var rv = unwrap(this).createTextNode(String(data));
                return wrap(rv, idl.Text);
            },

            createComment: function createComment(data) {
                var rv = unwrap(this).createComment(String(data));
                return wrap(rv, idl.Comment);
            },

            createProcessingInstruction: function createProcessingInstruction(
                                    target,
                                    data)
            {
                var rv = unwrap(this).createProcessingInstruction(
                    String(target),
                    String(data));
                return wrap(rv, idl.ProcessingInstruction);
            },

            importNode: function importNode(
                                    node,
                                    deep)
            {
                var rv = unwrap(this).importNode(
                    unwrap(node),
                    Boolean(deep));
                return wrap(rv, idl.Node);
            },

            adoptNode: function adoptNode(node) {
                var rv = unwrap(this).adoptNode(unwrap(node));
                return wrap(rv, idl.Node);
            },

            createEvent: function createEvent(eventInterfaceName) {
                var rv = unwrap(this).createEvent(String(eventInterfaceName));
                return wrap(rv, idl.Event);
            },

        },
    });
});

//
// Interface DOMImplementation
//

defineLazyProperty(global, "DOMImplementation", function() {
    return idl.DOMImplementation.publicInterface;
}, true);

defineLazyProperty(idl, "DOMImplementation", function() {
    return new IDLInterface({
        name: "DOMImplementation",
        members: {
            hasFeature: function hasFeature(
                                    feature,
                                    version)
            {
                return unwrap(this).hasFeature(
                    String(feature),
                    StringOrEmpty(version));
            },

            createDocumentType: function createDocumentType(
                                    qualifiedName,
                                    publicId,
                                    systemId)
            {
                var rv = unwrap(this).createDocumentType(
                    StringOrEmpty(qualifiedName),
                    String(publicId),
                    String(systemId));
                return wrap(rv, idl.DocumentType);
            },

            createDocument: function createDocument(
                                    namespace,
                                    qualifiedName,
                                    doctype)
            {
                var rv = unwrap(this).createDocument(
                    StringOrEmpty(namespace),
                    StringOrEmpty(qualifiedName),
                    unwrapOrNull(doctype));
                return wrap(rv, idl.Document);
            },

            createHTMLDocument: function createHTMLDocument(title) {
                var rv = unwrap(this).createHTMLDocument(String(title));
                return wrap(rv, idl.Document);
            },

            mozSetOutputMutationHandler: function mozSetOutputMutationHandler(
                                    doc,
                                    handler)
            {
                return unwrap(this).mozSetOutputMutationHandler(
                    unwrap(doc),
                    toCallback(handler));
            },

            mozGetInputMutationHandler: function mozGetInputMutationHandler(doc) {
                var rv = unwrap(this).mozGetInputMutationHandler(unwrap(doc));
                return wrap(rv, idl.MozMutationHandler);
            },

        },
    });
});

//
// Interface Element
//

defineLazyProperty(global, "Element", function() {
    return idl.Element.publicInterface;
}, true);

defineLazyProperty(idl, "Element", function() {
    return new IDLInterface({
        name: "Element",
        superclass: idl.Node,
        members: {
            get namespaceURI() {
                return unwrap(this).namespaceURI;
            },

            get prefix() {
                return unwrap(this).prefix;
            },

            get localName() {
                return unwrap(this).localName;
            },

            get tagName() {
                return unwrap(this).tagName;
            },

            get attributes() {
                return wrap(unwrap(this).attributes, idl.AttrArray);
            },

            getAttribute: function getAttribute(qualifiedName) {
                return unwrap(this).getAttribute(String(qualifiedName));
            },

            getAttributeNS: function getAttributeNS(
                                    namespace,
                                    localName)
            {
                return unwrap(this).getAttributeNS(
                    String(namespace),
                    String(localName));
            },

            setAttribute: function setAttribute(
                                    qualifiedName,
                                    value)
            {
                return unwrap(this).setAttribute(
                    String(qualifiedName),
                    String(value));
            },

            setAttributeNS: function setAttributeNS(
                                    namespace,
                                    qualifiedName,
                                    value)
            {
                return unwrap(this).setAttributeNS(
                    String(namespace),
                    String(qualifiedName),
                    String(value));
            },

            removeAttribute: function removeAttribute(qualifiedName) {
                return unwrap(this).removeAttribute(String(qualifiedName));
            },

            removeAttributeNS: function removeAttributeNS(
                                    namespace,
                                    localName)
            {
                return unwrap(this).removeAttributeNS(
                    String(namespace),
                    String(localName));
            },

            hasAttribute: function hasAttribute(qualifiedName) {
                return unwrap(this).hasAttribute(String(qualifiedName));
            },

            hasAttributeNS: function hasAttributeNS(
                                    namespace,
                                    localName)
            {
                return unwrap(this).hasAttributeNS(
                    String(namespace),
                    String(localName));
            },

            getElementsByTagName: function getElementsByTagName(qualifiedName) {
                var rv = unwrap(this).getElementsByTagName(String(qualifiedName));
                return wrap(rv, idl.NodeList);
            },

            getElementsByTagNameNS: function getElementsByTagNameNS(
                                    namespace,
                                    localName)
            {
                var rv = unwrap(this).getElementsByTagNameNS(
                    String(namespace),
                    String(localName));
                return wrap(rv, idl.NodeList);
            },

            getElementsByClassName: function getElementsByClassName(classNames) {
                var rv = unwrap(this).getElementsByClassName(String(classNames));
                return wrap(rv, idl.NodeList);
            },

            get children() {
                return wrap(unwrap(this).children, idl.HTMLCollection);
            },

            get firstElementChild() {
                return wrap(unwrap(this).firstElementChild, idl.Element);
            },

            get lastElementChild() {
                return wrap(unwrap(this).lastElementChild, idl.Element);
            },

            get previousElementSibling() {
                return wrap(unwrap(this).previousElementSibling, idl.Element);
            },

            get nextElementSibling() {
                return wrap(unwrap(this).nextElementSibling, idl.Element);
            },

            get childElementCount() {
                return unwrap(this).childElementCount;
            },

        },
    });
});

//
// Interface Attr
//

defineLazyProperty(global, "Attr", function() {
    return idl.Attr.publicInterface;
}, true);

defineLazyProperty(idl, "Attr", function() {
    return new IDLInterface({
        name: "Attr",
        members: {
            get namespaceURI() {
                return unwrap(this).namespaceURI;
            },

            get prefix() {
                return unwrap(this).prefix;
            },

            get localName() {
                return unwrap(this).localName;
            },

            get name() {
                return unwrap(this).name;
            },

            get value() {
                return unwrap(this).value;
            },
            set value(newval) {
                unwrap(this).value = String(newval);
            },

        },
    });
});

//
// Interface DocumentType
//

defineLazyProperty(global, "DocumentType", function() {
    return idl.DocumentType.publicInterface;
}, true);

defineLazyProperty(idl, "DocumentType", function() {
    return new IDLInterface({
        name: "DocumentType",
        superclass: idl.Node,
        members: {
            get name() {
                return unwrap(this).name;
            },

            get publicId() {
                return unwrap(this).publicId;
            },

            get systemId() {
                return unwrap(this).systemId;
            },

        },
    });
});

//
// Interface ProcessingInstruction
//

defineLazyProperty(global, "ProcessingInstruction", function() {
    return idl.ProcessingInstruction.publicInterface;
}, true);

defineLazyProperty(idl, "ProcessingInstruction", function() {
    return new IDLInterface({
        name: "ProcessingInstruction",
        superclass: idl.Node,
        members: {
            get target() {
                return unwrap(this).target;
            },

            get data() {
                return unwrap(this).data;
            },
            set data(newval) {
                unwrap(this).data = String(newval);
            },

        },
    });
});

//
// Interface CharacterData
//

defineLazyProperty(global, "CharacterData", function() {
    return idl.CharacterData.publicInterface;
}, true);

defineLazyProperty(idl, "CharacterData", function() {
    return new IDLInterface({
        name: "CharacterData",
        superclass: idl.Node,
        members: {
            get data() {
                return unwrap(this).data;
            },
            set data(newval) {
                unwrap(this).data = StringOrEmpty(newval);
            },

            get length() {
                return unwrap(this).length;
            },

            substringData: function substringData(
                                    offset,
                                    count)
            {
                return unwrap(this).substringData(
                    toULong(offset),
                    toULong(count));
            },

            appendData: function appendData(data) {
                return unwrap(this).appendData(String(data));
            },

            insertData: function insertData(
                                    offset,
                                    data)
            {
                return unwrap(this).insertData(
                    toULong(offset),
                    String(data));
            },

            deleteData: function deleteData(
                                    offset,
                                    count)
            {
                return unwrap(this).deleteData(
                    toULong(offset),
                    toULong(count));
            },

            replaceData: function replaceData(
                                    offset,
                                    count,
                                    data)
            {
                return unwrap(this).replaceData(
                    toULong(offset),
                    toULong(count),
                    String(data));
            },

        },
    });
});

//
// Interface Text
//

defineLazyProperty(global, "Text", function() {
    return idl.Text.publicInterface;
}, true);

defineLazyProperty(idl, "Text", function() {
    return new IDLInterface({
        name: "Text",
        superclass: idl.CharacterData,
        members: {
            splitText: function splitText(offset) {
                var rv = unwrap(this).splitText(toULong(offset));
                return wrap(rv, idl.Text);
            },

            get wholeText() {
                return unwrap(this).wholeText;
            },

            replaceWholeText: function replaceWholeText(data) {
                var rv = unwrap(this).replaceWholeText(String(data));
                return wrap(rv, idl.Text);
            },

        },
    });
});

//
// Interface Comment
//

defineLazyProperty(global, "Comment", function() {
    return idl.Comment.publicInterface;
}, true);

defineLazyProperty(idl, "Comment", function() {
    return new IDLInterface({
        name: "Comment",
        superclass: idl.CharacterData,
        members: {
        },
    });
});

//
// Interface NodeList
//

defineLazyProperty(global, "NodeList", function() {
    return idl.NodeList.publicInterface;
}, true);

defineLazyProperty(idl, "NodeList", function() {
    return new IDLInterface({
        name: "NodeList",
        proxyFactory: NodeListProxy,
        members: {
            item: function item(index) {
                var rv = unwrap(this).item(toULong(index));
                return wrap(rv, idl.Node);
            },

            get length() {
                return unwrap(this).length;
            },

        },
    });
});

//
// Interface HTMLCollection
//

defineLazyProperty(global, "HTMLCollection", function() {
    return idl.HTMLCollection.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLCollection", function() {
    return new IDLInterface({
        name: "HTMLCollection",
        proxyFactory: HTMLCollectionProxy,
        members: {
            get length() {
                return unwrap(this).length;
            },

            item: function item(index) {
                var rv = unwrap(this).item(toULong(index));
                return wrap(rv, idl.Element);
            },

            namedItem: function namedItem(name) {
                var rv = unwrap(this).namedItem(String(name));
                return wrap(rv, idl.Element);
            },

        },
    });
});

//
// Interface DOMStringList
//

defineLazyProperty(global, "DOMStringList", function() {
    return idl.DOMStringList.publicInterface;
}, true);

defineLazyProperty(idl, "DOMStringList", function() {
    return new IDLInterface({
        name: "DOMStringList",
        proxyFactory: DOMStringListProxy,
        members: {
            get length() {
                return unwrap(this).length;
            },

            item: function item(index) {
                return unwrap(this).item(toULong(index));
            },

            contains: function contains(string) {
                return unwrap(this).contains(String(string));
            },

        },
    });
});

//
// Interface DOMTokenList
//

defineLazyProperty(global, "DOMTokenList", function() {
    return idl.DOMTokenList.publicInterface;
}, true);

defineLazyProperty(idl, "DOMTokenList", function() {
    return new IDLInterface({
        name: "DOMTokenList",
        proxyFactory: DOMTokenListProxy,
        members: {
            get length() {
                return unwrap(this).length;
            },

            item: function item(index) {
                return unwrap(this).item(toULong(index));
            },

            contains: function contains(token) {
                return unwrap(this).contains(String(token));
            },

            add: function add(token) {
                return unwrap(this).add(String(token));
            },

            remove: function remove(token) {
                return unwrap(this).remove(String(token));
            },

            toggle: function toggle(token) {
                return unwrap(this).toggle(String(token));
            },

            toString: function toString() {
                return unwrap(this).toString();
            },

        },
    });
});

//
// Interface DOMSettableTokenList
//

defineLazyProperty(global, "DOMSettableTokenList", function() {
    return idl.DOMSettableTokenList.publicInterface;
}, true);

defineLazyProperty(idl, "DOMSettableTokenList", function() {
    return new IDLInterface({
        name: "DOMSettableTokenList",
        superclass: idl.DOMTokenList,
        members: {
            get value() {
                return unwrap(this).value;
            },
            set value(newval) {
                unwrap(this).value = String(newval);
            },

        },
    });
});

defineLazyProperty(idl, "AttrArray", function() {
    return new IDLInterface({
        name: "AttrArray",
        proxyFactory: AttrArrayProxy,
    });
});



/************************************************************************
 *  src/htmlelts.js
 ************************************************************************/

//@line 1 "src/htmlelts.js"
//
// DO NOT EDIT.
// This file was generated by idl2domjs from src/htmlelts.idl
//


//
// Interface HTMLFormControlsCollection
//

defineLazyProperty(global, "HTMLFormControlsCollection", function() {
    return idl.HTMLFormControlsCollection.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLFormControlsCollection", function() {
    return new IDLInterface({
        name: "HTMLFormControlsCollection",
        superclass: idl.HTMLCollection,
        proxyFactory: HTMLFormControlsCollectionProxy,
        members: {
            namedItem: function namedItem(name) {
                return unwrap(this).namedItem(String(name));
            },

        },
    });
});

//
// Interface RadioNodeList
//

defineLazyProperty(global, "RadioNodeList", function() {
    return idl.RadioNodeList.publicInterface;
}, true);

defineLazyProperty(idl, "RadioNodeList", function() {
    return new IDLInterface({
        name: "RadioNodeList",
        superclass: idl.NodeList,
        members: {
            get value() {
                return unwrap(this).value;
            },
            set value(newval) {
                unwrap(this).value = String(newval);
            },

        },
    });
});

//
// Interface HTMLOptionsCollection
//

defineLazyProperty(global, "HTMLOptionsCollection", function() {
    return idl.HTMLOptionsCollection.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLOptionsCollection", function() {
    return new IDLInterface({
        name: "HTMLOptionsCollection",
        superclass: idl.HTMLCollection,
        proxyFactory: HTMLOptionsCollectionProxy,
        members: {
            get length() {
                return unwrap(this).length;
            },
            set length(newval) {
                unwrap(this).length = toULong(newval);
            },

            namedItem: function namedItem(name) {
                return unwrap(this).namedItem(String(name));
            },

            remove: function remove(index) {
                return unwrap(this).remove(toLong(index));
            },

            get selectedIndex() {
                return unwrap(this).selectedIndex;
            },
            set selectedIndex(newval) {
                unwrap(this).selectedIndex = toLong(newval);
            },

        },
    });
});

//
// Interface HTMLPropertiesCollection
//

defineLazyProperty(global, "HTMLPropertiesCollection", function() {
    return idl.HTMLPropertiesCollection.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLPropertiesCollection", function() {
    return new IDLInterface({
        name: "HTMLPropertiesCollection",
        superclass: idl.HTMLCollection,
        proxyFactory: HTMLPropertiesCollectionProxy,
        members: {
            namedItem: function namedItem(name) {
                var rv = unwrap(this).namedItem(String(name));
                return wrap(rv, idl.PropertyNodeList);
            },

            get names() {
                return wrap(unwrap(this).names, idl.DOMStringList);
            },

        },
    });
});

//
// Interface PropertyNodeList
//

defineLazyProperty(global, "PropertyNodeList", function() {
    return idl.PropertyNodeList.publicInterface;
}, true);

defineLazyProperty(idl, "PropertyNodeList", function() {
    return new IDLInterface({
        name: "PropertyNodeList",
        superclass: idl.NodeList,
        members: {
            getValues: function getValues() {
                var rv = unwrap(this).getValues();
                return wrap(rv, idl.PropertyValueArray);
            },

        },
    });
});

//
// Interface DOMStringMap
//

defineLazyProperty(global, "DOMStringMap", function() {
    return idl.DOMStringMap.publicInterface;
}, true);

defineLazyProperty(idl, "DOMStringMap", function() {
    return new IDLInterface({
        name: "DOMStringMap",
        proxyFactory: DOMStringMapProxy,
        members: {
        },
    });
});

//
// Interface DOMElementMap
//

defineLazyProperty(global, "DOMElementMap", function() {
    return idl.DOMElementMap.publicInterface;
}, true);

defineLazyProperty(idl, "DOMElementMap", function() {
    return new IDLInterface({
        name: "DOMElementMap",
        proxyFactory: DOMElementMapProxy,
        members: {
        },
    });
});

//
// Interface HTMLElement
//

defineLazyProperty(global, "HTMLElement", function() {
    return idl.HTMLElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLElement", function() {
    return new IDLInterface({
        name: "HTMLElement",
        superclass: idl.Element,
        members: {
            get innerHTML() {
                return unwrap(this).innerHTML;
            },
            set innerHTML(newval) {
                unwrap(this).innerHTML = String(newval);
            },

            get outerHTML() {
                return unwrap(this).outerHTML;
            },
            set outerHTML(newval) {
                unwrap(this).outerHTML = String(newval);
            },

            insertAdjacentHTML: function insertAdjacentHTML(
                                    position,
                                    text)
            {
                return unwrap(this).insertAdjacentHTML(
                    String(position),
                    String(text));
            },

            get id() {
                return unwrap(this).id;
            },
            set id(newval) {
                unwrap(this).id = String(newval);
            },

            get title() {
                return unwrap(this).title;
            },
            set title(newval) {
                unwrap(this).title = String(newval);
            },

            get lang() {
                return unwrap(this).lang;
            },
            set lang(newval) {
                unwrap(this).lang = String(newval);
            },

            get dir() {
                return unwrap(this).dir;
            },
            set dir(newval) {
                unwrap(this).dir = String(newval);
            },

            get className() {
                return unwrap(this).className;
            },
            set className(newval) {
                unwrap(this).className = String(newval);
            },

            get classList() {
                return wrap(unwrap(this).classList, idl.DOMTokenList);
            },

            get dataset() {
                return wrap(unwrap(this).dataset, idl.DOMStringMap);
            },

            get itemScope() {
                return unwrap(this).itemScope;
            },
            set itemScope(newval) {
                unwrap(this).itemScope = Boolean(newval);
            },

            get itemType() {
                return unwrap(this).itemType;
            },
            set itemType(newval) {
                unwrap(this).itemType = String(newval);
            },

            get itemId() {
                return unwrap(this).itemId;
            },
            set itemId(newval) {
                unwrap(this).itemId = String(newval);
            },

            get itemRef() {
                return wrap(unwrap(this).itemRef, idl.DOMSettableTokenList);
            },

            get itemProp() {
                return wrap(unwrap(this).itemProp, idl.DOMSettableTokenList);
            },

            get properties() {
                return wrap(unwrap(this).properties, idl.HTMLPropertiesCollection);
            },

            get itemValue() {
                return unwrap(this).itemValue;
            },
            set itemValue(newval) {
                unwrap(this).itemValue = newval;
            },

            get hidden() {
                return unwrap(this).hidden;
            },
            set hidden(newval) {
                unwrap(this).hidden = Boolean(newval);
            },

            click: function click() {
                return unwrap(this).click();
            },

            get tabIndex() {
                return unwrap(this).tabIndex;
            },
            set tabIndex(newval) {
                unwrap(this).tabIndex = toLong(newval);
            },

            focus: function focus() {
                return unwrap(this).focus();
            },

            blur: function blur() {
                return unwrap(this).blur();
            },

            get accessKey() {
                return unwrap(this).accessKey;
            },
            set accessKey(newval) {
                unwrap(this).accessKey = String(newval);
            },

            get accessKeyLabel() {
                return unwrap(this).accessKeyLabel;
            },

            get draggable() {
                return unwrap(this).draggable;
            },
            set draggable(newval) {
                unwrap(this).draggable = Boolean(newval);
            },

            get dropzone() {
                return wrap(unwrap(this).dropzone, idl.DOMSettableTokenList);
            },

            get contentEditable() {
                return unwrap(this).contentEditable;
            },
            set contentEditable(newval) {
                unwrap(this).contentEditable = String(newval);
            },

            get isContentEditable() {
                return unwrap(this).isContentEditable;
            },

            get contextMenu() {
                return wrap(unwrap(this).contextMenu, idl.HTMLMenuElement);
            },
            set contextMenu(newval) {
                unwrap(this).contextMenu = unwrapOrNull(newval);
            },

            get spellcheck() {
                return unwrap(this).spellcheck;
            },
            set spellcheck(newval) {
                unwrap(this).spellcheck = Boolean(newval);
            },

            get commandType() {
                return unwrap(this).commandType;
            },

            get commandLabel() {
                return unwrap(this).commandLabel;
            },

            get commandIcon() {
                return unwrap(this).commandIcon;
            },

            get commandHidden() {
                return unwrap(this).commandHidden;
            },

            get commandDisabled() {
                return unwrap(this).commandDisabled;
            },

            get commandChecked() {
                return unwrap(this).commandChecked;
            },

            get style() {
                return wrap(unwrap(this).style, idl.CSSStyleDeclaration);
            },

            get onabort() {
                return wrap(unwrap(this).onabort, idl.Function);
            },
            set onabort(newval) {
                unwrap(this).onabort = toCallbackOrNull(newval);
            },

            get onblur() {
                return wrap(unwrap(this).onblur, idl.Function);
            },
            set onblur(newval) {
                unwrap(this).onblur = toCallbackOrNull(newval);
            },

            get oncanplay() {
                return wrap(unwrap(this).oncanplay, idl.Function);
            },
            set oncanplay(newval) {
                unwrap(this).oncanplay = toCallbackOrNull(newval);
            },

            get oncanplaythrough() {
                return wrap(unwrap(this).oncanplaythrough, idl.Function);
            },
            set oncanplaythrough(newval) {
                unwrap(this).oncanplaythrough = toCallbackOrNull(newval);
            },

            get onchange() {
                return wrap(unwrap(this).onchange, idl.Function);
            },
            set onchange(newval) {
                unwrap(this).onchange = toCallbackOrNull(newval);
            },

            get onclick() {
                return wrap(unwrap(this).onclick, idl.Function);
            },
            set onclick(newval) {
                unwrap(this).onclick = toCallbackOrNull(newval);
            },

            get oncontextmenu() {
                return wrap(unwrap(this).oncontextmenu, idl.Function);
            },
            set oncontextmenu(newval) {
                unwrap(this).oncontextmenu = toCallbackOrNull(newval);
            },

            get oncuechange() {
                return wrap(unwrap(this).oncuechange, idl.Function);
            },
            set oncuechange(newval) {
                unwrap(this).oncuechange = toCallbackOrNull(newval);
            },

            get ondblclick() {
                return wrap(unwrap(this).ondblclick, idl.Function);
            },
            set ondblclick(newval) {
                unwrap(this).ondblclick = toCallbackOrNull(newval);
            },

            get ondrag() {
                return wrap(unwrap(this).ondrag, idl.Function);
            },
            set ondrag(newval) {
                unwrap(this).ondrag = toCallbackOrNull(newval);
            },

            get ondragend() {
                return wrap(unwrap(this).ondragend, idl.Function);
            },
            set ondragend(newval) {
                unwrap(this).ondragend = toCallbackOrNull(newval);
            },

            get ondragenter() {
                return wrap(unwrap(this).ondragenter, idl.Function);
            },
            set ondragenter(newval) {
                unwrap(this).ondragenter = toCallbackOrNull(newval);
            },

            get ondragleave() {
                return wrap(unwrap(this).ondragleave, idl.Function);
            },
            set ondragleave(newval) {
                unwrap(this).ondragleave = toCallbackOrNull(newval);
            },

            get ondragover() {
                return wrap(unwrap(this).ondragover, idl.Function);
            },
            set ondragover(newval) {
                unwrap(this).ondragover = toCallbackOrNull(newval);
            },

            get ondragstart() {
                return wrap(unwrap(this).ondragstart, idl.Function);
            },
            set ondragstart(newval) {
                unwrap(this).ondragstart = toCallbackOrNull(newval);
            },

            get ondrop() {
                return wrap(unwrap(this).ondrop, idl.Function);
            },
            set ondrop(newval) {
                unwrap(this).ondrop = toCallbackOrNull(newval);
            },

            get ondurationchange() {
                return wrap(unwrap(this).ondurationchange, idl.Function);
            },
            set ondurationchange(newval) {
                unwrap(this).ondurationchange = toCallbackOrNull(newval);
            },

            get onemptied() {
                return wrap(unwrap(this).onemptied, idl.Function);
            },
            set onemptied(newval) {
                unwrap(this).onemptied = toCallbackOrNull(newval);
            },

            get onended() {
                return wrap(unwrap(this).onended, idl.Function);
            },
            set onended(newval) {
                unwrap(this).onended = toCallbackOrNull(newval);
            },

            get onerror() {
                return wrap(unwrap(this).onerror, idl.Function);
            },
            set onerror(newval) {
                unwrap(this).onerror = toCallbackOrNull(newval);
            },

            get onfocus() {
                return wrap(unwrap(this).onfocus, idl.Function);
            },
            set onfocus(newval) {
                unwrap(this).onfocus = toCallbackOrNull(newval);
            },

            get oninput() {
                return wrap(unwrap(this).oninput, idl.Function);
            },
            set oninput(newval) {
                unwrap(this).oninput = toCallbackOrNull(newval);
            },

            get oninvalid() {
                return wrap(unwrap(this).oninvalid, idl.Function);
            },
            set oninvalid(newval) {
                unwrap(this).oninvalid = toCallbackOrNull(newval);
            },

            get onkeydown() {
                return wrap(unwrap(this).onkeydown, idl.Function);
            },
            set onkeydown(newval) {
                unwrap(this).onkeydown = toCallbackOrNull(newval);
            },

            get onkeypress() {
                return wrap(unwrap(this).onkeypress, idl.Function);
            },
            set onkeypress(newval) {
                unwrap(this).onkeypress = toCallbackOrNull(newval);
            },

            get onkeyup() {
                return wrap(unwrap(this).onkeyup, idl.Function);
            },
            set onkeyup(newval) {
                unwrap(this).onkeyup = toCallbackOrNull(newval);
            },

            get onload() {
                return wrap(unwrap(this).onload, idl.Function);
            },
            set onload(newval) {
                unwrap(this).onload = toCallbackOrNull(newval);
            },

            get onloadeddata() {
                return wrap(unwrap(this).onloadeddata, idl.Function);
            },
            set onloadeddata(newval) {
                unwrap(this).onloadeddata = toCallbackOrNull(newval);
            },

            get onloadedmetadata() {
                return wrap(unwrap(this).onloadedmetadata, idl.Function);
            },
            set onloadedmetadata(newval) {
                unwrap(this).onloadedmetadata = toCallbackOrNull(newval);
            },

            get onloadstart() {
                return wrap(unwrap(this).onloadstart, idl.Function);
            },
            set onloadstart(newval) {
                unwrap(this).onloadstart = toCallbackOrNull(newval);
            },

            get onmousedown() {
                return wrap(unwrap(this).onmousedown, idl.Function);
            },
            set onmousedown(newval) {
                unwrap(this).onmousedown = toCallbackOrNull(newval);
            },

            get onmousemove() {
                return wrap(unwrap(this).onmousemove, idl.Function);
            },
            set onmousemove(newval) {
                unwrap(this).onmousemove = toCallbackOrNull(newval);
            },

            get onmouseout() {
                return wrap(unwrap(this).onmouseout, idl.Function);
            },
            set onmouseout(newval) {
                unwrap(this).onmouseout = toCallbackOrNull(newval);
            },

            get onmouseover() {
                return wrap(unwrap(this).onmouseover, idl.Function);
            },
            set onmouseover(newval) {
                unwrap(this).onmouseover = toCallbackOrNull(newval);
            },

            get onmouseup() {
                return wrap(unwrap(this).onmouseup, idl.Function);
            },
            set onmouseup(newval) {
                unwrap(this).onmouseup = toCallbackOrNull(newval);
            },

            get onmousewheel() {
                return wrap(unwrap(this).onmousewheel, idl.Function);
            },
            set onmousewheel(newval) {
                unwrap(this).onmousewheel = toCallbackOrNull(newval);
            },

            get onpause() {
                return wrap(unwrap(this).onpause, idl.Function);
            },
            set onpause(newval) {
                unwrap(this).onpause = toCallbackOrNull(newval);
            },

            get onplay() {
                return wrap(unwrap(this).onplay, idl.Function);
            },
            set onplay(newval) {
                unwrap(this).onplay = toCallbackOrNull(newval);
            },

            get onplaying() {
                return wrap(unwrap(this).onplaying, idl.Function);
            },
            set onplaying(newval) {
                unwrap(this).onplaying = toCallbackOrNull(newval);
            },

            get onprogress() {
                return wrap(unwrap(this).onprogress, idl.Function);
            },
            set onprogress(newval) {
                unwrap(this).onprogress = toCallbackOrNull(newval);
            },

            get onratechange() {
                return wrap(unwrap(this).onratechange, idl.Function);
            },
            set onratechange(newval) {
                unwrap(this).onratechange = toCallbackOrNull(newval);
            },

            get onreadystatechange() {
                return wrap(unwrap(this).onreadystatechange, idl.Function);
            },
            set onreadystatechange(newval) {
                unwrap(this).onreadystatechange = toCallbackOrNull(newval);
            },

            get onreset() {
                return wrap(unwrap(this).onreset, idl.Function);
            },
            set onreset(newval) {
                unwrap(this).onreset = toCallbackOrNull(newval);
            },

            get onscroll() {
                return wrap(unwrap(this).onscroll, idl.Function);
            },
            set onscroll(newval) {
                unwrap(this).onscroll = toCallbackOrNull(newval);
            },

            get onseeked() {
                return wrap(unwrap(this).onseeked, idl.Function);
            },
            set onseeked(newval) {
                unwrap(this).onseeked = toCallbackOrNull(newval);
            },

            get onseeking() {
                return wrap(unwrap(this).onseeking, idl.Function);
            },
            set onseeking(newval) {
                unwrap(this).onseeking = toCallbackOrNull(newval);
            },

            get onselect() {
                return wrap(unwrap(this).onselect, idl.Function);
            },
            set onselect(newval) {
                unwrap(this).onselect = toCallbackOrNull(newval);
            },

            get onshow() {
                return wrap(unwrap(this).onshow, idl.Function);
            },
            set onshow(newval) {
                unwrap(this).onshow = toCallbackOrNull(newval);
            },

            get onstalled() {
                return wrap(unwrap(this).onstalled, idl.Function);
            },
            set onstalled(newval) {
                unwrap(this).onstalled = toCallbackOrNull(newval);
            },

            get onsubmit() {
                return wrap(unwrap(this).onsubmit, idl.Function);
            },
            set onsubmit(newval) {
                unwrap(this).onsubmit = toCallbackOrNull(newval);
            },

            get onsuspend() {
                return wrap(unwrap(this).onsuspend, idl.Function);
            },
            set onsuspend(newval) {
                unwrap(this).onsuspend = toCallbackOrNull(newval);
            },

            get ontimeupdate() {
                return wrap(unwrap(this).ontimeupdate, idl.Function);
            },
            set ontimeupdate(newval) {
                unwrap(this).ontimeupdate = toCallbackOrNull(newval);
            },

            get onvolumechange() {
                return wrap(unwrap(this).onvolumechange, idl.Function);
            },
            set onvolumechange(newval) {
                unwrap(this).onvolumechange = toCallbackOrNull(newval);
            },

            get onwaiting() {
                return wrap(unwrap(this).onwaiting, idl.Function);
            },
            set onwaiting(newval) {
                unwrap(this).onwaiting = toCallbackOrNull(newval);
            },

        },
    });
});

//
// Interface HTMLUnknownElement
//

defineLazyProperty(global, "HTMLUnknownElement", function() {
    return idl.HTMLUnknownElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLUnknownElement", function() {
    return new IDLInterface({
        name: "HTMLUnknownElement",
        superclass: idl.HTMLElement,
        members: {
        },
    });
});

//
// Interface HTMLHtmlElement
//

defineLazyProperty(global, "HTMLHtmlElement", function() {
    return idl.HTMLHtmlElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLHtmlElement", function() {
    return new IDLInterface({
        name: "HTMLHtmlElement",
        superclass: idl.HTMLElement,
        members: {
        },
    });
});

//
// Interface HTMLHeadElement
//

defineLazyProperty(global, "HTMLHeadElement", function() {
    return idl.HTMLHeadElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLHeadElement", function() {
    return new IDLInterface({
        name: "HTMLHeadElement",
        superclass: idl.HTMLElement,
        members: {
        },
    });
});

//
// Interface HTMLTitleElement
//

defineLazyProperty(global, "HTMLTitleElement", function() {
    return idl.HTMLTitleElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLTitleElement", function() {
    return new IDLInterface({
        name: "HTMLTitleElement",
        superclass: idl.HTMLElement,
        members: {
            get text() {
                return unwrap(this).text;
            },
            set text(newval) {
                unwrap(this).text = String(newval);
            },

        },
    });
});

//
// Interface HTMLBaseElement
//

defineLazyProperty(global, "HTMLBaseElement", function() {
    return idl.HTMLBaseElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLBaseElement", function() {
    return new IDLInterface({
        name: "HTMLBaseElement",
        superclass: idl.HTMLElement,
        members: {
            get href() {
                return unwrap(this).href;
            },
            set href(newval) {
                unwrap(this).href = String(newval);
            },

            get target() {
                return unwrap(this).target;
            },
            set target(newval) {
                unwrap(this).target = String(newval);
            },

        },
    });
});

//
// Interface HTMLLinkElement
//

defineLazyProperty(global, "HTMLLinkElement", function() {
    return idl.HTMLLinkElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLLinkElement", function() {
    return new IDLInterface({
        name: "HTMLLinkElement",
        superclass: idl.HTMLElement,
        members: {
            get disabled() {
                return unwrap(this).disabled;
            },
            set disabled(newval) {
                unwrap(this).disabled = Boolean(newval);
            },

            get href() {
                return unwrap(this).href;
            },
            set href(newval) {
                unwrap(this).href = String(newval);
            },

            get rel() {
                return unwrap(this).rel;
            },
            set rel(newval) {
                unwrap(this).rel = String(newval);
            },

            get relList() {
                return wrap(unwrap(this).relList, idl.DOMTokenList);
            },

            get media() {
                return unwrap(this).media;
            },
            set media(newval) {
                unwrap(this).media = String(newval);
            },

            get hreflang() {
                return unwrap(this).hreflang;
            },
            set hreflang(newval) {
                unwrap(this).hreflang = String(newval);
            },

            get type() {
                return unwrap(this).type;
            },
            set type(newval) {
                unwrap(this).type = String(newval);
            },

            get sizes() {
                return wrap(unwrap(this).sizes, idl.DOMSettableTokenList);
            },

        },
    });
});

//
// Interface HTMLMetaElement
//

defineLazyProperty(global, "HTMLMetaElement", function() {
    return idl.HTMLMetaElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLMetaElement", function() {
    return new IDLInterface({
        name: "HTMLMetaElement",
        superclass: idl.HTMLElement,
        members: {
            get name() {
                return unwrap(this).name;
            },
            set name(newval) {
                unwrap(this).name = String(newval);
            },

            get httpEquiv() {
                return unwrap(this).httpEquiv;
            },
            set httpEquiv(newval) {
                unwrap(this).httpEquiv = String(newval);
            },

            get content() {
                return unwrap(this).content;
            },
            set content(newval) {
                unwrap(this).content = String(newval);
            },

        },
    });
});

//
// Interface HTMLStyleElement
//

defineLazyProperty(global, "HTMLStyleElement", function() {
    return idl.HTMLStyleElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLStyleElement", function() {
    return new IDLInterface({
        name: "HTMLStyleElement",
        superclass: idl.HTMLElement,
        members: {
            get disabled() {
                return unwrap(this).disabled;
            },
            set disabled(newval) {
                unwrap(this).disabled = Boolean(newval);
            },

            get media() {
                return unwrap(this).media;
            },
            set media(newval) {
                unwrap(this).media = String(newval);
            },

            get type() {
                return unwrap(this).type;
            },
            set type(newval) {
                unwrap(this).type = String(newval);
            },

            get scoped() {
                return unwrap(this).scoped;
            },
            set scoped(newval) {
                unwrap(this).scoped = Boolean(newval);
            },

        },
    });
});

//
// Interface HTMLScriptElement
//

defineLazyProperty(global, "HTMLScriptElement", function() {
    return idl.HTMLScriptElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLScriptElement", function() {
    return new IDLInterface({
        name: "HTMLScriptElement",
        superclass: idl.HTMLElement,
        members: {
            get src() {
                return unwrap(this).src;
            },
            set src(newval) {
                unwrap(this).src = String(newval);
            },

            get async() {
                return unwrap(this).async;
            },
            set async(newval) {
                unwrap(this).async = Boolean(newval);
            },

            get defer() {
                return unwrap(this).defer;
            },
            set defer(newval) {
                unwrap(this).defer = Boolean(newval);
            },

            get type() {
                return unwrap(this).type;
            },
            set type(newval) {
                unwrap(this).type = String(newval);
            },

            get charset() {
                return unwrap(this).charset;
            },
            set charset(newval) {
                unwrap(this).charset = String(newval);
            },

            get text() {
                return unwrap(this).text;
            },
            set text(newval) {
                unwrap(this).text = String(newval);
            },

        },
    });
});

//
// Interface HTMLBodyElement
//

defineLazyProperty(global, "HTMLBodyElement", function() {
    return idl.HTMLBodyElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLBodyElement", function() {
    return new IDLInterface({
        name: "HTMLBodyElement",
        superclass: idl.HTMLElement,
        members: {
            get onafterprint() {
                return wrap(unwrap(this).onafterprint, idl.Function);
            },
            set onafterprint(newval) {
                unwrap(this).onafterprint = toCallbackOrNull(newval);
            },

            get onbeforeprint() {
                return wrap(unwrap(this).onbeforeprint, idl.Function);
            },
            set onbeforeprint(newval) {
                unwrap(this).onbeforeprint = toCallbackOrNull(newval);
            },

            get onbeforeunload() {
                return wrap(unwrap(this).onbeforeunload, idl.Function);
            },
            set onbeforeunload(newval) {
                unwrap(this).onbeforeunload = toCallbackOrNull(newval);
            },

            get onblur() {
                return wrap(unwrap(this).onblur, idl.Function);
            },
            set onblur(newval) {
                unwrap(this).onblur = toCallbackOrNull(newval);
            },

            get onerror() {
                return wrap(unwrap(this).onerror, idl.Function);
            },
            set onerror(newval) {
                unwrap(this).onerror = toCallbackOrNull(newval);
            },

            get onfocus() {
                return wrap(unwrap(this).onfocus, idl.Function);
            },
            set onfocus(newval) {
                unwrap(this).onfocus = toCallbackOrNull(newval);
            },

            get onhashchange() {
                return wrap(unwrap(this).onhashchange, idl.Function);
            },
            set onhashchange(newval) {
                unwrap(this).onhashchange = toCallbackOrNull(newval);
            },

            get onload() {
                return wrap(unwrap(this).onload, idl.Function);
            },
            set onload(newval) {
                unwrap(this).onload = toCallbackOrNull(newval);
            },

            get onmessage() {
                return wrap(unwrap(this).onmessage, idl.Function);
            },
            set onmessage(newval) {
                unwrap(this).onmessage = toCallbackOrNull(newval);
            },

            get onoffline() {
                return wrap(unwrap(this).onoffline, idl.Function);
            },
            set onoffline(newval) {
                unwrap(this).onoffline = toCallbackOrNull(newval);
            },

            get ononline() {
                return wrap(unwrap(this).ononline, idl.Function);
            },
            set ononline(newval) {
                unwrap(this).ononline = toCallbackOrNull(newval);
            },

            get onpopstate() {
                return wrap(unwrap(this).onpopstate, idl.Function);
            },
            set onpopstate(newval) {
                unwrap(this).onpopstate = toCallbackOrNull(newval);
            },

            get onpagehide() {
                return wrap(unwrap(this).onpagehide, idl.Function);
            },
            set onpagehide(newval) {
                unwrap(this).onpagehide = toCallbackOrNull(newval);
            },

            get onpageshow() {
                return wrap(unwrap(this).onpageshow, idl.Function);
            },
            set onpageshow(newval) {
                unwrap(this).onpageshow = toCallbackOrNull(newval);
            },

            get onredo() {
                return wrap(unwrap(this).onredo, idl.Function);
            },
            set onredo(newval) {
                unwrap(this).onredo = toCallbackOrNull(newval);
            },

            get onresize() {
                return wrap(unwrap(this).onresize, idl.Function);
            },
            set onresize(newval) {
                unwrap(this).onresize = toCallbackOrNull(newval);
            },

            get onscroll() {
                return wrap(unwrap(this).onscroll, idl.Function);
            },
            set onscroll(newval) {
                unwrap(this).onscroll = toCallbackOrNull(newval);
            },

            get onstorage() {
                return wrap(unwrap(this).onstorage, idl.Function);
            },
            set onstorage(newval) {
                unwrap(this).onstorage = toCallbackOrNull(newval);
            },

            get onundo() {
                return wrap(unwrap(this).onundo, idl.Function);
            },
            set onundo(newval) {
                unwrap(this).onundo = toCallbackOrNull(newval);
            },

            get onunload() {
                return wrap(unwrap(this).onunload, idl.Function);
            },
            set onunload(newval) {
                unwrap(this).onunload = toCallbackOrNull(newval);
            },

        },
    });
});

//
// Interface HTMLHeadingElement
//

defineLazyProperty(global, "HTMLHeadingElement", function() {
    return idl.HTMLHeadingElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLHeadingElement", function() {
    return new IDLInterface({
        name: "HTMLHeadingElement",
        superclass: idl.HTMLElement,
        members: {
        },
    });
});

//
// Interface HTMLParagraphElement
//

defineLazyProperty(global, "HTMLParagraphElement", function() {
    return idl.HTMLParagraphElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLParagraphElement", function() {
    return new IDLInterface({
        name: "HTMLParagraphElement",
        superclass: idl.HTMLElement,
        members: {
        },
    });
});

//
// Interface HTMLHRElement
//

defineLazyProperty(global, "HTMLHRElement", function() {
    return idl.HTMLHRElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLHRElement", function() {
    return new IDLInterface({
        name: "HTMLHRElement",
        superclass: idl.HTMLElement,
        members: {
        },
    });
});

//
// Interface HTMLPreElement
//

defineLazyProperty(global, "HTMLPreElement", function() {
    return idl.HTMLPreElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLPreElement", function() {
    return new IDLInterface({
        name: "HTMLPreElement",
        superclass: idl.HTMLElement,
        members: {
        },
    });
});

//
// Interface HTMLQuoteElement
//

defineLazyProperty(global, "HTMLQuoteElement", function() {
    return idl.HTMLQuoteElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLQuoteElement", function() {
    return new IDLInterface({
        name: "HTMLQuoteElement",
        superclass: idl.HTMLElement,
        members: {
            get cite() {
                return unwrap(this).cite;
            },
            set cite(newval) {
                unwrap(this).cite = String(newval);
            },

        },
    });
});

//
// Interface HTMLOListElement
//

defineLazyProperty(global, "HTMLOListElement", function() {
    return idl.HTMLOListElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLOListElement", function() {
    return new IDLInterface({
        name: "HTMLOListElement",
        superclass: idl.HTMLElement,
        members: {
            get reversed() {
                return unwrap(this).reversed;
            },
            set reversed(newval) {
                unwrap(this).reversed = Boolean(newval);
            },

            get start() {
                return unwrap(this).start;
            },
            set start(newval) {
                unwrap(this).start = toLong(newval);
            },

            get type() {
                return unwrap(this).type;
            },
            set type(newval) {
                unwrap(this).type = String(newval);
            },

        },
    });
});

//
// Interface HTMLUListElement
//

defineLazyProperty(global, "HTMLUListElement", function() {
    return idl.HTMLUListElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLUListElement", function() {
    return new IDLInterface({
        name: "HTMLUListElement",
        superclass: idl.HTMLElement,
        members: {
        },
    });
});

//
// Interface HTMLLIElement
//

defineLazyProperty(global, "HTMLLIElement", function() {
    return idl.HTMLLIElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLLIElement", function() {
    return new IDLInterface({
        name: "HTMLLIElement",
        superclass: idl.HTMLElement,
        members: {
            get value() {
                return unwrap(this).value;
            },
            set value(newval) {
                unwrap(this).value = toLong(newval);
            },

        },
    });
});

//
// Interface HTMLDListElement
//

defineLazyProperty(global, "HTMLDListElement", function() {
    return idl.HTMLDListElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLDListElement", function() {
    return new IDLInterface({
        name: "HTMLDListElement",
        superclass: idl.HTMLElement,
        members: {
        },
    });
});

//
// Interface HTMLDivElement
//

defineLazyProperty(global, "HTMLDivElement", function() {
    return idl.HTMLDivElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLDivElement", function() {
    return new IDLInterface({
        name: "HTMLDivElement",
        superclass: idl.HTMLElement,
        members: {
        },
    });
});

//
// Interface HTMLAnchorElement
//

defineLazyProperty(global, "HTMLAnchorElement", function() {
    return idl.HTMLAnchorElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLAnchorElement", function() {
    return new IDLInterface({
        name: "HTMLAnchorElement",
        superclass: idl.HTMLElement,
        members: {
            get href() {
                return unwrap(this).href;
            },
            set href(newval) {
                unwrap(this).href = String(newval);
            },

            get target() {
                return unwrap(this).target;
            },
            set target(newval) {
                unwrap(this).target = String(newval);
            },

            get download() {
                return unwrap(this).download;
            },
            set download(newval) {
                unwrap(this).download = String(newval);
            },

            get ping() {
                return unwrap(this).ping;
            },
            set ping(newval) {
                unwrap(this).ping = String(newval);
            },

            get rel() {
                return unwrap(this).rel;
            },
            set rel(newval) {
                unwrap(this).rel = String(newval);
            },

            get relList() {
                return wrap(unwrap(this).relList, idl.DOMTokenList);
            },

            get media() {
                return unwrap(this).media;
            },
            set media(newval) {
                unwrap(this).media = String(newval);
            },

            get hreflang() {
                return unwrap(this).hreflang;
            },
            set hreflang(newval) {
                unwrap(this).hreflang = String(newval);
            },

            get type() {
                return unwrap(this).type;
            },
            set type(newval) {
                unwrap(this).type = String(newval);
            },

            get text() {
                return unwrap(this).text;
            },
            set text(newval) {
                unwrap(this).text = String(newval);
            },

            get protocol() {
                return unwrap(this).protocol;
            },
            set protocol(newval) {
                unwrap(this).protocol = String(newval);
            },

            get host() {
                return unwrap(this).host;
            },
            set host(newval) {
                unwrap(this).host = String(newval);
            },

            get hostname() {
                return unwrap(this).hostname;
            },
            set hostname(newval) {
                unwrap(this).hostname = String(newval);
            },

            get port() {
                return unwrap(this).port;
            },
            set port(newval) {
                unwrap(this).port = String(newval);
            },

            get pathname() {
                return unwrap(this).pathname;
            },
            set pathname(newval) {
                unwrap(this).pathname = String(newval);
            },

            get search() {
                return unwrap(this).search;
            },
            set search(newval) {
                unwrap(this).search = String(newval);
            },

            get hash() {
                return unwrap(this).hash;
            },
            set hash(newval) {
                unwrap(this).hash = String(newval);
            },

        },
    });
});

//
// Interface HTMLTimeElement
//

defineLazyProperty(global, "HTMLTimeElement", function() {
    return idl.HTMLTimeElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLTimeElement", function() {
    return new IDLInterface({
        name: "HTMLTimeElement",
        superclass: idl.HTMLElement,
        members: {
            get dateTime() {
                return unwrap(this).dateTime;
            },
            set dateTime(newval) {
                unwrap(this).dateTime = String(newval);
            },

            get pubDate() {
                return unwrap(this).pubDate;
            },
            set pubDate(newval) {
                unwrap(this).pubDate = Boolean(newval);
            },

            get valueAsDate() {
                return wrap(unwrap(this).valueAsDate, idl.Date);
            },

        },
    });
});

//
// Interface HTMLSpanElement
//

defineLazyProperty(global, "HTMLSpanElement", function() {
    return idl.HTMLSpanElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLSpanElement", function() {
    return new IDLInterface({
        name: "HTMLSpanElement",
        superclass: idl.HTMLElement,
        members: {
        },
    });
});

//
// Interface HTMLBRElement
//

defineLazyProperty(global, "HTMLBRElement", function() {
    return idl.HTMLBRElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLBRElement", function() {
    return new IDLInterface({
        name: "HTMLBRElement",
        superclass: idl.HTMLElement,
        members: {
        },
    });
});

//
// Interface HTMLModElement
//

defineLazyProperty(global, "HTMLModElement", function() {
    return idl.HTMLModElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLModElement", function() {
    return new IDLInterface({
        name: "HTMLModElement",
        superclass: idl.HTMLElement,
        members: {
            get cite() {
                return unwrap(this).cite;
            },
            set cite(newval) {
                unwrap(this).cite = String(newval);
            },

            get dateTime() {
                return unwrap(this).dateTime;
            },
            set dateTime(newval) {
                unwrap(this).dateTime = String(newval);
            },

        },
    });
});

//
// Interface HTMLImageElement
//

defineLazyProperty(global, "HTMLImageElement", function() {
    return idl.HTMLImageElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLImageElement", function() {
    return new IDLInterface({
        name: "HTMLImageElement",
        superclass: idl.HTMLElement,
        members: {
            get alt() {
                return unwrap(this).alt;
            },
            set alt(newval) {
                unwrap(this).alt = String(newval);
            },

            get src() {
                return unwrap(this).src;
            },
            set src(newval) {
                unwrap(this).src = String(newval);
            },

            get crossOrigin() {
                return unwrap(this).crossOrigin;
            },
            set crossOrigin(newval) {
                unwrap(this).crossOrigin = String(newval);
            },

            get useMap() {
                return unwrap(this).useMap;
            },
            set useMap(newval) {
                unwrap(this).useMap = String(newval);
            },

            get isMap() {
                return unwrap(this).isMap;
            },
            set isMap(newval) {
                unwrap(this).isMap = Boolean(newval);
            },

            get width() {
                return unwrap(this).width;
            },
            set width(newval) {
                unwrap(this).width = toULong(newval);
            },

            get height() {
                return unwrap(this).height;
            },
            set height(newval) {
                unwrap(this).height = toULong(newval);
            },

            get naturalWidth() {
                return unwrap(this).naturalWidth;
            },

            get naturalHeight() {
                return unwrap(this).naturalHeight;
            },

            get complete() {
                return unwrap(this).complete;
            },

        },
    });
});

//
// Interface HTMLIFrameElement
//

defineLazyProperty(global, "HTMLIFrameElement", function() {
    return idl.HTMLIFrameElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLIFrameElement", function() {
    return new IDLInterface({
        name: "HTMLIFrameElement",
        superclass: idl.HTMLElement,
        members: {
            get src() {
                return unwrap(this).src;
            },
            set src(newval) {
                unwrap(this).src = String(newval);
            },

            get srcdoc() {
                return unwrap(this).srcdoc;
            },
            set srcdoc(newval) {
                unwrap(this).srcdoc = String(newval);
            },

            get name() {
                return unwrap(this).name;
            },
            set name(newval) {
                unwrap(this).name = String(newval);
            },

            get sandbox() {
                return wrap(unwrap(this).sandbox, idl.DOMSettableTokenList);
            },

            get seamless() {
                return unwrap(this).seamless;
            },
            set seamless(newval) {
                unwrap(this).seamless = Boolean(newval);
            },

            get width() {
                return unwrap(this).width;
            },
            set width(newval) {
                unwrap(this).width = String(newval);
            },

            get height() {
                return unwrap(this).height;
            },
            set height(newval) {
                unwrap(this).height = String(newval);
            },

            get contentDocument() {
                return wrap(unwrap(this).contentDocument, idl.Document);
            },

            get contentWindow() {
                return wrap(unwrap(this).contentWindow, idl.WindowProxy);
            },

        },
    });
});

//
// Interface HTMLEmbedElement
//

defineLazyProperty(global, "HTMLEmbedElement", function() {
    return idl.HTMLEmbedElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLEmbedElement", function() {
    return new IDLInterface({
        name: "HTMLEmbedElement",
        superclass: idl.HTMLElement,
        members: {
            get src() {
                return unwrap(this).src;
            },
            set src(newval) {
                unwrap(this).src = String(newval);
            },

            get type() {
                return unwrap(this).type;
            },
            set type(newval) {
                unwrap(this).type = String(newval);
            },

            get width() {
                return unwrap(this).width;
            },
            set width(newval) {
                unwrap(this).width = String(newval);
            },

            get height() {
                return unwrap(this).height;
            },
            set height(newval) {
                unwrap(this).height = String(newval);
            },

        },
    });
});

//
// Interface HTMLObjectElement
//

defineLazyProperty(global, "HTMLObjectElement", function() {
    return idl.HTMLObjectElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLObjectElement", function() {
    return new IDLInterface({
        name: "HTMLObjectElement",
        superclass: idl.HTMLElement,
        members: {
            get data() {
                return unwrap(this).data;
            },
            set data(newval) {
                unwrap(this).data = String(newval);
            },

            get type() {
                return unwrap(this).type;
            },
            set type(newval) {
                unwrap(this).type = String(newval);
            },

            get typeMustMatch() {
                return unwrap(this).typeMustMatch;
            },
            set typeMustMatch(newval) {
                unwrap(this).typeMustMatch = Boolean(newval);
            },

            get name() {
                return unwrap(this).name;
            },
            set name(newval) {
                unwrap(this).name = String(newval);
            },

            get useMap() {
                return unwrap(this).useMap;
            },
            set useMap(newval) {
                unwrap(this).useMap = String(newval);
            },

            get form() {
                return wrap(unwrap(this).form, idl.HTMLFormElement);
            },

            get width() {
                return unwrap(this).width;
            },
            set width(newval) {
                unwrap(this).width = String(newval);
            },

            get height() {
                return unwrap(this).height;
            },
            set height(newval) {
                unwrap(this).height = String(newval);
            },

            get contentDocument() {
                return wrap(unwrap(this).contentDocument, idl.Document);
            },

            get contentWindow() {
                return wrap(unwrap(this).contentWindow, idl.WindowProxy);
            },

            get willValidate() {
                return unwrap(this).willValidate;
            },

            get validity() {
                return wrap(unwrap(this).validity, idl.ValidityState);
            },

            get validationMessage() {
                return unwrap(this).validationMessage;
            },

            checkValidity: function checkValidity() {
                return unwrap(this).checkValidity();
            },

            setCustomValidity: function setCustomValidity(error) {
                return unwrap(this).setCustomValidity(String(error));
            },

        },
    });
});

//
// Interface HTMLParamElement
//

defineLazyProperty(global, "HTMLParamElement", function() {
    return idl.HTMLParamElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLParamElement", function() {
    return new IDLInterface({
        name: "HTMLParamElement",
        superclass: idl.HTMLElement,
        members: {
            get name() {
                return unwrap(this).name;
            },
            set name(newval) {
                unwrap(this).name = String(newval);
            },

            get value() {
                return unwrap(this).value;
            },
            set value(newval) {
                unwrap(this).value = String(newval);
            },

        },
    });
});

//
// Interface HTMLVideoElement
//

defineLazyProperty(global, "HTMLVideoElement", function() {
    return idl.HTMLVideoElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLVideoElement", function() {
    return new IDLInterface({
        name: "HTMLVideoElement",
        superclass: idl.HTMLMediaElement,
        members: {
            get width() {
                return unwrap(this).width;
            },
            set width(newval) {
                unwrap(this).width = toULong(newval);
            },

            get height() {
                return unwrap(this).height;
            },
            set height(newval) {
                unwrap(this).height = toULong(newval);
            },

            get videoWidth() {
                return unwrap(this).videoWidth;
            },

            get videoHeight() {
                return unwrap(this).videoHeight;
            },

            get poster() {
                return unwrap(this).poster;
            },
            set poster(newval) {
                unwrap(this).poster = String(newval);
            },

        },
    });
});

//
// Interface HTMLAudioElement
//

defineLazyProperty(global, "HTMLAudioElement", function() {
    return idl.HTMLAudioElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLAudioElement", function() {
    return new IDLInterface({
        name: "HTMLAudioElement",
        superclass: idl.HTMLMediaElement,
        members: {
        },
    });
});

//
// Interface HTMLSourceElement
//

defineLazyProperty(global, "HTMLSourceElement", function() {
    return idl.HTMLSourceElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLSourceElement", function() {
    return new IDLInterface({
        name: "HTMLSourceElement",
        superclass: idl.HTMLElement,
        members: {
            get src() {
                return unwrap(this).src;
            },
            set src(newval) {
                unwrap(this).src = String(newval);
            },

            get type() {
                return unwrap(this).type;
            },
            set type(newval) {
                unwrap(this).type = String(newval);
            },

            get media() {
                return unwrap(this).media;
            },
            set media(newval) {
                unwrap(this).media = String(newval);
            },

        },
    });
});

//
// Interface HTMLTrackElement
//

defineLazyProperty(global, "HTMLTrackElement", function() {
    return idl.HTMLTrackElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLTrackElement", function() {
    return new IDLInterface({
        name: "HTMLTrackElement",
        superclass: idl.HTMLElement,
        members: {
            get kind() {
                return unwrap(this).kind;
            },
            set kind(newval) {
                unwrap(this).kind = String(newval);
            },

            get src() {
                return unwrap(this).src;
            },
            set src(newval) {
                unwrap(this).src = String(newval);
            },

            get srclang() {
                return unwrap(this).srclang;
            },
            set srclang(newval) {
                unwrap(this).srclang = String(newval);
            },

            get label() {
                return unwrap(this).label;
            },
            set label(newval) {
                unwrap(this).label = String(newval);
            },

            /*get default() {
                return unwrap(this).default;
            },
            set default(newval) {
                unwrap(this).default = Boolean(newval);
            },*/

            get track() {
                return wrap(unwrap(this).track, idl.TextTrack);
            },

        },
    });
});

//
// Interface HTMLMapElement
//

defineLazyProperty(global, "HTMLMapElement", function() {
    return idl.HTMLMapElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLMapElement", function() {
    return new IDLInterface({
        name: "HTMLMapElement",
        superclass: idl.HTMLElement,
        members: {
            get name() {
                return unwrap(this).name;
            },
            set name(newval) {
                unwrap(this).name = String(newval);
            },

            get areas() {
                return wrap(unwrap(this).areas, idl.HTMLCollection);
            },

            get images() {
                return wrap(unwrap(this).images, idl.HTMLCollection);
            },

        },
    });
});

//
// Interface HTMLAreaElement
//

defineLazyProperty(global, "HTMLAreaElement", function() {
    return idl.HTMLAreaElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLAreaElement", function() {
    return new IDLInterface({
        name: "HTMLAreaElement",
        superclass: idl.HTMLElement,
        members: {
            get alt() {
                return unwrap(this).alt;
            },
            set alt(newval) {
                unwrap(this).alt = String(newval);
            },

            get coords() {
                return unwrap(this).coords;
            },
            set coords(newval) {
                unwrap(this).coords = String(newval);
            },

            get shape() {
                return unwrap(this).shape;
            },
            set shape(newval) {
                unwrap(this).shape = String(newval);
            },

            get href() {
                return unwrap(this).href;
            },
            set href(newval) {
                unwrap(this).href = String(newval);
            },

            get target() {
                return unwrap(this).target;
            },
            set target(newval) {
                unwrap(this).target = String(newval);
            },

            get download() {
                return unwrap(this).download;
            },
            set download(newval) {
                unwrap(this).download = String(newval);
            },

            get ping() {
                return unwrap(this).ping;
            },
            set ping(newval) {
                unwrap(this).ping = String(newval);
            },

            get rel() {
                return unwrap(this).rel;
            },
            set rel(newval) {
                unwrap(this).rel = String(newval);
            },

            get relList() {
                return wrap(unwrap(this).relList, idl.DOMTokenList);
            },

            get media() {
                return unwrap(this).media;
            },
            set media(newval) {
                unwrap(this).media = String(newval);
            },

            get hreflang() {
                return unwrap(this).hreflang;
            },
            set hreflang(newval) {
                unwrap(this).hreflang = String(newval);
            },

            get type() {
                return unwrap(this).type;
            },
            set type(newval) {
                unwrap(this).type = String(newval);
            },

            get protocol() {
                return unwrap(this).protocol;
            },
            set protocol(newval) {
                unwrap(this).protocol = String(newval);
            },

            get host() {
                return unwrap(this).host;
            },
            set host(newval) {
                unwrap(this).host = String(newval);
            },

            get hostname() {
                return unwrap(this).hostname;
            },
            set hostname(newval) {
                unwrap(this).hostname = String(newval);
            },

            get port() {
                return unwrap(this).port;
            },
            set port(newval) {
                unwrap(this).port = String(newval);
            },

            get pathname() {
                return unwrap(this).pathname;
            },
            set pathname(newval) {
                unwrap(this).pathname = String(newval);
            },

            get search() {
                return unwrap(this).search;
            },
            set search(newval) {
                unwrap(this).search = String(newval);
            },

            get hash() {
                return unwrap(this).hash;
            },
            set hash(newval) {
                unwrap(this).hash = String(newval);
            },

        },
    });
});

//
// Interface HTMLTableElement
//

defineLazyProperty(global, "HTMLTableElement", function() {
    return idl.HTMLTableElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLTableElement", function() {
    return new IDLInterface({
        name: "HTMLTableElement",
        superclass: idl.HTMLElement,
        members: {
            get caption() {
                return wrap(unwrap(this).caption, idl.HTMLTableCaptionElement);
            },
            set caption(newval) {
                unwrap(this).caption = unwrapOrNull(newval);
            },

            createCaption: function createCaption() {
                var rv = unwrap(this).createCaption();
                return wrap(rv, idl.HTMLElement);
            },

            deleteCaption: function deleteCaption() {
                return unwrap(this).deleteCaption();
            },

            get tHead() {
                return wrap(unwrap(this).tHead, idl.HTMLTableSectionElement);
            },
            set tHead(newval) {
                unwrap(this).tHead = unwrapOrNull(newval);
            },

            createTHead: function createTHead() {
                var rv = unwrap(this).createTHead();
                return wrap(rv, idl.HTMLElement);
            },

            deleteTHead: function deleteTHead() {
                return unwrap(this).deleteTHead();
            },

            get tFoot() {
                return wrap(unwrap(this).tFoot, idl.HTMLTableSectionElement);
            },
            set tFoot(newval) {
                unwrap(this).tFoot = unwrapOrNull(newval);
            },

            createTFoot: function createTFoot() {
                var rv = unwrap(this).createTFoot();
                return wrap(rv, idl.HTMLElement);
            },

            deleteTFoot: function deleteTFoot() {
                return unwrap(this).deleteTFoot();
            },

            get tBodies() {
                return wrap(unwrap(this).tBodies, idl.HTMLCollection);
            },

            createTBody: function createTBody() {
                var rv = unwrap(this).createTBody();
                return wrap(rv, idl.HTMLElement);
            },

            get rows() {
                return wrap(unwrap(this).rows, idl.HTMLCollection);
            },

            insertRow: function insertRow(index) {
                var rv = unwrap(this).insertRow(OptionaltoLong(index));
                return wrap(rv, idl.HTMLElement);
            },

            deleteRow: function deleteRow(index) {
                return unwrap(this).deleteRow(toLong(index));
            },

            get border() {
                return unwrap(this).border;
            },
            set border(newval) {
                unwrap(this).border = String(newval);
            },

        },
    });
});

//
// Interface HTMLTableCaptionElement
//

defineLazyProperty(global, "HTMLTableCaptionElement", function() {
    return idl.HTMLTableCaptionElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLTableCaptionElement", function() {
    return new IDLInterface({
        name: "HTMLTableCaptionElement",
        superclass: idl.HTMLElement,
        members: {
        },
    });
});

//
// Interface HTMLTableColElement
//

defineLazyProperty(global, "HTMLTableColElement", function() {
    return idl.HTMLTableColElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLTableColElement", function() {
    return new IDLInterface({
        name: "HTMLTableColElement",
        superclass: idl.HTMLElement,
        members: {
            get span() {
                return unwrap(this).span;
            },
            set span(newval) {
                unwrap(this).span = toULong(newval);
            },

        },
    });
});

//
// Interface HTMLTableSectionElement
//

defineLazyProperty(global, "HTMLTableSectionElement", function() {
    return idl.HTMLTableSectionElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLTableSectionElement", function() {
    return new IDLInterface({
        name: "HTMLTableSectionElement",
        superclass: idl.HTMLElement,
        members: {
            get rows() {
                return wrap(unwrap(this).rows, idl.HTMLCollection);
            },

            insertRow: function insertRow(index) {
                var rv = unwrap(this).insertRow(OptionaltoLong(index));
                return wrap(rv, idl.HTMLElement);
            },

            deleteRow: function deleteRow(index) {
                return unwrap(this).deleteRow(toLong(index));
            },

        },
    });
});

//
// Interface HTMLTableRowElement
//

defineLazyProperty(global, "HTMLTableRowElement", function() {
    return idl.HTMLTableRowElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLTableRowElement", function() {
    return new IDLInterface({
        name: "HTMLTableRowElement",
        superclass: idl.HTMLElement,
        members: {
            get rowIndex() {
                return unwrap(this).rowIndex;
            },

            get sectionRowIndex() {
                return unwrap(this).sectionRowIndex;
            },

            get cells() {
                return wrap(unwrap(this).cells, idl.HTMLCollection);
            },

            insertCell: function insertCell(index) {
                var rv = unwrap(this).insertCell(OptionaltoLong(index));
                return wrap(rv, idl.HTMLElement);
            },

            deleteCell: function deleteCell(index) {
                return unwrap(this).deleteCell(toLong(index));
            },

        },
    });
});

//
// Interface HTMLTableDataCellElement
//

defineLazyProperty(global, "HTMLTableDataCellElement", function() {
    return idl.HTMLTableDataCellElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLTableDataCellElement", function() {
    return new IDLInterface({
        name: "HTMLTableDataCellElement",
        superclass: idl.HTMLTableCellElement,
        members: {
        },
    });
});

//
// Interface HTMLTableHeaderCellElement
//

defineLazyProperty(global, "HTMLTableHeaderCellElement", function() {
    return idl.HTMLTableHeaderCellElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLTableHeaderCellElement", function() {
    return new IDLInterface({
        name: "HTMLTableHeaderCellElement",
        superclass: idl.HTMLTableCellElement,
        members: {
            get scope() {
                return unwrap(this).scope;
            },
            set scope(newval) {
                unwrap(this).scope = String(newval);
            },

        },
    });
});

//
// Interface HTMLTableCellElement
//

defineLazyProperty(global, "HTMLTableCellElement", function() {
    return idl.HTMLTableCellElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLTableCellElement", function() {
    return new IDLInterface({
        name: "HTMLTableCellElement",
        superclass: idl.HTMLElement,
        members: {
            get colSpan() {
                return unwrap(this).colSpan;
            },
            set colSpan(newval) {
                unwrap(this).colSpan = toULong(newval);
            },

            get rowSpan() {
                return unwrap(this).rowSpan;
            },
            set rowSpan(newval) {
                unwrap(this).rowSpan = toULong(newval);
            },

            get headers() {
                return wrap(unwrap(this).headers, idl.DOMSettableTokenList);
            },

            get cellIndex() {
                return unwrap(this).cellIndex;
            },

        },
    });
});

//
// Interface HTMLFormElement
//

defineLazyProperty(global, "HTMLFormElement", function() {
    return idl.HTMLFormElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLFormElement", function() {
    return new IDLInterface({
        name: "HTMLFormElement",
        superclass: idl.HTMLElement,
        proxyFactory: HTMLFormElementProxy,
        members: {
            get acceptCharset() {
                return unwrap(this).acceptCharset;
            },
            set acceptCharset(newval) {
                unwrap(this).acceptCharset = String(newval);
            },

            get action() {
                return unwrap(this).action;
            },
            set action(newval) {
                unwrap(this).action = String(newval);
            },

            get autocomplete() {
                return unwrap(this).autocomplete;
            },
            set autocomplete(newval) {
                unwrap(this).autocomplete = String(newval);
            },

            get enctype() {
                return unwrap(this).enctype;
            },
            set enctype(newval) {
                unwrap(this).enctype = String(newval);
            },

            get encoding() {
                return unwrap(this).encoding;
            },
            set encoding(newval) {
                unwrap(this).encoding = String(newval);
            },

            get method() {
                return unwrap(this).method;
            },
            set method(newval) {
                unwrap(this).method = String(newval);
            },

            get name() {
                return unwrap(this).name;
            },
            set name(newval) {
                unwrap(this).name = String(newval);
            },

            get noValidate() {
                return unwrap(this).noValidate;
            },
            set noValidate(newval) {
                unwrap(this).noValidate = Boolean(newval);
            },

            get target() {
                return unwrap(this).target;
            },
            set target(newval) {
                unwrap(this).target = String(newval);
            },

            get elements() {
                return wrap(unwrap(this).elements, idl.HTMLFormControlsCollection);
            },

            get length() {
                return unwrap(this).length;
            },

            submit: function submit() {
                return unwrap(this).submit();
            },

            reset: function reset() {
                return unwrap(this).reset();
            },

            checkValidity: function checkValidity() {
                return unwrap(this).checkValidity();
            },

        },
    });
});

//
// Interface HTMLFieldSetElement
//

defineLazyProperty(global, "HTMLFieldSetElement", function() {
    return idl.HTMLFieldSetElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLFieldSetElement", function() {
    return new IDLInterface({
        name: "HTMLFieldSetElement",
        superclass: idl.HTMLElement,
        members: {
            get disabled() {
                return unwrap(this).disabled;
            },
            set disabled(newval) {
                unwrap(this).disabled = Boolean(newval);
            },

            get form() {
                return wrap(unwrap(this).form, idl.HTMLFormElement);
            },

            get name() {
                return unwrap(this).name;
            },
            set name(newval) {
                unwrap(this).name = String(newval);
            },

            get type() {
                return unwrap(this).type;
            },

            get elements() {
                return wrap(unwrap(this).elements, idl.HTMLFormControlsCollection);
            },

            get willValidate() {
                return unwrap(this).willValidate;
            },

            get validity() {
                return wrap(unwrap(this).validity, idl.ValidityState);
            },

            get validationMessage() {
                return unwrap(this).validationMessage;
            },

            checkValidity: function checkValidity() {
                return unwrap(this).checkValidity();
            },

            setCustomValidity: function setCustomValidity(error) {
                return unwrap(this).setCustomValidity(String(error));
            },

        },
    });
});

//
// Interface HTMLLegendElement
//

defineLazyProperty(global, "HTMLLegendElement", function() {
    return idl.HTMLLegendElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLLegendElement", function() {
    return new IDLInterface({
        name: "HTMLLegendElement",
        superclass: idl.HTMLElement,
        members: {
            get form() {
                return wrap(unwrap(this).form, idl.HTMLFormElement);
            },

        },
    });
});

//
// Interface HTMLLabelElement
//

defineLazyProperty(global, "HTMLLabelElement", function() {
    return idl.HTMLLabelElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLLabelElement", function() {
    return new IDLInterface({
        name: "HTMLLabelElement",
        superclass: idl.HTMLElement,
        members: {
            get form() {
                return wrap(unwrap(this).form, idl.HTMLFormElement);
            },

            get htmlFor() {
                return unwrap(this).htmlFor;
            },
            set htmlFor(newval) {
                unwrap(this).htmlFor = String(newval);
            },

            get control() {
                return wrap(unwrap(this).control, idl.HTMLElement);
            },

        },
    });
});

//
// Interface HTMLInputElement
//

defineLazyProperty(global, "HTMLInputElement", function() {
    return idl.HTMLInputElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLInputElement", function() {
    return new IDLInterface({
        name: "HTMLInputElement",
        superclass: idl.HTMLElement,
        members: {
            get accept() {
                return unwrap(this).accept;
            },
            set accept(newval) {
                unwrap(this).accept = String(newval);
            },

            get alt() {
                return unwrap(this).alt;
            },
            set alt(newval) {
                unwrap(this).alt = String(newval);
            },

            get autocomplete() {
                return unwrap(this).autocomplete;
            },
            set autocomplete(newval) {
                unwrap(this).autocomplete = String(newval);
            },

            get autofocus() {
                return unwrap(this).autofocus;
            },
            set autofocus(newval) {
                unwrap(this).autofocus = Boolean(newval);
            },

            get defaultChecked() {
                return unwrap(this).defaultChecked;
            },
            set defaultChecked(newval) {
                unwrap(this).defaultChecked = Boolean(newval);
            },

            get checked() {
                return unwrap(this).checked;
            },
            set checked(newval) {
                unwrap(this).checked = Boolean(newval);
            },

            get dirName() {
                return unwrap(this).dirName;
            },
            set dirName(newval) {
                unwrap(this).dirName = String(newval);
            },

            get disabled() {
                return unwrap(this).disabled;
            },
            set disabled(newval) {
                unwrap(this).disabled = Boolean(newval);
            },

            get form() {
                return wrap(unwrap(this).form, idl.HTMLFormElement);
            },

            get files() {
                return wrap(unwrap(this).files, idl.FileList);
            },

            get formAction() {
                return unwrap(this).formAction;
            },
            set formAction(newval) {
                unwrap(this).formAction = String(newval);
            },

            get formEnctype() {
                return unwrap(this).formEnctype;
            },
            set formEnctype(newval) {
                unwrap(this).formEnctype = String(newval);
            },

            get formMethod() {
                return unwrap(this).formMethod;
            },
            set formMethod(newval) {
                unwrap(this).formMethod = String(newval);
            },

            get formNoValidate() {
                return unwrap(this).formNoValidate;
            },
            set formNoValidate(newval) {
                unwrap(this).formNoValidate = Boolean(newval);
            },

            get formTarget() {
                return unwrap(this).formTarget;
            },
            set formTarget(newval) {
                unwrap(this).formTarget = String(newval);
            },

            get height() {
                return unwrap(this).height;
            },
            set height(newval) {
                unwrap(this).height = String(newval);
            },

            get indeterminate() {
                return unwrap(this).indeterminate;
            },
            set indeterminate(newval) {
                unwrap(this).indeterminate = Boolean(newval);
            },

            get list() {
                return wrap(unwrap(this).list, idl.HTMLElement);
            },

            get max() {
                return unwrap(this).max;
            },
            set max(newval) {
                unwrap(this).max = String(newval);
            },

            get maxLength() {
                return unwrap(this).maxLength;
            },
            set maxLength(newval) {
                unwrap(this).maxLength = toLong(newval);
            },

            get min() {
                return unwrap(this).min;
            },
            set min(newval) {
                unwrap(this).min = String(newval);
            },

            get multiple() {
                return unwrap(this).multiple;
            },
            set multiple(newval) {
                unwrap(this).multiple = Boolean(newval);
            },

            get name() {
                return unwrap(this).name;
            },
            set name(newval) {
                unwrap(this).name = String(newval);
            },

            get pattern() {
                return unwrap(this).pattern;
            },
            set pattern(newval) {
                unwrap(this).pattern = String(newval);
            },

            get placeholder() {
                return unwrap(this).placeholder;
            },
            set placeholder(newval) {
                unwrap(this).placeholder = String(newval);
            },

            get readOnly() {
                return unwrap(this).readOnly;
            },
            set readOnly(newval) {
                unwrap(this).readOnly = Boolean(newval);
            },

            get required() {
                return unwrap(this).required;
            },
            set required(newval) {
                unwrap(this).required = Boolean(newval);
            },

            get size() {
                return unwrap(this).size;
            },
            set size(newval) {
                unwrap(this).size = toULong(newval);
            },

            get src() {
                return unwrap(this).src;
            },
            set src(newval) {
                unwrap(this).src = String(newval);
            },

            get step() {
                return unwrap(this).step;
            },
            set step(newval) {
                unwrap(this).step = String(newval);
            },

            get type() {
                return unwrap(this).type;
            },
            set type(newval) {
                unwrap(this).type = String(newval);
            },

            get defaultValue() {
                return unwrap(this).defaultValue;
            },
            set defaultValue(newval) {
                unwrap(this).defaultValue = String(newval);
            },

            get value() {
                return unwrap(this).value;
            },
            set value(newval) {
                unwrap(this).value = String(newval);
            },

            get valueAsDate() {
                return wrap(unwrap(this).valueAsDate, idl.Date);
            },
            set valueAsDate(newval) {
                unwrap(this).valueAsDate = unwrap(newval);
            },

            get valueAsNumber() {
                return unwrap(this).valueAsNumber;
            },
            set valueAsNumber(newval) {
                unwrap(this).valueAsNumber = Number(newval);
            },

            get selectedOption() {
                return wrap(unwrap(this).selectedOption, idl.HTMLOptionElement);
            },

            get width() {
                return unwrap(this).width;
            },
            set width(newval) {
                unwrap(this).width = String(newval);
            },

            stepUp: function stepUp(n) {
                return unwrap(this).stepUp(OptionaltoLong(n));
            },

            stepDown: function stepDown(n) {
                return unwrap(this).stepDown(OptionaltoLong(n));
            },

            get willValidate() {
                return unwrap(this).willValidate;
            },

            get validity() {
                return wrap(unwrap(this).validity, idl.ValidityState);
            },

            get validationMessage() {
                return unwrap(this).validationMessage;
            },

            checkValidity: function checkValidity() {
                return unwrap(this).checkValidity();
            },

            setCustomValidity: function setCustomValidity(error) {
                return unwrap(this).setCustomValidity(String(error));
            },

            get labels() {
                return wrap(unwrap(this).labels, idl.NodeList);
            },

            select: function select() {
                return unwrap(this).select();
            },

            get selectionStart() {
                return unwrap(this).selectionStart;
            },
            set selectionStart(newval) {
                unwrap(this).selectionStart = toULong(newval);
            },

            get selectionEnd() {
                return unwrap(this).selectionEnd;
            },
            set selectionEnd(newval) {
                unwrap(this).selectionEnd = toULong(newval);
            },

            get selectionDirection() {
                return unwrap(this).selectionDirection;
            },
            set selectionDirection(newval) {
                unwrap(this).selectionDirection = String(newval);
            },

            setSelectionRange: function setSelectionRange(
                                    start,
                                    end,
                                    direction)
            {
                return unwrap(this).setSelectionRange(
                    toULong(start),
                    toULong(end),
                    OptionalString(direction));
            },

        },
    });
});

//
// Interface HTMLButtonElement
//

defineLazyProperty(global, "HTMLButtonElement", function() {
    return idl.HTMLButtonElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLButtonElement", function() {
    return new IDLInterface({
        name: "HTMLButtonElement",
        superclass: idl.HTMLElement,
        members: {
            get autofocus() {
                return unwrap(this).autofocus;
            },
            set autofocus(newval) {
                unwrap(this).autofocus = Boolean(newval);
            },

            get disabled() {
                return unwrap(this).disabled;
            },
            set disabled(newval) {
                unwrap(this).disabled = Boolean(newval);
            },

            get form() {
                return wrap(unwrap(this).form, idl.HTMLFormElement);
            },

            get formAction() {
                return unwrap(this).formAction;
            },
            set formAction(newval) {
                unwrap(this).formAction = String(newval);
            },

            get formEnctype() {
                return unwrap(this).formEnctype;
            },
            set formEnctype(newval) {
                unwrap(this).formEnctype = String(newval);
            },

            get formMethod() {
                return unwrap(this).formMethod;
            },
            set formMethod(newval) {
                unwrap(this).formMethod = String(newval);
            },

            get formNoValidate() {
                return unwrap(this).formNoValidate;
            },
            set formNoValidate(newval) {
                unwrap(this).formNoValidate = String(newval);
            },

            get formTarget() {
                return unwrap(this).formTarget;
            },
            set formTarget(newval) {
                unwrap(this).formTarget = String(newval);
            },

            get name() {
                return unwrap(this).name;
            },
            set name(newval) {
                unwrap(this).name = String(newval);
            },

            get type() {
                return unwrap(this).type;
            },
            set type(newval) {
                unwrap(this).type = String(newval);
            },

            get value() {
                return unwrap(this).value;
            },
            set value(newval) {
                unwrap(this).value = String(newval);
            },

            get willValidate() {
                return unwrap(this).willValidate;
            },

            get validity() {
                return wrap(unwrap(this).validity, idl.ValidityState);
            },

            get validationMessage() {
                return unwrap(this).validationMessage;
            },

            checkValidity: function checkValidity() {
                return unwrap(this).checkValidity();
            },

            setCustomValidity: function setCustomValidity(error) {
                return unwrap(this).setCustomValidity(String(error));
            },

            get labels() {
                return wrap(unwrap(this).labels, idl.NodeList);
            },

        },
    });
});

//
// Interface HTMLSelectElement
//

defineLazyProperty(global, "HTMLSelectElement", function() {
    return idl.HTMLSelectElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLSelectElement", function() {
    return new IDLInterface({
        name: "HTMLSelectElement",
        superclass: idl.HTMLElement,
        proxyFactory: HTMLSelectElementProxy,
        members: {
            get autofocus() {
                return unwrap(this).autofocus;
            },
            set autofocus(newval) {
                unwrap(this).autofocus = Boolean(newval);
            },

            get disabled() {
                return unwrap(this).disabled;
            },
            set disabled(newval) {
                unwrap(this).disabled = Boolean(newval);
            },

            get form() {
                return wrap(unwrap(this).form, idl.HTMLFormElement);
            },

            get multiple() {
                return unwrap(this).multiple;
            },
            set multiple(newval) {
                unwrap(this).multiple = Boolean(newval);
            },

            get name() {
                return unwrap(this).name;
            },
            set name(newval) {
                unwrap(this).name = String(newval);
            },

            get required() {
                return unwrap(this).required;
            },
            set required(newval) {
                unwrap(this).required = Boolean(newval);
            },

            get size() {
                return unwrap(this).size;
            },
            set size(newval) {
                unwrap(this).size = toULong(newval);
            },

            get type() {
                return unwrap(this).type;
            },

            get options() {
                return wrap(unwrap(this).options, idl.HTMLOptionsCollection);
            },

            get length() {
                return unwrap(this).length;
            },
            set length(newval) {
                unwrap(this).length = toULong(newval);
            },

            item: function item(index) {
                return unwrap(this).item(toULong(index));
            },

            namedItem: function namedItem(name) {
                return unwrap(this).namedItem(String(name));
            },

            remove: function remove(index) {
                return unwrap(this).remove(toLong(index));
            },

            get selectedOptions() {
                return wrap(unwrap(this).selectedOptions, idl.HTMLCollection);
            },

            get selectedIndex() {
                return unwrap(this).selectedIndex;
            },
            set selectedIndex(newval) {
                unwrap(this).selectedIndex = toLong(newval);
            },

            get value() {
                return unwrap(this).value;
            },
            set value(newval) {
                unwrap(this).value = String(newval);
            },

            get willValidate() {
                return unwrap(this).willValidate;
            },

            get validity() {
                return wrap(unwrap(this).validity, idl.ValidityState);
            },

            get validationMessage() {
                return unwrap(this).validationMessage;
            },

            checkValidity: function checkValidity() {
                return unwrap(this).checkValidity();
            },

            setCustomValidity: function setCustomValidity(error) {
                return unwrap(this).setCustomValidity(String(error));
            },

            get labels() {
                return wrap(unwrap(this).labels, idl.NodeList);
            },

        },
    });
});

//
// Interface HTMLDataListElement
//

defineLazyProperty(global, "HTMLDataListElement", function() {
    return idl.HTMLDataListElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLDataListElement", function() {
    return new IDLInterface({
        name: "HTMLDataListElement",
        superclass: idl.HTMLElement,
        members: {
            get options() {
                return wrap(unwrap(this).options, idl.HTMLCollection);
            },

        },
    });
});

//
// Interface HTMLOptGroupElement
//

defineLazyProperty(global, "HTMLOptGroupElement", function() {
    return idl.HTMLOptGroupElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLOptGroupElement", function() {
    return new IDLInterface({
        name: "HTMLOptGroupElement",
        superclass: idl.HTMLElement,
        members: {
            get disabled() {
                return unwrap(this).disabled;
            },
            set disabled(newval) {
                unwrap(this).disabled = Boolean(newval);
            },

            get label() {
                return unwrap(this).label;
            },
            set label(newval) {
                unwrap(this).label = String(newval);
            },

        },
    });
});

//
// Interface HTMLOptionElement
//

defineLazyProperty(global, "HTMLOptionElement", function() {
    return idl.HTMLOptionElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLOptionElement", function() {
    return new IDLInterface({
        name: "HTMLOptionElement",
        superclass: idl.HTMLElement,
        members: {
            get disabled() {
                return unwrap(this).disabled;
            },
            set disabled(newval) {
                unwrap(this).disabled = Boolean(newval);
            },

            get form() {
                return wrap(unwrap(this).form, idl.HTMLFormElement);
            },

            get label() {
                return unwrap(this).label;
            },
            set label(newval) {
                unwrap(this).label = String(newval);
            },

            get defaultSelected() {
                return unwrap(this).defaultSelected;
            },
            set defaultSelected(newval) {
                unwrap(this).defaultSelected = Boolean(newval);
            },

            get selected() {
                return unwrap(this).selected;
            },
            set selected(newval) {
                unwrap(this).selected = Boolean(newval);
            },

            get value() {
                return unwrap(this).value;
            },
            set value(newval) {
                unwrap(this).value = String(newval);
            },

            get text() {
                return unwrap(this).text;
            },
            set text(newval) {
                unwrap(this).text = String(newval);
            },

            get index() {
                return unwrap(this).index;
            },

        },
    });
});

//
// Interface HTMLTextAreaElement
//

defineLazyProperty(global, "HTMLTextAreaElement", function() {
    return idl.HTMLTextAreaElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLTextAreaElement", function() {
    return new IDLInterface({
        name: "HTMLTextAreaElement",
        superclass: idl.HTMLElement,
        members: {
            get autofocus() {
                return unwrap(this).autofocus;
            },
            set autofocus(newval) {
                unwrap(this).autofocus = Boolean(newval);
            },

            get cols() {
                return unwrap(this).cols;
            },
            set cols(newval) {
                unwrap(this).cols = toULong(newval);
            },

            get dirName() {
                return unwrap(this).dirName;
            },
            set dirName(newval) {
                unwrap(this).dirName = String(newval);
            },

            get disabled() {
                return unwrap(this).disabled;
            },
            set disabled(newval) {
                unwrap(this).disabled = Boolean(newval);
            },

            get form() {
                return wrap(unwrap(this).form, idl.HTMLFormElement);
            },

            get maxLength() {
                return unwrap(this).maxLength;
            },
            set maxLength(newval) {
                unwrap(this).maxLength = toLong(newval);
            },

            get name() {
                return unwrap(this).name;
            },
            set name(newval) {
                unwrap(this).name = String(newval);
            },

            get placeholder() {
                return unwrap(this).placeholder;
            },
            set placeholder(newval) {
                unwrap(this).placeholder = String(newval);
            },

            get readOnly() {
                return unwrap(this).readOnly;
            },
            set readOnly(newval) {
                unwrap(this).readOnly = Boolean(newval);
            },

            get required() {
                return unwrap(this).required;
            },
            set required(newval) {
                unwrap(this).required = Boolean(newval);
            },

            get rows() {
                return unwrap(this).rows;
            },
            set rows(newval) {
                unwrap(this).rows = toULong(newval);
            },

            get wrap() {
                return unwrap(this).wrap;
            },
            set wrap(newval) {
                unwrap(this).wrap = String(newval);
            },

            get type() {
                return unwrap(this).type;
            },

            get defaultValue() {
                return unwrap(this).defaultValue;
            },
            set defaultValue(newval) {
                unwrap(this).defaultValue = String(newval);
            },

            get value() {
                return unwrap(this).value;
            },
            set value(newval) {
                unwrap(this).value = String(newval);
            },

            get textLength() {
                return unwrap(this).textLength;
            },

            get willValidate() {
                return unwrap(this).willValidate;
            },

            get validity() {
                return wrap(unwrap(this).validity, idl.ValidityState);
            },

            get validationMessage() {
                return unwrap(this).validationMessage;
            },

            checkValidity: function checkValidity() {
                return unwrap(this).checkValidity();
            },

            setCustomValidity: function setCustomValidity(error) {
                return unwrap(this).setCustomValidity(String(error));
            },

            get labels() {
                return wrap(unwrap(this).labels, idl.NodeList);
            },

            select: function select() {
                return unwrap(this).select();
            },

            get selectionStart() {
                return unwrap(this).selectionStart;
            },
            set selectionStart(newval) {
                unwrap(this).selectionStart = toULong(newval);
            },

            get selectionEnd() {
                return unwrap(this).selectionEnd;
            },
            set selectionEnd(newval) {
                unwrap(this).selectionEnd = toULong(newval);
            },

            get selectionDirection() {
                return unwrap(this).selectionDirection;
            },
            set selectionDirection(newval) {
                unwrap(this).selectionDirection = String(newval);
            },

            setSelectionRange: function setSelectionRange(
                                    start,
                                    end,
                                    direction)
            {
                return unwrap(this).setSelectionRange(
                    toULong(start),
                    toULong(end),
                    OptionalString(direction));
            },

        },
    });
});

//
// Interface HTMLKeygenElement
//

defineLazyProperty(global, "HTMLKeygenElement", function() {
    return idl.HTMLKeygenElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLKeygenElement", function() {
    return new IDLInterface({
        name: "HTMLKeygenElement",
        superclass: idl.HTMLElement,
        members: {
            get autofocus() {
                return unwrap(this).autofocus;
            },
            set autofocus(newval) {
                unwrap(this).autofocus = Boolean(newval);
            },

            get challenge() {
                return unwrap(this).challenge;
            },
            set challenge(newval) {
                unwrap(this).challenge = String(newval);
            },

            get disabled() {
                return unwrap(this).disabled;
            },
            set disabled(newval) {
                unwrap(this).disabled = Boolean(newval);
            },

            get form() {
                return wrap(unwrap(this).form, idl.HTMLFormElement);
            },

            get keytype() {
                return unwrap(this).keytype;
            },
            set keytype(newval) {
                unwrap(this).keytype = String(newval);
            },

            get name() {
                return unwrap(this).name;
            },
            set name(newval) {
                unwrap(this).name = String(newval);
            },

            get type() {
                return unwrap(this).type;
            },

            get willValidate() {
                return unwrap(this).willValidate;
            },

            get validity() {
                return wrap(unwrap(this).validity, idl.ValidityState);
            },

            get validationMessage() {
                return unwrap(this).validationMessage;
            },

            checkValidity: function checkValidity() {
                return unwrap(this).checkValidity();
            },

            setCustomValidity: function setCustomValidity(error) {
                return unwrap(this).setCustomValidity(String(error));
            },

            get labels() {
                return wrap(unwrap(this).labels, idl.NodeList);
            },

        },
    });
});

//
// Interface HTMLOutputElement
//

defineLazyProperty(global, "HTMLOutputElement", function() {
    return idl.HTMLOutputElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLOutputElement", function() {
    return new IDLInterface({
        name: "HTMLOutputElement",
        superclass: idl.HTMLElement,
        members: {
            get htmlFor() {
                return wrap(unwrap(this).htmlFor, idl.DOMSettableTokenList);
            },

            get form() {
                return wrap(unwrap(this).form, idl.HTMLFormElement);
            },

            get name() {
                return unwrap(this).name;
            },
            set name(newval) {
                unwrap(this).name = String(newval);
            },

            get type() {
                return unwrap(this).type;
            },

            get defaultValue() {
                return unwrap(this).defaultValue;
            },
            set defaultValue(newval) {
                unwrap(this).defaultValue = String(newval);
            },

            get value() {
                return unwrap(this).value;
            },
            set value(newval) {
                unwrap(this).value = String(newval);
            },

            get willValidate() {
                return unwrap(this).willValidate;
            },

            get validity() {
                return wrap(unwrap(this).validity, idl.ValidityState);
            },

            get validationMessage() {
                return unwrap(this).validationMessage;
            },

            checkValidity: function checkValidity() {
                return unwrap(this).checkValidity();
            },

            setCustomValidity: function setCustomValidity(error) {
                return unwrap(this).setCustomValidity(String(error));
            },

            get labels() {
                return wrap(unwrap(this).labels, idl.NodeList);
            },

        },
    });
});

//
// Interface HTMLProgressElement
//

defineLazyProperty(global, "HTMLProgressElement", function() {
    return idl.HTMLProgressElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLProgressElement", function() {
    return new IDLInterface({
        name: "HTMLProgressElement",
        superclass: idl.HTMLElement,
        members: {
            get value() {
                return unwrap(this).value;
            },
            set value(newval) {
                unwrap(this).value = Number(newval);
            },

            get max() {
                return unwrap(this).max;
            },
            set max(newval) {
                unwrap(this).max = Number(newval);
            },

            get position() {
                return unwrap(this).position;
            },

            get labels() {
                return wrap(unwrap(this).labels, idl.NodeList);
            },

        },
    });
});

//
// Interface HTMLMeterElement
//

defineLazyProperty(global, "HTMLMeterElement", function() {
    return idl.HTMLMeterElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLMeterElement", function() {
    return new IDLInterface({
        name: "HTMLMeterElement",
        superclass: idl.HTMLElement,
        members: {
            get value() {
                return unwrap(this).value;
            },
            set value(newval) {
                unwrap(this).value = Number(newval);
            },

            get min() {
                return unwrap(this).min;
            },
            set min(newval) {
                unwrap(this).min = Number(newval);
            },

            get max() {
                return unwrap(this).max;
            },
            set max(newval) {
                unwrap(this).max = Number(newval);
            },

            get low() {
                return unwrap(this).low;
            },
            set low(newval) {
                unwrap(this).low = Number(newval);
            },

            get high() {
                return unwrap(this).high;
            },
            set high(newval) {
                unwrap(this).high = Number(newval);
            },

            get optimum() {
                return unwrap(this).optimum;
            },
            set optimum(newval) {
                unwrap(this).optimum = Number(newval);
            },

            get labels() {
                return wrap(unwrap(this).labels, idl.NodeList);
            },

        },
    });
});

//
// Interface ValidityState
//

defineLazyProperty(global, "ValidityState", function() {
    return idl.ValidityState.publicInterface;
}, true);

defineLazyProperty(idl, "ValidityState", function() {
    return new IDLInterface({
        name: "ValidityState",
        members: {
            get valueMissing() {
                return unwrap(this).valueMissing;
            },

            get typeMismatch() {
                return unwrap(this).typeMismatch;
            },

            get patternMismatch() {
                return unwrap(this).patternMismatch;
            },

            get tooLong() {
                return unwrap(this).tooLong;
            },

            get rangeUnderflow() {
                return unwrap(this).rangeUnderflow;
            },

            get rangeOverflow() {
                return unwrap(this).rangeOverflow;
            },

            get stepMismatch() {
                return unwrap(this).stepMismatch;
            },

            get customError() {
                return unwrap(this).customError;
            },

            get valid() {
                return unwrap(this).valid;
            },

        },
    });
});

//
// Interface HTMLDetailsElement
//

defineLazyProperty(global, "HTMLDetailsElement", function() {
    return idl.HTMLDetailsElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLDetailsElement", function() {
    return new IDLInterface({
        name: "HTMLDetailsElement",
        superclass: idl.HTMLElement,
        members: {
            get open() {
                return unwrap(this).open;
            },
            set open(newval) {
                unwrap(this).open = Boolean(newval);
            },

        },
    });
});

//
// Interface HTMLCommandElement
//

defineLazyProperty(global, "HTMLCommandElement", function() {
    return idl.HTMLCommandElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLCommandElement", function() {
    return new IDLInterface({
        name: "HTMLCommandElement",
        superclass: idl.HTMLElement,
        members: {
            get type() {
                return unwrap(this).type;
            },
            set type(newval) {
                unwrap(this).type = String(newval);
            },

            get label() {
                return unwrap(this).label;
            },
            set label(newval) {
                unwrap(this).label = String(newval);
            },

            get icon() {
                return unwrap(this).icon;
            },
            set icon(newval) {
                unwrap(this).icon = String(newval);
            },

            get disabled() {
                return unwrap(this).disabled;
            },
            set disabled(newval) {
                unwrap(this).disabled = Boolean(newval);
            },

            get checked() {
                return unwrap(this).checked;
            },
            set checked(newval) {
                unwrap(this).checked = Boolean(newval);
            },

            get radiogroup() {
                return unwrap(this).radiogroup;
            },
            set radiogroup(newval) {
                unwrap(this).radiogroup = String(newval);
            },

        },
    });
});

//
// Interface HTMLMenuElement
//

defineLazyProperty(global, "HTMLMenuElement", function() {
    return idl.HTMLMenuElement.publicInterface;
}, true);

defineLazyProperty(idl, "HTMLMenuElement", function() {
    return new IDLInterface({
        name: "HTMLMenuElement",
        superclass: idl.HTMLElement,
        members: {
            get type() {
                return unwrap(this).type;
            },
            set type(newval) {
                unwrap(this).type = String(newval);
            },

            get label() {
                return unwrap(this).label;
            },
            set label(newval) {
                unwrap(this).label = String(newval);
            },

        },
    });
});



/************************************************************************
 *  src/ArrayProxy.js
 ************************************************************************/

//@line 1 "src/ArrayProxy.js"
// This is a factory function for Array proxy objects. 
//
// The function takes the idl type of the array elements as its first argument
// so we can create more specific factory functions with .bind().
// See the end of the file for custom constructors for specific element types
// 
function ArrayProxy(elementType, array) {
    var handler = O.create(ArrayProxy.handler);
    handler.elementType = elementType;  
    handler.array = array;
    handler.localprops = O.create(null);
    return Proxy.create(handler, Array.prototype);
}

ArrayProxy.handler = {
    isArrayIndex: function(name) { return String(toULong(name)) === name; },
    getOwnPropertyDescriptor: function getOwnPropertyDescriptor(name) {
        if (name === "length") {
            return {
                value: this.array.length,
                writable: false,
                enumerable: false,
                configurable: true
            };
        }
        else if (this.isArrayIndex(name)) {
            var idx = toULong(name);
            if (idx >= this.array.length) return;  // Out of bounds

            return {
                value: wrap(this.array[idx], this.elementType),
                writable: false,
                enumerable: true,
                configurable: true
            };
        }
        else {
            // We'll ensure that the property is configurable when we
            // set it, so we don't have to check that here.
            return O.getOwnPropertyDescriptor(this.localprops, name);
        }
    },

    getPropertyDescriptor: function(name) {
        // If ES6 implements Object.getPropertyDescriptor() we can use
        // that here instead of this long chain.
        var desc = this.getOwnPropertyDescriptor(name) ||
            O.getOwnPropertyDescriptor(A.prototype, name) ||
            O.getOwnPropertyDescriptor(O.prototype, name);
        if (desc) desc.configurable = true; // Proxies require this
        return desc;
    },

    getOwnPropertyNames: function getOwnPropertyNames() {
        var r = [];
        for (var i = 0, n = this.array.length; i < n; i++)
            push(r, String(i));
        return concat(r, O.getOwnPropertyNames(this.localprops));
    },

    defineProperty: function(name, desc) {
        // XXX
        // For now, we "Reject" by throwing TypeError.  Proxies may change
        // so we only have to return false.
        if (this.isArrayIndex(name) || name === "length")
            throw new TypeError("read only array");

        desc.configurable = true;
        O.defineProperty(this.localprops, name, desc);
    },

    delete: function(name) {
        // Can't delete the length property
        if (name === "length") return false;

        // Can't delete array elements, but if they don't exist, don't complain
        if (this.isArrayIndex(name)) {
            var idx = toULong(name);
            return idx >= this.array.length;
        }
        // Finally, try deleting an expando
        return delete this.localprops[name];
    },

    // WebIDL: Array host objects defy being fixed; if Object.freeze,
    // Object.seal or Object.preventExtensions is called on one, the
    // function MUST throw a TypeError.
    fix: function() {},

    // Get all enumerable properties
    // XXX: Remove this method when this bug is fixed:
    // https://bugzilla.mozilla.org/show_bug.cgi?id=665198
    enumerate: function() {
        var r = [];
        for (var i = 0, n = this.array.length; i < n; i++)
            push(r, String(i));
        for(var name in this.localprops) push(r, name);
        for(var name in Array.prototype) push(r, name);
        return r;
    }
}

//const AttrArrayProxy = ArrayProxy.bind(null, idl.Attr);
function AttrArrayProxy(array) { return ArrayProxy(idl.Attr, array); }


/************************************************************************
 *  src/NodeListProxy.js
 ************************************************************************/

//@line 1 "src/NodeListProxy.js"
// A factory function for NodeList proxy objects
function NodeListProxy(list) {
    // This function expects an object with a length property and an item() 
    // method.  If we pass it a plain array, it will add the item() method
    // 
    // We should avoid reading the length property of the list when possible
    // because in lazy implementations such as impl/FilteredElementList, 
    // reading the length forces the filter to process the entire document
    // tree undoing the laziness.  
    if (isArray(list)) {
        if (!hasOwnProperty(list, "item"))
            list.item = function(n) { return list[n]; };
    }

    var handler = O.create(NodeListProxy.handler);
    handler.list = list;
    handler.localprops = O.create(null);

    return Proxy.create(handler, idl.NodeList.prototype);
}

// This is the prototype object for the proxy handler object
// 
// For now, while the Proxy spec is still in flux, this handler
// defines only the fundamental traps.  We can add the derived traps
// later if there is a performance bottleneck.
NodeListProxy.handler = {
    isArrayIndex: function(name) { return String(toULong(name)) === name; },

    getOwnPropertyDescriptor: function getOwnPropertyDescriptor(name) {
        if (this.isArrayIndex(name)) {
            // If the index is greater than the length, then we'll just
            // get null or undefined here and do nothing. That is better
            // than testing length.
            var v = this.list.item(name);
            if (v) {
                return { 
                    value: wrap(v, idl.Node),
                    writable: false,
                    enumerable: true,
                    configurable: true
                };
            }
            else {
                // We're never going to allow array index properties to be
                // set on localprops, so we don't have to do the test
                // below and can just return nothing now.
                return;
            }
        }
        return O.getOwnPropertyDescriptor(this.localprops, name);
    },
    getPropertyDescriptor: function(name) {
        var desc = this.getOwnPropertyDescriptor(name) ||
            O.getOwnPropertyDescriptor(idl.NodeList.prototype, name) ||
            O.getOwnPropertyDescriptor(O.prototype, name);
        if (desc) desc.configurable = true; // Proxies require this
        return desc;
    },
    getOwnPropertyNames: function getOwnPropertyNames() {
        var r = [];
        for (var i = 0, n = this.list.length; i < n; i++)
            push(r, String(i));
        return concat(r, O.getOwnPropertyNames(this.localprops));
    },
    defineProperty: function(name, desc) {
        // XXX
        // The WebIDL algorithm says we should "Reject" these attempts by
        // throwing or returning false, depending on the Throw argument, which
        // is usually strict-mode dependent.  While this is being clarified
        // I'll just throw here.  May need to change this to return false
        // instead.
        if (this.isArrayIndex(name)) 
            throw new TypeError(
                "can't set or create indexed properties '" + name + "'");

        O.defineProperty(this.localprops, name, desc);
    },
    delete: function(name) {
        // Can't delete index properties
        if (this.isArrayIndex(name)) {
            // If an item exists at that index, return false: won't delete it
            // Otherwise, if no item, then the index was out of bounds and
            // we return true to indicate that the deletion was "successful"
            return !this.list.time(name);
        }
        return delete this.localprops[name];
    },

    // WebIDL: Host objects implementing an interface that supporst
    // indexed or named properties defy being fixed; if Object.freeze,
    // Object.seal or Object.preventExtensions is called on one, these
    // the function MUST throw a TypeError.
    // 
    // Proxy proposal: When handler.fix() returns undefined, the
    // corresponding call to Object.freeze, Object.seal, or
    // Object.preventExtensions will throw a TypeError.
    fix: function() {},

    // Get all enumerable properties
    // XXX: Remove this method when this bug is fixed:
    // https://bugzilla.mozilla.org/show_bug.cgi?id=665198
    enumerate: function() {
        var r = [];
        for (var i = 0, n = this.list.length; i < n; i++)
            push(r, String(i));
        for(name in this.localprops) push(r, name);
        for(name in idl.NodeList.prototype) push(r, name);
        return r;
    }
};



/************************************************************************
 *  src/HTMLCollectionProxy.js
 ************************************************************************/

//@line 1 "src/HTMLCollectionProxy.js"
// A factory function for HTMLCollection proxy objects.
// Expects an object with a length property and item() and namedItem() methods.
// That object must also have a namedItems property that returns an object
// that maps element names to some value.
// 
// XXX: bug I can't define an expando property if there is a named property
// with the same name. I think it is a bug in the Proxy itself.  Looks like
// define property is not even being called.
// 
function HTMLCollectionProxy(collection) {
    var handler = O.create(HTMLCollectionProxy.handler);
    handler.collection = collection;
    handler.localprops = O.create(null);
    return Proxy.create(handler, idl.HTMLCollection.prototype);
}

// This is the prototype object for the proxy handler object
HTMLCollectionProxy.handler = {
    isArrayIndex: function(name) { return String(toULong(name)) === name; },

    // This is the "named property visibility algorithm" from WebIDL
    isVisible: function(name) {
        // 1) If P is not a supported property name of O, then return false.
        if (!(name in this.collection.namedItems)) return false;

        // 2) If O implements an interface that has the
        // [OverrideBuiltins] extended attribute, then return true.
        // HTMLCollection does not OverrideBuiltins, so skip this step

        // 3) If O has an own property named P, then return false.
        if (hasOwnProperty(this.localprops, name)) return false;

        // 4) Let prototype be the value of the internal [[Prototype]]
        // property of O.
        // 5) If prototype is null, then return true.
        // 6) If the result of calling the [[HasProperty]] internal
        // method on prototype with property name P is true, then
        // return false.
        if (name in idl.HTMLCollection.prototype) return false;

        // 7) Return true.
        return true;
    },

    getOwnPropertyDescriptor: function getOwnPropertyDescriptor(name) {
        var item;
        if (this.isArrayIndex(name)) {
            var idx = toULong(name);
            if (idx < this.collection.length) {
                return {
                    value: wrap(this.collection.item(idx), idl.Element),
                    writable: false,
                    enumerable: true,
                    configurable: true
                };
            }
        }

        if (this.isVisible(name)) {
            return {
                value: wrap(this.collection.namedItem(name), idl.Element),
                writable: false,
                enumerable: true,
                configurable: true
            };
        }

        return O.getOwnPropertyDescriptor(this.localprops, name);
    },

    getPropertyDescriptor: function(name) {
        var desc = this.getOwnPropertyDescriptor(name) ||
            O.getOwnPropertyDescriptor(idl.HTMLCollection.prototype, name) ||
            O.getOwnPropertyDescriptor(Object.prototype, name);
        if (desc) desc.configurable = true; // Proxies require this
        return desc;
    },

    getOwnPropertyNames: function getOwnPropertyNames() {
        var names = [];
        for (var i = 0, n = this.collection.length; i < n; i++)
            push(names, String(i));
        for(var n in this.collection.namedItems) 
            push(names, n);
        return concat(r, O.getOwnPropertyNames(this.localprops));
    },

    defineProperty: function(name, desc) {
        // XXX
        // For now, we "Reject" by throwing TypeError.  Proxies may change
        // so we only have to return false.
        if (this.isArrayIndex(name)) 
            throw new TypeError(
                "can't set or create indexed property '" + name + "'");

        // Don't allow named properties to overridden by expando properties,
        // even with an explicit Object.defineProperty() call.  
        // XXX
        // The resolution of this issue is still pending on the mailing list.
        if (name in this.collection.namedItems)
            throw new TypeError(
                "can't override named property '" + name + "'");

        desc.configurable = true;
        O.defineProperty(this.localprops, name, desc);
    },

    delete: function(name) {
        // Can't delete array elements, but if they don't exist, don't complain
        if (this.isArrayIndex(name)) {
            var idx = toULong(name);
            return idx >= this.collection.length;
        }

        // Can't delete named properties 
        if (this.isVisible(name)) {
            return false;
        }

        // Finally, try deleting an expando
        return delete this.localprops[name];
    },

    fix: function() {},

    // Get all enumerable properties
    // XXX: Remove this method when this bug is fixed:
    // https://bugzilla.mozilla.org/show_bug.cgi?id=665198
    enumerate: function() {
        var names = [];
        for (var i = 0, n = this.collection.length; i < n; i++)
            push(names, String(i));
        for(var n in this.collection.namedItems) 
            push(names, n);
        for(var name in this.localprops)
            push(names, name);
        for(var name in idl.HTMLCollection.prototype)
            push(names, name);
        return names;
    }
};



/************************************************************************
 *  src/DOMException.js
 ************************************************************************/

//@line 1 "src/DOMException.js"
//
// This DOMException implementation is not WebIDL compatible.
// WebIDL exceptions are in flux right now, so I'm just doing something
// simple and approximately web compatible for now.
//
const INDEX_SIZE_ERR = 1;
const HIERARCHY_REQUEST_ERR = 3;
const WRONG_DOCUMENT_ERR = 4;
const INVALID_CHARACTER_ERR = 5;
const NO_MODIFICATION_ALLOWED_ERR = 7;
const NOT_FOUND_ERR = 8;
const NOT_SUPPORTED_ERR = 9;
const INVALID_STATE_ERR = 11;
const SYNTAX_ERR = 12;
const INVALID_MODIFICATION_ERR = 13;
const NAMESPACE_ERR = 14;
const INVALID_ACCESS_ERR = 15;
const TYPE_MISMATCH_ERR = 17;
const SECURITY_ERR = 18;
const NETWORK_ERR = 19;
const ABORT_ERR = 20;
const URL_MISMATCH_ERR = 21;
const QUOTA_EXCEEDED_ERR = 22;
const TIMEOUT_ERR = 23;
const INVALID_NODE_TYPE_ERR = 24;
const DATA_CLONE_ERR = 25;

global.DOMException = (function() {
    // Code to name
    const names = [
        null,  // No error with code 0
        "INDEX_SIZE_ERR",
        null, // historical
        "HIERARCHY_REQUEST_ERR",
        "WRONG_DOCUMENT_ERR",
        "INVALID_CHARACTER_ERR",
        null, // historical
        "NO_MODIFICATION_ALLOWED_ERR",
        "NOT_FOUND_ERR",
        "NOT_SUPPORTED_ERR",
        null, // historical
        "INVALID_STATE_ERR",
        "SYNTAX_ERR",
        "INVALID_MODIFICATION_ERR",
        "NAMESPACE_ERR",
        "INVALID_ACCESS_ERR",
        null, // historical
        "TYPE_MISMATCH_ERR",
        "SECURITY_ERR",
        "NETWORK_ERR",
        "ABORT_ERR",
        "URL_MISMATCH_ERR",
        "QUOTA_EXCEEDED_ERR",
        "TIMEOUT_ERR",
        "INVALID_NODE_TYPE_ERR",
        "DATA_CLONE_ERR",
    ];

    // Code to message
    // These strings are from the 13 May 2011 Editor's Draft of DOM Core.
    // http://dvcs.w3.org/hg/domcore/raw-file/tip/Overview.html
    // Copyright © 2011 W3C® (MIT, ERCIM, Keio), All Rights Reserved. 
    // Used under the terms of the W3C Document License:
    // http://www.w3.org/Consortium/Legal/2002/copyright-documents-20021231
    const messages = [
        null,  // No error with code 0
        "INDEX_SIZE_ERR (1): the index is not in the allowed range",
        null,
        "HIERARCHY_REQUEST_ERR (3): the operation would yield an incorrect nodes model",
        "WRONG_DOCUMENT_ERR (4): the object is in the wrong Document, a call to importNode is required",
        "INVALID_CHARACTER_ERR (5): the string contains invalid characters",
        null,
        "NO_MODIFICATION_ALLOWED_ERR (7): the object can not be modified",
        "NOT_FOUND_ERR (8): the object can not be found here",
        "NOT_SUPPORTED_ERR (9): this operation is not supported",
        null,
        "INVALID_STATE_ERR (11): the object is in an invalid state",
        "SYNTAX_ERR (12): the string did not match the expected pattern",
        "INVALID_MODIFICATION_ERR (13): the object can not be modified in this way",
        "NAMESPACE_ERR (14): the operation is not allowed by Namespaces in XML",
        "INVALID_ACCESS_ERR (15): the object does not support the operation or argument",
        null,
        "TYPE_MISMATCH_ERR (17): the type of the object does not match the expected type",
        "SECURITY_ERR (18): the operation is insecure",
        "NETWORK_ERR (19): a network error occurred",
        "ABORT_ERR (20): the user aborted an operation",
        "URL_MISMATCH_ERR (21): the given URL does not match another URL",
        "QUOTA_EXCEEDED_ERR (22): the quota has been exceeded",
        "TIMEOUT_ERR (23): a timeout occurred",
        "INVALID_NODE_TYPE_ERR (24): the supplied node is invalid or has an invalid ancestor for this operation",
        "DATA_CLONE_ERR (25): the object can not be cloned.",
    ];

    // Name to code
    const constants = {
        INDEX_SIZE_ERR: INDEX_SIZE_ERR,
        DOMSTRING_SIZE_ERR: 2, // historical
        HIERARCHY_REQUEST_ERR: HIERARCHY_REQUEST_ERR,
        WRONG_DOCUMENT_ERR: WRONG_DOCUMENT_ERR,
        INVALID_CHARACTER_ERR: INVALID_CHARACTER_ERR,
        NO_DATA_ALLOWED_ERR: 6, // historical
        NO_MODIFICATION_ALLOWED_ERR: NO_MODIFICATION_ALLOWED_ERR,
        NOT_FOUND_ERR: NOT_FOUND_ERR,
        NOT_SUPPORTED_ERR: NOT_SUPPORTED_ERR,
        INUSE_ATTRIBUTE_ERR: 10, // historical
        INVALID_STATE_ERR: INVALID_STATE_ERR,
        SYNTAX_ERR: SYNTAX_ERR,
        INVALID_MODIFICATION_ERR: INVALID_MODIFICATION_ERR,
        NAMESPACE_ERR: NAMESPACE_ERR,
        INVALID_ACCESS_ERR: INVALID_ACCESS_ERR,
        VALIDATION_ERR: 16, // historical
        TYPE_MISMATCH_ERR: TYPE_MISMATCH_ERR,
        SECURITY_ERR: SECURITY_ERR,
        NETWORK_ERR: NETWORK_ERR,
        ABORT_ERR: ABORT_ERR,
        URL_MISMATCH_ERR: URL_MISMATCH_ERR,
        QUOTA_EXCEEDED_ERR: QUOTA_EXCEEDED_ERR,
        TIMEOUT_ERR: TIMEOUT_ERR,
        INVALID_NODE_TYPE_ERR: INVALID_NODE_TYPE_ERR,
        DATA_CLONE_ERR: DATA_CLONE_ERR,
    };

    function DOMException(code) {
/*
        // This kudge is so we get lineNumber, fileName and stack properties
        var e = Error(messages[code]);
        e.__proto__ = DOMException.prototype;
*/

        var e = O.create(DOMException.prototype);
        e.code = code;
        e.message = messages[code];
        e.name = names[code];

        // Get stack, lineNumber and fileName properties like a real
        // Error object has.
        var x = Error();
        var frames = split(x.stack,"\n");
        A.shift(frames);
        e.stack = join(frames,"\n");
        var parts = match(frames[0], /[^@]*@([^:]*):(\d*)/);
        e.fileName = parts[1];
        e.lineNumber = parts[2];
        
        return e;
    }

    DOMException.prototype = O.create(Error.prototype);

    // Initialize the constants on DOMException and DOMException.prototype
    for(var c in constants) {
        var v = constants[c];
        defineConstantProp(DOMException, c, v);
        defineConstantProp(DOMException.prototype, c, v);
    }

    return DOMException;
}());

// 
// Shortcut functions for throwing errors of various types.
// 
function IndexSizeError() { throw DOMException(INDEX_SIZE_ERR); }
function HierarchyRequestError() { throw DOMException(HIERARCHY_REQUEST_ERR); }
function WrongDocumentError() { throw DOMException(WRONG_DOCUMENT_ERR); }
function InvalidCharacterError() { throw DOMException(INVALID_CHARACTER_ERR); }
function NoModificationAllowedError() { throw DOMException(NO_MODIFICATION_ALLOWED_ERR); }
function NotFoundError() { throw DOMException(NOT_FOUND_ERR); }
function NotSupportedError() { throw DOMException(NOT_SUPPORTED_ERR); }
function InvalidStateError() { throw DOMException(INVALID_STATE_ERR); }
function SyntaxError() { throw DOMException(SYNTAX_ERR); }
function InvalidModificationError() { throw DOMException(INVALID_MODIFICATION_ERR); }
function NamespaceError() { throw DOMException(NAMESPACE_ERR); }
function InvalidAccessError() { throw DOMException(INVALID_ACCESS_ERR); }
function TypeMismatchError() { throw DOMException(TYPE_MISMATCH_ERR); }
function SecurityError() { throw DOMException(SECURITY_ERR); }
function NetworkError() { throw DOMException(NETWORK_ERR); }
function AbortError() { throw DOMException(ABORT_ERR); }
function UrlMismatchError() { throw DOMException(URL_MISMATCH_ERR); }
function QuotaExceededError() { throw DOMException(QUOTA_EXCEEDED_ERR); }
function TimeoutError() { throw DOMException(TIMEOUT_ERR); }
function InvalidNodeTypeError() { throw DOMException(INVALID_NODE_TYPE_ERR); }
function DataCloneError() { throw DOMException(DATA_CLONE_ERR); }




/************************************************************************
 *  src/impl/EventTarget.js
 ************************************************************************/

//@line 1 "src/impl/EventTarget.js"
defineLazyProperty(impl, "EventTarget", function() {
    function EventTarget() {}

    EventTarget.prototype = O.create(Object.prototype, {

        // XXX
        // See WebIDL §4.8 for details on object event handlers
        // and how they should behave.  We actually have to accept
        // any object to addEventListener... Can't type check it.
        // on registration.

        // XXX:
        // Capturing event listeners are sort of rare.  I think I can optimize
        // them so that dispatchEvent can skip the capturing phase (or much of
        // it).  Each time a capturing listener is added, increment a flag on
        // the target node and each of its ancestors.  Decrement when removed.
        // And update the counter when nodes are added and removed from the
        // tree as well.  Then, in dispatch event, the capturing phase can 
        // abort if it sees any node with a zero count.  
        addEventListener: constant(function addEventListener(type,
                                                             listener,
                                                             capture) {
            
            if (!listener) return;
            if (!this._listeners) this._listeners = {};
            if (!(type in this._listeners)) this._listeners[type] = {};
            var list = this._listeners[type];

            // If this listener has already been registered, just return
            for(var i = 0, n = list.length; i < n; i++) {
                var l = list[i];
                if (l.listener === listener && l.capture === capture)
                    return;
            }
            
            // Add an object to the list of listeners
            var obj = { listener: listener, capture: capture };
            if (typeof listener === "function") obj.f = listener;
            push(list, obj);
        }),

        removeEventListener: constant(function removeEventListener(type,
                                                                   listener,
                                                                   capture) {
            if (this._listeners) {
                var list = this._listeners[type];
                if (list) {
                    // Find the listener in the list and remove it
                    for(var i = 0, n = list.length; i < n; i++) {
                        var l = list[i];
                        if (l.listener === listener && l.capture === capture) {
                            if (list.length === 1)
                                delete this._listeners[type];
                            else 
                                splice(list, i, 1);
                        }
                    }
                }
            }
        }),

        // See DOMCore §4.4
        dispatchEvent: constant(function dispatchEvents(event) {

            function invoke(target, event) {
                var type = event.type, phase = event.eventPhase;
                event.currentTarget = target;

                if (!target._listeners) return;
                var list = target._listeners[type];
                if (!list) return;

                for(var i = 0, n = list.length; i < n; i++) {
                    if (event._stopImmediatePropagation) return;
                    var l = list[i];
                    if ((phase === CAPTURING_PHASE && !l.capture) ||
                        (phase === BUBBLING_PHASE && l.capture))
                        continue;
                    if (l.f) {
                        l.f.call(event.currentTarget, event);
                    }
                    else {
                        var f = l.listener.handleEvent;
                        if (typeof f !== "function")
                            throw TypeError("handleEvent property of " +
                                            "event listener object is " +
                                            "not a function.");
                        f.call(l.listener, event);
                    }
                }
            }

            if (!event._initialized || event._dispatching) InvalidStateError();
            event.isTrusted = false;
            
            // Begin dispatching the event now
            event._dispatching = true;
            event.target = this;

            // Build the list of targets for the capturing and bubbling phases
            // XXX: we'll eventually have to add Window to this list.
            var ancestors = [];
            for(var n = this.parentNode; n; n = n.parentNode)
                push(ancestors, n);

            // Capturing phase
            event.eventPhase = CAPTURING_PHASE;
            for(var i = ancestors.length-1; i >= 0; i--) {
                invoke(ancestors[i], event);
                if (event._propagationStopped) break;
            }

            // At target phase
            if (!event._propagationStopped) {
                event.eventPhase = AT_TARGET;
                invoke(this, event);
            }

            // Bubbling phase
            if (event.bubbles && !event._propagationStopped) {
                event.eventPhase = BUBBLING_PHASE;
                for(var i = 0, n = ancestors.length; i < n; i++) {
                    invoke(ancestors[i], event);
                    if (event._propagationStopped) break;
                }
            }

            event._dispatching = false;
            event.eventPhase = AT_TARGET;
            event.currentTarget = null;

            return !event.defaultPrevented;
        }),
    });

    return EventTarget;
});


/************************************************************************
 *  src/impl/Node.js
 ************************************************************************/

//@line 1 "src/impl/Node.js"
defineLazyProperty(impl, "Node", function() {
    // All nodes have a nodeType and an ownerDocument.
    // Once inserted, they also have a parentNode.
    // This is an abstract class; all nodes in a document are instances
    // of a subtype, so all the properties are defined by more specific
    // constructors.
    function Node() {
    }

    Node.prototype = O.create(impl.EventTarget.prototype, {

        // Node that are not inserted into the tree inherit a null parent
        // XXX
        // Can't use constant(null) here because then I couldn't set a non-null
        // value that would override the inherited constant.  Perhaps that 
        // means I shouldn't use the prototype and should just set the
        // value in each node constructor?
        parentNode: { value: null, writable: true },
        
        // XXX: the baseURI attribute is defined by dom core, but 
        // a correct implementation of it requires HTML features, so 
        // we'll come back to this later.
        baseURI: attribute(nyi),

        parentElement: attribute(function() {
            return (this.parentNode && this.parentNode.nodeType===ELEMENT_NODE)
                ? this.parentNode
                : null
        }),
        
        hasChildNodes: constant(function() {  // Overridden in leaf.js
            return this.childNodes.length > 0;
        }),

        firstChild: attribute(function() {
            return this.childNodes.length === 0
                ? null
                : this.childNodes[0];
        }),
        
        lastChild: attribute(function() {
            return this.childNodes.length === 0
                ? null
                : this.childNodes[this.childNodes.length-1];
        }),

        previousSibling: attribute(function() {
            if (!this.parentNode) return null;
            var sibs = this.parentNode.childNodes, i = this.index;
            return i === 0
                ? null
                : sibs[i-1]
        }),

        nextSibling: attribute(function() {
            if (!this.parentNode) return null;
            var sibs = this.parentNode.childNodes, i = this.index;
            return i+1 === sibs.length
                ? null
                : sibs[i+1]
        }),

        insertBefore: constant(function insertBefore(child, refChild) {
            var parent = this;
            if (refChild === null) return this.appendChild(child);
            if (refChild.parentNode !== parent) NotFoundError();
            if (child.isAncestor(parent)) HierarchyRequestError();
            if (child.nodeType === DOCUMENT_NODE) HierarchyRequestError();
            parent.ensureSameDoc(child);
            child.insert(parent, refChild.index);
            return child;
        }),


        appendChild: constant(function(child) {
            var parent = this;
            if (child.isAncestor(parent)) HierarchyRequestError();
            if (child.nodeType === DOCUMENT_NODE) HierarchyRequestError();
            parent.ensureSameDoc(child);
            child.insert(parent, parent.childNodes.length);
            return child;
        }),

        removeChild: constant(function removeChild(child) {
            var parent = this;
            if (child.parentNode !== parent) NotFoundError();
            child.remove();
            return child;
        }),

        replaceChild: constant(function replaceChild(newChild, oldChild) {
            var parent = this;
            if (oldChild.parentNode !== parent) NotFoundError();
            if (newChild.isAncestor(parent)) HierarchyRequestError();
            parent.ensureSameDoc(newChild);

            var refChild = oldChild.nextSibling;
            oldChild.remove();
            parent.insertBefore(newChild, refChild);
            return oldChild;
        }),

        compareDocumentPosition:constant(function compareDocumentPosition(that){
            // Basic algorithm for finding the relative position of two nodes.
            // Make a list the ancestors of each node, starting with the 
            // document element and proceeding down to the nodes themselves.
            // Then, loop through the lists, looking for the first element
            // that differs.  The order of those two elements give the
            // order of their descendant nodes.  Or, if one list is a prefix
            // of the other one, then that node contains the other.

            if (this === that) return 0;

            // If they're not owned by the same document or if one is rooted
            // and one is not, then they're disconnected.
            if (this.ownerDocument != that.ownerDocument ||
                this.rooted !== that.rooted)
                return (DOCUMENT_POSITION_DISCONNECTED +
                        DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC);

            // Get arrays of ancestors for this and that
            var these = [], those = []; 
            for(var n = this; n !== null; n = n.parentNode) push(these, n);
            for(var n = that; n !== null; n = n.parentNode) push(those, n);
            these.reverse();  // So we start with the outermost
            those.reverse();

            if (these[0] !== those[0]) // No common ancestor
                return (DOCUMENT_POSITION_DISCONNECTED +
                        DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC);

            var n = Math.min(these.length, those.length);
            for(var i = 1; i < n; i++) {
                if (these[i] !== those[i]) {
                    // We found two different ancestors, so compare
                    // their positions
                    if (these[i].index < those[i].index)
                        return DOCUMENT_POSITION_FOLLOWING;
                    else
                        return DOCUMENT_POSITION_PRECEDING;
                }
            }

            // If we get to here, then one of the nodes (the one with the
            // shorter list of ancestors) contains the other one.
            if (these.length < those.length) 
                return (DOCUMENT_POSITION_FOLLOWING + 
                        DOCUMENT_POSITION_CONTAINED_BY);
            else
                return (DOCUMENT_POSITION_PRECEDING + 
                        DOCUMENT_POSITION_CONTAINS);
        }),

        isSameNode: constant(function isSameNode(node) {
            return this === node;
        }),
        

        // This method implements the generic parts of node equality testing
        // and defers to the (non-recursive) type-specific isEqual() method
        // defined by subclasses
        isEqualNode: constant(function isEqualNode(node) {
            if (!node) return false;
            if (node.nodeType !== this.nodeType) return false;

            // Check for same number of children
            // Check for children this way because it is more efficient
            // for childless leaf nodes.
            var n; // number of child nodes
            if (!this.firstChild) {
                n = 0;
                if (node.firstChild) return false;
            }
            else {
                n = this.childNodes.length;
                if (node.childNodes.length != n) return false;
            }

            // Check type-specific properties for equality
            if (!this.isEqual(node)) return false;

            // Now check children for equality
            for(var i = 0; i < n; i++) {
                var c1 = this.childNodes[i], c2 = node.childNodes[i];
                if (!c1.isEqualNode(c2)) return false;
            }
            
            return true;
        }),

        // This method delegates shallow cloning to a clone() method
        // that each concrete subclass must implement
        cloneNode: constant(function(deep) {
            // Clone this node
            var clone = this.clone();

            // Handle the recursive case if necessary
            if (deep && this.firstChild) {
                for(var i = 0, n = this.childNodes.length; i < n; i++) {
                    clone.appendChild(this.childNodes[i].cloneNode(true));
                }
            }

            return clone;
        }),

        lookupPrefix: constant(function lookupPrefix(ns) {
            var e;
            if (ns === "") return null;
            switch(this.nodeType) {
            case ELEMENT_NODE:
                return this.locateNamespacePrefix(ns);
            case DOCUMENT_NODE:
                e = this.documentElement;
                return e ? e.locateNamespacePrefix(ns) : null;
            case DOCUMENT_TYPE_NODE:
            case DOCUMENT_FRAGMENT_NODE:
                return null;
            default: 
                e = this.parentElement;
                return e ? e.locateNamespacePrefix(ns) : null;
            }
        }),


        lookupNamespaceURI: constant(function lookupNamespaceURI(prefix) {
            var e;
            switch(this.nodeType) {
            case ELEMENT_NODE:
                return this.locateNamespace(prefix);
            case DOCUMENT_NODE:
                e = this.documentElement;
                return e ? e.locateNamespace(prefix) : null;
            case DOCUMENT_TYPE_NODE:
            case DOCUMENT_FRAGMENT_NODE:
                return null;
            default: 
                e = this.parentElement;
                return e ? e.locateNamespacePrefix(ns) : null;
            }
        }),

        isDefaultNamespace: constant(function isDefaultNamespace(ns) {
            var defaultns = this.lookupNamespaceURI(null);
            if (defaultns == null) defaultns = "";
            return ns === defaultns;
        }),

        // Utility methods for nodes.  Not part of the DOM

        // Return the index of this node in its parent.
        // Throw if no parent, or if this node is not a child of its parent
        index: attribute(function() {
            assert(this.parentNode);
            var kids = this.parentNode.childNodes
            if (this._index == undefined || kids[this._index] != this) {
                this._index = A.indexOf(kids, this);
                assert(this._index != -1);
            }
            return this._index;
        }),

        // Return true if this node is equal to or is an ancestor of that node
        // Note that nodes are considered to be ancestors of themselves
        isAncestor: constant(function(that) {
            // If they belong to different documents, then they're unrelated.
            if (this.ownerDocument != that.ownerDocument) return false;
            // If one is rooted and one isn't then they're not related
            if (this.rooted !== that.rooted) return false;

            // Otherwise check by traversing the parentNode chain
            for(var e = that; e; e = e.parentNode) {
                if (e === this) return true;
            }
            return false;
        }),

        // When a user agent is to ensure that two Nodes, old and new, are
        // in the same Document, it must run the following steps:
        //
        //     If new is a DocumentType, run the following steps:
        //
        //         If new's ownerDocument is not null, and it is not equal
        //         to old's ownerDocument, throw a WRONG_DOCUMENT_ERR
        //         exception and terminate these steps.
        //
        //         Otherwise, set its ownerDocument to old's
        //         ownerDocument.
        //
        //     Otherwise, invoke old's ownerDocument's adoptNode method
        //     with new as its argument.
        //
        //     If old's ownerDocument and new's ownerDocument are not the
        //     same, throw a HIERARCHY_REQUEST_ERR
        ensureSameDoc: constant(function(that) {
            // Get the owner of the node, the node itself, if it is a document
            var ownerdoc = this.ownerDocument || this;

            if (that.nodeType === DOCUMENT_TYPE_NODE) {
                if (that.ownerDocument !== null && that.ownerDocument !== ownerdoc)
                    WrongDocumentError();
                that.ownerDocument = ownerdoc;
            }
            else {
                // The spec's algorithm says to call adoptNode
                // unconditionally, which will remove it from its current
                // location in the document even it if is not changing
                // documents.  I don't do that here because that would cause a
                // lot of unnecessary uproot and reroot mutation events.
                if (that.ownerDocument !== ownerdoc)
                    ownerdoc.adoptNode(that);
            }
            
            // XXX: this step does not seem necessary.
            // If mutation events are added, however, it becomes necessary
            if (that.ownerDocument !== ownerdoc) HierarchyRequestError();
        }),

        // Remove this node from its parent
        remove: constant(function remove() {
            // Remove this node from its parents array of children
            splice(this.parentNode.childNodes, this.index, 1);

            // Update the structure id for all ancestors
            this.parentNode.modify();

            // Forget this node's parent
            delete this.parentNode;

            // Send mutation events if necessary
            if (this.rooted) this.ownerDocument.mutateRemove(this);
        }),

        // Remove all of this node's children.  This is a minor 
        // optimization that only calls modify() once.
        removeChildren: constant(function removeChildren() {
            var root = this.rooted ? this.ownerDocument : null;
            for(var i = 0, n = this.childNodes.length; i < n; i++) {
                delete this.childNodes[i].parentNode;
                if (root) root.mutateRemove(this.childNodes[i]);
            }
            this.childNodes.length = 0; // Forget all children
            this.modify();              // Update last modified type once only
        }),

        // Insert this node as a child of parent at the specified index,
        // firing mutation events as necessary
        insert: constant(function insert(parent, index) {
            var child = this, kids = parent.childNodes;

            // If we are already a child of the specified parent, then t
            // the index may have to be adjusted.
            if (child.parentNode === parent) {
                var currentIndex = child.index;
                // If we're not moving the node, we're done now
                // XXX: or do DOM mutation events still have to be fired?
                if (currentIndex === index) return;

                // If the child is before the spot it is to be inserted at,
                // then when it is removed, the index of that spot will be
                // reduced.
                if (currentIndex < index) index--;
            }

            // Special case for document fragments
            if (child.nodeType === DOCUMENT_FRAGMENT_NODE) {
                var  c;
                while(c = child.firstChild)
                    c.insert(parent, index++);
                return;
            }

            // If both the child and the parent are rooted, then we want to
            // transplant the child without uprooting and rerooting it.
            if (child.rooted && parent.rooted) {
                // Remove the child from its current position in the tree
                // without calling remove(), since we don't want to uproot it.
                var curpar = child.parentNode, curidx = child.index;
                splice(child.parentNode.childNodes, child.index, 1);
                curpar.modify();

                // And insert it as a child of its new parent
                child.parentNode = parent;
                splice(kids, index, 0, child);
                child._index = index;              // Optimization
                parent.modify();

                // Generate a move mutation event
                parent.ownerDocument.mutateMove(child);
            }
            else {
                // If the child already has a parent, it needs to be
                // removed from that parent, which may also uproot it
                if (child.parentNode) child.remove();
                
                // Now insert the child into the parent's array of children
                child.parentNode = parent;
                splice(kids, index, 0, child);
                parent.modify();
                child._index = index;              // Optimization
                
                // And root the child if necessary
                if (parent.rooted) parent.ownerDocument.mutateInsert(child);
            }
        }),


        // Return the lastModified value for this node. (For use as a
        // cache invalidation mechanism. If the node does not already
        // have one, initialize it from the owner document's modclock
        // property.  (Note that modclock does not return the actual
        // time; it is simply a counter incremented on each document
        // modification)
        lastModified: attribute(function() {
            if (!this._lastModified) {
                this._lastModified = this.doc.modclock;
            }
                
            return this._lastModified;
        }),

        // Increment the owner document's modclock and use the new
        // value to update the lastModified value for this node and
        // all of its ancestors.  Nodes that have never had their
        // lastModified value queried do not need to have a
        // lastModified property set on them since there is no
        // previously queried value to ever compare the new value
        // against, so only update nodes that already have a
        // _lastModified property.
        modify: constant(function() {
            var time = ++this.doc.modclock;
            for(var n = this; n; n = n.parentElement) {
                if (n._lastModified) {
                    n._lastModified = time;
                }
            }
        }),

        // This attribute is not part of the DOM but is quite helpful.
        // It returns the document with which a node is associated.  Usually
        // this is the ownerDocument. But ownerDocument is null for the
        // document object itself, so this is a handy way to get the document
        // regardless of the node type
        doc: attribute(function() {
            return this.ownerDocument || this;
        }),


        // If the node has a nid (node id), then it is rooted in a document
        rooted: attribute(function() {
            return !!this._nid;
        }),

    });

    return Node;
});


/************************************************************************
 *  src/impl/Leaf.js
 ************************************************************************/

//@line 1 "src/impl/Leaf.js"
defineLazyProperty(impl, "Leaf", function() {
    // This class defines common functionality for node subtypes that
    // can never have children
    function Leaf() {}

    Leaf.prototype = O.create(impl.Node.prototype, {
        hasChildNodes: constant(function() { return false; }),
        firstChild: constant(null),
        lastChild: constant(null),
        insertBefore: constant(HierarchyRequestError),
        replaceChild: constant(HierarchyRequestError),
        removeChild: constant(HierarchyRequestError),
        appendChild: constant(HierarchyRequestError),

        // Each node must have its own unique childNodes array.  But
        // leaves always have an empty array, so initialize it lazily.
        // If the childNodes property is read, we'll return an array
        // and define a read-only property directly on the object that
        // will shadow this one. I'd like to freeze the array, too, since
        // leaf nodes can never have children, but I'll end up having to add
        // a property to refer back to the IDL NodeList wrapper.
        childNodes: attribute(function() {
            var a = [];
            O.defineProperty(this, "childNodes", constant(a));
            return a;
        }),
    });

    return Leaf;
});


/************************************************************************
 *  src/impl/CharacterData.js
 ************************************************************************/

//@line 1 "src/impl/CharacterData.js"
defineLazyProperty(impl, "CharacterData", function() {
    function CharacterData() {
    }
    
    CharacterData.prototype = O.create(impl.Leaf.prototype, {
        // DOMString substringData(unsigned long offset,
        //                         unsigned long count);
        // The substringData(offset, count) method must run these steps:
        //
        //     If offset is greater than the context object's
        //     length, throw an INDEX_SIZE_ERR exception and
        //     terminate these steps.
        //
        //     If offset+count is greater than the context
        //     object's length, return a DOMString whose value is
        //     the UTF-16 code units from the offsetth UTF-16 code
        //     unit to the end of data.
        //
        //     Return a DOMString whose value is the UTF-16 code
        //     units from the offsetth UTF-16 code unit to the
        //     offset+countth UTF-16 code unit in data.
        substringData: constant(function substringData(offset, count) {
            if (offset > this.data.length) IndexSizeError();
            return substring(this.data, offset, offset+count);
        }),

        // void appendData(DOMString data);
        // The appendData(data) method must append data to the context
        // object's data.
        appendData: constant(function appendData(data) {
            this.data = this.data + data;
        }),

        // void insertData(unsigned long offset, DOMString data);
        // The insertData(offset, data) method must run these steps:
        //
        //     If offset is greater than the context object's
        //     length, throw an INDEX_SIZE_ERR exception and
        //     terminate these steps.
        //
        //     Insert data into the context object's data after
        //     offset UTF-16 code units.
        //
        insertData: constant(function insertData(offset, data) {
            var curtext = this.data;
            if (offset > curtext.length) IndexSizeError();
            var prefix = substring(curtext, 0, offset), 
            suffix = substring(curtext, offset);
            this.data = prefix + data + suffix;
        }),
        

        // void deleteData(unsigned long offset, unsigned long count);
        // The deleteData(offset, count) method must run these steps:
        //
        //     If offset is greater than the context object's
        //     length, throw an INDEX_SIZE_ERR exception and
        //     terminate these steps.
        //
        //     If offset+count is greater than the context
        //     object's length var count be length-offset.
        //
        //     Starting from offset UTF-16 code units remove count
        //     UTF-16 code units from the context object's data.
        deleteData: constant(function deleteData(offset, count) {
            var curtext = this.data, len = curtext.length;

            if (offset > len) IndexSizeError();
            
            if (offset+count > len)
                count = len - offset;

            var prefix = substring(curtext, 0, offset),
            suffix = substring(curtext, offset+count);

            this.data = prefix + suffix;
        }),


        // void replaceData(unsigned long offset, unsigned long count,
        //                  DOMString data);
        // 
        // The replaceData(offset, count, data) method must act as
        // if the deleteData() method is invoked with offset and
        // count as arguments followed by the insertData() method
        // with offset and data as arguments and re-throw any
        // exceptions these methods might have thrown.
        replaceData: constant(function replaceData(offset, count, data) {
            var curtext = this.data, len = curtext.length;

            if (offset > len) IndexSizeError();
            
            if (offset+count > len)
                count = len - offset;

            var prefix = substring(curtext, 0, offset),
            suffix = substring(curtext, offset+count);

            this.data = prefix + data + suffix;
        }),

        // Utility method that Node.isEqualNode() calls to test Text and
        // Comment nodes for equality.  It is okay to put it here, since
        // Node will have already verified that nodeType is equal
        isEqual: constant(function isEqual(n) {
            return this._data === n._data;
        }),

    });

    return CharacterData;
});


/************************************************************************
 *  src/impl/Text.js
 ************************************************************************/

//@line 1 "src/impl/Text.js"
defineLazyProperty(impl, "Text", function() {
    function Text(doc, data) {
        this.ownerDocument = doc;
        this._data = data;
    }
    
    var nodeValue = attribute(function() { return this._data; },
                              function(v) { 
                                  this._data = v;
                                  if (this.rooted)
                                      this.ownerDocument.mutateValue(this);
                              });
    
    Text.prototype = O.create(impl.CharacterData.prototype, {
        nodeType: constant(TEXT_NODE),
        nodeName: constant("#text"),
        // These three attributes are all the same.
        // The data attribute has a [TreatNullAs=EmptyString] but we'll
        // implement that at the interface level
        nodeValue: nodeValue,
        textContent: nodeValue,
        data: nodeValue,
        length: attribute(function() { return this._data.length; }),

        splitText: constant(function splitText(offset) {
            if (offset > this._data.length) IndexSizeError();

            var newdata = substring(this._data, offset),
                newnode = this.ownerDocument.createTextNode(newdata);
            this._data = substring(this.data, 0, offset);

            var parent = this.parentNode;
            if (parent !== null)
                parent.insertBefore(newnode, this.nextSibling);

            return newnode;
        }),

        // XXX
        // wholeText and replaceWholeText() are not implemented yet because
        // the DOMCore specification is considering removing or altering them.
        wholeText: attribute(nyi),
        replaceWholeText: constant(nyi),
   
        // Utility methods
        clone: constant(function clone() {
            return new impl.Text(this.ownerDocument, this._data);
        }),

        toObject: constant(function toObject() {
            return { type: TEXT_NODE, data: this._data };
        }),
     
    });

    return Text;
});


/************************************************************************
 *  src/impl/Comment.js
 ************************************************************************/

//@line 1 "src/impl/Comment.js"
defineLazyProperty(impl, "Comment", function() {
    function Comment(doc, data) {
        this.ownerDocument = doc;
        this._data = data;
    }

    var nodeValue = attribute(function() { return this._data; },
                              function(v) { 
                                  this._data = v;
                                  if (this.rooted)
                                      this.ownerDocument.mutateValue(this);
                              });
    
    Comment.prototype = O.create(impl.CharacterData.prototype, {
        nodeType: constant(COMMENT_NODE),
        nodeName: constant("#comment"),
        nodeValue: nodeValue,
        textContent: nodeValue,
        data: nodeValue,
        length: attribute(function() { return this._data.length; }),
   
        // Utility methods
        clone: constant(function clone() {
            return new impl.Comment(this.ownerDocument, this._data);
        }),
        toObject: constant(function toObject() {
            return { type: COMMENT_NODE, data: this._data };
        }),
    });
    
    return Comment;
});


/************************************************************************
 *  src/impl/ProcessingInstruction.js
 ************************************************************************/

//@line 1 "src/impl/ProcessingInstruction.js"
defineLazyProperty(impl, "ProcessingInstruction", function() {

    function ProcessingInstruction(doc, target, data) {
        this.ownerDocument = doc;
        this.target = target;
        this._data = data;
    }

    var nodeValue = attribute(function() { return this._data; },
                              function(v) { 
                                  this._data = v;
                                  if (this.rooted)
                                      this.ownerDocument.mutateValue(this);
                              });

    ProcessingInstruction.prototype = O.create(impl.Leaf.prototype, {
        nodeType: constant(PROCESSING_INSTRUCTION_NODE),
        nodeName: attribute(function() { return this.target; }),
        nodeValue: nodeValue,
        textContent: nodeValue,
        data: nodeValue,

        // Utility methods
        clone: constant(function clone() {
            return new impl.ProcessingInstruction(this.ownerDocument,
                                                  this.target, this._data);
        }),
        isEqual: constant(function isEqual(n) {
            return this.target === n.target && this._data === n._data;
        }),
        toObject: constant(function toObject() {
            return {
                type: PROCESSING_INSTRUCTION_NODE,
                target: this.target,
                data: this._data
            };
        }),

    });

    return ProcessingInstruction;
});


/************************************************************************
 *  src/impl/Element.js
 ************************************************************************/

//@line 1 "src/impl/Element.js"
defineLazyProperty(impl, "Element", function() {
    function Element(doc, localName, namespaceURI, prefix) {
        this.ownerDocument = doc;
        this.localName = localName;
        this.namespaceURI = namespaceURI;
        this.prefix = prefix;

        this.tagName = (prefix !== null)
            ? prefix + ":" + localName
            : localName;

        if (this.isHTML)
            this.tagName = toUpperCase(this.tagName);

        this.attributes = [];
        this.childNodes = [];
    }

    var recursiveGetText = recursive(function(n,a) {
        if (n.nodeType === TEXT_NODE) a.push(n._data);
    });

    function textContentGetter() {
        var strings = [];
        recursiveGetText(this, strings);
        return strings.join("");
    }

    function textContentSetter(newtext) {
        this.removeChildren();
        if (newtext !== null && newtext !== "") {
            this.appendChild(this.ownerDocument.createTextNode(newtext));
        }
    }

    Element.prototype = O.create(impl.Node.prototype, {
        nodeType: constant(ELEMENT_NODE),
        nodeName: attribute(function() { return this.tagName; }),
        nodeValue: attribute(fnull, fnoop),
        textContent: attribute(textContentGetter, textContentSetter),

        getAttribute: constant(function getAttribute(qname) {
            if (this.isHTML) qname = toLowerCase(qname);
            for(var i = 0, n = this.attributes.length; i < n; i++) {
                var attr = this.attributes[i];
                if (attr.name === qname)
                    return attr.value;
            }
            return null;
        }),

        hasAttribute: constant(function hasAttribute(qname) {
            return this.getAttribute(qname) !== null;
        }),


        setAttribute: constant(function setAttribute(qname, value) {
            if (!isValidName(qname)) InvalidCharacterError();
            if (this.isHTML) qname = toLowerCase(qname);
            if (substring(qname, 0, 5) === "xmlns") NamespaceError();

            // If id, class, or name changes, that may invalidate 
            // NodeList or HTMLCollection caches.
            if (qname === "id" || qname === "class" || qname === "name")
                this.modify();

            for(var i = 0, n = this.attributes.length; i < n; i++) {
                var attr = this.attributes[i];
                if (attr.name === qname) {
                    attr.value = value;  // Setter sends mutation event for us
                    return;
                }
            }

            // The attribute doesn't already exist, so add a new one
            var newattr = new impl.Attr(this, qname, value)
            push(this.attributes, newattr);

            // Send mutation event
            if (this.rooted) this.ownerDocument.mutateAttr(newattr, null);
        }),

        removeAttribute: constant(function removeAttribute(qname) {
            if (this.isHTML) qname = toLowerCase(qname);

            for(var i = 0, n = this.attributes.length; i < n; i++) {
                var attr = this.attributes[i];
                if (attr.name === qname) {
                    splice(this.attributes, i, 1);

                    // If id, class, or name changes, that may invalidate 
                    // NodeList or HTMLCollection caches.
                    if (qname === "id" || qname === "class" || qname === "name")
                        this.modify();
                    
                    // Mutation event
                    if (this.rooted) this.ownerDocument.mutateRemoveAttr(attr);
                    return;
                }
            }
        }),

        getAttributeNS: constant(function getAttributeNS(ns, lname) {
            for(var i = 0, n = this.attributes.length; i < n; i++) {
                var attr = this.attributes[i];
                if (attr.namespaceURI === ns && attr.localName === lname)
                    return attr.value;
            }
            return null;
        }),

        hasAttributeNS: constant(function hasAttributeNS(ns, lname) {
            return this.getAttributeNS(ns, lname) !== null;
        }),

        setAttributeNS: constant(function setAttributeNS(ns, qname, value) {
            if (!isValidName(qname)) InvalidCharacterError();
            if (!isValidQName(qname)) NamespaceError();

            var pos = S.indexOf(qname, ":"), prefix, lname;
            if (pos === -1) {
                prefix = null;
                lname = qname;
            }
            else {
                prefix = substring(qname, 0, pos);
                lname = substring(qname, pos+1);
            }

            if (ns === "") ns = null;

            if ((prefix !== null && ns === null) ||
                (prefix === "xml" && ns !== XML_NAMESPACE) ||
                ((qname === "xmlns" || prefix === "xmlns") &&
                 (ns !== XMLNS_NAMESPACE)) ||
                (ns === XMLNS_NAMESPACE && 
                 !(qname === "xmlns" || prefix === "xmlns")))
                NamespaceError();

            // If id, class, or name changes, that may invalidate 
            // NodeList or HTMLCollection caches.
            if (ns === null &&
                (qname === "id" || qname === "class" || qname === "name"))
                this.modify();

            for(var i = 0, n = this.attributes.length; i < n; i++) {
                var attr = this.attributes[i];
                if (attr.namespaceURI === ns && attr.localName === lname) {

                    // setAttributeNS can change the prefix (and therefore 
                    // qname) of an attribute
                    if (attr.prefix !== prefix) {
                        attr.prefix = prefix;
                        attr.name = prefix + ":" + attr.localName 
                    }

                    attr.value = value;  // this automatically fires an event
                    return;
                }
            }
            var newattr = new impl.Attr(this, lname, value, prefix, ns)
            push(this.attributes, newattr);
            if (this.rooted) this.ownerDocument.mutateAddAttr(newattr);
        }),


        removeAttributeNS: constant(function removeAttributeNS(ns, lname) {
            for(var i = 0, n = this.attributes.length; i < n; i++) {
                var attr = this.attributes[i];
                if (attr.namespaceURI === ns && attr.localName === lname) {
                    splice(this.attributes, i, 1);

                    // If id, class, or name changes, that may invalidate 
                    // NodeList or HTMLCollection caches.
                    if (ns === null &&
                        (lname === "id"||lname === "class"||lname === "name"))
                        this.modify();

                    if (this.rooted) this.ownerDocument.mutateRemoveAttr(attr);
                    return;
                }
            }
        }),

        children: attribute(function() {
            if (!this._children) {
                this._children = new ChildrenCollection(this);
            }
            return this._children;
        }),

        firstElementChild: attribute(function() {
            var kids = this.childNodes;
            for(var i = 0, n = kids.length; i < n; i++) {
                if (kids[i].nodeType === ELEMENT_NODE) return kids[i];
            }
            return null;
        }),

        lastElementChild: attribute(function() {
            var kids = this.childNodes;
            for(var i = kids.length-1; i >= 0; i--) {
                if (kids[i].nodeType === ELEMENT_NODE) return kids[i];
            }
            return null;
        }),

        nextElementSibling: attribute(function() {
            if (this.parentNode) {
                var sibs = this.parentNode.childNodes;
                for(var i = this.index+1, n = sibs.length; i < n; i++) {
                    if (sibs[i].nodeType === ELEMENT_NODE) return sibs[i];
                }
            }
            return null;
        }),

        previousElementSibling: attribute(function() {
            if (this.parentNode) {
                var sibs = this.parentNode.childNodes;
                for(var i = this.index-1; i >= 0; i--) {
                    if (sibs[i].nodeType === ELEMENT_NODE) return sibs[i];
                }
            }
            return null;
        }),

        childElementCount: attribute(function() {
            return this.children.length;
        }),


        // Return the next element, in source order, after this one or
        // null if there are no more.  If root element is specified,
        // then don't traverse beyond its subtree.
        // 
        // This is not a DOM method, but is convenient for 
        // lazy traversals of the tree.
        nextElement: constant(function(root) {
            var next = this.firstElementChild || this.nextElementSibling;
            if (next) return next;

            if (!root) root = this.ownerDocument.documentElement;

            // If we can't go down or across, then we have to go up
            // and across to the parent sibling or another ancestor's
            // sibling.  Be careful, though: if we reach the root
            // element, or if we reach the documentElement, then 
            // the traversal ends.
            for(var parent = this.parentElement;
                parent && parent !== root;
                parent = parent.parentElement) {

                next = parent.nextElementSibling;
                if (next) return next;
            }

            return null;
        }),

        // Just copy this method from the Document prototype
        getElementsByTagName:
            constant(impl.Document.prototype.getElementsByTagName),

        getElementsByTagNameNS:
            constant(impl.Document.prototype.getElementsByTagNameNS),

        getElementsByClassName:
            constant(impl.Document.prototype.getElementsByClassName),

        
        // Utility methods used by the public API methods above

        isHTML: attribute(function() { 
            return this.namespaceURI === HTML_NAMESPACE &&
                this.ownerDocument.isHTML;
        }),

        clone: constant(function clone() {
            var e = new impl.Element(this.ownerDocument, this.localName,
                                     this.namespaceURI, this.prefix);
            for(var i = 0, n = this.attributes.length; i < n; i++) {
                push(e.attributes, this.attributes[i].clone(e));
            }

            return e;
        }),

        isEqual: constant(function isEqual(n) {
            if (this.localName !== n.localName ||
                this.namespaceURI !== n.namespaceURI ||
                this.prefix !== n.prefix ||
                this.attributes.length !== n.attributes.length)
                return false;

            for(var i = 0, n = this.attributes.length; i < n; i++) {
                if (!this.attributes[i].isEqual(n.attributes[i]))
                    return false;
            }

            return true;
        }),

        toObject: constant(function toObject() {
            var obj= {
                type: ELEMENT_NODE,
                name: this.localName,
                ns: this.namespaceURI,
                prefix: this.prefix
            };

            // Hmmm...  Should I do this recursively and include children?
            // XXX: define a separate library for serializing and parsing
            // trees of nodes.  Don't use JSON or HTML: they are too hard
            // to parse
        }),


        // This is the "locate a namespace prefix" algorithm from the
        // DOMCore specification.  It is used by Node.lookupPrefix()
        locateNamespacePrefix: constant(function locateNamespacePrefix(ns) {
            if (this.namespaceURI === ns && this.prefix !== null) 
                return this.prefix;

            for(var i = 0, n = this.attributes.length; i < n; i++) {
                var a = this.attributes[i];
                if (a.prefix === "xmlns" && a.data === ns)
                    return a.localName;
            }

            var parent = this.parentElement;
            return parent ? parent.locateNamespacePrefix(ns) : null;
        }),

        // This is the "locate a namespace" algorithm for Element nodes
        // from the DOM Core spec.  It is used by Node.lookupNamespaceURI
        locateNamespace: constant(function locateNamespace(prefix) {
            if (this.prefix === prefix && this.namespaceURI !== null)
                return this.namespaceURI;

            for(var i = 0, n = this.attributes.length; i < n; i++) {
                var a = this.attributes[i];
                if ((a.prefix === "xmlns" && a.localName === prefix) ||
                    (a.prefix === null && a.localName === "xmlns")) {
                    return a.value || null;
                }
            }

            var parent = this.parentElement;
            return parent ? parent.locateNamespace(prefix) : null;
        }),

    });

    // The children property of an Element will be an instance of this class.
    // It defines length, item() and namedItem() and will be wrapped by an
    // HTMLCollection when exposed through the DOM.
    function ChildrenCollection(e) {
        this.element = e;
    }

    ChildrenCollection.prototype = {
        get length() { 
            this.updateCache();
            return this.childrenByNumber.length;
        },

        item: function item(n) {
            this.updateCache();
            return this.childrenByNumber[n] || null;
        },
        
        namedItem: function namedItem(name) {
            this.updateCache();
            return this.childrenByName[name] || null;
        },

        // This attribute returns the entire name->element map.
        // It is not part of the HTMLCollection API, but we need it in
        // src/HTMLCollectionProxy
        get namedItems() {
            this.updateCache();
            return this.childrenByName;
        },

        updateCache: function updateCache() {
            if (this.lastModified !== this.element.lastModified) {
                this.lastModified = this.element.lastModified;
                this.childrenByNumber = [];
                this.childrenByName = {};

                for(var i = 0, n = this.element.childNodes.length; i < n; i++) {
                    var c = this.element.childNodes[i];
                    if (c.nodeType == ELEMENT_NODE) {
                        push(this.childrenByNumber, c);
                        
                        // XXX Are there any requirements about the namespace
                        // of the id property?
                        var id = c.getAttribute("id");

                        // If there is an id that is not already in use...
                        if (id && !this.childrenByName[id]) 
                            this.childrenByName[id] = c;

                        var namedElts = /^(a|applet|area|embed|form|frame|frameset|iframe|img|object)$/;

                        // For certain HTML elements we check the name attribute
                        var name = c.getAttribute("name");
                        if (name && 
                            this.element.namespaceURI === HTML_NAMESPACE &&
                            namedElts.test(this.element.localName) &&
                            !this.childrenByName[name])
                            this.childrenByName[id] = c;
                    }
                }
            }
        }
    };


    return Element;
});


/************************************************************************
 *  src/impl/Attr.js
 ************************************************************************/

//@line 1 "src/impl/Attr.js"
defineLazyProperty(impl, "Attr", function() {

    function Attr(elt, lname, value, prefix, namespace) {
        // Always remember what element we're associated with.
        // We need this to property handle mutations
        this.ownerElement = elt;

        // localName and namespace are constant for any attr object.
        // But value may change.  And so can prefix, and so, therefore can name.
        this.localName = lname;
        this.data = value;   // See prototype for value getter/setter
        this.prefix = prefix || null;
        this.namespaceURI = namespace || null;
        this.name = prefix ? prefix + ":" + lname : lname;
    }

    Attr.prototype = O.create(Object.prototype, {
        value: attribute(function() { return this.data; },
                         function(v) { 
                             var oldval = this.data;
                             this.data = v;
                             if (this.ownerElement.rooted)
                                 this.ownerElement.ownerDocument.mutateAttr(
                                     this,
                                     oldval);
                         }),

        clone: constant(function clone(e) {
            return new impl.Attr(e, this.localName, this.data, 
                                 this.prefix, this.namespaceURI);
        }),

        isEqual: constant(function isEqual(n) {
            return this.localName === n.localName &&
                this.data === n.data &&
                this.prefix === n.prefix &&
                this.namespaceURI === n.namespaceURI;
        }),
    });

    return Attr;
});


/************************************************************************
 *  src/impl/MutationConstants.js
 ************************************************************************/

//@line 1 "src/impl/MutationConstants.js"
// The value of a Text, Comment or PI node changed
const MUTATE_VALUE = 1;

// A new attribute was added or an attribute value and/or prefix changed
const MUTATE_ATTR = 2;

// An attribute was removed
const MUTATE_REMOVE_ATTR = 3;

// A node was removed
const MUTATE_REMOVE = 4;

// A node was moved
const MUTATE_MOVE = 5;

// A node (or a subtree of nodes) was inserted
const MUTATE_INSERT = 6;


/************************************************************************
 *  src/impl/domstr.js
 ************************************************************************/

//@line 1 "src/impl/domstr.js"
// A string representation of DOM trees
var DOMSTR = (function() {
    const NUL = "\0";

    const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
    const XML_NAMESPACE = "http://www.w3.org/XML/1998/namespace";
    const XMLNS_NAMESPACE = "http://www.w3.org/2000/xmlns/";
    const MATHML_NAMESPACE = "http://www.w3.org/1998/Math/MathML";
    const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

    const substring = String.substring;
    const indexOf = String.indexOf;
    const charCodeAt = String.charCodeAt;
    const fromCharCode = String.fromCharCode;

    function stringify(n) {
        return stringifyNode(n);

        function stringifyNode(n) {
            switch (n.nodeType) {
            case Node.TEXT_NODE:
                return "T" + n.data + NUL;
            case Node.COMMENT_NODE:
                return "C" + n.data + NUL;
            case Node.PROCESSING_INSTRUCTION_NODE:
                return "P" + n.target + NUL + n.data + NUL;
            case Node.DOCUMENT_TYPE_NODE:
                // HTML ignores the publicID and systemID when
                // serializing nodes, so ignore them here, too
                return "D" + n.name + NUL;
            case Node.ELEMENT_NODE:
                return stringifyElement(n);
            case NODE.DOCUMENT_FRAGMENT_NODE:
                return stringifyFragment(n);
            }
        }

        function stringifyElement(n) {
            var s = "";
            if (n.namespaceURI === HTML_NAMESPACE && !n.prefix) {
                s = "H" + n.localName + NUL;
            }
            else {
                s = "E" + stringifyNamespace(n.namespaceURI) + n.tagName + NUL;
            }

            // Number of attributes
            s += stringifyLength(n.attributes.length);
            for(var i = 0, l = n.attributes.length; i < l; i++) {
                s += stringifyAttr(n.attributes[i]);
            }

            // Now the children
            s += stringifyLength(n.childNodes.length);
            for(var i = 0, l = n.childNodes.length; i < l; i++) {
                s += stringifyNode(n.childNodes[i]);
            }

            return s;
        }

        var lastCustomNS = null;

        function stringifyNamespace(ns) {
            switch(ns) {
            case HTML_NAMESPACE: return "h";
            case null: return "u";
            case XML_NAMESPACE: return "x";
            case XMLNS_NAMESPACE: return "n";
            case MATHML_NAMESPACE: return "m";
            case SVG_NAMESPACE: return "s";
            default: 
                if (ns === lastCustomNS) return "l"
                else {
                    lastCustomNS = ns;
                    return "c" + ns + NUL;
                }
            }
        }

        function stringifyAttr(a) {
            if (a.namespaceURI === null && a.prefix === null) {
                // set with setAttribute()
                return "a" + a.name + NUL + a.value + NUL;
            }
            else {
                // set with setAttributeNS()
                return "A" + stringifyNamespace(a.namespaceURI) +
                    a.name + NUL + a.value + NUL;
            }
        }

        function stringifyLength(n) {
            if (n < 0) throw new Error("negative length");
            if (n <= 0xD7FF) return fromCharCode(n);
            else return fromCharCode("0xFFFF") + String(n) + NUL;
        }

        function stringifyFragment(n) {
            var s = "F" + stringifyLength(n.childNodes.length);
            for(var i = 0, l = n.childNodes.length; i < l; i++) {
                s += stringifyNode(n.childNodes[i]);
            }
            return s;
        }
    }


    function parse(s, d) {
        var n = 0,            // current character in s.
            eos = s.length;   // end-of-string

        if (!d) d = document;

        return parseNode();

        function parseNode() {
            switch(s[n++]) {
            case "T":
                return d.createTextNode(next());
            case "C":
                return d.createComment(next());
            case "P":
                return d.createProcessingInstruction(next(), next());
            case "D":
                return d.implementation.createDocumentType(next(),"","");
            case "H":  // create with createElement
                return parseElement("H");
            case "E":  // create with createElementNS
                return parseElement("E");
            case "F":
                return parseFragment();
            }
        }


        // Return the characters of s from n up to (but not
        // including) the next NUL character (or the end of the
        // string).  Update n to point to the first character
        // after NUL.  Throw an error if we reach the end of string
        function next() {
            if (n >= eos) throw new Error("Unexpected end of string");
            var end = indexOf(s, NUL, n);
            if (end === -1) end = eos;
            var token = substring(s, n, end);
            n = end+1;
            return token;
        }


        function parseElement(type) {
            var e;
            if (type === "H") 
                e = d.createElement(next());
            else
                e = d.createElementNS(parseNamespace(), next());

            var numattrs = parseLength();
            for(var i = 0; i < numattrs; i++) {
                var code = s[n++];
                if (code === "a") 
                    e.setAttribute(next(), next());
                else
                    e.setAttributeNS(parseNamespace(), next(), next());
            }

            var numkids = parseLength();
            for(var i = 0; i < numkids; i++) {
                e.appendChild(parseNode());
            }

            return e;
        }


        var lastCustomNS = null;

        function parseNamespace() {
            switch(s[n++]) {
            case 'h': return HTML_NAMESPACE;
            case 'u': return null;
            case 'x': return XML_NAMESPACE;
            case 'n': return XMLNS_NAMESPACE;
            case 'm': return MATHML_NAMESPACE;
            case 's': return SVG_NAMESPACE;
            case 'l': return lastCustomNS;
            case 'c':
                lastCustomNS = next();
                return lastCustomNS;
            }
        }

        function parseLength() {
            var l = charCodeAt(s, n++);
            if (l === 0xFFFF) l = parseInt(next());
            return l;
        }

        function parseFragment() {
            var f = d.createDocumentFragment();
            var len = parseLength();
            for(var i = 0; i < len; i++) 
                f.appendChild(parseNode());
            return f;
        }
    }

    return { stringify: stringify, parse: parse };
}());



/************************************************************************
 *  src/impl/Document.js
 ************************************************************************/

//@line 1 "src/impl/Document.js"
defineLazyProperty(impl, "Document", function() {

    function Document(isHTML) {
        this.isHTML = isHTML;
        this.implementation = new impl.DOMImplementation();

        // DOMCore says that documents are always associated with themselves.
        this.ownerDocument = this;

        // These will be initialized by our custom versions of
        // appendChild and insertBefore that override the inherited
        // Node methods.
        // XXX: override those methods!
        this.doctype = null;
        this.documentElement = null;
        this.childNodes = [];

        // Documents are always rooted, by definition
        this._nid = 1;
        this._nextnid = 2; // For numbering children of the document

        // This maintains the mapping from element ids to element nodes.
        // We may need to update this mapping every time a node is rooted
        // or uprooted, and any time an attribute is added, removed or changed
        // on a rooted element.
        this.byId = O.create(null); // inherit nothing

        // This property holds a monotonically increasing value akin to 
        // a timestamp used to record the last modification time of nodes
        // and their subtrees. See the lastModified attribute and modify()
        // method of the Node class.  And see FilteredElementList for an example
        // of the use of lastModified
        this.modclock = 0;
    }

    // Map from lowercase event category names (used as arguments to
    // createEvent()) to the property name in the impl object of the
    // event constructor.
    var supportedEvents = {
        event: "Event",
        customevent: "CustomEvent"
    };

    // Certain arguments to document.createEvent() must be treated specially
    var replacementEvent = {
        htmlevents: "event",
        mouseevents: "mouseevent",
        mutationevents: "mutationevent",
        uievents: "uievent"
    };

    var tagNameToInterfaceName = {
        "a": "HTMLAnchorElement",
        "abbr": "HTMLElement",
        "address": "HTMLElement",
        "area": "HTMLAreaElement",
        "article": "HTMLElement",
        "aside": "HTMLElement",
        "audio": "HTMLAudioElement",
        "b": "HTMLElement",
        "base": "HTMLBaseElement",
        "bdi": "HTMLElement",
        "bdo": "HTMLElement",
        "blockquote": "HTMLQuoteElement",
        "body": "HTMLBodyElement",
        "br": "HTMLBRElement",
        "button": "HTMLButtonElement",
        "canvas": "HTMLCanvasElement",
        "caption": "HTMLTableCaptionElement",
        "cite": "HTMLElement",
        "code": "HTMLElement",
        "col": "HTMLTableColElement",
        "colgroup": "HTMLTableColElement",
        "command": "HTMLCommandElement",
        "datalist": "HTMLDataListElement",
        "dd": "HTMLElement",
        "del": "HTMLModElement",
        "details": "HTMLDetailsElement",
        "dfn": "HTMLElement",
        "div": "HTMLDivElement",
        "dl": "HTMLDListElement",
        "dt": "HTMLElement",
        "em": "HTMLElement",
        "embed": "HTMLEmbedElement",
        "fieldset": "HTMLFieldSetElement",
        "figcaption": "HTMLElement",
        "figure": "HTMLElement",
        "footer": "HTMLElement",
        "form": "HTMLFormElement",
        "h1": "HTMLHeadingElement",
        "h2": "HTMLHeadingElement",
        "h3": "HTMLHeadingElement",
        "h4": "HTMLHeadingElement",
        "h5": "HTMLHeadingElement",
        "h6": "HTMLHeadingElement",
        "head": "HTMLHeadElement",
        "header": "HTMLElement",
        "hgroup": "HTMLElement",
        "hr": "HTMLHRElement",
        "html": "HTMLHtmlElement",
        "i": "HTMLElement",
        "iframe": "HTMLIFrameElement",
        "img": "HTMLImageElement",
        "input": "HTMLInputElement",
        "ins": "HTMLModElement",
        "kbd": "HTMLElement",
        "keygen": "HTMLKeygenElement",
        "label": "HTMLLabelElement",
        "legend": "HTMLLegendElement",
        "li": "HTMLLIElement",
        "link": "HTMLLinkElement",
        "map": "HTMLMapElement",
        "mark": "HTMLElement",
        "menu": "HTMLMenuElement",
        "meta": "HTMLMetaElement",
        "meter": "HTMLMeterElement",
        "nav": "HTMLElement",
        "noscript": "HTMLElement",
        "object": "HTMLObjectElement",
        "ol": "HTMLOListElement",
        "optgroup": "HTMLOptGroupElement",
        "option": "HTMLOptionElement",
        "output": "HTMLOutputElement",
        "p": "HTMLParagraphElement",
        "param": "HTMLParamElement",
        "pre": "HTMLPreElement",
        "progress": "HTMLProgressElement",
        "q": "HTMLQuoteElement",
        "rp": "HTMLElement",
        "rt": "HTMLElement",
        "ruby": "HTMLElement",
        "s": "HTMLElement",
        "samp": "HTMLElement",
        "script": "HTMLScriptElement",
        "section": "HTMLElement",
        "select": "HTMLSelectElement",
        "small": "HTMLElement",
        "source": "HTMLSourceElement",
        "span": "HTMLSpanElement",
        "strong": "HTMLElement",
        "style": "HTMLStyleElement",
        "sub": "HTMLElement",
        "summary": "HTMLElement",
        "sup": "HTMLElement",
        "table": "HTMLTableElement",
        "tbody": "HTMLTableSectionElement",
        "td": "HTMLTableDataCellElement",
        "textarea": "HTMLTextAreaElement",
        "tfoot": "HTMLTableSectionElement",
        "th": "HTMLTableHeaderCellElement",
        "thead": "HTMLTableSectionElement",
        "time": "HTMLTimeElement",
        "title": "HTMLTitleElement",
        "tr": "HTMLTableRowElement",
        "track": "HTMLTrackElement",
        "u": "HTMLElement",
        "ul": "HTMLUListElement",
        "var": "HTMLElement",
        "video": "HTMLVideoElement",
        "wbr": "HTMLElement",
    };

    Document.prototype = O.create(impl.Node.prototype, {
        nodeType: constant(DOCUMENT_NODE),
        nodeName: constant("#document"),
        nodeValue: attribute(fnull, fnoop),

        // XXX: DOMCore may remove documentURI, so it is NYI for now
        documentURI: attribute(nyi, nyi),
        compatMode: constant("CSS1Compat"),
        parentNode: constant(null),

        createTextNode: constant(function(data) {
            return new impl.Text(this, data);
        }),
        createComment: constant(function(data) {
            return new impl.Comment(this, data);
        }),
        createDocumentFragment: constant(function() {
            return new impl.DocumentFragment(this);
        }),
        createProcessingInstruction: constant(function(target, data) {
            if (this.isHTML) NotSupportedError();
            if (!isValidName(target) || S.indexOf(data, "?>") !== -1)
                InvalidCharacterError();
            return new impl.ProcessingInstruction(this, target, data);
        }),

        createElement: constant(function(localName) {
            if (!isValidName(localName)) InvalidCharacterError();

            if (this.isHTML)
                localName = toLowerCase(localName);
/*
                var interfaceName = tagNameToInterfaceName[localName] ||
                    "HTMLUnknownElement";
                return new impl[interfaceName](this, localName);
  */
            return new impl.Element(this, localName, HTML_NAMESPACE, null);
        }),

        createElementNS: constant(function(namespace, qualifiedName) {
            if (!isValidName(qualifiedName)) InvalidCharacterError();
            if (!isValidQName(qualifiedName)) NamespaceError();
            
            var pos, prefix, localName;
            if ((pos = S.indexOf(qualifiedName, ":")) !== -1) {
                prefix = substring(qualifiedName, 0, pos);
                localName = substring(qualifiedName, pos+1);

                if (namespace === "" ||
                    (prefix === "xml" && namespace !== XML_NAMESPACE))
                    NamespaceError();
            }
            else {
                prefix = null;
                localName = qualifiedName;
            }

            if (((qualifiedName === "xmlns" || prefix === "xmlns") &&
                 namespace !== XMLNS_NAMESPACE) ||
                (namespace === XMLNS_NAMESPACE && 
                 qualifiedName !== "xmlns" &&
                 prefix !== "xmlns"))
                NamespaceError();

            return new impl.Element(this, localName, namespace, prefix);
        }),

        createEvent: constant(function createEvent(interfaceName) {
            interfaceName = toLowerCase(interfaceName);
            var name = replacementEvent[interfaceName] || interfaceName;
            var constructor = impl[supportedEvents[name]];

            if (constructor) 
                return new constructor();
            else
                NotSupportedError();
        }),


        // Add some (surprisingly complex) document hierarchy validity
        // checks when adding, removing and replacing nodes into a
        // document object, and also maintain the documentElement and
        // doctype properties of the document.  Each of the following
        // 4 methods chains to the Node implementation of the method
        // to do the actual inserting, removal or replacement.

        appendChild: constant(function(child) {
            if (child.nodeType === TEXT_NODE) HierarchyRequestError();
            if (child.nodeType === ELEMENT_NODE) {
                if (this.documentElement) // We already have a root element
                    HierarchyRequestError();

                this.documentElement = child;
            }
            if (child.nodeType === DOCUMENT_TYPE_NODE) {
                if (this.doctype ||        // Already have one
                    this.documentElement)   // Or out-of-order
                    HierarchyRequestError()

                this.doctype = child;
            }

            // Now chain to our superclass
            return call(impl.Node.prototype.appendChild, this, child);
        }),

        insertBefore: constant(function insertBefore(child, refChild) {
            if (refChild.parentNode !== this) NotFoundError();
            if (child.nodeType === TEXT_NODE) HierarchyRequestError();
            if (child.nodeType === ELEMENT_NODE) {
                // If we already have a root element or if we're trying to
                // insert it before the doctype
                if (this.documentElement ||
                    (this.doctype && this.doctype.index >= refChild.index))
                    HierarchyRequestError();

                this.documentElement = child;
            }
            if (child.nodeType === DOCUMENT_TYPE_NODE) {
                if (this.doctype ||        
                    (this.documentElement &&
                     refChild.index >= this.documentElement.index))
                    HierarchyRequestError()

                this.doctype = child;
            }
            return call(impl.Node.prototype.insertBefore,this, child, refChild);
        }),        

        replaceChild: constant(function replaceChild(child, oldChild) {
            if (oldChild.parentNode !== this) NotFoundError();

            if (child.nodeType === TEXT_NODE) HierarchyRequestError();
            if (child.nodeType === ELEMENT_NODE) {
                // If we already have a root element and we're not replacing it
                if (this.documentElement && this.documentElement !== oldChild)
                    HierarchyRequestError();
                // Or if we're trying to put the element before the doctype
                // (replacing the doctype is okay)
                if (this.doctype && oldChild.index < this.doctype.index)
                    HierarchyRequestError();

                this.documentElement = child;
                if (oldChild === this.doctype) this.doctype = null;
            }
            else if (child.nodeType === DOCUMENT_TYPE_NODE) {
                // If we already have a doctype and we're not replacing it
                if (this.doctype && oldChild !== this.doctype)
                    HierarchyRequestError();
                // If we have a docuemnt element and the old child
                // comes after it
                if (this.documentElement &&
                    oldChild.index > this.documentElement.index)
                    HierarchyRequestError();

                this.doctype = child;
                if (oldChild === this.documentElement)
                    this.documentElement = null;
            }
            else {
                if (oldChild === this.documentElement)
                    this.documentElement = null;
                else if (oldChild === this.doctype)
                    this.doctype = null;
            }
            return call(impl.Node.prototype.replaceChild, this,child,oldChild);
        }),

        removeChild: constant(function removeChild(child) {
            if (child.nodeType === DOCUMENT_TYPE_NODE)
                this.doctype = null;
            else if (child.nodeType === ELEMENT_NODE)
                this.documentElement = null;

            // Now chain to our superclass
            return call(impl.Node.prototype.removeChild, this, child);
        }),

        getElementById: constant(function(id) {
            var n = this.byId[id];
            if (!n) return null;
            if (isArray(n)) { // there was more than one element with this id
                return n[0];  // array is sorted in document order
            }
            return n;
        }),


        // XXX: 
        // Tests are currently failing for this function.
        // Awaiting resolution of:
        // http://lists.w3.org/Archives/Public/www-dom/2011JulSep/0016.html
        getElementsByTagName: constant(function getElementsByTagName(lname) {
            var filter;
            if (lname === "*")
                filter = ftrue;
            else if (this.doc.isHTML) 
                filter = htmlLocalNameElementFilter(lname);
            else 
                filter = localNameElementFilter(lname);

            return new impl.FilteredElementList(this, filter);
        }),

        getElementsByTagNameNS: constant(function getElementsByTagNameNS(ns,
                                                                         lname){
            var filter;
            if (ns === "*" && lname === "*")
                filter = ftrue;
            else if (ns === "*") 
                filter = localNameElementFilter(lname);
            else if (lname === "*")
                filter = namespaceElementFilter(ns);
            else
                filter = namespaceLocalNameElementFilter(ns, lname);

            return new impl.FilteredElementList(this, filter);
        }),

        getElementsByClassName: constant(function getElementsByClassName(names){
            names = names.trim();  
            if (names === "") return []; // Empty node list
            names = names.split(/\s+/);  // Split on spaces
            return new impl.FilteredElementList(this, 
                                           new classNamesElementFilter(names));
        }),

        adoptNode: constant(function adoptNode(node) {
            if (node.nodeType === DOCUMENT_NODE ||
                node.nodeType === DOCUMENT_TYPE_NODE) NotSupportedError();

            if (node.parentNode) node.parentNode.removeChild(node)

            if (node.ownerDocument !== this)
                recursivelySetOwner(node, this);

            return node;
        }),

        importNode: constant(function importNode(node, deep) {
            return this.adoptNode(node.cloneNode());
        }),


        // Utility methods
        clone: constant(function clone() {
            // Can't clone an entire document
            DataCloneError();  
        }),
        isEqual: constant(function isEqual(n) {
            // Any two documents are shallowly equal.
            // Node.isEqualNode will also test the children
            return true;
        }),

        // Implementation-specific function.  Called when a text, comment, 
        // or pi value changes.
        mutateValue: constant(function(node) {
            if (this.mutationHandler) {
                this.mutationHandler({
                    type: MUTATE_VALUE,
                    target: node._nid,
                    data: node.data
                });
            }
        }),

        // Invoked when an attribute's value changes. Attr holds the new
        // value.  oldval is the old value.  Attribute mutations can also
        // involve changes to the prefix (and therefore the qualified name)
        mutateAttr: constant(function(attr, oldval) {
            // Manage id->element mapping for getElementsById()
            if (attr.localName === "id" && attr.namespaceURI === null) {
                if (oldval !== null) delId(oldval, attr.ownerElement);
                addId(attr.value, attr.ownerElement);
            }
            
            if (this.mutationHandler) {
                this.mutationHandler({
                    type: MUTATE_ATTR,
                    target: attr.ownerElement._nid,
                    name: attr.localName,
                    ns: attr.namespaceURI,
                    value: attr.value,
                    prefix: attr.prefix
                });
            }
        }),

        // Used by removeAttribute and removeAttributeNS for attributes.
        mutateRemoveAttr: constant(function(attr) {
            // Manage id to element mapping 
            if (attr.localName === "id" && attr.namespaceURI === null) {
                delId(attr.value, attr.ownerElement);
            }

            if (this.mutationHandler) {
                this.mutationHandler({
                    type: MUTATE_REMOVE_ATTR,
                    target: attr.ownerElement._nid,
                    name: attr.localName,
                    ns: attr.namespaceURI
                });
            }
        }),

        // Called by Node.removeChild, etc. to remove a rooted element from
        // the tree. Only needs to generate a single mutation event when a 
        // node is removed, but must recursively mark all descendants as not
        // rooted.
        mutateRemove: constant(function(node) {
            // Send a single mutation event
            if (this.mutationHandler) {
                this.mutationHandler({
                    type: MUTATE_REMOVE,
                    target: node._nid
                });
            }

            // Mark this and all descendants as not rooted
            recursivelyUproot(node);
        }),

        // Called when a new element becomes rooted.  It must recursively
        // generate mutation events for each of the children, and mark them all
        // as rooted.
        mutateInsert: constant(function(node) {
            // Mark node and its descendants as rooted
            recursivelyRoot(node);

            // Send a single mutation event
            if (this.mutationHandler) {
                this.mutationHandler({
                    type: MUTATE_INSERT,
                    parent: node.parentNode._nid,
                    index: node.index,
                    nid: node._nid,
                    child: DOMSTR.stringify(node)
                });
            }
        }),

        // Called when a rooted element is moved within the document
        mutateMove: constant(function(node) {
            if (this.mutationHandler) {
                this.mutationHandler({
                    type: MUTATE_MOVE,
                    target: node._nid,
                    parent: node.parentNode._nid,
                    index: node.index
                });
            }
        }),
    });

    function root(n) {
        n._nid = n.ownerDocument._nextnid++;
        // Manage id to element mapping 
        if (n.nodeType === ELEMENT_NODE) {
            var id = n.getAttribute("id");
            if (id) addId(id, n);
        }
    }

    function uproot(n) {
        // Manage id to element mapping 
        if (n.nodeType === ELEMENT_NODE) {
            var id = n.getAttribute("id");
            if (id) delId(id, n);
        }
        delete n._nid;
    }

    var recursivelyRoot = recursive(root),
        recursivelyUproot = recursive(uproot);

    // Add a mapping from  id to n for n.ownerDocument
    function addId(id, n) {
        var doc = n.ownerDocument, map = doc.byId, val = map[id];
        if (!val) {
            map[id] = n;
        }
        else {
            warn("Duplicate element id " + id);
            if (!isArray(val)) {
                val = [val];
                map[id] = val;
            }
            val.push(n);
            sort(val, documentOrder);
        }
    }

    // Delete the mapping from id to n for n.ownerDocument
    function delId(id, n) {
        var doc = n.ownerDocument, map = doc.byId, val = map[id];
        assert(val);

        if (isArray(val)) {
            var idx = A.indexOf(val, n);
            splice(val, idx, 1);

            if (val.length == 1) { // convert back to a single node
                map[id] = val[0];
            }
        }
        else {
            delete map[id];
        }
    }

    function recursivelySetOwner(node, owner) {
        node.ownerDocument = owner;
        delete node._lastModified; // mod times are document-based
        var kids = node.childNodes;
        for(var i = 0, n = kids.length; i < n; i++)
            recursivelySetOwner(kids[i], owner);
    }


    // These function return predicates for filtering elements.
    // They're used by the Document and Element classes for methods like
    // getElementsByTagName and getElementsByClassName

    function localNameElementFilter(lname) {
        return function(e) { return e.localName === lname; };
    }

    function htmlLocalNameElementFilter(lname) {
        var lclname = toLowerCase(lname);
        if (lclname === lname)
            return localNameElementFilter(lname);

        return function(e) {
            return e.isHTML
                ? e.localName === lclname
                : e.localName === lname;
        };
    }

    function namespaceElementFilter(ns) {
        return function(e) { return e.namespaceURI === ns; };
    }

    function namespaceLocalNameElementFilter(ns, lname) {
        return function(e) {
            return e.namespaceURI === ns && e.localName === lname;
        };
    }

    // XXX
    // Optimize this when I implement classList.
    function classNamesElementFilter(names) {
        return function(e) {
            var classAttr = e.getAttribute("class");
            if (!classAttr) return false;
            var classes = classAttr.trim().split(/\s+/);
            return every(names, function(n) {
                return A.indexOf(classes, n) !== -1;
            })
        }
    }


    return Document;
});



/************************************************************************
 *  src/impl/DocumentFragment.js
 ************************************************************************/

//@line 1 "src/impl/DocumentFragment.js"
defineLazyProperty(impl, "DocumentFragment", function() {
    function DocumentFragment(doc) {
        this.ownerDocument = doc;
        this.childNodes = [];
    }

    DocumentFragment.prototype = O.create(impl.Node.prototype, {
        nodeType: constant(DOCUMENT_FRAGMENT_NODE),
        nodeName: constant("#document-fragment"),
        nodeValue: attribute(fnull, fnoop),
        // Copy the text content getter/setter from Element
        textContent: O.getOwnPropertyDescriptor(impl.Element.prototype,
                                                "textContent"),

        // Utility methods
        clone: constant(function clone() {
            return new DocumentFragment(this.ownerDocument);
        }),
        isEqual: constant(function isEqual(n) {
            // Any two document fragments are shallowly equal.
            // Node.isEqualNode() will test their children for equality
            return true;
        }),

    });

    return DocumentFragment;
});


/************************************************************************
 *  src/impl/DocumentType.js
 ************************************************************************/

//@line 1 "src/impl/DocumentType.js"
defineLazyProperty(impl, "DocumentType", function() {
    function DocumentType(name, publicId, systemId) {
        // Unlike other nodes, doctype nodes always start off unowned
        // until inserted
        this.ownerDocument = null;
        this.name = name;  
        this.publicId = publicId || "";
        this.systemId = systemId || "";
    }

    DocumentType.prototype = O.create(impl.Leaf.prototype, {
        nodeType: constant(DOCUMENT_TYPE_NODE),
        nodeName: attribute(function() { return this.name; }),
        nodeValue: attribute(fnull, fnoop),

        // Utility methods
        clone: constant(function clone() {
            DataCloneError();
        }),
        isEqual: constant(function isEqual(n) {
            return this.name === n.name &&
                this.publicId === n.publicId &&
                this.systemId === n.systemId;
        }),
        toObject: constant(function toObject() {
            return {
                type: DOCUMENT_TYPE_NODE,
                name: this.name,
                publicId: this.publicId,
                systemId: this.sytemId
            };
        }),

    });

    return DocumentType;
});


/************************************************************************
 *  src/impl/DOMImplementation.js
 ************************************************************************/

//@line 1 "src/impl/DOMImplementation.js"
defineLazyProperty(impl, "DOMImplementation", function() {
    // Each document must have its own instance of the domimplementation object
    // Even though these objects have no state
    function DOMImplementation() {};


    // Feature/version pairs that DOMImplementation.hasFeature() returns
    // true for.  It returns false for anything else.
    const supportedFeatures = {
        "xml": { "": true, "1.0": true, "2.0": true },   // DOM Core 
        "core": { "": true, "2.0": true },               // DOM Core
        "html": { "": true, "1.0": true, "2.0": true} ,  // HTML
        "xhtml": { "": true, "1.0": true, "2.0": true} , // HTML
    };

    DOMImplementation.prototype = {
        hasFeature: function hasFeature(feature, version) {
            // Warning text directly modified slightly from the DOM Core spec:
            warn("Authors are strongly discouraged from using " +
                 "DOMImplementation.hasFeature(), as it is notoriously " +
                 "unreliable and imprecise. " +
                 "Use explicit feature testing instead.");

            var f = supportedFeatures[feature.toLowerCase()];

            return (f && f[version]) || false;
        },
        

        createDocumentType: function createDocumentType(qualifiedName,
                                                        publicId, systemId) {
            if (!isValidName(qualifiedName)) InvalidCharacterError();
            if (!isValidQName(qualifiedName)) NamespaceError();

            return new impl.DocumentType(qualifiedName, publicId, systemId);
        },

        createDocument: function createDocument(namespace,
                                                qualifiedName, doctype) {
            // 
            // Note that the current DOMCore spec makes it impossible to
            // create an HTML document with this function, even if the 
            // namespace and doctype are propertly set.  See this thread:
            // http://lists.w3.org/Archives/Public/www-dom/2011AprJun/0132.html
            // 
            var d = new impl.Document(false), e;
            
            if (qualifiedName) 
                e = d.createElementNS(namespace, qualifiedName);
            else
                e = null;

            if (doctype) {
                if (doctype.ownerDocument) WrongDocumentError();
                d.appendChild(doctype);
            }

            if (e) d.appendChild(e);

            return d;
        },

        createHTMLDocument: function createHTMLDocument(titleText) {
            var d = new impl.Document(true);
            d.appendChild(new impl.DocumentType("html"));
            var html = d.createElement("html");
            d.appendChild(html);
            var head = d.createElement("head");
            html.appendChild(head);
            var title = d.createElement("title");
            head.appendChild(title);
            title.appendChild(d.createTextNode(titleText));
            html.appendChild(d.createElement("body"));
            return d;
        },


        mozSetOutputMutationHandler: function(doc, handler) {
            doc.mutationHandler = handler;
        },

        mozGetInputMutationHandler: function(doc) {
            nyi();
        },
    };

    return DOMImplementation;
});


/************************************************************************
 *  src/impl/FilteredElementList.js
 ************************************************************************/

//@line 1 "src/impl/FilteredElementList.js"
//
// This file defines node list implementation that lazily traverses
// the document tree (or a subtree rooted at any element) and includes
// only those elements for which a specified filter function returns true.
// It is used to implement the
// {Document,Element}.getElementsBy{TagName,ClassName}{,NS} methods.
//
defineLazyProperty(impl, "FilteredElementList", function() {
    function FilteredElementList(root, filter) {
        this.root = root;
        this.filter = filter;
        this.lastModified = root.lastModified
        this.done = false;
        this.cache = [];
    }

    FilteredElementList.prototype = {
        get length() { 
            this.checkcache();
            if (!this.done) this.traverse();
            return this.cache.length;
        },

        item: function(n) {
            this.checkcache();
            if (!this.done && n >= this.cache.length)
                this.traverse(n);
            return this.cache[n];
        },

        checkcache: function() {
            if (this.lastModified !== this.root.lastModified) {
                // subtree has changed, so invalidate cache
                this.cache.length = 0;
                this.done = false;
                this.lastModified = this.root.lastModified;
            }
        },

        // If n is specified, then traverse the tree until we've found the nth
        // item (or until we've found all items).  If n is not specified, 
        // traverse until we've found all items.
        traverse: function(n) {
            // increment n so we can compare to length, and so it is never falsy
            if (n !== undefined) n++;  

            var elt;
            while(elt = this.next()) {
                push(this.cache, elt);
                if (n && this.cache.length === n) return;
            }
            
            // no next element, so we've found everything
            this.done = true;
        },

        // Return the next element under root that matches filter
        next: function() {
            var start = (this.cache.length == 0)    // Start at the root or at
                ? this.root                         // the last element we found
                : this.cache[this.cache.length-1];

            var elt;
            if (start.nodeType === DOCUMENT_NODE)
                elt = start.documentElement;
            else
                elt = start.nextElement(this.root);

            while(elt) {
                if (this.filter(elt)) {
                    return elt;
                }

                elt = elt.nextElement(this.root);
            }
            return null;
        }
    };

    return FilteredElementList;
});


/************************************************************************
 *  src/impl/Event.js
 ************************************************************************/

//@line 1 "src/impl/Event.js"
defineLazyProperty(impl, "Event", function() {
    function Event(type, dictionary) {
        // Initialize basic event properties
        this.type = "";
        this.target = null;
        this.currentTarget = null;
        this.eventPhase = AT_TARGET;
        this.bubbles = false;
        this.cancelable = false;
        this.isTrusted = false;
        this.defaultPrevented = false;
        this.timeStamp = Date.now();

        // Initialize internal flags
        // XXX: Would it be better to inherit these defaults from the prototype?
        this._propagationStopped = false;
        this._immediatePropagationStopped = false;
        this._initialized = false;
        this._dispatching = false;

        // Now initialize based on the constructor arguments (if any)
        if (type) this.type = type;
        if (dictionary) {
            for(var p in dictionary) 
                this[p] = dictionary[p];
        }
    }

    Event.prototype = O.create(Object.prototype, {
        stopPropagation: constant(function stopPropagation() {
            this._propagationStopped = true;
        }),

        stopImmediatePropagation: constant(function stopImmediatePropagation() {
            this._propagationStopped = true;
            this._immediatePropagationStopped = true;
        }),

        preventDefault: constant(function preventDefault() {
            if (this.cancelable)
                this.defaultPrevented = true;
        }),

        initEvent: constant(function initEvent(type, bubbles, cancelable) {
            this._initialized = true;
            if (this._dispatching) return;

            this._propagationStopped = false;
            this._immediatePropagationStopped = false;
            this.defaultPrevented = false;
            this.isTrusted = false;

            this.target = null;
            this.type = type;
            this.bubbles = bubbles;
            this.cancelable = cancelable;
        }),

    });

    return Event;
});



/************************************************************************
 *  src/impl/CustomEvent.js
 ************************************************************************/

//@line 1 "src/impl/CustomEvent.js"
defineLazyProperty(impl, "CustomEvent", function() {
    function CustomEvent(type, dictionary) {
        // Just use the superclass constructor to initialize
        impl.Event.call(this, type, dictionary);
    }
    CustomEvent.prototype = O.create(impl.Event.prototype);
    return CustomEvent;
});



/************************************************************************
 *  src/main.js
 ************************************************************************/

//@line 1 "src/main.js"
// The document object is the entry point to the entire DOM
defineLazyProperty(global, "document", function() {
    return wrap(new impl.DOMImplementation().createHTMLDocument(""),
               idl.Document);
});
}(this));
