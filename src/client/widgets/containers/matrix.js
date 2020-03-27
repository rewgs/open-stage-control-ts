var Panel = require('./panel'),
    Widget = require('../common/widget'),
    StaticProperties = require('../mixins/static_properties'),
    parser = require('../../parser'),
    {deepCopy} = require('../../utils')


class Matrix extends StaticProperties(Panel, {scroll: false}) {

    static description() {

        return 'Generic matrix for creating rows/columns of widgets.'

    }

    static defaults() {

        return Widget.defaults({

            _matrix: 'matrix',

            widgetType: {type: 'string', value: 'button', help: 'Defines the type of the widgets in the matrix'},
            colorPanel: {type: 'string', value: 'auto', help: 'Panel background color. Set to "auto" to inherit from parent widget.'},
            layout: {type: 'string', value: 'horizontal', choices: ['horizontal', 'vertical', 'grid'], help: 'Defines how children are laid out.'},
            gridTemplate: {type: 'string|number', value: '', help:'If `layout` is `grid`, can be either a number of columns of a value css grid-template definition.'},
            quantity: {type: 'number', value: 4, help: 'Defines the number of widgets in the matrix'},
            start: {type: 'integer', value: 0, help: 'First widget\'s index'},
            traversing: {type: 'boolean', value: true, help: 'Set to `false` to disable traversing gestures'},
            props: {type: 'object', value: {}, help: [
                'Defines a set of property to override the widgets\' defaults.',
                'Formulas in this field are resolved with an extra variable representing each widget\'s index: `$`',
                'Note: by default, the widgets inherit from the matrix\' `id` and osc properties (`id` and `address` are appended with `/$`)'
            ]}

        }, [], {})

    }

    constructor(options) {

        super(options)

        this.childrenType = undefined

        this.value = []

        this.on('change',(e)=>{

            if (e.widget === this) return

            if (this.getProp('widgetType') === 'clone') {

                if (e.widget.parent.parent !== this) return

                this.value[e.widget.parent._index] = e.widget.getValue()

            } else {

                if (e.widget.parent !== this) return

                this.value[e.widget._index] = e.widget.getValue()


            }

            this.changed(e.options)

        })



        this.start = parseInt(this.getProp('start'))

        if (parser.widgets[this.getProp('widgetType')]) {

            for (let i = 0; i < this.getProp('quantity'); i++) {

                var props = this.resolveProp('props', undefined, false, false, false, {'$':i + this.start})
                var data = this.defaultProps(i + this.start)

                if (typeof props === 'object' && props !== null) {
                    Object.assign(data, props)
                }

                var widget = parser.parse({
                    data: data,
                    parentNode: this.widget,
                    parent: this
                })

                widget._index = i
                widget.container.classList.add('not-editable')

                this.value[i] = widget.getValue()

            }

        } else {

            this.errors.widgetType = this.getProp('widgetType') + ' is not a valid widget type'

        }



    }

    defaultProps(i) {

        return {
            type: this.getProp('widgetType'),
            id: '@{parent.id}/' + i,
            address: '@{parent.address}/' + i,
            preArgs: '@{parent.preArgs}',
            target: '@{parent.target}',
            decimals: '@{parent.decimals}',
            bypass: '@{parent.bypass}',
            label: i,
            top: 'auto',
            left: 'auto',
            height: 'auto',
            width: 'auto'
        }

    }

    onPropChanged(propName, options, oldPropValue) {

        if (super.onPropChanged(...arguments)) return true

        switch (propName) {

            case 'props':

                for (let i = this.children.length - 1; i >= 0; i--) {

                    let data = this.resolveProp('props', undefined, false, false, false, {'$': i + this.start})

                    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
                        data = {}
                    }

                    if (typeof oldPropValue === 'object' && oldPropValue !== null) {
                        // if an overridden default props is removed, set it back to default
                        let overriddenDefaults,
                            widgetDefaults
                        for (var k in oldPropValue) {
                            if (data[k] === undefined) {
                                if (Matrix.overriddenDefaults.indexOf(k) !== -1) {
                                    overriddenDefaults = overriddenDefaults || this.defaultProps(i + this.start)
                                    data[k] = overriddenDefaults[k]
                                } else {
                                    widgetDefaults = widgetDefaults || parser.defaults[data.type || this.getProp('widgetType')]
                                    data[k] = deepCopy(widgetDefaults[k])
                                }
                            }
                        }
                    }

                    Object.assign(this.children[i].props, data)

                    this.children[i].updateProps(Object.keys(data), this, options)
                    // this.children[i] might have been recreated
                    this.children[i].container.classList.add('not-editable')

                }

                return

        }

    }

}



Matrix.overriddenDefaults = [
    'type', 'id', 'address', 'preArgs', 'target', 'decimals', 'bypass',
    'label', 'top', 'left', 'height', 'width'
]

Matrix.parsersContexts.props = {
    $: 0
}

Matrix.dynamicProps = Matrix.prototype.constructor.dynamicProps.concat(
    'props'
)

module.exports = Matrix
