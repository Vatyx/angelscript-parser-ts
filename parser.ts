import { eScriptNode, ScriptNode } from "./scriptnode";
import { Tokenizer } from "./tokenizer";
import { eTokenType, EXTERNAL_TOKEN, IF_HANDLE_TOKEN, SHARED_TOKEN, Token } from "./tokens";

export class Parser
{
    tokenizer: Tokenizer;
    isSyntaxError = false;

    constructor(source: string)
    {
        this.tokenizer = new Tokenizer(source);
    }

    ParseScript()
    {
        let node = this.CreateNode(eScriptNode.snScript);

        while (true)
        {
            while (!this.isSyntaxError)
            {
                let token = this.GetToken();

                if (token.type == eTokenType.ttEnd)
                {
                    return;
                }

                this.RewindTo(token);

                if (token.type == eTokenType.ttImport)
                {
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

    CreateNode(type: eScriptNode): ScriptNode 
    {
        return new ScriptNode(type);
    }

    GetToken = () => this.tokenizer.ConsumeToken();
    RewindTo = (token: Token) => this.tokenizer.RewindToToken(token);
    IdentifierIs = (token: Token, identifier: string) => this.tokenizer.IdentifierIs(token, identifier);

    ParseFunction(isMethod: boolean = false): ScriptNode
    {
        let node = this.CreateNode(eScriptNode.snFunction);

        let token = this.GetToken();

        if (!isMethod)
        {
            // A global function can be marked as shared and external
            while (token.type == eTokenType.ttIdentifier)
            {
                if (this.IdentifierIs(token, SHARED_TOKEN) || this.IdentifierIs(token, EXTERNAL_TOKEN))
                {
                    this.RewindTo(token);
                    node.AddChildLast(this.ParseIdentifier());
                    if (this.isSyntaxError) 
                    {
                        return node;
                    }
                }
                else
                {
                    break;
                }

                token = this.GetToken();
            }
        }

        // A class method can start with 'private' or 'protected'
        if (isMethod && token.type == eTokenType.ttPrivate)
        {
            this.RewindTo(token);
            node.AddChildLast(this.ParseToken(eTokenType.ttPrivate));
            token = this.GetToken();
        }
        else if (isMethod && token.type == eTokenType.ttProtected)
        {
            this.RewindTo(token);
            node.AddChildLast(this.ParseToken(eTokenType.ttProtected));
            token = this.GetToken();
        }

        if (this.isSyntaxError) return node;

        // If it is a global function, or a method, except constructor and destructor, then the return type is parsed
        let token2 = this.GetToken();
        this.RewindTo(token);

        if (!isMethod || (token.type != eTokenType.ttBitNot && token.type != eTokenType.ttOpenParanthesis))
        {
            node.AddChildLast(this.ParseType(true));
            if (this.isSyntaxError) return node;

            node.AddChildLast(this.ParseTypeMod(false));
            if (this.isSyntaxError) return node;
        }

        // If this is a class destructor then it starts with ~, and no return type is declared
        if (isMethod && token.type == eTokenType.ttBitNot)
        {
            node.AddChildLast(this.ParseToken(eTokenType.ttBitNot));
            if (this.isSyntaxError) return node;
        }

        node.AddChildLast(this.ParseIdentifier());
        if (this.isSyntaxError) return node;

        node.AddChildLast(this.ParseParameterList());
        if (this.isSyntaxError) return node;

        if (isMethod)
        {
            token = this.GetToken();
            this.RewindTo(token);

            // Is the method a const?
            if (token.type == eTokenType.ttConst)
                node.AddChildLast(this.ParseToken(eTokenType.ttConst));
        }

        // TODO: Should support abstract methods, in which case no statement block should be provided
        this.ParseMethodAttributes(node);
        if (this.isSyntaxError) return node;

        // External shared functions must be ended with ';'
        token = this.GetToken();
        this.RewindTo(token);
        if (token.type == eTokenType.ttEndStatement)
        {
            node.AddChildLast(this.ParseToken(eTokenType.ttEndStatement));
            return node;
        }

        // We should just find the end of the statement block here. The statements
        // will be parsed on request by the compiler once it starts the compilation.
        node.AddChildLast(this.ParseStatementBlock());

        return node;
    }

    ParseStatementBlock(): ScriptNode
    {
        let node = this.CreateNode(eScriptNode.snStatementBlock);

        let t1 = this.GetToken();

        if (t1.type != eTokenType.ttStartStatementBlock)
        {
            this.Error();
            return node;
        }

        let start = t1;

        node.UpdateSourcePosition(t1.pos, t1.length);

        for (; ;)
        {
            while (!this.isSyntaxError)
            {
                t1 = this.GetToken();
                if (t1.type == eTokenType.ttEndStatementBlock)
                {
                    node.UpdateSourcePosition(t1.pos, t1.length);

                    // Statement block is finished
                    return node;
                }
                else
                {
                    this.RewindTo(t1);

                    if (this.IsVarDecl())
                        node.AddChildLast(this.ParseDeclaration());
                    else
                        node.AddChildLast(this.ParseStatement());
                }
            }

            if (this.isSyntaxError)
            {
                // Search for either ';', '{', '}', or end
                t1 = this.GetToken();
                while (t1.type != eTokenType.ttEndStatement && t1.type != eTokenType.ttEnd &&
                    t1.type != eTokenType.ttStartStatementBlock && t1.type != eTokenType.ttEndStatementBlock)
                {
                    t1 = this.GetToken();
                }

                // Skip this statement block
                if (t1.type == eTokenType.ttStartStatementBlock)
                {
                    // Find the end of the block and skip nested blocks
                    let level = 1;
                    while (level > 0)
                    {
                        t1 = this.GetToken();
                        if (t1.type == eTokenType.ttStartStatementBlock) level++;
                        if (t1.type == eTokenType.ttEndStatementBlock) level--;
                        if (t1.type == eTokenType.ttEnd) break;
                    }
                }
                else if (t1.type == eTokenType.ttEndStatementBlock)
                {
                    this.RewindTo(t1);
                }
                else if (t1.type == eTokenType.ttEnd)
                {
                    this.Error();
                    return node;
                }

                this.isSyntaxError = false;
            }
        }
    }

    ParseStatement(): ScriptNode
    {
        let t1 = this.GetToken();
        this.RewindTo(t1);

        if (t1.type == eTokenType.ttIf)
            return this.ParseIf();
        else if (t1.type == eTokenType.ttFor)
            return this.ParseFor();
        else if (t1.type == eTokenType.ttWhile)
            return this.ParseWhile();
        else if (t1.type == eTokenType.ttReturn)
            return this.ParseReturn();
        else if (t1.type == eTokenType.ttStartStatementBlock)
            return this.ParseStatementBlock();
        else if (t1.type == eTokenType.ttBreak)
            return this.ParseBreak();
        else if (t1.type == eTokenType.ttContinue)
            return this.ParseContinue();
        else if (t1.type == eTokenType.ttDo)
            return this.ParseDoWhile();
        else if (t1.type == eTokenType.ttSwitch)
            return this.ParseSwitch();
        else if (t1.type == eTokenType.ttTry)
            return this.ParseTryCatch();
        else
        {
            if (this.IsVarDecl())
            {
                this.Error();
            }
            return this.ParseExpressionStatement();
        }
    }

    ParseIf(): ScriptNode
    {
        let node = this.CreateNode(eScriptNode.snIf);

        let t = this.GetToken();

        if (t.type != eTokenType.ttIf)
        {
            this.Error();
            return node;
        }

        node.UpdateSourcePosition(t.pos, t.length);

        t = this.GetToken();
        if (t.type != eTokenType.ttOpenParanthesis)
        {
            this.Error();
            return node;
        }

        node.AddChildLast(this.ParseAssignment());
        if (this.isSyntaxError) return node;

        t = this.GetToken();
        if (t.type != eTokenType.ttCloseParanthesis)
        {
            this.Error();
            return node;
        }

        node.AddChildLast(this.ParseStatement());
        if (this.isSyntaxError) return node;

        t = this.GetToken();
        if (t.type != eTokenType.ttElse)
        {
            // No else statement return already
            this.RewindTo(t);
            return node;
        }

        node.AddChildLast(this.ParseStatement());

        return node;
    }

    ParseFor(): ScriptNode
    {
        let node = this.CreateNode(eScriptNode.snFor);

        let t = this.GetToken();
        if (t.type != eTokenType.ttFor)
        {
            this.Error();
            return node;
        }

        node.UpdateSourcePosition(t.pos, t.length);

        t = this.GetToken();
        if (t.type != eTokenType.ttOpenParanthesis)
        {
            this.Error();
            return node;
        }

        if (this.IsVarDecl())
            node.AddChildLast(this.ParseDeclaration());
        else
            node.AddChildLast(this.ParseExpressionStatement());
        if (this.isSyntaxError) return node;

        node.AddChildLast(this.ParseExpressionStatement());
        if (this.isSyntaxError) return node;

        t = this.GetToken();
        if (t.type != eTokenType.ttCloseParanthesis)
        {
            this.RewindTo(t);

            // Parse N increment statements separated by ,
            for (; ;)
            {
                let n = this.CreateNode(eScriptNode.snExpressionStatement);
                node.AddChildLast(n);
                n.AddChildLast(this.ParseAssignment());
                if (this.isSyntaxError) return node;

                t = this.GetToken();
                if (t.type == eTokenType.ttListSeparator)
                    continue;
                else if (t.type == eTokenType.ttCloseParanthesis)
                    break;
                else
                {
                    this.Error();
                    return node;
                }
            }
        }

        node.AddChildLast(this.ParseStatement());

        return node;
    }

    ParseWhile(): ScriptNode
    {
        let node = this.CreateNode(eScriptNode.snWhile);
        let t = this.GetToken();

        if (t.type != eTokenType.ttWhile)
        {
            this.Error();
            return node;
        }

        node.UpdateSourcePosition(t.pos, t.length);

        t = this.GetToken();
        if (t.type != eTokenType.ttOpenParanthesis)
        {
            this.Error();
            return node;
        }

        node.AddChildLast(this.ParseAssignment());
        if (this.isSyntaxError) return node;

        t = this.GetToken();
        if (t.type != eTokenType.ttCloseParanthesis)
        {
            this.Error();
            return node;
        }

        node.AddChildLast(this.ParseStatement());

        return node;
    }

    ParseReturn(): ScriptNode
    {
        let node = this.CreateNode(eScriptNode.snReturn);

        let t = this.GetToken();
        if (t.type != eTokenType.ttReturn)
        {
            this.Error();
            return node;
        }

        node.UpdateSourcePosition(t.pos, t.length);

        t = this.GetToken();
        if (t.type == eTokenType.ttEndStatement)
        {
            node.UpdateSourcePosition(t.pos, t.length);
            return node;
        }

        this.RewindTo(t);

        node.AddChildLast(this.ParseAssignment());
        if (this.isSyntaxError) return node;

        t = this.GetToken();
        if (t.type != eTokenType.ttEndStatement)
        {
            this.Error();
            return node;
        }

        node.UpdateSourcePosition(t.pos, t.length);

        return node;
    }

    ParseBreak(): ScriptNode
    {
        let node = this.CreateNode(eScriptNode.snBreak);
        let t = this.GetToken();
        if (t.type != eTokenType.ttBreak)
        {
            this.Error();
            return node;
        }

        node.UpdateSourcePosition(t.pos, t.length);

        t = this.GetToken();
        if (t.type != eTokenType.ttEndStatement)
        {
            this.Error();
        }

        node.UpdateSourcePosition(t.pos, t.length);

        return node;
    }

    ParseContinue(): ScriptNode
    {
        let node = this.CreateNode(eScriptNode.snContinue);

        let t = this.GetToken();
        if (t.type != eTokenType.ttContinue)
        {
            this.Error();
            return node;
        }

        node.UpdateSourcePosition(t.pos, t.length);

        t = this.GetToken();
        if (t.type != eTokenType.ttEndStatement)
        {
            this.Error();
        }

        node.UpdateSourcePosition(t.pos, t.length);

        return node;
    }

    ParseDoWhile(): ScriptNode
    {
        let node = this.CreateNode(eScriptNode.snDoWhile);

        let t = this.GetToken();
        if (t.type != eTokenType.ttDo)
        {
            this.Error();
            return node;
        }

        node.UpdateSourcePosition(t.pos, t.length);

        node.AddChildLast(this.ParseStatement());
        if (this.isSyntaxError) return node;

        t = this.GetToken();
        if (t.type != eTokenType.ttWhile)
        {
            this.Error();
            return node;
        }

        t = this.GetToken();
        if (t.type != eTokenType.ttOpenParanthesis)
        {
            this.Error();
            return node;
        }

        node.AddChildLast(this.ParseAssignment());
        if (this.isSyntaxError) return node;

        t = this.GetToken();
        if (t.type != eTokenType.ttCloseParanthesis)
        {
            this.Error();
            return node;
        }

        t = this.GetToken();
        if (t.type != eTokenType.ttEndStatement)
        {
            this.Error();
            return node;
        }

        node.UpdateSourcePosition(t.pos, t.length);

        return node;
    }

    ParseSwitch(): ScriptNode
    {
        let node = this.CreateNode(eScriptNode.snSwitch);

        let t = this.GetToken();
        if (t.type != eTokenType.ttSwitch)
        {
            this.Error();
            return node;
        }

        node.UpdateSourcePosition(t.pos, t.length);

        t = this.GetToken();
        if (t.type != eTokenType.ttOpenParanthesis)
        {
            this.Error();
            return node;
        }

        node.AddChildLast(this.ParseAssignment());
        if (this.isSyntaxError) return node;

        t = this.GetToken();
        if (t.type != eTokenType.ttCloseParanthesis)
        {
            this.Error();
            return node;
        }

        t = this.GetToken();
        if (t.type != eTokenType.ttStartStatementBlock)
        {
            this.Error();
            return node;
        }

        while (!this.isSyntaxError)
        {
            t = this.GetToken();

            if (t.type == eTokenType.ttEndStatementBlock)
                break;

            this.RewindTo(t);

            if (t.type != eTokenType.ttCase && t.type != eTokenType.ttDefault)
            {
                this.Error();
                return node;
            }

            node.AddChildLast(this.ParseCase());
            if (this.isSyntaxError) return node;
        }

        if (t.type != eTokenType.ttEndStatementBlock)
        {
            this.Error();
            return node;
        }

        return node;
    }

    ParseCase(): ScriptNode
    {
        let node = this.CreateNode(eScriptNode.snCase);

        let t = this.GetToken();

        if (t.type != eTokenType.ttCase && t.type != eTokenType.ttDefault)
        {
            this.Error();
            return node;
        }

        node.UpdateSourcePosition(t.pos, t.length);

        if (t.type == eTokenType.ttCase)
        {
            node.AddChildLast(this.ParseExpression());
        }

        t = this.GetToken();
        if (t.type != eTokenType.ttColon)
        {
            this.Error();
            return node;
        }

        // Parse statements until we find either of }, case, default, and break
        t = this.GetToken();
        this.RewindTo(t);
        while (t.type != eTokenType.ttCase &&
            t.type != eTokenType.ttDefault &&
            t.type != eTokenType.ttEndStatementBlock &&
            t.type != eTokenType.ttBreak)
        {
            if (this.IsVarDecl())
                // Variable declarations are not allowed, but we parse it anyway to give a good error message
                node.AddChildLast(this.ParseDeclaration());
            else
                node.AddChildLast(this.ParseStatement());
            if (this.isSyntaxError) return node;

            t = this.GetToken();
            this.RewindTo(t);
        }

        // If the case was ended with a break statement, add it to the node
        if (t.type == eTokenType.ttBreak)
            node.AddChildLast(this.ParseBreak());

        return node;
    }

    ParseTryCatch(): ScriptNode
    {
        let node = this.CreateNode(eScriptNode.snTryCatch);

        let t = this.GetToken();
        if (t.type != eTokenType.ttTry)
        {
            this.Error();
            return node;
        }

        node.UpdateSourcePosition(t.pos, t.length);

        node.AddChildLast(this.ParseStatementBlock());
        if (this.isSyntaxError) return node;

        t = this.GetToken();
        if (t.type != eTokenType.ttCatch)
        {
            this.Error();
            return node;
        }

        node.AddChildLast(this.ParseStatementBlock());
        if (this.isSyntaxError) return node;

        return node;
    }

    ParseDeclaration(isClassProp: boolean = false, isGlobalVar: boolean = false): ScriptNode
    {
        let node = this.CreateNode(eScriptNode.snDeclaration);

        let t = this.GetToken();
        this.RewindTo(t);

        // A class property can be preceeded by private
        if (t.type == eTokenType.ttPrivate && isClassProp)
            node.AddChildLast(this.ParseToken(eTokenType.ttPrivate));
        else if (t.type == eTokenType.ttProtected && isClassProp)
            node.AddChildLast(this.ParseToken(eTokenType.ttProtected));

        // Parse data type
        node.AddChildLast(this.ParseType(true, false, !isClassProp));
        if (this.isSyntaxError) return node;

        for (;;)
        {
            // Parse identifier
            node.AddChildLast(this.ParseIdentifier());
            if (this.isSyntaxError) return node;

            if (isClassProp || isGlobalVar)
            {
                // Only superficially parse the initialization info for the class property
                t = this.GetToken();
                this.RewindTo(t);
                if (t.type == eTokenType.ttAssignment || t.type == eTokenType.ttOpenParanthesis)
                {
                    node.AddChildLast(this.SuperficiallyParseVarInit());
                    if (this.isSyntaxError) return node;
                }
            }
            else
            {
                // If next token is assignment, parse expression
                t = this.GetToken();
                if (t.type == eTokenType.ttOpenParanthesis)
                {
                    this.RewindTo(t);
                    node.AddChildLast(this.ParseArgList());
                    if (this.isSyntaxError) return node;
                }
                else if (t.type == eTokenType.ttAssignment)
                {
                    t = this.GetToken();
                    this.RewindTo(t);
                    if (t.type == eTokenType.ttStartStatementBlock)
                    {
                        node.AddChildLast(this.ParseInitList());
                        if (this.isSyntaxError) return node;
                    }
                    else
                    {
                        node.AddChildLast(this.ParseAssignment());
                        if (this.isSyntaxError) return node;
                    }
                }
                else
                    this.RewindTo(t);
            }

            // continue if list separator, else terminate with end statement
            t = this.GetToken(t);
            if (t.type == eTokenType.ttListSeparator)
                continue;
            else if (t.type == eTokenType.ttEndStatement)
            {
                node.UpdateSourcePosition(t.pos, t.length);
                return node;
            }
            else
            {
                this.Error();
                return node;
            }
        }
    }

    ParseParameterList(): ScriptNode
    {
        let node = this.CreateNode(eScriptNode.snParameterList);

        let t1 = this.GetToken();
        if (t1.type != eTokenType.ttOpenParanthesis)
        {
            this.Error();
            return node;
        }

        node.UpdateSourcePosition(t1.pos, t1.length);

        t1 = this.GetToken();
        if (t1.type == eTokenType.ttCloseParanthesis)
        {
            node.UpdateSourcePosition(t1.pos, t1.length);

            // Statement block is finished
            return node;
        }
        else
        {
            // If the parameter list is just (void) then the void token should be ignored
            if (t1.type == eTokenType.ttVoid)
            {
                let t2 = this.GetToken();
                if (t2.type == eTokenType.ttCloseParanthesis)
                {
                    node.UpdateSourcePosition(t2.pos, t2.length);
                    return node;
                }
            }

            this.RewindTo(t1);

            for (; ;)
            {
                // Parse data type
                node.AddChildLast(this.ParseType(true));
                if (this.isSyntaxError) return node;

                node.AddChildLast(this.ParseTypeMod(true));
                if (this.isSyntaxError) return node;

                // Parse optional identifier
                t1 = this.GetToken();
                if (t1.type == eTokenType.ttIdentifier)
                {
                    this.RewindTo(t1);
                    node.AddChildLast(this.ParseIdentifier());
                    if (this.isSyntaxError) return node;

                    t1 = this.GetToken();
                }

                // Parse optional expression for the default arg
                if (t1.type == eTokenType.ttAssignment)
                {
                    // Do a superficial parsing of the default argument
                    // The actual parsing will be done when the argument is compiled for a function call
                    node.AddChildLast(this.ParseExpression());
                    if (this.isSyntaxError) return node;

                    t1 = this.GetToken();
                }

                // Check if list continues
                if (t1.type == eTokenType.ttCloseParanthesis)
                {
                    node.UpdateSourcePosition(t1.pos, t1.length);
                    return node;
                }
                else if (t1.type == eTokenType.ttListSeparator)
                {
                    continue;
                }
                else
                {
                    this.Error();
                    return node;
                }
            }
        }
    }

    ParseAssignment(): ScriptNode
    {
        let node = this.CreateNode(eScriptNode.snAssignment);

        node.AddChildLast(this.ParseCondition());
        if (this.isSyntaxError) return node;

        let t = this.GetToken();
        this.RewindTo(t);

        if (this.IsAssignOperator(t.type))
        {
            node.AddChildLast(this.ParseAssignOperator());
            if (this.isSyntaxError) return node;

            node.AddChildLast(this.ParseAssignment());
            if (this.isSyntaxError) return node;
        }

        return node;
    }

    ParseCondition(): ScriptNode
    {
        let node = this.CreateNode(eScriptNode.snCondition);

        node.AddChildLast(this.ParseExpression());
        if (this.isSyntaxError) return node;

        let t = this.GetToken();
        if (t.type == eTokenType.ttQuestion)
        {
            node.AddChildLast(this.ParseAssignment());
            if (this.isSyntaxError) return node;

            t = this.GetToken();
            if (t.type != eTokenType.ttColon)
            {
                this.Error();
                return node;
            }

            node.AddChildLast(this.ParseAssignment());
            if (this.isSyntaxError) return node;
        }
        else
            this.RewindTo(t);

        return node;
    }

    ParseExpressionStatement(): ScriptNode
    {
        let node = this.CreateNode(eScriptNode.snExpressionStatement);

        let t = this.GetToken();
        if (t.type == eTokenType.ttEndStatement)
        {
            node.UpdateSourcePosition(t.pos, t.length);

            return node;
        }

        this.RewindTo(t);

        node.AddChildLast(this.ParseAssignment());
        if (this.isSyntaxError) return node;

        t = this.GetToken();
        if (t.type != eTokenType.ttEndStatement)
        {
            this.Error();
            return node;
        }

        node.UpdateSourcePosition(t.pos, t.length);

        return node;
    }

    ParseType(allowConst: boolean, allowVariableType: boolean = false, allowAuto: boolean = false)
    {
        let node = this.CreateNode(eScriptNode.snDataType);

        let token;

        if (allowConst)
        {
            token = this.GetToken();
            this.RewindTo(token);
            if (token.type == eTokenType.ttConst)
            {
                node.AddChildLast(this.ParseToken(eTokenType.ttConst));
                if (this.isSyntaxError) return node;
            }
        }

        // Parse scope prefix
        this.ParseOptionalScope(node);

        // Parse the actual type
        node.AddChildLast(this.ParseDataType(allowVariableType, allowAuto));
        if (this.isSyntaxError) return node;

        // Handle templates

        // If the datatype is a template type, then parse the subtype within the < >
        // token = this.GetToken();
        // this.RewindTo(token);
        // let type = node.lastChild;

        // tempString.Assign(&script->code[type->tokenPos], type->tokenLength);
        // if( engine->IsTemplateType(tempString.AddressOf()) && t.type == ttLessThan )
        // {
        // 	ParseTemplTypeList(node);
        // 	if (isSyntaxError) return node;
        // }

        // Parse [] and @
        token = this.GetToken();
        this.RewindTo(token);
        while (token.type == eTokenType.ttOpenBracket || token.type == eTokenType.ttHandle)
        {
            if (token.type == eTokenType.ttOpenBracket)
            {
                node.AddChildLast(this.ParseToken(eTokenType.ttOpenBracket));
                if (this.isSyntaxError) return node;

                token = this.GetToken();
                if (token.type != eTokenType.ttCloseBracket)
                {
                    this.Error();
                    return node;
                }
            }
            else
            {
                node.AddChildLast(this.ParseToken(eTokenType.ttHandle));
                if (this.isSyntaxError) return node;

                token = this.GetToken();
                this.RewindTo(token);
                if (token.type == eTokenType.ttConst)
                {
                    node.AddChildLast(this.ParseToken(eTokenType.ttConst));
                    if (this.isSyntaxError) return node;
                }
            }

            token = this.GetToken();
            this.RewindTo(token);
        }

        return node;
    }

    ParseOptionalScope(node: ScriptNode)
    {
        let scope = this.CreateNode(eScriptNode.snScope);

        let t1 = this.GetToken();
        let t2 = this.GetToken();

        if (t1.type == eTokenType.ttScope)
        {
            this.RewindTo(t1);
            scope.AddChildLast(this.ParseToken(eTokenType.ttScope));
            t1 = this.GetToken();
            t2 = this.GetToken();
        }

        while (t1.type == eTokenType.ttIdentifier && t2.type == eTokenType.ttScope)
        {
            this.RewindTo(t1);
            scope.AddChildLast(this.ParseIdentifier());
            scope.AddChildLast(this.ParseToken(eTokenType.ttScope));
            t1 = this.GetToken();
            t2 = this.GetToken();
        }

        // Handle templates

        // The innermost scope may be a template type
        // if( t1.type == ttIdentifier && t2.type == ttLessThan )
        // {
        // 	tempString.Assign(&script->code[t1.pos], t1.length);
        // 	if (engine->IsTemplateType(tempString.AddressOf()))
        // 	{
        // 		RewindTo(&t1);
        // 		asCScriptNode *restore = scope->lastChild;
        // 		scope->AddChildLast(ParseIdentifier());
        // 		if (ParseTemplTypeList(scope, false))
        // 		{
        // 			GetToken(&t2);
        // 			if (t2.type == ttScope)
        // 			{
        // 				// Template type is part of the scope
        // 				// Nothing more needs to be done
        // 				node->AddChildLast(scope);
        // 				return;
        // 			}
        // 			else
        // 			{
        // 				// The template type is not part of the scope
        // 				// Rewind to the template type and end the scope
        // 				RewindTo(&t1);

        // 				// Restore the previously parsed node
        // 				while (scope->lastChild != restore)
        // 				{
        // 					asCScriptNode *last = scope->lastChild;
        // 					last->DisconnectParent();
        // 					last->Destroy(engine);
        // 				}
        // 				if( scope->lastChild )
        // 					node->AddChildLast(scope);
        // 				else
        // 					scope->Destroy(engine);
        // 				return;
        // 			}
        // 		}
        // 	}
        // }

        // The identifier is not part of the scope
        this.RewindTo(t1);

        if (scope.lastChild != null)
        {

            node.AddChildLast(scope);
        }
    }

    ParseDataType(allowVariableType: boolean = false, allowAuto: boolean = false): ScriptNode
    {
        let node = this.CreateNode(eScriptNode.snDataType);

        let token = this.GetToken();

        if (!this.IsDataType(token) && !(allowVariableType && token.type == eTokenType.ttQuestion) && !(allowAuto && token.type == eTokenType.ttAuto))
        {
            if (token.type == eTokenType.ttIdentifier)
            {
                this.Error();
            }
            else if (token.type == eTokenType.ttAuto)
            {
                this.Error();
            }
            else
            {
                this.Error();
            }

            return node;
        }

        node.SetToken(token);

        return node;
    }

    ParseTypeMod(isParam: boolean): ScriptNode
    {
        let node = this.CreateNode(eScriptNode.snDataType);

        // Parse possible & token
        let token = this.GetToken();
        this.RewindTo(token);
        if (token.type == eTokenType.ttAmp)
        {
            node.AddChildLast(this.ParseToken(eTokenType.ttAmp));
            if (this.isSyntaxError) return node;

            if (isParam)
            {
                token = this.GetToken();
                this.RewindTo(token);

                if (token.type == eTokenType.ttIn || token.type == eTokenType.ttOut || token.type == eTokenType.ttInOut)
                {
                    let typeMods = [eTokenType.ttIn, eTokenType.ttOut, eTokenType.ttInOut];
                    node.AddChildLast(this.ParseOneOf(typeMods));
                }
            }
        }

        // Parse possible + token
        token = this.GetToken();
        this.RewindTo(token);
        if (token.type == eTokenType.ttPlus)
        {
            node.AddChildLast(this.ParseToken(eTokenType.ttPlus));
            if (this.isSyntaxError) return node;
        }

        // Parse possible if_handle_then_const token
        token = this.GetToken();
        this.RewindTo(token);
        if (this.IdentifierIs(token, IF_HANDLE_TOKEN))
        {
            node.AddChildLast(this.ParseToken(eTokenType.ttIdentifier));
            if (this.isSyntaxError) return node;
        }

        return node;
    }

    ParseExprOperator(): ScriptNode
    {
        let node = this.CreateNode(eScriptNode.snExprOperator);

        let t = this.GetToken();
        if (!this.IsOperator(t.type))
        {
            this.Error();
            return node;
        }

        node.SetToken(t);
        return node;
    }

    ParseAssignOperator(): ScriptNode
    {
        let node = this.CreateNode(eScriptNode.snExprOperator);

        let t = this.GetToken();
        if (!this.IsAssignOperator(t.type))
        {
            this.Error();
            return node;
        }

        node.SetToken(t);
        return node;
    }

    ParseIdentifier(): ScriptNode
    {
        let node = this.CreateNode(eScriptNode.snIdentifier);

        let token = this.GetToken();
        if (token.type != eTokenType.ttIdentifier)
        {
            this.Error();
            return node;
        }

        node.SetToken(token);
        return node;
    }

    ParseToken(tokenType: eTokenType): ScriptNode
    {
        let node = this.CreateNode(eScriptNode.snUndefined);

        let token = this.GetToken();
        if (token.type != tokenType)
        {
            this.Error();
            return node;
        }

        node.SetToken(token);
        return node;
    }

    ParseOneOf(tokens: eTokenType[]): ScriptNode
    {
        let node = this.CreateNode(eScriptNode.snUndefined);

        let token = this.GetToken();

        let n;
        for (n = 0; n < tokens.length; n++)
        {
            if (tokens[n] == token.type)
            {
                break;
            }
        }

        if (n == tokens.length)
        {
            this.Error();
            return node;
        }

        node.SetToken(token);
        return node;
    }

    IsDataType(token: Token): boolean
    {
        if (token.type == eTokenType.ttIdentifier)
        {
            return true;
        }

        if (this.IsRealType(token.type))
            return true;

        return false;
    }

    IsRealType(tokenType: eTokenType): boolean
    {
        if (tokenType == eTokenType.ttVoid ||
            tokenType == eTokenType.ttInt ||
            tokenType == eTokenType.ttInt8 ||
            tokenType == eTokenType.ttInt16 ||
            tokenType == eTokenType.ttInt64 ||
            tokenType == eTokenType.ttUInt ||
            tokenType == eTokenType.ttUInt8 ||
            tokenType == eTokenType.ttUInt16 ||
            tokenType == eTokenType.ttUInt64 ||
            tokenType == eTokenType.ttFloat ||
            tokenType == eTokenType.ttBool ||
            tokenType == eTokenType.ttDouble)
            return true;

        return false;
    }

    IsVarDecl(): boolean
    {
        // Set start point so that we can rewind
        let t = this.GetToken();
        this.RewindTo(t);

        // A class property decl can be preceded by 'private' or 'protected'
        let t1 = this.GetToken();
        if (t1.type != eTokenType.ttPrivate && t1.type != eTokenType.ttProtected)
        {
            this.RewindTo(t1);
        }

        // A variable decl starts with the type
        if (!this.IsType(t1))
        {
            this.RewindTo(t);
            return false;
        }

        // Jump to the token after the type
        this.RewindTo(t1);
        t1 = this.GetToken();

        // The declaration needs to have a name
        if (t1.type != eTokenType.ttIdentifier)
        {
            this.RewindTo(t);
            return false;
        }

        // It can be followed by an initialization
        t1 = this.GetToken();
        if (t1.type == eTokenType.ttEndStatement || t1.type == eTokenType.ttAssignment || t1.type == eTokenType.ttListSeparator)
        {
            this.RewindTo(t);
            return true;
        }
        if (t1.type == eTokenType.ttOpenParanthesis)
        {
            // If the closing parenthesis is followed by a statement block, 
            // function decorator, or end-of-file, then treat it as a function. 
            // A function decl may have nested parenthesis so we need to check 
            // for this too.
            let nest = 0;
            while (t1.type != eTokenType.ttEnd)
            {
                if (t1.type == eTokenType.ttOpenParanthesis)
                {
                    nest++;
                }
                else if (t1.type == eTokenType.ttCloseParanthesis)
                {
                    nest--;
                    if (nest == 0)
                    {
                        break;
                    }
                }
                t1 = this.GetToken();
            }

            if (t1.type == eTokenType.ttEnd)
            {
                this.RewindTo(t);
                return false;
            }
            else
            {
                t1 = this.GetToken();
                this.RewindTo(t);
                if (t1.type == eTokenType.ttStartStatementBlock ||
                    t1.type == eTokenType.ttIdentifier || // function decorator
                    t1.type == eTokenType.ttEnd)
                    return false;
            }

            this.RewindTo(t);
            return true;
        }

        this.RewindTo(t);
        return false;
    }

    // nextToken is only modified if the current position can be interpreted as
    // type, in this case it is set to the next token after the type tokens
    IsType(nextToken: Token): boolean
    {
        // Set a rewind point
        let t = this.GetToken();

        // A type can start with a const
        let t1 = t;
        if (t1.type == eTokenType.ttConst)
            t1 = this.GetToken();

        let t2;
        if (t1.type != eTokenType.ttAuto)
        {
            // The type may be initiated with the scope operator
            if (t1.type == eTokenType.ttScope)
                t1 = this.GetToken();

            // The type may be preceded with a multilevel scope
            t2 = this.GetToken();
            while (t1.type == eTokenType.ttIdentifier)
            {
                if (t2.type == eTokenType.ttScope)
                {
                    t1 = this.GetToken();
                    t2 = this.GetToken();
                    continue;
                }
                else if (t2.type == eTokenType.ttLessThan)
                {
                    // Template types can also be used as scope identifiers
                    this.RewindTo(t2);
                    if (CheckTemplateType(t1))
                    {
                        let t3 = this.GetToken();
                        if (t3.type == eTokenType.ttScope)
                        {
                            t1 = this.GetToken();
                            t2 = this.GetToken();
                            continue;
                        }
                    }
                }

                break;
            }

            this.RewindTo(t2);
        }

        // We don't validate if the identifier is an actual declared type at this moment
        // as it may wrongly identify the statement as a non-declaration if the user typed
        // the name incorrectly. The real type is validated in ParseDeclaration where a
        // proper error message can be given.
        if (!this.IsRealType(t1.type) && t1.type != eTokenType.ttIdentifier && t1.type != eTokenType.ttAuto)
        {
            this.RewindTo(t);
            return false;
        }

        if (!CheckTemplateType(t1))
        {
            this.RewindTo(t);
            return false;
        }

        // Object handles can be interleaved with the array brackets
        // Even though declaring variables with & is invalid we'll accept
        // it here to give an appropriate error message later
        t2 = this.GetToken();
        while (t2.type == eTokenType.ttHandle || t2.type == eTokenType.ttAmp || t2.type == eTokenType.ttOpenBracket)
        {
            if (t2.type == eTokenType.ttHandle)
            {
                // A handle can optionally be read-only
                let t3 = this.GetToken();
                if (t3.type != eTokenType.ttConst)
                    this.RewindTo(t3);
            }
            else if (t2.type == eTokenType.ttOpenBracket)
            {
                t2 = this.GetToken();
                if (t2.type != eTokenType.ttCloseBracket)
                {
                    this.RewindTo(t);
                    return false;
                }
            }

            t2 = this.GetToken();
        }

        // Return the next token so the caller can jump directly to it if desired
        nextToken = t2;

        // Rewind to start point
        this.RewindTo(t);

        return true;
    }

    IsOperator(tokenType: eTokenType): boolean
    {
        if (tokenType == eTokenType.ttPlus ||
            tokenType == eTokenType.ttMinus ||
            tokenType == eTokenType.ttStar ||
            tokenType == eTokenType.ttSlash ||
            tokenType == eTokenType.ttPercent ||
            tokenType == eTokenType.ttStarStar ||
            tokenType == eTokenType.ttAnd ||
            tokenType == eTokenType.ttOr ||
            tokenType == eTokenType.ttXor ||
            tokenType == eTokenType.ttEqual ||
            tokenType == eTokenType.ttNotEqual ||
            tokenType == eTokenType.ttLessThan ||
            tokenType == eTokenType.ttLessThanOrEqual ||
            tokenType == eTokenType.ttGreaterThan ||
            tokenType == eTokenType.ttGreaterThanOrEqual ||
            tokenType == eTokenType.ttAmp ||
            tokenType == eTokenType.ttBitOr ||
            tokenType == eTokenType.ttBitXor ||
            tokenType == eTokenType.ttBitShiftLeft ||
            tokenType == eTokenType.ttBitShiftRight ||
            tokenType == eTokenType.ttBitShiftRightArith ||
            tokenType == eTokenType.ttIs ||
            tokenType == eTokenType.ttNotIs)
            return true;

        return false;
    }

    IsAssignOperator(tokenType: eTokenType): boolean
    {
        if (tokenType == eTokenType.ttAssignment ||
            tokenType == eTokenType.ttAddAssign ||
            tokenType == eTokenType.ttSubAssign ||
            tokenType == eTokenType.ttMulAssign ||
            tokenType == eTokenType.ttDivAssign ||
            tokenType == eTokenType.ttModAssign ||
            tokenType == eTokenType.ttPowAssign ||
            tokenType == eTokenType.ttAndAssign ||
            tokenType == eTokenType.ttOrAssign ||
            tokenType == eTokenType.ttXorAssign ||
            tokenType == eTokenType.ttShiftLeftAssign ||
            tokenType == eTokenType.ttShiftRightLAssign ||
            tokenType == eTokenType.ttShiftRightAAssign)
            return true;

        return false;
    }

    Error()
    {
        this.isSyntaxError = true;
    }
}