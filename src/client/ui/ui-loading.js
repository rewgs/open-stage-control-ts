var html = require('nanohtml'),
    UiModal = require('./ui-modal')

module.exports = function uiLoading(title) {
    
    return new UiModal({
        title: title,
        content: html`<p><div class="spinner"></div></p>`,
        closable: false
    })

}
