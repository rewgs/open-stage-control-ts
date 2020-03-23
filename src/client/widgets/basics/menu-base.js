var Widget = require('../common/widget'),
    {deepEqual} = require('../../utils')

class MenuBase extends Widget {

    constructor(options) {

        super(options)

        this.value = undefined
        this.values = []
        this.keys = []
        this.objectInValues = false

    }

    parseValues() {

        this.values = []
        this.keys = []

        var values = this.getProp('values') || []

        if (!Array.isArray(values) && !(typeof values === 'object' && values !== null)) {
            values = values !== '' ? [values] : []
        }

        this.values = !Array.isArray(values) ? Object.values(values) : values
        this.keys = !Array.isArray(values) ? Object.keys(values) : this.values
        this.objectInValues = this.values.some(x=>typeof x === 'object')

    }

    getIndex(value) {

        var index = this.values.indexOf(value)
        if (index === -1 && this.objectInValues) {
            for (var i = 0; i < this.values.length; i++) {
                if (deepEqual(value, this.values[i])) return i
            }
        }
        return index

    }

}

module.exports = MenuBase
