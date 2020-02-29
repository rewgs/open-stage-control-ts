var {clip} = require('../utils'),
    Widget = require('../common/widget'),
    Plot = require('./plot'),
    StaticProperties = require('../mixins/static_properties'),
    canvasQueue = require('../common/queue')


module.exports = class Visualizer extends StaticProperties(Plot, {rangeX: {min: '', max: ''}, dots: false, smooth: false, interaction: false}) {

    static description() {

        return 'Display its value over time.'

    }

    static defaults() {

        return Widget.defaults({

            _visualizer:'visualizer',

            duration: {type: 'number', value: 1, help: 'Defines visualization duration in seconds'},
            rangeY: {type: 'object', value: {min:0,max:1}, help: 'Defines the min and max values for the y axis'},
            origin: {type: 'number', value: 'auto', help: 'Defines the y axis origin. Set to `false` to disable it'},
            logScaleY: {type: 'boolean|number', value: false, help: 'Set to `true` to use logarithmic scale for the y axis (base 10). Set to a `number` to define the logarithm\'s base.'},
            pips:{type: 'boolean', value: true, help: 'Set to `false` to hide the scale'},

        }, ['interaction', 'decimals', 'typeTags', 'bypass'], {})

    }

    constructor(options) {

        super(options)

        this.fps = CANVAS_FRAMERATE
        this.length = Math.round(clip(this.fps * this.getProp('duration'), [8, 4096]))
        this.value = new Array(this.length).fill(this.rangeY.min)
        this.cancel = false
        this.looping = false
        this.clock = 0
        this.lastUpdate = 0
        this.watchDuration = 1000 * this.getProp('duration')
        this.ticks = 0

        this.bindedLoop = this.loop.bind(this)

    }

    startLoop() {

        this.clock = Date.now()
        if (!this.looping) {
            this.lastUpdate = Date.now()
            canvasQueue.on('frame', this.bindedLoop)
            this.looping = true
            this.ticks = 0
        }
    }

    loop() {

        var t = Date.now()

        if (t - this.clock >= this.watchDuration) {
            canvasQueue.off('frame', this.bindedLoop)
            this.looping = false
        }

        this.ticks += (t - this.lastUpdate) / (1000 / this.fps)

        if (Math.floor(this.ticks) > 0) {
            this.shiftData(Math.floor(this.ticks))
            this.ticks -= Math.floor(this.ticks)
            this.batchDraw()
        }

        this.lastUpdate = t

    }

    shiftData(n) {

        for (var i = 0; i < n; i++) {
            this.value.push(this.value[this.length - 1])
            this.value.splice(0,1)
        }

    }

    getValue() {

        return this.value[this.length - 1]

    }

    setValue(v, options={}) {


        if (typeof(v) === 'number') {

            this.value[this.length - 1] = v
            this.startLoop()

            if (options.sync) this.changed(options)


        } else if (Array.isArray(v) && v.length === this.length) {

            this.value = v
            this.startLoop()

            if (options.sync) this.changed(options)


        }

    }

    onRemove() {

        if (this.looping) {
            canvasQueue.off('frame', this.bindedLoop)
        }
        super.onRemove()

    }


}
