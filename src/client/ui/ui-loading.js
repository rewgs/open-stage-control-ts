var html = require('nanohtml'),
    UiModal = require('./ui-modal'),
    notifications = require('./notifications'),
    loading = null, timeout = null

module.exports = function uiLoading(title) {

    if (title === false && loading) {
        clearTimeout(timeout)
        timeout = setTimeout(()=>{
            console.log('stop')
            notifications.remove(loading)
            loading = null
        }, 500)
    } else if (title !== false) {
        notifications.add({
            id: 'LOADING',
            icon: 'spinner fa-spin',
            message: title
        })
        loading = notifications.toasts[notifications.toasts.length - 1]
    }

}
