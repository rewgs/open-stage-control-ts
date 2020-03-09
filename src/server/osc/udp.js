var osc = require('./osc'),
    settings = require('../settings'),
    zeroconf = require('../zeroconf'),
    oscInPort = settings.read('oscInPort') || settings.read('httpPort')

var oscUDPServer = new osc.UDPPort({
    localAddress: '0.0.0.0',
    localPort: oscInPort,
    metadata: true,
    broadcast: true
})

oscUDPServer.on('error', function(e) {
    if (e.code === 'EADDRINUSE') {
        console.error(`(ERROR, UDP) could not open port ${oscInPort} (already in use) `)
    } else {
        console.error(`(ERROR, UDP) ${e.message}`)
    }
})

zeroconf.publish({
    name: settings.read('appName') + (settings.read('instanceName') ? ' (' + settings.read('instanceName') + ')' : ''),
    protocol: 'udp',
    type: 'osc',
    port: oscInPort
})

module.exports = oscUDPServer
