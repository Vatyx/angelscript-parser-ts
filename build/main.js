"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const parser_1 = require("./parser");
const scriptnode_1 = require("./scriptnode");
var objIdMap = new WeakMap, objectCount = 0;
function objectId(object) {
    if (!objIdMap.has(object))
        objIdMap.set(object, ++objectCount);
    return objIdMap.get(object) + "";
}
let script = `
void What()
{
    TArray<int> x;
}
`;
function PrintTree(tree) {
    let queue = [];
    queue.push(tree);
    let nodes = [];
    let edges = [];
    while (queue.length > 0) {
        let elem = queue.shift();
        if (!elem) {
            break;
        }
        let source = script.substr(elem.tokenPos, elem.tokenLength);
        nodes.push({ id: objectId(elem), label: scriptnode_1.eScriptNode[elem.nodeType] + "\n" + source });
        for (let child = elem.firstChild; child; child = child.next) {
            edges.push({ from: objectId(elem), to: objectId(child) });
            if (child) {
                queue.push(child);
            }
        }
    }
    return {
        "kind": { "graph": true },
        "nodes": nodes,
        "edges": edges,
    };
}
let parser = new parser_1.Parser(script);
let what = parser.DoParseScript();
const tree = PrintTree(what);
debugger;
//# sourceMappingURL=main.js.map