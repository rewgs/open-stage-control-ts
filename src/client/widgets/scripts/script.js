var ScriptVm = require('./script-vm'),
    scriptVm = new ScriptVm()

class Script {

    constructor(options) {

        this.lock = false
        this.timeouts = {}
        this.intervals = {}
        this.widget = options.widget
        this.property = options.property

        if (!options.code) {

            this.script = ()=>{}

        } else {

            this.script = scriptVm.compile(options.code, options.context)

        }

    }

    run(context, options) {

        if (this.lock) return

        scriptVm.setValueOptions(options)
        scriptVm.setWidget(this.widget)

        this.lock = true
        var returnValue
        try {
            returnValue = this.script(context, this.widget.parsersLocalScope)
        } catch(err) {
            this.widget.errorProp(this.property, 'javascript', err)
        }
        this.lock = false

        scriptVm.setWidget()
        scriptVm.setValueOptions()

        return returnValue

    }

    onRemove() {

        for (let k in this.widget.timeouts) {
            clearTimeout(this.widget.timeouts[k])
        }

        for (let k in this.widget.intervals) {
            clearInterval(this.widget.intervals[k])
        }

    }

}

module.exports = Script
