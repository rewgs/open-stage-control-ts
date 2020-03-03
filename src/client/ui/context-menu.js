var html = require('nanohtml'),
    raw = require('nanohtml/raw'),
    UiWidget = require('./ui-widget'),
    MENU_CONTAINER

class ContextMenu extends UiWidget {

    constructor(options){

        super(options)

        if (!MENU_CONTAINER) MENU_CONTAINER = DOM.get('osc-modal-container')[0]


        this.container = null
        MENU_CONTAINER = DOM.get('osc-workspace')[0]
        this.clickHandler = (e)=>{
            if (this.container && !this.container.contains(e.target)) this.close()
        }

    }

    open(e, actions, parent) {

        var menu = html`<div class="context-menu"></div>`

        for (let action of actions) {

            if (action.separator) {

                menu.appendChild(html`<div class="separator"></div>`)

            } else if (Array.isArray(action.action)) {

                let item = html`<div class="item has-sub" tabIndex="1">${raw(action.label)}</div>`

                menu.appendChild(item)

                this.open(e, action.action, item)


            } else {

                let item = html`<div class="item">${raw(action.label)}</div>`

                menu.appendChild(item)

                if (action.click) {

                    item.addEventListener('click', (e)=>{
                        e.preventDefault()
                        action.action()
                        this.close()
                    })

                } else {

                    item.addEventListener('fast-click', (e)=>{
                        e.detail.preventOriginalEvent = true
                        action.action()
                        this.close()
                    })

                }

            }

        }

        if (parent) parent.appendChild(menu)

        if (!parent) {

            this.container = menu

            MENU_CONTAINER.appendChild(menu)

            DOM.each(menu, '.item', (item)=>{
                item.addEventListener('mouseenter', ()=>{
                    DOM.each(item.parentNode, '.focus', (focused)=>{
                        focused.classList.remove('focus')
                    })
                    item.classList.add('focus')
                })
                item.addEventListener('mouseleave', ()=>{
                    if (!item.classList.contains('has-sub')) item.classList.remove('focus')
                })
            })

            menu.style.top = e.pageY + 'px'
            menu.style.left = e.pageX + 'px'

            this.correctPosition(menu)

            DOM.each(menu, '.context-menu', (m)=>{
                this.correctPosition(m, m.parentNode)
            })

        }

        document.addEventListener('fast-click', this.clickHandler, true)
        document.addEventListener('fast-right-click', this.clickHandler, true)

        this.trigger('open')

    }

    close() {

        if (this.container) {

            this.container.parentNode.removeChild(this.container)
            this.container = null

        }

        document.removeEventListener('fast-click', this.clickHandler, true)
        document.removeEventListener('fast-right-click', this.clickHandler, true)

        this.trigger('close')

    }

    correctPosition(menu, parent) {

        var position = DOM.offset(menu),
            width = menu.offsetWidth,
            height = menu.offsetHeight,
            totalWidth = MENU_CONTAINER.offsetWidth,
            totalHeight = MENU_CONTAINER.offsetHeight

        if (width + position.left > totalWidth) {
            menu.style.right = parent ? '100%' : '0'
            menu.style.left = 'auto'
            menu.style.marginRight = '1rem'
        }

        if (height + position.top > totalHeight) {
            menu.style.top = 'auto'
            menu.style.bottom = '0rem'
        }

    }

}

module.exports = ContextMenu
