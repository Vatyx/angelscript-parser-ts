import { asETokenClass, CreateToken, eTokenType, Token, TokenWord, tokenWords, whiteSpace } from "./tokens";

export class IntermediateSource
{
    source: string;
    start: number;
    length: number;

    constructor(source: string)
    {
        this.source = source;
        this.start = 0;
        this.length = source.length;
    }

    Get(index: number): string
    {
        return this.source[this.start + index];
    }

    UpdateStart(amount: number)
    {
        this.start += amount;
        this.length -= amount;
    }

    SetStart(position: number)
    {
        this.start = position;
        this.length = this.source.length - this.start;
    }
}

export class Tokenizer
{
    keywordTable: { [startingChar: string]: TokenWord[] };
    source: IntermediateSource;
    lastToken: Token | null;

    constructor(sourceString: string)
    {
        this.keywordTable = {};

        tokenWords.forEach(element =>
        {
            if (this.keywordTable[element.word[0]] == undefined)
            {
                this.keywordTable[element.word[0]] = [];
            }

            this.keywordTable[element.word[0]].push(element);
        });

        Object.keys(this.keywordTable).forEach(key => {
            let keywords = this.keywordTable[key];
            keywords.sort((a, b) => b.word.length - a.word.length);
        });

        this.source = new IntermediateSource(sourceString);
        this.lastToken = null;
    }

    ConsumeToken(): Token
    {
        if (this.lastToken != null && this.lastToken.pos == this.source.start)
        {
            let token = this.lastToken;
            this.source.UpdateStart(token.length);

            if (token.type == eTokenType.ttWhiteSpace || token.type == eTokenType.ttOnelineComment || token.type == eTokenType.ttMultilineComment)
            {
                token = this.ConsumeToken();
            }

            return token;
        }

        let token;
        do
        {
            if (this.source.start >= this.source.source.length)
            {
                token = CreateToken(eTokenType.ttEnd, this.source.start, 0, asETokenClass.asTC_UNKNOWN);
            }
            else
            {
                token = this.GetToken();
                this.source.UpdateStart(token.length);
            }

        } while (token.type == eTokenType.ttWhiteSpace || token.type == eTokenType.ttOnelineComment || token.type == eTokenType.ttMultilineComment);

        return token;
    }

    RewindToToken(token: Token)
    {
        this.lastToken = token;
        this.source.SetStart(token.pos);
    }

    SetPosition(position: number)
    {
        this.lastToken = null;
        this.source.SetStart(position);
    }

    IdentifierIs(token: Token, identifier: string): boolean
    {
        if (token.type != eTokenType.ttIdentifier)
        {
            return false;
        }

        return this.source.source.substr(token.pos, token.length) == identifier;
    }

    private GetToken(): Token
    {
        let token = this.IsWhitespace(this.source);
        if (token != null)
        {
            return token;
        }

        token = this.IsComment(this.source);
        if (token != null)
        {
            return token;
        }

        token = this.IsConstant(this.source);
        if (token != null)
        {
            return token;
        }

        token = this.IsKeyword(this.source);
        if (token != null)
        {
            return token;
        }

        token = this.IsIdentifier(this.source);
        if (token != null)
        {
            return token;
        }

        return CreateToken(eTokenType.ttUnrecognizedToken, this.source.start, 1, asETokenClass.asTC_UNKNOWN);
    }

    IsWhitespace(source: IntermediateSource): Token | null
    {
        let i;
        for (i = 0; i < source.length; i++)
        {
            let char = source.Get(i);

            if (!whiteSpace.includes(char))
            {
                break;
            }
        }

        if (i > 0)
        {
            return CreateToken(eTokenType.ttWhiteSpace, source.start, i, asETokenClass.asTC_WHITESPACE);
        }

        return null;
    }

