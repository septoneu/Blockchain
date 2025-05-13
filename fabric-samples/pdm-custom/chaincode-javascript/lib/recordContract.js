'use strict';

const { Contract } = require('fabric-contract-api');
const Long = require('long');
const crypto = require('crypto');
// const snarkjs = require("snarkjs"); 
// const { json } = require('stream/consumers');


class RecordContract extends Contract {

    async generateHash(data) {
        // Convert the data to a string or JSON
        const serializedData = JSON.stringify(data);
        // Generate hash using SHA-256
        const hash = crypto.createHash('sha256').update(serializedData).digest('hex');
        return hash;
    }

    /* STARTS HERE FOR IPFS HASHES */

    async storeFileHash(ctx, userObj, fileName, ipfsHash, patientId, enc_key, ivector) {
        // const recordExists = await this.recordExists(ctx, userObj.fileUpload.name);
        // if (recordExists) {
        //     throw new Error(`The record for ${userObj.fileUpload.name} file already exists`);
        // }
        userObj = JSON.parse(userObj);
        let sub_key;
        let counter_key;

        if (userObj.org == "Org1") {
            counter_key = 'FILE1_COUNTER';
            sub_key = 'FILE1_';
        } else if (userObj.org == "Org2") {
            counter_key = 'FILE2_COUNTER';
            sub_key = 'FILE2_';
        } else if (userObj.org == "Org3") {
            counter_key = 'FILE3_COUNTER';
            sub_key = 'FILE3_';
        }

        let counterBytes = await ctx.stub.getState(counter_key);
        let counter = counterBytes && counterBytes.length > 0 ? parseInt(counterBytes.toString()) : 0;

        // Increment the counter
        counter += 1;

        // Update the counter in the ledger
        await ctx.stub.putState(counter_key, Buffer.from(counter.toString()));

        let compositeKey = `${sub_key}PATIENT_${patientId}_${counter}`;
        // Get the transaction timestamp
        const txTimestamp = ctx.stub.getTxTimestamp();

        // Convert the timestamp to milliseconds
        const milliseconds = Long.fromInt(txTimestamp.seconds).multiply(1000).add(txTimestamp.nanos / 1000000).toNumber();

        // Create a Date object using the milliseconds
        const registeredAt = new Date(milliseconds);

        const transactionRecord = {
            type: 'FileHash',
            fileName: fileName,
            fileHash: ipfsHash,
            encKey: enc_key,
            iVector: ivector,
            registeredAt: registeredAt.toISOString().slice(0, 10) + ":" + registeredAt.toISOString().slice(11, 19),
        };
        // Use 'DOC_REG_' + userObj.doctorId as the key
        await ctx.stub.putState(compositeKey, Buffer.from(JSON.stringify(transactionRecord)));

        return { key: compositeKey, record: transactionRecord };
    }

    async retrieveFileHash(ctx, userObj) {
        userObj = JSON.parse(userObj);
        const allResults = [];
        let startKeyDoc;
        let endKeyDoc;

        if (userObj.org == "Org1") {
            startKeyDoc = `FILE1_PATIENT_${userObj.patientId}_0`;
            endKeyDoc = `FILE1_PATIENT_${userObj.patientId}_9999999999999999999`;
        } else if (userObj.org == "Org2") {
            startKeyDoc = `FILE2_PATIENT_${userObj.patientId}_0`;
            endKeyDoc = `FILE2_PATIENT_${userObj.patientId}_9999999999999999999`;
        } else if (userObj.org == "Org3") {
            startKeyDoc = `FILE2_PATIENT_${userObj.patientId}_0`;
            endKeyDoc = `FILE2_PATIENT_${userObj.patientId}_9999999999999999999`;
        }

        await this.queryByRange(ctx, startKeyDoc, endKeyDoc, allResults);

        const fileName = userObj.fileName;

        const filteredResults = allResults.filter(result => {
            const recordFileName = JSON.parse(result.Record.fileName);
            return recordFileName === fileName;
        });


        const fileHash = JSON.parse(filteredResults[0].Record.fileHash);
        const enc_key = filteredResults[0].Record.encKey;
        const i_vector = filteredResults[0].Record.iVector;

        return { 'fileHash': fileHash, 'enc_key': enc_key, 'i_vector': i_vector };

    }

    /* ENDS HERE FOR IPFS HASHES */

    async registerDoctorTransaction(ctx, userObj) {
        userObj = JSON.parse(userObj);
        let sub_key;

        if (userObj.org == "Org1") {
            sub_key = 'DOC1_REG_';
        } else if (userObj.org == "Org2") {
            sub_key = 'DOC2_REG_';
        } else if (userObj.org == "Org3") {
            sub_key = 'DOC3_REG_';
        }

        // Get the transaction timestamp
        const txTimestamp = ctx.stub.getTxTimestamp();

        // Convert the timestamp to milliseconds
        const milliseconds = Long.fromInt(txTimestamp.seconds).multiply(1000).add(txTimestamp.nanos / 1000000).toNumber();

        // Create a Date object using the milliseconds
        const registeredAt = new Date(milliseconds);

        const transactionRecord = {
            type: 'Doctor Registration',
            doctorId: userObj.doctorId,
            registeredAt: registeredAt.toISOString().slice(0, 10) + ":" + registeredAt.toISOString().slice(11, 19), // Convert to a readable format if needed
        };

        // Use 'DOC_REG_' + userObj.doctorId as the key
        await ctx.stub.putState(sub_key + userObj.doctorId, Buffer.from(JSON.stringify(transactionRecord)));

        return transactionRecord;
    }

