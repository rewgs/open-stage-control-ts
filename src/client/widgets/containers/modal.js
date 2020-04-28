var Panel = require('./panel'),
    Widget = require('../common/widget'),
    {icon, iconify} = require('../../ui/utils'),
    resize = require('../../events/resize'),
    doubletab = require('../mixins/double_tap'),
    html = require('nanohtml'),
    raw = require('nanohtml/raw')

class Modal extends Panel {

    static description() {

        return 'A toggle button that opens a popup panel. Cannot contain tabs directly.'

    }

    static defaults() {

        return Widget.defaults({

            _modal: 'modal',

            label: {type: 'string|boolean', value: 'auto', help: [
                'Set to `false` to hide completely',
                '- Insert icons using the prefix ^ followed by the icon\'s name : `^play`, `^pause`, etc (see https://fontawesome.com/icons?d=gallery&s=solid&m=free)',
                '- Icons can be transformed with the following suffixes: `.flip-[horizontal|vertical|both]`, `.rotate-[90|180|270]`, `.spin`, `.pulse`. Example: `^play.flip-horizontal`',
            ]},
            doubleTap: {type: 'boolean', value: false, help: 'Set to `true` to make the modal require a double tap to open instead of a single tap'},
            variables: {type: '*', value: '@{parent.variables}', help: 'Defines one or more arbitrary variables that can be inherited by children widgets'},

            _modalWidgets: 'modal: popup',

            popupLabel: {type: 'string', value: '', help: 'Alternative label for the modal popup'},
            popupWidth: {type: 'number|percentage', value: '80%', help: 'Modal popup\'s size'},
            popupHeight: {type: 'number|percentage', value: '80%', help: 'Modal popup\'s size'},
            popupLeft: {type: 'number|percentage', value: 'auto', help: 'Modal popup\'s position'},
            popupTop: {type: 'number|percentage', value: 'auto', help: 'Modal popup\'s position'},

            layout: {type: 'string', value: 'default', choices: ['default', 'vertical', 'horizontal', 'grid'], help: 'Defines how children are laid out.'},
            gridTemplate: {type: 'string|number', value: '', help:'If `layout` is `grid`, can be either a number of columns of a value css grid-template definition.'},
            traversing: {type: 'boolean', value: false, help: 'Set to `true` to enable traversing gestures in this widget. Set to `smart` or `auto` to limit affected widgets by the type of the first touched widget'},
            scroll: {type: 'boolean', value: true, help: 'Set to `false` to disable scrollbars'},
            innerPadding: {type : 'boolean', value: true, help: 'Set to `false` to make the `padding` property apply only between children and not at the container\'s inner boundaries.'},

        }, [], {

            _children: 'children',

            widgets: {type: 'array', value: [], help: 'Each element of the array must be a widget object'},
            value: {type: 'integer', value: '', help: [
                'Defines the modal\'s state:`0` for closed, `1` for opened'
            ]},

        })

    }

    constructor(options) {

        super(options)

        this.popup = html`
            <div class="popup">
                <div class="popup-wrapper">
                    <div class="popup-title closable"><span class="popup-label"></span><span class="closer">${raw(icon('times'))}</span></div>
                    <div class="popup-content widget panel-container not-editable contains-widgets"></div>
                </div>
            </div>
        `

        this.container.appendChild(this.popup)
        this.popupContent = DOM.get(this.popup, '.popup-content')[0]

        // convert dimensions / coordinates to rem
        var geometry = {}
        for (var g of ['Width', 'Height', 'Left', 'Top']) {
            geometry[g] = parseFloat(this.getProp('popup' + g)) == this.getProp('popup' + g) ? parseFloat(this.getProp('popup' + g)) + 'rem' : this.getProp('popup' + g)
        }

        this.popup.style.setProperty('--width', geometry.Width)
        this.popup.style.setProperty('--height', geometry.Height)

        if (geometry.Left !== 'auto') {
            this.popup.style.setProperty('--left', geometry.Left)
            this.popup.classList.add('x-positionned')
        }

        if (geometry.Top !== 'auto') {
            this.popup.style.setProperty('--top', geometry.Top)
            this.popup.classList.add('y-positionned')
        }

        this.toggle = this.container.appendChild(html`<div class="toggle"></div>`)

        if (this.getProp('doubleTap')) {
            doubletab(this.toggle, ()=>{
                this.setValue(1, {sync:true, send:true})
            })
        } else {
            this.toggle.addEventListener('fast-click',(e)=>{
                if (e.capturedByEditor === true) return
                e.detail.preventOriginalEvent = true
                this.setValue(1, {sync:true, send:true})
            })
        }

        var closer = DOM.get(this.popup, '.closer')[0]
        this.popup.addEventListener('fast-click',(e)=>{
            if ((e.target === this.popup || e.target === closer) && this.value == 1) {
                e.detail.preventOriginalEvent = true
                this.setValue(0, {sync:true, send:true})
            }
        })

        this.escapeKeyHandler = ((e)=>{
            if (e.keyCode==27) this.setValue(0, {sync:true, send:true})
        }).bind(this)

        this.value = 0
        this.init = false
        this.labelChange = true


        this.popupContent.classList.add('layout-' + this.getProp('layout'))
        this.popupContent.style.setProperty('--widget-padding', this.getProp('padding') != 'auto' ? parseFloat(this.getProp('padding')) + 'rem' : '')

        this.label = html`<label></label>`
        this.updateLabel()

        this.childrenType = 'widget'

    }


