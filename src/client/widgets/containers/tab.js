var Panel = require('./panel'),
    Widget = require('../common/widget'),
    resize = require('../../events/resize')

module.exports = class Tab extends Panel {

    static description() {

        return 'Tabbed panel widget'

    }

    static defaults() {

        return Widget.defaults({

            _tab:'tab',

            // detached: {type: 'boolean', value: true, help: 'Set to `false` if the tab contains `frame` widgets that should not be reloaded when the tab opens'},
            colorPanel: {type: 'string', value: 'auto', help: 'Panel background color. Set to "auto" to inherit from parent widget.'},
            layout: {type: 'string', value: 'default', choices: ['default', 'vertical', 'horizontal', 'grid'], help:'Defines how children are laid out.'},
            justify: {type: 'string', value: 'start', choices: ['start', 'end', 'center', 'space-around', 'space-between'], help:'If `layout` is `vertical` or `horizontal`, defines how widgets should be justified.'},
            gridTemplate: {type: 'string|number', value: '', help:'If `layout` is `grid`, can be either a number of columns of a value css grid-template definition.'},
            verticalTabs: {type: 'boolean', value: false, help: 'Set to `true` to display for vertical tab layout'},
            traversing: {type: 'boolean', value: false, help: 'Set to `true` to enable traversing gestures in this widget. Set to `smart` or `auto` to limit affected widgets by the type of the first touched widget'},
            scroll: {type: 'boolean', value: true, help: 'Set to `false` to disable scrollbars'},
            variables: {type: '*', value: '@{parent.variables}', help: 'Defines one or more arbitrary variables that can be inherited by children widgets'},

        }, [
            '_geometry', 'left', 'top', 'width', 'height', 'expand',
            'colorStroke', 'alphaStroke', 'alphaFillOff', 'alphaFillOn'
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

        super(options)

        this.container.classList.add('show')

        this.detached = false

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

            case 'visible':
            case 'label':
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
