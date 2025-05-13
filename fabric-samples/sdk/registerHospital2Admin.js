'use strict'

const FabricCAServices = require('fabric-ca-client')
const { Wallets } = require('fabric-network')
const fs = require('fs')
const path = require('path')

async function main() {
  try {
    // load the network configuration
    // const ccpPath = path.resolve(__dirname, '..', 'test-network', 'organizations', 'peerOrganizations', 'org2.example.com', 'connection-org2.json')
    const ccpPath = path.resolve(__dirname, '..', 'test-network', 'organizations', 'peerOrganizations', 'org2.example.com', 'connection-org2.json')
    console.log(ccpPath)
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'))
    console.log(ccp)
    // Create a new CA client for interacting with the CA.
    const caInfo = ccp.certificateAuthorities['ca.org2.example.com']
    console.log(caInfo)
    const caTLSCACerts = caInfo.tlsCACerts.pem
    const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName)

    // Create a new file system based wallet for managing identities.
    const walletPath = path.join(process.cwd(), 'wallet_Org2')
    const wallet = await Wallets.newFileSystemWallet(walletPath)
    console.log(`Wallet path: ${walletPath}`)

    // Check to see if we've already enrolled the admin2 user.
    const identity = await wallet.get('admin2')
    if (identity) {
      console.log('An identity for the admin2 user "admin2" already exists in the wallet')
      return
    }


    // Enroll the admin2 user, and import the new identity into the wallet.
    const enrollment = await ca.enroll({ enrollmentID: 'admin', enrollmentSecret: 'adminpw' })
    console.log("eneolled")
    const x509Identity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes()
      },
      mspId: 'Org2MSP',
      type: 'X.509'
    }
    await wallet.put('admin2', x509Identity)
    console.log('Successfully enrolled admin2 user "admin2" and imported it into the wallet')
  } catch (error) {
    console.error(`Failed to enroll admin2 user "admin2": ${error}`)
    process.exit(1)
  }
}

main()
