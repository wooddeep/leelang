/*
 * @author: lihan@migu.cn && niutourenqz@sina.com
 * @description: syntax parser 
 */


/*

expr: term { ("+" | "-") term } 
     | NAME "=" expr
     | NAME "[" expr "]" "=" expr
     | local NAME "=" expr

term: factor { ("*" | "/") factor } 
     | factor ">" factor
     | factor ">=" factor
     | factor "<" factor
     | factor "<=" factor
     | factor "==" factor

factor: NUMBER // TODO，加上 "-" NUMBER
        | "(" expr ")"
        | NAME 
        | NMAE "[" STRING "]"  // 字典取数
        | FUNCNAME "(" alist ")"
        | STRING   
        | "{" {STRING ":" expr ","} "}"    // 字典


sentence: statement {; statement} 

block: "{" [ statement ] { ((";" | EOL) [statement]} "}"

plist: "" | NAME {, NAME} // 形参列表，字符串 

alist: "" | expr {, expr} // 实参列表

func： "func" FUNCNAME "(" plist ")" block // 函数


statement: "if" expr block [ "else" block ]
         | "while" expr block
         | expr //simple 
         | func                      // 本次新增
         

program: statement { ";" statement }    

*/ 

let Lexer = require('./lexer.js'); 
let Const = require('./const.js'); 

class Parser {

    constructor(formula) {
        this.lexer = new Lexer(formula)
        this.const_map = {} // 变量值存储 ~ 都是全局的变量
        this.func_map = {} // 函数表
    }

    /*
     * program: statement { ";" statement }  
     */
    parse_program() {
        var out = []

        var statement = this.parse_statement()
        if (statement.oper == "def") {
            this.func_map[statement.func] = statement
        } else {
            out.push(statement)
        }

        while (this.lexer.lookup() == ";") {
            this.lexer.pick()
            var statement = this.parse_statement()
            if (statement == undefined) {
                break
            }

            if (statement.oper == "def") {
                this.func_map[statement.func] = statement
            } else {
                out.push(statement)
            }
        }

        return out
    }


    /*
     * statement: "if" expr block [ "else" block ]
     *       | "while" expr block
     *       | "func" FUNCNAME "(" plist ")" block 
     *       | expr
     */

    parse_statement() {
        if  (this.lexer.lookup() == "if") { 
            var out = {}
            this.lexer.pick()
            var cond = this.parse_expr()

            out["oper"] = "if"
            out["cond"] = cond

            var block = this.parse_block()
            
            out["match"] = block

            if (this.lexer.lookup() == "else") {
                this.lexer.pick();
                var block = this.parse_block()
                out["unmatch"] = block
            }

            return out
        } else if (this.lexer.lookup() == "while") {
            var out = {}
            this.lexer.pick()
            var cond = this.parse_expr()

            out["oper"] = "while"
            out["cond"] = cond

            var block = this.parse_block()
            
            out["do"] = block
            
            return out
        }  else if (this.lexer.lookup() == "func") { // func： "func" FUNCNAME "(" plist ")" block // 本次新增
            var out = {}
            this.lexer.pick() // 去掉 "func"

            var func_name = this.lexer.pick()

            this.lexer.pick() // 去掉左大括号
            var plist = this.parse_plist()
            this.lexer.pick() // 去掉右大括号 

            var block = this.parse_block(true)
            
            out["oper"] = "def"
            out["func"] = func_name
            out["plist"] = plist
            out["block"] = block  // 函数相关的抽象语法树
            //out["infunc"] = true // 用于区分 函数中的变量赋值，是全局变量还是局部变量
            
            return out
        } else {
            var expr = this.parse_expr()
            return expr
        }
    }

    /*
     * plist: "" | NAME {, NAME} 
     */
    parse_plist() {
        var out = []
        if (this.lexer.lookup() != ")") { 
            var para = this.lexer.pick()
            out.push(para)
            while( this.lexer.lookup() == "," ) {
                this.lexer.pick() // 去掉逗号
                var para = this.lexer.pick()
                out.push(para)
            }
        }
        return out
    }


    /*
     * block: "{" [ statement ] { ((";" | EOL) [statement]} "}"
     */
    parse_block() {
        var out = []

        if (this.lexer.lookup() == "{") { 
            this.lexer.pick()

            var statement = this.parse_statement()
            out.push(statement)
            
            while ( this.lexer.lookup() == ";") { // 递归
                this.lexer.pick()
                var statement = this.parse_statement()
                out.push(statement)
            }
            
            this.lexer.pick() // "}"
        
        }

        return out
    }


    /*
     * sentence: expr {; expr}
     */
    parse_sentence() {
        var out = []
        var expr = this.parse_expr()
        out.push(expr)
        while ( this.lexer.lookup() == ";") { // 递归
            this.lexer.pick()
            var expr = this.parse_expr()
            out.push(expr)
        }

        return out
    }

