'use strict'
const mysql = require('mysql2');
const multer = require('multer');
const { Gateway, Wallets } = require('fabric-network')
const FabricCAServices = require('fabric-ca-client')
const path = require('path');
// const { initialize } = require('@zokrates-js/core');
const { buildCCPHospital, buildWallet, prettyJSONString, registerAndEnrollUser, buildCAClient } = require('./utils.js')
const orgConst = require('./organizationConstant.json')
const fs = require('fs');
const channelName = 'mychannel'
const chaincodeName = 'custom'
const walletPath_org1 = path.join(__dirname, 'wallet_Org1')
const walletPath_org2 = path.join(__dirname, 'wallet_Org2')
const walletPath_org3 = path.join(__dirname, 'wallet_Org3')
const crypto = require('crypto');
const User = require('./user.js');
const bcrypt = require('bcrypt');
const pool = mysql.createPool({
    host: 'main.infili.com',
    user: 'root',
    password: 'red5PRO@action',
    database: 'hospitalInfo',
    port: 3306,
    waitForConnections: true,
    debug: false,
});

// function generateHash(data) {
//     // Convert the data to a string or JSON
//     const serializedData = JSON.stringify(data);
//     // Generate hash using SHA-256
//     const hash = crypto.createHash('sha256').update(serializedData).digest('hex');
//     return hash;
// }


async function registerUser(userObj, walletPath) {
    try {
        console.log(`--------------${walletPath}-----------`)
        const orgDetail = orgConst[userObj.org]
        const ccp = await buildCCPHospital(userObj.org)
        const caClient = await buildCAClient(FabricCAServices, ccp, orgDetail.ca)
        const wallet = await buildWallet(Wallets, walletPath)
        const userInsertResult = await insertUserIntoDatabase(userObj);
        console.log(userObj)

        await registerAndEnrollUser(caClient, wallet, orgDetail.msp, userObj, orgDetail.department)
        return `User: ${userObj.doctorId}, successfully registered. Database Insert Result: ${userInsertResult}`;

    } catch (error) {
        console.error(`\nregisterUser() --> Failed to register user ${userObj.doctorId}: ${error}`)
        return {'error': error}
    }
}
async function insertUserIntoDatabase(userObj) {
    console.log(userObj);
    let connection;
    try {
        connection = await pool.promise().getConnection();

        if (userObj.patientId !== '' && userObj.patientId != undefined) {
            const [foundUser] = await connection.query(
                'SELECT COUNT(*) AS userCount FROM users WHERE username = ?',
                ["patient" + userObj.patientId.toString()]
            );

            if (foundUser[0].userCount > 0) {
                return 'already exists.';
            }

            const [result] = await connection.query(
                'INSERT INTO patientsinfo (id, patientId, org, doctorId, role, username, firstNamePatient, lastNamePatient) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    parseInt(userObj.patientId, 10),
                    parseInt(userObj.patientId, 10),
                    userObj.org,
                    parseInt(userObj.doctorId, 10),
                    userObj.role,
                    userObj.username,
                    userObj.firstNamePatient,
                    userObj.lastNamePatient
                ]
            );

            const hashedPassword = await bcrypt.hash(userObj.password, 10);

            await connection.query(
                "INSERT INTO users (username, password, role, org) VALUES (?, ?, ?, ?)",
                ["patient" + userObj.patientId.toString(), hashedPassword, userObj.role, userObj.org]
            );

            console.log('✅ Query executed successfully');
            return { affectedRows: result.affectedRows };
        } else {
            console.log('⚠️ Attempted to insert a doctor into patientsinfo, operation skipped.');
            return 'Operation skipped for doctor role';
        }
    } catch (error) {
        console.error(`❌ Failed to insert user into database: ${error.message}`);
        return { error: error.message };
    } finally {
        if (connection) connection.release(); 
    }
}



async function connectNetwork(userObj, walletPath) {
    try {
        console.log(userObj)
        const ccp = buildCCPHospital(userObj.org)
        // console.log("============BUILD")
        const wallet = await buildWallet(Wallets, walletPath)
        const gateway = new Gateway()
        // console.log("============BUILD----------1")
        await gateway.connect(ccp, {
            wallet,
            identity: userObj.username,
            discovery: { enabled: true, asLocalhost: false }
        })
        // console.log("============BUILD----------2")

        const network = await gateway.getNetwork(channelName)
        // console.log("============BUILD----------3")

        return network
    } catch (error) {
        console.error(`connectNetwork() --> Failed to connect to the fabric network: ${error}`)
        // throw new Error(`Failed to connect to the fabric network: ${error}`)
        return {'error': error}
    }
}

/**
 * Method to disconnect the connection between sdk and fabric network.
 */
function disconnectNetowrk(userObj) {
    userObj.gateway.disconnect()
}

/**
 * Method to submit transaction to ledger
 */
async function submitTransaction(funcName, obj, path) {
    try {
        const network = await connectNetwork(obj, path)
        const contract = network.getContract(chaincodeName)
        const stringObject = JSON.stringify(obj)
        console.log(`\n submitTransaction()--> ${funcName}`)
        const result = await contract.submitTransaction(funcName, stringObject)
        console.log(`\n submitTransaction()--> Result: committed: ${funcName}`)
        const buf = Buffer.from(result);
        const strBuf = buf.toString('utf-8');
        return strBuf
    } catch (error) {
        // throw new Error(`Failed to submit transaction ${funcName}`)
        return {'error': error}
    }
}

async function submitTransaction1(funcName, obj, fileName, fileHash, patientId, enc_key, ivector, path) {
    try {
        const network = await connectNetwork(obj, path);
        const contract = network.getContract(chaincodeName);

        // Convert the parameters to a JSON string
        const stringObject = JSON.stringify(obj);
        const stringFileHash = JSON.stringify(fileHash);
        const stringFileName = JSON.stringify(fileName);

        console.log(`[=============================] FILENAME: ${stringFileName}`);
        console.log(`\n submitTransaction()--> ${funcName}`);

        // Call the chaincode function with both the object and fileHash parameters
        const result = await contract.submitTransaction(funcName, stringObject, stringFileName, stringFileHash, patientId, enc_key, ivector);

        console.log(`\n submitTransaction()--> Result: committed: ${funcName}`);

        // Convert the result from Buffer to string
        const buf = Buffer.from(result);
        const strBuf = buf.toString('utf-8');

        return strBuf;
    } catch (error) {
        // throw new Error(`Failed to submit transaction ${funcName}`);
        return {'error': error}
    }
}

async function submitTransaction2(funcName, obj, fileName, path) {
    try {
        const network = await connectNetwork(obj, path);
        const contract = network.getContract(chaincodeName);

        // Convert the parameters to a JSON string
        const stringObject = JSON.stringify(obj);
        const stringFileName = JSON.stringify(fileName);
        console.log(`[=============================] FILENAME: ${stringFileName}`);
        console.log(`\n submitTransaction()--> ${funcName}`);

        // Call the chaincode function with both the object and fileHash parameters
        const result = await contract.submitTransaction(funcName, stringObject, stringFileName);

        console.log(`\n submitTransaction()--> Result: committed: ${funcName}`);

        // Convert the result from Buffer to string
        const buf = Buffer.from(result);
        const strBuf = buf.toString('utf-8');

        return strBuf;
    } catch (error) {
        // throw new Error(`Failed to submit transaction ${funcName}`);
        return {'error': error}
    }
}
/**
 * Method to evaluate transaction from ledger
 */
async function evaluateTransaction(funcName, obj) {
    try {
        const network = await connectNetwork(obj)
        const contract = network.getContract(chaincodeName)
        console.log(`\n *********Interacting with the smart contract********** ${contract}`)
        const stringObject = JSON.stringify(obj)
        console.log(`\n Calling Function--> ${funcName}`)
        const result = await contract.evaluateTransaction(funcName, stringObject)
        console.log(`\n [+] Result: Transaction committed: ${funcName}\n`)
        // console.log(result)
        return result
    } catch (error) {
        // throw new Error(`Failed to evaluate transaction ${funcName}`)
        return {'error': error}
    }
}
/**
 * Method to register the doctor to the organization by using registerUser().
 */



