var Container = require('../common/container'),
    widgetManager = require('../../managers/widgets'),
    parser = require('../../parser'),
    html = require('nanohtml'),
    {enableTraversingGestures, disableTraversingGestures} = require('../../events/drag'),
    setScrollbarColor = require('../../ui/scrollbar-color'),
    iOS13 = require('../../ui/ios') === 13,
    Fader = require('../sliders/fader'), faderDefaults,
    resize = require('../../events/resize')

class Panel extends Container() {

    static description() {

        return 'Widgets or Tabs container.'

    }

    static defaults() {

        return super.defaults().extend({
            class_specific: {
                variables: {type: '*', value: '@{parent.variables}', help: 'Defines one or more arbitrary variables that can be inherited by children widgets'},
                traversing: {type: 'boolean', value: false, help: 'Set to `true` to enable traversing gestures in this widget. Set to `smart` or `auto` to limit affected widgets by the type of the first touched widget'},
            },
            style: {
                _separator_panel_style: 'Panel style',
                colorBg: {type: 'string', value: 'auto', help: 'Panel background color. Set to "auto" to inherit from parent widget.'},
                layout: {type: 'string', value: 'default', choices: ['default', 'vertical', 'horizontal', 'grid'], help:'Defines how children are laid out.'},
                justify: {type: 'string', value: 'start', choices: ['start', 'end', 'center', 'space-around', 'space-between'], help:'If `layout` is `vertical` or `horizontal`, defines how widgets should be justified.'},
                gridTemplate: {type: 'string|number', value: '', help:'If `layout` is `grid`, can be either a number of columns of a value css grid-template definition.'},
                contain: {type: 'boolean', value: true, help:'If `layout` is `vertical` or `horizontal`, prevents children from overflowing the panel.'},
                scroll: {type: 'boolean', value: true, help: 'Set to `false` to disable scrollbars'},
                innerPadding: {type : 'boolean', value: true, help: 'Set to `false` to make the `padding` property apply only between children and not at the container\'s inner boundaries.'},
                verticalTabs: {type: 'boolean', value: false, help: 'Set to `true` to display for vertical tab layout'},
            },
            value: {
                value: {type: 'integer', value: '', help: [
                    'Defines currently selected tab in the widget',
                    'A tab can be opened only by setting its parent\'s value'
                ]}
            },
            children: {
                widgets: {type: 'array', value: [], help: 'Each element of the array must be a widget object. A panel cannot contain widgets and tabs simultaneously.'},
                tabs: {type: 'array', value: [], help: 'Each element of the array must be a tab object. A panel cannot contain widgets and tabs simultaneously'},
            }
        })

    }

