/* -*- Mode: JS; tab-width: 2; indent-tabs-mode: nil; -*-
 * vim: set sw=2 ts=2 et tw=100:
 *
 * This file holds utilities needed for dom.js.
 */

function copynodes(from, to) {
  try {
    var ownerDocument = to.ownerDocument || document;
    for(var n = from.firstChild; n !== null; n = n.nextSibling) {
        switch(n.nodeType) {
        case Node.ELEMENT_NODE:
          try{
            var copy = ownerDocument.createElement(n.nodeName);
            // copy attributes
            for(var i = 0, len = n.attributes.length; i < len; i++) {
                var a = n.attributes[i];
                copy.setAttributeNS(a.namespaceURI, a.qname, a.value);
            }
            // copy kids
            copynodes(n,copy);
            //if (n.nodeName === 'HTML') {
            //    document.documentElement.appendChild(copy);
            //    alert('Title=' + document.getElementsByTagName('title')[0].firstChild.data);
            //}
            //else {
                to.appendChild(copy);
            //}

            // If it was a <script> tag, execute the script
            //if (n.tagName === "SCRIPT" && !n.hasAttribute("src")) {
            //    var script = n.firstChild.data;
            //    runscript(script);
            //}
          } catch (e) { alert('Error caught on ' + n.nodeName); }

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
  } catch (e) { alert('dom.js Error: ' + e); }
}

function nodeAsStr(n, indent) {
  var s = '';
  indent = indent || '';
  for(var child = n.firstChild; child !== null; child = child.nextSibling) {
    switch(child.nodeType) {
      case Node.ELEMENT_NODE:
        s += '\n' + indent + child.tagName + ' ';
        s += nodeAsStr(child, '  ' + indent);
        break;
      case Node.PROCESSING_INSTRUCTION_NODE:
        s += 'PI:' + child.data;
        break;
      case Node.TEXT_NODE:
        s += 'TEXT:' + child.data;
        break;
      case Node.COMMENT_NODE:
        s += 'COMMENT:' + child.data;
        break;
    }
  }
  return s;
}

