var fs = require('fs')

module.exports = {
    's': {alias: 'send', type: 'array', describe: 'default targets for all widgets (ip: port / domain: port / midi: port_name pairs)',
        check: (s)=>{
            return s.some(item=>!item.match(/^[^:]*:[0-9]{4,5}$/) && !item.match(/^midi:.*$/)) ?
                'Targets must be ip: port or domain: port pairs (udp / tcp port must be >= 1024) or midi: port_name pairs' : true
        }
    },
    'l': {alias: 'load', type: 'string', file: {name: 'OSC Session (.json)', extensions: ['json', 'js']}, describe: 'session file to load',
        check: (arg)=>{
            return fs.lstatSync(arg) ? true : 'Session file not found: ' + arg
        }
    },
    'state': {type: 'string', file: {name: 'OSC State (.state)', extensions: ['state']}, describe: 'state file to load',
        check: (arg)=>{
            return fs.lstatSync(arg) ? true : 'State file not found: ' + arg
        }
    },
    'c': {alias: 'custom-module', type: 'array', file: {name: 'OSC Custom module (.js)', extensions: ['js']}, describe: 'custom module file to load (custom options can be passed after the filename)',
        check: (arg)=>{
            return fs.lstatSync(arg[0]) ? true : 'Custom module file not found: ' + arg
        },
    },
    'p': {alias: 'port', type: 'number', describe: 'http port of the server (default to 8080)',
        check: (p)=>{
            return (!isNaN(p) && p > 1023 && parseInt(p)===p) ?
                true : 'Port must be an integer >= 1024'
        }
    },
    'o': {alias: 'osc-port', type: 'number', describe: 'osc input port (default to --port)',
        check: (o)=>{
            return (!isNaN(o) && o > 1023 && parseInt(o)===o) ?
                true : 'Port must be an integer >= 1024'
        }
    },
    'tcp-port': {type: 'number', describe: 'tcp server input port',
        check: (t, argv)=>{
            var h = argv['port']
            if (t === h) return 'Tcp input port must different from --port'
            return (!isNaN(t) && t > 1023 && parseInt(t)===t) ?
                true : 'Port must be an integer >= 1024'
        }
    },
    'tcp-targets': {type: 'array', describe: 'tcp servers to connect to (ip: port pairs), does not susbtitute for --send',
        check: (s, argv)=>{
            if (!argv['tcp-port']) return '--tcp-port must be set'
            return s.some(item=>!item.match('^[^: \s\"\']*: [0-9]{4, 5}[\s\"\']*$')) ?
                'Targets must be ip: port pairs & port must be >= 1024' : true
        }
    },
    'm': {alias: 'midi', type: 'array', describe: 'midi router settings'},
    'd': {alias: 'debug', type: 'boolean', describe: 'log received osc messages in the console'},
    'n': {alias: 'no-gui', type: 'boolean', describe: 'disable default gui'},
    't': {alias: 'theme', type: 'array', describe: 'theme name or path (mutliple values allowed)'},
    'client-options': {type: 'array', describe: 'client options (opt=value pairs)',
        check: (o)=>{
            return o.some(item=>!item.match(/^[^=]*=[^=]*$/)) ?
                'Options must be key=value pairs' : true
        }
    },
    'disable-vsync': {type: 'boolean', describe: 'disable gui\'s vertical synchronization', restart: true},
    'force-gpu': {type: 'boolean', describe: 'ignore chrome\'s gpu blacklist', restart: true},
    'read-only': {type: 'boolean', describe: 'disable session editing and session history changes'},
    'remote-saving': {type: 'string', describe: 'disable remote session saving for hosts that don\'t match the regular expresion',
        check: (r, argv)=>{
            var msg = true
            try {
                RegExp(r)
            } catch (e) {
                msg = e
            }
            return msg
        }
    },
    'remote-root': {type: 'string', describe: 'set remote file browsing root folder', file: {folder: true}},
    'instance-name': {type: 'string', describe: 'used to differenciate multiple instances in a zeroconf network'},
    'fullscreen': {type: 'boolean', describe: 'launch in fullscreen mode (only affects the default client gui)'},

    // cli only
    'disable-gpu': {type: 'boolean', describe: 'disable hardware acceleration', launcher: false},
    'inspect': {type: 'boolean', describe: 'enable node/electron inspector', launcher: false},
    'cache-dir': {type: 'string', describe: 'override default cache directory', launcher: false},
    'config-file': {type: 'string', describe: 'override default config file (defaults to cache-dir/config.json)', launcher: false}
}
