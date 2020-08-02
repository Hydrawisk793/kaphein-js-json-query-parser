export declare interface AstBaseNode
{
    parent : AstBaseNode | null;

    nodeType : string;
}

export declare interface AstOperatorNode extends AstBaseNode
{
    nodeType : "operator";

    children : AstNode[];

    name : string;
}

export declare interface AstOperandBaseNode extends AstBaseNode
{
    nodeType : "operand";

    operandType : string;
}

export declare interface AstPathOperandNode extends AstOperandBaseNode
{
    nodeType : "operand";

    operandType : "path";

    value : string;
}

export declare interface AstValueOperandNode extends AstOperandBaseNode
{
    nodeType : "operand";

    operandType : "value";

    valueType : "null" | "boolean" | "number" | "bigint" | "string";

    value : string;
}

export declare type AstOperandNode = AstPathOperandNode | AstValueOperandNode;

export declare type AstNode = AstOperatorNode | AstOperandNode;