async function registerDoctor(doctorObj) {
    try {
        if (doctorObj.org === "Org1" && doctorObj.username === "admin") {
            await registerUser(doctorObj, walletPath_org1)

            try {
                const response = await registerDoctorToLedger(doctorObj, walletPath_org1)
                console.log(response)
                await insertDoctorIntoDatabase(doctorObj);
                return 'Doctor: ' + doctorObj.doctorId + ', successfully registered into database';
            } catch (error) {
                return `Failed to submit transaction ${error}`;
            }

        } else if (doctorObj.org === "Org2" && doctorObj.username === "admin2") {
            await registerUser(doctorObj, walletPath_org2)
            try {
                const response = await registerDoctorToLedger(doctorObj, walletPath_org2)
                console.log(response)
                await insertDoctorIntoDatabase(doctorObj);
                return 'Doctor: ' + doctorObj.doctorId + ', successfully registered into database';
            } catch (error) {
                return `Failed to submit transaction ${error}`;
            }
        }
        else if (doctorObj.org === "Org3" && doctorObj.username === "admin3") {
            await registerUser(doctorObj, walletPath_org3)
            try {
                const response = await registerDoctorToLedger(doctorObj, walletPath_org3)
                console.log(response)
                await insertDoctorIntoDatabase(doctorObj);
                return 'Doctor: ' + doctorObj.doctorId + ', successfully registered into database';
            } catch (error) {
                return `Failed to submit transaction ${error}`;
            }
        }
        else {
            return 'Failed to register doctor.';
        }
    } catch (error) {
        console.error(`\nregisterDoctor() --> Failed to register doctor ${doctorObj.doctorId}: ${error}`)
        // throw new Error(`Failed to register doctor ${doctorObj.doctorId}: ${error}`)
        return {'error': error}
    }
}

async function queryAllRegistrations(adminObj) {

    if (adminObj.org === "Org1" && adminObj.username === "admin") {
        try {
            const response = await readRecordsFromLedger(adminObj, walletPath_org1)
            console.log(response)
            return response
        } catch (error) {
            return `Failed to submit transaction ${error}`;
        }

    } else if (adminObj.org === "Org2" && adminObj.username === "admin2") {
        try {
            const response = await readRecordsFromLedger(adminObj, walletPath_org2)
            console.log(response)
            return response
        } catch (error) {
            return `Failed to submit transaction ${error}`;
        }
    }
    else if (adminObj.org === "Org3" && adminObj.username === "admin3") {
        try {
            const response = await readRecordsFromLedger(adminObj, walletPath_org3)
            console.log(response)
            return response
        } catch (error) {
            return `Failed to submit transaction ${error}`;
        }
    }
}

async function queryAllSpecificDoctorUpdates(adminObj) {

    if (adminObj.org === "Org1" && adminObj.username === "admin") {
        try {
            const response = await readSpecificUpdatesFromLedger(adminObj, walletPath_org1)
            console.log(response)
            return response
        } catch (error) {
            return `Failed to submit transaction ${error}`;
        }

    } else if (adminObj.org === "Org2" && adminObj.username === "admin2") {
        try {
            const response = await readSpecificUpdatesFromLedger(adminObj, walletPath_org2)
            console.log(response)
            return response
        } catch (error) {
            return `Failed to submit transaction ${error}`;
        }
    }
    else if (adminObj.org === "Org3" && adminObj.username === "admin3") {
        try {
            const response = await readSpecificUpdatesFromLedger(adminObj, walletPath_org3)
            console.log(response)
            return response
        } catch (error) {
            return `Failed to submit transaction ${error}`;
        }
    }
}

async function queryAllUploads(adminObj) {

    if (adminObj.org === "Org1" && adminObj.username === "admin") {
        try {
            const response = await readUploadedRecordsFromLedger(adminObj, walletPath_org1)
            console.log(response)
            return response
        } catch (error) {
            return `Failed to submit transaction ${error}`;
        }

    } else if (adminObj.org === "Org2" && adminObj.username === "admin2") {
        try {
            const response = await readUploadedRecordsFromLedger(adminObj, walletPath_org2)
            console.log(response)
            return response
        } catch (error) {
            return `Failed to submit transaction ${error}`;
        }
    }
    else if (adminObj.org === "Org3" && adminObj.username === "admin3") {
        try {
            const response = await readUploadedRecordsFromLedger(adminObj, walletPath_org3)
            console.log(response)
            return response
        } catch (error) {
            return `Failed to submit transaction ${error}`;
        }
    }
}

async function queryAllDownloads(adminObj) {

    if (adminObj.org === "Org1" && adminObj.username === "admin") {
        try {
            const response = await readDownloadedRecordsFromLedger(adminObj, walletPath_org1)
            console.log(response)
            return response
        } catch (error) {
            return `Failed to submit transaction ${error}`;
        }

    } else if (adminObj.org === "Org2" && adminObj.username === "admin2") {
        try {
            const response = await readDownloadedRecordsFromLedger(adminObj, walletPath_org2)
            console.log(response)
            return response
        } catch (error) {
            return `Failed to submit transaction ${error}`;
        }
    }
    else if (adminObj.org === "Org3" && adminObj.username === "admin3") {
        try {
            const response = await readDownloadedRecordsFromLedger(adminObj, walletPath_org3)
            console.log(response)
            return response
        } catch (error) {
            return `Failed to submit transaction ${error}`;
        }
    }
}

async function queryAllUpdatedData(adminObj) {
    if (adminObj.org === "Org1" && adminObj.username === "admin") {
        try {
            const response = await readUpdatedRecordsFromLedger(adminObj, walletPath_org1)
            console.log(response)
            return response
        } catch (error) {
            return `Failed to submit transaction ${error}`;
        }

    } else if (adminObj.org === "Org2" && adminObj.username === "admin2") {
        try {
            const response = await readUpdatedRecordsFromLedger(adminObj, walletPath_org2)
            console.log(response)
            return response
        } catch (error) {
            return `Failed to submit transaction ${error}`;
        }
    }
    else if (adminObj.org === "Org3" && adminObj.username === "admin3") {
        try {
            const response = await readUpdatedRecordsFromLedger(adminObj, walletPath_org3)
            console.log(response)
            return response
        } catch (error) {
            return `Failed to submit transaction ${error}`;
        }
    }
}





async function queryAllDoctorReads(adminObj) {
    if (adminObj.org === "Org1" && adminObj.username === "admin") {
        try {
            const response = await readDoctorDataRecordsFromLedger(adminObj, walletPath_org1)
            console.log(response)
            return response
        } catch (error) {
            return `Failed to submit transaction ${error}`;
        }

    } else if (adminObj.org === "Org2" && adminObj.username === "admin2") {
        try {
            const response = await readDoctorDataRecordsFromLedger(adminObj, walletPath_org2)
            console.log(response)
            return response
        } catch (error) {
            return `Failed to submit transaction ${error}`;
        }
    }
    else if (adminObj.org === "Org3" && adminObj.username === "admin3") {
        try {
            const response = await readDoctorDataRecordsFromLedger(adminObj, walletPath_org3)
            console.log(response)
            return response
        } catch (error) {
            return `Failed to submit transaction ${error}`;
        }
    }
}

async function queryAllPatientGrantsToDoctors(adminObj) {

    if (adminObj.org === "Org1" && adminObj.username === "admin") {
        try {
            const response = await readDoctorGrantRecordsFromLedger(adminObj, walletPath_org1)
            console.log(response)
            return response
        } catch (error) {
            return `Failed to submit transaction ${error}`;
        }

    } else if (adminObj.org === "Org2" && adminObj.username === "admin2") {
        try {
            const response = await readDoctorGrantRecordsFromLedger(adminObj, walletPath_org2)
            console.log(response)
            return response
        } catch (error) {
            return `Failed to submit transaction ${error}`;
        }
    }
    else if (adminObj.org === "Org3" && adminObj.username === "admin3") {
        try {
            const response = await readDoctorGrantRecordsFromLedger(adminObj, walletPath_org3)
            console.log(response)
            return response
        } catch (error) {
            return `Failed to submit transaction ${error}`;
        }
    }
}

async function queryHash(adminObj) {

    if (adminObj.org === "Org1" && adminObj.role === "doctor") {
        try {
            const response = await queryHashIPFS(adminObj, walletPath_org1)
            console.log(response)
            return response
        } catch (error) {
            return `Failed to submit transaction ${error}`;
        }

    } else if (adminObj.org === "Org2" && adminObj.role === "doctor") {
        try {
            const response = await queryHashIPFS(adminObj, walletPath_org2)
            console.log(response)
            return response
        } catch (error) {
            return `Failed to submit transaction ${error}`;
        }
    }
    else if (adminObj.org === "Org3" && adminObj.role === "doctor") {
        try {
            const response = await queryHashIPFS(adminObj, walletPath_org3)
            console.log(response)
            return response
        } catch (error) {
            return `Failed to submit transaction ${error}`;
        }
    }
}

async function queryAllPatientRevokesToDoctors(adminObj) {

    if (adminObj.org === "Org1" && adminObj.username === "admin") {
        try {
            const response = await readPatientRevokeRecordsFromLedger(adminObj, walletPath_org1)
            console.log(response)
            return response
        } catch (error) {
            return `Failed to submit transaction ${error}`;
        }

    } else if (adminObj.org === "Org2" && adminObj.username === "admin2") {
        try {
            const response = await readPatientRevokeRecordsFromLedger(adminObj, walletPath_org2)
            console.log(response)
            return response
        } catch (error) {
            return `Failed to submit transaction ${error}`;
        }
    }
    else if (adminObj.org === "Org3" && adminObj.username === "admin3") {
        try {
            const response = await readPatientRevokeRecordsFromLedger(adminObj, walletPath_org3)
            console.log(response)
            return response
        } catch (error) {
            return `Failed to submit transaction ${error}`;
        }
    }
}

