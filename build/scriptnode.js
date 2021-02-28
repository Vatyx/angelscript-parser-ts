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
    eScriptNode[eScriptNode["snDataType"] = 4] = "snDataType";
    eScriptNode[eScriptNode["snIdentifier"] = 5] = "snIdentifier";
    eScriptNode[eScriptNode["snParameterList"] = 6] = "snParameterList";
    eScriptNode[eScriptNode["snStatementBlock"] = 7] = "snStatementBlock";
    eScriptNode[eScriptNode["snDeclaration"] = 8] = "snDeclaration";
    eScriptNode[eScriptNode["snExpressionStatement"] = 9] = "snExpressionStatement";
    eScriptNode[eScriptNode["snIf"] = 10] = "snIf";
    eScriptNode[eScriptNode["snFor"] = 11] = "snFor";
    eScriptNode[eScriptNode["snWhile"] = 12] = "snWhile";
    eScriptNode[eScriptNode["snReturn"] = 13] = "snReturn";
    eScriptNode[eScriptNode["snExpression"] = 14] = "snExpression";
    eScriptNode[eScriptNode["snExprTerm"] = 15] = "snExprTerm";
    eScriptNode[eScriptNode["snFunctionCall"] = 16] = "snFunctionCall";
    eScriptNode[eScriptNode["snConstructCall"] = 17] = "snConstructCall";
    eScriptNode[eScriptNode["snArgList"] = 18] = "snArgList";
    eScriptNode[eScriptNode["snExprPreOp"] = 19] = "snExprPreOp";
    eScriptNode[eScriptNode["snExprPostOp"] = 20] = "snExprPostOp";
    eScriptNode[eScriptNode["snExprOperator"] = 21] = "snExprOperator";
    eScriptNode[eScriptNode["snExprValue"] = 22] = "snExprValue";
    eScriptNode[eScriptNode["snBreak"] = 23] = "snBreak";
    eScriptNode[eScriptNode["snContinue"] = 24] = "snContinue";
    eScriptNode[eScriptNode["snDoWhile"] = 25] = "snDoWhile";
    eScriptNode[eScriptNode["snAssignment"] = 26] = "snAssignment";
    eScriptNode[eScriptNode["snCondition"] = 27] = "snCondition";
    eScriptNode[eScriptNode["snSwitch"] = 28] = "snSwitch";
    eScriptNode[eScriptNode["snCase"] = 29] = "snCase";
    eScriptNode[eScriptNode["snImport"] = 30] = "snImport";
    eScriptNode[eScriptNode["snClass"] = 31] = "snClass";
    eScriptNode[eScriptNode["snInitList"] = 32] = "snInitList";
    eScriptNode[eScriptNode["snInterface"] = 33] = "snInterface";
    eScriptNode[eScriptNode["snEnum"] = 34] = "snEnum";
    eScriptNode[eScriptNode["snTypedef"] = 35] = "snTypedef";
    eScriptNode[eScriptNode["snCast"] = 36] = "snCast";
    eScriptNode[eScriptNode["snVariableAccess"] = 37] = "snVariableAccess";
    eScriptNode[eScriptNode["snFuncDef"] = 38] = "snFuncDef";
    eScriptNode[eScriptNode["snVirtualProperty"] = 39] = "snVirtualProperty";
    eScriptNode[eScriptNode["snNamespace"] = 40] = "snNamespace";
    eScriptNode[eScriptNode["snMixin"] = 41] = "snMixin";
    eScriptNode[eScriptNode["snListPattern"] = 42] = "snListPattern";
    eScriptNode[eScriptNode["snNamedArgument"] = 43] = "snNamedArgument";
    eScriptNode[eScriptNode["snScope"] = 44] = "snScope";
    eScriptNode[eScriptNode["snTryCatch"] = 45] = "snTryCatch";
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
    }
    SetToken(token) {
        this.tokenType = token.type;
    }
    dateSourcePos(pos, length) {
        // if (pos == 0 && length == 0) return;
        // if (tokenPos == 0 && tokenLength == 0)
        // {
        //     tokenPos = pos;
        //     tokenLength = length;
        // }
        // else
        // {
        //     if (tokenPos > pos)
        //     {
        //         tokenLength = tokenPos + tokenLength - pos;
        //         tokenPos = pos;
        //     }
        //     if (pos + length > tokenPos + tokenLength)
        //     {
        //         tokenLength = pos + length - tokenPos;
        //     }
        // }
    }
}
exports.ScriptNode = ScriptNode;
;
//# sourceMappingURL=scriptnode.js.map