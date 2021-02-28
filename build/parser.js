"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = void 0;
const scriptnode_1 = require("./scriptnode");
const tokenizer_1 = require("./tokenizer");
const tokens_1 = require("./tokens");
class Parser {
    constructor(source) {
        this.tokenizer = new tokenizer_1.Tokenizer();
        this.source = new tokenizer_1.IntermediateSource(source);
    }
    ParseScript() {
        let node = this.CreateNode(scriptnode_1.eScriptNode.snScript);
        let isSyntaxError = false;
        while (true) {
            while (!isSyntaxError) {
                let token = this.GetToken();
                console.log(tokens_1.eTokenType[token.type]);
                if (token.type == tokens_1.eTokenType.ttEnd) {
                    return;
                }
                // if( t1.type == ttImport )
                //     node->AddChildLast(ParseImport());
                // else if( t1.type == ttEnum )
                //     node->AddChildLast(ParseEnumeration());	// Handle enumerations
                // else if( t1.type == ttTypedef )
                //     node->AddChildLast(ParseTypedef());		// Handle primitive typedefs
                // else if( t1.type == ttClass )
                //     node->AddChildLast(ParseClass());
                // else if( t1.type == ttMixin )
                //     node->AddChildLast(ParseMixin());
                // else if( t1.type == ttInterface )
                //     node->AddChildLast(ParseInterface());
                // else if( t1.type == ttFuncDef )
                //     node->AddChildLast(ParseFuncDef());
                // else if( t1.type == ttConst || t1.type == ttScope || t1.type == ttAuto || IsDataType(t1) )
                // {
                //     if( IsVirtualPropertyDecl() )
                //         node->AddChildLast(ParseVirtualPropertyDecl(false, false));
                //     else if( IsVarDecl() )
                //         node->AddChildLast(ParseDeclaration(false, true));
                //     else
                //         node->AddChildLast(ParseFunction());
                // }
                // else if( t1.type == ttEndStatement )
                // {
                //     // Ignore a semicolon by itself
                //     GetToken(&t1);
                // }
                // else if( t1.type == ttNamespace )
                //     node->AddChildLast(ParseNamespace());
                // else if( t1.type == ttEnd )
                //     return node;
                // else if( inBlock && t1.type == ttEndStatementBlock )
                //     return node;
                // else
                // {
                //     asCString str;
                //     const char *t = asCTokenizer::GetDefinition(t1.type);
                //     if( t == 0 ) t = "<unknown token>";
                //     str.Format(TXT_UNEXPECTED_TOKEN_s, t);
                //     Error(str, &t1);
                // }
            }
        }
    }
    CreateNode(type) {
        return new scriptnode_1.ScriptNode(type);
    }
    GetToken() {
        let token = tokens_1.CreateToken(tokens_1.eTokenType.ttWhiteSpace, 0, 0);
        do {
            if (this.source.start >= this.source.source.length) {
                token = tokens_1.CreateToken(tokens_1.eTokenType.ttEnd, this.source.start, 0);
            }
            else {
                let tokenClass;
                [token, tokenClass] = this.tokenizer.GetToken(this.source);
                this.source.UpdateStart(token.length);
            }
        } while (token.type == tokens_1.eTokenType.ttWhiteSpace || token.type == tokens_1.eTokenType.ttOnelineComment || token.type == tokens_1.eTokenType.ttMultilineComment);
        return token;
    }
}
exports.Parser = Parser;
//# sourceMappingURL=parser.js.map