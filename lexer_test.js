let Lexer = require('./lexer.js'); 
let lexer = new Lexer()

const formula = 
`
globalvar = -1;
if (a >= 1 && b != 0) {

};
globalfvar = 1.01f;
name = "lihan";
func del(a, b) {
    local base = 0;
    base = base - 1;
    base - (a - b) + globalvar
};
`

lexer.analyze(formula)

console.log(lexer.lookup())
console.log(lexer.lookup(1))
console.log(lexer.lookup(2))
console.log(lexer.pick())

n = 0
while( (token = lexer.lookup(n++)) != "EOF" && token != undefined) {
    console.log(token)
}
