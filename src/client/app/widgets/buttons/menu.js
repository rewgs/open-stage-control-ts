var Widget = require('../common/widget'),
    {iconify} = require('../../ui/utils'),
    html = require('nanohtml'),
    raw = require('nanohtml/raw')

class Menu extends Widget {

    static defaults() {

        return super.defaults({

            _menu:'menu',

            size: {type: 'number', value: 200},
            values: {type: 'array|object', value: {'Value 1':1,'Value 2':2}, help: [
                '`Array` of possible values to switch between : `[1,2,3]`',
                '`Object` of label:value pairs. Numeric labels must be prepended or appended with a white space (or any other non-numeric character) otherwise the order of the values won\'t be kept',
            ]},
            weights: {type: 'array', value: '', help: [
                '`Array` of `number` defining the weights of each value in `values`'
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

        this.on('draginit',(e)=>{
            if (this.opened) return
            this.open(e)
        }, {element: this.widget})

        this.on('drag',(e)=>{
            if (e.target === this.menu) {
                DOM.each(this.menu, '.active', (el)=>{el.classList.remove('active')})
                this.selected = -1
            } else if (!e.target.classList.contains('active')) {
                DOM.each(this.menu, '.active', (el)=>{el.classList.remove('active')})
                e.target.classList.add('active')
                this.selected = DOM.index(e.target)
            }
        }, {element: this.widget})

        this.on('dragend',()=>{
            if (!this.opened) return
            this.close()
            if (this.selected > -1) {
                this.setValue(this.values[this.selected], {send: true, sync: true})
            }

        }, {element: this.widget})

        this.container.style.setProperty('--size', parseInt(this.getProp('size')) + 'rem')



    }

    open(e) {

        this.opened = true
        var off = this.scrollOffset()
        this.menu.style.setProperty('--x', (e.offsetX - off[0]) / PXSCALE + 'rem')
        this.menu.style.setProperty('--y', (e.offsetY - off[1]) / PXSCALE + 'rem')
        this.menu.classList.add('show')

    }

    close() {

        this.opened = false
        this.menu.classList.remove('show')
        DOM.each(this.menu, '.active', (el)=>{el.classList.remove('active')})

    }

    parseValues() {

        var nval = 0,
            i = 0,
            values = this.getProp('values'),
            weights = this.getProp('weights'),
            totalWeight

        if (!Array.isArray(values) && !(typeof values === 'object' && values !== null)) {
            values = values !== '' ? [values] : []
        }

        this.values = []
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
                <div class="item" style="transform: rotate(${ac}deg) skew(${skew}deg)">
                    <div style="transform: skew(${-skew}deg) rotate(${-90 + angle / 2}deg)"><span style="transform: rotate(${-ac + 90 - angle / 2}deg)">${raw(iconify(parseFloat(k) != k ? k : values[k]))}</span></div>
                </div>
            `)
            i++
            ac+=angle

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

        if (i > -1) this.value = this.values[i]

        DOM.each(this.menu, '.on', (el)=>{el.classList.remove('on')})
        if (i > -1) DOM.get(this.menu, '.item')[i].classList.add('on')

        if (options.send) this.sendValue()
        if (options.sync) this.changed(options)

    }

    onPropChanged(propName, options, oldPropValue) {

        var ret = super.onPropChanged(...arguments)

        switch (propName) {

            case 'values':
                this.parseValues()
                this.setValue(this.value)
                return

        }

        return ret

    }

}

Menu.dynamicProps = Menu.prototype.constructor.dynamicProps.concat(
    'values'
)


module.exports = Menu