// async function queryAllPatientRevokesToResearchers(adminObj) {
//   const response = await readPatientRevokeResearcherRecordsFromLedger(adminObj);
//   return response;
// }




async function insertDoctorIntoDatabase(doctorObj) {
    let connection;
    try {
        connection = await pool.promise().getConnection(); 

        const [rows] = await connection.query(
            'SELECT COUNT(*) AS userCount FROM users WHERE username = ?',
            ["doctor" + doctorObj.doctorId.toString()]
        );

        if (rows.length > 0 && rows[0].userCount > 0) {
            return 'already exists.';
        }

        await connection.query(
            'INSERT INTO doctors (id, doctorId, org, role, username, firstNameDoctor, lastNameDoctor) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [doctorObj.doctorId, doctorObj.doctorId, doctorObj.org, doctorObj.role, doctorObj.username, doctorObj.firstNameDoctor, doctorObj.lastNameDoctor]
        );

        const hashedPassword = await bcrypt.hash(doctorObj.password, 10);
        await connection.query( 
            "INSERT INTO users (username, password, role, org) VALUES (?, ?, ?, ?)",
            ["doctor"+doctorObj.doctorId.toString(), hashedPassword, doctorObj.role, doctorObj.org]
        );

        return 'Doctor inserted successfully';
    } catch (error) {
        console.error(`Failed to insert doctor into database: ${error}`);
        return {'error': error}
    } finally {
        if (connection) connection.release();
    }
}

async function updatePatientPassword(patientObj) {
    let connection;
    try {
        connection = await pool.promise().getConnection(); 

        const hashedPassword = await bcrypt.hash(patientObj.password, 10);

        const [userResult] = await connection.query(
            `UPDATE users SET password=?, firstlogin=1 WHERE username=?`,
            [hashedPassword, patientObj.doctorId]
        );

        if (userResult.affectedRows > 0) {
            console.log(`🔄 Password updated for patient ${patientObj.doctorId}`);
        } else {
            console.warn(`⚠️ No patient found with username ${patientObj.doctorId}`);
        }

        return { affectedRows: userResult.affectedRows };

    } catch (error) {
        console.error(`❌ Failed to update patient's password: ${error.message}`);
        return { error: error.message };
    } finally {
        if (connection) connection.release(); 
    }
}

async function updateDoctorPassword(doctorObj) {
    let connection;
    try {
        connection = await pool.promise().getConnection();

        const hashedPassword = await bcrypt.hash(doctorObj.password, 10);

        const [userResult] = await connection.query(
            `UPDATE users SET password=?, firstlogin=1 WHERE username=?`,
            [hashedPassword, doctorObj.doctorId]
        );

        if (userResult.affectedRows > 0) {
            console.log(`🔄 Password updated for doctor ${doctorObj.doctorId}`);
        } else {
            console.warn(`⚠️ No doctor found with username ${doctorObj.doctorId}`);
        }

        return { affectedRows: userResult.affectedRows };

    } catch (error) {
        console.error(`❌ Failed to update doctor's password: ${error.message}`);
        return { error: error.message };

    } finally {
        if (connection) connection.release(); 
    }
}


async function updateResearcherPassword(researcherObj) {
    let connection;
    try {
        connection = await pool.promise().getConnection(); 

        const hashedPassword = await bcrypt.hash(researcherObj.password, 10);
        const [userResult] = await connection.query(
            `UPDATE users SET password=?, firstlogin=1 WHERE username=?`,
            [hashedPassword, researcherObj.doctorId]
        );
        if (userResult.affectedRows > 0) {
            console.log(`🔄 Password updated for researcher ${researcherObj.doctorId}`);
        } else {
            console.warn(`⚠️ No researcher found with username ${researcherObj.doctorId}`);
        }

        return { affectedRows: userResult.affectedRows };

    } catch (error) {
        console.error(`❌ Failed to update researcher's password: ${error.message}`);
        return { error: error.message };

    } finally {
        if (connection) connection.release(); 
    }
}


async function insertResearcherIntoDatabase(researcherObj) {
    let connection;
    try {
        connection = await pool.promise().getConnection(); 
        const [rows] = await connection.query(
            'SELECT COUNT(*) AS userCount FROM users WHERE username = ?',
            ["researcher" + researcherObj.researcherId.toString()]
        );

        if (rows[0].userCount > 0) {
            console.log(`🚫 Researcher with ID ${researcherObj.researcherId} already exists.`);
            return { status: 'error', message: 'Researcher already exists.' };
        }

        await connection.query(
            'INSERT INTO researcher (id, researcherId, org, role, username, firstNameResearcher, lastNameResearcher) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
                researcherObj.researcherId, researcherObj.researcherId, researcherObj.org, researcherObj.role,
                researcherObj.username, researcherObj.firstNameResearcher, researcherObj.lastNameResearcher
            ]
        );

        const hashedPassword = await bcrypt.hash(researcherObj.password, 10);

        await connection.query(
            "INSERT INTO users (username, password, role, org) VALUES (?, ?, ?, ?)",
            ["researcher" + researcherObj.researcherId.toString(), hashedPassword, researcherObj.role, researcherObj.org]
        );

        console.log(`✅ Researcher ${researcherObj.researcherId} registered successfully.`);
        return { status: 'success', message: 'Researcher inserted successfully.' };

    } catch (error) {
        console.error(`❌ Failed to insert researcher into database: ${error.message}`);
        return { status: 'error', message: error.message };

    } finally {
        if (connection) connection.release(); 
    }
}


async function registerResearcher(researcherObj) {
    try {
        if (researcherObj.org === "Org1" && researcherObj.username === "admin") {
            await registerUser(researcherObj, walletPath_org1)

            try {
                const response = await registerResearcherToLedger(researcherObj, walletPath_org1)
                console.log(response)
                await insertResearcherIntoDatabase(researcherObj);
                console.log(researcherObj);
                return 'Researcher: ' + researcherObj.researcherId + ', successfully registered into database';
            } catch (error) {
                return `Failed to submit transaction ${error}`;
            }

        } else if (researcherObj.org === "Org2" && researcherObj.username === "admin2") {
            await registerUser(researcherObj, walletPath_org2)
            try {
                const response = await registerResearcherToLedger(researcherObj, walletPath_org2)
                console.log(response)
                await insertResearcherIntoDatabase(researcherObj);
                return 'Researcher: ' + researcherObj.researcherId + ', successfully registered into database';
            } catch (error) {
                return `Failed to submit transaction ${error}`;
            }
        }
        else if (researcherObj.org === "Org3" && researcherObj.username === "admin3") {
            await registerUser(researcherObj, walletPath_org3)
            try {
                const response = await registerResearcherToLedger(researcherObj, walletPath_org3)
                console.log(response)
                await insertResearcherIntoDatabase(researcherObj);
                return 'Researcher: ' + researcherObj.researcherId + ', successfully registered into database';
            } catch (error) {
                return `Failed to submit transaction ${error}`;
            }
        }
        else {
            return 'Failed to register Researcher.';
        }
    } catch (error) {
        console.error(`\nregisterResearcher() --> Failed to register Researcher ${researcherObj.researcherId}: ${error}`)
        return {'error': error}
    }
}
async function requestAccess(userObj) {
    let connection;

    try {
        connection = await pool.promise().getConnection();

        const doctorId = parseInt(userObj.username.replace(/^doctor(\d+)$/i, '$1'));
        const patientId = parseInt(userObj.patientId);

        if (!doctorId || !patientId) {
            console.warn(`⚠️ Invalid doctorId (${doctorId}) or patientId (${patientId})`);
            return { status: 'error', message: 'Invalid doctorId or patientId.' };
        }

        const [existingRequests] = await connection.query(
            'SELECT * FROM hospitalInfo.requests WHERE doctorId = ? AND patientId = ?',
            [doctorId, patientId]
        );

        if (existingRequests.length > 0) {
            console.log(`🚫 Access request already exists for doctor ${doctorId} and patient ${patientId}`);
            return { status: 'error', message: 'Access request already sent to this patient.' };
        }

        const notificationMessage = `Doctor ${doctorId} has requested access to your records.`;
        await connection.query(
            'INSERT INTO hospitalInfo.requests (message, doctorId, patientId) VALUES (?, ?, ?)',
            [notificationMessage, doctorId, patientId]
        );

        console.log(`✅ Access request sent to patient ${patientId} from doctor ${doctorId}`);
        return { status: 'success', message: 'Access request sent to patient.' };

    } catch (error) {
        console.error(`❌ requestAccess() --> Failed to send access request: ${error.message}`);
        return { status: 'error', message: error.message };

    } finally {
        if (connection) connection.release(); 
    }
}


