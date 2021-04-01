"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenWords = exports.UNREAL_TOKENS = exports.PROPERTY_TOKEN = exports.EXPLICIT_TOKEN = exports.EXTERNAL_TOKEN = exports.IF_HANDLE_TOKEN = exports.FUNCTION_TOKEN = exports.ABSTRACT_TOKEN = exports.SET_TOKEN = exports.GET_TOKEN = exports.OVERRIDE_TOKEN = exports.FINAL_TOKEN = exports.SHARED_TOKEN = exports.SUPER_TOKEN = exports.FROM_TOKEN = exports.THIS_TOKEN = exports.whiteSpace = exports.CreateToken = exports.PrintToken = exports.asETokenClass = exports.eTokenType = void 0;
var eTokenType;
(function (eTokenType) {
    eTokenType[eTokenType["ttUnrecognizedToken"] = 0] = "ttUnrecognizedToken";
    eTokenType[eTokenType["ttEnd"] = 1] = "ttEnd";
    // White space and comments
    eTokenType[eTokenType["ttWhiteSpace"] = 2] = "ttWhiteSpace";
    eTokenType[eTokenType["ttOnelineComment"] = 3] = "ttOnelineComment";
    eTokenType[eTokenType["ttMultilineComment"] = 4] = "ttMultilineComment";
    eTokenType[eTokenType["ttMacro"] = 5] = "ttMacro";
    // Atoms
    eTokenType[eTokenType["ttIdentifier"] = 6] = "ttIdentifier";
    eTokenType[eTokenType["ttIntConstant"] = 7] = "ttIntConstant";
    eTokenType[eTokenType["ttFloatConstant"] = 8] = "ttFloatConstant";
    eTokenType[eTokenType["ttDoubleConstant"] = 9] = "ttDoubleConstant";
    eTokenType[eTokenType["ttStringConstant"] = 10] = "ttStringConstant";
    eTokenType[eTokenType["ttMultilineStringConstant"] = 11] = "ttMultilineStringConstant";
    eTokenType[eTokenType["ttHeredocStringConstant"] = 12] = "ttHeredocStringConstant";
    eTokenType[eTokenType["ttNonTerminatedStringConstant"] = 13] = "ttNonTerminatedStringConstant";
    eTokenType[eTokenType["ttBitsConstant"] = 14] = "ttBitsConstant";
    // Math operators
    eTokenType[eTokenType["ttPlus"] = 15] = "ttPlus";
    eTokenType[eTokenType["ttMinus"] = 16] = "ttMinus";
    eTokenType[eTokenType["ttStar"] = 17] = "ttStar";
    eTokenType[eTokenType["ttSlash"] = 18] = "ttSlash";
    eTokenType[eTokenType["ttPercent"] = 19] = "ttPercent";
    eTokenType[eTokenType["ttStarStar"] = 20] = "ttStarStar";
    eTokenType[eTokenType["ttHandle"] = 21] = "ttHandle";
    eTokenType[eTokenType["ttAddAssign"] = 22] = "ttAddAssign";
    eTokenType[eTokenType["ttSubAssign"] = 23] = "ttSubAssign";
    eTokenType[eTokenType["ttMulAssign"] = 24] = "ttMulAssign";
    eTokenType[eTokenType["ttDivAssign"] = 25] = "ttDivAssign";
    eTokenType[eTokenType["ttModAssign"] = 26] = "ttModAssign";
    eTokenType[eTokenType["ttPowAssign"] = 27] = "ttPowAssign";
    eTokenType[eTokenType["ttOrAssign"] = 28] = "ttOrAssign";
    eTokenType[eTokenType["ttAndAssign"] = 29] = "ttAndAssign";
    eTokenType[eTokenType["ttXorAssign"] = 30] = "ttXorAssign";
    eTokenType[eTokenType["ttShiftLeftAssign"] = 31] = "ttShiftLeftAssign";
    eTokenType[eTokenType["ttShiftRightLAssign"] = 32] = "ttShiftRightLAssign";
    eTokenType[eTokenType["ttShiftRightAAssign"] = 33] = "ttShiftRightAAssign";
    eTokenType[eTokenType["ttInc"] = 34] = "ttInc";
    eTokenType[eTokenType["ttDec"] = 35] = "ttDec";
    eTokenType[eTokenType["ttDot"] = 36] = "ttDot";
    eTokenType[eTokenType["ttScope"] = 37] = "ttScope";
    // Statement tokens
    eTokenType[eTokenType["ttAssignment"] = 38] = "ttAssignment";
    eTokenType[eTokenType["ttEndStatement"] = 39] = "ttEndStatement";
    eTokenType[eTokenType["ttListSeparator"] = 40] = "ttListSeparator";
    eTokenType[eTokenType["ttStartStatementBlock"] = 41] = "ttStartStatementBlock";
    eTokenType[eTokenType["ttEndStatementBlock"] = 42] = "ttEndStatementBlock";
    eTokenType[eTokenType["ttOpenParanthesis"] = 43] = "ttOpenParanthesis";
    eTokenType[eTokenType["ttCloseParanthesis"] = 44] = "ttCloseParanthesis";
    eTokenType[eTokenType["ttOpenBracket"] = 45] = "ttOpenBracket";
    eTokenType[eTokenType["ttCloseBracket"] = 46] = "ttCloseBracket";
    eTokenType[eTokenType["ttAmp"] = 47] = "ttAmp";
    // Bitwise operators
    eTokenType[eTokenType["ttBitOr"] = 48] = "ttBitOr";
    eTokenType[eTokenType["ttBitNot"] = 49] = "ttBitNot";
    eTokenType[eTokenType["ttBitXor"] = 50] = "ttBitXor";
    eTokenType[eTokenType["ttBitShiftLeft"] = 51] = "ttBitShiftLeft";
    eTokenType[eTokenType["ttBitShiftRight"] = 52] = "ttBitShiftRight";
    eTokenType[eTokenType["ttBitShiftRightArith"] = 53] = "ttBitShiftRightArith";
    // Compare operators
    eTokenType[eTokenType["ttEqual"] = 54] = "ttEqual";
    eTokenType[eTokenType["ttNotEqual"] = 55] = "ttNotEqual";
    eTokenType[eTokenType["ttLessThan"] = 56] = "ttLessThan";
    eTokenType[eTokenType["ttGreaterThan"] = 57] = "ttGreaterThan";
    eTokenType[eTokenType["ttLessThanOrEqual"] = 58] = "ttLessThanOrEqual";
    eTokenType[eTokenType["ttGreaterThanOrEqual"] = 59] = "ttGreaterThanOrEqual";
    eTokenType[eTokenType["ttQuestion"] = 60] = "ttQuestion";
    eTokenType[eTokenType["ttColon"] = 61] = "ttColon";
    // Reserved keywords
    eTokenType[eTokenType["ttIf"] = 62] = "ttIf";
    eTokenType[eTokenType["ttElse"] = 63] = "ttElse";
    eTokenType[eTokenType["ttFor"] = 64] = "ttFor";
    eTokenType[eTokenType["ttWhile"] = 65] = "ttWhile";
    eTokenType[eTokenType["ttBool"] = 66] = "ttBool";
    eTokenType[eTokenType["ttFuncDef"] = 67] = "ttFuncDef";
    eTokenType[eTokenType["ttImport"] = 68] = "ttImport";
    eTokenType[eTokenType["ttInt"] = 69] = "ttInt";
    eTokenType[eTokenType["ttInt8"] = 70] = "ttInt8";
    eTokenType[eTokenType["ttInt16"] = 71] = "ttInt16";
    eTokenType[eTokenType["ttInt64"] = 72] = "ttInt64";
    eTokenType[eTokenType["ttInterface"] = 73] = "ttInterface";
    eTokenType[eTokenType["ttIs"] = 74] = "ttIs";
    eTokenType[eTokenType["ttNotIs"] = 75] = "ttNotIs";
    eTokenType[eTokenType["ttUInt"] = 76] = "ttUInt";
    eTokenType[eTokenType["ttUInt8"] = 77] = "ttUInt8";
    eTokenType[eTokenType["ttUInt16"] = 78] = "ttUInt16";
    eTokenType[eTokenType["ttUInt64"] = 79] = "ttUInt64";
    eTokenType[eTokenType["ttFloat"] = 80] = "ttFloat";
    eTokenType[eTokenType["ttVoid"] = 81] = "ttVoid";
    eTokenType[eTokenType["ttTrue"] = 82] = "ttTrue";
    eTokenType[eTokenType["ttFalse"] = 83] = "ttFalse";
    eTokenType[eTokenType["ttReturn"] = 84] = "ttReturn";
    eTokenType[eTokenType["ttNot"] = 85] = "ttNot";
    eTokenType[eTokenType["ttAnd"] = 86] = "ttAnd";
    eTokenType[eTokenType["ttOr"] = 87] = "ttOr";
    eTokenType[eTokenType["ttXor"] = 88] = "ttXor";
    eTokenType[eTokenType["ttBreak"] = 89] = "ttBreak";
    eTokenType[eTokenType["ttContinue"] = 90] = "ttContinue";
    eTokenType[eTokenType["ttConst"] = 91] = "ttConst";
    eTokenType[eTokenType["ttDo"] = 92] = "ttDo";
    eTokenType[eTokenType["ttDouble"] = 93] = "ttDouble";
    eTokenType[eTokenType["ttSwitch"] = 94] = "ttSwitch";
    eTokenType[eTokenType["ttCase"] = 95] = "ttCase";
    eTokenType[eTokenType["ttDefault"] = 96] = "ttDefault";
    eTokenType[eTokenType["ttIn"] = 97] = "ttIn";
    eTokenType[eTokenType["ttOut"] = 98] = "ttOut";
    eTokenType[eTokenType["ttInOut"] = 99] = "ttInOut";
    eTokenType[eTokenType["ttNull"] = 100] = "ttNull";
    eTokenType[eTokenType["ttClass"] = 101] = "ttClass";
    eTokenType[eTokenType["ttTypedef"] = 102] = "ttTypedef";
    eTokenType[eTokenType["ttEnum"] = 103] = "ttEnum";
    eTokenType[eTokenType["ttCast"] = 104] = "ttCast";
    eTokenType[eTokenType["ttPrivate"] = 105] = "ttPrivate";
    eTokenType[eTokenType["ttProtected"] = 106] = "ttProtected";
    eTokenType[eTokenType["ttNamespace"] = 107] = "ttNamespace";
    eTokenType[eTokenType["ttMixin"] = 108] = "ttMixin";
    eTokenType[eTokenType["ttAuto"] = 109] = "ttAuto";
    eTokenType[eTokenType["ttTry"] = 110] = "ttTry";
    eTokenType[eTokenType["ttCatch"] = 111] = "ttCatch"; // catch
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
function PrintToken(token, source) {
    console.log(source.substr(token.pos, token.length) + " " + eTokenType[token.type]);
}
exports.PrintToken = PrintToken;
function CreateToken(type, pos, length, tokenClass) {
    return { type: type, pos: pos, length: length, tokenClass: tokenClass };
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
exports.UNREAL_TOKENS = ["#", "UCLASS(", "USTRUCT(", "UPROPERTY(", "UFUNCTION(", "default ", "event ", "delegate "];
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