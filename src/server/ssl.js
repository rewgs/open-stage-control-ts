var settings = require('./settings'),
    forge = require('node-forge'),
    pki = forge.pki,
    certificate = settings.read('ssl-certificate')

forge.options.usePureJavaScript = true

function createCertificate() {

    console.log('(INFO) Creating self signed ssl certificate...')

    var keys = pki.rsa.generateKeyPair(2048),
        cert = pki.createCertificate()

    cert.publicKey = keys.publicKey
    cert.validity.notBefore = new Date()
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1)

    var attrs = [
        {name:'commonName',value: settings.infos.name},
        {name:'subjectAltName',value:[]}
    ]

    cert.setSubject(attrs)
    cert.setIssuer(attrs)
    cert.sign(keys.privateKey)

    settings.write('ssl-certificate', {
        key:  pki.privateKeyToPem(keys.privateKey),
        cert: pki.certificateToPem(cert)
    })

}

if (!certificate) {

    createCertificate()

} else {

    var cert = pki.certificateFromPem(certificate.cert)

    if (new Date() > new Date(cert.validity.notAfter)) {
        console.log('(INFO) Self-signed ssl certificate has expired')
        createCertificate()
    } else {
        console.log('(INFO) Using self-signed ssl certificate in cache')
    }


}