async function changeStatus(userObj) {
    let connection;

    try {
        connection = await pool.promise().getConnection(); 
        const { doctorId, patientId, response } = userObj;

        if (!doctorId || !patientId || !response) {
            console.warn(`⚠️ Missing required parameters: doctorId=${doctorId}, patientId=${patientId}, response=${response}`);
            return { status: 'error', message: 'Missing required parameters.' };
        }

        console.log(`🔄 Processing response for doctor ${doctorId} and patient ${patientId}: ${response.trim().toLowerCase()}`);

        if (response.trim().toLowerCase() === 'yes') {
            console.log(`✅ Granting access: Patient ${patientId} approved Doctor ${doctorId}`);

            await connection.query(
                'INSERT INTO patientDoctorAccess (doctorId, patientId, doctorAccess) VALUES (?, ?, 1)',
                [doctorId, patientId]
            );

            const notificationMessage = `Patient ${patientId} has given you access to their records.`;
            await connection.query(
                'INSERT INTO notifications (doctorId, message, status) VALUES (?, ?, ?)',
                [doctorId, notificationMessage, 0]
            );

            await connection.query(
                'DELETE FROM requests WHERE doctorId = ? AND patientId = ?',
                [doctorId, patientId]
            );

        } else {
            console.log(`❌ Denying access: Patient ${patientId} rejected Doctor ${doctorId}`);

            await connection.query(
                'DELETE FROM requests WHERE doctorId = ? AND patientId = ?',
                [doctorId, patientId]
            );
        }

        return { status: 'success', message: 'Status updated successfully.' };

    } catch (error) {
        console.error(`❌ changeStatus() --> Failed to update status: ${error.message}`);
        return { status: 'error', message: error.message };

    } finally {
        if (connection) connection.release(); 
    }
}


async function registerPatient(patientObj) {
    try {
        const filepath1 = `${walletPath_org1}/doctor${patientObj.doctorId}.id`;
        const filepath2 = `${walletPath_org2}/doctor${patientObj.doctorId}.id`;
        const filepath3 = `${walletPath_org3}/doctor${patientObj.doctorId}.id`;

        if (patientObj.org === "Org1" && patientObj.username === "admin" && fs.existsSync(filepath1)) {
            try {
                await registerPatientToLedger(patientObj, walletPath_org1)
                const patientInsertResult = await registerUser(patientObj, walletPath_org1)
                console.log(patientInsertResult)
                
                return 'Patient: ' + patientObj.patientId + ', successfully registered'
            } catch (error) {
                return `Failed to submit transaction ${error}`
            }
        }
        else if (patientObj.org === "Org2" && patientObj.username === "admin2" && fs.existsSync(filepath2)) {
            try {
                await registerPatientToLedger(patientObj, walletPath_org2)
                const patientInsertResult = await registerUser(patientObj, walletPath_org2)
                console.log(patientInsertResult)
               
                return 'Patient: ' + patientObj.patientId + ', successfully registered'
            } catch (error) {
                return `Failed to submit transaction ${error}`
            }
        }
        else if (patientObj.org === "Org3" && patientObj.username === "admin3" && fs.existsSync(filepath3)) {
            try {
                await registerPatientToLedger(patientObj, walletPath_org3)
                const patientInsertResult = await registerUser(patientObj, walletPath_org3)
                console.log(patientInsertResult)
                
                return 'Patient: ' + patientObj.patientId + ', successfully registered'
            } catch (error) {
                return `Failed to submit transaction ${error}`
            }
        }
        else {
            return '[-----------------------] Failed to register patient.';
        }
    } catch (error) {
        console.error(`\nregisterPatient() --> Failed to register patient ${patientObj.patientId}: ${error}`)
        return (`Failed to register doctor ${doctorObj.doctorId}: ${error}`)
    }
}


/**
 * Method to update the patient information (non-medical) in the ledger using appropriate chaincode and method.
 */
async function registerDoctorToLedger(userObj, path) {
    try {
        const result = await submitTransaction('registerDoctorTransaction', userObj, path)
        return result
    } catch (error) {
        console.error(`\n registerDoctorToLedger() --> Failed to register doctor to ledger: ${error}`)
        // throw new Error(`Failed to register doctor to ledger: ${error}`)
        return {'error': error}
    }
}

async function readHomomorphicData(userObj, path) {
    try {
        const result = await submitTransaction('ResearcherReadHomomorphicData', userObj, path)
        return result
    } catch (error) {
        console.error(`\n readHomomorphicData() --> Failed to readHomomorphicData: ${error}`)
        // throw new Error(`Failed to readHomomorphicData: ${error}`)
        return {'error': error}
    }
}

async function readStatisticsData(userObj, path) {
    try {
        const result = await submitTransaction('ResearcherReadStatistics', userObj, path)
        return result
    } catch (error) {
        console.error(`\n readStatisticsData() --> Failed to readStatisticsData: ${error}`)
        // throw new Error(`Failed to readStatisticsData: ${error}`)
        return {'error': error}
    }
}


async function registerResearcherToLedger(userObj, path) {
    try {
        const result = await submitTransaction('registerResearcherTransaction', userObj, path)
        return result
    } catch (error) {
        console.error(`\n registerResearcherToLedger() --> Failed to register researcher to ledger: ${error}`)
        // throw new Error(`Failed to register researcher to ledger: ${error}`)
        return {'error': error}
    }
}

async function readPatientDataFromLedger(userObj, path) {
    try {
        const result = await submitTransaction('DoctorReadRecord', userObj, path)
        return result
    } catch (error) {
        console.error(`\n readPatientDataFromLedger() --> Failed to read patient's data readings from ledger: ${error}`)
        // throw new Error(`Failed to read patient's from ledger: ${error}`)
        return {'error': error}
    }
}


async function readPersonalDataFromLedger(userObj, path) {
    try {
        const result = await submitTransaction('PatientReadRecord', userObj, path)
        return result
    } catch (error) {
        console.error(`\n readPersonalDataFromLedger() --> Failed to read patient's personal data readings from ledger: ${error}`)
        // throw new Error(`Failed to read patient's from ledger: ${error}`)
        return {'error': error}
    }
}

async function writeHashToLedger(userObj, filename, filehash, patientId, enc_key, ivector, path) {
    try {
        const result = await submitTransaction1('storeFileHash', userObj, filename, filehash, patientId, enc_key, ivector, path)
        return result
    } catch (error) {
        console.error(`\n writeHashToLedger() --> Failed to read uploads from ledger: ${error}`)
        // throw new Error(`Failed to read uploads from ledger: ${error}`)
        return {'error': error}
    }
}

async function readUploadsFromLedger(userObj, path) {
    try {
        const result = await submitTransaction('uploadPatientRecord', userObj, path)
        return result
    } catch (error) {
        console.error(`\n readUploadsFromLedger() --> Failed to read uploads from ledger: ${error}`)
        // throw new Error(`Failed to read uploads from ledger: ${error}`)
        return {'error': error}
    }
}

async function readDownloadsFromLedger(userObj, path) {
    try {
        const result = await submitTransaction('downloadPatientRecord', userObj, path)
        return result
    } catch (error) {
        console.error(`\n readDonwloadsFromLedger() --> Failed to read downloads from ledger: ${error}`)
        // throw new Error(`Failed to read downloads from ledger: ${error}`)
        return {'error': error}
    }
}

async function updatePatientDataInLedger(userObj, path) {
    try {
        const result = await submitTransaction('UpdatePatientData', userObj, path)
        return result
    } catch (error) {
        console.error(`\n readPatientDataFromLedger() --> Failed to read patient's from ledger: ${error}`)
        // throw new Error(`Failed to read patient's from ledger: ${error}`)
        return {'error': error}
    }
}

async function submitDoctorGrantRecordToLedger(userObj, path) {
    try {
        const result = await submitTransaction('GrantAccessDoctor', userObj, path)
        return result
    } catch (error) {
        console.error(`\n submitDoctorGrantRecordToLedger() --> Failed to submit patient's grant access to ledger: ${error}`)
        // throw new Error(`Failed to submit patient's grant access to ledger: ${error}`)
        return {'error': error}
    }
}

async function EmergencyAccessPatientRecord(userObj, path) {
    try {
        const result = await submitTransaction('EmergencyAccessPatientRecord', userObj, path)
        return result
    } catch (error) {
        console.error(`\n EmergencyAccessPatientRecord() --> Failed to submit patient's grant access to ledger: ${error}`)
        // throw new Error(`Failed to submit patient's grant access to ledger: ${error}`)
        return {'error': error}
    }
}

// async function submitResearcherGrantRecordToLedger(userObj, path) {
//   try {
//     const result = await submitTransaction('GrantAccessResearcher', userObj, path)
//     return result
//   } catch (error) {
//     console.error(`\n submitResearcherGrantRecordToLedger() --> Failed to submit patient's grant access to ledger: ${error}`)
//     throw new Error(`Failed to submit patient's grant access to ledger: ${error}`)
//   }
// }

