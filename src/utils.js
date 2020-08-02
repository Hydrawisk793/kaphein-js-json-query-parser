module.exports = (function ()
{
    /**
     *  @typedef {import("./ast-node").AstNode} AstNode
     */

    /**
     *  @param {AstNode} astNode
     *  @param {(node : AstNode) => boolean} handler
     *  @param {any} [thisArg]
     */
    function walkPostOrder(astNode, handler)
    {
        var thisArg = arguments[2];

        /** @type {AstNode[]} */var nodeStack = [];
        nodeStack.push(astNode);

        var lastTraversedNode = null;
        var shouldContinue = true;
        while(shouldContinue && nodeStack.length > 0)
        {
            var node = nodeStack[nodeStack.length - 1];
            if(!_isLeaf(node) && lastTraversedNode !== _getLastChild(node))
            {
                for(var j = node.children.length, i = 0; i < node.children.length; ++i)
                {
                    --j;
                    nodeStack.push(node.children[j]);
                }
            }
            else
            {
                shouldContinue = !((0, handler).call(thisArg, node));

                lastTraversedNode = node;
                nodeStack.pop();
            }
        }

        return shouldContinue;
    }

    /**
     *  @param {AstNode} astNode
     */
    function _isLeaf(astNode)
    {
        return (
            (
                "operator" === astNode.nodeType
                && astNode.children.length < 1
            )
            || "operand" === astNode.nodeType
        );
    }

    /**
     *  @param {AstNode} astNode
     */
    function _getLastChild(astNode)
    {
        /** @type {AstNode | null} */var child = null;

        if(!_isLeaf(astNode))
        {
            child = astNode.children[astNode.children.length - 1];
        }

        return child;
    }

    return {
        walkPostOrder : walkPostOrder
    };
})();
