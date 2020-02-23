var Container = require('../common/container'),
    widgetManager = require('../../managers/widgets'),
    parser = require('../../parser'),
    html = require('nanohtml'),
    raw = require('nanohtml/raw'),
    {enableTraversingGestures, disableTraversingGestures} = require('../../events/drag'),
    setScrollbarColor = require('../../ui/scrollbar-color')

class Panel extends Container() {

    static description() {

        return 'Widgets or Tabs container.'

    }

    static defaults() {

        return super.defaults({

            _panel:'panel',

            scroll: {type: 'boolean', value: true, help: 'Set to `false` to disable scrollbars'},
            layout: {type: 'string', value: 'default', choices: ['default', 'vertical', 'horizontal'], help:''},
            traversing: {type: 'boolean', value: false, help: 'Set to `true` to enable traversing gestures in this widget. Set to `smart` or `auto` to limit affected widgets by the type of the first touched widget'},
            variables: {type: '*', value: '@{parent.variables}', help: 'Defines one or more arbitrary variables that can be inherited by children widgets'},

        }, [], {

            _children:'children',

            widgets: {type: 'array', value: [], help: 'Each element of the array must be a widget object. A panel cannot contain widgets and tabs simultaneously.'},
            tabs: {type: 'array', value: [], help: 'Each element of the array must be a tab object. A panel cannot contain widgets and tabs simultaneously'},

            value: {type: 'integer', value: '', help: [
                'Defines currently widgeted tab in the widget',
                'A tab can be opened only by setting its parent\'s value'
            ]},

        })


    }

    constructor(options) {


        super({...options, html: html`<div class="panel"></div>`})

        if (this.getProp('scroll') === false) this.container.classList.add('noscroll')
        this.container.classList.add('layout-' + this.getProp('layout'))


        if (this.getProp('tabs') && this.getProp('tabs').length) {

            this.container.classList.add('contains-tabs')

        } else {

            this.container.classList.add('contains-widgets')

        }




        this.value = -1
        this.tabs = []

        if (this.getProp('tabs') && this.getProp('tabs').length) {

            this.navigation = this.widget.appendChild(html`<div class="navigation"></div>`)

            this.children = options.children || new Array(this.getProp('tabs').length)
            for (let i = 0; i < this.children.length; i++) {
                if (this.children[i]) {
                    this.widget.appendChild(this.children[i].container)
                    this.children[i].mounted = true
                    this.children[i].parent = this
                    this.children[i].parentNode = this.widget
                } else {
                    parser.parse({
                        data: this.getProp('tabs')[i],
                        parentNode: this.widget,
                        parent: this,
                        tab: true,
                        index: i
                    })
                }
            }

            if (options.children) this.alignChildrenProps()

            this.createNavigation()

            this.navigation.addEventListener('fast-click', (e)=>{
                if (!e.target.hasAttribute('data-widget')) return
                var index = DOM.index(e.target)
                this.setValue(index, {sync: true, send:this.value != index})
            })

            this.on('tab-created', (e)=>{
                this.createNavigation()
                e.stopPropagation = true
            })

            this.setValue(this.getProp('value') || 0)

        } else if (this.getProp('widgets') && this.getProp('widgets').length) {

            this.children = options.children || new Array(this.getProp('widgets').length)
            for (let i = 0; i < this.children.length; i++) {
                if (this.children[i]) {
                    this.widget.appendChild(this.children[i].container)
                    this.children[i].mounted = true
                    this.children[i].parent = this
                    this.children[i].parentNode = this.widget
                } else {
                    parser.parse({
                        data: this.getProp('widgets')[i],
                        parentNode: this.widget,
                        parent: this,
                        index: i
                    })
                }
            }

            if (options.children) this.alignChildrenProps()


        }

        if (this.getProp('tabs') && !this.getProp('tabs').length) {
            this.disabledProps.push(
                'precision', 'address', 'preArgs', 'target', 'bypass',
                'value', 'default'
            )
        }
        if (this.getProp('widgets') && !this.getProp('widgets').length) {
            this.disabledProps.push(
                'scroll'
            )
        }


        if (this.getProp('traversing')) this.setTraversing()

    }

    createNavigation() {

        this.navigation.innerHTML = ''
        this.tabs = []

        DOM.each(this.widget, '> .widget', (tab)=>{

            let widget = widgetManager.getWidgetByElement(tab),
                style = ''

            style += widget.getProp('colorWidget') === 'auto' ? '' : `--color-widget:${widget.getProp('colorWidget')};`
            style += widget.getProp('colorFill') === 'auto' ? '' : `--color-fill:${widget.getProp('colorFill')};`

            if (!widget.getProp('visible')) style += 'display:none;'

            this.tabs.push(widget)
            this.navigation.appendChild(html`
                <div class="tablink" data-widget="${widget.hash}" style="${style}">
                    ${widget.label.innerHTML}
                </div>
            `)

        })


        this.setValue(this.value)

    }

    setValue(v, options={}) {
        if (this.tabs.length && typeof v == 'number' && v >= 0 && v < this.tabs.length) {

            for (let i in this.tabs) {
                if (i != v) this.tabs[i].hide()
            }

            this.value = v

            this.tabs[v].show()
            DOM.each(this.navigation, 'div', (el)=>{el.classList.remove('on')})[v].classList.add('on')

            if (options.send) this.sendValue()
            if (options.sync) this.changed(options)

        }
    }

    scroll(s) {

        if (!s) {
            return [this.widget.scrollLeft, this.widget.scrollTop]
        } else {
            this.widget.scrollLeft = s[0]
            this.widget.scrollTop = s[1]
        }

    }

    onPropChanged(propName, options, oldPropValue) {

        if (super.onPropChanged(...arguments)) return true

        switch (propName) {

            case 'traversing':
                this.setTraversing()
                return

            case 'colorWidget':
            case 'colorFill':
            case 'colorStroke':
            case 'alphaStroke':
            case 'alphaFillOff':
            case 'alphaFillOn':
                for (var w of this.children) {
                    if (w) w.onPropChanged(propName)
                }
                return

        }

    }

    setContainerStyles(styles = ['geometry', 'label', 'css', 'color', 'visibility']) {

        super.setContainerStyles(styles)

        if (styles.includes('color') && this.getProp('scroll')) {

            setScrollbarColor(this.container)

        }

    }

    setTraversing(update) {

        var traversing = this.getProp('traversing')

        disableTraversingGestures(this.widget)

        if (traversing) {
            enableTraversingGestures(this.widget, {smart: typeof traversing === 'string' && traversing.match(/smart|auto/)})
        }

    }


    onRemove() {
        this.off('resize')
        super.onRemove()
    }

}

Panel.dynamicProps = Panel.prototype.constructor.dynamicProps.concat(
    'variables',
    'traversing'
)

module.exports = Panel
