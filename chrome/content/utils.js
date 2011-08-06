/* -*- Mode: JS; tab-width: 2; indent-tabs-mode: nil; -*-
 * vim: set sw=2 ts=2 et tw=100:
 *
 * This file holds utilities needed for dom.js.
 */


(function(exports) {
  // Converts a host DOM node to a dom.js node.
  function convertNode(hostNode) {
    var n, i;
    switch (hostNode.nodeType) {
      case Node.ELEMENT_NODE:
        n = document.createElement(hostNode.tagName);
        for (i=0; i<hostNode.childNodes.length; i++) {
          var child = hostNode.childNodes[i];
          // A default title element is created by dom.js
          if (child.nodeName.toLowerCase() !== 'title') {
            n.appendChild(convertNode(child));
          }
        }
        for(i = 0; i < hostNode.attributes.length; i++) {
          var attr = hostNode.attributes[i];
          n.setAttribute(attr.name, attr.value);
        }
        break;
      case Node.PROCESSING_INSTRUCTION_NODE:
        n = document.createProcessingInstruction(hostNode.target, hostNode.data);
        break;
      case Node.TEXT_NODE:
        n = document.createTextNode(hostNode.data);
        break;
      case Node.COMMENT_NODE:
        n = document.createComment(hostNode.data);
        break;
      default:
        Zaphod.log('unhandled node type: ' + hostNode.nodeType);
    }
    return n;
  }

  exports.copyDOMintoDomjs = function() {
    var head = document.getElementsByTagName('head')[0];
    var hostHead = hostDoc.getElementsByTagName('head')[0];
    head.appendChild(convertNode(hostHead));

    var title = document.getElementsByTagName('title')[0];
    var hostTitle = hostDoc.getElementsByTagName('title')[0];
    title.firstChild.nodeValue = hostTitle.firstChild.data;

    var body = document.getElementsByTagName('body')[0];
    var hostBody = hostDoc.getElementsByTagName('body')[0];
    body.appendChild(convertNode(hostBody));
  }
})(this);