    constructor(options) {


        super({...options, html: html`<inner></inner>`})

        this.childrenType = ''

        this.container.classList.toggle('no-inner-padding', !this.getProp('innerPadding'))
        this.container.classList.toggle('no-scroll', !this.getProp('scroll'))
        this.container.classList.add('layout-' + this.getProp('layout'))
        this.container.classList.toggle('layout-contain', this.getProp('contain'))

        this.modalBreakout = 0

        var layout = this.getProp('layout')
        if (layout === 'grid') {

            var template = this.getProp('gridTemplate') || 2
            this.widget.style.gridTemplate = template === parseInt(template) ? `none / repeat(${template}, 1fr)` : template

        } else if (layout === 'vertical' || layout === 'horizontal'){

            var justify = this.getProp('justify')
            if (justify === 'start' || justify === 'end') justify = 'flex-' + justify
            this.widget.style.justifyContent = justify

        }

        if (this.getProp('tabs') && this.getProp('tabs').length) {

            this.container.classList.add('contains-tabs')
            this.container.classList.toggle('vertical-tabs', this.getProp('verticalTabs'))

        } else {

            this.container.classList.add('contains-widgets')

            if (iOS13) {

                faderDefaults = faderDefaults || Fader.defaults()._props()

                this.iosScrollbars = {}
                for (let dir of ['vertical', 'horizontal']) {
                    this.iosScrollbars[dir] = new Fader({props:{
                        ...faderDefaults,
                        design:'compact',
                        horizontal: dir === 'horizontal',
                        range: dir === 'horizontal' ? {min:0, max:1} : {min:1, max:0}
                    }, parent: this})
                    this.iosScrollbars[dir].container.classList.add('not-editable')
                    this.iosScrollbars[dir].container.classList.add('ios-scrollbar')
                    this.iosScrollbars[dir].container.classList.add(dir)
                    this.iosScrollbars[dir]._scrollable = false
                    this.container.appendChild(this.iosScrollbars[dir].container)
                }
                this.widget.addEventListener('scroll', ()=>{
                    if (this.iosScrollbars.horizontal._scrollable) this.iosScrollbars.horizontal.setValue(this.widget.scrollLeft / (this.widget.scrollWidth - this.widget.clientWidth))
                    if (this.iosScrollbars.vertical._scrollable) this.iosScrollbars.vertical.setValue(this.widget.scrollTop / (this.widget.scrollHeight - this.widget.clientHeight))
                })
                this.iosScrollbars.horizontal.on('change', (e)=>{
                    e.stopPropagation = true
                    this.widget.scrollLeft = parseInt(e.widget.getValue() * (this.widget.scrollWidth - this.widget.clientWidth))
                })
                this.iosScrollbars.vertical.on('change', (e)=>{
                    e.stopPropagation = true
                    this.widget.scrollTop = parseInt(e.widget.getValue() * (this.widget.scrollHeight - this.widget.clientHeight))
                })

                this.checkScrollBars = ()=>{
                    this.iosScrollbars.horizontal.container.style.setProperty('--knob-size', parseInt(this.widget.clientWidth * this.widget.clientWidth / this.widget.scrollWidth) + 'px')
                    this.iosScrollbars.vertical.container.style.setProperty('--knob-size', parseInt(this.widget.clientHeight * this.widget.clientHeight / this.widget.scrollHeight) + 'px')
                    this.iosScrollbars.horizontal._scrollable = this.container.classList.toggle('has-ios-scrollbar-h', this.widget.scrollWidth > this.widget.clientWidth)
                    this.iosScrollbars.vertical._scrollable = this.container.classList.toggle('has-ios-scrollbar-v', this.widget.scrollHeight > this.widget.clientHeight)
                    this.iosScrollbars.vertical.container.classList.toggle('double-scrollbar', this.iosScrollbars.horizontal._scrollable && this.iosScrollbars.vertical._scrollable)
                    if (this.iosScrollbars.horizontal._scrollable) resize.check(this.iosScrollbars.horizontal.container, true)
                    if (this.iosScrollbars.vertical._scrollable) resize.check(this.iosScrollbars.vertical.container, true)


                    this.iosScrollbars.horizontal.batchDraw()
                }

                this.on('resize', (event)=>{
                    this.checkScrollBars()
                }, {element: this.widget})


            }

        }




        this.tabs = []

        if (this.getProp('tabs') && this.getProp('tabs').length) {

            this.childrenType = 'tab'

            this.value = -1

            this.navigation = this.widget.appendChild(html`<div class="navigation ${this.getProp('verticalTabs') ? 'vertical' : ''}"></div>`)

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

            this.value = -1

            this.childrenType = 'widget'

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
            style += widget.getProp('colorText') === 'auto' ? '' : `--color-text:${widget.getProp('colorText')};`

            if (!widget.getProp('visible')) style += 'display:none;'

            this.tabs.push(widget)
            var label = html`
                <div class="tablink" data-widget="${widget.hash}" style="${style}">
                </div>
            `
            label.innerHTML = widget.label
            this.navigation.appendChild(label)

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
            if (s[0] !== undefined) this.widget.scrollLeft = s[0]
            if (s[1] !== undefined) this.widget.scrollTop = s[1]
        }

    }

    onPropChanged(propName, options, oldPropValue) {

        if (super.onPropChanged(...arguments)) return true

        switch (propName) {

            case 'traversing':
                this.setTraversing()
                return

            case 'colorBg':
                this.setCssVariables()
            case 'colorWidget':
                if (iOS13) this.checkScrollBars()
            case 'colorText':
            case 'colorFill':
            case 'colorStroke':
            case 'alphaStroke':
            case 'alphaFillOff':
            case 'alphaFillOn':
            case 'padding':
                for (var w of this.children) {
                    if (w) w.onPropChanged(propName)
                }
                return

        }

    }

    setCssVariables() {

        super.setCssVariables()
        setScrollbarColor(this.container)

    }

    setTraversing(update) {

        var traversing = this.getProp('traversing')

        disableTraversingGestures(this.widget)

        if (traversing) {
            enableTraversingGestures(this.widget, {type: typeof traversing === 'string' ? traversing : undefined})
        }

    }


    onRemove() {
        this.off('resize')
        super.onRemove()
    }

}

Panel.dynamicProps = Panel.prototype.constructor.dynamicProps.concat(
    'colorBg',
    'variables',
    'traversing'
)

module.exports = Panel
