var MenuBase = require('./menu-base'),
    {iconify} = require('../../ui/utils'),
    html = require('nanohtml'),
    raw = require('nanohtml/raw')

class Switch extends MenuBase {

    static description() {

        return 'Value selector button.'

    }

    static defaults() {

        return super.defaults({

            _switch:'switch',

            layout: {type: 'string', value: 'vertical', choices: ['vertical', 'horizontal', 'grid'], help:''},
            gridTemplate: {type: 'string|number', value: '', help:'If `layout` is `grid`, can be either a number of columns of a value css grid-template definition.'},
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
            colorTextOn: {type: 'string', value: 'auto', help: 'Defines the widget\'s text color when active.'},

        })

    }

    constructor(options) {

        super({...options, html: html`<inner></inner>`})

        this.container.classList.add('layout-' + this.getProp('layout'))

        if (this.getProp('layout') === 'grid') {
            var template = this.getProp('gridTemplate') || 2
            this.widget.style.gridTemplate = template === parseInt(template) ? `none / repeat(${template}, 1fr)` : template
        }

        this.parseValues()


        var dragCallback = (e, touchFix)=>{

            var index = 0,
                node = e.target

            if (touchFix && e.isTouch) {
                // special traversing touch fix
                node = document.elementFromPoint(e.clientX, e.clientY)
            }

            if (node === this.widget || !this.widget.contains(node)) return

            while ((node = node.previousSibling)) {
                if (node.nodeType != 3) {
                    index++
                }
            }

            var value = this.values[index]

            if (value !== this.value || this.value === undefined) this.setValue(value, {sync: true, send: true})

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

    parseValues() {

        super.parseValues()

        for (var i = 0; i < this.values.length; i++) {

            this.widget.appendChild(html`
                <value>${raw(iconify(this.keys[i]))}</value>
            `)

        }

    }

    setValue(v, options={}) {

        var i = this.getIndex(v)


        if (i !== -1) {

            this.value = this.values[i]

            DOM.each(this.widget, '.on', (el)=>{el.classList.remove('on')})
            DOM.get(this.widget, 'value')[i].classList.add('on')

            if (options.send) this.sendValue(this.value)
            if (options.sync) this.changed(options)
        }

    }
}

Switch.cssVariables = Switch.prototype.constructor.cssVariables.concat(
    {js: 'colorTextOn', css: '--color-text-on'}
)

module.exports = Switch