async function submitDoctorRevokeRecordToLedger(userObj, path) {
    try {
        const result = await submitTransaction('RevokeAccessDoctor', userObj, path)
        return result
    } catch (error) {
        console.error(`\n submitDoctorRevokeRecordToLedger() --> Failed to submit patient's revoke access to ledger: ${error}`)
        // throw new Error(`Failed to submit patient's revoke access to ledger: ${error}`)
        return {'error': error}
    }
}

async function submitResearcherRevokeRecordToLedger(userObj, path) {
    try {
        const result = await submitTransaction('RevokeAccessResearcher', userObj, path)
        return result
    } catch (error) {
        console.error(`\n submitResearcherRevokeRecordToLedger() --> Failed to submit patient's revoke access to ledger: ${error}`)
        // throw new Error(`Failed to submit patient's revoke access to ledger: ${error}`)
        return {'error': error}
    }
}

async function registerPatientToLedger(userObj, path) {
    try {
        const result = await submitTransaction('registerPatientTransaction', userObj, path)
        return result
    } catch (error) {
        console.error(`\n register_to_ledger() --> Failed to register patient to ledger: ${error}`)
        // throw new Error(`Failed to register patient to ledger: ${error}`)
        return {'error': error}
    }
}

async function readRecordsFromLedger(adminObj, path) {
    try {
        const result = await submitTransaction('queryAllRegistrations', adminObj, path)
        return result
    } catch (error) {
        console.error(`\n readRecordsFromLedger() --> Failed to read records from ledger: ${error}`)
        // throw new Error(`Failed to read records from ledger: ${error}`)
        return {'error': error}
    }
}

async function readSpecificUpdatesFromLedger(adminObj, path) {
    try {
        const result = await submitTransaction('querySpecificPatientDoctorUpdates', adminObj, path)
        return result
    } catch (error) {
        console.error(`\n readSpecificUpdatesFromLedger() --> Failed to read records from ledger: ${error}`)
        // throw new Error(`Failed to read records from ledger: ${error}`)
        return {'error': error}
    }
}

async function readUploadedRecordsFromLedger(adminObj, path) {
    try {
        const result = await submitTransaction('queryAllUploads', adminObj, path)
        return result
    } catch (error) {
        console.error(`\n readUploadedRecordsFromLedger() --> Failed to read uploaded records from ledger: ${error}`)
        // throw new Error(`Failed to read records from ledger: ${error}`)
        return {'error': error}
    }
}

async function readDownloadedRecordsFromLedger(adminObj, path) {
    try {
        const result = await submitTransaction('queryAllDownloads', adminObj, path)
        return result
    } catch (error) {
        console.error(`\n readDownloadedRecordsFromLedger() --> Failed to read downloaded records from ledger: ${error}`)
        // throw new Error(`Failed to read records from ledger: ${error}`)
        return {'error': error}
    }
}

async function readUpdatedRecordsFromLedger(adminObj, path) {
    try {
        const result = await submitTransaction('queryAllDoctorUpdates', adminObj, path)
        return result
    } catch (error) {
        console.error(`\n readUpdatedRecordsFromLedger() --> Failed to read updated records from ledger: ${error}`)
        // throw new Error(`Failed to read updated records from ledger: ${error}`)
        return {'error': error}
    }
}

async function readDoctorDataRecordsFromLedger(adminObj, path) {
    try {
        const result = await submitTransaction('queryAllDoctorReadings', adminObj, path)
        return result
    } catch (error) {
        console.error(`\n readDoctorDataRecordsFromLedger() --> Failed to read doctor reading records from ledger: ${error}`)
        // throw new Error(`Failed to read doctor reading records from ledger: ${error}`)
        return {'error': error}
    }
}

async function readDoctorGrantRecordsFromLedger(adminObj, path) {
    try {
        const result = await submitTransaction('queryAllDoctorGrants', adminObj, path)
        return result
    } catch (error) {
        console.error(`\n readDoctorGrantRecordsFromLedger() --> Failed to read patient's grants from ledger: ${error}`)
        // throw new Error(`Failed to read patient's grants from ledger: ${error}`)
        return {'error': error}
    }
}

async function queryHashIPFS(adminObj, path) {
    try {
        const result = await submitTransaction('retrieveFileHash', adminObj, path)
        return result
    } catch (error) {
        console.error(`\n queryHashIPFS() --> Failed to read patient's revokes from ledger: ${error}`)
        // throw new Error(`Failed to read patient's revokes from ledger: ${error}`)
        return {'error': error}
    }
}

async function readPatientRevokeRecordsFromLedger(adminObj, path) {
    try {
        const result = await submitTransaction('queryAllDoctorRevokes', adminObj, path)
        return result
    } catch (error) {
        console.error(`\n readPatientRevokeRecordsFromLedger() --> Failed to read patient's revokes from ledger: ${error}`)
        // throw new Error(`Failed to read patient's revokes from ledger: ${error}`)
        return {'error': error}
    }
}


async function updatePatientHealthRecord(userObj) {
    let connection;
    try {
        connection = await pool.promise().getConnection(); 

        let res;
        if (userObj.org === "Org1") {
            res = await updatePatientDataInLedger(userObj, walletPath_org1);
        } else if (userObj.org === "Org2") {
            res = await updatePatientDataInLedger(userObj, walletPath_org2);
        } else if (userObj.org === "Org3") {
            res = await updatePatientDataInLedger(userObj, walletPath_org3);
        }
        console.log(res);

        const doctorId = parseInt(userObj.username.replace(/^doctor(\d+)$/i, '$1'));
        const patientId = parseInt(userObj.patientId);

        const [accessCheckResult] = await connection.query(
            'SELECT doctorAccess FROM patientDoctorAccess WHERE patientId = ? AND doctorId = ?',
            [patientId, doctorId]
        );

        if (accessCheckResult.length > 0 && accessCheckResult[0].doctorAccess === 1) {
            const [countResult] = await connection.query(
                'SELECT COUNT(*) AS count FROM patientsinfo WHERE doctorId = ? AND patientId = ? AND org = ?',
                [doctorId, userObj.patientId, userObj.org]
            );

            if (countResult[0].count === 0) {
                throw new Error('Record not found for the specified conditions.');
            }
            await connection.query(
                'UPDATE patientsinfo SET TAG = ?, WBCs = ?, LDL = ? WHERE doctorId = ? AND patientId = ? AND org = ?',
                [userObj.TAG, userObj.WBCs, userObj.LDL, doctorId, userObj.patientId, userObj.org]
            );

            return { message: 'Record updated successfully' };
        } else {
            console.error('Access not granted for the specified doctor and patient.');
            return { error: 'Access not granted for the specified doctor and patient.' };
        }
    } catch (error) {
        console.error(`❌ updatePatientHealthRecord() --> Failed to update the record: ${error.message}`);
        return { error: error.message };
    } finally {
        if (connection) connection.release(); 
    }
}


/**
 * Method to read a patient's record based on id from the ledger using appropriate chanincode and method.
 */
const queryAsync = async (conn, query, values) => {
    const [result] = await conn.query(query, values); 
    return result;
};


// async function readPatientData(userObj) {
//     let connection;

//     try {
//         connection = await new Promise((resolve, reject) => {
//             pool.getConnection((err, conn) => {
//                 if (err) reject(err);
//                 else resolve(conn);
//             });
//         });

//         console.log("Here is the role", userObj.role);
//         let bc_result;

//         try {
//             if (userObj.org == "Org1") {
//                 bc_result = await readPatientDataFromLedger(userObj, walletPath_org1);
//             }
//             else if (userObj.org == "Org2") {
//                 bc_result = await readPatientDataFromLedger(userObj, walletPath_org2);
//             }
//             else if (userObj.org == "Org3") {
//                 bc_result = await readPatientDataFromLedger(userObj, walletPath_org3);
//             }
//             console.log(bc_result);

//             // Handling for doctors
//             if (userObj.role === 'doctor') {
//                 const doctorId = parseInt(userObj.username.replace(/^doctor(\d+)$/i, '$1'));
//                 console.log("Doctor ID:", doctorId);

//                 // Initialize query parameters and condition based on whether a patient ID is provided
//                 let accessCheckQuery, queryParams, patientQuery;
//                 const folderPath = '/usr/src/app/client/uploads/patient';
//                 let patientFiles = [], patientInfo = [];

//                 if (userObj.patientId === '') {
//                     // Fetch details for all patients accessible by this doctor
//                     accessCheckQuery = 'SELECT doctorAccess FROM patientDoctorAccess WHERE doctorId = ? AND doctorAccess = 1';
//                     queryParams = [doctorId];
//                     patientQuery = `
//             SELECT pi.firstNamePatient, pi.lastNamePatient, pi.patientId
//             FROM patientsinfo pi
//             JOIN patientDoctorAccess pda ON pi.patientId = pda.patientId
//             WHERE pi.org = ? AND pda.doctorId = ? AND pda.doctorAccess = 1
//           `;
//                     const accessCheckResult = await queryAsync(connection, accessCheckQuery, queryParams);