    async registerResearcherTransaction(ctx, userObj) {
        userObj = JSON.parse(userObj);

        let sub_key;

        if (userObj.org == "Org1") {
            sub_key = 'RES1_REG_';
        } else if (userObj.org == "Org2") {
            sub_key = 'RES2_REG_';
        } else if (userObj.org == "Org3") {
            sub_key = 'RES3_REG_';
        }

        // Get the transaction timestamp
        const txTimestamp = ctx.stub.getTxTimestamp();

        // Convert the timestamp to milliseconds
        const milliseconds = Long.fromInt(txTimestamp.seconds).multiply(1000).add(txTimestamp.nanos / 1000000).toNumber();

        // Create a Date object using the milliseconds
        const registeredAt = new Date(milliseconds);

        const transactionRecord = {
            type: 'Researcher Registration',
            researcherId: userObj.researcherId,
            registeredAt: registeredAt.toISOString().slice(0, 10) + ":" + registeredAt.toISOString().slice(11, 19) // Convert to a readable format if needed
        };

        // Use 'DOC_REG_' + userObj.doctorId as the key
        await ctx.stub.putState(sub_key + userObj.researcherId, Buffer.from(JSON.stringify(transactionRecord)));

        return transactionRecord;
    }
    async DiffPriv(ctv, userObj) {

    }

    async ResearcherReadStatistics(ctx, userObj) {
        userObj = JSON.parse(userObj);

        let counterKey;
        let sub_key;

        if (userObj.org == "Org1") {
            counterKey = 'RES1_READ_COUNTER';
            sub_key = 'RES1_READ_';
        } else if (userObj.org == "Org2") {
            counterKey = 'RES2_READ_COUNTER';
            sub_key = 'RES2_READ_';
        } else if (userObj.org == "Org3") {
            counterKey = 'RES3_READ_COUNTER';
            sub_key = 'RES3_READ_';
        }

        // Fetch the current counter for RES_READ_
        let counterBytes = await ctx.stub.getState(counterKey);
        let counter = counterBytes && counterBytes.length > 0 ? parseInt(counterBytes.toString()) : 0;

        // Increment the counter
        counter += 1;

        // Update the counter in the ledger
        await ctx.stub.putState(counterKey, Buffer.from(counter.toString()));

        // Get the current timestamp
        const txTimestamp = ctx.stub.getTxTimestamp();
        const milliseconds = Long.fromInt(txTimestamp.seconds).multiply(1000).add(txTimestamp.nanos / 1000000).toNumber();
        const registeredAt = new Date(milliseconds);

        // Create the transaction record
        const transactionRecord = {
            type: `Researcher ${userObj.username.replace(/^researcher(\d+)$/i, '$1')} Read Hospital Statistics`,
            researcherId: userObj.username.replace(/^researcher(\d+)$/i, '$1'),

            registeredAt: registeredAt.toISOString().slice(0, 10) + ":" + registeredAt.toISOString().slice(11, 19)
        };

        // Use 'RES_READ_' + counter as the key
        await ctx.stub.putState(sub_key + counter.toString(), Buffer.from(JSON.stringify(transactionRecord)));

        return transactionRecord;
    }

    async ResearcherReadHomomorphicData(ctx, userObj) {
        userObj = JSON.parse(userObj);

        let counterKey;
        let sub_key;

        if (userObj.org == "Org1") {
            counterKey = 'RES1_READ_COUNTER';
            sub_key = 'RES1_READ_';
        } else if (userObj.org == "Org2") {
            counterKey = 'RES2_READ_COUNTER';
            sub_key = 'RES2_READ_';
        } else if (userObj.org == "Org3") {
            counterKey = 'RES3_READ_COUNTER';
            sub_key = 'RES3_READ_';
        }

        // Fetch the current counter for RES_READ_
        let counterBytes = await ctx.stub.getState(counterKey);
        let counter = counterBytes && counterBytes.length > 0 ? parseInt(counterBytes.toString()) : 0;

        // Increment the counter
        counter += 1;

        // Update the counter in the ledger
        await ctx.stub.putState(counterKey, Buffer.from(counter.toString()));

        // Get the current timestamp
        const txTimestamp = ctx.stub.getTxTimestamp();
        const milliseconds = Long.fromInt(txTimestamp.seconds).multiply(1000).add(txTimestamp.nanos / 1000000).toNumber();
        const registeredAt = new Date(milliseconds);

        // Create the transaction record
        const transactionRecord = {
            type: `Researcher ${userObj.username.replace(/^researcher(\d+)$/i, '$1')} Read Hospital  Homomorphic Data`,
            researcherId: userObj.username.replace(/^researcher(\d+)$/i, '$1'),

            registeredAt: registeredAt.toISOString().slice(0, 10) + ":" + registeredAt.toISOString().slice(11, 19)
        };

        // Use 'RES_READ_' + counter as the key
        await ctx.stub.putState(sub_key + counter.toString(), Buffer.from(JSON.stringify(transactionRecord)));

        return transactionRecord;
    }

