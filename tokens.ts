export enum eTokenType
{
    ttUnrecognizedToken,

    ttEnd,                 // End of file

    // White space and comments
    ttWhiteSpace,          // ' ', '\t', '\r', '\n', UTF8 byte-order-mark
    ttOnelineComment,      // // \n
    ttMultilineComment,    // /* */
    ttMacro,

    // Atoms
    ttIdentifier,                  // abc123
    ttIntConstant,                 // 1234
    ttFloatConstant,               // 12.34e56f
    ttDoubleConstant,              // 12.34e56
    ttStringConstant,              // "123"
    ttMultilineStringConstant,     //
    ttHeredocStringConstant,       // """text"""
    ttNonTerminatedStringConstant, // "123
    ttBitsConstant,                // 0xFFFF

    // Math operators
    ttPlus,                // +
    ttMinus,               // -
    ttStar,                // *
    ttSlash,               // /
    ttPercent,             // %
    ttStarStar,            // **

    ttHandle,              // @

    ttAddAssign,           // +=
    ttSubAssign,           // -=
    ttMulAssign,           // *=
    ttDivAssign,           // /=
    ttModAssign,           // %=
    ttPowAssign,           // **=

    ttOrAssign,            // |=
    ttAndAssign,           // &=
    ttXorAssign,           // ^=
    ttShiftLeftAssign,     // <<=
    ttShiftRightLAssign,   // >>=
    ttShiftRightAAssign,   // >>>=

    ttInc,                 // ++
    ttDec,                 // --

    ttDot,                 // .
    ttScope,               // ::

    // Statement tokens
    ttAssignment,          // =
    ttEndStatement,        // ;
    ttListSeparator,       // ,
    ttStartStatementBlock, // {
    ttEndStatementBlock,   // }
    ttOpenParanthesis,     // (
    ttCloseParanthesis,    // )
    ttOpenBracket,         // [
    ttCloseBracket,        // ]
    ttAmp,                 // &

    // Bitwise operators
    ttBitOr,               // |
    ttBitNot,              // ~
    ttBitXor,              // ^
    ttBitShiftLeft,        // <<
    ttBitShiftRight,       // >>     // TODO: In Java this is the arithmetical shift
    ttBitShiftRightArith,  // >>>    // TODO: In Java this is the logical shift

    // Compare operators
    ttEqual,               // ==
    ttNotEqual,            // !=
    ttLessThan,            // <
    ttGreaterThan,         // >
    ttLessThanOrEqual,     // <=
    ttGreaterThanOrEqual,  // >=

    ttQuestion,            // ?
    ttColon,               // :

    // Reserved keywords
    ttIf,                  // if
    ttElse,                // else
    ttFor,                 // for
    ttWhile,               // while
    ttBool,                // bool
    ttFuncDef,             // funcdef
    ttImport,              // import
    ttInt,                 // int
    ttInt8,                // int8
    ttInt16,               // int16
    ttInt64,               // int64
    ttInterface,           // interface
    ttIs,                  // is
    ttNotIs,               // !is
    ttUInt,                // uint
    ttUInt8,               // uint8
    ttUInt16,              // uint16
    ttUInt64,              // uint64
    ttFloat,               // float
    ttVoid,                // void
    ttTrue,                // true
    ttFalse,               // false
    ttReturn,              // return
    ttNot,                 // not
    ttAnd,                 // and, &&
    ttOr,                  // or, ||
    ttXor,                 // xor, ^^
    ttBreak,               // break
    ttContinue,            // continue
    ttConst,               // const
    ttDo,                  // do
    ttDouble,              // double
    ttSwitch,              // switch
    ttCase,                // case
    ttDefault,             // default
    ttIn,                  // in
    ttOut,                 // out
    ttInOut,               // inout
    ttNull,                // null
    ttClass,               // class
    ttTypedef,             // typedef
    ttEnum,                // enum
    ttCast,                // cast
    ttPrivate,             // private
    ttProtected,           // protected
    ttNamespace,           // namespace
    ttMixin,               // mixin
    ttAuto,                // auto
    ttTry,                 // try
    ttCatch                // catch
}

export enum asETokenClass
{
    asTC_UNKNOWN = 0,
    asTC_KEYWORD = 1,
    asTC_VALUE = 2,
    asTC_IDENTIFIER = 3,
    asTC_COMMENT = 4,
    asTC_WHITESPACE = 5
};

export interface Token
{
    type: eTokenType;
    pos: number;
    length: number;
    tokenClass: asETokenClass;
};

export function PrintToken(token: Token, source: string)
{
    console.log(source.substr(token.pos, token.length) + " " + eTokenType[token.type]);
}

export function CreateToken(type: eTokenType, pos: number, length: number, tokenClass: asETokenClass): Token
{
    return { type: type, pos: pos, length: length, tokenClass: tokenClass };
}

export interface TokenWord
{
    word: string;
    type: eTokenType;
};

function CreateTokenWord(word: string, type: eTokenType): TokenWord
{
    return { word: word, type: type };
}

export const whiteSpace = ' \t\r\n';
export const THIS_TOKEN = "this";
export const FROM_TOKEN = "from";
export const SUPER_TOKEN = "super";
export const SHARED_TOKEN = "shared";
export const FINAL_TOKEN = "final";
export const OVERRIDE_TOKEN = "override";
export const GET_TOKEN = "get";
export const SET_TOKEN = "set";
export const ABSTRACT_TOKEN = "abstract";
export const FUNCTION_TOKEN = "function";
export const IF_HANDLE_TOKEN = "if_handle_then_const";
export const EXTERNAL_TOKEN = "external";
export const EXPLICIT_TOKEN = "explicit";
export const PROPERTY_TOKEN = "property";

export const UNREAL_TOKENS = ["#", "UCLASS(", "USTRUCT(", "UPROPERTY(", "UFUNCTION(", "default ", "event ", "delegate "];

export const tokenWords: TokenWord[] =
    [
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
        CreateTokenWord("struct", eTokenType.ttClass),
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

