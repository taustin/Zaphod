/*
 * Narcissus - JS implemented in JS.
 *
 * Browser-specific tweaks needed for Narcissus to execute properly
 */

// Prevent setTimeout from breaking out to SpiderMonkey
Narcissus.interpreter.timeouts=[];
Narcissus.interpreter.global.setTimeout = function(code, delay) {
    var timeoutCode = (typeof code === "string") ?
            function() { Narcissus.interpreter.evaluate(code); } :
            code;
    var tid = setTimeout(timeoutCode, delay);
    Narcissus.interpreter.timeouts.push(tid);
    return tid;
};

// Prevent setInterval from breaking out to SpiderMonkey
Narcissus.interpreter.intervals=[];
Narcissus.interpreter.global.setInterval = function(code, delay) {
    var timeoutCode = (typeof code === "string") ?
            function() { Narcissus.interpreter.evaluate(code); } :
            code;
    var tid = setInterval(timeoutCode, delay);
    Narcissus.interpreter.intervals.push(tid);
    return tid;
};

Zaphod.clearAllTimers = function() {
  // Wipeout setTimeout and setInterval in narcissus so that
  // nothing calls them while we are doing cleanup
  // They will be restored when Narcissus is reloaded.
  delete Narcissus.interpreter.global.setTimeout;
  delete Narcissus.interpreter.global.setInterval;

  Narcissus.interpreter.timeouts.forEach(function(timeoutId){
      clearTimeout(timeoutId);
  });
  Narcissus.interpreter.intervals.forEach(function(intervalId){
      clearInterval(intervalId);
  });
}

// Hack to avoid problems with the Image constructor in Narcissus.
Narcissus.interpreter.global.Image = function() {};