    async registerPatientTransaction(ctx, userObj) {
        userObj = JSON.parse(userObj);

        let counterKey;
        let sub_key;

        if (userObj.org == "Org1") {
            counterKey = 'PAT1_REG_COUNTER';
            sub_key = 'PAT1_REG_';
        } else if (userObj.org == "Org2") {
            counterKey = 'PAT2_REG_COUNTER';
            sub_key = 'PAT2_REG_';
        } else if (userObj.org == "Org3") {
            counterKey = 'PAT3_REG_COUNTER';
            sub_key = 'PAT3_REG_';
        }

        // Fetch the current counter for PAT_REG_
        let counterBytes = await ctx.stub.getState(counterKey);
        let counter = counterBytes && counterBytes.length > 0 ? parseInt(counterBytes.toString()) : 0;

        // Increment the counter
        counter += 1;

        // Update the counter in the ledger
        await ctx.stub.putState(counterKey, Buffer.from(counter.toString()));

        // Proceed with the rest of the function
        const txTimestamp = ctx.stub.getTxTimestamp();
        const milliseconds = Long.fromInt(txTimestamp.seconds).multiply(1000).add(txTimestamp.nanos / 1000000).toNumber();
        const registeredAt = new Date(milliseconds);

        const transactionRecord = {
            type: 'Patient Registration',
            patientId: userObj.patientId,
            registeredAt: registeredAt.toISOString().slice(0, 10) + ":" + registeredAt.toISOString().slice(11, 19) // Convert to a readable format if needed
        };

        // Use 'PAT_REG_' + counter as the key for unique patient registration records
        await ctx.stub.putState(sub_key + counter.toString(), Buffer.from(JSON.stringify(transactionRecord)));

        return transactionRecord;
    }

    async uploadPatientRecord(ctx, userObj) {
        userObj = JSON.parse(userObj);

        let counterKey;
        let sub_key;

        if (userObj.org == "Org1") {
            counterKey = 'PAT1_RECORD_UP_COUNTER';
            sub_key = 'PAT1_RECORD_UP_';
        } else if (userObj.org == "Org2") {
            counterKey = 'PAT2_RECORD_UP_COUNTER';
            sub_key = 'PAT2_RECORD_UP_';
        } else if (userObj.org == "Org3") {
            counterKey = 'PAT3_RECORD_UP_COUNTER';
            sub_key = 'PAT3_RECORD_UP_';
        }

        // Fetch the current counter for PAT_REG_
        let counterBytes = await ctx.stub.getState(counterKey);
        let counter = counterBytes && counterBytes.length > 0 ? parseInt(counterBytes.toString()) : 0;

        // Increment the counter
        counter += 1;

        // Update the counter in the ledger
        await ctx.stub.putState(counterKey, Buffer.from(counter.toString()));

        // Proceed with the rest of the function
        const txTimestamp = ctx.stub.getTxTimestamp();
        const milliseconds = Long.fromInt(txTimestamp.seconds).multiply(1000).add(txTimestamp.nanos / 1000000).toNumber();
        const registeredAt = new Date(milliseconds);

        const transactionRecord = {
            type: 'Patient Record Upload',
            patientId: userObj.patientId,
            registeredAt: registeredAt.toISOString().slice(0, 10) + ":" + registeredAt.toISOString().slice(11, 19) // Convert to a readable format if needed
        };

        // Use 'PAT_REG_' + counter as the key for unique patient registration records
        await ctx.stub.putState(sub_key + counter.toString(), Buffer.from(JSON.stringify(transactionRecord)));

        return transactionRecord;
    }

    async downloadPatientRecord(ctx, userObj) {
        userObj = JSON.parse(userObj);

        let counterKey;
        let sub_key;

        if (userObj.org == "Org1") {
            counterKey = 'PAT1_RECORD_DOWN_COUNTER';
            sub_key = 'PAT1_RECORD_DOWN_';
        } else if (userObj.org == "Org2") {
            counterKey = 'PAT2_RECORD_DOWN_COUNTER';
            sub_key = 'PAT2_RECORD_DOWN_';
        } else if (userObj.org == "Org3") {
            counterKey = 'PAT3_RECORD_DOWN_COUNTER';
            sub_key = 'PAT3_RECORD_DOWN_';
        }

        // Fetch the current counter for PAT_REG_
        let counterBytes = await ctx.stub.getState(counterKey);
        let counter = counterBytes && counterBytes.length > 0 ? parseInt(counterBytes.toString()) : 0;

        // Increment the counter
        counter += 1;

        // Update the counter in the ledger
        await ctx.stub.putState(counterKey, Buffer.from(counter.toString()));

        // Proceed with the rest of the function
        const txTimestamp = ctx.stub.getTxTimestamp();
        const milliseconds = Long.fromInt(txTimestamp.seconds).multiply(1000).add(txTimestamp.nanos / 1000000).toNumber();
        const registeredAt = new Date(milliseconds);

        const transactionRecord = {
            type: 'Patient Record Download',
            patientId: userObj.username.replace(/^doctor(\d+)$/i, '$1'),
            registeredAt: registeredAt.toISOString().slice(0, 10) + ":" + registeredAt.toISOString().slice(11, 19) // Convert to a readable format if needed
        };

        // Use 'PAT_REG_' + counter as the key for unique patient registration records
        await ctx.stub.putState(sub_key + counter.toString(), Buffer.from(JSON.stringify(transactionRecord)));

        return transactionRecord;
    }


