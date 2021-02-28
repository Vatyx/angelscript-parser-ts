"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tokenizer = exports.IntermediateSource = void 0;
const tokens_1 = require("./tokens");
class IntermediateSource {
    constructor(source) {
        this.source = source;
        this.start = 0;
        this.length = source.length;
    }
    Get(index) {
        return this.source[this.start + index];
    }
    UpdateStart(amount) {
        this.start += amount;
        this.length -= amount;
    }
}
exports.IntermediateSource = IntermediateSource;
class Tokenizer {
    constructor() {
        this.keywordTable = {};
        tokens_1.tokenWords.forEach(element => {
            if (this.keywordTable[element.word[0]] == undefined) {
                this.keywordTable[element.word[0]] = [];
            }
            this.keywordTable[element.word[0]].push(element);
        });
    }
    GetToken(source) {
        let token = this.IsWhitespace(source);
        if (token != null) {
            return [token, tokens_1.asETokenClass.asTC_WHITESPACE];
        }
        token = this.IsComment(source);
        if (token != null) {
            return [token, tokens_1.asETokenClass.asTC_COMMENT];
        }
        token = this.IsConstant(source);
        if (token != null) {
            return [token, tokens_1.asETokenClass.asTC_VALUE];
        }
        token = this.IsKeyword(source);
        if (token != null) {
            return [token, tokens_1.asETokenClass.asTC_KEYWORD];
        }
        token = this.IsIdentifier(source);
        if (token != null) {
            return [token, tokens_1.asETokenClass.asTC_IDENTIFIER];
        }
        return [tokens_1.CreateToken(tokens_1.eTokenType.ttUnrecognizedToken, source.start, 1), tokens_1.asETokenClass.asTC_UNKNOWN];
    }
    IsWhitespace(source) {
        let i;
        for (i = 0; i < source.length; i++) {
            let char = source.Get(i);
            if (!tokens_1.whiteSpace.includes(char)) {
                break;
            }
        }
        if (i > 0) {
            return tokens_1.CreateToken(tokens_1.eTokenType.ttWhiteSpace, source.start, i);
        }
        return null;
    }
    IsComment(source) {
        if (source.length < 2)
            return null;
        if (source.Get(0) != '/')
            return null;
        if (source.Get(1) == '/') {
            // One-line comment
            // Find the length
            let n;
            for (n = 2; n < source.length; n++) {
                if (source.Get(n) == '\n')
                    break;
            }
            let tokenLength = n < source.length ? n + 1 : n;
            return tokens_1.CreateToken(tokens_1.eTokenType.ttOnelineComment, source.start, tokenLength);
        }
        if (source.Get(1) == '*') {
            // Multi-line comment
            // Find the length
            let n;
            for (n = 2; n < source.length - 1;) {
                if (source.Get(n++) == '*' && source.Get(n) == '/')
                    break;
            }
            let tokenLength = n + 1;
            return tokens_1.CreateToken(tokens_1.eTokenType.ttMultilineComment, source.start, tokenLength);
        }
        return null;
    }
    IsIdentifier(source) {
        // char is unsigned by default on some architectures, e.g. ppc and arm
        // Make sure the value is always treated as signed in the below comparisons
        let c = source.Get(0);
        // Starting with letter or underscore
        if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c == '_') {
            // tokenType   = ttIdentifier;
            let tokenLength = 1;
            for (let i = 1; i < source.length; i++) {
                c = source.Get(i);
                if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c == '_')
                    tokenLength++;
                else
                    break;
            }
            return tokens_1.CreateToken(tokens_1.eTokenType.ttIdentifier, source.start, tokenLength);
        }
        return null;
    }
    IsKeyword(source) {
        let c = source.Get(0);
        // Get all the keywords starting with this character.
        let tokenWords = this.keywordTable[c];
        for (let i = 0; i < tokenWords.length; i++) {
            let keyword = tokenWords[i].word;
            if (source.length >= keyword.length) {
                let matched = true;
                // Check to see if all the characters match
                for (let j = 1; j < keyword.length; j++) {
                    if (keyword[j] != source.Get(j)) {
                        matched = false;
                    }
                }
                if (matched) {
                    if (keyword.length < source.length &&
                        ((source.Get(keyword.length - 1) >= 'a' && source.Get(keyword.length - 1) <= 'z') ||
                            (source.Get(keyword.length - 1) >= 'A' && source.Get(keyword.length - 1) <= 'Z') ||
                            (source.Get(keyword.length - 1) >= '0' && source.Get(keyword.length - 1) <= '9')) &&
                        ((source.Get(keyword.length) >= 'a' && source.Get(keyword.length) <= 'z') ||
                            (source.Get(keyword.length) >= 'A' && source.Get(keyword.length) <= 'Z') ||
                            (source.Get(keyword.length) >= '0' && source.Get(keyword.length) <= '9') ||
                            (source.Get(keyword.length) == '_'))) {
                        // The token doesn't really match, even though 
                        // the start of the source matches the token
                        continue;
                    }
                    return tokens_1.CreateToken(tokenWords[i].type, source.start, keyword.length);
                }
            }
        }
        return null;
    }
    IsConstant(source) {
        // Starting with number
        if ((source.Get(0) >= '0' && source.Get(0) <= '9') || (source.Get(0) == '.' && source.length > 1 && source.Get(1) >= '0' && source.Get(1) <= '9')) {
            // Is it a based number?
            if (source.Get(0) == '0' && source.length > 1) {
                // Determine the radix for the constant
                let radix = 0;
                switch (source.Get(1)) {
                    case 'b':
                    case 'B':
                        radix = 2;
                        break;
                    case 'o':
                    case 'O':
                        radix = 8;
                        break;
                    case 'd':
                    case 'D':
                        radix = 10;
                        break;
                    case 'x':
                    case 'X':
                        radix = 16;
                        break;
                }
                if (radix > 0) {
                    let n;
                    for (n = 2; n < source.length; n++) {
                        if (!this.IsDigitInRadix(source.Get(n), radix)) {
                            break;
                        }
                    }
                    return tokens_1.CreateToken(tokens_1.eTokenType.ttBitsConstant, source.start, n);
                }
            }
            let n;
            for (n = 0; n < source.length; n++) {
                if (source.Get(n) < '0' || source.Get(n) > '9')
                    break;
            }
            if (n < source.length && (source.Get(n) == '.' || source.Get(n) == 'e' || source.Get(n) == 'E')) {
                if (source.Get(n) == '.') {
                    n++;
                    for (; n < source.length; n++) {
                        if (source.Get(n) < '0' || source.Get(n) > '9')
                            break;
                    }
                }
                if (n < source.length && (source.Get(n) == 'e' || source.Get(n) == 'E')) {
                    n++;
                    if (n < source.length && (source.Get(n) == '-' || source.Get(n) == '+'))
                        n++;
                    for (; n < source.length; n++) {
                        if (source.Get(n) < '0' || source.Get(n) > '9')
                            break;
                    }
                }
                if (n < source.length && (source.Get(n) == 'f' || source.Get(n) == 'F')) {
                    let tokenLength = n + 1;
                    return tokens_1.CreateToken(tokens_1.eTokenType.ttFloatConstant, source.start, tokenLength);
                }
                else {
                    let tokenLength = n;
                    return tokens_1.CreateToken(tokens_1.eTokenType.ttDoubleConstant, source.start, tokenLength);
                }
            }
            let tokenLength = n;
            return tokens_1.CreateToken(tokens_1.eTokenType.ttIntConstant, source.start, tokenLength);
        }
        // String constant between double or single quotes
        if (source.Get(0) == '"' || source.Get(0) == '\'') {
            // Is it a normal string constant or a heredoc string constant?
            if (source.length >= 6 && source.Get(0) == '"' && source.Get(1) == '"' && source.Get(2) == '"') {
                // Heredoc string constant (spans multiple lines, no escape sequences)
                // Find the length
                let n;
                for (n = 3; n < source.length - 2; n++) {
                    if (source.Get(n) == '"' && source.Get(n + 1) == '"' && source.Get(n + 2) == '"')
                        break;
                }
                let tokenLength = n + 3;
                return tokens_1.CreateToken(tokens_1.eTokenType.ttHeredocStringConstant, source.start, tokenLength);
            }
            else {
                // Normal string constant
                let tokenType = tokens_1.eTokenType.ttStringConstant;
                let quote = source.Get(0);
                let evenSlashes = true;
                let n;
                for (n = 1; n < source.length; n++) {
                    if (source.Get(n) == '\n')
                        tokenType = tokens_1.eTokenType.ttMultilineStringConstant;
                    if (source.Get(n) == quote && evenSlashes) {
                        let tokenLength = n + 1;
                        return tokens_1.CreateToken(tokenType, source.start, tokenLength);
                    }
                    if (source.Get(n) == '\\')
                        evenSlashes = !evenSlashes;
                    else
                        evenSlashes = true;
                }
                let tokenLength = n;
                return tokens_1.CreateToken(tokens_1.eTokenType.ttNonTerminatedStringConstant, source.start, tokenLength);
            }
        }
        return null;
    }
    IsDigitInRadix(ch, radix) {
        if (ch >= '0' && ch <= '9')
            return (ch.charCodeAt(0) - '0'.charCodeAt(0)) < radix;
        if (ch >= 'A' && ch <= 'Z')
            return (ch.charCodeAt(0) - 'A'.charCodeAt(0) - 10) < radix;
        if (ch >= 'a' && ch <= 'z')
            return (ch.charCodeAt(0) - 'a'.charCodeAt(0) - 10) < radix;
        return false;
    }
}
exports.Tokenizer = Tokenizer;
//# sourceMappingURL=tokenizer.js.map