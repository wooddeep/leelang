class Const {
    constructor() {

    }

    static STRING_PATTEN() {
        return /".*"/
    }

    static KEY_NAME_PATTEN() {
        return /[_a-zA-Z][\-_a-zA-Z0-9]*/
    }
}

module.exports = Const;