    IsComment(source: IntermediateSource): Token | null
    {
        if (source.length < 2)
            return null;

        if (source.Get(0) != '/')
            return null;

        if (source.Get(1) == '/')
        {
            // One-line comment
            // Find the length
            let n;
            for (n = 2; n < source.length; n++)
            {
                if (source.Get(n) == '\n')
                    break;
            }

            let tokenLength = n < source.length ? n + 1 : n;
            return CreateToken(eTokenType.ttOnelineComment, source.start, tokenLength, asETokenClass.asTC_COMMENT);
        }

        if (source.Get(1) == '*')
        {
            // Multi-line comment

            // Find the length
            let n;
            for (n = 2; n < source.length - 1;)
            {
                if (source.Get(n++) == '*' && source.Get(n) == '/')
                    break;
            }

            let tokenLength = n + 1;
            return CreateToken(eTokenType.ttMultilineComment, source.start, tokenLength, asETokenClass.asTC_COMMENT);
        }

        return null;
    }

    IsIdentifier(source: IntermediateSource): Token | null
    {
        // char is unsigned by default on some architectures, e.g. ppc and arm
        // Make sure the value is always treated as signed in the below comparisons
        let c = source.Get(0);

        // Starting with letter or underscore
        if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c == '_')
        {
            // tokenType   = ttIdentifier;
            let tokenLength = 1;
            for (let i = 1; i < source.length; i++)
            {
                c = source.Get(i);
                if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c == '_')
                    tokenLength++;
                else
                    break;
            }