    async queryAllUploads(ctx, userObj) {
        const allResults = [];
        userObj = JSON.parse(userObj);

        let startKeyDoc;
        let endKeyDoc;

        if (userObj.org == "Org1") {
            startKeyDoc = 'PAT1_RECORD_UP_0';
            endKeyDoc = 'PAT1_RECORD_UP__9999999999999999999';
        } else if (userObj.org == "Org2") {
            startKeyDoc = 'PAT2_RECORD_UP_0';
            endKeyDoc = 'PAT2_RECORD_UP__9999999999999999999';
        } else if (userObj.org == "Org3") {
            startKeyDoc = 'PAT3_RECORD_UP_0';
            endKeyDoc = 'PAT3_RECORD_UP__9999999999999999999';
        }

        await this.queryByRange(ctx, startKeyDoc, endKeyDoc, allResults);

        console.info(allResults);
        return allResults;
    }

    async queryHash(ctx, userObj) {
        const allResults = [];
        userObj = JSON.parse(userObj);

        let startKeyDoc;
        let endKeyDoc;

        if (userObj.org == "Org1") {
            startKeyDoc = 'PAT1_RECORD_UP_0';
            endKeyDoc = 'PAT1_RECORD_UP__9999999999999999999';
        } else if (userObj.org == "Org2") {
            startKeyDoc = 'PAT2_RECORD_UP_0';
            endKeyDoc = 'PAT2_RECORD_UP__9999999999999999999';
        } else if (userObj.org == "Org3") {
            startKeyDoc = 'PAT3_RECORD_UP_0';
            endKeyDoc = 'PAT3_RECORD_UP__9999999999999999999';
        }

        await this.queryByRange(ctx, startKeyDoc, endKeyDoc, allResults);

        console.info(allResults);
        return allResults;
    }


    async queryAllDownloads(ctx, userObj) {
        const allResults = [];
        userObj = JSON.parse(userObj);

        let startKeyDoc;
        let endKeyDoc;

        if (userObj.org == "Org1") {
            startKeyDoc = 'PAT1_RECORD_DOWN_0';
            endKeyDoc = 'PAT1_RECORD_DOWN__9999999999999999999';
        } else if (userObj.org == "Org2") {
            startKeyDoc = 'PAT2_RECORD_DOWN_0';
            endKeyDoc = 'PAT2_RECORD_DOWN__9999999999999999999';
        } else if (userObj.org == "Org3") {
            startKeyDoc = 'PAT3_RECORD_DOWN_0';
            endKeyDoc = 'PAT3_RECORD_DOWN__9999999999999999999';
        }

        await this.queryByRange(ctx, startKeyDoc, endKeyDoc, allResults);

        console.info(allResults);
        return allResults;
    }


    async queryAllRegistrations(ctx, userObj) {
        const allResults = [];

        userObj = JSON.parse(userObj);

        let startKeyDoc;
        let endKeyDoc;
        let startKeyPat;
        let endKeyPat;

        if (userObj.org == "Org1") {
            startKeyDoc = 'DOC1_REG_0';
            endKeyDoc = 'DOC1_REG_9999999999999999999';
            startKeyPat = 'PAT1_REG_0';
            endKeyPat = 'PAT1_REG_9999999999999999999';
        } else if (userObj.org == "Org2") {
            startKeyDoc = 'DOC2_REG_0';
            endKeyDoc = 'DOC2_REG_9999999999999999999';
            startKeyPat = 'PAT2_REG_0';
            endKeyPat = 'PAT2_REG_9999999999999999999';
        } else if (userObj.org == "Org3") {
            startKeyDoc = 'DOC3_REG_0';
            endKeyDoc = 'DOC3_REG_9999999999999999999';
            startKeyPat = 'PAT3_REG_0';
            endKeyPat = 'PAT3_REG_9999999999999999999';
        }

        // Query for Doctor Registrations
        await this.queryByRange(ctx, startKeyDoc, endKeyDoc, allResults);

        // Query for Patient Registrations
        await this.queryByRange(ctx, startKeyPat, endKeyPat, allResults);

        console.info(allResults);
        return allResults;
    }

    async queryByRange(ctx, startKey, endKey, allResults) {
        const iterator = await ctx.stub.getStateByRange(startKey, endKey);
        while (true) {
            const res = await iterator.next();
            if (res.value && res.value.value.toString()) {
                let jsonRes = { Key: res.value.key, Record: {} };
                try {
                    jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    console.log(err);
                    jsonRes.Record = res.value.value.toString('utf8');
                }
                allResults.push(jsonRes);
            }
            if (res.done) {
                await iterator.close();
                break;
            }
        }
    }

