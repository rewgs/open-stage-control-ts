require('./client-shim')

// Here we go
var widgets = require('../src/client/widgets'),
    baseClass = require('../src/client/widgets/common/widget'),
    base = baseClass.defaults(),
    doc = ['<!-- This file is generated automatically from the widget class declarations. See scripts/build-widget-reference.js -->']


doc.push(`

## Common

??? api "<div id="generic_properties">Generic properties<a class="headerlink" href="#generic_properties" title="Permanent link">#</a></div>"
    Properties shared by all widgets

    `
)

for (var propName in base) {

    var prop = base[propName],
        permalink = propName

    if (propName[0] === '_' && propName !== '_props') {
        doc.push(`\n

    === "${prop}"

        | property | type |default | description |
        | --- | --- | --- | --- |`
        )
    }

    if (propName === '_props' || propName[0] === '_') continue

    var help = Array.isArray(prop.help) ? prop.help.join('<br/><br/>').replace(/<br\/>-/g, '-') : prop.help || '',
        dynamic = baseClass.dynamicProps.includes(propName) ? '<sup><i class="fas fa-bolt" title="dynamic"></i></sup>' : ''

    if (prop.choices) {
        if (help) help += '<br/><br/>'
        help += 'Choices: ' + prop.choices.map(x=>'`' + x + '`').join(', ')
    }

    doc.push(`
        | <h6 id="${permalink}">${propName}${dynamic}<a class="headerlink" href="#${permalink}" title="Permanent link">#</a></h6> | \`${prop.type.replace(/\|/g,'\`&vert;<br/>\`')}\` | <code>${(JSON.stringify(prop.value, null, '&nbsp;') || '').replace(/\n/g,'<br/>').replace('{','\\{')}</code> | ${help} |`
    )

}


for (var k in widgets.categories) {
    var category = widgets.categories[k]
    if (k == 'Containers') {
        category.push('root')
        category.push('tab')
    }

    doc.push(`
## ${k}`
    )

    for (var kk in category) {
        var type = category[kk],
            defaults = widgets.widgets[type].defaults(),
            description = widgets.widgets[type].description(),
            separator = false


        doc.push(`

??? api "<div id="${type}">${type}<a class="headerlink" href="#${type}" title="Permanent link">#</a></div>"
    ${description}`

        )

        for (var propName in defaults) {

            var prop = defaults[propName],
                permalink = type + '_' + propName

            if (propName[0] === '_' && propName !== '_props') {
                if (separator) doc.pop()
                if (doc[doc.length -1].trim()[0] === '=') doc.pop()
                doc.push(`\n
    === "${prop}"

        | property | type |default | description |
        | --- | --- | --- | --- |`
                )
                separator = true
            }

            if (propName === '_props' || propName[0] === '_' || JSON.stringify(prop) == JSON.stringify(base[propName])) continue

            var help = Array.isArray(prop.help) ? prop.help.join('<br/><br/>').replace(/<br\/>-/g, '-') : prop.help || '',
                dynamic = widgets.widgets[type].dynamicProps.includes(propName) ? '<sup><i class="fas fa-bolt" title="dynamic"></i></sup>' : ''

            if (prop.choices) {
                if (help) help += '<br/><br/>'
                help += 'Choices: ' + prop.choices.map(x=>'`' + x + '`').join(', ')
            }

            doc.push(`
        | <h6 id="${permalink}">${propName}${dynamic}<a class="headerlink" href="#${permalink}" title="Permanent link">#</a></h6> | \`${prop.type.replace(/\|/g,'\`&vert;<br/>\`')}\` | <code>${(JSON.stringify(prop.value, null, '&nbsp;') || '').replace(/\n/g,'<br/>').replace('{','\\{')}</code> | ${help} |`
            )
            separator = false
        }

        if (separator) doc.pop()

    }
}

console.log(doc.join(''))

process.exit(0) // avoid setTimeout errors in required modules
