var kapheinJsTypeTrait = require("kaphein-js-type-trait");
var isString = kapheinJsTypeTrait.isString;
var isNonNullObject = kapheinJsTypeTrait.isNonNullObject;

module.exports = (function ()
{
    /**
     *  @typedef {import("./ast-node").AstNode} AstNode
     */

    /**
     *  @typedef {{
            parent : Expression | null;
            obj : Record<string, any>;
            keyIndex : number;
            operatorName : "and" | "or";
            nodeStack : AstNode[];
        }} Expression
     */

    /**
     *  @param {Record<string, any> | string} query
     */
    function parse(query)
    {
        if(isString(query))
        {
            query = JSON.parse(query);
        }
        else if(!isNonNullObject(query))
        {
            throw new TypeError("'query' must be a non-null object.");
        }

        /** @type {AstNode} */var rootNode = null;
        /** @type {Expression[]} */var exprStack = [];
        var rootExpr = {
            parent : null,
            obj : query,
            keyIndex : 0,
            operatorName : "and",
            nodeStack : []
        };
        exprStack.push(rootExpr);

        while(exprStack.length > 0)
        {
            var expr = exprStack[exprStack.length - 1];
            var obj = expr.obj;
            var exprKeys = Object.keys(obj);

            var k = expr.keyIndex;
            if(exprKeys.length === k)
            {
                exprStack.pop();

                /** @type {AstNode} */var node = {
                    parent : null,
                    children : expr.nodeStack,
                    nodeType : "operator",
                    name : expr.operatorName
                };
                expr.nodeStack.forEach(function (child)
                {
                    child.parent = node;
                });
                expr.nodeStack = null;

                var parentExpr = expr.parent;
                if(parentExpr)
                {
                    parentExpr.nodeStack.push(node);
                }
                else
                {
                    rootNode = node;
                }
            }
            else
            {
                for(var shouldLoop = true; shouldLoop && k < exprKeys.length; )
                {
                    var key = exprKeys[k];
                    var value = obj[key];

                    if(key.startsWith("$"))
                    {
                        var keyName = key.substr(1);
                        switch(keyName)
                        {
                        case "and":
                        case "or": (function ()
                        {
                            if(!Array.isArray(value))
                            {
                                throw new Error("The value of '" + key + "' must be an array.");
                            }

                            ++k;
                            expr.keyIndex = k;

                            /** @type {Expression} */var logOpExpr = {
                                parent : expr,
                                obj : {},
                                keyIndex : 0,
                                operatorName : keyName,
                                nodeStack : []
                            };
                            exprStack.push(logOpExpr);

                            for(var i = 0, j = value.length; i < value.length; ++i)
                            {
                                --j;

                                exprStack.push({
                                    parent : logOpExpr,
                                    obj : value[j],
                                    keyIndex : 0,
                                    operatorName : "and",
                                    nodeStack : []
                                });
                            }

                            shouldLoop = false;
                        })();
                            break;
                        default:
                            throw new Error("'" + key + "' is not a valid logical operator.");
                        }
                    }
                    else
                    {
                        /** @type {AstNode} */var pathNode = {
                            nodeType : "operand",
                            parent : null,
                            operandType : "path",
                            value : key
                        };

                        if(isNonNullObject(value))
                        {
                            var opKeys = Object.keys(value);
                            if(1 !== opKeys.length)
                            {
                                throw new Error("Only one comparison operator can be used.");
                            }

                            var op = opKeys[0];
                            if(!op.startsWith("$"))
                            {
                                throw new Error("Only one comparison operator can be used.");
                            }

                            var operand = value[op];

                            var opName = op.substr(1);
                            switch(opName)
                            {
                            case "eq":
                            case "ne":
                            case "gte":
                            case "lt":
                            case "lte":
                            case "gt": (function ()
                            {
                                /** @type {AstNode} */var parentNode = {
                                    nodeType : "operator",
                                    parent : null,
                                    name : opName,
                                    children : []
                                };
                                pathNode.parent = parentNode;
                                parentNode.children.push(pathNode);
                                parentNode.children.push({
                                    nodeType : "operand",
                                    parent : parentNode,
                                    operandType : "value",
                                    valueType : _getValueType(operand),
                                    value : operand
                                });

                                expr.nodeStack.push(parentNode);
                            })();
                                break;
                            case "in":
                            case "nin": (function ()
                            {
                                if(!Array.isArray(operand))
                                {
                                    throw new Error("The operand of a " + op + " operator must be an array.");
                                }

                                /** @type {AstNode} */var parentNode = {
                                    nodeType : "operator",
                                    parent : null,
                                    name : opName,
                                    children : []
                                };
                                pathNode.parent = parentNode;
                                parentNode.children.push(pathNode);
                                operand.forEach(function (value)
                                {
                                    parentNode.children.push({
                                        nodeType : "operand",
                                        parent : parentNode,
                                        operandType : "value",
                                        valueType : _getValueType(value),
                                        value : value
                                    });
                                });

                                expr.nodeStack.push(parentNode);
                            })();
                                break;
                            default:
                                throw new Error("'" + op + "' is not a valid value operator.");
                            }
                        }
                        else
                        {
                            /** @type {AstNode} */var parentNode = {
                                nodeType : "operator",
                                parent : null,
                                name : "eq",
                                children : []
                            };
                            pathNode.parent = parentNode;
                            parentNode.children.push(pathNode);
                            parentNode.children.push({
                                nodeType : "operand",
                                parent : parentNode,
                                operandType : "value",
                                valueType : _getValueType(value),
                                value : value
                            });

                            expr.nodeStack.push(parentNode);
                        }

                        ++k;
                        expr.keyIndex = k;
                    }
                }
            }
        }

        if(!rootNode || exprStack.length > 0)
        {
            throw new Error("An paser error has occured.");
        }

        return rootNode;
    }

    function _getValueType(operand)
    {
        var typeName = typeof operand;
        switch(typeName)
        {
        case "object":
            if(null !== operand)
            {
                throw new Error("'" + typeName + "' is not a valid value type.");
            }

            typeName = "null";
            break;
        case "boolean":
        case "number":
        case "bigint":
        case "string":
            break;
        default:
            throw new Error("'" + typeName + "' is not a valid value type.");
        }

        return typeName;
    }

    return {
        parse : parse
    }
})();