    async queryBySpecificRange(ctx, startKey, endKey, allResults, patientId) {
        const iterator = await ctx.stub.getStateByRange(startKey, endKey);
        while (true) {
            const res = await iterator.next();
            if (res.value && res.value.value.toString()) {
                let jsonRes = { Key: res.value.key, Record: {} };
                try {
                    jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    console.log(err);
                    jsonRes.Record = res.value.value.toString('utf8');
                }
                if (res.value.key.includes(`DOC1_UPDATE_${patientId}_`)) {
                    allResults.push(jsonRes);
                } else if (res.value.key.includes(`DOC2_UPDATE_${patientId}_`)) {
                    allResults.push(jsonRes);
                } else if (res.value.key.includes(`DOC3_UPDATE_${patientId}_`)) {
                    allResults.push(jsonRes);
                } else {
                    return "Key is not included";
                }
            }
            if (res.done) {
                await iterator.close();
                break;
            }
        }
    }


    async queryAllDoctorReadings(ctx, userObj) {

        userObj = JSON.parse(userObj);
        let startKey;
        let endKey;

        if (userObj.org == "Org1") {
            startKey = 'DOC1_READ_0';
            endKey = 'DOC1_READ_9999999999999999999';
        } else if (userObj.org == "Org2") {
            startKey = 'DOC2_READ_0';
            endKey = 'DOC2_READ_9999999999999999999';
        } else if (userObj.org == "Org3") {
            startKey = 'DOC3_READ_0';
            endKey = 'DOC3_READ_9999999999999999999';
        }

        const allResults = [];

        // Utilize the existing queryByRange function to fetch all relevant transactions
        await this.queryByRange(ctx, startKey, endKey, allResults);

        console.info(allResults);
        return allResults;
    }


    async querySpecificPatientDoctorUpdates(ctx, userObj) {
        userObj = JSON.parse(userObj);
        let patientId = userObj.patientId;
        let startKey;
        let endKey;

        if (userObj.org == "Org1") {
            startKey = `DOC1_UPDATE_${patientId}_0`;
            endKey = `DOC1_UPDATE_${patientId}_99999999999999`;
        } else if (userObj.org == "Org2") {
            startKey = `DOC2_UPDATE_${patientId}_0`;
            endKey = `DOC2_UPDATE_${patientId}_99999999999999`;
        } else if (userObj.org == "Org3") {
            startKey = `DOC3_UPDATE_${patientId}_0`;
            endKey = `DOC3_UPDATE_${patientId}_99999999999999`;
        }
        const allResults = [];

        // Utilize the existing queryByRange function to fetch all relevant transactions
        await this.queryBySpecificRange(ctx, startKey, endKey, allResults, patientId);

        console.info(allResults);
        return allResults;
    }

    async queryAllDoctorUpdates(ctx, userObj) {
        userObj = JSON.parse(userObj);
        let startKey;
        let endKey;

        if (userObj.org == "Org1") {
            startKey = 'DOC1_UPDATE_0';
            endKey = 'DOC1_UPDATE_9999999999999999999';
        } else if (userObj.org == "Org2") {
            startKey = 'DOC2_UPDATE_0';
            endKey = 'DOC2_UPDATE_9999999999999999999';
        } else if (userObj.org == "Org3") {
            startKey = 'DOC3_UPDATE_0';
            endKey = 'DOC3_UPDATE_9999999999999999999';
        }
        const allResults = [];

        // Utilize the existing queryByRange function to fetch all relevant transactions
        await this.queryByRange(ctx, startKey, endKey, allResults);

        console.info(allResults);
        return allResults;
    }

    async DoctorReadRecord(ctx, userObj) {
        userObj = JSON.parse(userObj);

        let counterKey;
        let sub_key;

        if (userObj.org == "Org1") {
            counterKey = 'DOC1_READ_COUNTER';
            sub_key = 'DOC1_READ_';
        } else if (userObj.org == "Org2") {
            counterKey = 'DOC2_READ_COUNTER';
            sub_key = 'DOC2_READ_';
        } else if (userObj.org == "Org3") {
            counterKey = 'DOC3_READ_COUNTER';
            sub_key = 'DOC3_READ_';
        }

        let counterBytes = await ctx.stub.getState(counterKey);
        let counter = counterBytes && counterBytes.length > 0 ? parseInt(counterBytes.toString()) : 0;

        counter += 1;

        await ctx.stub.putState(counterKey, Buffer.from(counter.toString()));

        const txTimestamp = ctx.stub.getTxTimestamp();
        const milliseconds = Long.fromInt(txTimestamp.seconds).multiply(1000).add(txTimestamp.nanos / 1000000).toNumber();
        const registeredAt = new Date(milliseconds);

        const transactionRecord = {
            type: `Doctor ${userObj.username.replace(/^doctor(\d+)$/i, '$1')} Read Patient's Record ${userObj.patientId}`,
            doctorId: userObj.username.replace(/^doctor(\d+)$/i, '$1'),
            patientId: userObj.patientId,
            registeredAt: registeredAt.toISOString().slice(0, 10) + ":" + registeredAt.toISOString().slice(11, 19)
        };

        await ctx.stub.putState(sub_key + counter.toString(), Buffer.from(JSON.stringify(transactionRecord)));

        return transactionRecord;
    }

