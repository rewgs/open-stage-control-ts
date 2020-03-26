var semver = require('semver'),
    UiModal = require('../../ui/ui-modal'),
    locales = require('../../locales')

module.exports = class Session {

    constructor(data) {

        if (data === null) {

            data = {
                session: {type: 'root'}
            }


        } else {

            var version = data.version || '0.0.0',
                warning = false

            for (var converter of converters) {

                if (semver.lte(version, converter.version)) {

                    if (converter.global) data = converter.global(data)
                    if (converter.widget) this.applyConvert(data.session, converter.widget)

                    if (converter.warning) warning = true

                }

            }


            if (warning) {

                new UiModal({title: locales('session_oldversion_title'), content: locales('session_oldversion'), icon: 'exclamation-triangle', closable:true})


            }

        }

        data.version = PACKAGE.version
        data.type = PACKAGE.productName + ' ' + 'session'

        this.data = data

    }

    applyConvert(data, convert) {

        convert(data)

        if (data.widgets) {
            for (let c of data.widgets) {
                this.applyConvert(c, convert)
            }
        }

        if (data.tabs) {
            for (let c of data.tabs) {
                this.applyConvert(c, convert)
            }
        }

    }

    getRoot() {

        return this.data.session

    }

    toJSON() {

        return JSON.stringify(this.data, null, '  ')

    }

}

var converters = [
    {
        version: '0.49.12',
        warning: true,
        global: (data)=>{
            return {
                session: data
            }
        },
        widget: (data)=>{
            if (data.precision === 0) data.typeTags = 'i'

            console.log(data.type)
            switch (data.type) {

                case 'toggle':
                    data.type = 'button'
                    data.mode = 'toggle'
                    break

                case 'push':
                    data.type = 'button'
                    data.mode = data.norelease ? 'tap' : 'push'
                    break

                case 'meter':
                    data.type = 'fader'
                    data.design = 'compact'
                    data.interaction = false
                    break

                case 'strip':
                    data.type = 'panel'
                    data.layout = data.horizontal ? 'horizontal' : 'vertical'
                    break

                case 'eq':
                    data.filter = data.value
                    data.value = ''
                    break

                case 'keys':
                    data.type = 'script'
                    data.event = 'keyboard'
                    data.keyRepeat = data.repeat
                    data.keyBinding = data.binding
                    data.keyType = data.keyDown && data.keyUp ? 'both' : data.keyUp ? 'keyup' : 'keydown'
                    data.script = `
                        // converted from keys widget data
                        if (type === 'keyup') {
                            ${String(data.keyUp).replace(/^JS{{(.*)}}$/, '$1')}
                        } else if (type === 'keydown') {
                            ${String(data.keyDown).replace(/^JS{{(.*)}}$/, '$1')}
                        }
                    `
                    break

            }

        }
    }
]
