var MenuBase = require('./menu-base'),
    html = require('nanohtml'),
    iOS = require('../../ui/ios')

class Dropdown extends MenuBase {

    static description() {

        return 'Native dropdown menu.'

    }


    static defaults() {

        return super.defaults({

            _dropdown:'dropdown',

            align: {type: 'string', value: 'center', choices: ['center', 'left', 'right'], help: 'Set to `left` or `right` to change text alignment (otherwise center)'},
            values: {type: 'array|object', value: {'Value 1':1,'Value 2':2}, help: [
                '`Array` of possible values to switch between : `[1,2,3]`',
                '`Object` of label:value pairs. Numeric labels must be prepended or appended with a white space (or any other non-numeric character) otherwise the order of the values won\'t be kept',
            ]}

        })

    }

    constructor(options) {

        super({...options, html: html`
            <inner>
                <div class="text"></div>
                <div class="icon"></div>
            </inner>
        `})

        if (this.getProp('align') === 'left') this.widget.classList.add('left')
        if (this.getProp('align') === 'right') this.widget.classList.add('right')

        this.select = this.widget.appendChild(html`<select class="no-keybinding"></select>`)
        this.text = DOM.get(this.widget, '.text')[0]

        this.parseValues()

        this.select.addEventListener('change', ()=>{
            this.setValue(this.values[this.select.selectedIndex], {sync:true, send:true, fromLocal:true})
        })

        this.select.selectedIndex = -1
        this.container.classList.add('noselect')

    }

    parseValues() {

        super.parseValues()

        this.select.innerHTML = ''
        for (var i = 0; i < this.values.length; i++) {
            this.select.appendChild(html`
                <option value="${i}">
                    ${this.keys[i]}
                </option>
            `)
        }

    }

    setValue(v,options={}) {

        var i = this.getIndex(v)

        this.value = this.values[i]

        if (!options.fromLocal) this.select.selectedIndex = i

        this.text.textContent = i === -1 ? '' : this.select.options[i].textContent

        if (document.activeElement === this.select && iOS) {
            // force menu close on ios
            this.select.blur()
        }

        if (options.send) this.sendValue()
        if (options.sync) this.changed(options)

    }

    onPropChanged(propName, options, oldPropValue) {

        var ret = super.onPropChanged(...arguments)

        switch (propName) {

            case 'values':
                this.parseValues()
                this.setValue(this.value)
                return

        }

        return ret

    }

}

Dropdown.dynamicProps = Dropdown.prototype.constructor.dynamicProps.concat(
    'values'
)


module.exports = Dropdown
