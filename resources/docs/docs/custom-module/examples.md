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
