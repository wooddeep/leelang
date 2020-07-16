/*
 * @author: lihan@migu.cn && niutourenqz@sina.com
 * @description: script execute!
 */
var Executor = require('./exec.js')
var Parser = require('./parser.js')

const formula =

/*
`
global_var = 1;
func recurse (b) {
    if (b - 1) {
        b * recurse(b - 1)
    } else {
        1
    }
};

recurse(3);
recurse(10)
`
*/


`
prefix = "hello";
name = "world";
prefix + " " + name;
`


let parser = new Parser(formula)

var out = parser.parse_program() // 解析出 语法树 列表

let exec = new Executor(parser) 

console.log("## execute:")

for (var i = 0; i < out.length - 0; i++) {
    console.log(JSON.stringify(out[i]))
    console.log(exec.eval(out[i]))       // 开始执行
}
