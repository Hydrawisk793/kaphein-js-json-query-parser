const { assert } = require("chai");

const { parse, walkPostOrder } = require("../src");

describe("Test", function ()
{
    /**
     *  @typedef {import("../src").AstNode} AstNode
     */

    it("query 1", function (done)
    {
        const expectedLogs = [
            "operand path foo",
            "operand value number 3",
            "operator eq",
            "operand path bar",
            "operand value boolean false",
            "operator eq",
            "operand path baz",
            "operand value number 4",
            "operator gt",
            "operand path qux",
            "operand value string a",
            "operand value string b",
            "operand value string c",
            "operand value string d",
            "operand value string e",
            "operator in",
            "operator and"
        ];
        const query = {
            foo : 3,
            bar : false,
            baz : {
                $gt : 4,
            },
            qux : {
                $in : ["a", "b", "c", "d", "e"]
            },
        };

        const node = parse(query);
        const logs = [];
        walkPostOrder(node, _postOrderHandler, logs);

        assert.deepStrictEqual(logs, expectedLogs);

        done();
    });

    it("query 2", function (done)
    {
        const expectedLogs = [
            "operand path price",
            "operand value number 180",
            "operator lte",
            "operand path key",
            "operand value number 1",
            "operator eq",
            "operator and",
            "operand path price",
            "operand value number 120",
            "operator gte",
            "operand path key",
            "operand value number 1",
            "operator eq",
            "operator and",
            "operator or",
            "operand path name",
            "operand value string foo",
            "operator eq",
            "operator and"
        ];
        const query = {
            $or : [
                {
                    price : {
                        $lte : 180
                    },
                    key : 1
                },
                {
                    price : {
                        $gte : 120
                    },
                    key : 1
                }
            ],
            name : "foo"
        };

        const node = parse(query);
        const logs = [];
        walkPostOrder(node, _postOrderHandler, logs);

        assert.deepStrictEqual(logs, expectedLogs);

        done();
    });

    it("query 3", function (done)
    {
        const expectedLogs = [
            "operand path foo",
            "operand value string a",
            "operator eq",
            "operator and",
            "operand path bar",
            "operand value number 3",
            "operator gt",
            "operator and",
            "operator and",
            "operator and",
            "operand path foo",
            "operand value string b",
            "operator eq",
            "operator and",
            "operand path bar",
            "operand value number 3",
            "operator lt",
            "operand path baz",
            "operand value boolean false",
            "operator eq",
            "operator and",
            "operator and",
            "operator and",
            "operator or",
            "operator and"
        ];
        const query = {
            $or : [
                {
                    $and : [
                        {
                            foo : "a"
                        },
                        {
                            bar : {
                                $gt : 3
                            }
                        }
                    ]
                },
                {
                    $and : [
                        {
                            foo : "b"
                        },
                        {
                            bar : {
                                $lt : 3
                            },
                            baz : {
                                $eq : false
                            }
                        }
                    ]
                }
            ]
        };

        const node = parse(query);
        const logs = [];
        walkPostOrder(node, _postOrderHandler, logs);

        assert.deepStrictEqual(logs, expectedLogs);

        done();
    });

    /**
     *  @this {string[]}
     *  @param {AstNode} astNode
     */
    function _postOrderHandler(astNode)
    {
        switch(astNode.nodeType)
        {
        case "operator":
            this.push(`${ astNode.nodeType } ${ astNode.name }`);
            break;
        case "operand":
            this.push(`${ astNode.nodeType } ${ astNode.operandType }${ "value" === astNode.operandType ? ` ${ astNode.valueType }` : "" } ${ astNode.value }`);
            break;
        default:
            throw new Error(`'${ astNode.nodeType }' is not a valid node type.`);
        }
    }
});
