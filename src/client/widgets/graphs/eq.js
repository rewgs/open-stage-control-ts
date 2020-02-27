var {clip} = require('../utils'),
    Plot = require('./plot'),
    Widget = require('../common/widget'),
    StaticProperties = require('../mixins/static_properties')


module.exports = class Eq extends StaticProperties(Plot, {rangeX: {min: 20, max: 22000}}) {

    static description() {

        return 'Draws frequency response between from from an array of filter objects.'

    }

    static defaults() {

        return Widget.defaults({

            _eq:'eq',

            pips: {type: 'boolean', value: true, help: 'Set to false to hide the scale'},
            resolution: {type: 'number', value: 128, help: 'Defines the number of points used to compute the frequency response'},
            rangeY: {type: 'object', value: {min:0,max:1}, help: 'Defines the min and max values for the y axis'},
            origin: {type: 'number|boolean', value: 'auto', help: 'Defines the y axis origin. Set to `false` to disable it'},
            logScaleX: {type: 'boolean|number', value: false, help: 'Set to `true` to use logarithmic scale for the x axis (base 10). Set to a `number` to define the logarithm\'s base.'},
            smooth: {type: 'boolean|number', value: false, help: 'Set to `true` to make the line smooth. Float values are also acceptable (works fine between `0` and `0.5`)'},

        }, ['interaction', 'precision', 'bypass'], {

            value: {type: 'array', value: '', help: [
                'Each item must be an object with the following properties',
                '- `type`: string ("highpass", "highshelf", "lowpass", "lowshelf", "peak" or "notch")',
                '- `freq`: number (filter\'s resonant frequency)',
                '- `q`: number (Q factor)',
                '- `gain`: number',
                '- `on`: boolean',

            ]}

        })

    }

    constructor(options) {

        super(options)

        this.resolution = clip(this.getProp('resolution'),[64,1024])

    }

    setValue(v, options={}) {

        if (typeof v == 'string') {
            try {
                v = JSON.parseFlex(v)
            } catch(err) {}
        }

        if (Array.isArray(v)) {

            var filters = v,
                eqResponse = []

            if (v.length === this.resolution) {

                eqResponse = v

            } else {

                for (let i in filters) {

                    var filterResponse

                    if (!filters[i].type) filters[i].type = 'peak'

                    if (!filters[i].on) {
                        filterResponse = calcBiquad({type:'peak',freq:1,gain:0,q:1},!this.getProp('logScaleX'), this.resolution)
                    } else {
                        filterResponse = calcBiquad(filters[i],!this.getProp('logScaleX'), this.resolution)
                    }

                    for (var k in filterResponse) {
                        if (eqResponse[k]===undefined) {
                            eqResponse[k]=[0,0]
                        }

                        eqResponse[k] = [filterResponse[k][0], eqResponse[k][1]+filterResponse[k][1]]
                    }

                }

            }

            if (eqResponse.length) super.setValue(eqResponse, options)

        }

    }

}

//
// calcBiquad
//
// Dec 14, 2010 njr
// original @ Nigel Redmon

