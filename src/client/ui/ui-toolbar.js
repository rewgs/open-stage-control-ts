var UiWidget = require('./ui-widget'),
    morph = require('nanomorph'),
    ContextMenu = require('./context-menu'),
    html = require('nanohtml'),
    raw = require('nanohtml/raw'),
    {icon} = require('./utils')


var menu = [

    {
        label: 'Session',
        action: [
            {
                label: 'new'
            },
            {
                separator: true
            },
            {
                label: 'open'
            },
            {
                label: 'save'
            },
            {
                label: 'save as'
            },
            {
                separator: true
            },
            {
                label: 'import'
            },
            {
                label: 'export'
            },

        ]
    },
    {
        label: 'State',
        action: [
            {
                label: 'store'
            },
            {
                label: 'recall'
            },
            {
                separator: true
            },
            {
                label: 'open'
            },
            {
                label: 'save'
            },
            {
                label: 'save as'
            },
            {
                separator: true
            },
            {
                label: 'import'
            },
            {
                label: 'export'
            },
        ]
    },
    {
        label: 'Editor',
        action: [
            {
                label: 'enabled'
            },
            {
                label: 'grid'
            },
            {
                label: 'project tree'
            },
            {
                label: 'inspector'
            }
        ]
    },
    {
        separator: true
    },
    {
        label: 'Fullscreen',
        action: ()=>{}
    },

]


class UiToolbar extends UiWidget {

    constructor(options) {

        super(options)

        this.menu = new ContextMenu()
        this.opened = false

        this.container.addEventListener('fast-click', (e)=>{
            if (this.opened) this.close()
            else this.open(e)
        })

        this.menu.on('close', ()=>{
            setTimeout(()=>{
                this.opened = false
                this.toggleState()
            })
        })

    }

    open(e) {

        if (this.opened) return

        this.menu.open({
            target: e.detail.target,
            pageX: e.detail.pageX - e.detail.offsetX + PXSCALE,
            pageY: e.detail.pageY - e.detail.offsetY + e.detail.target.offsetHeight + 5 * PXSCALE
        }, menu)

        this.opened = true
        this.toggleState()


    }

    close() {

        if (this.opened) return

        this.menu.close()

        this.opened = false
        this.toggleState()

    }

    toggleState() {

        this.container.classList.toggle('on', this.opened)

    }

}


module.exports = new UiToolbar({selector: 'osc-toolbar'})
