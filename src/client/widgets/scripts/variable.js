var Widget = require('../common/widget'),
    StaticProperties = require('../mixins/static_properties')

module.exports = class Variable extends StaticProperties(Widget, {bypass: true, interaction: false, visible: false}) {

    static description() {

        return 'Receives / stores a value, to be used in scripts (using the get function) or in properties (using the @{} syntax).'

    }

    static defaults() {

        return super.defaults({


        }, [
            'visible', 'interaction',
            '_geometry', 'left', 'top', 'width', 'height', 'expand',
            '_style',  'colorBg', 'colorText', 'colorWidget', 'colorFill', 'colorStroke', 'alphaStroke', 'alphaFillOn', 'alphaFillOff', 'padding', 'css',
            'decimals', 'bypass'
        ], {})

    }

    constructor(options) {

        super({...options, html: null})

    }


    setValue(v, options={}) {

        this.value = v

        if (options.sync) this.changed(options)

    }

}
