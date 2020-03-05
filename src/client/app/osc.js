var widgetManager = require('./managers/widgets'),
    EventEmitter = require('./events/event-emitter'),
    ipc = require('./ipc/'),
    {deepEqual} = require('./utils')

var Osc = class Osc extends EventEmitter {

    constructor() {

        super()

        this.syncOnly = false
        this.remoteControl = {}
        this.serverTargets = []

    }

    send(data) {

        if (this.syncOnly) {

            this.sync(data)

        } else {

            ipc.send('sendOsc', data)

        }

    }

    sync(data) {

        ipc.send('syncOsc', data)

    }

    receive(data){

        if (this.remoteControl.exists(data.address)) this.remoteControl.exec(data.address, data.args)

        var [widgets, restArgs] = widgetManager.getWidgetByAddressAndArgs(data.address, data.args)

        for (let i in widgets) {

            let widgetTarget = widgets[i].getProp('target'),
                match = true

            if (data._rawTarget) {
                // if the message target is provided (when message comes from another client connected to the same server)
                // then we only update the widgets that have the exact same target
                match = deepEqual(widgetTarget, data._rawTarget)
            } else if (data.host === 'midi') {
                // if the message comes from a midi port, only update widgets that send to that port
                let widgetArrayTarget = Array.isArray(widgetTarget) ? widgetTarget : [widgetTarget],
                    strTarget = data.host + ':' + data.port

                match = widgetArrayTarget.includes(strTarget) ||
                        (!widgetArrayTarget.includes(null) && this.serverTargets.includes(strTarget))

            }

            if (match) {
                widgets[i].setValue(restArgs,{send:false,sync:true,fromExternal:!data.target})
            }

        }

        this.trigger(data.address, data.args)

    }

}


var osc = new Osc()

module.exports = osc

osc.remoteControl = require('./remote-control')
