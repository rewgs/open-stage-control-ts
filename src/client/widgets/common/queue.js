var EventEmitter = require('../../events/event-emitter')

class CanvasQueue extends EventEmitter{

    constructor() {

        super()

        this.queue = {}
        this.flushed = 0
        this.running = false
        this.frameLength = 1000 / CANVAS_FRAMERATE
        this.lastFrame = 0
        this.bindedLoop = this.loop.bind(this)

    }

    push(widget) {

        this.queue[widget.hash] = widget
        this.flushed = 0

        if (!this.running) {
            this.running = true
            requestAnimationFrame(this.bindedLoop)
        }

    }

    flush() {

        for (var h in this.queue) {
            this.queue[h].draw()
        }

        this.queue = {}
        this.flushed++

    }

    loop(timestamp) {

        if (this.flushed >= 10) {
            this.running = false
            return
        }

        requestAnimationFrame(this.bindedLoop)

        var delta = timestamp - this.lastFrame

        if (delta > this.frameLength) {
            this.lastFrame = timestamp - (delta % this.frameLength)
            this.trigger('frame', {timestamp})
            this.flush()
        }

    }

}

module.exports = new CanvasQueue()
