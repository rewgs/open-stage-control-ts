var Panel = require('./panel'),
    Widget = require('../common/widget'),
    StaticProperties = require('../mixins/static_properties'),
    resize = require('../../events/resize')

module.exports = class Tab extends StaticProperties(Panel, {scroll: true}) {

    static description() {

        return 'Tabbed panel widget'

    }

    static defaults() {

        return Widget.defaults({

            _tab:'tab',

            detached: {type: 'boolean', value: true, help: 'Set to `false` if the tab contains `frame` widgets that should not be reloaded when the tab opens'},
            layout: {type: 'string', value: 'default', choices: ['default', 'vertical', 'horizontal'], help:''},
            traversing: {type: 'boolean', value: false, help: 'Set to `true` to enable traversing gestures in this widget. Set to `smart` or `auto` to limit affected widgets by the type of the first touched widget'},
            variables: {type: '*', value: '@{parent.variables}', help: 'Defines one or more arbitrary variables that can be inherited by children widgets'},

        }, ['_geometry', 'left', 'top', 'width', 'height', 'scroll'], {

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

    }
    show() {
        if (!this.detached) return
        if (this.getProp('detached')) this.container.appendChild(this.widget)
        this.container.classList.add('show')
        this.detached = false
        resize.check(this.widget, true)
    }

    onPropChanged(propName, options, oldPropValue) {

        if (super.onPropChanged(...arguments)) return true

        switch (propName) {

            case 'visible':
            case 'label':
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
