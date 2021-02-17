## Basic address routing

```js
module.exports = {

    oscInFilter:function(data){

        var {address, args, host, port} = data

        if (address === '/some_address') {
            address = '/fader_1'
        }

        return {address, args, host, port}

    },

    oscOutFilter:function(data){

        var {address, args, host, port, clientId} = data

        if (address === '/fader_1') {
            address = '/some_address'
        }

        return {address, args, host, port}
    }

}
```

## Value conversion

```js
module.exports = {

    oscInFilter:function(data){

        var {address, args, host, port} = data

        if (address === '/some_address') {

            args[0].value = args[0].value * 10

        }

        return {address, args, host, port}

    },

    oscOutFilter:function(data){

        var {address, args, host, port, clientId} = data

        if (address === '/some_address') {

            args[0].value = args[0].value / 10

        }

        return {address, args, host, port}
    }

}
```

## Arguments split / merge

```js

var xyValue = [0, 0]

module.exports = {

    oscInFilter:function(data){

        var {address, args, host, port} = data

        // split
        if (address === '/some_xy_address') {
            var arg1 = args[0].value,
                arg2 = args[1].value

            receive('/fader_1', arg1)
            receive('/fader_2', arg2)

            return // bypass original message
        }

        return {address, args, host, port}

    },

    oscOutFilter:function(data){

        var {address, args, host, port, clientId} = data

        // merge
        if (address === '/fader_1') {

            xyValue[0] = args[0].value
            send(host, port, '/some_xy_address', ...xyValue)
            return // bypass original message

        } else if (address === '/fader_2') {

            xyValue[1] = args[1].value
            send(host, port, '/some_xy_address', ...xyValue)
            return // bypass original message

        }

        return {address, args, host, port}
    }

}
```

## Reply

```js

module.exports = {

    oscInFilter:function(data){

        var {address, args, host, port} = data

        if (address === '/knock_knock') {

            send(host, port, '/who_is_there')

            return // bypass original message
        }

        return {address, args, host, port}

    },

}
```

## Simulate user input on a single client

```js

// keep track of connected clients

var clients = []

app.on('open', (data, client)=>{
    if (!clients.includes(client.id)) clients.push(client.id)
})

app.on('close', (data, client)=>{
    if (clients.includes(client.id)) clients.splice(clients.indexOf(client.id))
})

module.exports = {

    oscInFilter:function(data){

        var {address, args, host, port} = data

        if (address === '/some_osc_address') {

            // simulate user input on the first client in the array

            receive('/SET', 'widget_id', 1, {clientId: clients[0]})

            return // bypass original message
        }

        return {address, args, host, port}

    }

}


```

## MIDI routing

```js
var routing = {
    // midi cc vs widget id
    60: 'fader_1',
    61: 'fader_2',
    // etc
}

module.exports = {

    oscInFilter:function(data){
        // Filter incoming osc messages

        var {address, args, host, port} = data

        if (host === 'midi') {

            // MIDI routing !
            if (address === '/control') {

                // assign args to variables
                var [channel, ctrl, value] = args.map(arg=>arg.value)

                // simple conditions
                if (ctrl === 80) receive('/SET', 'widget_id', value / 127)

                // simple routing table (midi cc vs widget id)
                if (routing[ctrl]) receive('/SET', routing[ctrl], value / 127)

                // note: /SET simulates a user interaction and makes the widget send its osc message
                // but it adds some delay (we wait for the UI to respond)
                // AND it may trigger multiple replies if more than one client are connected.
                // Alternatively, we could do this:
                // send('/osc_address', value / 127)
                // receive('/osc_address', value / 127)
                // Or, to send /SET to a single client:
                // receive('/SET', '/osc_address', value / 127, {clientId: ID})


            }

            return // bypass original message

        }


        // return data if you want the message to be processed
        return {address, args, host, port}

    }


}
```


## Read file

```js

var fs = nativeRequire('fs')

module.exports = {

    oscOutFilter:function(data){
        // Filter outgoing osc messages

        var {address, args, host, port} = data

        if (address === '/file') {

            fs.readFile(args[0].value, 'utf8' , (err, data) => {
                if (err) {
                    console.error(err)
                    return
                }
                receive('/html', data)
            })

            return // bypass original message

        }


        // return data if you want the message to be processed
        return {address, args, host, port}

    }


}
```

## Display RTSP Stream

```js
// requires ffmpeg installed on the system
// and rtsp-ffmpeg installed in the custom module's folder (by running npm install rtsp-ffmpeg)
// see https://github.com/agsh/rtsp-ffmpeg#ffmpeg for available options

var rtsp = nativeRequire('rtsp-ffmpeg')

var stream = new rtsp.FFMpeg({
    input: 'rtsp://freja.hiof.no:1935/rtplive/_definst_/hessdalen03.stream',
})

stream.on('data', (data)=>{

    // send frame to image widget with address set to "/stream"
    receive('/stream', 'data:image/jpeg;base64,' + data.toString('base64'))

})

module.exports = {

    unload: ()=>{
        stream.stop()
    }

}
```
