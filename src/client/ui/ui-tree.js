var UiWidget = require('./ui-widget'),
    html = require('nanohtml'),
    doubleClick = require('../events/double-click'),
    Sortable = require('sortablejs'),
    morph = require('nanomorph'),
    Root, Panel, Matrix, Keyboard, widgetManager,
    init = false

class UiTree extends UiWidget {

    constructor(options) {

        Root = require('../widgets/containers/root')
        Panel = require('../widgets/containers/panel')
        Matrix = require('../widgets/containers/matrix')
        Keyboard = require('../widgets/containers/keyboard')
        widgetManager = require('../managers/widgets')

        super(options)

        this.mounted = false
        this.list = this.container.appendChild(html`<ol style="--depth: 1"></ol`)
        this.dragDummy = html`<span></span>`


        this.expanded = {}

        this.container.addEventListener('fast-click', (event)=>{

            var node = event.target
            if (node.classList.contains('toggle')) {
                var exp = node.parentNode.classList.toggle('expanded')
                if (exp) {
                    this.expanded[node.parentNode.getAttribute('data-widget')] = true
                } else {
                    delete this.expanded[node.parentNode.getAttribute('data-widget')]
                }
            }


        })

        doubleClick(this.container, (event)=>{

            var node = event.target
            if (node.classList.contains('container')) {
                var exp = node.classList.toggle('expanded')
                if (exp) {
                    this.expanded[node.getAttribute('data-widget')] = true
                } else {
                    delete this.expanded[node.getAttribute('data-widget')]
                }
            }

        }, {ignoreEditorCapture: true})


        this.sortables = []
        this.sortCallback = (event)=>{
            var widget = widgetManager.widgets[event.to.parentNode.getAttribute('data-widget')]
            if (!widget) return
            this.trigger('sorted', {
                widget: widget,
                oldIndex: event.oldIndex,
                newIndex: event.newIndex
            })
        }

        widgetManager.on('prop-changed', (e)=>{
            console.log(e)
        })

    }

    clear() {

        this.list.innerHTML = ''
        this.mounted = false
        for (var s of this.sortables) {
            s.destroy()
        }
        this.sortables = []

    }

    updateTree(selectedWidgets) {

        for (var s of this.sortables) {
            s.destroy()
        }
        this.sortables = []

        var content = this.parseWidgets(widgetManager.getWidgetById('root')[0], selectedWidgets)

        if (!content) return

        // morph DOM
        if (this.mounted) {
            morph(this.list.firstChild, content)
        } else {
            this.list.appendChild(content)
        }


        // sortable lists
        DOM.each(this.list, 'ol', (el)=>{

            this.sortables.push(new Sortable(el, {
                group: {
                    name: 'group-' + el.parentNode.getAttribute('data-widget'),
                    pull: false,
                    put: false
                },
                onEnd: this.sortCallback,
                setData: (dataTransfer)=>{
                    dataTransfer.setDragImage(this.dragDummy, 0, 0)
                },
            }))
        })

        this.mounted = true


    }

    showWidget(widget) {

        var node = DOM.get(this.list, `[data-widget="${widget.hash}"]`)
        if (node) {
            var parent = node[0].parentNode
            while (parent !== this.list) {
                if (parent.classList.contains('container')) {
                    parent.classList.add('expanded')
                    this.expanded[parent.getAttribute('data-widget')] = true
                }
                parent = parent.parentNode
            }
            node[0].scrollIntoView({block: 'center'})
        }

    }

    select() {

        // hint selection in folded containers
        DOM.each(this.list, '.contains-editing', (element)=>{
            element.classList.remove('contains-editing')
        })
        var selected = DOM.get(this.list, '.editing')[0]
        if (selected) {
            var node = selected.parentNode
            while (node && node !== this.list) {
                if (node.classList.contains('container')) {
                    node.classList.add('contains-editing')
                }
                node = node.parentNode
            }
        }
    }

    parseWidgets(widget, selectedWidgets, depth = 1) {

        if (!widget) return

        var selected = selectedWidgets.includes(widget),
            id = widget.getProp('id'),
            node = html`<li class="${selected ? 'editing' : ''} ${!widget.getProp('visible') ? 'invisible' : ''}"
                            data-widget="${widget.hash}">
                        ${id}</li>`

        if (widget instanceof Panel && !(widget instanceof Matrix || widget instanceof Keyboard)) {
            node.insertBefore(html`<span class="toggle no-widget-select"></span>`, node.childNodes[0])
            node.classList.add('container')
            if (this.expanded[widget.hash]) node.classList.add('expanded')
            if (!init && widget instanceof Root) {
                node.classList.add('expanded')
                this.expanded[widget.hash] = true
                init = true
            }
            var sublist = node.appendChild(html`<ol style="--depth:${++depth};"></ol>`)
            for (let child of widget.children) {
                if (child) sublist.appendChild(this.parseWidgets(child, selectedWidgets, depth))
            }

        }

        for (var h in this.expanded) {
            if (!widgetManager.widgets[h]) delete this.expanded[h]
        }

        return node

    }

}

module.exports = UiTree
