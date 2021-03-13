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
        nodes.push({ id: objectId(elem), label: scriptnode_1.eScriptNode[elem.nodeType] });
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
console.log("Hello");
let script = `
int foo()
{
    if (x != 4)
    {
        bar(5);
    }
}
`;
let parser = new parser_1.Parser(script);
let root = parser.GetRootNode();
let what = parser.ParseScript();
const tree = PrintTree(what);
const example1 = {
    "kind": { "tree": true },
    "nodes": [
        { "id": "1", "label": "1" },
        { "id": "2", "label": "Function\n" + `
void Test() {
}
`, "color": "orange" },
        { "id": "3", "label": "3" }
    ],
    "edges": [
        { "from": "1", "to": "2", "color": "red" },
        { "from": "1", "to": "3" }
    ]
};
debugger;
//# sourceMappingURL=main.js.map