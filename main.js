/*
 * @author: lihan@migu.cn && niutourenqz@sina.com
 * @description: script execute!
 */
var Executor = require('./exec.js')
var Parser = require('./parser.js')

const fs = require('fs');

var lee_script = process.argv.splice(2)[0]; // 脚本文件全路径

formula = ";"

try {
    formula = fs.readFileSync(lee_script, 'utf-8');
} catch(e) {
    console.log('read file <' + lee_script + "> error!", e);
    process.exit(1)
}

let parser = new Parser(formula)

var out = parser.parse_program() // 解析出 语法树 列表

let exec = new Executor(parser) 

console.log("## execute:")

for (var i = 0; i < out.length - 0; i++) {
    console.log(JSON.stringify(out[i]))
    console.log(exec.eval(out[i]))       // 开始执行
}


