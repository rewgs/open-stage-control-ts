var Widget = require('../common/widget'),
    doubletab = require('../mixins/double_tap'),
    html = require('nanohtml')

class Toggle extends Widget {

    static description() {

        return 'On / off button.'

    }

    static defaults() {

        return super.defaults({

            _toggle: 'toggle',

            on: {type: '*', value: 1, help: [
                'Set to `null` to send send no argument in the osc message',
                'Can be an `object` if the type needs to be specified (see preArgs)'
            ]},
            off: {type: '*', value: 0, help: [
                'Set to `null` to send send no argument in the osc message',
                'Can be an `object` if the type needs to be specified (see preArgs)'
            ]},
            mode: {type: 'string', value: 'toggle', choices: ['toggle', 'push', 'tap'], help: [
                'Interraction mode:',
                '- `toggle` (classic on/off switch)',
                '- `push` (press & release)',
                '- `tap` (no release)'
            ]},
            doubleTap: {type: 'boolean', value: false, help: 'Set to `true` to make the button require a double tap to be pushed instead of a single tap'},

        })

    }

    constructor(options) {

        super({...options, html: html`<inner></inner>`})

        this.state = 0
        this.active = false

        if (this.getProp('led')) this.container.classList.add('led')

        var tap = this.getProp('mode') === 'tap',
            push = this.getProp('mode') === 'push' || tap

        if (push) {

            if (this.getProp('doubleTap')) {

                doubletab(this.widget, ()=>{

                    this.setValue(this.getProp('on'), {sync: true, send: true})

                })

            } else {

                this.on('draginit',()=>{

                    if (this.active) return

                    this.active = true
                    this.setValue(this.getProp('on'), {sync: true, send: true})

                }, {element: this.widget})

            }

            this.on('dragend',()=>{

                this.active = false
                this.setValue(this.getProp('off'), {sync: true, send: !tap})

            }, {element: this.widget})

        } else {

            if (this.getProp('doubleTap')) {

                doubletab(this.widget, ()=>{

                    this.setValue(this.state ? this.getProp('off') : this.getProp('on'), {sync: true, send: true})

                })

            } else {

                this.on('draginit',()=>{

                    if (this.active) return

                    this.active = true
                    this.setValue(this.state ? this.getProp('off') : this.getProp('on'), {sync: true, send: true})

                }, {element: this.widget})

                this.on('dragend',()=>{

                    this.active = false

                }, {element: this.widget})

            }

        }


        this.value = this.getProp('off')

    }



    setValue(v,options={}) {

        if (typeof v == 'object' && v !== null) v = v.value

        if (v===this.getProp('on') || (this.getProp('on') != null && v === this.getProp('on').value && v !== undefined)) {

            this.container.classList.add('on')
            this.state = 1
            this.value = this.getProp('on')
            if (options.send) this.sendValue()

        } else if (v===this.getProp('off') || (this.getProp('off') != null && v === this.getProp('off').value && v !== undefined)) {

            this.container.classList.remove('on')
            this.state = 0
            this.value = this.getProp('off')
            if (options.send) this.sendValue()

        }

        if (options.sync) this.changed(options)

    }

    onRemove() {

        if (this.active && this.getProp('mode') === 'push') this.setValue(this.getProp('off'), {sync: true, send: true})
        super.onRemove()

    }

}

Toggle.dynamicProps = Toggle.prototype.constructor.dynamicProps.concat(
    'on',
    'off',
    'norelease'
)

module.exports = Toggle
