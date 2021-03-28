import { eScriptNode, ScriptNode } from './scriptnode';
import {
	TXT_AUTO_NOT_ALLOWED,
	TXT_EXPECTED_CONSTANT,
	TXT_EXPECTED_DATA_TYPE,
	TXT_EXPECTED_EXPRESSION_VALUE,
	TXT_EXPECTED_IDENTIFIER,
	TXT_EXPECTED_METHOD_OR_PROPERTY,
	TXT_EXPECTED_ONE_OF,
	TXT_EXPECTED_OPERATOR,
	TXT_EXPECTED_POST_OPERATOR,
	TXT_EXPECTED_PRE_OPERATOR,
	TXT_EXPECTED_s,
	TXT_EXPECTED_STRING,
	TXT_EXPECTED_s_OR_s,
	TXT_IDENTIFIER_s_NOT_DATA_TYPE,
	TXT_INSTEAD_FOUND_IDENTIFIER_s,
	TXT_INSTEAD_FOUND_KEYWORD_s,
	TXT_INSTEAD_FOUND_s,
	TXT_NONTERMINATED_STRING,
	TXT_UNEXPECTED_END_OF_FILE,
	TXT_UNEXPECTED_TOKEN_s,
	TXT_UNEXPECTED_VAR_DECL,
	TXT_WHILE_PARSING_ARG_LIST,
	TXT_WHILE_PARSING_EXPRESSION,
	TXT_WHILE_PARSING_NAMESPACE,
	TXT_WHILE_PARSING_STATEMENT_BLOCK,
} from './texts';
import { Tokenizer } from './tokenizer';
import {
	ABSTRACT_TOKEN,
	eTokenType,
	EXPLICIT_TOKEN,
	EXTERNAL_TOKEN,
	FINAL_TOKEN,
	FROM_TOKEN,
	FUNCTION_TOKEN,
	GET_TOKEN,
	IF_HANDLE_TOKEN,
	OVERRIDE_TOKEN,
	PROPERTY_TOKEN,
	SET_TOKEN,
	SHARED_TOKEN,
	Token,
} from './tokens';

export abstract class asProblem extends Error {
    constructor(
        public readonly str: string,
        public readonly token: Token,
    ) {
        super(str);
    }
}

export class asError extends asProblem { }
export class asWarning extends asProblem { }
export class asInfo extends asProblem { }

export class Parser
{
    private readonly tokenizer: Tokenizer;
    private isSyntaxError = false;
    private readonly root: ScriptNode;

    // logs
    public readonly infos: asInfo[];
    public readonly warnings: asWarning[];
    public readonly errors: asError[];

    constructor(source: string)
    {
        this.tokenizer = new Tokenizer(source);
        this.root = this.CreateNode(eScriptNode.snScript);
        this.infos = [];
        this.warnings = [];
        this.errors = [];
    }

    GetRootNode() : ScriptNode
    {
        return this.root;
    }

