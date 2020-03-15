var widgetManager = require('../../managers/widgets'),
    stateManager = require('../../managers/state'),
    {deepCopy} = require('../../utils'),
    {urlParser} = require('../utils'),
    Vm = require('../vm')


class ScriptVm extends Vm {

    constructor() {

        super()

        this.valueOptions = []
        this.sendWidget = []

    }

    getValueOptions() {

        return this.valueOptions[this.valueOptions.length - 1] || {send: true, sync: true}

    }

    setValueOptions(options) {

        if (!options) this.valueOptions.pop()
        else this.valueOptions.push(options)

    }

    setSendWidget(widget) {

        if (!widget) this.sendWidget.pop()
        else this.sendWidget.push(widget)

    }

    getSendWidget() {

        return this.sendWidget[this.sendWidget.length - 1]

    }

    registerGlobals() {

        super.registerGlobals()

        this.sandbox.contentWindow.set = (id, value)=>{

            var options = this.getValueOptions()

            if (id === options.id) options.sync = false // loop stop

            var widgets = widgetManager.getWidgetById(id)

            for (var i = widgets.length - 1; i >= 0; i--) {

                return widgets[i].setValue(value, options)

            }

        }

        this.sandbox.contentWindow.send = (target, address, ...args)=>{

            var options = this.getValueOptions()

            if (!options.send) return

            var overrides = {
                address,
                v: args,
                preArgs: []
            }

            if (target) overrides.target = Array.isArray(target) ? target : [target]

            this.getSendWidget().sendValue(overrides)

        }

        this.sandbox.contentWindow.get = (id)=>{

            var widgets = widgetManager.getWidgetById(id)

            for (var i = widgets.length - 1; i >= 0; i--) {

                if (widgets[i].getValue) {

                    var v = widgets[i].getValue()
                    if (v !== undefined) return v

                }

            }

        }

        this.sandbox.contentWindow.getProp = (id, prop)=>{

            var widgets = widgetManager.getWidgetById(id)

            for (var i = widgets.length - 1; i >= 0; i--) {

                var v = widgets[i].getProp(prop)
                if (v !== undefined) return v

            }

        }

        this.sandbox.contentWindow.httpGet = (url, callback)=>{

            var parser = urlParser(url),
                err = (e)=>{console.error(e)}

            if (!parser.isLocal()) return err('httpGet error (' + url + '): non-local url')

            var xhr = new XMLHttpRequest()
            xhr.open('GET', url, true)
            xhr.onload = (e)=>{
                if (xhr.readyState === 4 && xhr.status === 200 && callback) {
                    callback(xhr.responseText)
                }
            }
            xhr.onerror = (e)=>err('httpGet error (' + url + '): ' + xhr.statusText)
            xhr.send(null)

        }

        this.sandbox.contentWindow.stateGet = (filter)=>{

            if (filter) {

                var filter = Array.isArray(filter) ? filter : [filter],
                containers = this.filter.map(x=>widgetManager.getWidgetById(x)).reduce((a,b)=>a.concat(b), [])
                if (!containers.length) return
                filter = (widget)=>{
                    return containers.some(x=>x.contains(widget) || x === widget)
                }
            }

            return deepCopy(stateManager.get(filter))

        }

        this.sandbox.contentWindow.stateSet = (state)=>{

            var options = this.getValueOptions()
            stateManager.set(state, options.send)

        }


        this.sandbox.contentWindow.storage = {

            setItem: (k, v)=>localStorage.setItem(k, JSON.stringify(v)),
            getItem: (k)=>JSON.parse(localStorage.getItem(k)),
            removeItem: (k)=>localStorage.removeItem(k),
            clear: ()=>localStorage.clear()

        }


        for (var imports of ['set', 'get', 'getProp', 'send', 'httpGet', 'stateGet', 'stateSet', 'storage']) {
            this.sanitize(this.sandbox.contentWindow[imports])
        }

    }

}

module.exports = ScriptVm