//                     if (accessCheckResult.length > 0 && accessCheckResult[0].doctorAccess === 1) {
//                         patientInfo = await queryAsync(connection, patientQuery, [userObj.org, ...queryParams.slice(-2)]);
//                         for (const patient of patientInfo) {
//                             const files = await fs.promises.readdir(folderPath);
//                             patientFiles.push(...files.filter(filename => filename.startsWith(`patient${patient.patientId}`))
//                                 .map(filename => ({ filename, patientId: patient.patientId })));
//                         }
//                         console.log("Patient Info:", patientInfo, "Patient Files:", patientFiles);
//                         return { patient: patientInfo, files: patientFiles };
//                     }
//                 } else {
//                     const patientId = parseInt(userObj.patientId);
//                     accessCheckQuery = 'SELECT doctorAccess FROM patientDoctorAccess WHERE patientId = ? AND doctorId = ? AND doctorAccess = 1';
//                     queryParams = [patientId, doctorId];
//                     patientQuery = `
//             SELECT firstNamePatient, lastNamePatient, TAG, WBCs, LDL, patientId
//             FROM patientsinfo
//             WHERE org = ? AND patientId = ? AND doctorId = ?
//           `;

//                     const accessCheckResult = await queryAsync(connection, accessCheckQuery, queryParams);

//                     if (accessCheckResult.length > 0 && accessCheckResult[0].doctorAccess === 1) {
//                         // Access granted, proceed to fetch patient details
//                         patientInfo = await queryAsync(connection, patientQuery, [userObj.org, ...queryParams.slice(-2)]);

//                         if (patientInfo.length === 1) {

//                             console.log("============================", patientInfo[0].TAG, patientInfo[0].WBCs, patientInfo[0].LDL)

//                             let data = [patientInfo[0].TAG, patientInfo[0].WBCs, patientInfo[0].LDL];
//                             let hashData = generateHash(data);
//                             console.log("DATA FROM DB", hashData);

//                             let latestTimestamp = null;
//                             let latestHash = null;

//                             let resFromBC;
//                             if (userObj.org == "Org1") {
//                                 resFromBC = await readSpecificUpdatesFromLedger(userObj, walletPath_org1);
//                             }
//                             else if (userObj.org == "Org2") {
//                                 resFromBC = await readSpecificUpdatesFromLedger(userObj, walletPath_org2);
//                             }
//                             else if (userObj.org == "Org3") {
//                                 resFromBC = await readSpecificUpdatesFromLedger(userObj, walletPath_org3);
//                             }

//                             console.log("-------------------------+_---------------------------", resFromBC)
//                             try {
//                                 // Check if resFromBC is already an object
//                                 if (typeof resFromBC === 'string') {
//                                     // Parse the string into an array of objects
//                                     resFromBC = JSON.parse(resFromBC);
//                                 }

//                                 if (Array.isArray(resFromBC)) {
//                                     resFromBC.forEach(entry => {
//                                         const timestamp = new Date(entry.Record.registeredAt).getTime();
//                                         if (latestTimestamp === null || timestamp > latestTimestamp) {
//                                             latestTimestamp = timestamp;
//                                             latestHash = entry.Record.hashData;
//                                         }
//                                     });

//                                     console.log(latestHash);
//                                 } else {
//                                     console.error("The result from the blockchain is not an array.");
//                                 }
//                             } catch (error) {
//                                 // console.error("Error parsing blockchain result:", error);
//                                 return {'error': error}
//                             }

//                             if (hashData != latestHash) {
//                                 return "Error: Not Valid Data";
//                             }

//                             // Attempt to read files for each patient
//                             for (const patient of patientInfo) {
//                                 const files = await fs.promises.readdir(folderPath);
//                                 patientFiles.push(...files.filter(filename => filename.startsWith(`patient${patient.patientId}`))
//                                     .map(filename => ({ filename, patientId: patient.patientId })));
//                             }
//                             console.log("Patient Info:", patientInfo, "Patient Files:", patientFiles);
//                             return { patient: patientInfo, files: patientFiles };
//                         }
//                     }

//                 }
//             }
//             else if (userObj.role === 'researcher') {

//                 console.log(userObj.org)
//                 const query = 'SELECT patientId, TAG, WBCs, LDL FROM patientsinfo WHERE org = ?';
//                 const patientResult = await queryAsync(connection, query, userObj.org);

//                 const epsilon = 0.1; // Differential privacy parameter - smaller values mean more privacy
//                 const sensitivity = 1.0;

//                 const dpPatientResult = patientResult.map(patient => ({
//                     patientId: patient.patientId, // Assuming patientId is not sensitive and doesn't need noise
//                     TAG: patient.TAG,
//                     WBCs: patient.WBCs,
//                     LDL: patient.LDL,
//                 }));

//                 let result = { patient: dpPatientResult };
//                 return result;
//             }
//             // Handling for other roles can be added here as needed
//         } catch (error) {
//             console.error(`Failed to submit read transaction: ${error}`);
//             return `Failed to submit read transaction: ${error}`;
//         }
//     } catch (error) {
//         console.error(`readPatientData() --> Failed to read the record: ${error}`);
//         // throw new Error(`Failed to read the record: ${error}`);
//         return {'error': error}
//     } finally {
//         if (connection) connection.release();
//     }
// }

async function readPatientData(userObj) {
    let connection;
    try {
        connection = await pool.promise().getConnection(); 
        console.log('Here is the role:', userObj.role);
        let bc_result;

        try {
            if (userObj.org === 'Org1') {
                bc_result = await readPatientDataFromLedger(userObj, walletPath_org1);
            } else if (userObj.org === 'Org2') {
                bc_result = await readPatientDataFromLedger(userObj, walletPath_org2);
            } else if (userObj.org === 'Org3') {
                bc_result = await readPatientDataFromLedger(userObj, walletPath_org3);
            }
            console.log('Ledger data:', bc_result);
        } catch (ledgerError) {
            console.error('Failed to submit read transaction:', ledgerError);
            return { error: ledgerError.message || 'Failed to submit read transaction' };
        }

        if (userObj.role === 'doctor') {
            const doctorId = parseInt(userObj.username.replace(/^doctor(\d+)$/i, '$1'), 10);
            console.log('Doctor ID:', doctorId);

            const folderPath = '/usr/src/app/client/uploads/patient';
            let patientFiles = [];
            let patientInfo = [];

            if (!userObj.patientId) {
                const accessCheckQuery =
                    'SELECT doctorAccess FROM patientDoctorAccess WHERE doctorId = ? AND doctorAccess = 1';
                const [accessCheckResult] = await connection.query(accessCheckQuery, [doctorId]);

                if (accessCheckResult.length === 0 || accessCheckResult[0].doctorAccess !== 1) {
                    return { patient: [], files: [] };
                }

                const patientQuery = `
                    SELECT pi.firstNamePatient, pi.lastNamePatient, pi.patientId
                    FROM patientsinfo pi
                    JOIN patientDoctorAccess pda ON pi.patientId = pda.patientId
                    WHERE pi.org = ? AND pda.doctorId = ? AND pda.doctorAccess = 1
                `;
                const [patientInfoResult] = await connection.query(patientQuery, [userObj.org, doctorId]);
                patientInfo = patientInfoResult;

                for (const p of patientInfo) {
                    const allFiles = await fs.promises.readdir(folderPath);
                    const matchedFiles = allFiles
                        .filter(filename => filename.startsWith(`patient${p.patientId}`))
                        .map(filename => ({ filename, patientId: p.patientId }));
                    patientFiles.push(...matchedFiles);
                }

                console.log('Patient Info:', patientInfo, 'Patient Files:', patientFiles);
                return { patient: patientInfo, files: patientFiles };
            }

            const patientId = parseInt(userObj.patientId, 10);
            const accessCheckQuery = `
                SELECT doctorAccess 
                FROM patientDoctorAccess 
                WHERE patientId = ? AND doctorId = ? AND doctorAccess = 1
            `;
            const [accessCheckResult] = await connection.query(accessCheckQuery, [patientId, doctorId]);

            if (accessCheckResult.length === 0 || accessCheckResult[0].doctorAccess !== 1) {
                return { error: `Access not granted for doctor=${doctorId} on patient=${patientId}` };
            }

            const patientQuery = `
                SELECT firstNamePatient, lastNamePatient, TAG, WBCs, LDL, patientId
                FROM patientsinfo
                WHERE org = ? AND patientId = ? AND doctorId = ?
            `;
            const [patientInfoResult] = await connection.query(patientQuery, [userObj.org, patientId, doctorId]);
            patientInfo = patientInfoResult;

            if (patientInfo.length !== 1) {
                return { error: 'No matching patient record found for the specified conditions.' };
            }

            const allFiles = await fs.promises.readdir(folderPath);
            const matchedFiles = allFiles
                .filter(filename => filename.startsWith(`patient${patientInfo[0].patientId}`))
                .map(filename => ({ filename, patientId: patientInfo[0].patientId }));

            patientFiles.push(...matchedFiles);

            console.log('Patient Info:', patientInfo, 'Patient Files:', patientFiles);
            return { patient: patientInfo, files: patientFiles };

        } else if (userObj.role === 'researcher') {
            try {
                console.log('Researcher Org:', userObj.org);
                const query = 'SELECT patientId, TAG, WBCs, LDL FROM patientsinfo WHERE org = ?';
                const [patientResult] = await connection.query(query, [userObj.org]);

                const dpPatientResult = patientResult.map(p => ({
                    patientId: p.patientId,
                    TAG: p.TAG,
                    WBCs: p.WBCs,
                    LDL: p.LDL,
                }));
                return { patient: dpPatientResult };
            } catch (dbError) {
                console.error('Error reading data for researcher:', dbError);
                return { error: dbError.message || 'Failed to retrieve data for researcher' };
            }
        }

        return { error: 'No specific logic for this user role.' };

    } catch (outerError) {
        console.error('readPatientData() --> Failed to read the record:', outerError);
        return { error: outerError.message || 'Failed to read the record' };
    } finally {
        if (connection) connection.release(); 
    }
}

  
async function readPersonalData(userObj) {
    let connection;

    try {
        connection = await pool.promise().getConnection(); 

        console.log("Here is the role", userObj.role);

        try {
            let res;
            if (userObj.org === "Org1") {
                res = await readPersonalDataFromLedger(userObj, walletPath_org1);
            } else if (userObj.org === "Org2") {
                res = await readPersonalDataFromLedger(userObj, walletPath_org2);
            } else if (userObj.org === "Org3") {
                res = await readPersonalDataFromLedger(userObj, walletPath_org3);
            }
            console.log(res);

            const patientId = parseInt(userObj.username.replace(/^patient(\d+)$/i, '$1'), 10);

            const [accessCheckResult] = await connection.query(
                'SELECT firstNamePatient, lastNamePatient, TAG, WBCs, LDL FROM patientsinfo WHERE patientId = ?',
                [patientId]
            );
            console.log("--------------------------------------", accessCheckResult);

            const folderPath = '/usr/src/app/client/uploads/patient';

            const files = await fs.promises.readdir(folderPath);

            const patientFiles = files
                .filter(filename => filename.startsWith(`patient${patientId}`))
                .map(filename => ({ filename, patientId: patientId }));

            const result = {
                patient: accessCheckResult[0] || {},
                files: patientFiles
            };

            console.log("--------------------------------------", result);
            return result;

        } catch (error) {
            console.error(`❌ readPersonalData() --> Failed to read the record: ${error.message}`);
            return { error: error.message || 'Failed to read the record' };
        }

    } finally {
        if (connection) connection.release();
    }
}

