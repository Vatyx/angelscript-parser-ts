"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScriptNode = exports.eScriptNode = void 0;
const tokens_1 = require("./tokens");
var eScriptNode;
(function (eScriptNode) {
    eScriptNode[eScriptNode["snUndefined"] = 0] = "snUndefined";
    eScriptNode[eScriptNode["snScript"] = 1] = "snScript";
    eScriptNode[eScriptNode["snFunction"] = 2] = "snFunction";
    eScriptNode[eScriptNode["snConstant"] = 3] = "snConstant";
    eScriptNode[eScriptNode["snType"] = 4] = "snType";
    eScriptNode[eScriptNode["snTypemod"] = 5] = "snTypemod";
    eScriptNode[eScriptNode["snDataType"] = 6] = "snDataType";
    eScriptNode[eScriptNode["snIdentifier"] = 7] = "snIdentifier";
    eScriptNode[eScriptNode["snParameterList"] = 8] = "snParameterList";
    eScriptNode[eScriptNode["snStatementBlock"] = 9] = "snStatementBlock";
    eScriptNode[eScriptNode["snDeclaration"] = 10] = "snDeclaration";
    eScriptNode[eScriptNode["snExpressionStatement"] = 11] = "snExpressionStatement";
    eScriptNode[eScriptNode["snIf"] = 12] = "snIf";
    eScriptNode[eScriptNode["snFor"] = 13] = "snFor";
    eScriptNode[eScriptNode["snWhile"] = 14] = "snWhile";
    eScriptNode[eScriptNode["snReturn"] = 15] = "snReturn";
    eScriptNode[eScriptNode["snExpression"] = 16] = "snExpression";
    eScriptNode[eScriptNode["snExprTerm"] = 17] = "snExprTerm";
    eScriptNode[eScriptNode["snFunctionCall"] = 18] = "snFunctionCall";
    eScriptNode[eScriptNode["snConstructCall"] = 19] = "snConstructCall";
    eScriptNode[eScriptNode["snArgList"] = 20] = "snArgList";
    eScriptNode[eScriptNode["snExprPreOp"] = 21] = "snExprPreOp";
    eScriptNode[eScriptNode["snExprPostOp"] = 22] = "snExprPostOp";
    eScriptNode[eScriptNode["snExprOperator"] = 23] = "snExprOperator";
    eScriptNode[eScriptNode["snExprValue"] = 24] = "snExprValue";
    eScriptNode[eScriptNode["snBreak"] = 25] = "snBreak";
    eScriptNode[eScriptNode["snContinue"] = 26] = "snContinue";
    eScriptNode[eScriptNode["snDoWhile"] = 27] = "snDoWhile";
    eScriptNode[eScriptNode["snAssignment"] = 28] = "snAssignment";
    eScriptNode[eScriptNode["snCondition"] = 29] = "snCondition";
    eScriptNode[eScriptNode["snSwitch"] = 30] = "snSwitch";
    eScriptNode[eScriptNode["snCase"] = 31] = "snCase";
    eScriptNode[eScriptNode["snImport"] = 32] = "snImport";
    eScriptNode[eScriptNode["snClass"] = 33] = "snClass";
    eScriptNode[eScriptNode["snInitList"] = 34] = "snInitList";
    eScriptNode[eScriptNode["snInterface"] = 35] = "snInterface";
    eScriptNode[eScriptNode["snEnum"] = 36] = "snEnum";
    eScriptNode[eScriptNode["snTypedef"] = 37] = "snTypedef";
    eScriptNode[eScriptNode["snCast"] = 38] = "snCast";
    eScriptNode[eScriptNode["snVariableAccess"] = 39] = "snVariableAccess";
    eScriptNode[eScriptNode["snFuncDef"] = 40] = "snFuncDef";
    eScriptNode[eScriptNode["snVirtualProperty"] = 41] = "snVirtualProperty";
    eScriptNode[eScriptNode["snNamespace"] = 42] = "snNamespace";
    eScriptNode[eScriptNode["snMixin"] = 43] = "snMixin";
    eScriptNode[eScriptNode["snListPattern"] = 44] = "snListPattern";
    eScriptNode[eScriptNode["snNamedArgument"] = 45] = "snNamedArgument";
    eScriptNode[eScriptNode["snScope"] = 46] = "snScope";
    eScriptNode[eScriptNode["snTryCatch"] = 47] = "snTryCatch";
})(eScriptNode = exports.eScriptNode || (exports.eScriptNode = {}));
class ScriptNode {
    constructor(nodeType) {
        this.nodeType = nodeType;
        this.tokenType = tokens_1.eTokenType.ttUnrecognizedToken;
        this.tokenPos = 0;
        this.tokenLength = 0;
        this.parent = null;
        this.next = null;
        this.prev = null;
        this.firstChild = null;
        this.lastChild = null;
    }
    toString() {
        return eScriptNode[this.nodeType];
    }
    SetToken(token, updateSourcePosition = true) {
        this.tokenType = token.type;
        if (updateSourcePosition) {
            this.UpdateSourcePosition(token.pos, token.length);
        }
    }
    AddChildLast(node) {
        if (this.lastChild != null) {
            this.lastChild.next = node;
            node.next = null;
            node.prev = this.lastChild;
            node.parent = this;
            this.lastChild = node;
        }
        else {
            this.firstChild = node;
            this.lastChild = node;
            node.next = null;
            node.prev = null;
            node.parent = this;
        }
        this.UpdateSourcePosition(node.tokenPos, node.tokenLength);
    }
    DisconnectParent() {
        if (this.parent != null) {
            if (this.parent.firstChild == this) {
                this.parent.firstChild = this.next;
            }
            if (this.parent.lastChild == this) {
                this.parent.lastChild = this.prev;
            }
        }
        if (this.next) {
            this.next.prev = this.prev;
        }
        if (this.prev) {
            this.prev.next = this.next;
        }
        this.parent = null;
        this.next = null;
        this.prev = null;
    }
    UpdateSourcePosition(pos, length) {
        if (pos == 0 && length == 0)
            return;
        if (this.tokenPos == 0 && this.tokenLength == 0) {
            this.tokenPos = pos;
            this.tokenLength = length;
        }
        else {
            if (this.tokenPos > pos) {
                this.tokenLength = this.tokenPos + this.tokenLength - pos;
                this.tokenPos = pos;
            }
            if (pos + length > this.tokenPos + this.tokenLength) {
                this.tokenLength = pos + length - this.tokenPos;
            }
        }
    }
}
exports.ScriptNode = ScriptNode;
;
//# sourceMappingURL=scriptnode.js.map