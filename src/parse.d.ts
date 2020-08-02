import { AstNode } from "./ast-node";

export declare function parse(
    query : Record<string, any> | string
) : AstNode;
