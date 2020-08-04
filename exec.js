
/*
 * @author: lihan@migu.cn && niutourenqz@sina.com
 * @description: syntax tree executor 
 */

let Const = require('./const.js'); 

class Executor {

    constructor(parser) {
        this.parser = parser
        this.const_map = parser.const_map  // 全局变量表
        this.func_map = parser.func_map   // 函数表
    }

    eval(obj, amap, vmap) {
        if (typeof(obj) == 'object') {

            if (obj.t == "str") { // 字符串对象
                //return obj.v.substr(1, obj.v.length - 2)
                return obj.v
            }

            if (obj.oper == "+") {            
                var result = this.eval(obj.left, amap, vmap) + this.eval(obj.right, amap, vmap); // 支持字符串的操作
                return result
            }
    
            if (obj.oper == "-") {
                var result = this.eval(obj.left, amap, vmap) - this.eval(obj.right, amap, vmap);
                return result
            }
    
            if (obj.oper == "*") {
                var result = this.eval(obj.left, amap, vmap) * this.eval(obj.right, amap, vmap);
                return result
            }
    
            if (obj.oper == "/") {
                var result = this.eval(obj.left, amap, vmap) / this.eval(obj.right, amap, vmap);
                return result
            }
    
            if (obj.oper == "cmp") { // 比较运算符
                var token = obj.token
                if (token == ">") {
                    var result = this.eval(obj.left, amap, vmap) > this.eval(obj.right, amap, vmap);
                    return result
                }
                if (token == ">=") {
                    var result = this.eval(obj.left, amap, vmap) >= this.eval(obj.right, amap, vmap);
                    return result
                }
                if (token == "<") {
                    var result = this.eval(obj.left, amap, vmap) < this.eval(obj.right, amap, vmap);
                    return result
                }
                if (token == "<=") {
                    var result = this.eval(obj.left, amap, vmap) <= this.eval(obj.right, amap, vmap);
                    return result
                }
                if (token == "==") {
                    var result = this.eval(obj.left, amap, vmap) == this.eval(obj.right, amap, vmap);
                    return result
                }
                if (token == "!=") {
                    var result = this.eval(obj.left, amap, vmap) != this.eval(obj.right, amap, vmap);
                    return result
                }
            }

            if (obj.oper == "assign") { // 变量赋值， 全局变量，参数，局部变量
    
                if (amap == undefined) { // 必然为全局赋值
                    this.const_map[obj.name] = this.eval(obj.value, amap, vmap)
                    return this.const_map[obj.name]
                } else {
    
                    if (amap[obj.name] != undefined) { // 参数
                        amap[obj.name] = this.eval(obj.value, amap, vmap)
                        return amap[obj.name]
                    }
    
                    if (obj.local == true) { // 局部变量 定义
                        vmap[obj.name] = this.eval(obj.value, amap, vmap) // 对局部变量赋值
                        return vmap[obj.name]
                    } 
    
                    if (vmap[obj.name] != undefined) { // 局部变量赋值
                        vmap[obj.name] = this.eval(obj.value, amap, vmap)
                        return vmap[obj.name]
                    }
                    
                    this.const_map[obj.name] = this.eval(obj.value, amap, vmap) // 全局变量
                    return this.const_map[obj.name]
                }
                
            }
            
            if (obj.oper == "while") {
                while (this.eval(obj.cond, amap, vmap) > 0) {
                    for (var i = 0; i < obj.do.length; i++) {
                        console.log(this.eval(obj.do[i], amap, vmap))
                    }
                }
            }
            
            if (obj.oper == "if") {
                if (this.eval(obj.cond, amap, vmap) > 0) {
                    var statements = obj["match"]
                    
                    for (var i = 0 ; i < statements.length - 1; i++) {
                        var stmt = statements[i]
                        if (typeof(stmt) == 'object' && stmt.oper == 'call') {
                            stmt.vmap = vmap
                        }

                        this.eval(stmt, amap, vmap) // 执行函数体
                    }
                    var stmt = statements[statements.length - 1]
                    if (typeof(stmt) == 'object' && stmt.oper == 'call') {
                        stmt.vmap = vmap
                    }
                    return this.eval(stmt, amap, vmap)
                    
                } else {
                    if (obj["unmatch"] != undefined) {
                        var statements = obj["unmatch"]
                    
                        for (var i = 0 ; i < statements.length - 1; i++) {
                            var stmt = statements[i]
                            if (typeof(stmt) == 'object' && stmt.oper == 'call') {
                                stmt.vmap = vmap
                            }
    
                            this.eval(stmt, amap, vmap) // 执行函数体

                        }

                        var stmt = statements[statements.length - 1]
                        if (typeof(stmt) == 'object' && stmt.oper == 'call') {
                            stmt.vmap = vmap
                        }

                        return this.eval(stmt, amap, vmap)
                    }
                }
            }
    
            if (obj.oper == "call") {
                var func_name = obj.func
                var alist = obj.alist
                var statements = this.func_map[func_name].block
                var plist = this.func_map[func_name].plist
                alist = alist.map((o) => this.eval(o, amap, vmap)) // 首先计算 各 实参的值
                
                var amap = {}
                for (var i = 0; i < plist.length; i++) {
                    amap[plist[i]] = alist[i]
                }
    
                obj.amap = amap;
                
                vmap = {}
                for (var i = 0 ; i < statements.length - 1; i++) {
                    statements[i].func = true // 在函数中
                    statements[i].vmap = vmap
                    this.eval(statements[i], amap, vmap) // 执行函数体
                }
                
                statements[statements.length - 1].func = true // 在函数中
                statements[statements.length - 1].vmap = vmap // 局部变量表
                return this.eval(statements[statements.length - 1], amap, vmap)
            }
            
            
            if (obj.oper == "map") { // 数据类型 为 表
                return obj.data
            }
            
            if (obj.oper == "mget") { // map 取值 TODO， 1)map设置值; 2) 判断map是否为局部变量
                var map_name = obj.map
                var map = this.const_map[map_name]
                var key = this.eval(obj.key, amap, vmap) 
                
                console.log("## get key -> ", key)

                console.log("## fuck:", map[key])
                
                return this.eval(map[key], amap, vmap)
            }

            if (obj.oper == "set") { // map 或者 array 设置
                var map_name = obj.map
                var map = this.const_map[map_name]
                var key = this.eval(obj.key, amap, vmap)
                console.log("## set key -> ", key)
                var value = this.eval(obj.value, amap, vmap)
                map[key] = value
                return value
            }
    
        }
    
        if (typeof(obj) == 'string') { // 立即数 或者 变量
            if (/^[0-9]+(\.[0-9]+)?[fl]?/.exec(obj) != null) { // 整形数，浮点数
                if (obj.indexOf(".") < 0) {
                    return parseInt(obj)
                } else {
                    return parseFloat(obj)
                }
            }

            if (Const.STRING_PATTEN().exec(obj) != null) { // 数据是字符串 // TODO
                //return obj.substr(1, obj.length - 2)
                return obj
            }
            
            if (/^[_a-zA-Z][\-_a-zA-Z0-9]*/.exec(obj) != null) { // 变量
    
                if (amap != undefined && amap[obj] != undefined) { // 参数
                    return amap[obj]
                }
    
                if (vmap != undefined && vmap[obj] != undefined) { // 局部变量
                    return vmap[obj]
                }
    
                return this.const_map[obj] // 全局变量
            }
        }
    }

}




module.exports = Executor