import { AstNode } from "./ast-node";

export declare function walkPostOrder(
    astNode : AstNode,
    handler : (node : AstNode) => boolean,
    thisArg? : any
) : boolean;
