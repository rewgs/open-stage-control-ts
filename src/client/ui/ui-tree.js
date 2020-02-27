var UiWidget = require('./ui-widget'),
    html = require('nanohtml'),
    doubleClick = require('../events/double-click'),
    Sortable = require('sortablejs'),
    morph = require('nanomorph'),
    Panel, Matrix, widgetManager

class UiTree extends UiWidget {

    constructor(options) {

        Panel = require('../widgets/containers/panel')
        Matrix = require('../widgets/containers/matrix')
        widgetManager = require('../managers/widgets')

        super(options)

        this.mounted = false
        this.list = this.container.appendChild(html`<ol style="--depth: 1"></ol`)
        this.dragDummy = html`<span></span>`


        this.expanded = {root: true}
        this.container.addEventListener('fast-click', (event)=>{

            var node = event.target
            if (node.classList.contains('toggle')) {
                var exp = node.parentNode.classList.toggle('expanded')
                if (exp) {
                    this.expanded[node.parentNode.getAttribute('data-id')] = true
                } else {
                    delete this.expanded[node.parentNode.getAttribute('data-id')]
                }
            }


        })

        doubleClick(this.container, (event)=>{

            var node = event.target
            if (node.classList.contains('container')) {
                var exp = node.classList.toggle('expanded')
                if (exp) {
                    this.expanded[node.getAttribute('data-id')] = true
                } else {
                    delete this.expanded[node.getAttribute('data-id')]
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

        var selected = selectedWidgets.includes(widget),
            id = widget.getProp('id'),
            node = html`<li class="${selected ? 'editing' : ''} ${!widget.getProp('visible') ? 'invisible' : ''}"
                            data-widget="${widget.hash}"
                            data-id="${id}"">
                        ${id}</li>`

        if (widget instanceof Panel && !(widget instanceof Matrix)) {
            node.insertBefore(html`<span class="toggle no-widget-select"></span>`, node.childNodes[0])
            node.classList.add('container')
            if (this.expanded[id]) node.classList.add('expanded')
            var sublist = node.appendChild(html`<ol style="--depth:${++depth};"></ol>`)
            for (let child of widget.children) {
                sublist.appendChild(this.parseWidgets(child, selectedWidgets, depth))
            }

        }

        return node

    }

}

module.exports = UiTree
