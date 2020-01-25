var Widget = require('../common/widget'),
    {iconify} = require('../../ui/utils'),
    doubletab = require('../mixins/double_tap'),
    html = require('nanohtml'),
    raw = require('nanohtml/raw')

class Menu extends Widget {

    static description() {

        return 'Drag and drop menu with a circular layout'

    }

    static defaults() {

        return super.defaults({

            _menu:'menu',

            size: {type: 'number|array', value: 200, help: [
                '- If `circular` is `true`: diameter (in px)',
                '- If `circular` is `false`: square size or `[width, height]` array',
            ]},
            circular: {type: 'boolean', value: true, help: [
                'Defines whether the menu should be rendered in a circle or in a box'
            ]},
            vertical: {type: 'boolean|number', value: false, help: [
                'If `circular` is `false`, set this to `true` for vertical layout',
                'Ignored when `grid` is `true`'
            ]},
            grid: {type: 'boolean|number', value: false, help: [
                '- If `circular` is `false`, set this to `true` for grid layout',
                '- Can be a `number` to define the number of columns'
            ]},
            toggle: {type: 'boolean', value: false, help: 'Set to `true` to make the menu stay opened after mouse/touch release'},
            doubleTap: {type: 'boolean', value: false, help: 'Set to `true` to make the menu require a double tap to be opened instead of a single tap'},
            values: {type: 'array|object', value: {'Value 1':1,'Value 2':2}, help: [
                '`Array` of possible values to switch between : `[1,2,3]`',
                '`Object` of label:value pairs. Numeric labels must be prepended or appended with a white space (or any other non-numeric character) otherwise the order of the values won\'t be kept',
            ]},
            weights: {type: 'array', value: '', help: [
                '`Array` of `number` defining the weights of each value in `values`',
                'Ignored when `grid` is `true`'
            ]}

        })

    }

    constructor(options) {

        super({...options, html: html`<div class="toggle"></div>`})

        this.menu = this.widget.appendChild(html`<div class="menu"></div>`)

        this.opened = false
        this.values = []
        this.selected = -1
        this.value = undefined

        this.parseValues()


        this.parentScroll = [0,0]
        this.opened = false


        if (this.getProp('doubleTap')) {

            doubletab(this.widget, (e)=>{
                if (this.opened) return
                this.open(e)
            })

            this.on('draginit',(e)=>{

                if (this.opened && this.getProp('toggle')) {

                    this.selectValue(e)
                    this.submitValue()

                }

            }, {element: this.widget})


        } else {

            this.on('draginit',(e)=>{

                if (this.opened && this.getProp('toggle')) {

                    this.selectValue(e)
                    this.submitValue()

                } else if (!this.opened) {

                    this.open(e)

                }

            }, {element: this.widget})

        }

        if (!this.getProp('toggle')) {

            this.on('drag',(e)=>{

                this.selectValue(e)

            }, {element: this.widget})

            this.on('dragend',()=>{

                if (!this.opened) return
                this.submitValue()

            }, {element: this.widget})

        } else {

            this.menu.classList.add('norelease')

        }

        this.setMode()
        this.setSize()

    }

    open(e) {

        this.opened = true
        var off = this.scrollOffset()
        this.menu.style.setProperty('--x', (e.offsetX - off[0]) / PXSCALE + 'rem')
        this.menu.style.setProperty('--y', (e.offsetY - off[1]) / PXSCALE + 'rem')
        this.menu.classList.add('show')
        this.widget.classList.add('on')
        this.container.classList.add('on')

    }

    close() {

        this.opened = false
        this.menu.classList.remove('show')
        DOM.each(this.menu, '.active', (el)=>{el.classList.remove('active')})
        this.container.classList.remove('on')
        this.widget.classList.remove('on')

    }

    selectValue(e) {

        if (e.target === this.menu || !this.menu.contains(e.target)) {
            DOM.each(this.menu, '.active', (el)=>{el.classList.remove('active')})
            this.selected = -1
        } else if (!e.target.classList.contains('active')) {
            DOM.each(this.menu, '.active', (el)=>{el.classList.remove('active')})
            e.target.classList.add('active')
            this.selected = DOM.index(e.target)
        }

    }

