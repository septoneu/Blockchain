'use strict';

const { WorkloadModuleBase } = require('@hyperledger/caliper-core');

class StoreFileHashWorkload extends WorkloadModuleBase {
    async initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext) {
        this.chaincodeID = roundArguments.chaincodeID;
        this.channelID = roundArguments.channelID;
        this.sutAdapter = sutAdapter;
    }

    async submitTransaction() {
        const userObj = JSON.stringify({
            org: `Org${(this.workerIndex % 3) + 1}`,
            fileUpload: { name: `file${this.workerIndex}` },
            doctorId: `doctor${this.workerIndex}`,
            patientId: `patient${this.workerIndex}`
        });

        const myArgs = {
            chaincodeFunction: 'storeFileHash',
            invokerIdentity: 'User1',
            chaincodeArguments: [userObj, `file${this.workerIndex}`, `hash${this.workerIndex}`, `patient${this.workerIndex}`, 'enc_key', 'ivector']
        };

        await this.sutAdapter.sendRequests(myArgs);
    }
}

function createWorkloadModule() {
    return new StoreFileHashWorkload();
}

module.exports.createWorkloadModule = createWorkloadModule;
