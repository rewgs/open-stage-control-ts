require('./zoom')
require('./lobby').create()
// require('./sidepanel')
require('../events/click')
require('./ios')
require('./notifications')
require('./ui-workspace')
// require('./ui-sidepanel')

var UiModal = require('./ui-modal')

module.exports = {

    uiModal: new UiModal({selector: 'osc-modal-container'})

}
