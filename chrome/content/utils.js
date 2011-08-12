/* -*- Mode: JS; tab-width: 2; indent-tabs-mode: nil; -*-
 * vim: set sw=2 ts=2 et tw=100:
 *
 * This file holds utilities needed for dom.js.
 */

(function(exports) {

//FIXME: Should be added to dom.js in a visible manner, I think
const MUTATE_VALUE = 1;
const MUTATE_ATTR = 2;
const MUTATE_REMOVE_ATTR = 3;
const MUTATE_REMOVE = 4;
const MUTATE_MOVE = 5;
const MUTATE_INSERT = 6;

  var nodeMap={};

  function addChild(parentNode, n, hostNode) {
    // Set a temporary mutation handler to build up the node map
    document.implementation.mozSetOutputMutationHandler(document, function(o){
        if (o.type === MUTATE_INSERT) {
          nodeMap[o.nid] = hostNode;
        }
    });
    parentNode.appendChild(n);
  }

  // Clones hostNode as a dom.js node (using n as the clone, if it exists)
  // and adds the clone to the parentNode.
  function cloneNode(hostNode, parentNode, n) {
    var i, child;
    switch (hostNode.nodeType) {
      case Node.ELEMENT_NODE:
        if (!n) {
          n = document.createElement(hostNode.tagName);
          addChild(parentNode, n, hostNode);
        }
        for (i=0; i<hostNode.childNodes.length; i++) {
          child = hostNode.childNodes[i];
          // A default title element is created by dom.js
          if (child.nodeName.toLowerCase() !== 'title') {
            cloneNode(child,n);
          }
        }
        for(i = 0; i < hostNode.attributes.length; i++) {
          var attr = hostNode.attributes[i];
          n.setAttribute(attr.name, attr.value);
        }
        break;
      case Node.PROCESSING_INSTRUCTION_NODE:
        n = document.createProcessingInstruction(hostNode.target, hostNode.data);
        addChild(parentNode, n, hostNode);
        break;
      case Node.TEXT_NODE:
        n = document.createTextNode(hostNode.data);
        addChild(parentNode, n, hostNode);
        break;
      case Node.COMMENT_NODE:
        n = document.createComment(hostNode.data);
        addChild(parentNode, n, hostNode);
        break;
      default:
        Zaphod.log('unhandled node type: ' + hostNode.nodeType);
    }
  }

  // Create a spidermonkey node from a dom.js node
  function createHostNode(domjsNodeStr, nid) {
    var n, child, attr;

    //FIXME: Should handle more complex strings
    const NULL = '\0';

    // Check to see if the host node already exists
    if (nodeMap[nid]) return nodeMap[nid];

    switch (domjsNodeStr.charAt(0)) {
      case 'T':
        n = hostDoc.createTextNode(domjsNodeStr.substr(1));
        break;
      case 'C':
        n = hostDoc.createComment(domjsNodeStr.substr(1));
        break;
      case 'H':
      case 'E':
        n = hostDoc.createElement(domjsNodeStr.substr(1).split(NULL)[0]);
        break;
      default:
        throw new Error('Unhandled case of stringified node: ' + domjsNodeStr.charAt(0));
    }
    nodeMap[nid] = n;
    return n;
  }

  function insertAtPosition(parentId, hostNode, position) {
    var parentNode = nodeMap[parentId];
    if (position < parentNode.childNodes.length) {
      parentNode.insertBefore(hostNode, parentNode.childNodes[position]);
    }
    else {
      parentNode.appendChild(hostNode);
    }
  }

  exports.copyDOMintoDomjs = function() {
    // Setting pre-defined nodes (currently incomplete)
    nodeMap.document = 1;

    var head = document.getElementsByTagName('head')[0];
    var hostHead = hostDoc.getElementsByTagName('head')[0];
    cloneNode(hostHead, document, head);

    var title = document.getElementsByTagName('title')[0];
    var hostTitle = hostDoc.getElementsByTagName('title')[0];
    title.firstChild.nodeValue = hostTitle.firstChild.data;

    var body = document.getElementsByTagName('body')[0];
    var hostBody = hostDoc.getElementsByTagName('body')[0];
    cloneNode(hostBody, document, body);

    document.body = body;

    // Callback handler registers mutation events to reflect changes in the host DOM.
    document.implementation.mozSetOutputMutationHandler(document, function(o){
      var hostNode, parentNode;
      switch(o.type) {
        case MUTATE_VALUE:
          nodeMap[o.target].data = o.data;
          break;
        case MUTATE_ATTR:
          nodeMap[o.target].setAttribute(o.name, o.value);
          break;
        case MUTATE_REMOVE_ATTR:
          nodeMap[o.target].removeAttribute(o.name);
          break;
        case MUTATE_REMOVE:
          hostNode = nodeMap[o.target];
          hostNode.parentNode.removeChild(hostNode);
          break;
        case MUTATE_MOVE:
          hostNode = nodeMap[o.target];
          insertAtPosition(o.parent, hostNode, o.index);
          break;
        case MUTATE_INSERT:
          //FIXME: Need to deal with more complex strings
          hostNode = createHostNode(o.child, o.nid);
          insertAtPosition(o.parent, hostNode, o.index);
          break;
        default:
          throw new Error('Unhandled mutation case: ' + MUTATE_VALUE);
      }
    });
  }

})(this);

