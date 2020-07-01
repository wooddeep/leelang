/*
 * @author: lihan@migu.cn && niutourenqz@sina.com
 * @description: syntax parser 
 */


/*

expr: term { ("+" | "-") term } 
     | NAME "=" expr
     | local NAME "=" expr

term: factor { ("*" | "/") factor }

factor: NUMBER | "(" expr ")" | NAME | FUNCNAME "(" alist ")" | STRING 

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
    parse_term() {
        var left =  this.parse_factor()

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
     parse_factor() {
        var token = this.lexer.lookup()

        if (token == "(") {
            this.lexer.pick()
            var expr = this.parse_expr()
            this.lexer.pick()
            return expr
        }

        if (/[0-9]+/.exec(token) != null) {
            var token = this.lexer.pick()
            return token
        }

        if (/[a-zA-Z]+/.exec(token) != null) { // 变量
            
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