    isVisible() {

        return this.init && this.value && super.isVisible()

    }

    setValue(v, options={}) {

        if (this.init === undefined) return

        this.value = v ? 1 : 0

        if (!this.init && this.value) {
            this.popupContent.appendChild(this.widget)
            this.init = true
        }

        if (this.value && this.labelChange) {
            this.updatePopupLabel()
        }

        this.popup.classList.toggle('show', this.value)
        this.container.classList.toggle('on', this.value)

        this.bindEscKey(this.value)

        if (this.init) this.fixParents()

        this.setVisibility()
        if (this.value) {
            resize.check(this.widget, true)
        }


        if (options.send) this.sendValue()
        if (options.sync) this.changed(options)


    }

    fixParents() {

        var parent = this.parent

        while (parent && parent.props && !parent.getProp('type').match(/modal|tab|root/)) {

            parent.modalBreakout += (this.value ? 1 : -1)
            if (parent.modalBreakout > 0) parent.container.classList.add('modal-breakout')
            else if (parent.modalBreakout === 0) parent.container.classList.remove('modal-breakout')

            parent = parent.parent
        }


        this.modalBreakout += (this.value ? 1 : -1)
        if (this.modalBreakout > 0) this.container.classList.add('modal-breakout')
        else if (this.modalBreakout === 0) this.container.classList.remove('modal-breakout')


    }

    bindEscKey(set) {

        if (set) {
            document.addEventListener('keydown', this.escapeKeyHandler)
        } else {
            document.removeEventListener('keydown', this.escapeKeyHandler)
        }

    }

    onRemove() {
        this.bindEscKey(false)
        this.setValue(0)
        super.onRemove()
    }

    updateLabel() {

        if (this.getProp('label') === false) {

            if (this.container.contains(this.label)) this.container.removeChild(this.label)

        } else {
            this.label.innerHTML = this.getProp('label') == 'auto'?
                    this.getProp('id'):
                    iconify(String(this.getProp('label')).replace(/</g, '&lt;'))

            if (!this.container.contains(this.label)) this.container.appendChild(this.label)
        }

    }

    updatePopupLabel() {

        if (!this.popup) return

        var label = this.getProp('popupLabel') ? iconify(this.getProp('popupLabel')) : this.label.innerHTML
        DOM.get(this.popup, '.popup-title .popup-label')[0].innerHTML = label
        this.labelChange = false

    }

    onPropChanged(propName, options, oldPropValue) {

        if (super.onPropChanged(...arguments)) return true

        switch (propName) {

            case 'label':
                this.updateLabel()
            case 'popupLabel':
                if (this.value) {
                    this.updatePopupLabel()
                } else {
                    this.labelChange = true
                }

                return

        }

    }


    setCssVariables() {

        super.setCssVariables()

        if (!this.popupContent) return

        this.popupContent.style.setProperty('--widget-padding', this.getProp('padding') !== 'auto' ? parseFloat(this.getProp('padding')) + 'rem' : '')

    }

}

Modal.dynamicProps = Modal.prototype.constructor.dynamicProps.concat(
    'label',
    'popupLabel'
)

module.exports = Modal
