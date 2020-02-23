var {mapToScale, clip} = require('../utils'),
    Widget = require('../common/widget'),
    html = require('nanohtml'),
    StaticProperties = require('../mixins/static_properties')

module.exports = class Led extends StaticProperties(Widget, {bypass: true}) {

    static description() {

        return 'Intensity display.'

    }

    static defaults() {

        return super.defaults({

            _led:'led',

            mode: {type: 'string', value: 'intensity', choices: ['intensity', 'color'], help: [
                ''
            ]},
            range: {type: 'object', value: {min:0,max:1}, help: 'Value to led intensity mapping range'},
            logScale: {type: 'boolean|number', value: false, help: 'Set to `true` to use logarithmic scale (base 10). Set to a `number` to define the logarithm\'s base.'},
            borderRadius: {type: 'string', value: '', help: 'Css border-radius property.'},

        }, ['precision', 'bypass'], {

            value: {type: 'number|array|string', value: '', help: [
                '- `Number`: if `mode` is set to `intensity`',
                '- `Array`: `[r, g, b]` (`r`, `g` and `b` between `0` and `255`)',
                '- `Array`: `[r, g, b, alpha]` (`alpha` between `0` and `255`)',
                '- `String`: CSS color',
            ]}

        })

    }

    constructor(options) {

        super({...options, html: html`<inner></inner>`})

        this.setValueIntensity(this.getProp('mode') === 'intensity' ? this.getProp('range').min : 1)

        var bR = this.getProp('borderRadius')
        if (parseInt(bR) == bR) bR += 'rem'
        this.container.style.setProperty('--border-radius', bR)

    }

    setValue(v, options={}) {


        var ret = this.getProp('mode') === 'intensity' ? this.setValueIntensity(v) : this.setValueColor(v)


        if (options.sync && ret !== false) this.changed(options)

    }

    setValueIntensity(v) {

        if (typeof v != 'number') return false

        this.value = v
        this.container.style.setProperty('--opacity', mapToScale(v,[this.getProp('range').min,this.getProp('range').max],[0,1],false,this.getProp('logScale'),true))


    }

    setValueColor(v) {

        var c = ''

        if (Array.isArray(v) && v.length >= 3) {

            for (let i in [0,1,2]) {
                v[i] = parseInt(clip(v[i],[0,255]))
            }

            v[3] = clip(v[3] != undefined ? v[3] : 1,[0,1])

            c = `rgba(${v[0]}, ${v[1]}, ${v[2]}, ${v[3]})`

        } else if (typeof v == 'string') {

            c = v

        } else {

            return false

        }

        this.value = v

        this.container  .style.setProperty('--color-led', c)

    }

}
