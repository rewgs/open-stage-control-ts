var Widget = require('../common/widget'),
    keyboardJS = require('keyboardjs/dist/keyboard.min.js'),
    ScriptVm = require('./script-vm'),
    scriptVm = new ScriptVm()


class Script extends Widget {

    static description() {

        return 'Evaluates a script each time it receives a value.'

    }

    static defaults() {

        var defaults = super.defaults()
        delete defaults.widget.visible
        delete defaults.widget.interaction
        delete defaults.geometry
        delete defaults.style
        defaults.scripting = {
            event: {type: 'string', value: 'value', choices: ['value', 'keyboard'], help: 'Define which events trigger the script\'s execution.'},
            onCreate: {type: 'script', value: '', editor: 'javascript', help: ['Script executed when the widget is created. See <a href="https://openstagecontrol.ammd.net/docs/widgets/scripting/">documentation</a>.']},
            onEvent: {type: 'script', value: '', editor:'javascript', help: 'Script executed whenever the widget receives the defined event. See <a href="https://openstagecontrol.ammd.net/docs/widgets/scripting/">documentation</a>.'},

            _separator: 'event: keyboard',

            keyBinding: {type: 'string|array', value: '', help: [
                'Key combo `string` or `array` of strings (see <a href="https://github.com/RobertWHurst/KeyboardJS">KeyboardJS</a> documentation).',
                'If the editor is enabled, some keys / combos will not work.'
            ]},
            keyRepeat: {type: 'boolean', value: true, help: 'Set to `false` to prevent keydown repeats when holding the key combo pressed'},
            keyType: {type: 'string', value: 'keydown', choices: ['keydown', 'keyup', 'both'], help: 'Determines which key event trigger the script\'s execution'},

        }
        return defaults

    }

    constructor(options) {

        super({...options, html: null})

        this.noValueState = true

        this.builtIn = options.builtIn
        if (this.builtIn) this._not_editable = true

        this.scriptLock = false

        this.timeouts = {}
        this.intervals = {}

        if (!this.getProp('onEvent')) {

            this.script = ()=>{}

        } else if (this.getProp('event') === 'value') {

            this.compile({
                id: '',
                value: 0,
                touch: undefined
            })

        } else if (this.getProp('event') === 'keyboard' && this.getProp('keyBinding')) {

            this.keyCb = this.keyboardCallback.bind(this)

            keyboardJS.withContext('global', ()=>{

                keyboardJS.bind(this.getProp('keyBinding'), this.keyCb, this.keyCb)

            })

            this.compile({
                type: '',
                key: '',
                code: 0,
                ctrl: false,
                shift: false,
                alt: false,
                meta: false,
            })

        } else if (options.context) {

            // custom (internal/builtin) event
            this.compile(options.context)

        }

    }

    compile(context) {

        try {

            this.script = scriptVm.compile(this.getProp('onEvent'), context)

        } catch(err) {

            this.errorProp(this.builtIn ? null : 'onEvent', 'javascript', err)
            this.script = ()=>{}

        }

    }

    run(context, options) {

        if (this.scriptLock) return

        scriptVm.setValueOptions(options)
        scriptVm.setWidget(this)

        this.scriptLock = true
        var returnValue
        try {
            returnValue = this.script(context, this.builtIn ? this.parent.parsersLocalScope : this.parsersLocalScope)
        } catch(err) {
            this.errorProp(this.builtIn ? null : 'onEvent', 'javascript', err)
        }
        this.scriptLock = false

        scriptVm.setWidget()
        scriptVm.setValueOptions()

        return returnValue

    }

    setValue(v, options={}) {

        if (this.getProp('event') === 'value' && options.script !== false) {

            var returnValue = this.run({
                value: v,
                id: options.id,
                touch: options.touch
            }, options)

            return returnValue

        }

    }

    keyboardCallback(e) {

        if (e.catchedByEditor) return

        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT')) return

        if (this.getProp('keyType') !== 'both' && e.type !== this.getProp('keyType')) return

        if (e.type === 'keydown' && !this.getProp('keyRepeat')) e.preventRepeat()

        e.preventDefault()

        this.run({
            type: e.type,
            key: e.key,
            code: e.code,
            ctrl: e.ctrlKey,
            shift: e.shiftKey,
            alt: e.altKey,
            meta: e.metaKey
        }, {send: true, sync: true})


    }

    onRemove() {


        if (this.getProp('event') === 'keyboard' && this.getProp('keyBinding')) {

            keyboardJS.withContext('global', ()=>{

                keyboardJS.unbind(this.getProp('keyBinding'), this.keyCb, this.keyCb)

            })

        }

        for (let k in this.timeouts) {
            clearTimeout(this.timeouts[k])
        }

        for (let k in this.intervals) {
            clearInterval(this.intervals[k])
        }

        super.onRemove()

    }

}

module.exports = Script
