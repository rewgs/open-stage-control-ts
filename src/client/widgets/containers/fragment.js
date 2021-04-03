var Container = require('../common/container'),
    widgetManager = require('../../managers/widgets'),
    resize = require('../../events/resize'),
    parser = require('../../parser'),
    {deepCopy, deepEqual} = require('../../utils'),
    html = require('nanohtml'),
    sessionManager

var excludedfragmentClasses =  ['widget', 'absolute-position', 'not-editable', 'editing', 'flex-expand', 'no-interaction']

class Fragment extends Container() {

    static description() {

        return 'Embedded session or fragment with overridable properties.'

    }

    static defaults() {

        var defaults = super.defaults().extend({

            class_specific: {
                file: {type: 'string', value: '', help: 'fragment file path'},
                props: {type: 'object', value: {}, help: 'Fragment widget\'s properties to override'},
            },
            value: null,
            osc: null
        })

        defaults.style = {css: defaults.style.css}

        return defaults

    }

    constructor(options) {

        options.props.address = 'auto'
        options.props.variables = '@{parent.variables}'

        super({...options, html: html`<div class="fragment"></div>`})

        this.noValueState = true

        this.modalBreakout = 0

        this.fragmentClass = []
        this.container.classList.add('empty')

        this.on('widget-created', (e)=>{

            if (e.widget !== this) {
                e.widget.container.classList.add('not-editable')
                e.widget._not_editable = true
            }

        })

        sessionManager = sessionManager || require('../../managers/session')

        sessionManager.on('fragment-updated', (e)=>{
            var {path} = e
            if (path === this.getProp('file')) {
                this.createFragment()
            }
        })

        if (this.getProp('file')) {
            if (sessionManager.getFragment(this.getProp('file'))) {
                this.createFragment()
            } else {
                sessionManager.loadFragment(this.getProp('file'))
            }
        }


    }

    createFragment() {

        var fragment = sessionManager.getFragment(this.getProp('file'))

        if (!fragment) return


        var data = {...deepCopy(fragment.getRoot()), ...this.getProp('props')}

        parser.parse({
            data: data,
            parentNode: this.widget,
            parent: this
        })

        this.updateContainer()

    }


    updateContainer() {


        if (this.children[0]) {

            var classes = [...this.children[0].container.classList].filter(i=>excludedfragmentClasses.indexOf(i) === -1)

            if (!deepEqual(classes, this.fragmentClass)) {
                this.container.classList.remove(...this.fragmentClass)
                this.fragmentClass = classes
                this.container.classList.add(...this.fragmentClass)
            }

            this.container.classList.remove('empty')

            for (var w of this.getAllChildren()) {
                w.container.classList.add('not-editable')
            }

            resize.check(this.widget)

        } else if (this.fragmentClass.length) {

            this.container.classList.remove(...this.fragmentClass)
            this.container.classList.add('empty')
            this.fragmentClass = []
            this.widget.innerHTML = ''
            widgetManager.removeWidgets(this.getAllChildren())

        }

    }

}


module.exports = Fragment
