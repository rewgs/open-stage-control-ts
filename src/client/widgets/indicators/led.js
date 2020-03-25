var {mapToScale} = require('../utils'),
    Widget = require('../common/widget'),
    html = require('nanohtml'),
    StaticProperties = require('../mixins/static_properties')

module.exports = class Led extends StaticProperties(Widget, {bypass: true, interaction: false}) {

    static description() {

        return 'Intensity display.'

    }

    static defaults() {

        return super.defaults({

            _led:'led',

            mode: {type: 'string', value: 'intensity', choices: ['intensity', 'color'], help: 'Defines how value is interpreted (see `value`)'},
            range: {type: 'object', value: {min:0, max:1}, help: 'Value range'},
            alphaRange: {type: 'object', value: {min:0, max:1}, help: 'Alpha range (if `mode` is `color`)'},
            logScale: {type: 'boolean', value: false, help: 'If `mode` is `intensity`, set to `true` to use logarithmic scale.'},
            borderRadius: {type: 'string', value: '', help: 'Css border-radius property.'},

        }, ['interaction', 'decimals', 'bypass'], {

            value: {type: 'number|array|string', value: '', help: [
                'If `mode` is `intensity`:',
                '- `Number`: `intensity` between `range.min` and `range.max`',
                'If `mode` is `color`:',
                '- `Array`: `[r, g, b]` (`r`, `g` and `b` between `range.min` and `range.max`)',
                '- `Array`: `[r, g, b, alpha]` (`alpha` between `alphaRange.min` and `alphaRange.max`)',
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
        this.container.style.setProperty('--opacity', mapToScale(v, [this.getProp('range').min, this.getProp('range').max], [0, 1], -1, this.getProp('logScale'), true))


    }

    setValueColor(v) {

        var c = ''

        if (Array.isArray(v) && v.length >= 3) {

            for (let i in [0, 1, 2]) {
                v[i] = parseInt(mapToScale(v[i], [this.getProp('range').min, this.getProp('range').max], [0, 255]))
            }

            v[3] = v[3] === undefined ? 1 : mapToScale(v[3], [this.getProp('alphaRange').min, this.getProp('alphaRange').max], [0, 1], -1)

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
