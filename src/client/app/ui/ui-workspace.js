var UiWidget = require('./ui-widget'),
    setScrollbarColor = require('./scrollbar-color')

class UiWorksapce extends UiWidget {

    constructor(options) {

        super(options)

        setScrollbarColor(this.container)

    }

}

module.exports = new UiWorksapce({selector: 'osc-workspace'})