    async EmergencyAccessPatientRecord(ctx, userObj) {
        userObj = JSON.parse(userObj);

        // Verify that the invoking identity has the 'doctor' role
        const identity = ctx.clientIdentity;
        const hasDoctorRole = identity.assertAttributeValue('role', 'doctor');
        if (!hasDoctorRole) {
            throw new Error('Access denied: Only doctors can perform emergency access.');
        }

        // Implement access control to prevent unauthorized access
        // For example, check if the doctor is registered and authorized
        const doctorId = userObj.username.replace(/^doctor(\d+)$/i, '$1');
        const doctorKey = `DOC${userObj.org.slice(-1)}_REG_${doctorId}`;
        const doctorBytes = await ctx.stub.getState(doctorKey);
        if (!doctorBytes || doctorBytes.length === 0) {
            throw new Error(`Doctor ${doctorId} is not registered.`);
        }

        // Proceed with logging the emergency access
        let counterKey = `DOC${userObj.org.slice(-1)}_EMERGENCY_ACCESS_COUNTER`;
        let subKey = `DOC${userObj.org.slice(-1)}_EMERGENCY_ACCESS_`;

        // Fetch and increment the counter
        let counterBytes = await ctx.stub.getState(counterKey);
        let counter = counterBytes && counterBytes.length > 0 ? parseInt(counterBytes.toString()) : 0;
        counter += 1;
        await ctx.stub.putState(counterKey, Buffer.from(counter.toString()));

        // Get the current timestamp
        const txTimestamp = ctx.stub.getTxTimestamp();
        const milliseconds = Long.fromInt(txTimestamp.seconds)
            .multiply(1000)
            .add(txTimestamp.nanos / 1000000)
            .toNumber();
        const accessedAt = new Date(milliseconds);

        // Create the transaction record
        const transactionRecord = {
            type: 'Emergency Access',
            doctorId: doctorId,
            patientId: userObj.patientId,
            accessedAt: accessedAt.toISOString(),
            // reason: userObj.reason, 
        };

        // Store the access record on the ledger
        await ctx.stub.putState(subKey + counter.toString(), Buffer.from(JSON.stringify(transactionRecord)));

        // Retrieve the patient's record securely (implement your data retrieval logic here)
        const patientRecord = await this.getPatientRecord(ctx, userObj.patientId);

        // Return the patient record and the transaction record
        return { patientRecord, transactionRecord };
    }

    async UpdatePatientData(ctx, userObj) {
        userObj = JSON.parse(userObj);
        let counterKey;
        let sub_key;

        let data = [userObj.TAG, userObj.WBCs, userObj.LDL];
        let hashData = await this.generateHash(data);

        // Fetch the current counter for DOC_READ_
        if (userObj.org == "Org1") {
            counterKey = 'DOC1_UPDATE_COUNTER';
            sub_key = 'DOC1_UPDATE_';
        } else if (userObj.org == "Org2") {
            counterKey = 'DOC2_UPDATE_COUNTER';
            sub_key = 'DOC2_UPDATE_';
        } else if (userObj.org == "Org3") {
            counterKey = 'DOC3_UPDATE_COUNTER';
            sub_key = 'DOC3_UPDATE_';
        }

        let counterBytes = await ctx.stub.getState(counterKey);
        let counter = counterBytes && counterBytes.length > 0 ? parseInt(counterBytes.toString()) : 0;

        // Increment the counter
        counter += 1;

        // Update the counter in the ledger
        await ctx.stub.putState(counterKey, Buffer.from(counter.toString()));

        // Proceed with the rest of the function
        const txTimestamp = ctx.stub.getTxTimestamp();
        const milliseconds = Long.fromInt(txTimestamp.seconds).multiply(1000).add(txTimestamp.nanos / 1000000).toNumber();
        const registeredAt = new Date(milliseconds);

        // Include patientId and timestamp in the key
        const transactionKey = sub_key + userObj.patientId + '_' + counter.toString() + '_' + registeredAt;
        const transactionRecord = {
            type: `Doctor ${userObj.username.replace(/^doctor(\d+)$/i, '$1')} Updated Patient's ${userObj.patientId} Record`,
            value_TAG: userObj.TAG,
            value_WBCs: userObj.WBCs,
            value_LDL: userObj.LDL,
            doctorId: userObj.username.replace(/^doctor(\d+)$/i, '$1'),
            patientId: userObj.patientId,
            registeredAt: registeredAt.toISOString().slice(0, 10) + ":" + registeredAt.toISOString().slice(11, 19),
            hashData: hashData
        };

        // Use 'DOC_READ_' + patientId + '_' + timestamp + '_' + counter as the key
        await ctx.stub.putState(transactionKey, Buffer.from(JSON.stringify(transactionRecord) + '\n\n'));

        return transactionRecord;
    }

