var UiWidget = require('./ui-widget'),
    UiInspectorField = require('./ui-inspector-field'),
    UiColorPicker = require('./ui-colorpicker'),
    UiModal = require('./ui-modal'),
    morph = require('nanomorph'),
    {defaults} = require('../widgets/'),
    html = require('nanohtml'),
    raw = require('nanohtml/raw')




class UiInspector extends UiWidget {

    constructor(options) {

        super(options)

        this.mounted = false

        this.expandedCategories = ['widget']

        this.widget = null

        this.container.addEventListener('fast-click', (e)=>{

            if (e.target.classList.contains('category-header')) {
                var name = e.target.getAttribute('data-name'),
                    expandedIndex = this.expandedCategories.indexOf(name)
                e.target.parentNode.classList.toggle('expanded', expandedIndex < 0)
                if (expandedIndex > -1) {
                    this.expandedCategories.splice(expandedIndex, 1)
                } else {
                    this.expandedCategories.push(name)
                }

            }

        })

        this.colorPicker = new UiColorPicker()
        this.colorPicker.on('change', ()=>{
            var textarea = DOM.get(this.container, `textarea[name="${this.colorPicker.name}"]`)
            if (textarea) {
                textarea[0].value = this.colorPicker.value
                DOM.dispatchEvent(textarea[0], 'change')
            }
        })

        this.container.addEventListener('click', (e)=>{

            var node = e.target

            if (node.tagName === 'OSC-INSPECTOR-CHECKBOX') {

                var name = node.getAttribute('name')

                var textarea = DOM.get(this.container, `textarea[name="${name}"]`)
                if (textarea) {
                    textarea[0].value = !node.classList.contains('on')
                    DOM.dispatchEvent(textarea[0], 'change')
                }

            } else if (node.tagName === 'OSC-INSPECTOR-COLOR') {

                this.colorPicker.setName(node.getAttribute('name'))
                this.colorPicker.setValue(node.getAttribute('value'))
                this.colorPicker.open()

            } else if (node.tagName === 'LABEL') {

                this.help(node.textContent)

            }

        })


        this.container.addEventListener('change', this.onChange.bind(this))
        this.container.addEventListener('keydown', this.onKeydown.bind(this))
        this.container.addEventListener('input', this.onInput.bind(this))

        this.lock = false
        this.clearTimeout = null

        this.helpModalOpened = false

    }

    clear() {

        this.clearTimeout = setTimeout(()=>{
            this.widget = null
            this.container.innerHTML = ''
            this.mounted = false
            this.clearTimeout = null
            this.colorPicker.close()
        })

    }

    inspect(widgets) {

        if (this.clearTimeout) {
            clearTimeout(this.clearTimeout)
            this.clearTimeout = null
        }

        var content = html`<div></div>`

        var widget = widgets[0],
            props = defaults[widget.props.type],
            tabIndex = 1000

        this.widget = widget

        for (let categoryName in props) {

            if (categoryName === 'children') continue

            let category = html`<osc-inspector-category class="${this.expandedCategories.indexOf(categoryName) > -1 ? 'expanded' : ''}"></osc-inspector-category>`,
                categoryLabel = categoryName === 'class_specific' ? widget.props.type : categoryName

            category.appendChild(html`
                <div class="category-header" data-name="${categoryName}">${categoryLabel}${categoryName === 'widget' && widgets.length > 1 ? `s (${widgets.length})` : ''}</div>
            `)

            let notEmpty

            for (let propName in props[categoryName]) {

                // skip if property is not shared between selected widgets
                if (widgets.some((w)=>{
                    for (let c in defaults[w.props.type]) {
                        if (!defaults[w.props.type][c].hasOwnProperty(propName)) return false
                    }
                })) continue

                let field = propName.includes('_separator') ?
                    html`<div class="separator">${props[categoryName][propName]}</div>` :
                    new UiInspectorField({
                        parent: this,
                        widget: widget,
                        name: propName,
                        value: widget.props[propName],
                        default: defaults[widget.props.type][categoryName][propName],
                        tabIndex: tabIndex++
                    }).container

                if (field)  {
                    category.appendChild(field)
                    notEmpty = true
                }

            }

            if (notEmpty) {
                content.appendChild(category)
            }

        }

        this.lock = true

        if (this.mounted) {
            morph(this.container.firstChild, content)
        } else {
            this.container.appendChild(content)
        }

        this.mounted = true
        this.lock = false

        if (this.colorPicker.opened) {

            var picker = DOM.get(this.container, `osc-inspector-color[name="${this.colorPicker.name}"]`)
            if (picker && picker[0]) {
                this.colorPicker.setValue(picker[0].getAttribute('value'))
            } else {
                this.colorPicker.close()
            }

        }


    }

