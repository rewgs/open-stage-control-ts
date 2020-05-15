var cpr = require('cpr'),
    fs = require('fs'),
    path = require('path'),
    files = [
        ['../resources/images/logo_nobadge.png', '../app/assets/favicon.png'],
        ['../resources/images/logo.png', '../app/assets/logo.png'],
        ['../LICENSE', '../app/LICENSE'],
        ['../src/python/', '../app/server/python/'],
        ['../resources/fonts/', '../app/assets/fonts/'],
        ['../src/html/launcher.html', '../app/launcher/index.html'],
    ]

for (var i in files) {
    cpr(...files[i].map(f => path.resolve(__dirname + '/' + f)), {
        overwrite: true
    })
}


var packageJson = require('../package.json'),
    appJson = {},
    copiedProps = [
        "name",
        "productName",
        "description",
        "version",
        "author",
        "repository",
        "homepage",
        "license",
        "yargs",
        "engines"
    ]

for (var k of copiedProps) {
    appJson[k] = packageJson[k]
}

appJson.main = appJson.bin = "index.js"
appJson.scripts = {
  "start": "electron index.js",
  "start-node": "node index.js"
}

appJson.optionalDependencies = {
    electron: packageJson.optionalDependencies.electron
}

fs.writeFileSync(path.resolve(__dirname + '/../app/package.json'), JSON.stringify(appJson, null, '  '))

var clientHtml = fs.readFileSync(path.resolve(__dirname + '/../src/html/client.html'))
    .toString()
    .replace(/\$\{version\}/g, appJson.version)

fs.writeFileSync(path.resolve(__dirname + '/../app/client/index.html'), clientHtml)
