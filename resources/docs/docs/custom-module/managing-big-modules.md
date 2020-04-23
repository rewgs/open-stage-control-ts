Custom modules don't let you use node's `require` function at runtime, but you can manage your sources in multiple files and bundle them into a single file before loading it in OSC.

The common pattern for this is using the [browserify](http://browserify.org/) library:

**1**. define some variable in `number.js`

```javascript
module.exports = 42
```

**2**. retrieve it in your main module file (`main.js`):

```javascript
var num = require('./number.js')

module.exports = {
    init: function(){
        console.log(num) // 42
    },
    oscInFilter: function(data){
        // etc
    }
}
```


**3**. bundle your sources into `custom-module.js`:

`browserify main.js -o custom-module.js --standalone module.exports`
