var {mapToScale} = require('../utils'),
    Widget = require('../common/widget'),
    StaticProperties = require('../mixins/static_properties')

module.exports = class Script extends StaticProperties(Widget, {visible: false}) {

    constructor(options) {

        super(options)

        // compile script

    }

    runScript() {

    }


}
