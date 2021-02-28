import { eTokenType, Token } from "./tokens";

export enum eScriptNode
{
    snUndefined,
    snScript,
    snFunction,
    snConstant,
    snDataType,
    snIdentifier,
    snParameterList,
    snStatementBlock,
    snDeclaration,
    snExpressionStatement,
    snIf,
    snFor,
    snWhile,
    snReturn,
    snExpression,
    snExprTerm,
    snFunctionCall,
    snConstructCall,
    snArgList,
    snExprPreOp,
    snExprPostOp,
    snExprOperator,
    snExprValue,
    snBreak,
    snContinue,
    snDoWhile,
    snAssignment,
    snCondition,
    snSwitch,
    snCase,
    snImport,
    snClass,
    snInitList,
    snInterface,
    snEnum,
    snTypedef,
    snCast,
    snVariableAccess,
    snFuncDef,
    snVirtualProperty,
    snNamespace,
    snMixin,
    snListPattern,
    snNamedArgument,
    snScope,
    snTryCatch
}

export class ScriptNode
{
    nodeType: eScriptNode;
    tokenType: eTokenType;
    tokenPos: number;
    tokenLength: number;

    parent: ScriptNode | null;
    next: ScriptNode | null;
    prev: ScriptNode | null;
    firstChild: ScriptNode | null;
    lastChild: ScriptNode | null;

    constructor(nodeType: eScriptNode)
    {
        this.nodeType = nodeType;
        this.tokenType = eTokenType.ttUnrecognizedToken;
        this.tokenPos = 0;
        this.tokenLength = 0;

        this.parent = null;
        this.next = null;
        this.prev = null;
        this.firstChild = null;
        this.lastChild = null;
    }

    SetToken(token: Token, updateSourcePosition: boolean = true)
    {
        this.tokenType = token.type;
        if (updateSourcePosition)
        {
            this.UpdateSourcePosition(token.pos, token.length);
        }
    }

    AddChildLast(node: ScriptNode)
    {
        if (this.lastChild != null)
        {
            this.lastChild.next = node;
            node.next = null;
            node.prev = this.lastChild;
            node.parent = this;
            this.lastChild = node;
        }
        else
        {
            this.firstChild = node;
            this.lastChild = node;
            node.next = null;
            node.prev = null;
            node.parent = this;
        }

        this.UpdateSourcePosition(node.tokenPos, node.tokenLength);
    }

    DisconnectParent()
    {
        if (this.parent != null)
        {
            if (this.parent.firstChild == this)
            {
                this.parent.firstChild = this.next;
            }
            if (this.parent.lastChild == this)
            {
                this.parent.lastChild = this.prev;
            }
        }

        if (this.next)
        {
            this.next.prev = this.prev;
        }

        if (this.prev)
        {
            this.prev.next = this.next;
        }

        this.parent = null;
        this.next = null;
        this.prev = null;
    }

    UpdateSourcePosition(pos: number, length: number)
    {
        if (pos == 0 && length == 0) return;

        if (this.tokenPos == 0 && this.tokenLength == 0)
        {
            this.tokenPos = pos;
            this.tokenLength = length;
        }
        else
        {
            if (this.tokenPos > pos)
            {
                this.tokenLength = this.tokenPos + this.tokenLength - pos;
                this.tokenPos = pos;
            }

            if (pos + length > this.tokenPos + this.tokenLength)
            {
                this.tokenLength = pos + length - this.tokenPos;
            }
        }
    }
};
