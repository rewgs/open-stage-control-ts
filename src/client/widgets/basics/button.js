var Widget = require('../common/widget'),
    doubleTap = require('../mixins/double_tap'),
    html = require('nanohtml'),
    {deepEqual, isJSON} = require('../../utils'),
    {iconify} = require('../../ui/utils'),
    parser = require('../../parser')

class Button extends Widget {

    static description() {

        return 'On / off button.'

    }

    static defaults() {

        var defaults = super.defaults(Button).extend({
            style: {
                _separator_button_style: 'Button style',
                colorTextOn: {type: 'string', value: 'auto', help: 'Defines the widget\'s text color when active.'},
                label: {type: 'string|boolean', value: 'auto', help: [
                    'Set to `false` to hide completely',
                    '- Insert icons using the prefix ^ followed by the icon\'s name : `^play`, `^pause`, etc (see https://fontawesome.com/search?m=free&s=solid',
                    '- Icons can be transformed with the following suffixes: `.flip-[horizontal|vertical|both]`, `.rotate-[90|180|270]`, `.spin`, `.pulse`. Example: `^play.flip-horizontal`',
                ]},
                vertical: {type: 'boolean', value: false, help: 'Set to `true` to display the text vertically'},
                wrap: {type: 'boolean|string', value: false, choices: [false, true, 'soft'], help: [
                    'Set to `true` to wrap long lines automatically. Set to `soft` to avoid breaking words.',
                ]},
            },
            class_specific: {
                on: {type: '*', value: 1, help: [
                    'Set to `null` to send send no argument in the osc message. Ignored if `mode` is `momentary`.',
                ]},
                off: {type: '*', value: 0, help: [
                    'Set to `null` to send send no argument in the osc message. Must be different from `on`. Ignored if `mode` is `momentary` or `tap`.',
                ]},
                mode: {type: 'string', value: 'toggle', choices: ['toggle', 'push', 'momentary', 'tap','decoupled'], help: [
                    'Interaction mode:',
                    '- `toggle` (classic on/off switch)',
                    '- `push` (press & release)',
                    '- `momentary` (no release, no value sent with the address)',
                    '- `tap` (no release, sends `on` as value)',
                    '- `decoupled (toggle mode that only updates its state when it receives a value from an osc/midi message*)`',
                    'When `decoupled`, the button\'s value is ambiguous: when clicked, it will send the value that\'s requested, otherwise it will return the value received from the feedback message.',
                    'From a script property, feedback messages can be simulated with:',
                    '`set("widget_id", value, {external: true})`'
                ]},
                doubleTap: {type: 'boolean', value: false, help: 'Set to `true` to make the button require a double tap to be pushed instead of a single tap'},

            }
        })

        defaults.scripting.onValue.help.push(
            'Additional variables:',
            '- `locals.touchCoords`: `[x, y]` array representing the touch coordinates, normalized between 0 and 1.'
        )

        return defaults

    }

    constructor(options) {

        super({...options, html: html`<inner></inner>`})

        this.state = 0
        this.active = false
        this.pulse = null

        this.buttonSize = [100, 100]
        this.exposeTouchCoords = String(this.getProp('onValue')).includes('touchCoords')
        this.parsersLocalScope.touchCoords = [0.5, 0.5]
        if (this.exposeTouchCoords) {
            this.on('resize', (e)=>{
                this.buttonSize = [e.width, e.height]
            }, {element: this.widget})
        }

        var mode = this.getProp('mode'),
            tap = mode ===  'momentary' || mode === 'tap',
            push = mode === 'push' || tap

        if (push) {

            if (this.getProp('doubleTap')) {

                doubleTap(this, (e)=>{

                    this.active = true
                    this.setValue(this.getProp('on'), {sync: true, send: true, y: e.offsetY, x: e.offsetX})

                    if (tap) this.container.classList.add('active')

                }, {element: this.container})

            } else {

                this.on('draginit',(e)=>{

                    if (this.active) return

                    this.active = true
                    this.setValue(this.getProp('on'), {sync: true, send: true, y: e.offsetY, x: e.offsetX})

                    if (tap) this.container.classList.add('active')


                }, {element: this.container})

            }

            this.on('dragend',()=>{

                if (!this.active) return

                this.active = false

                if (!tap) this.setValue(this.getProp('off'), {sync: true, send: true})
                if (tap) this.container.classList.remove('active')


            }, {element: this.container})

        } else {

            if (this.getProp('doubleTap')) {

                doubleTap(this, (e)=>{


                    this.active = true
                    this.setValue(this.state ? this.getProp('off') : this.getProp('on'), {sync: true, send: true, y: e.offsetY, x: e.offsetX})

                }, {element: this.container})

            } else {

                this.on('draginit',(e)=>{

                    if (this.active) return

                    if (e.traversingStack && TOGGLE_ALT_TRAVERSING) {
                        if (e.traversingStack.firstButtonValue === undefined) {
                            e.traversingStack.firstButtonValue = this.state
                        } else if (e.traversingStack.firstButtonValue !== this.state) {
                            return
                        }
                    }

                    this.active = true
                    this.setValue(this.state ? this.getProp('off') : this.getProp('on'), {sync: true, send: true, y: e.offsetY, x: e.offsetX})

                }, {element: this.container})

                this.on('dragend',()=>{

                    this.active = false

                }, {element: this.container})

            }

        }

        if (tap) this.noValueState = true

        this.label = html`<label></label>`

        if (this.getProp('wrap')) this.label.classList.add('wrap')
        if (this.getProp('wrap') === 'soft') this.label.classList.add('wrap-soft')
        if (this.getProp('vertical')) this.label.classList.add('vertical')

        this.updateLabel()

        if (this.getProp('mode') === 'decoupled') {

            this.decoupledValue = parser.parse({
                data: {
                    type: 'variable',
                    id: this.getProp('id') + '/decoupledValue',
                    ignoreDefaults: true,
                },
                parentNode: this.widget,
                parent: this
            })
            this.decoupledValue.on('value-changed', (e)=>{
                this.container.classList.toggle('on', this.decoupledValue.value)
                if (e.options.send) this.decoupledValue.sendValue()
            })

        }

    }


