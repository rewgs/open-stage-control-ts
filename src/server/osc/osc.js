// var osc = require('osc/src/osc.js'),
//     transports = require('osc/src/platforms/osc-node.js')

import * as osc from "osc/src/osc";
import * as transports from "osc/src/platforms/osc-node";

osc.UDPPort = transports.UDPPort;
osc.TCPSocketPort = transports.TCPSocketPort;

module.exports = osc;
