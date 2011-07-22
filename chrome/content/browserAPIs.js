/*
 * Narcissus - JS implemented in JS.
 *
 * Browser-specific tweaks needed for Narcissus to execute properly
 */

// List of currently running timers
Narcissus.interpreter.stTimers = [];
Narcissus.interpreter.siTimers = [];

// Clears all timers, so that they won't keep running once you have left the page.
Narcissus.interpreter.clearAllTimers = function() {
    var tid;
    for (tid in Narcissus.interpreter.stTimers) clearTimeout(tid);
    for (tid in Narcissus.interpreter.siTimers) clearInterval(tid);
    Narcissus.interpreter.stTimers = [];
    Narcissus.interpreter.siTimers = [];
}


// Prevent setTimeout from breaking out to SpiderMonkey
Narcissus.interpreter.globalBase.setTimeout = function(code, delay) {
    var timeoutCode = (typeof code === "string") ?
            function() { Narcissus.interpreter.evaluate(code); } :
            code;
    var tid = setTimeout(timeoutCode, delay);
    Narcissus.interpreter.stTimers.push(tid);
    return tid;
};

// Prevent setInterval from breaking out to SpiderMonkey
Narcissus.interpreter.globalBase.setInterval = function(code, delay) {
    var timeoutCode = (typeof code === "string") ?
            function() { Narcissus.interpreter.evaluate(code); } :
            code;
    var tid = setInterval(timeoutCode, delay);
    Narcissus.interpreter.siTimers.push(tid);
    return tid;
};

// Hack to avoid problems with the Image constructor in Narcissus.
Narcissus.interpreter.globalBase.Image = function() {};


