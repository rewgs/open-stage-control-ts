var {iconify} = require('../../ui/utils'),
    Widget = require('../common/widget'),
    html = require('nanohtml'),
    StaticProperties = require('../mixins/static_properties')

module.exports = class Text extends StaticProperties(Widget, {bypass: true, interaction: false}) {

    static description() {

        return 'Display text.'

    }

    static defaults() {

        return super.defaults({

            _text: 'text',

            vertical: {type: 'boolean', value: false, help: 'Set to `true` to display the text vertically'},
            wrap: {type: 'boolean', value: false, help: [
                'Set to `true` to wrap long lines automatically.',
                'This will not break overflowing words by default, word-breaking can be enabled by adding `word-break: break-all;` to the `css` property',
            ]},
            align: {type: 'string', value: 'center', choices: ['center', 'left', 'right'], help: 'Css text-align property.'},

        }, ['interaction', 'decimals', 'bypass'], {})

    }

    constructor(options) {

        super({...options, html: html`<inner></inner>`})

        this.text = this.widget.appendChild(html`<div></div>`)

        if (this.getProp('vertical')) this.text.classList.add('vertical')
        if (this.getProp('align') === 'left') this.text.classList.add('left')
        if (this.getProp('align') === 'right') this.text.classList.add('right')
        if (this.getProp('wrap')) this.text.classList.add('wrap')


        this.defaultValue = this.getProp('default') || ( this.getProp('label')===false ?
            this.getProp('id'):
            this.getProp('label')=='auto'?
                this.getProp('id'):
                this.getProp('label') )

        this.value = this.defaultValue

        this.setValue(this.value)

    }


    setValue(v, options={}) {

        this.value = v==null ? this.defaultValue : v

        var s = String(this.value)
        if (s.indexOf('^') > -1) {
            this.text.innerHTML = iconify(s.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g,'<br/>'))
        } else {
            this.text.textContent = s.replace(/\n/g,'\r\n')
        }

        if (options.sync) this.changed(options)

    }

}
