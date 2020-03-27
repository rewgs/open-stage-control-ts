var Panel = require('./panel'),
    Widget = require('../common/widget'),
    StaticProperties = require('../mixins/static_properties')

class Root extends StaticProperties(Panel, {visible: true, label: false, id: 'root'}) {

    static description() {

        return 'Main (unique) container'

    }

    static defaults() {

        return Widget.defaults({


            _panel:'panel',

            colorPanel: {type: 'string', value: 'auto', help: 'Panel background color. Set to "auto" to inherit from parent widget.'},
            layout: {type: 'string', value: 'default', choices: ['default', 'vertical', 'horizontal', 'grid'], help:'Defines how children are laid out.'},
            justify: {type: 'string', value: 'start', choices: ['start', 'end', 'center', 'space-around', 'space-between'], help:'If `layout` is `vertical` or `horizontal`, defines how widgets should be justified.'},
            gridTemplate: {type: 'string|number', value: '', help:'If `layout` is `grid`, can be either a number of columns of a value css grid-template definition.'},
            verticalTabs: {type: 'boolean', value: false, help: 'Set to `true` to display for vertical tab layout'},
            traversing: {type: 'boolean', value: false, help: 'Set to `true` to enable traversing gestures in this widget. Set to `smart` or `auto` to limit affected widgets by the type of the first touched widget'},
            scroll: {type: 'boolean', value: true, help: 'Set to `false` to disable scrollbars'},
            variables: {type: '*', value: '', help: 'Defines one or more arbitrary variables that can be inherited by children widgets'},

        }, [
            'visible', 'label',
            '_geometry', 'left', 'top', 'width', 'height', 'expand',
            'colorFill', 'colorStroke', 'alphaStroke', 'alphaFillOff',
        ], {

            widgets: {type: 'array', value: [], help: 'Each element of the array must be a widget object. A panel cannot contain widgets and tabs simultaneously.'},
            tabs: {type: 'array', value: [], help: 'Each element of the array must be a tab object. A panel cannot contain widgets and tabs simultaneously'},

            value: {type: 'integer', value: '', help: [
                'Defines currently widgeted tab in the widget',
                'A tab can be opened only by setting its parent\'s value'
            ]},

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