function calcBiquad(options,linear,resolution) {
    var {type, freq, q, gain} = options,
        Fs = 44100,
        a0,a1,a2,b1,b2,norm,
        minVal, maxVal,
        len = resolution

    var V = Math.pow(10, Math.abs(gain) / 20)
    var K = Math.tan(Math.PI * freq / Fs)
    switch (type) {
        case 'lowpass':
            norm = 1 / (1 + K / q + K * K)
            a0 = K * K * norm
            a1 = 2 * a0
            a2 = a0
            b1 = 2 * (K * K - 1) * norm
            b2 = (1 - K / q + K * K) * norm
            break

        case 'highpass':
            norm = 1 / (1 + K / q + K * K)
            a0 = 1 * norm
            a1 = -2 * a0
            a2 = a0
            b1 = 2 * (K * K - 1) * norm
            b2 = (1 - K / q + K * K) * norm
            break

        case 'bandpass':
            norm = 1 / (1 + K / q + K * K)
            a0 = K / q * norm
            a1 = 0
            a2 = -a0
            b1 = 2 * (K * K - 1) * norm
            b2 = (1 - K / q + K * K) * norm
            break

        case 'notch':
            norm = 1 / (1 + K / q + K * K)
            a0 = (1 + K * K) * norm
            a1 = 2 * (K * K - 1) * norm
            a2 = a0
            b1 = a1
            b2 = (1 - K / q + K * K) * norm
            break

        case 'peak':
            if (gain >= 0) {
                norm = 1 / (1 + 1/q * K + K * K)
                a0 = (1 + V/q * K + K * K) * norm
                a1 = 2 * (K * K - 1) * norm
                a2 = (1 - V/q * K + K * K) * norm
                b1 = a1
                b2 = (1 - 1/q * K + K * K) * norm
            }
            else {
                norm = 1 / (1 + V/q * K + K * K)
                a0 = (1 + 1/q * K + K * K) * norm
                a1 = 2 * (K * K - 1) * norm
                a2 = (1 - 1/q * K + K * K) * norm
                b1 = a1
                b2 = (1 - V/q * K + K * K) * norm
            }
            break
        case 'lowshelf':
            if (gain >= 0) {
                norm = 1 / (1 + Math.SQRT2 * K + K * K)
                a0 = (1 + Math.sqrt(2*V) * K + V * K * K) * norm
                a1 = 2 * (V * K * K - 1) * norm
                a2 = (1 - Math.sqrt(2*V) * K + V * K * K) * norm
                b1 = 2 * (K * K - 1) * norm
                b2 = (1 - Math.SQRT2 * K + K * K) * norm
            }
            else {
                norm = 1 / (1 + Math.sqrt(2*V) * K + V * K * K)
                a0 = (1 + Math.SQRT2 * K + K * K) * norm
                a1 = 2 * (K * K - 1) * norm
                a2 = (1 - Math.SQRT2 * K + K * K) * norm
                b1 = 2 * (V * K * K - 1) * norm
                b2 = (1 - Math.sqrt(2*V) * K + V * K * K) * norm
            }
            break
        case 'highshelf':
            if (gain >= 0) {
                norm = 1 / (1 + Math.SQRT2 * K + K * K)
                a0 = (V + Math.sqrt(2*V) * K + K * K) * norm
                a1 = 2 * (K * K - V) * norm
                a2 = (V - Math.sqrt(2*V) * K + K * K) * norm
                b1 = 2 * (K * K - 1) * norm
                b2 = (1 - Math.SQRT2 * K + K * K) * norm
            }
            else {
                norm = 1 / (V + Math.sqrt(2*V) * K + K * K)
                a0 = (1 + Math.SQRT2 * K + K * K) * norm
                a1 = 2 * (K * K - 1) * norm
                a2 = (1 - Math.SQRT2 * K + K * K) * norm
                b1 = 2 * (K * K - V) * norm
                b2 = (V - Math.sqrt(2*V) * K + K * K) * norm
            }
            break
    }

    var magPlot = []
    for (var i = 0; i < len; i++) {
        var w, phi, y
        if (linear)
            w = i / (len - 1) * Math.PI    // 0 to pi, linear scale
        else
            w = Math.exp(Math.log(1 / 0.001) * i / (len - 1)) * 0.001 * Math.PI    // 0.001 to 1, times pi, log scale

        phi = Math.pow(Math.sin(w/2), 2)

        y = Math.log(Math.pow(a0+a1+a2, 2) - 4*(a0*a1 + 4*a0*a2 + a1*a2)*phi + 16*a0*a2*phi*phi) - Math.log(Math.pow(1+b1+b2, 2) - 4*(b1 + 4*b2 + b1*b2)*phi + 16*b2*phi*phi)
        y = y * 10 / Math.LN10
        if (y == -Infinity) y = -200

        if (linear)
            magPlot.push([i / (len - 1) * Fs / 2, y])
        else
            magPlot.push([i / (len - 1) * Fs / 2, y])

        if (i == 0)
            minVal = maxVal = y
        else if (y < minVal)
            minVal = y
        else if (y > maxVal)
            maxVal = y
    }

    return magPlot
}
