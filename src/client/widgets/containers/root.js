var Panel = require('./panel'),
    StaticProperties = require('../mixins/static_properties'),
    mainMenu

setTimeout(()=>{
    mainMenu= require('../../ui/main-menu')
})

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
                lineWidth: null,
                _separator_root_style: 'Root style',
                hideMenu: {type: 'boolean', value: false, help: 'Set to `true` to hide the main menu button.'},

            }
        })

    }

    constructor(options) {

        options.root = true
        options.props.id = 'root'

        super(options)

        this.widget.classList.add('root')

        this.checkMenuVisibility()

        DOM.each(this.widget, '> .navigation', (el)=>{
            el.classList.add('main')
        })

    }

    checkMenuVisibility() {
        if (this.getProp('hideMenu')) {
            mainMenu.container.style.display = 'none'
        } else {
            mainMenu.container.style.display = ''
        }
    }

    isVisible() {

        return true

    }

    onPropChanged(propName, options, oldPropValue) {

        if (super.onPropChanged(...arguments)) return true

        switch (propName) {

            case 'hideMenu':
                this.checkMenuVisibility()
                return
        }

    }


    setContainerStyles(styles) {

        super.setContainerStyles(styles)

        this.container.classList.toggle('auto-height', this.getProp('height') === 'auto')

    }


}

Root.dynamicProps = Root.prototype.constructor.dynamicProps.concat(
    'hideMenu'
)


module.exports = Root