            return CreateToken(eTokenType.ttIdentifier, source.start, tokenLength, asETokenClass.asTC_IDENTIFIER);
        }

        return null;
    }

    IsKeyword(source: IntermediateSource): Token | null
    {
        let c = source.Get(0);

        // Get all the keywords starting with this character.
        let tokenWords = this.keywordTable[c];

        if (!tokenWords)
        {
            return null;
        }

        for (let i = 0; i < tokenWords.length; i++)
        {
            let keyword = tokenWords[i].word;

            if (source.length >= keyword.length)
            {
                let matched = true;

                // Check to see if all the characters match
                for (let j = 1; j < keyword.length; j++)
                {
                    if (keyword[j] != source.Get(j))
                    {
                        matched = false;
                    }
                }

                if (matched)
                {
                    if (keyword.length < source.length &&
                        ((source.Get(keyword.length - 1) >= 'a' && source.Get(keyword.length - 1) <= 'z') ||
                        (source.Get(keyword.length - 1) >= 'A' && source.Get(keyword.length - 1) <= 'Z') ||
                        (source.Get(keyword.length - 1) >= '0' && source.Get(keyword.length - 1) <= '9')) &&
                        ((source.Get(keyword.length) >= 'a' && source.Get(keyword.length) <= 'z') ||
                        (source.Get(keyword.length) >= 'A' && source.Get(keyword.length) <= 'Z') ||
                        (source.Get(keyword.length) >= '0' && source.Get(keyword.length) <= '9') ||
                        (source.Get(keyword.length) == '_')))
                    {
                        // The token doesn't really match, even though 
                        // the start of the source matches the token
                        continue;
                    }

                    return CreateToken(tokenWords[i].type, source.start, keyword.length, asETokenClass.asTC_KEYWORD);
                }
            }
        }

        return null;
    }

    IsConstant(source: IntermediateSource): Token | null
    {
        // Starting with number
        if ((source.Get(0) >= '0' && source.Get(0) <= '9') || (source.Get(0) == '.' && source.length > 1 && source.Get(1) >= '0' && source.Get(1) <= '9'))
        {
            // Is it a based number?
            if (source.Get(0) == '0' && source.length > 1)
            {
                // Determine the radix for the constant
                let radix = 0;
                switch (source.Get(1))
                {
                    case 'b': case 'B': radix = 2; break;
                    case 'o': case 'O': radix = 8; break;
                    case 'd': case 'D': radix = 10; break;
                    case 'x': case 'X': radix = 16; break;
                }

                if (radix > 0)
                {
                    let n;
                    for (n = 2; n < source.length; n++)
                    {
                        if (!this.IsDigitInRadix(source.Get(n), radix))
                        {

                            break;
                        }
                    }

                    return CreateToken(eTokenType.ttBitsConstant, source.start, n, asETokenClass.asTC_VALUE);
                }
            }

            let n;
            for (n = 0; n < source.length; n++)
            {
                if (source.Get(n) < '0' || source.Get(n) > '9')
                    break;
            }

            if (n < source.length && (source.Get(n) == '.' || source.Get(n) == 'e' || source.Get(n) == 'E'))
            {
                if (source.Get(n) == '.')
                {
                    n++;
                    for (; n < source.length; n++)
                    {
                        if (source.Get(n) < '0' || source.Get(n) > '9')
                            break;
                    }
                }

                if (n < source.length && (source.Get(n) == 'e' || source.Get(n) == 'E'))
                {
                    n++;
                    if (n < source.length && (source.Get(n) == '-' || source.Get(n) == '+'))
                        n++;

                    for (; n < source.length; n++)
                    {
                        if (source.Get(n) < '0' || source.Get(n) > '9')
                            break;
                    }
                }

                if (n < source.length && (source.Get(n) == 'f' || source.Get(n) == 'F'))
                {
                    let tokenLength = n + 1;
                    return CreateToken(eTokenType.ttFloatConstant, source.start, tokenLength, asETokenClass.asTC_VALUE);
                }
                else
                {
                    let tokenLength = n;
                    return CreateToken(eTokenType.ttDoubleConstant, source.start, tokenLength, asETokenClass.asTC_VALUE);
                }
            }

            let tokenLength = n;
            return CreateToken(eTokenType.ttIntConstant, source.start, tokenLength, asETokenClass.asTC_VALUE);
        }

        // String constant between double or single quotes
        if (source.Get(0) == '"' || source.Get(0) == '\'')
        {
            // Is it a normal string constant or a heredoc string constant?
            if (source.length >= 6 && source.Get(0) == '"' && source.Get(1) == '"' && source.Get(2) == '"')
            {
                // Heredoc string constant (spans multiple lines, no escape sequences)

                // Find the length
                let n;
                for (n = 3; n < source.length - 2; n++)
                {
                    if (source.Get(n) == '"' && source.Get(n + 1) == '"' && source.Get(n + 2) == '"')
                        break;
                }

                let tokenLength = n + 3;
                return CreateToken(eTokenType.ttHeredocStringConstant, source.start, tokenLength, asETokenClass.asTC_VALUE);
            }
            else
            {
                // Normal string constant
                let tokenType = eTokenType.ttStringConstant;

                let quote = source.Get(0);
                let evenSlashes = true;
                let n;
                for (n = 1; n < source.length; n++)
                {
                    if (source.Get(n) == '\n')
                        tokenType = eTokenType.ttMultilineStringConstant;
                    if (source.Get(n) == quote && evenSlashes)
                    {
                        let tokenLength = n + 1;
                        return CreateToken(tokenType, source.start, tokenLength, asETokenClass.asTC_VALUE);
                    }
                    if (source.Get(n) == '\\') evenSlashes = !evenSlashes; else evenSlashes = true;
                }

                let tokenLength = n;
                return CreateToken(eTokenType.ttNonTerminatedStringConstant, source.start, tokenLength, asETokenClass.asTC_VALUE);
            }
        }

        return null;
    }

    IsDigitInRadix(ch: string, radix: number): boolean
    {
        if (ch >= '0' && ch <= '9') return (ch.charCodeAt(0) - '0'.charCodeAt(0)) < radix;
        if (ch >= 'A' && ch <= 'Z') return (ch.charCodeAt(0) - 'A'.charCodeAt(0) - 10) < radix;
        if (ch >= 'a' && ch <= 'z') return (ch.charCodeAt(0) - 'a'.charCodeAt(0) - 10) < radix;
        return false;
    }
}
