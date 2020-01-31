require('./client-shim')

// Here we go

var widgets = require('../src/client/app/widgets'),
    baseClass = require('../src/client/app/widgets/common/widget'),
    base = baseClass.defaults(),
    doc = []


doc.push(`

    # Widget reference

    <div class="accordion" data-category="generic" markdown="1">

    <h4 class="accordionlink" id="generic_properties"><a class="headerlink" href="#generic_properties">Generic properties</a></h3>
    <div class="accordion-description">Properties shared by all widgets</div>

    | property | type |default | description |
    | --- | --- | --- | --- |`
)

for (var propName in base) {

    var prop = base[propName],
        permalink = propName

    if (propName[0] === '_' && propName !== '_props') {
        doc.push(`
            | <h4 class="thead2" id="${prop}">${prop}<a class="headerlink" href="#${prop}" title="Permanent link">#</a></h4> ||||`
        )
    }

    if (propName === '_props' || propName[0] === '_') continue

    var help = Array.isArray(prop.help) ? prop.help.join('<br/><br/>').replace(/<br\/>-/g, '-') : prop.help || '',
        dynamic = baseClass.dynamicProps.includes(propName) ? '<i class="dynamic-prop-icon" title="dynamic"></i>' : ''


    doc.push(`
        | <h4 id="${permalink}">${propName}${dynamic}<a class="headerlink" href="#${permalink}" title="Permanent link">#</a></h4> | \`${prop.type.replace(/\|/g,'\`&vert;<br/>\`')}\` | <code>${(JSON.stringify(prop.value, null, '&nbsp;') || '').replace(/\n/g,'<br/>')}</code> | ${help} |`
    )

}

doc.push('</div>')


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


            <div class="accordion" data-category="${k}" markdown="1">

            <h4 class="accordionlink" id="${type}"><a class="headerlink" href="#${type}">${type}</a></h3>
            <div class="accordion-description">${description}</div>

            | property | type |default | description |
            | --- | --- | --- | --- |`
        )

        for (var propName in defaults) {

            var prop = defaults[propName],
                permalink = type + '_' + propName

            if (propName[0] === '_' && propName !== '_props') {
                if (separator) doc.pop()
                doc.push(`
                    | <h4 class="thead2" id="${type + '_' + prop}">${prop}<a class="headerlink" href="#${type + '_' + prop}" title="Permanent link">#</a></h4> ||||`
                )
                separator = true
            }

            if (propName === '_props' || propName[0] === '_' || JSON.stringify(prop) == JSON.stringify(base[propName])) continue

            var help = Array.isArray(prop.help) ? prop.help.join('<br/><br/>').replace(/<br\/>-/g, '-') : prop.help || '',
                dynamic = widgets.widgets[type].dynamicProps.includes(propName) ? '<i class="dynamic-prop-icon" title="dynamic"></i>' : ''

            doc.push(`
                | <h4 id="${permalink}">${propName}${dynamic}<a class="headerlink" href="#${permalink}" title="Permanent link">#</a></h4> | \`${prop.type.replace(/\|/g,'\`&vert;<br/>\`')}\` | <code>${(JSON.stringify(prop.value, null, '&nbsp;') || '').replace(/\n/g,'<br/>').replace('{','\\{')}</code> | ${help} |`
            )
            separator = false
        }

        if (separator) doc.pop()

        doc.push('</div>\n\n')

    }
}

doc.push(`\n\n
    <script>
    document.querySelectorAll('.thead2').forEach(function(item){
        item.classList.remove('thead2')
        item.closest('tr').classList.add('thead2')
    })
    document.querySelectorAll('.accordionlink').forEach(function(item){
        item.addEventListener('click', function(e){
            e.preventDefault()
            var node = item.parentNode
            node.classList.toggle('show')
            if (node.classList.contains('show')){
                history.replaceState(null, null, '#' + item.getAttribute('id'));
            } else {
                history.replaceState(null, null, ' ');
            }
        })
    })
    if (window.location.hash) {
        document.querySelectorAll('[id='+window.location.hash.split("#")[1]+']').forEach(function(item){
            item.click()
        })
    }
    </script>
`)

console.log(doc.join('').replace(/^ +/gm,''))
