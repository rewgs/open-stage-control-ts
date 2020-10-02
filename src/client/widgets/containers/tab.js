var Panel = require('./panel'),
    Widget = require('../common/widget'),
    resize = require('../../events/resize'),
    {iconify} = require('../../ui/utils')

class Tab extends Panel {

    static description() {

        return 'Tabbed panel widget'

    }

    static defaults() {

        return Widget.defaults({


            _class_specific: 'panel',

            colorBg: {type: 'string', value: 'auto', help: 'Panel background color. Set to "auto" to inherit from parent widget.'},
            label: {type: 'string|boolean', value: 'auto', help: [
                'Set to `false` to hide completely',
                '- Insert icons using the prefix ^ followed by the icon\'s name : `^play`, `^pause`, etc (see https://fontawesome.com/icons?d=gallery&s=solid&m=free)',
                '- Icons can be transformed with the following suffixes: `.flip-[horizontal|vertical|both]`, `.rotate-[90|180|270]`, `.spin`, `.pulse`. Example: `^play.flip-horizontal`',
            ]},
            variables: {type: '*', value: '@{parent.variables}', help: 'Defines one or more arbitrary variables that can be inherited by children widgets'},
            traversing: {type: 'boolean', value: false, help: 'Set to `true` to enable traversing gestures in this widget. Set to `smart` or `auto` to limit affected widgets by the type of the first touched widget'},
            // detached: {type: 'boolean', value: true, help: 'Set to `false` if the tab contains `frame` widgets that should not be reloaded when the tab opens'},

            _separator1: 'widget container',

            layout: {type: 'string', value: 'default', choices: ['default', 'vertical', 'horizontal', 'grid'], help:'Defines how children are laid out.'},
            justify: {type: 'string', value: 'start', choices: ['start', 'end', 'center', 'space-around', 'space-between'], help:'If `layout` is `vertical` or `horizontal`, defines how widgets should be justified.'},
            gridTemplate: {type: 'string|number', value: '', help:'If `layout` is `grid`, can be either a number of columns of a value css grid-template definition.'},
            contain: {type: 'boolean', value: true, help:'If `layout` is `vertical` or `horizontal`, prevents children from overflowing the panel.'},
            scroll: {type: 'boolean', value: true, help: 'Set to `false` to disable scrollbars'},
            innerPadding: {type : 'boolean', value: true, help: 'Set to `false` to make the `padding` property apply only between children and not at the container\'s inner boundaries.'},

            _separator2: 'tab container',

            verticalTabs: {type: 'boolean', value: false, help: 'Set to `true` to display for vertical tab layout'},

        }, [
            '_geometry', 'left', 'top', 'width', 'height', 'expand',
            'colorStroke', 'alphaStroke', 'alphaFillOff', 'alphaFillOn'
        ], {

            _children:'children',

            widgets: {type: 'array', value: [], help: 'Each element of the array must be a widget object. A panel cannot contain widgets and tabs simultaneously.'},
            tabs: {type: 'array', value: [], help: 'Each element of the array must be a tab object. A panel cannot contain widgets and tabs simultaneously'},

            value: {type: 'integer', value: '', help: [
                'Defines currently widgeted tab in the widget',
                'A tab can be opened only by setting its parent\'s value'
            ]},

        })

    }

    constructor(options) {

        super(options)

        this.container.classList.add('show')

        this.detached = false

        this.label = ''
        this.updateLabel()

    }

    updateLabel() {

        if (this.getProp('label') === false) {
            this.label = ''
        } else {
            this.label = this.getProp('label') == 'auto'?
                    this.getProp('id'):
                    iconify(String(this.getProp('label')).replace(/</g, '&lt;'))
        }

    }

    hide() {
        if (this.detached) return
        if (this.getProp('detached')) this.container.removeChild(this.widget)
        this.container.classList.remove('show')
        this.detached = true
        this.setVisibility()
    }

    show() {
        if (!this.detached) return
        if (this.getProp('detached')) this.container.appendChild(this.widget)
        this.container.classList.add('show')
        this.detached = false
        this.setVisibility()
        resize.check(this.widget, true)
    }

    isVisible() {

        return !this.detached && super.isVisible()

    }

    onPropChanged(propName, options, oldPropValue) {

        if (super.onPropChanged(...arguments)) return true

        switch (propName) {

            case 'label':
                this.updateLabel()
            case 'visible':
            case 'colorText':
            case 'colorWidget':
            case 'colorFill':
            case 'colorStroke':
            case 'alphaStroke':
            case 'alphaFillOff':
            case 'alphaFillOn':
                if (this.parent.createNavigation) this.parent.createNavigation()
                return

        }

    }

}

Tab.dynamicProps = Tab.prototype.constructor.dynamicProps.concat(
    'label'
)

module.exports = Tab
