/*
 * @author: lihan@migu.cn && niutourenqz@sina.com
 * @description: lexical analyzer 
 */
class Lexer {
    
    // /".*?"/ 正则匹配去贪婪模式
    constructor (formula) {
        this.token_patt = /#[^\n]*\n|[_a-zA-Z][\-_a-zA-Z0-9]*|".*?"|\-?[0-9]+\.?[0-9]*[lf]*|[,:;\+\-\*/=\(\)\{\}\[\]]|>|<|>=|<=|==|!=|>>|<<|&&|\|\|/gm
        //this.token_patt = /([_a-zA-Z][\-_a-zA-Z0-9]*|".*?"|\-?[0-9]+(.[0-9]+)?[fl]?|[,:;+\-*/=\(\)\{\}]|>|<|>=|<=|==|!=|>>|<<|&&|\|\|)/gm
        this.curr_index = 0
        this.token_list = []
        this.formula = formula
        this.analyze(this.formula) 
    }

    check(input) {
        do {
            var r = this.token_patt.exec(input)
            if (r != null) {
                console.log(r[0])
            }
        } while (r != null)
    }

    analyze(input) {
        this.token_list = []
        do {
            var r = this.token_patt.exec(input)
            if (r != null && r[0][0] != '#') {
                this.token_list.push(r[0])
            }
        } while (r != null)
    }

    pick() {
        if (this.curr_index == this.token_list.length - 1) {
            return "EOL"
        }

        var token = this.token_list[this.curr_index]
        this.curr_index = this.curr_index + 1
        return token
    }

    lookup(n = 0) {
        return this.token_list[this.curr_index + n]
    }

    lookups(n = 0) {
        return this.token_list[this.curr_index + n - 1]
    }
}


module.exports = Lexer;

