const path = require('path');
const fs = require('fs');

const CHANNEL_NAME = 'mychannel';
const CHAINCODE_ID = 'mychaincode';
const TRANSACTION_NAME = 'storeFileHash';

async function main() {
    try {
        // Load the network configuration
        const ccpPath = path.resolve(__dirname, 'connection-org1.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new file system-based wallet for managing identities
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        // Check to see if we've already enrolled the user
        const identity = await wallet.get('appUser');
        if (!identity) {
            console.log('An identity for the user "appUser" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to
        const network = await gateway.getNetwork(CHANNEL_NAME);

        // Get the contract from the network
        const contract = network.getContract(CHAINCODE_ID);

        // Measure the TPS
        const transactionsPerSecond = await measureTPS(contract);

        console.log(`Transactions per second: ${transactionsPerSecond}`);

        // Disconnect from the gateway
        await gateway.disconnect();
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        process.exit(1);
    }
}

async function measureTPS(contract) {
    const userObj = JSON.stringify({
        org: "Org1",
        fileUpload: { name: "file1" },
        doctorId: "doctor1",
        patientId: "patient1"
    });

    const startTime = Date.now();
    const duration = 10000; // 10 seconds
    let txCount = 0;

    while (Date.now() - startTime < duration) {
        try {
            await contract.submitTransaction(TRANSACTION_NAME, userObj, "file1", "hash1", "patient1", "enc_key", "ivector");
            txCount++;
        } catch (error) {
            console.error(`Failed to submit transaction: ${error}`);
        }
    }

    const endTime = Date.now();
    const elapsedSeconds = (endTime - startTime) / 1000;

    return txCount / elapsedSeconds;
}

main();