    submitValue(e) {

        this.close()
        if (this.selected > -1) {
            this.setValue(this.values[this.selected], {send: true, sync: true})
        }

    }

    parseValues() {

        var nval = 0,
            i = 0,
            circular = this.getProp('circular'),
            values = this.getProp('values'),
            weights = this.getProp('weights'),
            totalWeight

        if (!Array.isArray(values) && !(typeof values === 'object' && values !== null)) {
            values = values !== '' ? [values] : []
        }

        this.values = []
        this.widget.removeChild(this.menu)
        this.menu.innerHTML = ''


        nval = Array.isArray(values) ? values.length : Object.keys(values).length
        weights = Array.isArray(weights) ? weights.slice(0, nval) : Array(nval).fill(1)
        if (weights.length < nval) weights = weights.concat(Array(nval - weights.length).fill(1))
        totalWeight = weights.reduce((a, b) => a + b, 0)

        var ac = 0
        for (let k in values) {
            let angle = Math.min(360 * weights[i] / totalWeight, 120),
                skew = 90 - angle
            this.values.push(values[k])
            this.menu.appendChild(html`
                <div class="item" style="${circular ? `transform: rotate(${ac}deg) skew(${skew}deg)` : `flex: ${weights[i]}`}">
                    <div style="${circular ? `transform: skew(${-skew}deg) rotate(${-90 + angle / 2}deg)` : ''}"><span style="${circular ? `transform: rotate(${-ac + 90 - angle / 2}deg)` : ''}">${raw(iconify(parseFloat(k) != k ? k : values[k]))}</span></div>
                </div>
            `)
            i++
            ac+=angle

        }


        this.setValue(this.value)

        this.widget.appendChild(this.menu)

        if (!this.getProp('circular') && this.getProp('grid')) {
            this.container.style.setProperty('--grid-columns', this.getProp('grid') === true ? parseInt(nval / 2) : parseInt(this.getProp('grid')))
        }

    }

    setMode() {

        this.container.classList.toggle('box', !this.getProp('circular'))
        this.container.classList.toggle('circular', this.getProp('circular'))
        this.container.classList.toggle('grid', this.getProp('grid') && !this.getProp('circular'))
        this.container.classList.toggle('vertical', this.getProp('vertical') && !this.getProp('circular'))

    }

    setSize() {

        var size = this.getProp('size')
        if (Array.isArray(size)) {
            this.container.style.setProperty('--size', parseInt(size[0]) + 'rem')
            this.container.style.setProperty('--size-box-w', parseInt(size[0]) + 'rem')
            this.container.style.setProperty('--size-box-h', parseInt(size[1]) + 'rem')

        } else {
            this.container.style.setProperty('--size', parseInt(size) + 'rem')
            this.container.style.setProperty('--size-box-w', parseInt(size) + 'rem')
            this.container.style.setProperty('--size-box-h', parseInt(size) + 'rem')
        }

    }

    scrollOffset() {

        var parent = this.parent,
            scrollOffset = [0,0]

        while (parent && parent.props && parent.getProp('type') !== 'tab') {
            scrollOffset[0] += parent.widget.scrollLeft
            scrollOffset[1] += parent.widget.scrollTop
            parent = parent.parent
        }

        return scrollOffset

    }

    setValue(v,options={}) {

        var i = this.values.indexOf(v)

        if (i > -1) {
            this.value = this.values[i]
            this.selected = i
        }

        DOM.each(this.menu, '.on', (el)=>{el.classList.remove('on')})
        if (i > -1) DOM.get(this.menu, '.item')[i].classList.add('on')

        if (options.send) this.sendValue()
        if (options.sync) this.changed(options)

    }

    onPropChanged(propName, options, oldPropValue) {

        var ret = super.onPropChanged(...arguments)

        switch (propName) {

            case 'size':
                this.setSize()
                return
            case 'vertical':
                this.setMode()
                return
            case 'circular':
                this.setMode()
                this.parseValues()
                return
            case 'grid':
                this.setMode()
                if (this.getProp('grid') === true) this.parseValues()
                return
            case 'values':
                this.parseValues()
                return

        }

        return ret

    }

}

Menu.dynamicProps = Menu.prototype.constructor.dynamicProps.concat(
    'size',
    'circular',
    'vertical',
    'grid',
    'values'
)


module.exports = Menu
