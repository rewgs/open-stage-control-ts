var StackTrace = require('stacktrace-js'),
    ipc

window.onerror = function(msg,url,row,col, error) {

    if (!ipc) ipc = require('./ipc')

    StackTrace.fromError(error).then((stackframes)=>{

        var stringifiedStack = stackframes.filter((sf)=>{

            return !sf.fileName.match('browser-pack')

        }).map(function(sf) {

            if (sf.functionName.match(/Object\./)) sf.functionName = 'require'

            return `    at ${sf.functionName} (${sf.fileName}:${sf.lineNumber}:${sf.columnNumber})`

        }).join('\n')

        ipc.send('errorLog', `(ERROR, CLIENT) ${msg}\n${stringifiedStack}`)

    }).catch(()=>{

        ipc.send('errorLog', `(ERROR, CLIENT) ${msg}\n    at ${url}:${row}:${col}\n    (no stacktrace available)`)

    })

}
