/*
 * @author: lihan@migu.cn && niutourenqz@sina.com
 * @description: script execute!
 */
var Executor = require('./exec.js')
var Parser = require('./parser.js')

const formula =

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
recurse(10);
`


/*
`
user = {"name": "lee", "age": 37};
user["name"] = "hello";
user["name"] = "hello" + "WORLD";
user["name"];
`
*/

/*
map = {"k1": 1 + 1, "k2": "hello world"};
map["k3"] = map["k2"] + " " + "lihan";
map["k3"];
*/

/*
map = {"k1": 1 + 1, "k2": "hello world"};
map["k3"] = map["k2"] + " " + "lihan";
map;
map["k3"];
*/

let parser = new Parser(formula)

var out = parser.parse_program() // 解析出 语法树 列表

let exec = new Executor(parser) 

console.log("## execute:")

for (var i = 0; i < out.length - 0; i++) {
    console.log(JSON.stringify(out[i]))
    console.log(exec.eval(out[i]))       // 开始执行
}


