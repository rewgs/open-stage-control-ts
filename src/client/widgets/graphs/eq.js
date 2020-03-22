var {clip, mapToScale} = require('../utils'),
    Plot = require('./plot'),
    Widget = require('../common/widget'),
    StaticProperties = require('../mixins/static_properties'),
    audioContext = new AudioContext(),
    MAXFREQ = 0.5 * audioContext.sampleRate


class Eq extends StaticProperties(Plot, {logScaleX: false, logScaleY:false}) {

    static description() {

        return 'Draws logarithmic frequency response from an array of filter objects.'

    }

    static defaults() {

        return Widget.defaults({

            _eq:'eq',

            filters: {type: 'array', value: '', help: [
                'Each item must be an object with the following properties',
                '- `type`: string ("highpass", "highshelf", "lowpass", "lowshelf", "peaking", "bandpass" or "notch")',
                '- `freq`: number (filter\'s resonant frequency)',
                '- `q`: number (Q factor)',
                '- `gain`: number',
                '- `on`: boolean',
                'See https://developer.mozilla.org/en-US/docs/Web/API/BiquadFilterNode'

            ]},
            pips: {type: 'boolean', value: true, help: 'Set to false to hide the scale'},
            rangeX: {type: 'object', value: {min: 20, max: 22000}, help: 'Defines the min and max values for the x axis (in Hz, logarithmic scale)'},
            rangeY: {type: 'object', value: {min:-6, max:6}, help: 'Defines the min and max values for the y axis (in dB)'},
            origin: {type: 'number|boolean', value: 'auto', help: 'Defines the y axis origin. Set to `false` to disable it'},

        }, ['interaction', 'decimals', 'typeTags', 'bypass'])

    }

    constructor(options) {

        super(options)

        setTimeout(()=>{
            this.createFilters()
            this.calcResponse()
        })

    }

    createFilters() {

        this.filters = []
        var filters = this.getProp('filters')
        for (let i in filters) {
            try {
                this.filters[i] = new BiquadFilterNode(audioContext, {
                    Q: filters[i].q,
                    type: filters[i].type,
                    frequency: filters[i].freq,
                    gain: filters[i].gain,
                })
            } catch(e) {
                this.filters[i] = new BiquadFilterNode(audioContext, {
                    Q: 1,
                    type: "allpass",
                })
            }

            this.filters[i]._on = filters[i].on
        }

    }

    calcResponse() {

        /*
            Based on view-source:http://webaudio-io2012.appspot.com/frames/frequency-response.html © Google 2010
        */

        var resolution = this.width,
            frequencyHz = new Float32Array(resolution),
            phaseResponse = new Float32Array(resolution),
            nOctaves = 11,
            rangeXIn = [MAXFREQ * Math.pow(2.0, nOctaves * -1.0), MAXFREQ],
            rangeXOut = [this.getProp('rangeX').min, this.getProp('rangeX').max]


        for (let i = 0; i < resolution; ++i) {
            frequencyHz[i] = mapToScale(i, [0,this.width], rangeXOut, -1, true)
        }


        var filters = this.getProp('filters'),
            responses = [],
            eqResponse = []

        for (let filter of this.filters) {

            if (filter._on === false) continue

            var filterResponse = new Float32Array(resolution);

            filter.getFrequencyResponse(frequencyHz, filterResponse, phaseResponse);

            responses.push(filterResponse)

        }

        for (let i = 0; i < resolution; ++i) {

            eqResponse[i] = 0
            for (let r of responses) {
                eqResponse[i] += 20.0 * Math.log(r[i]) / Math.LN10
            }

        }

        // this.setValue(eqResponse)
        this.value = eqResponse
        this.batchDraw()



    }

    setValue() {}

    onPropChanged(propName, options, oldPropValue) {

        super.onPropChanged(...arguments)

        switch (propName) {
            case 'filters':
                this.createFilters()
                this.calcResponse()
                return

        }

    }

}

Eq.dynamicProps = Eq.prototype.constructor.dynamicProps.concat(
    'filters'
)

module.exports = Eq
