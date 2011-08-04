/*
 * Narcissus - JS implemented in JS.
 *
 * Browser-specific tweaks needed for Narcissus to execute properly
 */

// Prevent setTimeout from breaking out to SpiderMonkey
Narcissus.interpreter.globalBase.setTimeout = function(code, delay) {
    var timeoutCode = (typeof code === "string") ?
            function() { Narcissus.interpreter.evaluate(code); } :
            code;
    return setTimeout(timeoutCode, delay);
};

// Prevent setInterval from breaking out to SpiderMonkey
Narcissus.interpreter.globalBase.setInterval = function(code, delay) {
    var timeoutCode = (typeof code === "string") ?
            function() { Narcissus.interpreter.evaluate(code); } :
            code;
    return setInterval(timeoutCode, delay);
};

// Hack to avoid problems with the Image constructor in Narcissus.
Narcissus.interpreter.globalBase.Image = function() {};


