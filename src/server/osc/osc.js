var osc = require('osc/src/osc.js'),
    transports = require('osc/src/platforms/osc-node.js'),
    utf8 = require('utf8')

osc.UDPPort = transports.UDPPort
osc.TCPSocketPort = transports.TCPSocketPort

module.exports = osc
