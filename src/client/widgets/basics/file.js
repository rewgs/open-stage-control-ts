var Widget = require('../common/widget'),
    html = require('nanohtml'),
    uiFilebrowser = require('../../ui/ui-filebrowser')

module.exports = class File extends Widget {

    static description() {

        return 'File/Folder selector (server-side).'

    }

    static defaults() {

        return super.defaults({

            _input:'input',

            align: {type: 'string', value: 'center', choices: ['center', 'left', 'right'], help: 'Set to `left` or `right` to change text alignment (otherwise center)'},
            directory: {type: 'string', value: 'auto', help: 'Default browsing directory'},
            extension: {type: 'string', value: '*', help: 'Only display files with this extension'},
            hidePath: {type: 'boolean', value: false, help: 'Set to `true` to only display the filename (the whole path will still be used as value)'},
            allowDir:  {type: 'boolean', value: false, help: 'Allow selecting a folder (by pressing "open" when no file is selected)'}

        })

    }

    constructor(options) {

        super({...options, html: html`
            <inner>
                <div class="text"></div>
                <div class="icon"></div>
            </inner>
        `})

        if (this.getProp('align') === 'left') this.widget.classList.add('left')
        if (this.getProp('align') === 'right') this.widget.classList.add('right')

        this.text = DOM.get(this.widget, '.text')[0]
        this.widget.addEventListener('fast-click', (e)=>{

            if (e.capturedByEditor === true) return

            uiFilebrowser({
                extension: this.getProp('extension').replace(/^\.?(.*)$/, '$1'),
                directory: this.getProp('directory') === 'auto' ? undefined : this.getProp('directory'),
                loadDir: this.getProp('allowDir')
            }, (path)=>{

                this.setValue(path.join(path[0][0] === '/' ? '/' : '\\'), {
                    sync: true,
                    send: true
                })

            })
        })

    }


    setValue(v, options={}) {

        this.value = v

        var sep = v[0] === '/' ? '/' : '\\'
        if (this.getProp('hidePath')) {
            if (v[v.length - 1] === sep) {
                this.text.textContent = v.substr(0, v.length - 1).split(sep).pop() + sep
            } else {
                this.text.textContent = v.split(sep).pop()
            }
        } else {
            this.text.textContent = v
        }

        if (options.send) this.sendValue()
        if (options.sync) this.changed(options)

    }




}
