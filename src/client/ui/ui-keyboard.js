var UiWidget = require('./ui-widget'),
    {icon} = require('./utils'),
    locales = require('../locales'),
    layout = locales('keyboard_layout'),
    html = require('nanohtml'),
    raw = require('nanohtml/raw')

const numericLayout = [
    '{sep} 7 8 9',
    '{sep} 6 7 8',
    '{sep} 1 2 3',
    '{sep} 0 . {enter}'
]
const keysDisplay = {
    '{esc}':  locales('keyboard_escape'),
    '{bksp}':  icon('delete-left'),
    '{enter}': icon('arrow-turn-down.rotate-90'),
    '{enter}': icon('arrow-turn-down.rotate-90'),
    '{lock}': icon('arrow-up-from-bracket'),
    '{shift}': icon('arrow-up'),
    '{shift}': icon('arrow-up'),
    '{tab}': icon('arrow-right-arrow-left'),
    '{space}': ' ',
}

class OscKeybard extends UiWidget {

    constructor(options) {

        super(options)

        this.keys = {}
        this.pressedKeys = {}
        this.lock = false
        this.shift = false
        this.input = null
        this.value = null


        for (var k in layout) {
            layout[k] = layout[k].map((r, i)=>(r + ' ' + (numericLayout[i]||'')).trim().split(' '))
        }

        var keyId = 0

        for (var i = 0; i < layout.default.length; i++) {
            var rowData = layout.default[i],
                row = html`<div class="row"></div>`

            for (var j = 0; j < rowData.length; j++) {
                var keyData = rowData[j],
                    shiftData = layout.shift[i][j],
                    key = html`
                    <div class="key">
                        <span class="display-default">${raw(keysDisplay[keyData] || keyData)}</span>
                        <span class="display-shift">${raw(keysDisplay[shiftData] || shiftData)}</span>
                    </div>`

                keyId++
                this.keys[keyId] = key
                key.appendChild = keysDisplay[keyData] || keyData

                key.classList.add(keyData.replace('{', '').replace('}', ''))

                key.setAttribute('data-id', keyId)
                key.setAttribute('data-key', keyData)
                key.setAttribute('data-shift', shiftData)

                row.appendChild(key)
            }
            this.container.appendChild(row)
        }

        this.container.addEventListener('mousedown', (e)=>{
            // prevent keyboard from stealing focus from input
            e.preventDefault()
        },{capture:true})


        this.on('draginit', (e)=>{

            if (this.pressedKeys[e.pointerId]) return

            var keyId = e.target.getAttribute('data-id')

            if (keyId === null) return

            var key = this.keys[keyId]

            if (key.getAttribute('data-key') === '{lock}') {
                this.lock = !this.lock
                key.classList.toggle('active', this.lock)
            } else {
                key.classList.add('active')
                this.pressedKeys[e.pointerId] = key
            }

            this.checkShift()

            this.keyDown(key.getAttribute(this.shift !== this.lock ? 'data-shift' : 'data-key'))

        }, {element: this.container, multitouch: true})

        this.on('dragend', (e)=>{

            if (!this.pressedKeys[e.pointerId]) return

            var key = this.pressedKeys[e.pointerId],
                keyData = key.getAttribute('data-key')

            key.classList.remove('active')

            if (keyData === '{lock}') return

            delete this.pressedKeys[e.pointerId]

            this.checkShift()

            this.keyUp(key.getAttribute(this.shift != this.lock ? 'data-shift' : 'data-key'))


        }, {element: this.container, multitouch: true})


        document.addEventListener('focus', (e)=>{
            if (!VIRTUAL_KEYBOARD) return
            // show keyboard when entering input focus
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                this.show()
                this.input = e.target
                this.value = this.input.value
                this.input.scrollIntoView()
            }
        }, {capture: true})


        document.addEventListener('blur', (e)=>{
            // hide keyboard when leaving input focus
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                this.hide()
                this.input = null
                this.value = null

            }
        }, {capture: true})

    }

    keyDown(key) {

        if (!this.input) return

        var startPos = this.input.selectionStart,
            endPos = this.input.selectionEnd,
            editLength, str

        switch (key) {
            case '{lock}':
            case '{shift}':
                return
            case '{esc}':
                this.input.value = this.value
                this.input.blur()
                return
            case '{enter}':
                if (this.shift) {
                    str = '\n'
                    editLength = 1
                    break
                } else {
                    this.input.dispatchEvent(new KeyboardEvent('keydown', {keyCode: 13}))
                    if (this.input) DOM.dispatchEvent(this.input, 'change')
                    return
                }
            case '{bksp}':
                this.input.dispatchEvent(new KeyboardEvent('keydown', {keyCode: 8}))
                this.input.value = this.input.value.substring(0, startPos - 1)
                    + this.input.value.substring(endPos, this.input.value.length)
                editLength = -1
                break
            case '{tab}':
                str = '  '
                break
            case '{space}':
                str = ' '
                break
            default:
                str = key
                break
        }

        if (str !== undefined) {

            this.input.value = this.input.value.substring(0, startPos)
                + str
                + this.input.value.substring(endPos, this.input.value.length)

            if (editLength === undefined) editLength = str.length

        }

        this.input.selectionStart = startPos + editLength
        this.input.selectionEnd = startPos + editLength
        DOM.dispatchEvent(this.input, 'input')
        DOM.dispatchEvent(this.input, 'keydown')
        // this.input.dispatchEvent(new KeyboardEvent('keydown'))

    }

    keyUp(key) {

    }

    checkShift() {

        var shift = false
        for (var k in this.pressedKeys) {
            var dataKey = this.pressedKeys[k].getAttribute('data-key')
            if (dataKey === '{shift}') {
                shift = true
            }
        }
        this.shift = shift
        this.container.classList.toggle('shift', this.lock !== this.shift)

    }

    show(){
        this.container.style.display = 'flex'
        DOM.dispatchEvent(window, 'resize')
    }

    hide(){
        this.container.style.display = 'none'
        DOM.dispatchEvent(window, 'resize')
    }
}

const k = new OscKeybard({element: DOM.get('osc-keyboard')[0]})


module.exports = k
