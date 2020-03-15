var Widget = require('../common/widget'),
    {icon} = require('../../ui/utils'),
    html = require('nanohtml'),
    raw = require('nanohtml/raw'),
    keyboardJS = require('keyboardjs'),
    ScriptVm = require('./script-vm'),
    scriptVm = new ScriptVm()


class Script extends Widget {

    static description() {

        return 'Evaluates a script each time it receives a value.'

    }

    static defaults() {

        return super.defaults({

            _script: 'script',

            event: {type: 'string', value: 'value', choices: ['value', 'keyboard']},

            script: {type: 'string', value: '', help: [
                'This property is evaluated each time the widget receives a value*. Formulas are given extras variables in this context:',
                '- `value`: value received by the widget',
                '- `id`: id of the widget that triggered the script',
                '- `send(target, address, arg1, arg2, ...)`: function for sending osc messages (ignores the script\'s targets and the server\'s defaults unless `target` is `false`; ignores the script\'s `preArgs`)',
                '- `set(id, value)`: function for setting a widget\'s value',
                '- `get(id)`: function for getting a widget\'s value (dynamic equivalent of @{id})',
                '- `getProp(id, property)`: function for getting a widget\'s property value ((dynamic equivalent of @{id.property})',
                '- `httpGet(url, callback)`: function for making http requests (asynchronous "GET" request and local urls only)',
                '',
                '* Note: `value` or `linkId` properties can be used to receive other widgets\' values. The `value` property must actually change to trigger the execution, where linked widgets via `linkId` can submit the same value over and over and trigger the execution',
            ]},


            _eventKey: 'event: keyboard',

            keyBinding: {type: 'string|array', value: '', help: 'Key combo `string` or `array` of strings (see <a href="https://github.com/RobertWHurst/KeyboardJS">KeyboardJS</a> documentation)'},
            keyRepeat: {type: 'boolean', value: true, help: 'Set to `false` to prevent keydown repeats when holding the key combo pressed'},
            keyType: {type: 'string', value: 'keyDown', choices: ['keydown', 'keyup', 'both'], help: 'Determines which key event trigger the script\'s execution'},



        }, [

            'visible', 'label', 'interaction',
            '_geometry', 'left', 'top', 'width', 'height', 'expand',
            '_style',  'colorText', 'colorWidget', 'colorFill', 'colorStroke', 'alphaStroke', 'alphaFillOn', 'alphaFillOff', 'padding', 'css'

        ])

    }

    constructor(options) {

        super({...options, html: null})

        this.scriptLock = false


        if (this.getProp('event') === 'value') {

            this.script = scriptVm.compile(this.getProp('script'), {
                id: '',
                value: 0
            })

        } else if (this.getProp('event') === 'keyboard' && this.getProp('keyBinding')) {

            this.keyCb = this.keyboardCallback.bind(this)

            keyboardJS.withContext('global', ()=>{

                keyboardJS.bind(this.getProp('keyBinding'), this.getProp('keyType') !== 'keyup' ? this.keyCb : undefined, this.getProp('keyType') !== 'keydown' ? this.keyCb : undefined)

            })

            this.script = scriptVm.compile(this.getProp('script'), {
                type: '',
                key: '',
                code: 0,
                ctrl: false,
                shift: false,
                alt: false,
                meta: false,
            })

        }

    }

    run(context) {

        if (this.scriptLock) return

        scriptVm.setSendWidget(this)

        this.scriptLock = true
        try {
            this.script(context, this.parsersLocalScope)
        } catch(e) {
            console.log(e)
        }
        this.scriptLock = false

        scriptVm.setSendWidget()


    }

    setValue(v, options={}) {

        if (this.getProp('event') === 'value') {

            scriptVm.setValueOptions(options)

            this.run({
                value: v,
                id: options.id,
            })

            scriptVm.setValueOptions(options)

        }

    }

    keyboardCallback(e) {

        if (e.target && (e.target.tagName === 'INPUT' || e.target.tabName === 'TEXTAREA' || e.target.tabName === 'SELECT')) return

        if (e && e.type === 'keydown' && !this.getProp('keyRepeat')) e.preventRepeat()

        e.preventDefault()

        this.run({
            type: e.type,
            key: e.key,
            code: e.code,
            ctrl: e.ctrlKey,
            shift: e.shiftKey,
            alt: e.altKey,
            meta: e.metaKey
        })


    }

    onRemove() {


        if (this.getProp('event') === 'keyboard' && this.getProp('keyBinding')) {

            keyboardJS.withContext('global', ()=>{

                keyboardJS.unbind(this.getProp('keyBinding'), this.keyCb, this.keyCb)

            })

        }

        super.onRemove()

    }

}

module.exports = Script
