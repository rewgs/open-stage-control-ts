var Panel = require('./panel'),
    StaticProperties = require('../mixins/static_properties')

class Root extends StaticProperties(Panel, {visible: true, label: false, id: 'root'}) {

    static description() {

        return 'Main (unique) container'

    }

    static defaults() {

        return super.defaults().extend({
            widgets: {
                visible: null,
            },
            geometry: {
                left: null,
                top: null,
                expand: null,
            },
            style: {
                colorFill: null,
                colorStroke: null,
                alphaStroke: null,
                alphaFillOff: null,
                lineWidth: null
            }
        })

    }

    constructor(options) {

        options.root = true
        options.props.id = 'root'

        super(options)

        this.widget.classList.add('root')


        DOM.each(this.widget, '> .navigation', (el)=>{
            el.classList.add('main')
        })

    }

    isVisible() {

        return true

    }


}


module.exports = Root