    onChange(event) {

        if (this.lock) return

        this.lock = true

        var input = this.focusedInput || event.target

        this.focusedInput = null

        input.blur()

        var v
        var str = input.value.replace(/[‟“”]/g, '"').replace(/[‘’]/g, '\'') // convert invalid quote characters

        try {
            v = JSON.parseFlex(str)
            if (typeof v === 'string') {
                // escape backslashes in simple strings only
                v = JSON.parseFlex(str.replace(/\\/g, '__BACKSLASH__'))
                v = v.replace(/__BACKSLASH__/g, '\\')
            }
        } catch(err) {
            v = str
        }

        this.trigger('update', {
            propName: input.name,
            value: v
        })

        this.lock = false
    }

    onKeydown(event) {

        if (event.target.tagName === 'TEXTAREA') {

            if (event.keyCode === 13 && !event.shiftKey) {

                event.preventDefault()
                DOM.dispatchEvent(event.target, 'change')

            } else if (event.keyCode === 27) {

                event.preventDefault()
                event.target.value = event.target.textContent
                event.target.blur()

            }

        }

    }

    onInput(event) {

        this.focusedInput = event.target

        // text autoheight

        this.focusedInput.setAttribute('rows',0)
        this.focusedInput.setAttribute('rows', this.focusedInput.value.split('\n').length)

    }

    help(name) {

        var defaultValue = defaults[this.widget.getProp('type')][name],
            dynamic =  this.widget.isDynamicProp(name),
            htmlHelp = Array.isArray(defaultValue.help) ? defaultValue.help.join('<br/><br/>').replace(/<br\/>-/g, '-') : defaultValue.help

        htmlHelp = htmlHelp ? html`<p class="help">${raw(htmlHelp.replace(/`([^`]*)`/g, '<code>$1</code>'))}</p>` : ''

        DOM.each(htmlHelp, 'a', (el)=>{
            el.target = '_blank'
        })

        var computedValue = this.widget.getProp(name)

        if (typeof computedValue === 'string') {
            try {
                computedValue = JSON.stringify(JSON.parse(computedValue), null, ' ')
            } catch(e) {}
        } else {
            computedValue = JSON.stringify(computedValue, null, ' ')
        }

        var modal = new UiModal({closable: true, title: html`<span class="editor-help-title">${name}</span>`, html: true, content: html`
            <div class="inspector-help">

                <div class="header">
                    <p>Type: <code>${defaultValue.type}</code></p>
                    <p>Default: <code>${JSON.stringify(defaultValue.value)}</code></p>
                    ${
                        defaultValue.choices ? html`
                            <p>Choices: ${raw(defaultValue.choices.map(x=>'<code>' + x + '</code>').join(', '))}</p>
                        ` :''
                    }
                    <p>Dynamic: <code>${dynamic ? 'true' : 'false'}</code></p>
                </div>
                <div class="description">
                    ${htmlHelp}
                </div>
                <div class="computed">
                    <p>Computed value: <code class="pre">${computedValue || 'empty'}</code></p>
                </div>
            </div>
        `})


        this.helpModalOpened = true
        modal.on('close', ()=>{
            this.helpModalOpened = false
        })

    }

}

module.exports = UiInspector
