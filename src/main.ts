import { Parser } from "./parser";
import { eScriptNode, ScriptNode } from "./scriptnode";
import { eTokenType } from "./tokens";

var objIdMap=new WeakMap, objectCount = 0;
function objectId(object: ScriptNode){
  if (!objIdMap.has(object)) objIdMap.set(object,++objectCount);
  return objIdMap.get(object) + "";
}

interface node {
    id: string
    label: string
}

interface edges {
    from: string,
    to: string,
}

function PrintTree(tree: ScriptNode)
{
    let queue = [];

    queue.push(tree);

    let nodes: node[] = [];
    let edges: edges[] = [];

    while(queue.length > 0)
    {
        let elem = queue.shift();

        if (!elem)
        {
            break;
        }
        
        nodes.push({id: objectId(elem), label: eScriptNode[elem.nodeType]});

        for(let child: ScriptNode | null | undefined = elem.firstChild; child; child = child.next)
        {
            edges.push({from: objectId(elem), to: objectId(child)})
            if (child as ScriptNode)
            {
                queue.push(child);
            }
        }
    }

    return {
        "kind": { "graph": true },
        "nodes": nodes,
        "edges": edges,
    }
}

console.log("Hello");

let script = `
int foo()
{
    for (int i = 0; i < 10; i++)
    {
        foo(x != false);
    }
}
`

let parser = new Parser(script);
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
