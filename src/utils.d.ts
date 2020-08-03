import { AstNode } from "./ast-node";

export declare function walkPreOrder(
    astNode : AstNode,
    handler : (node : AstNode) => boolean,
    thisArg? : any
) : boolean;

export declare function walkPostOrder(
    astNode : AstNode,
    handler : (node : AstNode) => boolean,
    thisArg? : any
) : boolean;