    async GrantAccessDoctor(ctx, userObj) {
        userObj = JSON.parse(userObj);

        let counterKey;
        let sub_key;

        if (userObj.org == "Org1") {
            counterKey = 'PAT1_GRA_ACC_DOC_COUNTER';
            sub_key = 'PAT1_GRA_ACC_DOC_';
        } else if (userObj.org == "Org2") {
            counterKey = 'PAT2_GRA_ACC_DOC_COUNTER';
            sub_key = 'PAT2_GRA_ACC_DOC_';
        } else if (userObj.org == "Org3") {
            counterKey = 'PAT3_GRA_ACC_DOC_COUNTER';
            sub_key = 'PAT3_GRA_ACC_DOC_';
        }

        // Fetch the current counter for DOC_READ_
        let counterBytes = await ctx.stub.getState(counterKey);
        let counter = counterBytes && counterBytes.length > 0 ? parseInt(counterBytes.toString()) : 0;

        // Increment the counter
        counter += 1;

        // Update the counter in the ledger
        await ctx.stub.putState(counterKey, Buffer.from(counter.toString()));

        // Proceed with the rest of the function
        const txTimestamp = ctx.stub.getTxTimestamp();
        const milliseconds = Long.fromInt(txTimestamp.seconds).multiply(1000).add(txTimestamp.nanos / 1000000).toNumber();
        const registeredAt = new Date(milliseconds);

        const transactionRecord = {
            type: `Patient ${userObj.username.replace(/^patient(\d+)$/i, '$1')} Grant Access To Doctor ${userObj.doctorId}`,
            doctorId: userObj.doctorId,
            patientId: userObj.username.replace(/^patient(\d+)$/i, '$1'),
            registeredAt: registeredAt.toISOString().slice(0, 10) + ":" + registeredAt.toISOString().slice(11, 19)
        };

        // Use 'DOC_READ_' + counter as the key
        await ctx.stub.putState(sub_key + counter.toString(), Buffer.from(JSON.stringify(transactionRecord)));

        return transactionRecord;
    }

    async RevokeAccessDoctor(ctx, userObj) {
        userObj = JSON.parse(userObj);

        let counterKey;
        let sub_key;

        if (userObj.org == "Org1") {
            counterKey = 'PAT1_REV_ACC_DOC_COUNTER';
            sub_key = 'PAT1_REV_ACC_DOC_';
        } else if (userObj.org == "Org2") {
            counterKey = 'PAT2_REV_ACC_DOC_COUNTER';
            sub_key = 'PAT2_REV_ACC_DOC_';
        } else if (userObj.org == "Org3") {
            counterKey = 'PAT3_REV_ACC_DOC_COUNTER';
            sub_key = 'PAT3_REV_ACC_DOC_';
        }

        // Fetch the current counter for DOC_READ_

        let counterBytes = await ctx.stub.getState(counterKey);
        let counter = counterBytes && counterBytes.length > 0 ? parseInt(counterBytes.toString()) : 0;

        // Increment the counter
        counter += 1;

        // Update the counter in the ledger
        await ctx.stub.putState(counterKey, Buffer.from(counter.toString()));

        // Proceed with the rest of the function
        const txTimestamp = ctx.stub.getTxTimestamp();
        const milliseconds = Long.fromInt(txTimestamp.seconds).multiply(1000).add(txTimestamp.nanos / 1000000).toNumber();
        const registeredAt = new Date(milliseconds);

        const transactionRecord = {
            type: `Patient ${userObj.username.replace(/^patient(\d+)$/i, '$1')} Revoke Access To Doctor ${userObj.doctorId}`,
            doctorId: userObj.doctorId,
            patientId: userObj.username.replace(/^patient(\d+)$/i, '$1'),
            registeredAt: registeredAt.toISOString().slice(0, 10) + ":" + registeredAt.toISOString().slice(11, 19)
        };

        // Use 'DOC_READ_' + counter as the key
        await ctx.stub.putState(sub_key + counter.toString(), Buffer.from(JSON.stringify(transactionRecord)));

        return transactionRecord;
    }


    async queryAllDoctorGrants(ctx, userObj) {
        const allResults = [];

        userObj = JSON.parse(userObj);
        let startKey;
        let endKey;

        if (userObj.org == "Org1") {
            startKey = 'PAT1_GRA_ACC_DOC_0';
            endKey = 'PAT1_GRA_ACC_DOC_9999999999999999999';
        } else if (userObj.org == "Org2") {
            startKey = 'PAT2_GRA_ACC_DOC_0';
            endKey = 'PAT2_GRA_ACC_DOC_09999999999999999999';
        } else if (userObj.org == "Org3") {
            startKey = 'PAT3_GRA_ACC_DOC_0';
            endKey = 'PAT3_GRA_ACC_DOC_9999999999999999999';
        }

        // Utilize the existing queryByRange function to fetch all relevant transactions
        await this.queryByRange(ctx, startKey, endKey, allResults);

        console.info(allResults);
        return allResults;
    }

