var Widget = require('../common/widget'),
    morph = require('nanomorph'),
    html = require('nanohtml'),
    sanitizeHtml = require('sanitize-html'),
    StaticProperties = require('../mixins/static_properties')

var sanitizeOptions = {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2']).filter(x=>x!=='iframe'),
    allowedAttributes: {
        '*': [ 'title', 'class', 'style'],
        'img': [ 'src' ,  'title', 'class', 'style', 'width', 'height']
    }
}

class Html extends StaticProperties(Widget, {bypass: true}) {

    static description() {

        return 'Simple HTML parser.'

    }


    static defaults() {

        return super.defaults({

            _html:'html',

            html: {type: 'string', value: '', help: [
                'Allowed HTML tags:',
                '&nbsp;&nbsp;h1-6, blockquote, p, a, ul, ol, nl, li,',
                '&nbsp;&nbsp;b, i, strong, em, strike, code, hr, br, div,',
                '&nbsp;&nbsp;table, thead, img, caption, tbody, tr, th, td, pre',
                'Allowed attributes:',
                '&nbsp;&nbsp;<*>: class, style, title',
                '&nbsp;&nbsp;<img>: src, width, height',
            ]},

        }, ['decimals', 'bypass'], {})

    }

    constructor(options) {

        super({...options, html: html`
            <inner>
                <div class="frame"></div>
            </inner>
        `})

        if (!this.getProp('border')) this.container.classList.add('noborder')
        this.frame = DOM.get(this.widget, '.frame')[0]

        if (this.getProp('html') !== '') this.updateHtml()

    }

    updateHtml(){

        var newHtml = this.frame.cloneNode(false)

        newHtml.innerHTML = sanitizeHtml(this.getProp('html'), sanitizeOptions)

        morph(this.frame, newHtml)

    }

    onPropChanged(propName, options, oldPropValue) {

        if (super.onPropChanged(...arguments)) return true

        switch (propName) {

            case 'html':
                this.updateHtml()
                return

        }

    }


}

Html.dynamicProps = Html.prototype.constructor.dynamicProps.concat(
    'html'
)

module.exports = Html
