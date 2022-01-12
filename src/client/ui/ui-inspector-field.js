var UiWidget = require('./ui-widget'),
    UiModal = require('./ui-modal'),
    {categories} = require('../widgets/'),
    locales = require('../locales'),
    html = require('nanohtml'),
    raw = require('nanohtml/raw'),
    {icon} = require('../ui/utils'),
    chroma = require('chroma-js'),
    ace = require('brace'),
    ScriptVm = require('../widgets/scripts/script-vm'),
    scriptGlobals = ScriptVm.globals,
    editors = {}, editorModes = {
        javascript: require('brace/mode/javascript')
    }

function createEditor(name, language, syntaxChecker) {
    var el = html`<div id="#editor${name}"></div>`
    var editor = editors[name] = ace.edit(el)
    if (editorModes[language]) editor.getSession().setMode('ace/mode/' + language)
    editor.setOptions({
        autoScrollEditorIntoView: true,
        fixedWidthGutter: true,
        tabSize: 2,
        maxLines: 30,
        dragEnabled: false,
        useWorker: syntaxChecker !== false
    })

    editor.$blockScrolling = Infinity
    editor.commands.bindKeys({
        'ctrl-l': null, 'ctrl-f': null, 'ctrl-h': null, 'ctrl-,': null,
    })
    editor.renderer.setScrollMargin(4, 4, 0, 4)
    editor.element = el
    editor.element.classList.add('ace_dark')
    editor.textarea = DOM.get(el, '.ace_text-input')[0]
    editor.textarea.name = name
    editor.textarea._ace = true
    editor.setHighlightActiveLine(false)
    editor.setHighlightGutterLine(false)
    if (language === 'javascript' && syntaxChecker !== false) {
        editor.getSession().$worker.send('setOptions', [{
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

        if (this.default.editor) {
            this.container.classList.add('has-editor')
            if (!editors[this.name]) createEditor(this.name, this.default.editor, this.default.syntaxChecker)
            let editor = editors[this.name]
            input.style.display = 'none'
            input._ace_input = editor.textarea
            editor.setValue(input.value)
            editor.textarea.osc_input = input
            editor.selection.setRange({start:0,end:0})
            editor.gotoLine(0)
            editor.removeAllListeners('focus')
            editor.dirty = false
            editor.on('focus', ()=>{
                this.parent.focusedInput = input
                editor.setHighlightActiveLine(true)
                editor.setHighlightGutterLine(true)
                editor.removeAllListeners('blur')
                editor.removeAllListeners('change')
                editor.on('change', (e)=>{
                    input.value = editor.getValue()
                    editor.dirty = true
                })
                editor.on('blur', (e)=>{
                    editor.setHighlightActiveLine(false)
                    editor.setHighlightGutterLine(false)
                    editor.selection.setRange({start:0,end:0})
                    input.value = editor.getValue()
                    this.parent.focusedInput = input
                    if (editor.dirty) {
                        editor.dirty = false
                        this.parent.onChange()
                    }

                })
            })
            if (this.default.editor === 'javascript') {
                let globals = {}
                if (this.name === 'onEvent') {
                    if (this.widget.getProp('event') === 'value') {
                        globals = {id: true, value: true, touch: true}
                    } else if (this.widget.getProp('event') === 'keyboard') {
                        globals = {type: true, key: true, code: true, ctrl: true, shift: true, alt: true, meta: true}
                    }
                } else if (this.name === 'onValue') {
                    globals = {id: true, value: true, touch: true}
                } else if (this.name === 'onDraw') {
                    globals = {value: true, height: true, width: true, ctx: true, cssVars: true}
                } else if (this.name === 'onTouch') {
                    globals = this.widget.getProp('type') === 'canvas' ?
                        {value: true, height: true, width: true, event: true} :
                        {value: true, event: true, handle: true}
                }
                globals.locals = true
                globals.console = true
                globals.JS = true
                globals.this = false

                if (this.default.syntaxChecker !== false) editor.getSession().$worker.send('changeOptions', [{
                    globals: {...scriptGlobals, ...globals}
                }])
            }

            this.container.appendChild(editor.element)
            setTimeout(()=>{
                editor.getSession().getUndoManager().reset()
                editor.resize()
            })

            var help = this.container.appendChild(html`<div class="btn">${locales('editor_ace_help')}</div>`)
            help.addEventListener('fast-click', (e)=>{
                this.aceHelp(editor)
            })
        }


    }

    aceHelp(editor) {

        var keybindings = []
        var commandMap = {}
        editor.keyBinding.$handlers.forEach(function(handler) {
            var ckb = handler.commandKeyBinding
            for (var i in ckb) {
                var key = i.replace(/(^|-)\w/g, function(x) { return x.toUpperCase() })
                var commands = ckb[i]
                if (!Array.isArray(commands))
                    commands = [commands]
                commands.forEach(function(command) {
                    if (typeof command != 'string')
                        command  = command.name
                    if (commandMap[command]) {
                        commandMap[command].key += '|' + key
                    } else {
                        commandMap[command] = {key: key, command: command}
                        keybindings.push(commandMap[command])
                    }
                })
            }
        })

        var modal = new UiModal({closable: true, title: html`<span class="editor-help-title">${locales('editor_ace_help_title')}</span>`, html: true, content: html`
            <div class="inspector-help">
                <table>
                <thead>
                    <tr>
                        <th>Shortcut</th>
                        <th>Command</th>
                    </tr>
                </thead>
                    ${keybindings.map(k=>html`<tr><td><span class="kbd">${k.key}</span></td><td>${k.command}</td></tr>`)}
                </table>
            </div>
        `})


        this.parent.helpModalOpened = true
        modal.on('close', ()=>{
            this.parent.helpModalOpened = false
        })

    }


}

module.exports = UiInspectorField
