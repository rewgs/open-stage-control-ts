var locales = {
    en: require('./en'),
    fr: require('./fr'),
    debug: {
        /* empty */
        keyboard_layout: require('./en').keyboard_layout
    }
}

var lang = locales[LANG] ? LANG : 'en'

module.exports = key=>locales[lang][key] || `!${key}!`