    ParseScript(inBlock = false) : ScriptNode
    {
        let node = this.root;

        while (true)
        {
            while (!this.isSyntaxError)
            {
				const tStart = this.GetToken();

				// Optimize by skipping tokens 'shared', 'external', 'final', 'abstract' so they don't have to be checked in every condition
				let t1 = tStart;
				while (this.tokenizer.IdentifierIs(t1, SHARED_TOKEN)
					|| this.tokenizer.IdentifierIs(t1, EXTERNAL_TOKEN)
					|| this.tokenizer.IdentifierIs(t1, FINAL_TOKEN)
					|| this.tokenizer.IdentifierIs(t1, ABSTRACT_TOKEN)
				) {
					t1 = this.GetToken();
				}

				this.RewindTo(tStart);

				if( t1.type == eTokenType.ttImport )
					node.AddChildLast(this.ParseImport());
				else if(t1.type == eTokenType.ttEnum)
					node.AddChildLast(this.ParseEnumeration());	// Handle enumerations
				else if(t1.type == eTokenType.ttTypedef)
					node.AddChildLast(this.ParseTypedef());		// Handle primitive typedefs
				else if(t1.type == eTokenType.ttClass)
					node.AddChildLast(this.ParseClass());
				else if(t1.type == eTokenType.ttMixin)
					node.AddChildLast(this.ParseMixin());
				else if(t1.type == eTokenType.ttInterface)
					node.AddChildLast(this.ParseInterface());
				else if(t1.type == eTokenType.ttFuncDef)
					node.AddChildLast(this.ParseFuncDef());
				else if(t1.type == eTokenType.ttConst || t1.type == eTokenType.ttScope || t1.type == eTokenType.ttAuto || this.IsDataType(t1) )
				{
					if( this.IsVirtualPropertyDecl() )
						node.AddChildLast(this.ParseVirtualPropertyDecl(false, false));
					else if( this.IsVarDecl() )
						node.AddChildLast(this.ParseDeclaration(false, true));
					else
						node.AddChildLast(this.ParseFunction());
				}
				else if( t1.type == eTokenType.ttEndStatement )
				{
					// Ignore a semicolon by itself
					t1 = this.GetToken();
				}
				else if (t1.type == eTokenType.ttNamespace)
					node.AddChildLast(this.ParseNamespace());
				else if (t1.type == eTokenType.ttEnd)
					return node;
				else if (inBlock && t1.type == eTokenType.ttEndStatementBlock)
					return node;
				else
				{
					let t: string = this.tokenizer.GetDefinition(t1.type);
					if (!t) t = "<unknown token>";

					const str = TXT_UNEXPECTED_TOKEN_s;

					this.Error(str, t1);
				}
            }

            if (this.isSyntaxError)
            {
                // Search for either ';' or '{' or end
                let t1 = this.GetToken();

                while(t1.type != eTokenType.ttEndStatement
                    && t1.type != eTokenType.ttEnd
                    && t1.type != eTokenType.ttStartStatementBlock)
                    t1 = this.GetToken();

                if( t1.type == eTokenType.ttStartStatementBlock )
                {
                    // Find the end of the block and skip nested blocks
                    let level = 1;
                    while(level > 0)
                    {
                        t1 = this.GetToken();
                        if( t1.type == eTokenType.ttStartStatementBlock ) level++;
                        if( t1.type == eTokenType.ttEndStatementBlock ) level--;
                        if( t1.type == eTokenType.ttEnd ) break;
                    }
                }

                this.isSyntaxError = false;
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

	ParseImport(): ScriptNode
	{
		const node = this.CreateNode(eScriptNode.snImport);

		let t = this.GetToken();

		if(t.type != eTokenType.ttImport)
		{
			this.Error(this.ExpectedToken(this.tokenizer.GetDefinition(eTokenType.ttImport)), t);
			this.Error(this.InsteadFound(t), t);
			return node;
		}

		node.SetToken(t);
		node.UpdateSourcePosition(t.pos, t.length);

		node.AddChildLast(this.ParseFunctionDefinition());
		if(this.isSyntaxError) return node;

		t = this.GetToken();
		if( t.type != eTokenType.ttIdentifier )
		{
			this.Error(this.ExpectedToken(FROM_TOKEN), t);
			this.Error(this.InsteadFound(t), t);
			return node;
		}

		/**
		 *
		 * tempString.Assign(&script->code[t.pos], t.length);
		 * if( tempString != FROM_TOKEN )
		 * {
		 * 	Error(ExpectedToken(FROM_TOKEN), &t);
		 * 	Error(InsteadFound(t), &t);
		 * 	return node;
		 * }
		 *
		 */
		if(this.tokenizer.source.source.substr(t.pos, t.length) != FROM_TOKEN)
		{
			this.Error(this.ExpectedToken(FROM_TOKEN), t);
			this.Error(this.InsteadFound(t), t);
			return node;
		}

		node.UpdateSourcePosition(t.pos, t.length);

		t = this.GetToken();
		if( t.type != eTokenType.ttStringConstant )
		{
			this.Error(TXT_EXPECTED_STRING, t);
			this.Error(this.InsteadFound(t), t);
			return node;
		}

		const mod = this.CreateNode(eScriptNode.snConstant);

		node.AddChildLast(mod);

		mod.SetToken(t);
		mod.UpdateSourcePosition(t.pos, t.length);

		t = this.GetToken();
		if( t.type != eTokenType.ttEndStatement )
		{
			this.Error(this.ExpectedToken(this.tokenizer.GetDefinition(eTokenType.ttEndStatement)), t);
			this.Error(this.InsteadFound(t), t);
			return node;
		}

		node.UpdateSourcePosition(t.pos, t.length);

		return node;
	}

	ParseNamespace(): ScriptNode
	{
		const node = this.CreateNode(eScriptNode.snNamespace);

		let t1 = this.GetToken();

		if(t1.type == eTokenType.ttNamespace)
			node.UpdateSourcePosition(t1.pos, t1.length);
		else
		{
			this.Error(this.ExpectedToken(this.tokenizer.GetDefinition(eTokenType.ttNamespace)), t1);
			this.Error(this.InsteadFound(t1), t1);
		}

		// TODO: namespace: Allow declaration of multiple nested namespace with namespace A::B::C { }
		node.AddChildLast(this.ParseIdentifier());
		if (this.isSyntaxError) return node;

		t1 = this.GetToken();
		if (t1.type == eTokenType.ttStartStatementBlock)
			node.UpdateSourcePosition(t1.pos, t1.length);
		else
		{
			this.Error(this.ExpectedToken(this.tokenizer.GetDefinition(eTokenType.ttStartStatementBlock)), t1);
			this.Error(this.InsteadFound(t1), t1);
			return node;
		}

		let start = t1;

		node.AddChildLast(this.ParseScript(true));

		if (!this.isSyntaxError)
		{
			t1 = this.GetToken();
			if (t1.type == eTokenType.ttEndStatementBlock)
				node.UpdateSourcePosition(t1.pos, t1.length);
			else
			{
				if (t1.type == eTokenType.ttEnd)
					this.Error(TXT_UNEXPECTED_END_OF_FILE, t1);
				else
				{
					this.Error(this.ExpectedToken(this.tokenizer.GetDefinition(eTokenType.ttEndStatementBlock)), t1);
					this.Error(this.InsteadFound(t1), t1);
				}
				this.Info(TXT_WHILE_PARSING_NAMESPACE, start);
				return node;
			}
		}

		return node;
	}

	ParseEnumeration(): ScriptNode
	{
		let ident: ScriptNode;
		let dataType: ScriptNode;

		const node = this.CreateNode(eScriptNode.snEnum);

		let token = this.GetToken();

		while( this.IdentifierIs(token, SHARED_TOKEN) ||
			   this.IdentifierIs(token, EXTERNAL_TOKEN) )
		{
			this.RewindTo(token);
			node.AddChildLast(this.ParseIdentifier());
			if( this.isSyntaxError ) return node;

			token = this.GetToken();
		}

		// Check for enum
		if( token.type != eTokenType.ttEnum )
		{
			this.Error(this.ExpectedToken(this.tokenizer.GetDefinition(eTokenType.ttEnum)), token);
			this.Error(this.InsteadFound(token), token);
			return node;
		}

		node.SetToken(token);
		node.UpdateSourcePosition(token.pos, token.length);

		// Get the identifier
		token = this.GetToken();
		if(eTokenType.ttIdentifier != token.type)
		{
			this.Error(TXT_EXPECTED_IDENTIFIER, token);
			this.Error(this.InsteadFound(token), token);
			return node;
		}

		dataType = this.CreateNode(eScriptNode.snDataType);

		node.AddChildLast(dataType);

		ident = this.CreateNode(eScriptNode.snIdentifier);

		ident.SetToken(token);
		ident.UpdateSourcePosition(token.pos, token.length);
		dataType.AddChildLast(ident);

		// External shared declarations are ended with ';'
		token = this.GetToken();
		if (token.type == eTokenType.ttEndStatement)
		{
			this.RewindTo(token);
			node.AddChildLast(this.ParseToken(eTokenType.ttEndStatement));
			return node;
		}

		// check for the start of the declaration block
		if(token.type != eTokenType.ttStartStatementBlock)
		{
			this.RewindTo(token);
			const tokens = [eTokenType.ttStartStatementBlock, eTokenType.ttEndStatement];
			this.Error(this.ExpectedOneOf(tokens), token);
			this.Error(this.InsteadFound(token), token);
			return node;
		}

		while((eTokenType.ttEnd as any) != token.type)
		{
			token = this.GetToken();

			if(eTokenType.ttEndStatementBlock == token.type)
			{
				this.RewindTo(token);
				break;
			}

			if(eTokenType.ttIdentifier != token.type)
			{
				this.Error(TXT_EXPECTED_IDENTIFIER, token);
				this.Error(this.InsteadFound(token), token);
				return node;
			}

			// Add the enum element
			ident = this.CreateNode(eScriptNode.snIdentifier);

			ident.SetToken(token);
			ident.UpdateSourcePosition(token.pos, token.length);
			node.AddChildLast(ident);

			token = this.GetToken();

			if(token.type == eTokenType.ttAssignment)
			{
				this.RewindTo(token);

				const tmp = this.SuperficiallyParseVarInit();

				node.AddChildLast(tmp);
				if( this.isSyntaxError ) return node;

				token = this.GetToken();
			}

			if(eTokenType.ttListSeparator != token.type)
			{
				this.RewindTo(token);
				break;
			}
		}

		// check for the end of the declaration block
		token = this.GetToken();
		if(token.type != eTokenType.ttEndStatementBlock)
		{
			this.RewindTo(token);
			this.Error(this.ExpectedToken("}"), token);
			this.Error(this.InsteadFound(token), token);
			return node;
		}

		return node;
	}

	ParseTypedef(): ScriptNode
	{
		// Create the typedef node
		const node = this.CreateNode(eScriptNode.snTypedef);

		let token = this.GetToken();

		if(token.type != eTokenType.ttTypedef)
		{
			this.Error(this.ExpectedToken(this.tokenizer.GetDefinition(eTokenType.ttTypedef)), token);
			this.Error(this.InsteadFound(token), token);
			return node;
		}

		node.SetToken(token);
		node.UpdateSourcePosition(token.pos, token.length);

		// Parse the base type
		token = this.GetToken();
		this.RewindTo(token);

		// Make sure it is a primitive type (except ttVoid)
		if(!this.IsRealType(token.type) || token.type == eTokenType.ttVoid)
		{
			const str = TXT_UNEXPECTED_TOKEN_s.Format(this.tokenizer.GetDefinition(token.type));
			this.Error(str, token);
			return node;
		}

		node.AddChildLast(this.ParseRealType());
		node.AddChildLast(this.ParseIdentifier());

		// Check for the end of the typedef
		token = this.GetToken();
		if(token.type != eTokenType.ttEndStatement)
		{
			this.RewindTo(token);
			this.Error(this.ExpectedToken(this.tokenizer.GetDefinition(token.type)), token);
			this.Error(this.InsteadFound(token), token);
		}

		return node;
	}

	ParseRealType(): ScriptNode
	{
		const node = this.CreateNode(eScriptNode.snDataType);

		let t1 = this.GetToken();

		if (!this.IsRealType(t1.type))
		{
			this.Error(TXT_EXPECTED_DATA_TYPE, t1);
			this.Error(this.InsteadFound(t1), t1);
			return node;
		}

		node.SetToken(t1);
		node.UpdateSourcePosition(t1.pos, t1.length);

		return node;
	}

	ParseFunctionDefinition(): ScriptNode
	{
		const node = this.CreateNode(eScriptNode.snFunction);

		node.AddChildLast(this.ParseType(true));
		if (this.isSyntaxError) return node;

		node.AddChildLast(this.ParseTypeMod(false));
		if (this.isSyntaxError) return node;

		this.ParseOptionalScope(node);

		node.AddChildLast(this.ParseIdentifier());
		if (this.isSyntaxError) return node;

		node.AddChildLast(this.ParseParameterList());
		if (this.isSyntaxError) return node;

		// Parse an optional 'const' after the function definition (used for object methods)
		let t1 = this.GetToken();
		this.RewindTo(t1);

		if (t1.type == eTokenType.ttConst)
			node.AddChildLast(this.ParseToken(eTokenType.ttConst));

		// Parse optional attributes
		this.ParseMethodAttributes(node);

		return node;
	}

	ParseClass(): ScriptNode
	{
		const node = this.CreateNode(eScriptNode.snClass);

		let t = this.GetToken();

		// Allow the keywords 'shared', 'abstract', 'final', and 'external' before 'class'
		while (this.IdentifierIs(t, SHARED_TOKEN)
			|| this.IdentifierIs(t, ABSTRACT_TOKEN)
			|| this.IdentifierIs(t, FINAL_TOKEN)
			|| this.IdentifierIs(t, EXTERNAL_TOKEN)
		) {
			this.RewindTo(t);
			node.AddChildLast(this.ParseIdentifier());
			t = this.GetToken();
		}

		if( t.type != eTokenType.ttClass )
		{
			this.Error(this.ExpectedToken("class"), t);
			this.Error(this.InsteadFound(t), t);
			return node;
		}

		node.SetToken(t);

		/**
		 * if( engine->ep.allowImplicitHandleTypes )
		 * {
		 * 	// Parse 'implicit handle class' construct
		 * 	GetToken(&t);

		 * 	if ( t.type == ttHandle )
		 * 		node->SetToken(&t);
		 * 	else
		 * 		RewindTo(&t);
		 * }
		 */

		node.AddChildLast(this.ParseIdentifier());

		// External shared declarations are ended with ';'
		t = this.GetToken();

		if (t.type == eTokenType.ttEndStatement)
		{
			this.RewindTo(t);
			node.AddChildLast(this.ParseToken(eTokenType.ttEndStatement));
			return node;
		}

		// Optional list of interfaces that are being implemented and classes that are being inherited
		if (t.type == eTokenType.ttColon)
		{
			let inherit = this.CreateNode(eScriptNode.snIdentifier);
			node.AddChildLast(inherit);

			this.ParseOptionalScope(inherit);
			inherit.AddChildLast(this.ParseIdentifier());
			t = this.GetToken();

			while( t.type == eTokenType.ttListSeparator )
			{
				inherit = this.CreateNode(eScriptNode.snIdentifier);
				node.AddChildLast(inherit);

				this.ParseOptionalScope(inherit);
				inherit.AddChildLast(this.ParseIdentifier());
				t = this.GetToken();
			}
		}

		if (t.type != eTokenType.ttStartStatementBlock)
		{
			this.Error(this.ExpectedToken("{"), t);
			this.Error(this.InsteadFound(t), t);
			return node;
		}

		// Parse properties
		t = this.GetToken();
		this.RewindTo(t);

		while (t.type != eTokenType.ttEndStatementBlock && t.type != eTokenType.ttEnd)
		{
			// Is it a property or a method?
			if (t.type == eTokenType.ttFuncDef)
				node.AddChildLast(this.ParseFuncDef());
			else if(this.IsFuncDecl(true))
				node.AddChildLast(this.ParseFunction(true));
			else if(this.IsVirtualPropertyDecl())
				node.AddChildLast(this.ParseVirtualPropertyDecl(true, false));
			else if(this.IsVarDecl())
				node.AddChildLast(this.ParseDeclaration(true));
			else if(t.type == eTokenType.ttEndStatement)
				// Skip empty declarations
				t = this.GetToken();
			else
			{
				this.Error(TXT_EXPECTED_METHOD_OR_PROPERTY, t);
				this.Error(this.InsteadFound(t), t);
				return node;
			}

			if(this.isSyntaxError)
				return node;

			t = this.GetToken();
			this.RewindTo(t);
		}

		t = this.GetToken();

		if(t.type != eTokenType.ttEndStatementBlock)
		{
			this.Error(this.ExpectedToken("}"), t);
			this.Error(this.InsteadFound(t), t);
			return node;
		}

		node.UpdateSourcePosition(t.pos, t.length);

		return node;
	}

	ParseMixin(): ScriptNode
	{
		const node = this.CreateNode(eScriptNode.snMixin);

		let t = this.GetToken();

		if(t.type != eTokenType.ttMixin)
		{
			this.Error(this.ExpectedToken("mixin"), t);
			this.Error(this.InsteadFound(t), t);
			return node;
		}

		node.SetToken(t);

		// A mixin token must be followed by a class declaration
		node.AddChildLast(this.ParseClass());

		return node;
	}

	ParseInterface(): ScriptNode
	{
		const node = this.CreateNode(eScriptNode.snInterface);

		// Allow keywords 'external' and 'shared' before 'interface'
		let t = this.GetToken();

		while (this.IdentifierIs(t, SHARED_TOKEN)
			|| this.IdentifierIs(t, EXTERNAL_TOKEN)
		) {
			this.RewindTo(t);
			node.AddChildLast(this.ParseIdentifier());
			if (this.isSyntaxError) return node;

			t = this.GetToken();
		}

		if(t.type != eTokenType.ttInterface)
		{
			this.Error(this.ExpectedToken("interface"), t);
			this.Error(this.InsteadFound(t), t);
			return node;
		}

		node.SetToken(t);
		node.AddChildLast(this.ParseIdentifier());

		// External shared declarations are ended with ';'
		t = this.GetToken();
		if (t.type == eTokenType.ttEndStatement)
		{
			this.RewindTo(t);
			node.AddChildLast(this.ParseToken(eTokenType.ttEndStatement));
			return node;
		}

		// Can optionally have a list of interfaces that are inherited
		if(t.type == eTokenType.ttColon)
		{
			let inherit = this.CreateNode(eScriptNode.snIdentifier);
			node.AddChildLast(inherit);

			this.ParseOptionalScope(inherit);
			inherit.AddChildLast(this.ParseIdentifier());
			t = this.GetToken();

			while (t.type == eTokenType.ttListSeparator)
			{
				inherit = this.CreateNode(eScriptNode.snIdentifier);
				node.AddChildLast(inherit);

				this.ParseOptionalScope(inherit);
				inherit.AddChildLast(this.ParseIdentifier());
				t = this.GetToken();
			}
		}

		if(t.type != eTokenType.ttStartStatementBlock)
		{
			this.Error(this.ExpectedToken("{"), t);
			this.Error(this.InsteadFound(t), t);
			return node;
		}

		// Parse interface methods
		t = this.GetToken();
		this.RewindTo(t);

		while (t.type != eTokenType.ttEndStatementBlock && t.type != eTokenType.ttEnd)
		{
			if(this.IsVirtualPropertyDecl())
				node.AddChildLast(this.ParseVirtualPropertyDecl(true, true));
			else if(t.type == eTokenType.ttEndStatement)
				// Skip empty declarations
				t = this.GetToken();
			else
				// Parse the method signature
				node.AddChildLast(this.ParseInterfaceMethod());

			if(this.isSyntaxError) return node;

			t = this.GetToken();
			this.RewindTo(t);
		}

		t = this.GetToken();
		if (t.type != eTokenType.ttEndStatementBlock)
		{
			this.Error(this.ExpectedToken("}"), t);
			this.Error(this.InsteadFound(t), t);
			return node;
		}

		node.UpdateSourcePosition(t.pos, t.length);

		return node;
	}

	ParseInterfaceMethod(): ScriptNode
	{
		const node = this.CreateNode(eScriptNode.snFunction);

		node.AddChildLast(this.ParseType(true));
		if( this.isSyntaxError ) return node;

		node.AddChildLast(this.ParseTypeMod(false));
		if( this.isSyntaxError ) return node;

		node.AddChildLast(this.ParseIdentifier());
		if( this.isSyntaxError ) return node;

		node.AddChildLast(this.ParseParameterList());
		if( this.isSyntaxError ) return node;

		// Parse an optional const after the method definition
		let t1 = this.GetToken();
		this.RewindTo(t1);
		if( t1.type == eTokenType.ttConst )
			node.AddChildLast(this.ParseToken(eTokenType.ttConst));

		t1 = this.GetToken();
		if( t1.type != eTokenType.ttEndStatement )
		{
			this.Error(this.ExpectedToken(";"), t1);
			this.Error(this.InsteadFound(t1), t1);
			return node;
		}

		node.UpdateSourcePosition(t1.pos, t1.length);

		return node;
	}

	ParseFuncDef(): ScriptNode
	{
		const node = this.CreateNode(eScriptNode.snFuncDef);

		// Allow keywords 'external' and 'shared' before 'interface'
		let t1 = this.GetToken();

		while (this.IdentifierIs(t1, SHARED_TOKEN) ||
			   this.IdentifierIs(t1, EXTERNAL_TOKEN))
		{
			this.RewindTo(t1);
			node.AddChildLast(this.ParseIdentifier());
			if (this.isSyntaxError) return node;

			t1 = this.GetToken();
		}

		if (t1.type != eTokenType.ttFuncDef)
		{
			this.Error(this.tokenizer.GetDefinition(eTokenType.ttFuncDef), t1);
			return node;
		}

		node.SetToken(t1);
		node.AddChildLast(this.ParseType(true));
		if (this.isSyntaxError) return node;

		node.AddChildLast(this.ParseTypeMod(false));
		if(this.isSyntaxError) return node;

		node.AddChildLast(this.ParseIdentifier());
		if(this.isSyntaxError) return node;

		node.AddChildLast(this.ParseParameterList());
		if(this.isSyntaxError) return node;

		t1 = this.GetToken();
		if( t1.type != eTokenType.ttEndStatement )
		{
			this.Error(this.ExpectedToken(this.tokenizer.GetDefinition(eTokenType.ttEndStatement)), t1);
			this.Error(this.InsteadFound(t1), t1);
			return node;
		}

		node.UpdateSourcePosition(t1.pos, t1.length);

		return node;
	}

	ParseVirtualPropertyDecl(isMethod: boolean, isInterface: boolean): ScriptNode
	{
		const node = this.CreateNode(eScriptNode.snVirtualProperty);

		let t1 = this.GetToken();
		/*let t2 = */this.GetToken();
		this.RewindTo(t1);

		// A class method can start with 'private' or 'protected'
		if(isMethod && t1.type == eTokenType.ttPrivate)
			node.AddChildLast(this.ParseToken(eTokenType.ttPrivate));
		else if( isMethod && t1.type == eTokenType.ttProtected )
			node.AddChildLast(this.ParseToken(eTokenType.ttProtected));
		if(this.isSyntaxError) return node;

		node.AddChildLast(this.ParseType(true));
		if(this.isSyntaxError) return node;

		node.AddChildLast(this.ParseTypeMod(false));
		if(this.isSyntaxError) return node;

		node.AddChildLast(this.ParseIdentifier());
		if(this.isSyntaxError) return node;

		t1 = this.GetToken();

		if (t1.type != eTokenType.ttStartStatementBlock)
		{
			this.Error(this.ExpectedToken("{"), t1);
			this.Error(this.InsteadFound(t1), t1);
			return node;
		}

		for(;;)
		{
			t1 = this.GetToken();
			 let accessorNode: ScriptNode = null;

			if(this.IdentifierIs(t1, GET_TOKEN) || this.IdentifierIs(t1, SET_TOKEN))
			{
				accessorNode = this.CreateNode(eScriptNode.snVirtualProperty);

				node.AddChildLast(accessorNode);

				this.RewindTo(t1);
				accessorNode.AddChildLast(this.ParseIdentifier());

				if (isMethod)
				{
					t1 = this.GetToken();
					this.RewindTo(t1);

					if (t1.type == eTokenType.ttConst)
						accessorNode.AddChildLast(this.ParseToken(eTokenType.ttConst));

					if (!isInterface)
					{
						this.ParseMethodAttributes(accessorNode);
						if (this.isSyntaxError) return node;
					}
				}

				if (!isInterface)
				{
					t1 = this.GetToken();
					if (t1.type == eTokenType.ttStartStatementBlock)
					{
						this.RewindTo(t1);
						accessorNode.AddChildLast(this.SuperficiallyParseStatementBlock());
						if (this.isSyntaxError) return node;
					}
					else if (t1.type != eTokenType.ttEndStatement)
					{
						this.Error(this.ExpectedTokens(";", "{"), t1);
						this.Error(this.InsteadFound(t1), t1);
						return node;
					}
				}
				else
				{
					t1 = this.GetToken();
					if (t1.type != eTokenType.ttEndStatement)
					{
						this.Error(this.ExpectedToken(";"), t1);
						this.Error(this.InsteadFound(t1), t1);
						return node;
					}
				}
			}
			else if (t1.type == eTokenType.ttEndStatementBlock)
				break;
			else
			{
				const tokens: string[] = [GET_TOKEN, SET_TOKEN, this.tokenizer.GetDefinition(eTokenType.ttEndStatementBlock)];
				this.Error(this.ExpectedOneOf(tokens), t1);
				this.Error(this.InsteadFound(t1), t1);
				return node;
			}
		}

		return node;
	}

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

        if (!isMethod || (token.type != eTokenType.ttBitNot && token2.type != eTokenType.ttOpenParanthesis))
        {
            node.AddChildLast(this.ParseType(true));
            if (this.isSyntaxError) return node;

            var typemod = this.ParseTypeMod(false);
            if (typemod)
            {
                node.AddChildLast(typemod);
            }

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

    ParseMethodAttributes(funcNode: ScriptNode): void
    {
        let t1;

        for (; ;)
        {
            t1 = this.GetToken();
            this.RewindTo(t1);

            if (this.IdentifierIs(t1, FINAL_TOKEN) ||
                this.IdentifierIs(t1, OVERRIDE_TOKEN) ||
                this.IdentifierIs(t1, EXPLICIT_TOKEN) ||
                this.IdentifierIs(t1, PROPERTY_TOKEN))
                funcNode.AddChildLast(this.ParseIdentifier());
            else
                break;
        }
    }

	SuperficiallyParseVarInit(): ScriptNode
	{
		const node = this.CreateNode(eScriptNode.snAssignment);

		let t = this.GetToken();
		node.UpdateSourcePosition(t.pos, t.length);

		if (t.type == eTokenType.ttAssignment)
		{
			t = this.GetToken();

			const start = t;

			// Find the end of the expression
			let indentParan = 0;
			let indentBrace = 0;

			while( indentParan || indentBrace || (t.type != eTokenType.ttListSeparator && t.type != eTokenType.ttEndStatement && t.type != eTokenType.ttEndStatementBlock) )
			{
				if( t.type == eTokenType.ttOpenParanthesis )
					indentParan++;
				else if( t.type == eTokenType.ttCloseParanthesis )
					indentParan--;
				else if( t.type == eTokenType.ttStartStatementBlock )
					indentBrace++;
				else if( t.type == eTokenType.ttEndStatementBlock )
					indentBrace--;
				else if( t.type == eTokenType.ttNonTerminatedStringConstant )
				{
					this.Error(TXT_NONTERMINATED_STRING, t);
					break;
				}
				else if( t.type == eTokenType.ttEnd )
				{
					this.Error(TXT_UNEXPECTED_END_OF_FILE, t);
					this.Info(TXT_WHILE_PARSING_EXPRESSION, start);
					break;
				}
				t = this.GetToken();
			}

			// Rewind so that the next token read is the list separator, end statement, or end statement block
			this.RewindTo(t);
		}
		else if( t.type == eTokenType.ttOpenParanthesis )
		{
			const start = t;

			// Find the end of the argument list
			let indent = 1;

			while (indent)
			{
				t = this.GetToken();
				if (t.type == eTokenType.ttOpenParanthesis)
					indent++;
				else if(t.type == eTokenType.ttCloseParanthesis)
					indent--;
				else if(t.type == eTokenType.ttNonTerminatedStringConstant)
				{
					this.Error(TXT_NONTERMINATED_STRING, t);
					break;
				}
				else if(t.type == eTokenType.ttEnd)
				{
					this.Error(TXT_UNEXPECTED_END_OF_FILE, t);
					this.Info(TXT_WHILE_PARSING_ARG_LIST, start);
					break;
				}
			}
		}
		else
		{
			const tokens = [eTokenType.ttAssignment, eTokenType.ttOpenParanthesis];
			this.Error(this.ExpectedOneOf(tokens), t);
			this.Error(this.InsteadFound(t), t);
		}

		return node;
	}

	SuperficiallyParseStatementBlock(): ScriptNode
	{
		const node = this.CreateNode(eScriptNode.snStatementBlock);

		// This function will only superficially parse the statement block in order to find the end of it
		let t1 = this.GetToken();
		if(t1.type != eTokenType.ttStartStatementBlock)
		{
			this.Error(this.ExpectedToken("{"), t1);
			this.Error(this.InsteadFound(t1), t1);
			return node;
		}

		node.UpdateSourcePosition(t1.pos, t1.length);

		const start = t1;

		let level = 1;

		while( level > 0 && !this.isSyntaxError )
		{
			t1 = this.GetToken();
			if( t1.type == eTokenType.ttEndStatementBlock )
				level--;
			else if( t1.type == eTokenType.ttStartStatementBlock )
				level++;
			else if( t1.type == eTokenType.ttNonTerminatedStringConstant )
			{
				this.Error(TXT_NONTERMINATED_STRING, t1);
				break;
			}
			else if( t1.type == eTokenType.ttEnd )
			{
				this.Error(TXT_UNEXPECTED_END_OF_FILE, t1);
				this.Info(TXT_WHILE_PARSING_STATEMENT_BLOCK, start);
				break;
			}
		}

		node.UpdateSourcePosition(t1.pos, t1.length);

		return node;
	}

    ParseStatementBlock(): ScriptNode
    {
        let node = this.CreateNode(eScriptNode.snStatementBlock);

        let t1 = this.GetToken();

        if (t1.type != eTokenType.ttStartStatementBlock)
        {
			this.Error(this.ExpectedToken("{"), t1);
			this.Error(this.InsteadFound(t1), t1);
            return node;
        }

        let start = t1;

        node.UpdateSourcePosition(t1.pos, t1.length);

        for (;;)
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
					this.Error(TXT_UNEXPECTED_END_OF_FILE, t1);
					this.Info(TXT_WHILE_PARSING_STATEMENT_BLOCK, start);
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
				this.Error(TXT_UNEXPECTED_VAR_DECL, t1);
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
			this.Error(this.ExpectedToken("if"), t);
			this.Error(this.InsteadFound(t), t);
            return node;
        }

        node.UpdateSourcePosition(t.pos, t.length);

        t = this.GetToken();
        if (t.type != eTokenType.ttOpenParanthesis)
        {
			this.Error(this.ExpectedToken("("), t);
			this.Error(this.InsteadFound(t), t);
            return node;
        }

        node.AddChildLast(this.ParseAssignment());
        if (this.isSyntaxError) return node;

        t = this.GetToken();

        if (t.type != eTokenType.ttCloseParanthesis)
        {
			this.Error(this.ExpectedToken(")"), t);
			this.Error(this.InsteadFound(t), t);
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
			this.Error(this.ExpectedToken("for"), t);
			this.Error(this.InsteadFound(t), t);
            return node;
        }

        node.UpdateSourcePosition(t.pos, t.length);

        t = this.GetToken();
        if (t.type != eTokenType.ttOpenParanthesis)
        {
			this.Error(this.ExpectedToken("("), t);
			this.Error(this.InsteadFound(t), t);
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
					const tokens = [",", ")"];
					this.Error(this.ExpectedOneOf(tokens), t);
					this.Error(this.InsteadFound(t), t);
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
			this.Error(this.ExpectedToken("while"), t);
			this.Error(this.InsteadFound(t), t);
            return node;
        }

        node.UpdateSourcePosition(t.pos, t.length);

        t = this.GetToken();
        if (t.type != eTokenType.ttOpenParanthesis)
        {
			this.Error(this.ExpectedToken("("), t);
			this.Error(this.InsteadFound(t), t);
            return node;
        }

        node.AddChildLast(this.ParseAssignment());
        if (this.isSyntaxError) return node;

        t = this.GetToken();
        if (t.type != eTokenType.ttCloseParanthesis)
        {
			this.Error(this.ExpectedToken(")"), t);
			this.Error(this.InsteadFound(t), t);
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
			this.Error(this.ExpectedToken("return"), t);
			this.Error(this.InsteadFound(t), t);
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
			this.Error(this.ExpectedToken(";"), t);
			this.Error(this.InsteadFound(t), t);
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
			this.Error(this.ExpectedToken("break"), t);
			this.Error(this.InsteadFound(t), t);
            return node;
        }

        node.UpdateSourcePosition(t.pos, t.length);

        t = this.GetToken();
        if (t.type != eTokenType.ttEndStatement)
        {
			this.Error(this.ExpectedToken(";"), t);
			this.Error(this.InsteadFound(t), t);
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
			this.Error(this.ExpectedToken("continue"), t);
			this.Error(this.InsteadFound(t), t);
            return node;
        }

        node.UpdateSourcePosition(t.pos, t.length);

        t = this.GetToken();
        if (t.type != eTokenType.ttEndStatement)
        {
			this.Error(this.ExpectedToken(";"), t);
			this.Error(this.InsteadFound(t), t);
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
			this.Error(this.ExpectedToken("do"), t);
			this.Error(this.InsteadFound(t), t);
            return node;
        }

        node.UpdateSourcePosition(t.pos, t.length);

        node.AddChildLast(this.ParseStatement());
        if (this.isSyntaxError) return node;

        t = this.GetToken();
        if (t.type != eTokenType.ttWhile)
        {
			this.Error(this.ExpectedToken("while"), t);
			this.Error(this.InsteadFound(t), t);
            return node;
        }

        t = this.GetToken();
        if (t.type != eTokenType.ttOpenParanthesis)
        {
			this.Error(this.ExpectedToken("("), t);
			this.Error(this.InsteadFound(t), t);
            return node;
        }

        node.AddChildLast(this.ParseAssignment());
        if (this.isSyntaxError) return node;

        t = this.GetToken();
        if (t.type != eTokenType.ttCloseParanthesis)
        {
			this.Error(this.ExpectedToken(")"), t);
			this.Error(this.InsteadFound(t), t);
            return node;
        }

        t = this.GetToken();
        if (t.type != eTokenType.ttEndStatement)
        {
			this.Error(this.ExpectedToken(";"), t);
			this.Error(this.InsteadFound(t), t);
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
			this.Error(this.ExpectedToken("switch"), t);
			this.Error(this.InsteadFound(t), t);
            return node;
        }

        node.UpdateSourcePosition(t.pos, t.length);

        t = this.GetToken();
        if (t.type != eTokenType.ttOpenParanthesis)
        {
			this.Error(this.ExpectedToken("("), t);
			this.Error(this.InsteadFound(t), t);
            return node;
        }

        node.AddChildLast(this.ParseAssignment());
        if (this.isSyntaxError) return node;

        t = this.GetToken();
        if (t.type != eTokenType.ttCloseParanthesis)
        {
			this.Error(this.ExpectedToken(")"), t);
			this.Error(this.InsteadFound(t), t);
            return node;
        }

        t = this.GetToken();
        if (t.type != eTokenType.ttStartStatementBlock)
        {
			this.Error(this.ExpectedToken("{"), t);
			this.Error(this.InsteadFound(t), t);
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
				const tokens = ["case", "default"];
				this.Error(this.ExpectedOneOf(tokens), t);
				this.Error(this.InsteadFound(t), t);
                return node;
            }

            node.AddChildLast(this.ParseCase());
            if (this.isSyntaxError) return node;
        }

        if (t.type != eTokenType.ttEndStatementBlock)
        {
			this.Error(this.ExpectedToken("}"), t);
			this.Error(this.InsteadFound(t), t);
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
			this.Error(this.ExpectedTokens("case", "default"), t);
			this.Error(this.InsteadFound(t), t);
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
			this.Error(this.ExpectedToken(":"), t);
			this.Error(this.InsteadFound(t), t);
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
			this.Error(this.ExpectedToken("try"), t);
			this.Error(this.InsteadFound(t), t);
            return node;
        }

        node.UpdateSourcePosition(t.pos, t.length);

        node.AddChildLast(this.ParseStatementBlock());
        if (this.isSyntaxError) return node;

        t = this.GetToken();
        if (t.type != eTokenType.ttCatch)
        {
			this.Error(this.ExpectedToken("catch"), t);
			this.Error(this.InsteadFound(t), t);
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

        for (; ;)
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
                    // node.AddChildLast(this.SuperficiallyParseVarInit());
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
            t = this.GetToken();
            if (t.type == eTokenType.ttListSeparator)
                continue;
            else if (t.type == eTokenType.ttEndStatement)
            {
                node.UpdateSourcePosition(t.pos, t.length);
                return node;
            }
            else
            {
				this.Error(this.ExpectedTokens(",", ";"), t);
				this.Error(this.InsteadFound(t), t);
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
			this.Error(this.ExpectedToken("("), t1);
			this.Error(this.InsteadFound(t1), t1);
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

                let typemod = this.ParseTypeMod(true)
                if (typemod)
                {
                    node.AddChildLast(typemod);
                }

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
					this.Error(this.ExpectedTokens(")", ","), t1);
					this.Error(this.InsteadFound(t1), t1);
                    return node;
                }
            }
        }
    }

    ParseInitList(): ScriptNode
    {
        let node = this.CreateNode(eScriptNode.snInitList);

        let t1 = this.GetToken();
        if (t1.type != eTokenType.ttStartStatementBlock)
        {
			this.Error(this.ExpectedToken("{"), t1);
			this.Error(this.InsteadFound(t1), t1);
            return node;
        }

        node.UpdateSourcePosition(t1.pos, t1.length);

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
            for (; ;)
            {
                t1 = this.GetToken();
                if (t1.type == eTokenType.ttListSeparator)
                {
                    // No expression
                    node.AddChildLast(this.CreateNode(eScriptNode.snUndefined));
                    node.lastChild?.UpdateSourcePosition(t1.pos, 1);

                    t1 = this.GetToken();
                    if (t1.type == eTokenType.ttEndStatementBlock)
                    {
                        // No expression
                        node.AddChildLast(this.CreateNode(eScriptNode.snUndefined));
                        node.lastChild?.UpdateSourcePosition(t1.pos, 1);
                        node.UpdateSourcePosition(t1.pos, t1.length);
                        return node;
                    }

                    this.RewindTo(t1);
                }
                else if (t1.type == eTokenType.ttEndStatementBlock)
                {
                    // No expression
                    node.AddChildLast(this.CreateNode(eScriptNode.snUndefined));
                    node.lastChild?.UpdateSourcePosition(t1.pos, 1);
                    node.UpdateSourcePosition(t1.pos, t1.length);

                    // Statement block is finished
                    return node;
                }
                else if (t1.type == eTokenType.ttStartStatementBlock)
                {
                    this.RewindTo(t1);
                    node.AddChildLast(this.ParseInitList());
                    if (this.isSyntaxError) return node;

                    t1 = this.GetToken();
                    if (t1.type == eTokenType.ttListSeparator)
                        continue;
                    else if (t1.type == eTokenType.ttEndStatementBlock)
                    {
                        node.UpdateSourcePosition(t1.pos, t1.length);

                        // Statement block is finished
                        return node;
                    }
                    else
                    {
						this.Error(this.ExpectedTokens("}", ","), t1);
						this.Error(this.InsteadFound(t1), t1);
                        return node;
                    }
                }
                else
                {
                    this.RewindTo(t1);
                    node.AddChildLast(this.ParseAssignment());
                    if (this.isSyntaxError) return node;

                    t1 = this.GetToken();
                    if (t1.type == eTokenType.ttListSeparator)
                        continue;
                    else if (t1.type == eTokenType.ttEndStatementBlock)
                    {
                        node.UpdateSourcePosition(t1.pos, t1.length);

                        // Statement block is finished
                        return node;
                    }
                    else
                    {
						this.Error(this.ExpectedTokens("}", ","), t1);
						this.Error(this.InsteadFound(t1), t1);
                        return node;
                    }
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
				this.Error(this.ExpectedToken(":"), t);
				this.Error(this.InsteadFound(t), t);
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
			this.Error(this.ExpectedToken(";"), t);
			this.Error(this.InsteadFound(t), t);
            return node;
        }

        node.UpdateSourcePosition(t.pos, t.length);

        return node;
    }

    ParseExpression(): ScriptNode
    {
        let node = this.CreateNode(eScriptNode.snExpression);

        node.AddChildLast(this.ParseExprTerm());
        if (this.isSyntaxError) 
        {
            return node;
        }

        for (; ;)
        {
            let t = this.GetToken();
            this.RewindTo(t);

            if (!this.IsOperator(t.type))
                return node;

            node.AddChildLast(this.ParseExprOperator());
            if (this.isSyntaxError) 
            {
                return node;
            }

            node.AddChildLast(this.ParseExprTerm());
            if (this.isSyntaxError) 
            {
                return node;
            }
        }
    }

    ParseExprTerm(): ScriptNode
    {
        let node = this.CreateNode(eScriptNode.snExprTerm);

        // Check if the expression term is an initialization of a temp object with init list, i.e. type = {...}
        let t = this.GetToken();
        let t2 = t;
        let t3;
        if (this.IsDataType(t2) && this.CheckTemplateType(t2))
        {
            // The next token must be a = followed by a {
            t2 = this.GetToken();
            t3 = this.GetToken();
            if (t2.type == eTokenType.ttAssignment && t3.type == eTokenType.ttStartStatementBlock)
            {
                // It is an initialization, now parse it for real
                this.RewindTo(t);
                node.AddChildLast(this.ParseType(false));
                t2 = this.GetToken();
                node.AddChildLast(this.ParseInitList());
                return node;
            }
        }
        // Or an anonymous init list, i.e. {...}
        else if (t.type == eTokenType.ttStartStatementBlock)
        {
            this.RewindTo(t);
            node.AddChildLast(this.ParseInitList());
            return node;
        }

        // It wasn't an initialization, so it must be an ordinary expression term
        this.RewindTo(t);

        for (;;)
        {
            t = this.GetToken();
            this.RewindTo(t);

            if (!this.IsPreOperator(t.type))
                break;

            node.AddChildLast(this.ParseExprPreOp());
            if (this.isSyntaxError)
            {
                return node;
            }
        }

        node.AddChildLast(this.ParseExprValue());

        if (this.isSyntaxError)
        {
            return node;
        }

        for (;;)
        {
            t = this.GetToken();
            this.RewindTo(t);
            if (!this.IsPostOperator(t.type))
                return node;

            node.AddChildLast(this.ParseExprPostOp());
            if (this.isSyntaxError)
            {
                return node;
            }
        }
    }

    ParseExprPreOp(): ScriptNode
    {
        let node = this.CreateNode(eScriptNode.snExprPreOp);

        let t = this.GetToken();
        if (!this.IsPreOperator(t.type))
        {
			this.Error(TXT_EXPECTED_PRE_OPERATOR, t);
			this.Error(this.InsteadFound(t), t);
            return node;
        }

        node.SetToken(t);

        return node;
    }

    ParseExprPostOp(): ScriptNode
    {
        let node = this.CreateNode(eScriptNode.snExprPostOp);

        let t = this.GetToken();
        if (!this.IsPostOperator(t.type))
        {
			this.Error(TXT_EXPECTED_POST_OPERATOR, t);
			this.Error(this.InsteadFound(t), t);
            return node;
        }

        node.SetToken(t);

        if (t.type == eTokenType.ttDot)
        {
            let t1 = this.GetToken();
            let t2 = this.GetToken();
            this.RewindTo(t1);

            if (t2.type == eTokenType.ttOpenParanthesis)
                node.AddChildLast(this.ParseFunctionCall());
            else
                node.AddChildLast(this.ParseIdentifier());
        }
        else if (t.type == eTokenType.ttOpenBracket)
        {
            node.AddChildLast(this.ParseArgList(false));

            t = this.GetToken();
            if (t.type != eTokenType.ttCloseBracket)
            {
				this.Error(this.ExpectedToken("]"), t);
				this.Error(this.InsteadFound(t), t);
                return node;
            }

            node.UpdateSourcePosition(t.pos, t.length);
        }
        else if (t.type == eTokenType.ttOpenParanthesis)
        {
            this.RewindTo(t);
            node.AddChildLast(this.ParseArgList());
        }

        return node;
    }

    ParseExprValue(): ScriptNode
    {
        let node = this.CreateNode(eScriptNode.snExprValue);

        let t1 = this.GetToken();
        let t2 = this.GetToken();
        this.RewindTo(t1);

        // 'void' is a special expression that doesn't do anything (normally used for skipping output arguments)
        if (t1.type == eTokenType.ttVoid)
            node.AddChildLast(this.ParseToken(eTokenType.ttVoid));
        else if (this.IsRealType(t1.type))
            node.AddChildLast(this.ParseConstructCall());
        else if (t1.type == eTokenType.ttIdentifier || t1.type == eTokenType.ttScope)
        {
            // Check if the expression is an anonymous function
            if (this.IsLambda())
            {
                node.AddChildLast(this.ParseLambda());
            }
            else
            {
                // Determine the last identifier in order to check if it is a type
                let t;
                if (t1.type == eTokenType.ttScope) t = t2; else t = t1;
                this.RewindTo(t);
                t2 = this.GetToken();
                while (t.type == eTokenType.ttIdentifier)
                {
                    t2 = t;
                    t = this.GetToken();
                    if (t.type == eTokenType.ttScope)
                        t = this.GetToken();
                    else
                        break;
                }

                let isDataType = this.IsDataType(t2);
                let isTemplateType = false;
                if (isDataType)
                {
                    // Is this a template type?
                    // tempString.Assign(& script -> code[t2.pos], t2.length);
                    // if (engine -> IsTemplateType(tempString.AddressOf()))
                    //     isTemplateType = true;
                }

                t2 = this.GetToken();

                // Rewind so the real parsing can be done, after deciding what to parse
                this.RewindTo(t1);

                // Check if this is a construct call
                // Just 'type()' isn't considered a construct call, because type may just be a function/method name.
                // The compiler will have to sort this out, since the parser doesn't have enough information.
                if (isDataType && (t.type == eTokenType.ttOpenBracket && t2.type == eTokenType.ttCloseBracket))      // type[]()
                    node.AddChildLast(this.ParseConstructCall());
                else if (isTemplateType && t.type == eTokenType.ttLessThan)  // type<t>()
                    node.AddChildLast(this.ParseConstructCall());
                else if (this.IsFunctionCall())
                    node.AddChildLast(this.ParseFunctionCall());
                else
                    node.AddChildLast(this.ParseVariableAccess());
            }
        }
        else if (t1.type == eTokenType.ttCast)
            node.AddChildLast(this.ParseCast());
        else if (this.IsConstant(t1.type))
            node.AddChildLast(this.ParseConstant());
        else if (t1.type == eTokenType.ttOpenParanthesis)
        {
            t1 = this.GetToken();
            node.UpdateSourcePosition(t1.pos, t1.length);

            node.AddChildLast(this.ParseAssignment());
            if (this.isSyntaxError) return node;

            t1 = this.GetToken();
            if (t1.type != eTokenType.ttCloseParanthesis)
            {
				this.Error(this.ExpectedToken(")"), t1);
				this.Error(this.InsteadFound(t1), t1);
            }

            node.UpdateSourcePosition(t1.pos, t1.length);
        }
        else
        {
			this.Error(TXT_EXPECTED_EXPRESSION_VALUE, t1);
			this.Error(this.InsteadFound(t1), t1);
        }

        return node;
    }

    ParseCast(): ScriptNode
    {
        let node = this.CreateNode(eScriptNode.snCast);

        let t1 = this.GetToken();
        if (t1.type != eTokenType.ttCast)
        {
			this.Error(this.ExpectedToken("cast"), t1);
			this.Error(this.InsteadFound(t1), t1);
            return node;
        }

        node.UpdateSourcePosition(t1.pos, t1.length);

        t1 = this.GetToken();
        if (t1.type != eTokenType.ttLessThan)
        {
			this.Error(this.ExpectedToken("<"), t1);
			this.Error(this.InsteadFound(t1), t1);
            return node;
        }

        // Parse the data type
        node.AddChildLast(this.ParseType(true));
        if (this.isSyntaxError) return node;

        t1 = this.GetToken();
        if (t1.type != eTokenType.ttGreaterThan)
        {
			this.Error(this.ExpectedToken(">"), t1);
			this.Error(this.InsteadFound(t1), t1);
            return node;
        }

        t1 = this.GetToken();
        if (t1.type != eTokenType.ttOpenParanthesis)
        {
			this.Error(this.ExpectedToken("("), t1);
			this.Error(this.InsteadFound(t1), t1);
            return node;
        }

        node.AddChildLast(this.ParseAssignment());
        if (this.isSyntaxError) return node;

        t1 = this.GetToken();
        if (t1.type != eTokenType.ttCloseParanthesis)
        {
			this.Error(this.ExpectedToken(")"), t1);
			this.Error(this.InsteadFound(t1), t1);
            return node;
        }

        node.UpdateSourcePosition(t1.pos, t1.length);

        return node;
    }

    ParseLambda(): ScriptNode
    {
        let node = this.CreateNode(eScriptNode.snFunction);

        let t = this.GetToken();

        if (t.type != eTokenType.ttIdentifier || !this.IdentifierIs(t, FUNCTION_TOKEN))
        {
			this.Error(this.ExpectedToken("function"), t);
            return node;
        }

        t = this.GetToken();
        if (t.type != eTokenType.ttOpenParanthesis)
        {
			this.Error(this.ExpectedToken("("), t);
            return node;
        }

        // Parse optional type before parameter name
        var isTypeResult = this.IsType();
        if (isTypeResult[0])// && (t.type == eTokenType.ttAmp || t.type == eTokenType.ttIdentifier))
        {
            node.AddChildLast(this.ParseType(true));
            if (this.isSyntaxError) return node;

            let typemod = this.ParseTypeMod(true);
            if (typemod)
            {
                node.AddChildLast(typemod);
            }

            if (this.isSyntaxError) return node;
        }

        t = this.GetToken();
        if (t.type == eTokenType.ttIdentifier)
        {
            this.RewindTo(t);
            node.AddChildLast(this.ParseIdentifier());
            if (this.isSyntaxError) return node;

            t = this.GetToken();
            while (t.type == eTokenType.ttListSeparator)
            {
                // Parse optional type before parameter name
                var isTypeResult = this.IsType();
                if (isTypeResult[0])// && (t.type == eTokenType.ttAmp || t.type == eTokenType.ttIdentifier)) 
                {
                    node.AddChildLast(this.ParseType(true));
                    if (this.isSyntaxError) return node;

                    let typemod = this.ParseTypeMod(true);
                    if (typemod)
                    {
                        node.AddChildLast(typemod);
                    }

                    if (this.isSyntaxError) return node;
                }

                node.AddChildLast(this.ParseIdentifier());
                if (this.isSyntaxError) return node;

                t = this.GetToken();
            }
        }

        if (t.type != eTokenType.ttCloseParanthesis)
        {
			this.Error(this.ExpectedToken(")"), t);
            return node;
        }

        // We should just find the end of the statement block here. The statements
        // will be parsed on request by the compiler once it starts the compilation.
        node.AddChildLast(this.ParseStatementBlock());

        return node;
    }

    ParseConstructCall(): ScriptNode
    {
        let node = this.CreateNode(eScriptNode.snConstructCall);

        node.AddChildLast(this.ParseType(false));
        if (this.isSyntaxError) return node;

        node.AddChildLast(this.ParseArgList());

        return node;
    }

    ParseFunctionCall(): ScriptNode
    {
        let node = this.CreateNode(eScriptNode.snFunctionCall);

        // Parse scope prefix
        this.ParseOptionalScope(node);

        // Parse the function name followed by the argument list
        node.AddChildLast(this.ParseIdentifier());
        if (this.isSyntaxError) return node;

        node.AddChildLast(this.ParseArgList());

        return node;
    }

    ParseArgList(withParenthesis: boolean = true): ScriptNode
    {
        let node = this.CreateNode(eScriptNode.snArgList);

        let t1;
        if (withParenthesis)
        {
            t1 = this.GetToken();
            if (t1.type != eTokenType.ttOpenParanthesis)
            {
				this.Error(this.ExpectedToken("("), t1);
				this.Error(this.InsteadFound(t1), t1);
                return node;
            }

            node.UpdateSourcePosition(t1.pos, t1.length);
        }

        t1 = this.GetToken();
        if (t1.type == eTokenType.ttCloseParanthesis || t1.type == eTokenType.ttCloseBracket)
        {
            if (withParenthesis)
            {
                if (t1.type == eTokenType.ttCloseParanthesis)
                    node.UpdateSourcePosition(t1.pos, t1.length);
                else
                {
					this.Error(TXT_UNEXPECTED_TOKEN_s.Format(this.tokenizer.GetDefinition(eTokenType.ttCloseBracket)), t1);
                }
            }
            else
                this.RewindTo(t1);

            // Argument list has ended
            return node;
        }
        else
        {
            this.RewindTo(t1);

            for (; ;)
            {
                // Determine if this is a named argument
                let tl = this.GetToken();
                let t2 = this.GetToken();
                this.RewindTo(tl);

                // Named arguments uses the syntax: arg : expr
                // This avoids confusion when the argument has the same name as a local variable, i.e. var = expr
                // It also avoids conflict with expressions to that creates anonymous objects initialized with lists, i.e. type = {...}
                // The alternate syntax: arg = expr, is supported to provide backwards compatibility with 2.29.0
                // TODO: 3.0.0: Remove the alternate syntax
                if (tl.type == eTokenType.ttIdentifier && (t2.type == eTokenType.ttColon || (/*engine -> ep.alterSyntaxNamedArgs*/ true && t2.type == eTokenType.ttAssignment)))
                {
                    let named = this.CreateNode(eScriptNode.snNamedArgument);
                    node.AddChildLast(named);

                    named.AddChildLast(this.ParseIdentifier());
                    t2 = this.GetToken();

                    named.AddChildLast(this.ParseAssignment());
                }
                else
                    node.AddChildLast(this.ParseAssignment());

                if (this.isSyntaxError) return node;

                // Check if list continues
                t1 = this.GetToken();
                if (t1.type == eTokenType.ttListSeparator)
                    continue;
                else
                {
                    if (withParenthesis)
                    {
                        if (t1.type == eTokenType.ttCloseParanthesis)
                            node.UpdateSourcePosition(t1.pos, t1.length);
                        else
                        {
							this.Error(this.ExpectedTokens(")", ","), t1);
							this.Error(this.InsteadFound(t1), t1);
                        }
                    }
                    else
                        this.RewindTo(t1);

                    return node;
                }
            }
        }
    }

    ParseVariableAccess(): ScriptNode
    {
        let node = this.CreateNode(eScriptNode.snVariableAccess);

        // Parse scope prefix
        this.ParseOptionalScope(node);

        // Parse the variable name
        node.AddChildLast(this.ParseIdentifier());

        return node;
    }

    ParseType(allowConst: boolean, allowVariableType: boolean = false, allowAuto: boolean = false)
    {
        let node = this.CreateNode(eScriptNode.snType);

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
					this.Error(this.ExpectedToken("]"), token);
					this.Error(this.InsteadFound(token), token);
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

    ParseConstant(): ScriptNode
    {
        let node = this.CreateNode(eScriptNode.snConstant);

        let t = this.GetToken();
        if (!this.IsConstant(t.type))
        {
			this.Error(TXT_EXPECTED_CONSTANT, t);
			this.Error(this.InsteadFound(t), t);
            return node;
        }

        node.SetToken(t);

        // We want to gather a list of string constants to concatenate as children
        if (t.type == eTokenType.ttStringConstant || t.type == eTokenType.ttMultilineStringConstant || t.type == eTokenType.ttHeredocStringConstant)
            this.RewindTo(t);

        while (t.type == eTokenType.ttStringConstant || t.type == eTokenType.ttMultilineStringConstant || t.type == eTokenType.ttHeredocStringConstant)
        {
            node.AddChildLast(this.ParseStringConstant());

            t = this.GetToken();
            this.RewindTo(t);
        }

        return node;
    }

    ParseStringConstant(): ScriptNode
    {
        let node = this.CreateNode(eScriptNode.snConstant);

        let t = this.GetToken();
        if (t.type != eTokenType.ttStringConstant && t.type != eTokenType.ttMultilineStringConstant && t.type != eTokenType.ttHeredocStringConstant)
        {
			this.Error(TXT_EXPECTED_CONSTANT, t);
			this.Error(this.InsteadFound(t), t);
            return node;
        }

        node.SetToken(t);

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
                this.Error(TXT_IDENTIFIER_s_NOT_DATA_TYPE.Format(this.tokenizer.source.source.substr(token.pos, token.length)), token);
            }
            else if (token.type == eTokenType.ttAuto)
            {
				this.Error(TXT_AUTO_NOT_ALLOWED, token);
            }
            else
            {
				this.Error(TXT_EXPECTED_DATA_TYPE, token);
				this.Error(this.InsteadFound(token), token);
            }

            return node;
        }

        node.SetToken(token);

        return node;
    }

    ParseTypeMod(isParam: boolean): ScriptNode | null
    {
        let node = this.CreateNode(eScriptNode.snTypemod);

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
			this.Error(TXT_EXPECTED_OPERATOR, t);
			this.Error(this.InsteadFound(t), t);
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
			this.Error(TXT_EXPECTED_OPERATOR, t);
			this.Error(this.InsteadFound(t), t);
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
			this.Error(TXT_EXPECTED_IDENTIFIER, token);
			this.Error(this.InsteadFound(token), token);
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
			this.Error(this.ExpectedToken(this.tokenizer.GetDefinition(token.type)), token);
			this.Error(this.InsteadFound(token), token);
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
			this.Error(this.ExpectedOneOf(tokens), token);
			this.Error(this.InsteadFound(token), token);
            return node;
        }

        node.SetToken(token);
        return node;
    }