    get value() {

        switch (this.getProp('mode')) {
            case 'toggle':
                return this.getProp(this.state ? 'on' : 'off')
            case 'push':
                return this.getProp(this.active ? 'on' : 'off')
            case 'tap':
                return this.getProp('on')
            case 'momentary':
                return null
            case 'decoupled':
                if (this.active) {
                    // return requested value
                    return this.getProp(this.decoupledValue.value ? 'off' : 'on')
                } else {
                    // return feedback value
                    return this.getProp(this.decoupledValue.value ? 'on' : 'off')
                }
            default:
                return null
        }

    }

    setValue(v, options={}) {

        if (typeof v === 'string' && isJSON(v)) {
            try {
                v = JSON.parse(v)
            } catch (err) {}
        }

        var newstate,
            mode = this.getProp('mode')

        if (deepEqual(v, this.getProp('on'))) {

            newstate = 1

        } else if (deepEqual(v, this.getProp('off'))) {

            newstate = 0

        } else if (mode === 'momentary' && (v === null || v === undefined)) {
            newstate = 1

        }

        if (newstate !== undefined) {

            if (this.getProp('mode') === 'decoupled') {

                if (options.fromExternal) {
                    this.state = newstate
                    this.decoupledValue.setValue(newstate, {sync: true})
                }

            } else {

                this.state = newstate

                if (mode === 'toggle' || mode === 'push') {
                    this.container.classList.toggle('on', this.state)
                }

            }


            if (this.exposeTouchCoords) {
                if (options.y !== undefined) {
                    this.parsersLocalScope.touchCoords = [options.x / this.buttonSize[0], 1 - options.y / this.buttonSize[1]]
                }
            }

            if (options.send) this.sendValue()
            if (options.sync) this.changed(options)

            // tap mode
            if (newstate && (mode ===  'momentary' || mode === 'tap') && !options.tapRelease) {

                // reset value
                if (mode === 'tap') this.setValue(this.getProp('off'), {sync: false, send: false, tapRelease: true})

                // pulse
                if (this.getProp('decoupled') && options.fromExternal) return

                clearTimeout(this.pulse)
                this.container.classList.remove('pulse')
                setTimeout(()=>{
                    this.container.classList.add('pulse')
                    this.pulse = setTimeout(()=>{
                        this.container.classList.remove('pulse')
                    }, 150)
                }, 16)

            }

        }



    }

    updateLabel() {

        if (!this.label) return

        if (this.getProp('label') === false) {

            if (this.widget.contains(this.label)) this.widget.removeChild(this.label)

        } else {
            this.label.innerHTML = this.getProp('label') == 'auto'?
                    this.getProp('id'):
                    iconify(String(this.getProp('label')).replace(/</g, '&lt;'))

            if (!this.widget.contains(this.label)) this.widget.appendChild(this.label)
        }

    }

    onPropChanged(propName, options, oldPropValue) {

        if (super.onPropChanged(...arguments)) return

        switch (propName) {

            case 'label':
                this.updateLabel()
                return

        }

    }

    onRemove() {

        if (this.active && this.getProp('mode') === 'push') this.setValue(this.getProp('off'), {sync: true, send: true})
        super.onRemove()

    }

}

Button.cssVariables = Button.prototype.constructor.cssVariables.concat(
    {js: 'colorTextOn', css: '--color-text-on'}
)

Button.dynamicProps = Button.prototype.constructor.dynamicProps.concat(
    'on',
    'off',
    'norelease',
    'label'
)

module.exports = Button
