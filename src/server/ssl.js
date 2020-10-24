var settings = require('./settings'),
    forge = require('node-forge'),
    pki = forge.pki,
    certificate = settings.read('ssl-certificate')

forge.options.usePureJavaScript = true

// Generate a random Serial number for the certificate
// matth-c3 @ https://github.com/digitalbazaar/forge/issues/673#issuecomment-500900852
function randomSerialNumber() {
    var hexString = forge.util.bytesToHex(forge.random.getBytesSync(16))

    var mostSiginficativeHexAsInt = parseInt(hexString[0], 16)
    if (mostSiginficativeHexAsInt < 8) {
      return hexString
    }

    mostSiginficativeHexAsInt -= 8
    return mostSiginficativeHexAsInt.toString() + hexString.substring(1)
}

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

    if (new Date() > new Date(cert.validity.notAfter) || cert.serialNumber === '00') {
        console.log('(INFO) Self-signed ssl certificate in cache has expired or is invalid')
        createCertificate()
    } else {
        console.log('(INFO) Using self-signed ssl certificate in cache')
    }


}
