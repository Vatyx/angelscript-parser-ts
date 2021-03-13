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
    eScriptNode[eScriptNode["snDataType"] = 5] = "snDataType";
    eScriptNode[eScriptNode["snIdentifier"] = 6] = "snIdentifier";
    eScriptNode[eScriptNode["snParameterList"] = 7] = "snParameterList";
    eScriptNode[eScriptNode["snStatementBlock"] = 8] = "snStatementBlock";
    eScriptNode[eScriptNode["snDeclaration"] = 9] = "snDeclaration";
    eScriptNode[eScriptNode["snExpressionStatement"] = 10] = "snExpressionStatement";
    eScriptNode[eScriptNode["snIf"] = 11] = "snIf";
    eScriptNode[eScriptNode["snFor"] = 12] = "snFor";
    eScriptNode[eScriptNode["snWhile"] = 13] = "snWhile";
    eScriptNode[eScriptNode["snReturn"] = 14] = "snReturn";
    eScriptNode[eScriptNode["snExpression"] = 15] = "snExpression";
    eScriptNode[eScriptNode["snExprTerm"] = 16] = "snExprTerm";
    eScriptNode[eScriptNode["snFunctionCall"] = 17] = "snFunctionCall";
    eScriptNode[eScriptNode["snConstructCall"] = 18] = "snConstructCall";
    eScriptNode[eScriptNode["snArgList"] = 19] = "snArgList";
    eScriptNode[eScriptNode["snExprPreOp"] = 20] = "snExprPreOp";
    eScriptNode[eScriptNode["snExprPostOp"] = 21] = "snExprPostOp";
    eScriptNode[eScriptNode["snExprOperator"] = 22] = "snExprOperator";
    eScriptNode[eScriptNode["snExprValue"] = 23] = "snExprValue";
    eScriptNode[eScriptNode["snBreak"] = 24] = "snBreak";
    eScriptNode[eScriptNode["snContinue"] = 25] = "snContinue";
    eScriptNode[eScriptNode["snDoWhile"] = 26] = "snDoWhile";
    eScriptNode[eScriptNode["snAssignment"] = 27] = "snAssignment";
    eScriptNode[eScriptNode["snCondition"] = 28] = "snCondition";
    eScriptNode[eScriptNode["snSwitch"] = 29] = "snSwitch";
    eScriptNode[eScriptNode["snCase"] = 30] = "snCase";
    eScriptNode[eScriptNode["snImport"] = 31] = "snImport";
    eScriptNode[eScriptNode["snClass"] = 32] = "snClass";
    eScriptNode[eScriptNode["snInitList"] = 33] = "snInitList";
    eScriptNode[eScriptNode["snInterface"] = 34] = "snInterface";
    eScriptNode[eScriptNode["snEnum"] = 35] = "snEnum";
    eScriptNode[eScriptNode["snTypedef"] = 36] = "snTypedef";
    eScriptNode[eScriptNode["snCast"] = 37] = "snCast";
    eScriptNode[eScriptNode["snVariableAccess"] = 38] = "snVariableAccess";
    eScriptNode[eScriptNode["snFuncDef"] = 39] = "snFuncDef";
    eScriptNode[eScriptNode["snVirtualProperty"] = 40] = "snVirtualProperty";
    eScriptNode[eScriptNode["snNamespace"] = 41] = "snNamespace";
    eScriptNode[eScriptNode["snMixin"] = 42] = "snMixin";
    eScriptNode[eScriptNode["snListPattern"] = 43] = "snListPattern";
    eScriptNode[eScriptNode["snNamedArgument"] = 44] = "snNamedArgument";
    eScriptNode[eScriptNode["snScope"] = 45] = "snScope";
    eScriptNode[eScriptNode["snTryCatch"] = 46] = "snTryCatch";
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