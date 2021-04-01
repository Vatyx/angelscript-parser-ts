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

let script = `
AWorldItem GetWorldItem() const
{
    int& x = y;
}
`

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

        let source = script.substr(elem.tokenPos, elem.tokenLength);

        nodes.push({id: objectId(elem), label: eScriptNode[elem.nodeType] + "\n" + source});

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

let parser = new Parser(script);
let what = parser.DoParseScript();

const tree = PrintTree(what);

debugger;
