var UiWidget = require('./ui-widget'),
    {categories} = require('../widgets/'),
    html = require('nanohtml'),
    raw = require('nanohtml/raw'),
    {icon} = require('../ui/utils'),
    chroma = require('chroma-js'),
    ace = require('brace'),
    ScriptVm = require('../widgets/scripts/script-vm'),
    scriptGlobals = ScriptVm.globals,
    editors = {}

require('brace/mode/html')
require('brace/mode/javascript')
require('brace/theme/solarized_dark')
// require('brace/ext/searchbox')
// require('brace/ext/keybinding_menu')

for (var name of ['script', 'draw', 'touch']) {
    editors[name] = ace.edit('editor-' + name)
    editors[name].getSession().setMode('ace/mode/javascript')
    editors[name].setTheme('ace/theme/solarized_dark')
    editors[name].setOption('autoScrollEditorIntoView', true)
    editors[name].setOption('maxLines', 80)
    editors[name].setOption('blockScrolling', Infinity)
    editors[name].commands.bindKeys({'ctrl-l':null, 'ctrl-f': null,'cmd-l':null, 'cmd-f': null})
    editors[name].renderer.setScrollMargin(4, 4, 0, 4)
    editors[name].element = DOM.get('#editor-' + name)[0]
    editors[name].textarea = DOM.get('#editor-' + name + ' .ace_text-input')[0]
    editors[name].textarea.name = name
    editors[name].textarea._ace = true
    editors[name].setHighlightActiveLine(false)
    editors[name].setHighlightGutterLine(false)
    editors[name].getSession().$worker.send('setOptions', [{
        asi: true,          // no semicolon
        esversion: 6,
        strict: 'implied',
        node: false,
        browser: true,
        validthis: true,
        undef: true,
        globals: {}
    }])
}



class UiInspectorField extends UiWidget {

    constructor(options) {

        super(options)

        this.name = options.name
        this.widget = options.widget
        this.value = options.value
        this.default = options.default
        this.tabIndex = options.tabIndex

        this.container = html`<osc-inspector-field></osc-inspector-field>`
        this.label = this.container.appendChild(html`<label>${this.name}</label>`)

        if (this.name === 'type' || this.name === 'widgetType') this.createTypeSelect()
        else this.createInput()

    }

    createTypeSelect() {


        if (this.widget.props.type == 'tab' || this.widget.props.type == 'root') {
            this.container.appendChild(html`
                <textarea tabIndex="${this.tabIndex}" class="no-keybinding" name="${this.name}" rows="1" disabled>${this.value}</textarea>
            `)
            return
        }

        this.createInput()

        var select = html`<select tabIndex="${this.tabIndex}" class="no-keybinding" name="${this.name}"/>`

        for (let cname in categories) {

            var optGroup = html`<optgroup label="${cname}"></optgroup>`

            for (let wtype of categories[cname]) {
                optGroup.appendChild(html`<option ${wtype == this.value ? 'selected' : ''} value="${wtype}">${wtype}</option>`)
            }

            select.appendChild(optGroup)

        }

        var wrapper = html`<osc-inspector-select></osc-inspector-select>`
        wrapper.appendChild(select)
        this.container.appendChild(wrapper)

    }

    createInput() {


        var stringValue = typeof this.value !== 'string' ?
                JSON.stringify(this.value, null, '  ').replace(/\n\s\s\s\s/g, ' ').replace(/\n\s\s(\}|\])/g, ' $1') : this.value


        let input = html`<textarea tabIndex="${this.tabIndex}" class="no-keybinding" name="${this.name}" rows="${stringValue.split('\n').length}"></textarea>`

        if (this.name === 'id' && this.widget.props.type === 'root') input.disabled = true

        if (this.default.value === 'auto' && stringValue === 'auto') {
            input.placeholder = stringValue
        } else {
            input.textContent = stringValue
        }

        this.container.appendChild(input)


        if (this.default.choices) {

            let wrapper = html`<osc-inspector-select></osc-inspector-select>`,
                select = wrapper.appendChild(html`<select class="no-keybinding" name="${this.name}"/>`)
            for (let choice of this.default.choices) {
                select.appendChild(html`<option ${choice == this.value ? 'selected' : ''} value="${choice}">${choice}</option>`)
            }

            this.container.appendChild(wrapper)

        }

        if (this.default.type.includes('boolean')) {

            let toggle = html`
               <osc-inspector-checkbox name="${this.name}" class="${this.widget.getProp(this.name) ? 'on' : ''}">
                   ${raw(icon('check'))}
               </osc-inspector-checkbox>
           `

            this.container.appendChild(toggle)

        }

        if (this.name.includes('color')) {

            let style = window.getComputedStyle(this.widget.container),
                colorData = this.widget.constructor.cssVariables.find(x=>x.js === this.name),
                val = 'transparent'

            try {
                val = chroma(style.getPropertyValue(colorData.css).trim()).hex('rgba')
            } catch(e) {}

            let picker = html`<osc-inspector-color type="text" name="${this.name}" value="${val}" style="--color-picker-value: ${val}"></osc-inspector-color>`

            this.container.appendChild(picker)

        } else if (stringValue === 'auto' && this.widget.constructor.cssVariables.some(x=>x.js === this.name)) {

            let style = window.getComputedStyle(this.widget.container),
                data = this.widget.constructor.cssVariables.find(x=>x.js === this.name),
                val = style.getPropertyValue(data.css).trim()

            if (data.toJs) val = data.toJs(val)

            this.container.appendChild(html`<div class="computed-value">${val}</div>`)

        }

        if (['script', 'touch', 'draw'].includes(this.name)) {
            let editor = editors[this.name]
            input.style.display = 'none'
            input._ace_input = editor.textarea
            editor.setValue(input.value)
            editor.textarea.osc_input = input
            editor.selection.setRange({start:0,end:0})
            editor.gotoLine(0)
            editor.removeAllListeners('focus')
            editor.on('focus', ()=>{
                this.parent.focusedInput = input
                editor.setHighlightActiveLine(true)
                editor.setHighlightGutterLine(true)
                editor.removeAllListeners('blur')
                editor.on('blur', (e)=>{
                    if (input.value !== editor.getValue()) {
                        input.value = editor.getValue()
                        this.parent.focusedInput = input
                        this.parent.onChange()
                    }
                    editor.setHighlightActiveLine(false)
                    editor.setHighlightGutterLine(false)

                })
            })
            let globals = {}
            if (this.name === 'script') {
                if (this.widget.type !== 'script' || this.widget.getProp('event') === 'value') {
                    globals = {id: true, value: true, touch: true}
                } else if (this.widget.getProp('event') === 'keyboard') {
                    globals = {type: true, key: true, code: true, ctrl: true, shift: true, alt: true, meta: true}
                }
            } else if (this.name === 'draw') {
                globals = {value: true, height: true, width: true, ctx: true, cssVars: true}
            } else if (this.name === 'touch') {
                globals = {value: true, height: true, width: true, event: true}
            }
            globals.locals = true
            globals.console = true
            globals.JS = true
            globals.this = false

            editor.getSession().$worker.send("changeOptions", [{
                globals: {...scriptGlobals, ...globals}
            }])

            this.container.appendChild(editor.element)
            setTimeout(()=>{
                editor.resize()
            })
        }


    }

}

module.exports = UiInspectorField