    async queryAllDoctorRevokes(ctx, userObj) {
        const allResults = [];

        userObj = JSON.parse(userObj);
        let startKey;
        let endKey;

        if (userObj.org == "Org1") {
            startKey = 'PAT1_REV_ACC_DOC_0';
            endKey = 'PAT1_REV_ACC_DOC_9999999999999999999';
        } else if (userObj.org == "Org2") {
            startKey = 'PAT2_REV_ACC_DOC_0';
            endKey = 'PAT2_REV_ACC_DOC_9999999999999999999';
        } else if (userObj.org == "Org3") {
            startKey = 'PAT3_REV_ACC_DOC_0';
            endKey = 'PAT3_REV_ACC_DOC_9999999999999999999';
        }

        // Utilize the existing queryByRange function to fetch all relevant transactions
        await this.queryByRange(ctx, startKey, endKey, allResults);

        console.info(allResults);
        return allResults;
    }

    async PatientReadRecord(ctx, userObj) {
        userObj = JSON.parse(userObj);

        let counterKey;
        let sub_key;

        if (userObj.org == "Org1") {
            counterKey = 'PAT1_READ_DATA_COUNTER';
            sub_key = 'PAT1_READ_DATA_';
        } else if (userObj.org == "Org2") {
            counterKey = 'PAT2_READ_DATA_COUNTER';
            sub_key = 'PAT2_READ_DATA_';
        } else if (userObj.org == "Org3") {
            counterKey = 'PAT3_READ_DATA_COUNTER';
            sub_key = 'PAT3_READ_DATA_';
        }

        // Fetch the current counter for DOC_READ_
        let counterBytes = await ctx.stub.getState(counterKey);
        let counter = counterBytes && counterBytes.length > 0 ? parseInt(counterBytes.toString()) : 0;

        // Increment the counter
        counter += 1;

        // Update the counter in the ledger
        await ctx.stub.putState(counterKey, Buffer.from(counter.toString()));

        // Proceed with the rest of the function
        const txTimestamp = ctx.stub.getTxTimestamp();
        const milliseconds = Long.fromInt(txTimestamp.seconds).multiply(1000).add(txTimestamp.nanos / 1000000).toNumber();
        const registeredAt = new Date(milliseconds);

        const transactionRecord = {
            type: `Patient ${userObj.username.replace(/^patient(\d+)$/i, '$1')} Read Data`,
            patientId: userObj.username.replace(/^patient(\d+)$/i, '$1'),
            registeredAt: registeredAt.toISOString().slice(0, 10) + ":" + registeredAt.toISOString().slice(11, 19)
        };

        // Use 'DOC_READ_' + counter as the key
        await ctx.stub.putState(sub_key + counter.toString(), Buffer.from(JSON.stringify(transactionRecord)));

        return transactionRecord;
    }

//     async submitProofToFabric(ctx, patientId, reason) {
//         try {
//             // Step 1: Generate proof
//             const { proof, publicSignals } = await this.proofGeneration(patientId, reason);
    
//             // Step 2: Verify proof
//             const isValid = await this.verifyProof(proof, publicSignals);
    
//             if (isValid) {
//                 // Store proof or result in the ledger
//                 const proofKey = `proof_${ctx.stub.getTxID()}`;
//                 const proofData = {
//                     patientId,
//                     reason,
//                     proof,
//                     publicSignals
//                 };
//                 await ctx.stub.putState(proofKey, Buffer.from(JSON.stringify(proofData)));
    
//                 return `Proof successfully verified and stored with key: ${proofKey}`;
//             } else {
//                 throw new Error("Proof verification failed");
//             }
//         } catch (error) {
//             console.error("Error in submitting proof:", error);
//             throw new Error("Failed to submit proof");
//         }
//     }
    

//     async proofGeneration(patientId, reason) {
//         try {
//             // Load the circuit's WebAssembly file and proving key
//             const wasmPath = "/home/fabric/test/fab/fabric/fabric-samples/pdm/circuit.wasm";
//             const zkeyPath = "/home/fabric/test/fab/fabric/fabric-samples/pdm/circuit_final.zkey";
//             const circuitInputs = {
//                 patientId: patientId,
//                 reason: reason
//             };
    
//             // Generate the witness (intermediate computation step)
//             const { proof, publicSignals } = await snarkjs.groth16.fullProve(
//                 circuitInputs,
//                 wasmPath,
//                 zkeyPath
//             );
    
//             console.log("Proof generated:", proof);
//             console.log("Public signals:", publicSignals);
    
//             return { proof, publicSignals };
//         } catch (error) {
//             console.error("Error in proof generation:", error);
//             throw new Error("Proof generation failed");
//         }
//     }
    

//     async verifyProof(proof, publicSignals) {
//         try {
//             // Load the verification key
//             const vKeyPath = "/home/fabric/test/fab/fabric/fabric-samples/pdm/verification_key.json";
//             const vKey = require(vKeyPath);
    
//             if (!vKey) {
//                 throw new Error("Verification key not found");
//             }
    
//             // Use snarkjs to verify the proof
//             const isValid = await snarkjs.groth16.verify(vKey, publicSignals, proof);
    
//             if (isValid) {
//                 console.log("Proof is valid");
//                 return true;
//             } else {
//                 console.log("Proof is invalid");
//                 return false;
//             }
//         } catch (error) {
//             console.error("Error in proof verification:", error);
//             return false;
//         }
//     }
    

}

module.exports = RecordContract;