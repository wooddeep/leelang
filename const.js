class Const {
    constructor() {

    }

    static STRING_PATTEN() {
        return /".*"/
    }

    static NAME_PATTEN() {
        return /[_a-zA-Z][\-_a-zA-Z0-9]*/
    }

    static NUM_PATTEN() {
        return /\-?[0-9]+\.?[0-9]*[lf]*/
    }
}

module.exports = Const;