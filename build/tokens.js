"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenWords = exports.PROPERTY_TOKEN = exports.EXPLICIT_TOKEN = exports.EXTERNAL_TOKEN = exports.IF_HANDLE_TOKEN = exports.FUNCTION_TOKEN = exports.ABSTRACT_TOKEN = exports.SET_TOKEN = exports.GET_TOKEN = exports.OVERRIDE_TOKEN = exports.FINAL_TOKEN = exports.SHARED_TOKEN = exports.SUPER_TOKEN = exports.FROM_TOKEN = exports.THIS_TOKEN = exports.whiteSpace = exports.CreateToken = exports.asETokenClass = exports.eTokenType = void 0;
var eTokenType;
(function (eTokenType) {
    eTokenType[eTokenType["ttUnrecognizedToken"] = 0] = "ttUnrecognizedToken";
    eTokenType[eTokenType["ttEnd"] = 1] = "ttEnd";
    // White space and comments
    eTokenType[eTokenType["ttWhiteSpace"] = 2] = "ttWhiteSpace";
    eTokenType[eTokenType["ttOnelineComment"] = 3] = "ttOnelineComment";
    eTokenType[eTokenType["ttMultilineComment"] = 4] = "ttMultilineComment";
    // Atoms
    eTokenType[eTokenType["ttIdentifier"] = 5] = "ttIdentifier";
    eTokenType[eTokenType["ttIntConstant"] = 6] = "ttIntConstant";
    eTokenType[eTokenType["ttFloatConstant"] = 7] = "ttFloatConstant";
    eTokenType[eTokenType["ttDoubleConstant"] = 8] = "ttDoubleConstant";
    eTokenType[eTokenType["ttStringConstant"] = 9] = "ttStringConstant";
    eTokenType[eTokenType["ttMultilineStringConstant"] = 10] = "ttMultilineStringConstant";
    eTokenType[eTokenType["ttHeredocStringConstant"] = 11] = "ttHeredocStringConstant";
    eTokenType[eTokenType["ttNonTerminatedStringConstant"] = 12] = "ttNonTerminatedStringConstant";
    eTokenType[eTokenType["ttBitsConstant"] = 13] = "ttBitsConstant";
    // Math operators
    eTokenType[eTokenType["ttPlus"] = 14] = "ttPlus";
    eTokenType[eTokenType["ttMinus"] = 15] = "ttMinus";
    eTokenType[eTokenType["ttStar"] = 16] = "ttStar";
    eTokenType[eTokenType["ttSlash"] = 17] = "ttSlash";
    eTokenType[eTokenType["ttPercent"] = 18] = "ttPercent";
    eTokenType[eTokenType["ttStarStar"] = 19] = "ttStarStar";
    eTokenType[eTokenType["ttHandle"] = 20] = "ttHandle";
    eTokenType[eTokenType["ttAddAssign"] = 21] = "ttAddAssign";
    eTokenType[eTokenType["ttSubAssign"] = 22] = "ttSubAssign";
    eTokenType[eTokenType["ttMulAssign"] = 23] = "ttMulAssign";
    eTokenType[eTokenType["ttDivAssign"] = 24] = "ttDivAssign";
    eTokenType[eTokenType["ttModAssign"] = 25] = "ttModAssign";
    eTokenType[eTokenType["ttPowAssign"] = 26] = "ttPowAssign";
    eTokenType[eTokenType["ttOrAssign"] = 27] = "ttOrAssign";
    eTokenType[eTokenType["ttAndAssign"] = 28] = "ttAndAssign";
    eTokenType[eTokenType["ttXorAssign"] = 29] = "ttXorAssign";
    eTokenType[eTokenType["ttShiftLeftAssign"] = 30] = "ttShiftLeftAssign";
    eTokenType[eTokenType["ttShiftRightLAssign"] = 31] = "ttShiftRightLAssign";
    eTokenType[eTokenType["ttShiftRightAAssign"] = 32] = "ttShiftRightAAssign";
    eTokenType[eTokenType["ttInc"] = 33] = "ttInc";
    eTokenType[eTokenType["ttDec"] = 34] = "ttDec";
    eTokenType[eTokenType["ttDot"] = 35] = "ttDot";
    eTokenType[eTokenType["ttScope"] = 36] = "ttScope";
    // Statement tokens
    eTokenType[eTokenType["ttAssignment"] = 37] = "ttAssignment";
    eTokenType[eTokenType["ttEndStatement"] = 38] = "ttEndStatement";
    eTokenType[eTokenType["ttListSeparator"] = 39] = "ttListSeparator";
    eTokenType[eTokenType["ttStartStatementBlock"] = 40] = "ttStartStatementBlock";
    eTokenType[eTokenType["ttEndStatementBlock"] = 41] = "ttEndStatementBlock";
    eTokenType[eTokenType["ttOpenParanthesis"] = 42] = "ttOpenParanthesis";
    eTokenType[eTokenType["ttCloseParanthesis"] = 43] = "ttCloseParanthesis";
    eTokenType[eTokenType["ttOpenBracket"] = 44] = "ttOpenBracket";
    eTokenType[eTokenType["ttCloseBracket"] = 45] = "ttCloseBracket";
    eTokenType[eTokenType["ttAmp"] = 46] = "ttAmp";
    // Bitwise operators
    eTokenType[eTokenType["ttBitOr"] = 47] = "ttBitOr";
    eTokenType[eTokenType["ttBitNot"] = 48] = "ttBitNot";
    eTokenType[eTokenType["ttBitXor"] = 49] = "ttBitXor";
    eTokenType[eTokenType["ttBitShiftLeft"] = 50] = "ttBitShiftLeft";
    eTokenType[eTokenType["ttBitShiftRight"] = 51] = "ttBitShiftRight";
    eTokenType[eTokenType["ttBitShiftRightArith"] = 52] = "ttBitShiftRightArith";
    // Compare operators
    eTokenType[eTokenType["ttEqual"] = 53] = "ttEqual";
    eTokenType[eTokenType["ttNotEqual"] = 54] = "ttNotEqual";
    eTokenType[eTokenType["ttLessThan"] = 55] = "ttLessThan";
    eTokenType[eTokenType["ttGreaterThan"] = 56] = "ttGreaterThan";
    eTokenType[eTokenType["ttLessThanOrEqual"] = 57] = "ttLessThanOrEqual";
    eTokenType[eTokenType["ttGreaterThanOrEqual"] = 58] = "ttGreaterThanOrEqual";
    eTokenType[eTokenType["ttQuestion"] = 59] = "ttQuestion";
    eTokenType[eTokenType["ttColon"] = 60] = "ttColon";
    // Reserved keywords
    eTokenType[eTokenType["ttIf"] = 61] = "ttIf";
    eTokenType[eTokenType["ttElse"] = 62] = "ttElse";
    eTokenType[eTokenType["ttFor"] = 63] = "ttFor";
    eTokenType[eTokenType["ttWhile"] = 64] = "ttWhile";
    eTokenType[eTokenType["ttBool"] = 65] = "ttBool";
    eTokenType[eTokenType["ttFuncDef"] = 66] = "ttFuncDef";
    eTokenType[eTokenType["ttImport"] = 67] = "ttImport";
    eTokenType[eTokenType["ttInt"] = 68] = "ttInt";
    eTokenType[eTokenType["ttInt8"] = 69] = "ttInt8";
    eTokenType[eTokenType["ttInt16"] = 70] = "ttInt16";
    eTokenType[eTokenType["ttInt64"] = 71] = "ttInt64";
    eTokenType[eTokenType["ttInterface"] = 72] = "ttInterface";
    eTokenType[eTokenType["ttIs"] = 73] = "ttIs";
    eTokenType[eTokenType["ttNotIs"] = 74] = "ttNotIs";
    eTokenType[eTokenType["ttUInt"] = 75] = "ttUInt";
    eTokenType[eTokenType["ttUInt8"] = 76] = "ttUInt8";
    eTokenType[eTokenType["ttUInt16"] = 77] = "ttUInt16";
    eTokenType[eTokenType["ttUInt64"] = 78] = "ttUInt64";
    eTokenType[eTokenType["ttFloat"] = 79] = "ttFloat";
    eTokenType[eTokenType["ttVoid"] = 80] = "ttVoid";
    eTokenType[eTokenType["ttTrue"] = 81] = "ttTrue";
    eTokenType[eTokenType["ttFalse"] = 82] = "ttFalse";
    eTokenType[eTokenType["ttReturn"] = 83] = "ttReturn";
    eTokenType[eTokenType["ttNot"] = 84] = "ttNot";
    eTokenType[eTokenType["ttAnd"] = 85] = "ttAnd";
    eTokenType[eTokenType["ttOr"] = 86] = "ttOr";
    eTokenType[eTokenType["ttXor"] = 87] = "ttXor";
    eTokenType[eTokenType["ttBreak"] = 88] = "ttBreak";
    eTokenType[eTokenType["ttContinue"] = 89] = "ttContinue";
    eTokenType[eTokenType["ttConst"] = 90] = "ttConst";
    eTokenType[eTokenType["ttDo"] = 91] = "ttDo";
    eTokenType[eTokenType["ttDouble"] = 92] = "ttDouble";
    eTokenType[eTokenType["ttSwitch"] = 93] = "ttSwitch";
    eTokenType[eTokenType["ttCase"] = 94] = "ttCase";
    eTokenType[eTokenType["ttDefault"] = 95] = "ttDefault";
    eTokenType[eTokenType["ttIn"] = 96] = "ttIn";
    eTokenType[eTokenType["ttOut"] = 97] = "ttOut";
    eTokenType[eTokenType["ttInOut"] = 98] = "ttInOut";
    eTokenType[eTokenType["ttNull"] = 99] = "ttNull";
    eTokenType[eTokenType["ttClass"] = 100] = "ttClass";
    eTokenType[eTokenType["ttTypedef"] = 101] = "ttTypedef";
    eTokenType[eTokenType["ttEnum"] = 102] = "ttEnum";
    eTokenType[eTokenType["ttCast"] = 103] = "ttCast";
    eTokenType[eTokenType["ttPrivate"] = 104] = "ttPrivate";
    eTokenType[eTokenType["ttProtected"] = 105] = "ttProtected";
    eTokenType[eTokenType["ttNamespace"] = 106] = "ttNamespace";
    eTokenType[eTokenType["ttMixin"] = 107] = "ttMixin";
    eTokenType[eTokenType["ttAuto"] = 108] = "ttAuto";
    eTokenType[eTokenType["ttTry"] = 109] = "ttTry";
    eTokenType[eTokenType["ttCatch"] = 110] = "ttCatch"; // catch
})(eTokenType = exports.eTokenType || (exports.eTokenType = {}));
var asETokenClass;
(function (asETokenClass) {
    asETokenClass[asETokenClass["asTC_UNKNOWN"] = 0] = "asTC_UNKNOWN";
    asETokenClass[asETokenClass["asTC_KEYWORD"] = 1] = "asTC_KEYWORD";
    asETokenClass[asETokenClass["asTC_VALUE"] = 2] = "asTC_VALUE";
    asETokenClass[asETokenClass["asTC_IDENTIFIER"] = 3] = "asTC_IDENTIFIER";
    asETokenClass[asETokenClass["asTC_COMMENT"] = 4] = "asTC_COMMENT";
    asETokenClass[asETokenClass["asTC_WHITESPACE"] = 5] = "asTC_WHITESPACE";
})(asETokenClass = exports.asETokenClass || (exports.asETokenClass = {}));
;
;
function CreateToken(type, pos, length) {
    return { type: type, pos: pos, length: length };
}
exports.CreateToken = CreateToken;
;
function CreateTokenWord(word, type) {
    return { word: word, type: type };
}
exports.whiteSpace = ' \t\r\n';
exports.THIS_TOKEN = "this";
exports.FROM_TOKEN = "from";
exports.SUPER_TOKEN = "super";
exports.SHARED_TOKEN = "shared";
exports.FINAL_TOKEN = "final";
exports.OVERRIDE_TOKEN = "override";
exports.GET_TOKEN = "get";
exports.SET_TOKEN = "set";
exports.ABSTRACT_TOKEN = "abstract";
exports.FUNCTION_TOKEN = "function";
exports.IF_HANDLE_TOKEN = "if_handle_then_const";
exports.EXTERNAL_TOKEN = "external";
exports.EXPLICIT_TOKEN = "explicit";
exports.PROPERTY_TOKEN = "property";
exports.tokenWords = [
    CreateTokenWord("+", eTokenType.ttPlus),
    CreateTokenWord("+", eTokenType.ttPlus),
    CreateTokenWord("+=", eTokenType.ttAddAssign),
    CreateTokenWord("++", eTokenType.ttInc),
    CreateTokenWord("-", eTokenType.ttMinus),
    CreateTokenWord("-=", eTokenType.ttSubAssign),
    CreateTokenWord("--", eTokenType.ttDec),
    CreateTokenWord("*", eTokenType.ttStar),
    CreateTokenWord("*=", eTokenType.ttMulAssign),
    CreateTokenWord("/", eTokenType.ttSlash),
    CreateTokenWord("/=", eTokenType.ttDivAssign),
    CreateTokenWord("%", eTokenType.ttPercent),
    CreateTokenWord("%=", eTokenType.ttModAssign),
    CreateTokenWord("**", eTokenType.ttStarStar),
    CreateTokenWord("**=", eTokenType.ttPowAssign),
    CreateTokenWord("=", eTokenType.ttAssignment),
    CreateTokenWord("==", eTokenType.ttEqual),
    CreateTokenWord(".", eTokenType.ttDot),
    CreateTokenWord("|", eTokenType.ttBitOr),
    CreateTokenWord("|=", eTokenType.ttOrAssign),
    CreateTokenWord("||", eTokenType.ttOr),
    CreateTokenWord("&", eTokenType.ttAmp),
    CreateTokenWord("&=", eTokenType.ttAndAssign),
    CreateTokenWord("&&", eTokenType.ttAnd),
    CreateTokenWord("^", eTokenType.ttBitXor),
    CreateTokenWord("^=", eTokenType.ttXorAssign),
    CreateTokenWord("^^", eTokenType.ttXor),
    CreateTokenWord("<", eTokenType.ttLessThan),
    CreateTokenWord("<=", eTokenType.ttLessThanOrEqual),
    CreateTokenWord("<<", eTokenType.ttBitShiftLeft),
    CreateTokenWord("<<=", eTokenType.ttShiftLeftAssign),
    CreateTokenWord(">", eTokenType.ttGreaterThan),
    CreateTokenWord(">=", eTokenType.ttGreaterThanOrEqual),
    CreateTokenWord(">>", eTokenType.ttBitShiftRight),
    CreateTokenWord(">>=", eTokenType.ttShiftRightLAssign),
    CreateTokenWord(">>>", eTokenType.ttBitShiftRightArith),
    CreateTokenWord(">>>=", eTokenType.ttShiftRightAAssign),
    CreateTokenWord("~", eTokenType.ttBitNot),
    CreateTokenWord(";", eTokenType.ttEndStatement),
    CreateTokenWord(",", eTokenType.ttListSeparator),
    CreateTokenWord("{", eTokenType.ttStartStatementBlock),
    CreateTokenWord("}", eTokenType.ttEndStatementBlock),
    CreateTokenWord("(", eTokenType.ttOpenParanthesis),
    CreateTokenWord(")", eTokenType.ttCloseParanthesis),
    CreateTokenWord("[", eTokenType.ttOpenBracket),
    CreateTokenWord("]", eTokenType.ttCloseBracket),
    CreateTokenWord("?", eTokenType.ttQuestion),
    CreateTokenWord(":", eTokenType.ttColon),
    CreateTokenWord("::", eTokenType.ttScope),
    CreateTokenWord("!", eTokenType.ttNot),
    CreateTokenWord("!=", eTokenType.ttNotEqual),
    CreateTokenWord("!is", eTokenType.ttNotIs),
    CreateTokenWord("@", eTokenType.ttHandle),
    CreateTokenWord("and", eTokenType.ttAnd),
    CreateTokenWord("auto", eTokenType.ttAuto),
    CreateTokenWord("bool", eTokenType.ttBool),
    CreateTokenWord("break", eTokenType.ttBreak),
    CreateTokenWord("case", eTokenType.ttCase),
    CreateTokenWord("cast", eTokenType.ttCast),
    CreateTokenWord("catch", eTokenType.ttCatch),
    CreateTokenWord("class", eTokenType.ttClass),
    CreateTokenWord("const", eTokenType.ttConst),
    CreateTokenWord("continue", eTokenType.ttContinue),
    CreateTokenWord("default", eTokenType.ttDefault),
    CreateTokenWord("do", eTokenType.ttDo),
    CreateTokenWord("double", eTokenType.ttFloat),
    CreateTokenWord("double", eTokenType.ttDouble),
    CreateTokenWord("else", eTokenType.ttElse),
    CreateTokenWord("enum", eTokenType.ttEnum),
    CreateTokenWord("false", eTokenType.ttFalse),
    CreateTokenWord("float", eTokenType.ttFloat),
    CreateTokenWord("for", eTokenType.ttFor),
    CreateTokenWord("funcdef", eTokenType.ttFuncDef),
    CreateTokenWord("if", eTokenType.ttIf),
    CreateTokenWord("import", eTokenType.ttImport),
    CreateTokenWord("in", eTokenType.ttIn),
    CreateTokenWord("inout", eTokenType.ttInOut),
    CreateTokenWord("int", eTokenType.ttInt),
    CreateTokenWord("int8", eTokenType.ttInt8),
    CreateTokenWord("int16", eTokenType.ttInt16),
    CreateTokenWord("int32", eTokenType.ttInt),
    CreateTokenWord("int64", eTokenType.ttInt64),
    CreateTokenWord("interface", eTokenType.ttInterface),
    CreateTokenWord("is", eTokenType.ttIs),
    CreateTokenWord("mixin", eTokenType.ttMixin),
    CreateTokenWord("namespace", eTokenType.ttNamespace),
    CreateTokenWord("not", eTokenType.ttNot),
    CreateTokenWord("null", eTokenType.ttNull),
    CreateTokenWord("or", eTokenType.ttOr),
    CreateTokenWord("out", eTokenType.ttOut),
    CreateTokenWord("private", eTokenType.ttPrivate),
    CreateTokenWord("protected", eTokenType.ttProtected),
    CreateTokenWord("return", eTokenType.ttReturn),
    CreateTokenWord("switch", eTokenType.ttSwitch),
    CreateTokenWord("true", eTokenType.ttTrue),
    CreateTokenWord("try", eTokenType.ttTry),
    CreateTokenWord("typedef", eTokenType.ttTypedef),
    CreateTokenWord("uint", eTokenType.ttUInt),
    CreateTokenWord("uint8", eTokenType.ttUInt8),
    CreateTokenWord("uint16", eTokenType.ttUInt16),
    CreateTokenWord("uint32", eTokenType.ttUInt),
    CreateTokenWord("uint64", eTokenType.ttUInt64),
    CreateTokenWord("void", eTokenType.ttVoid),
    CreateTokenWord("while", eTokenType.ttWhile),
    CreateTokenWord("xor", eTokenType.ttXor),
];
//# sourceMappingURL=tokens.js.map