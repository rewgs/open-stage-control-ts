var Widget = require('../common/widget'),
    {iconify} = require('../../ui/utils'),
    html = require('nanohtml'),
    raw = require('nanohtml/raw')

class Switch extends Widget {

    static description() {

        return 'Value selector button.'

    }

    static defaults() {

        return super.defaults({

            _switch:'switch',

            layout: {type: 'string', value: 'vertical', choices: ['vertical', 'horizontal', 'grid'], help:''},
            gridTemplate: {type: 'string|number', value: '', help:'If `layout` is `grid`, can be either a number of columns of a value css grid-template definition.'},
            showValues: {type: 'boolean', value: false, help: 'If values is an object, set to `true` to display both values and labels instead of labels only'},
            values: {type: 'array|object', value: {'Value 1':1,'Value 2':2}, help: [
                '`Array` of possible values to switch between : `[1,2,3]`',
                '`Object` of `"label":value` pairs. Numeric labels must be prepended or appended with a white space (or any other non-numeric character) otherwise the order of the values won\'t be kept',
            ]},
            mode: {type: 'string', value: 'tap', choices: ['tap', 'slide', 'click'], help: [
                'Interraction mode:',
                '- `tap`: activates when the pointer is down but prevents further scrolling',
                '- `slide`: same as `tap` but allows sliding between values',
                '- `click`: activates upon click only and allows further scrolling',
            ]},
            colorTextOn: {type: 'string', value: 'auto', help: 'Defines the widget\'s accent color (css variable `--custom-color`). Must be a valid CSS color. Set to "auto" to inherit from parent widget.'},

        })

    }

    constructor(options) {

        super({...options, html: html`<inner></inner>`})

        this.container.classList.add('layout-' + this.getProp('layout'))

        if (this.getProp('layout') === 'grid') {
            var template = this.getProp('gridTemplate') || 2
            this.widget.style.gridTemplate = template === parseInt(template) ? `none / repeat(${template}, 1fr)` : template
        }


        this.values = []
        this.stringValues = []

        var values =  this.getProp('values')

        if (!Array.isArray(values) && !(typeof values === 'object' && values !== null)) {
            values = [values]
        }

        var isArray = Array.isArray(values)

        for (var k in values) {

            this.values.push(values[k])

            if (typeof values[k] == 'object') {
                this.stringValues.push(JSON.stringify(values[k]))
            } else {
                this.stringValues.push(0)
            }

            var label = isArray ? values[k]: k
            if (this.getProp('showValues') && !isArray) label = label + ': ' + (this.stringValues[this.stringValues.length - 1] || values[k])

            this.widget.appendChild(html`
                <value> ${raw(iconify(label))}</value>
            `)

        }

        this.value = undefined

        var dragCallback = (e, touchFix)=>{

            var index = 0,
                node = e.target

            if (touchFix && e.isTouch) {
                // special traversing touch fix
                node = document.elementFromPoint(e.clientX, e.clientY)
            }

            if (node === this.widget || !this.widget.contains(node)) return

            while ( (node = node.previousSibling) ) {
                if (node.nodeType != 3) {
                    index++
                }
            }

            var value = this.values[index]

            if (value!=this.value || this.value===undefined) this.setValue(value,{sync:true,send:true})

        }

        if (this.getProp('mode') === 'tap' || this.getProp('mode') === 'slide') {
            this.on('draginit', dragCallback , {element: this.widget})
            this.on('drag', (e)=>{
                if (this.getProp('mode') === 'slide' || e.traversing) dragCallback(e, true)
            } , {element: this.widget})
        } else {
            this.widget.addEventListener('click', dragCallback)

        }

    }

    setValue(v, options={}) {

        var i = typeof v == 'object' ?
            this.stringValues.indexOf(JSON.stringify(v)) :
            this.values.indexOf(v)

        DOM.each(this.widget, '.on', (el)=>{el.classList.remove('on')})

        if (i!=-1) {
            this.value = this.values[i]
            DOM.get(this.widget, 'value')[i].classList.add('on')
            if (options.send) this.sendValue(this.value)
            if (options.sync) this.changed(options)
        } else {
            this.value = undefined
            if (options.sync) this.changed(options)
        }

    }
}

Switch.cssVariables = Switch.prototype.constructor.cssVariables.concat(
    {js: 'colorTextOn', css: '--color-text-on'}
)

module.exports = Switch