async function specificPatientData(userObj) {
    let connection;
    try {
        connection = await pool.promise().getConnection(); 
        console.log(userObj.role);

        const query = `
            SELECT d.firstNameDoctor, d.lastNameDoctor, d.doctorId
            FROM patientDoctorAccess pda
            JOIN doctors d ON pda.doctorId = d.doctorId
            WHERE pda.patientId = ? AND pda.doctorAccess = 1;
        `;

        const [result] = await connection.query(query, [parseInt(userObj.username.replace(/^patient(\d+)$/i, '$1'))]);

        return result;
    } catch (error) {
        console.error(`❌ specificPatientData() --> Failed to read patient data: ${error.message}`);
        return { error: error.message };
    } finally {
        if (connection) connection.release(); 
    }
}

async function readAllPatientData(userObj) {
    let connection;
    try {
        connection = await pool.promise().getConnection(); 

        console.log(userObj.role);

        let result;
        if (userObj.username === 'admin') {
            const query = 'SELECT id, TAG, WBCs, LDL FROM patientsinfo WHERE org = ?';
            const [queryResult] = await connection.query(query, ['Org1']);
            result = queryResult;
        }
        else if (userObj.username === 'admin2') {
            const query = 'SELECT id, TAG, WBCs, LDL FROM patientsinfo WHERE org = ?';
            const [queryResult] = await connection.query(query, ['Org2']);
            result = queryResult;
        }
        else if (userObj.username === 'admin3') {
            const query = 'SELECT id, TAG, WBCs, LDL FROM patientsinfo WHERE org = ?';
            const [queryResult] = await connection.query(query, ['Org3']);
            result = queryResult;
        }

        return result;
    } catch (error) {
        console.error(`❌ readAllPatientData() --> Failed to read all the current record: ${error.message}`);
        return { error: error.message };
    } finally {
        if (connection) connection.release(); 
    }
}


async function specificResearchersData(userObj) {
    let connection;
    try {
        connection = await pool.promise().getConnection();

        console.log(userObj.role);

        const query = `
            SELECT d.firstNameResearcher, d.lastNameResearcher, d.researcherId
            FROM patientResearcherAccess pda
            JOIN researcher d ON pda.researcherId = d.researcherId
            WHERE pda.patientId = ? AND pda.researcherAccess = 1;
        `;

        const [result] = await connection.query(query, [parseInt(userObj.username.replace(/^patient(\d+)$/i, '$1'))]);

        return result;
    } catch (error) {
        console.error(`❌ specificResearchersData() --> Failed to read researcher data: ${error.message}`);
        return { error: error.message };
    } finally {
        if (connection) connection.release();
    }
}


async function getRecordHistory(userObj) {
    try {
        console.log('Beginning getRecordHistory')
        console.log('evaluating transaction for GetRecordHistory, patient id: ' + userObj)
        const result = await evaluateTransaction('GetRecordHistory', userObj)
        console.log(result)
        console.log('Ending getRecordHistory')
        return result
    } catch (error) {
        console.error(`getRecordHistory() --> Failed to read history for the record: ${error}`)
        return {'error': error}
    }
}



async function grantAccessDoctor(userObj) {
    let connection;
    try {
        connection = await pool.promise().getConnection(); 

        let stat = 0;
        console.log("THIS IS THE OBJECT++++++++++++++++", userObj);

        let res;
        if (userObj.org === "Org1") {
            res = await submitDoctorGrantRecordToLedger(userObj, walletPath_org1);
        } else if (userObj.org === "Org2") {
            res = await submitDoctorGrantRecordToLedger(userObj, walletPath_org2);
        } else if (userObj.org === "Org3") {
            res = await submitDoctorGrantRecordToLedger(userObj, walletPath_org3);
        }
        console.log(res);

        const patientId = parseInt(userObj.username.replace(/^patient(\d+)$/i, '$1'));
        const doctorId = parseInt(userObj.doctorId);
        const [checkResult] = await connection.query(
            'SELECT 1 FROM hospitalInfo.patientDoctorAccess WHERE patientId = ? AND doctorId = ? LIMIT 1',
            [patientId, doctorId]
        );
        console.log(checkResult);

        if (checkResult.length > 0) {
            const [accessResult] = await connection.query(
                'UPDATE hospitalInfo.patientDoctorAccess SET doctorAccess = 1 WHERE patientId = ? AND doctorId = ?',
                [patientId, doctorId]
            );

            const notificationMessage = `Patient ${patientId} gave you access to their records.`;
            await connection.query(
                'INSERT INTO notifications (doctorId, message, status) VALUES (?, ?, ?)',
                [doctorId, notificationMessage, stat]
            );

            return { accessResult, status: stat };

        } else {
            const [accessResult] = await connection.query(
                'INSERT INTO hospitalInfo.patientDoctorAccess (patientId, doctorId, doctorAccess) VALUES (?, ?, 1)',
                [patientId, doctorId]
            );

            const notificationMessage = `Patient ${patientId} gave you access to their records.`;
            await connection.query(
                'INSERT INTO notifications (doctorId, message, status) VALUES (?, ?, ?)',
                [doctorId, notificationMessage, stat]
            );

            return { accessResult, status: stat };
        }

    } catch (error) {
        console.error(`❌ grantAccessDoctor() --> Failed to grant access: ${error.message}`);
        return { error: error.message };
    } finally {
        if (connection) connection.release();
    }
}

async function getNotification(doctorObj) {
    let connection;
    try {
        connection = await pool.promise().getConnection(); 

        const doctorId = parseInt(doctorObj.doctorId || doctorObj.username.replace(/^doctor(\d+)$/i, '$1'));

        const [notifications] = await connection.query(
            'SELECT id, message, status FROM notifications WHERE doctorId = ?',
            [doctorId]
        );

        return { notifications };

    } catch (error) {
        console.error(`❌ getNotification() --> Failed to retrieve notifications: ${error.message}`);
        return { error: error.message };
    } finally {
        if (connection) connection.release(); 
    }
}

async function getPatientNotification(patientObj) {
    let connection;
    try {
        connection = await pool.promise().getConnection(); 

        const patientId = parseInt(patientObj.patientId || patientObj.username.replace(/^patient(\d+)$/i, '$1'));

        const [notifications] = await connection.query(
            'SELECT id, message FROM requests WHERE patientId = ?',
            [patientId]
        );

        return { notifications };

    } catch (error) {
        console.error(`❌ getPatientNotification() --> Failed to retrieve notifications: ${error.message}`);
        return { error: error.message };
    } finally {
        if (connection) connection.release(); 
    }
}


