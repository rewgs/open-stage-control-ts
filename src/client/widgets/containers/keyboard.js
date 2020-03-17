var Panel = require('./panel'),
    Widget = require('../common/widget'),
    parser = require('../../parser')


module.exports = class Keyboard extends Panel {

    static description() {

        return 'Piano keyboard.'

    }

    static defaults() {

        return Widget.defaults({

            _matrix: 'matrix',

            keys: {type: 'number', value: 25, help: 'Defines the number keys'},
            start: {type: 'number', value: 48, help: [
                'MIDI note number to start with (default is C4)',
                'Standard keyboards settings are: `[25, 48]`, `[49, 36]`, `[61, 36]`, `[88, 21]`'
            ]},
            traversing: {type: 'boolean', value: true, help: 'Set to `false` to disable traversing gestures'},
            on: {type: '*', value: 1, help: [
                'Set to `null` to send send no argument in the osc message',
                'Can be an `object` if the type needs to be specified (see preArgs)'
            ]},
            off: {type: '*', value: 0, help: [
                'Set to `null` to send send no argument in the osc message',
                'Can be an `object` if the type needs to be specified (see preArgs)'
            ]},
            toggles: {type: 'boolean', value: false, help: 'Set to `true` to make keys bahave like toggle buttons'}

        }, ['_value', 'default', 'value', 'linkId'], {

            css: {type: 'string', value: '', help: [
                'Available CSS variables:',
                '- `--color-white:color;` (white keys color)',
                '- `--color-black:color;` (black keys color)'
            ]}

        })

    }

    constructor(options) {

        super(options)

        this.childrenType = undefined
        this.value = []

        this.on('change',(e)=>{

            if (e.widget === this) return

            this.value[e.widget._index] = e.widget.getValue()
            this.changed(e.options)

        })

        var start = parseInt(this.getProp('start')),
            keys = parseInt(this.getProp('keys'))

        var strData = JSON.stringify(options.props),
            pattern = 'wbwbwwbwbwbw',
            whiteKeys = 0, whiteKeys2 = 0, i

        for (i = start; i < keys + start && i < 109; i++) {
            if (pattern[i % 12] == 'w') whiteKeys++
        }

        this.container.style.setProperty('--nkeys', whiteKeys)

        for (i = start; i < keys + start && i < 109; i++) {

            var data = JSON.parse(strData)

            data.top = data.left = data.height = data.width = 'auto'
            data.type = 'button'
            data.mode = this.getProp('toggles') ? 'toggle' : 'push'
            data.id = this.getProp('id') + '/' + i
            data.label = false
            data.css = ''

            data.target = '@{parent.target}'
            data.decimals = '@{parent.decimals}'

            data.address = '@{parent.address}'
            data.preArgs = `JS{{
                var a = @{parent.preArgs};
                var b = typeof a === 'string' && a === '' ? [] : Array.isArray(a) ? a : [a];
                return b.concat([${i}])
            }}`

            var key = parser.parse({
                data: data,
                parentNode: this.widget,
                parent: this
            })

            key._index = i - start
            key.container.classList.add('not-editable')
            key.container.classList.add('key')

            if (pattern[i % 12] == 'w') {
                key.container.classList.add('white')
                whiteKeys2++
            } else {
                key.container.classList.add('black')
                key.container.style.setProperty('--rank', whiteKeys2)
            }

            this.value[i - start] = this.getProp('off')

        }

    }

}