    IsDataType(token: Token): boolean
    {
        if (token.type == eTokenType.ttIdentifier)
        {
            // Something with builder-DoesTypeExist
            return false;
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

	IsFuncDecl(isMethod: boolean): boolean
	{
		// Set start point so that we can rewind
		let t = this.GetToken();
		this.RewindTo(t);

		if (isMethod)
		{
			// A class method decl can be preceded by 'private' or 'protected'
			let t1 = this.GetToken();
			let t2;
			if (t1.type != eTokenType.ttPrivate && t1.type != eTokenType.ttProtected)
				this.RewindTo(t1);

			// A class constructor starts with identifier followed by parenthesis
			// A class destructor starts with the ~ token
			t1 = this.GetToken();
			t2 = this.GetToken();
			this.RewindTo(t1);
			if( (t1.type == eTokenType.ttIdentifier && t2.type == eTokenType.ttOpenParanthesis) || t1.type == eTokenType.ttBitNot )
			{
				this.RewindTo(t);
				return true;
			}
		}

		let isTypeResult = this.IsType();
		let t1 = isTypeResult[1];
		// A function decl starts with a type
		if (!isTypeResult[0])
		{
			this.RewindTo(t);
			return false;
		}

		// Move to the token after the type
		this.RewindTo(t1);
		t1 = this.GetToken();

		// There can be an ampersand if the function returns a reference
		if(t1.type == eTokenType.ttAmp)
		{
			this.RewindTo(t);
			return true;
		}

		if(t1.type != eTokenType.ttIdentifier)
		{
			this.RewindTo(t);
			return false;
		}

		t1 = this.GetToken();
		if (t1.type == eTokenType.ttOpenParanthesis)
		{
			// If the closing parenthesis is not followed by a
			// statement block then it is not a function.
			// It's possible that there are nested parenthesis due to default
			// arguments so this should be checked for.
			let nest = 0;
			t1 = this.GetToken();
			while((nest || t1.type != eTokenType.ttCloseParanthesis) && t1.type != eTokenType.ttEnd)
			{
				if( t1.type == eTokenType.ttOpenParanthesis)
					nest++;
				if( t1.type == eTokenType.ttCloseParanthesis)
					nest--;

				t1 = this.GetToken();
			}

			if (t1.type == eTokenType.ttEnd)
				return false;
			else
			{
				if( isMethod )
				{
					// A class method can have a 'const' token after the parameter list
					t1 = this.GetToken();
					if (t1.type != eTokenType.ttConst)
						this.RewindTo(t1);
				}

				// A function may also have any number of additional attributes
				for( ; ; )
				{
					t1 = this.GetToken();
					if (!this.IdentifierIs(t1, FINAL_TOKEN)
						&& !this.IdentifierIs(t1, OVERRIDE_TOKEN)
						&& !this.IdentifierIs(t1, EXPLICIT_TOKEN)
						&& !this.IdentifierIs(t1, PROPERTY_TOKEN)
					) {
						this.RewindTo(t1);
						break;
					}
				}
				
				t1 = this.GetToken();
				this.RewindTo(t);
				if (t1.type == eTokenType.ttStartStatementBlock)
					return true;
			}

			this.RewindTo(t);
			return false;
		}

		this.RewindTo(t);
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
        var isTypeResult = this.IsType();
        if (!isTypeResult[0])
        {
            this.RewindTo(t);
            return false;
        }

        if (isTypeResult[1] != null)
        {
            t1 = isTypeResult[1];
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

	IsVirtualPropertyDecl(): boolean
	{
		// Set start point so that we can rewind
		const t = this.GetToken();
		this.RewindTo(t);

		// A class property decl can be preceded by 'private' or 'protected'
		let t1 = this.GetToken();
		if( t1.type != eTokenType.ttPrivate && t1.type != eTokenType.ttProtected )
			this.RewindTo(t1);

		// A variable decl starts with the type
		if (!this.IsType())
		{
			this.RewindTo(t);
			return false;
		}

		// Move to the token after the type
		this.RewindTo(t1);
		t1 = this.GetToken();

		// The decl must have an identifier
		if( t1.type != eTokenType.ttIdentifier )
		{
			this.RewindTo(t);
			return false;
		}

		// To be a virtual property it must also have a block for the get/set functions
		t1 = this.GetToken();
		if( t1.type == eTokenType.ttStartStatementBlock )
		{
			this.RewindTo(t);
			return true;
		}

		this.RewindTo(t);
		return false;
	}

    // nextToken is only modified if the current position can be interpreted as
    // type, in this case it is set to the next token after the type tokens
    IsType(): [boolean, Token | null]
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
                    if (this.CheckTemplateType(t1))
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
            return [false, null];
        }

        if (!this.CheckTemplateType(t1))
        {
            this.RewindTo(t);
            return [false, null];
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
                    return [false, null];
                }
            }

            t2 = this.GetToken();
        }

        // Rewind to start point
        this.RewindTo(t);

        return [true, t2];
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

    IsPreOperator(tokenType: eTokenType): boolean
    {
        if (tokenType == eTokenType.ttMinus ||
            tokenType == eTokenType.ttPlus ||
            tokenType == eTokenType.ttNot ||
            tokenType == eTokenType.ttInc ||
            tokenType == eTokenType.ttDec ||
            tokenType == eTokenType.ttBitNot ||
            tokenType == eTokenType.ttHandle)
            return true;
        return false;
    }

    IsPostOperator(tokenType: eTokenType): boolean
    {
        if (tokenType == eTokenType.ttInc ||            // post increment
            tokenType == eTokenType.ttDec ||            // post decrement
            tokenType == eTokenType.ttDot ||            // member access
            tokenType == eTokenType.ttOpenBracket ||    // index operator
            tokenType == eTokenType.ttOpenParanthesis) // argument list for call on function pointer
            return true;
        return false;
    }

    IsConstant(tokenType: eTokenType): boolean
    {
        if (tokenType == eTokenType.ttIntConstant ||
            tokenType == eTokenType.ttFloatConstant ||
            tokenType == eTokenType.ttDoubleConstant ||
            tokenType == eTokenType.ttStringConstant ||
            tokenType == eTokenType.ttMultilineStringConstant ||
            tokenType == eTokenType.ttHeredocStringConstant ||
            tokenType == eTokenType.ttTrue ||
            tokenType == eTokenType.ttFalse ||
            tokenType == eTokenType.ttBitsConstant ||
            tokenType == eTokenType.ttNull)
            return true;

        return false;
    }

    IsFunctionCall(): boolean
    {
        let s = this.GetToken();
        let t1 = s;

        // A function call may be prefixed with scope resolution
        if (t1.type == eTokenType.ttScope)
            t1 = this.GetToken();

        let t2 = this.GetToken();

        while (t1.type == eTokenType.ttIdentifier && t2.type == eTokenType.ttScope)
        {
            t1 = this.GetToken();
            t2 = this.GetToken();
        }

        // A function call starts with an identifier followed by an argument list
        // The parser doesn't have enough information about scope to determine if the
        // identifier is a datatype, so even if it happens to be the parser will
        // identify the expression as a function call rather than a construct call.
        // The compiler will sort this out later
        if (t1.type != eTokenType.ttIdentifier)
        {
            this.RewindTo(s);
            return false;
        }

        if (t2.type == eTokenType.ttOpenParanthesis)
        {
            this.RewindTo(s);
            return true;
        }

        this.RewindTo(s);
        return false;
    }

    IsLambda(): boolean
    {
        let isLambda = false;
        let t = this.GetToken();

        if (t.type == eTokenType.ttIdentifier && this.IdentifierIs(t, FUNCTION_TOKEN))
        {
            let t2 = this.GetToken();
            if (t2.type == eTokenType.ttOpenParanthesis)
            {
                // Skip until )
                while (t2.type != eTokenType.ttCloseParanthesis && t2.type != eTokenType.ttEnd)
                    t2 = this.GetToken();

                // The next token must be a {
                t2 = this.GetToken();
                if (t2.type == eTokenType.ttStartStatementBlock)
                    isLambda = true;
            }
        }

        this.RewindTo(t);

        return isLambda;
    }

    CheckTemplateType(_: Token): boolean
    {
        // Is this a template type?
        return true;
    }

    Warning (text: string, token: Token) {
        this.warnings.push(
            new asInfo(
                text,
                token,
            ),
        );
    }

	Info (text: string, token: Token)
	{
		this.RewindTo(token);
		this.isSyntaxError = true;

        this.infos.push(
            new asInfo(
                text,
                token,
            ),
        );
	}

	Error(text: string, token: Token)
	{
		this.RewindTo(token);
		this.isSyntaxError = true;

        this.errors.push(
            new asError(
                text,
                token,
            ),
        );
	}

	ExpectedToken(token: string)
	{
		return TXT_EXPECTED_s.Format(token);
	}

	ExpectedTokens(t1: string, t2: string)
	{
		return TXT_EXPECTED_s_OR_s.Format(t1, t2);
	}

	ExpectedOneOf (tokens: string[]): string;
	ExpectedOneOf (tokens: eTokenType[]): string;
	ExpectedOneOf (tokens: (eTokenType[] | string[])): string
	{
		if (tokens.length && (typeof tokens[0] !== 'string')) {
            tokens = tokens as eTokenType[];
			return TXT_EXPECTED_ONE_OF + tokens.join(', ');
		}
		return TXT_EXPECTED_ONE_OF + tokens.join(', ');
	}

	InsteadFound (t: Token)
	{
		if(t.type == eTokenType.ttIdentifier)
			return TXT_INSTEAD_FOUND_IDENTIFIER_s.Format(this.tokenizer.source.source.substr(t.pos, t.length));
		else if(t.type >= eTokenType.ttIf)
			return TXT_INSTEAD_FOUND_KEYWORD_s.Format(this.tokenizer.GetDefinition(t.type));
		else
			return TXT_INSTEAD_FOUND_s.Format(this.tokenizer.GetDefinition(t.type));
	}

}