    /*
     * expr: term { ("+" | "-") term } 
     *   | NAME "=" expr
     *   | local NAME "=" expr
     *   | NAME "[" expr "]" "=" expr  // 字典赋值
     */
    parse_expr() {

        if (this.lexer.lookups(1) == "local") { // 局部变量赋值
            this.lexer.pick()
            var letter = this.lexer.pick() // 字符串（变量）
            var token = this.lexer.pick() // 获取等号
            var expr = parse_expr()
            return {
                "oper": "assign",
                "name": letter,
                "value": expr,
                "local":true
            }
        }        

        if (this.lexer.lookups(2) == "=") { // 赋值
            var letter = this.lexer.pick() // 字符串（变量）
            var token = this.lexer.pick() // 获取等号
            var expr = this.parse_expr()
            return {
                "oper": "assign",
                "name": letter,
                "value": expr
            }
        } else if (this.lexer.lookups(2) == "[" && this.lexer.lookups(5) == "=") { // 字典，或者数组赋值
            var container = this.lexer.pick()
            this.lexer.pick() // 去掉 [
            var key = this.parse_expr()
            this.lexer.pick() // 去掉 ]
            this.lexer.pick() // 去掉 =
            var value = this.parse_expr()
            return {
                "oper": "mset",
                "key" : key,
                "map" : container,
                "value": value
            }

        } else {
            var left =  this.parse_term()
            while ( this.lexer.lookup() == "+" ||  this.lexer.lookup() == "-") { // 递归
                var oper =  this.lexer.pick()
                var right = this.parse_term()
                var left = {
                    "left": left,
                    "oper": oper,
                    "right": right
                }
            }
            return left
        }
    }

    /*
     * term: factor { ("*" | "/") factor }
     */

    /*
    term: factor { ("*" | "/") factor } 
     | factor ">" factor
     | factor ">=" factor
     | factor "<" factor
     | factor "<=" factor
     | factor "==" factor
    */
    parse_term() {
        var left =  this.parse_factor()

        var next = this.lexer.lookup()

        if (/(>)|(>=)|(<)|(<=)|(==)|(!=)/.exec(next) != null) {
            var token = this.lexer.pick()
            var right = this.parse_factor()
            var out = {
                "oper": "cmp", // 比较
                "token": token,
                "left": left,
                "right": right
            }
            return out
        }

        while ( this.lexer.lookup() == "*" ||  this.lexer.lookup() == "/") {
            var oper =  this.lexer.pick()
            var right = this.parse_factor()
            var left = {
                "left": left,
                "oper": oper,
                "right": right
            }
        }

        return left
    }

    /*
     * factor: NUMBER | "(" expression ")" | NAME | FUNCNAME "(" alist ")"
     */

    /*
        factor: NUMBER  // TODO，加上 "-" NUMBER  
        | "(" expr ")"
        | NAME 
        | NMAE "[" STRING "]"  // 字典取数
        | FUNCNAME "(" alist ")"
        | STRING   
        | "{" {STRING ":" expr ","} STRING ":" expr "}"    // 字典    
    */
     parse_factor() {
        var token = this.lexer.lookup()

        if (token == "(") { // 括号表达式
            this.lexer.pick()
            var expr = this.parse_expr()
            this.lexer.pick()
            return expr
        }

        
        if (token == "{") { // 对象
            this.lexer.pick() // 去掉 "{"
            var out = {}
            while(true) {
                var key = this.lexer.pick()
                if (key == "}") {
                    return {
                        "oper": "map",
                        "data": out 
                    }
                }

                if (Const.NAME_PATTEN().test(key) == null) {
                    console.log("syntax error!")
                    break
                }
                
                var colon = this.lexer.pick()
                if (colon != ":") {
                    console.log("syntax error!")
                    break
                }

                var value = this.parse_expr()
                out[key.substr(1, key.length - 2)] = value // 去除 键值 两边的 "

                var tail = this.lexer.lookup()
                if (tail == ",") {
                    this.lexer.pick()
                } else if (tail == "}") { // 正常结束
                    this.lexer.pick()
                    return {
                        "oper": "map",
                        "data": out
                    }
                } else {
                    console.log("syntax error!")
                    break;
                }
            }
        }
        

        if (Const.STRING_PATTEN().exec(token) != null) { // 字符串
            var token = this.lexer.pick()

            //console.log("#token --> ", token)

            return {
                "t": "str",
                "v": token //.substr(1, token.length - 2) // 侦测到字符串， 去掉首尾的双引号
            }
        }

        if (Const.NUM_PATTEN().exec(token) != null) {  // 整数， 浮点
            var token = this.lexer.pick()
            return token
        }

        if (Const.NAME_PATTEN().exec(token) != null) { // 变量
            
            if (this.lexer.lookups(2) == "[") { 
                var container = this.lexer.pick()
                this.lexer.pick() // 去掉 [
                var next = this.lexer.lookup()
                if (Const.STRING_PATTEN().exec(next) != null) { // 字典
                    var key = this.parse_expr()
                    this.lexer.pick()
                    return {
                        "oper": "mget",
                        "map" : container,
                        "key" : key
                    }
                } else { // TODO 数组下标
                    var key = this.parse_expr()
                    this.lexer.pick()
                    return {
                        "oper": "aget",
                        "arr" : container,
                        "index" : key
                    }
                } 

            } else { // 变量
                if (this.lexer.lookups(2) == "(") { // 函数调用
                    var func_name = this.lexer.pick()
                    this.lexer.pick() // 去掉左括号
                    var alist = this.parse_alist()
                    this.lexer.pick() // 去掉右括号
                    return {
                        "oper": "call",
                        "func": func_name,
                        "alist": alist
                    }

                } else {
                    var letter = this.lexer.pick() // 字符串（变量）
                    
                    if (this.lexer.lookup() == "=") {
                        var token = this.lexer.pick() // 获取等号
                        var expr = this.parse_expr()
                        return expr
                    } else {
                        return letter 
                    }
                }
            }
        }

    }

    /*
     * alist: "" | expr {, expr} // 实参列表
     */
    parse_alist() {
        var out = []
        if (this.lexer.lookup() != ")") { 
            var para = this.parse_expr()
            out.push(para)
            while( this.lexer.lookup() == "," ) {
                this.lexer.pick()
                var para = this.parse_expr()
                out.push(para)
            }
        }
        return out
    }
    
}

module.exports = Parser;