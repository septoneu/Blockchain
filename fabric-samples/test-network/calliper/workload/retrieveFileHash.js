'use strict';

const { WorkloadModuleBase } = require('@hyperledger/caliper-core');

class RetrieveFileHashWorkload extends WorkloadModuleBase {
    async initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext) {
        this.chaincodeID = roundArguments.chaincodeID;
        this.channelID = roundArguments.channelID;
        this.sutAdapter = sutAdapter;
    }

    async submitTransaction() {
        const userObj = JSON.stringify({
            org: `Org${(this.workerIndex % 3) + 1}`,
            fileName: `file${this.workerIndex}`,
            patientId: `patient${this.workerIndex}`
        });

        const myArgs = {
            chaincodeFunction: 'retrieveFileHash',
            invokerIdentity: 'User1',
            chaincodeArguments: [userObj]
        };

        await this.sutAdapter.sendRequests(myArgs);
    }
}

function createWorkloadModule() {
    return new RetrieveFileHashWorkload();
}

module.exports.createWorkloadModule = createWorkloadModule;