async function markNotificationsAsRead(doctorObj) {
    let connection;
    try {
        connection = await pool.promise().getConnection(); 

        const doctorId = parseInt(doctorObj.doctorId || doctorObj.username.replace(/^doctor(\d+)$/i, '$1'));

        const [updateResult] = await connection.query(
            'UPDATE notifications SET status = 1 WHERE doctorId = ? AND status = 0',
            [doctorId]
        );

        return { affectedRows: updateResult.affectedRows };

    } catch (error) {
        console.error(`❌ markNotificationsAsRead() --> Failed to update notifications: ${error.message}`);
        return { error: error.message };
    } finally {
        if (connection) connection.release(); 
    }
}



async function emergencyAccessPatientRecord(userObj) {
    let connection;
    try {
        connection = await pool.promise().getConnection(); 

        console.log("THIS IS THE OBJECT++++++++++++++++", userObj);

        // Extract necessary values from userObj
        const reason = userObj.reason;
        const doctorId = parseInt(userObj.username.replace(/^doctor(\d+)$/i, '$1'));
        const patientIdNum = parseInt(userObj.patientId);

        if (!doctorId || !patientIdNum) {
            throw new Error('Invalid doctorId or patientId');
        }

        const [checkResult] = await connection.query(
            'SELECT 1 FROM hospitalInfo.patientDoctorAccess WHERE patientId = ? AND doctorId = ? LIMIT 1',
            [patientIdNum, doctorId]
        );

        if (checkResult.length > 0) {
            await connection.query(
                'UPDATE hospitalInfo.patientDoctorAccess SET doctorAccess = 1, reason = ? WHERE patientId = ? AND doctorId = ?',
                [reason, patientIdNum, doctorId]
            );
        } else {
            await connection.query(
                'INSERT INTO hospitalInfo.patientDoctorAccess (patientId, doctorId, doctorAccess, reason) VALUES (?, ?, 1, ?)',
                [patientIdNum, doctorId, reason]
            );
        }

        return { message: 'Emergency access granted successfully.' };

    } catch (error) {
        console.error(`❌ emergencyAccessPatientRecord() --> Failed to perform emergency access: ${error.message}`);
        return { error: error.message };
    } finally {
        if (connection) connection.release(); 
    }
}


async function revokeAccessDoctor(userObj) {
    let connection;
    try {
        connection = await pool.promise().getConnection(); 

        let res;
        if (userObj.org === "Org1") {
            res = await submitDoctorRevokeRecordToLedger(userObj, walletPath_org1);
        } else if (userObj.org === "Org2") {
            res = await submitDoctorRevokeRecordToLedger(userObj, walletPath_org2);
        } else if (userObj.org === "Org3") {
            res = await submitDoctorRevokeRecordToLedger(userObj, walletPath_org3);
        }
        console.log(res);

        const patientId = parseInt(userObj.username.replace(/^patient(\d+)$/i, '$1'));
        const doctorId = userObj.doctorId;

        const [result] = await connection.query(
            'UPDATE hospitalInfo.patientDoctorAccess SET doctorAccess = 0 WHERE patientId = ? AND doctorId = ?',
            [patientId, doctorId]
        );

        return { affectedRows: result.affectedRows };

    } catch (error) {
        console.error(`❌ revokeAccessDoctor() --> Failed to revoke access: ${error.message}`);
        return { error: error.message };
    } finally {
        if (connection) connection.release(); 
    }
}

async function revokeAccessResearcher(userObj) {
    let connection;
    try {
        connection = await pool.promise().getConnection(); 

        let res;
        if (userObj.org === "Org1") {
            res = await submitResearcherRevokeRecordToLedger(userObj, walletPath_org1);
        } else if (userObj.org === "Org2") {
            res = await submitResearcherRevokeRecordToLedger(userObj, walletPath_org2);
        } else if (userObj.org === "Org3") {
            res = await submitResearcherRevokeRecordToLedger(userObj, walletPath_org3);
        }
        console.log(res);

        const patientId = parseInt(userObj.username.replace(/^patient(\d+)$/i, '$1'));
        const researcherId = userObj.researcherId;

        const [result] = await connection.query(
            'UPDATE hospitalInfo.patientResearcherAccess SET researcherAccess = 0 WHERE patientId = ? AND researcherId = ?',
            [patientId, researcherId]
        );

        return { affectedRows: result.affectedRows };

    } catch (error) {
        console.error(`❌ revokeAccessResearcher() --> Failed to revoke access: ${error.message}`);
        return { error: error.message };
    } finally {
        if (connection) connection.release();
    }
}


/*
***************************************************************
***************************************************************
***************************************************************

Trying to implement zk-Rollups for emergency access

***************************************************************
***************************************************************
***************************************************************
*/

async function processBatchRequests(userObj) {
    try {
        const result = await submitTransaction('submitProofToFabric', userObj.patientId,userObj.reareason, path)
        return result
    } catch (error) {
        console.error(`\n EmergencyAccessPatientRecord() --> Failed to submit patient's grant access to ledger: ${error}`)
        return {'error': error}
    }
}


  async function grantEmergencyAccess(doctorRequests) {
    let connection;
    try {
        connection = await pool.getConnection();

        for (let doc of doctorRequests) {
            const reason = doc.reason;
            const doctorId = parseInt(doc.username.replace(/^doctor(\d+)$/i, '$1'));
            const patientIdNum = parseInt(doc.patientId);

            if (!doctorId || !patientIdNum) {
                throw new Error('Invalid doctorId or patientId');
            }

            // Check if doctor already has access
            const checkQuery = 'SELECT 1 FROM hospitalInfo.patientDoctorAccess WHERE patientId = ? AND doctorId = ? LIMIT 1';
            const [checkResult] = await connection.query(checkQuery, [patientIdNum, doctorId]);

            if (checkResult.length > 0) {
                // Update existing record
                const updateQuery = 'UPDATE hospitalInfo.patientDoctorAccess SET doctorAccess = 1, reason = ? WHERE patientId = ? AND doctorId = ?';
                await connection.query(updateQuery, [reason, patientIdNum, doctorId]);
            } else {
                // Insert new record
                const insertQuery = 'INSERT INTO hospitalInfo.patientDoctorAccess (patientId, doctorId, doctorAccess, reason) VALUES (?, ?, 1, ?)';
                await connection.query(insertQuery, [patientIdNum, doctorId, reason]);
            }
        }

        return { message: 'Emergency access granted successfully.' };

    } catch (error) {
        console.error(`Failed to grant emergency access: ${error.message || error}`);
        return { error: error.message };
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

async function submitProofToFabric(userObj, path) {
    try {
        const result = await submitTransaction('submitProofToFabric', userObj, path)
        return result
    } catch (error) {
        console.error(`\n EmergencyAccessPatientRecord() --> Failed to submit patient's grant access to ledger: ${error}`)
        return {'error': error}
    }
}

module.exports = {
    registerDoctor,
    registerPatient,
    registerResearcher,
    connectNetwork,
    disconnectNetowrk,
    updatePatientHealthRecord,
    readPatientData,
    readAllPatientData,
    getRecordHistory,
    grantAccessDoctor,
    // grantAccessResearcher,
    revokeAccessDoctor,
    revokeAccessResearcher,
    registerDoctorToLedger,
    registerPatientToLedger,
    queryAllRegistrations,
    specificPatientData,
    readPatientDataFromLedger,
    readDoctorDataRecordsFromLedger,
    queryAllDoctorReads,
    updatePatientDataInLedger,
    readUpdatedRecordsFromLedger,
    queryAllUpdatedData,
    queryAllPatientGrantsToDoctors,
    queryAllPatientRevokesToDoctors,
    submitDoctorGrantRecordToLedger,
    submitDoctorRevokeRecordToLedger,
    // submitResearcherGrantRecordToLedger,
    submitResearcherRevokeRecordToLedger,
    readPersonalData,
    readDownloadsFromLedger,
    readUploadsFromLedger,
    queryAllUploads,
    queryAllDownloads,
    readUploadedRecordsFromLedger,
    readDownloadedRecordsFromLedger,
    insertResearcherIntoDatabase,
    specificResearchersData,
    readSpecificUpdatesFromLedger,
    queryAllSpecificDoctorUpdates,
    writeHashToLedger,
    queryHash,
    submitTransaction2,
    readStatisticsData,
    readHomomorphicData,
    emergencyAccessPatientRecord,
    EmergencyAccessPatientRecord,
    getNotification,
    markNotificationsAsRead,
    requestAccess,
    getPatientNotification,
    changeStatus,
    insertUserIntoDatabase,
    processBatchRequests,
    updateDoctorPassword,
    updatePatientPassword,
    updateResearcherPassword
}
