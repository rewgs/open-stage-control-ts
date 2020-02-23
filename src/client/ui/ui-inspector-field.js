var UiWidget = require('./ui-widget'),
    {categories} = require('../widgets/'),
    html = require('nanohtml'),
    raw = require('nanohtml/raw'),
    {icon, Popup} = require('../ui/utils')


class UiInspectorField extends UiWidget {

    constructor(options) {

        super(options)

        this.name = options.name
        this.widget = options.widget
        this.value = options.value
        this.default = options.default

        this.container = html`<osc-inspector-field></osc-inspector-field>`
        this.label = this.container.appendChild(html`<label>${this.name}</label>`)

        if (this.name === 'type') this.createTypeSelect()
        else this.createInput()

    }

    createTypeSelect() {


        if (this.widget.props.type == 'tab' || this.widget.props.type == 'root') {
            this.container.appendChild(html`
                <textarea class="no-keybinding" name="${this.name}" rows="1" disabled>${this.value}</textarea>
            `)
            return
        }

        this.createInput()

        var select = html`<select class="no-keybinding" name="${this.name}"/>`

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


        var input = html`<textarea class="no-keybinding" name="${this.name}" rows="${stringValue.split('\n').length}">${stringValue}</textarea>`


        this.container.appendChild(input)


        if (this.default.choices) {

            let wrapper = html`<osc-inspector-select></osc-inspector-select>`,
                select = wrapper.appendChild(html`<select class="no-keybinding" name="${this.name}"/>`)
            for (let choice of this.default.choices) {
                select.appendChild(html`<option ${choice == this.value ? 'selected' : ''} value="${choice}">${choice}</option>`)
            }

            this.container.appendChild(wrapper)

        }

        if (this.name.includes('color')) {

            let picker = html`<input class="osc-inspector-color" type="color" name="${this.name}" value="${this.value}"/>`

            this.container.appendChild(picker)

        }

        if (this.default.type.includes('boolean')) {

            let toggle = html`
               <osc-inspector-checkbox class="${this.widget.getProp(this.name) ? 'on' : ''}">
                   ${raw(icon('check'))}
               </osc-inspector-checkbox>
           `

            toggle.addEventListener('click', ()=>{
                if (this.name === 'label' && !this.widget.getProp(this.name) === true) {
                    // special case
                    input.value = 'auto'
                } else {
                    input.value = !this.widget.getProp(this.name)
                }
                DOM.dispatchEvent(input, 'change')
            })


            this.container.appendChild(toggle)

        }


    }

}

module.exports = UiInspectorField
