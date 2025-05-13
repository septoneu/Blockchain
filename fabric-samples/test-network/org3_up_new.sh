#!/bin/bash

NETWORK_DIR="/home/fabric/test/fab/fabric/fabric-samples/test-network"
CHAINCODE_DIR="../pdm-custom/chaincode-javascript"
CHAINCODE_LABEL="custom_1.0.1"

cd $NETWORK_DIR

if [ "$1" == "--down" ]; then
    ./network.sh down
    exit_status=$?
    if [ $exit_status -ne 0 ]; then
        echo "Error: Failed to bring down the network."
        exit $exit_status
    fi

elif [ "$1" == "--two" ]; then
    ./network.sh createChannel -c mychannel -s couchdb -ca
    exit_status=$?
    if [ $exit_status -ne 0 ]; then
        echo "Error: Failed to create channel."
        exit $exit_status
    fi
    ./network.sh deployCC -ccn custom -ccp $CHAINCODE_DIR -ccl javascript -c mychannel
    exit_status=$?
    if [ $exit_status -ne 0 ]; then
        echo "Error: Failed to deploy chaincode."
        exit $exit_status
    fi

elif [ "$1" == "--three" ]; then
    ./network.sh createChannel -c mychannel -s couchdb -ca
    exit_status=$?
    if [ $exit_status -ne 0 ]; then
        echo "Error: Failed to create channel."
        exit $exit_status
    fi

    cd addOrg3/
    ./addOrg3.sh up -c mychannel -s couchdb -ca
    docker network connect fabric_test ca_org3
    exit_status=$?
    if [ $exit_status -ne 0 ]; then
        echo "Error: Failed to add Org3."
        exit $exit_status
    fi
    cd ../

    ./network.sh deployCC -ccn custom -ccp $CHAINCODE_DIR -ccl javascript -c mychannel
    exit_status=$?
    if [ $exit_status -ne 0 ]; then
        echo "Error: Failed to deploy chaincode."
        exit $exit_status
    fi

    # Change to Org3 context
    export PATH=${PWD}/../bin:$PATH
    export FABRIC_CFG_PATH=$PWD/../config/
    export CORE_PEER_TLS_ENABLED=true
    export CORE_PEER_LOCALMSPID=Org3MSP
    export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org3.example.com/users/Admin@org3.example.com/msp
    export CORE_PEER_ADDRESS=localhost:11051

    # Package the chaincode
    peer lifecycle chaincode package custom.tar.gz --path $CHAINCODE_DIR --lang node --label $CHAINCODE_LABEL
    exit_status=$?
    if [ $exit_status -ne 0 ]; then
        echo "Error: Failed to package chaincode."
        exit $exit_status
    fi

    # Install the chaincode
    peer lifecycle chaincode install custom.tar.gz
    exit_status=$?
    if [ $exit_status -ne 0 ]; then
        echo "Error: Failed to install chaincode."
        exit $exit_status
    fi

    # Query installed chaincode to get package ID
    output=$(peer lifecycle chaincode queryinstalled)
    package_id=$(echo "$output" | grep -o 'Package ID: [^,]*' | cut -d' ' -f3)
    export CC_PACKAGE_ID="$package_id"
    echo "Exported CC_PACKAGE_ID: $CC_PACKAGE_ID"

    # Approve chaincode for Org1 and Org2 with sequence 2
    for org in 1 2; do
        if [ $org -eq 1 ]; then
            export CORE_PEER_LOCALMSPID="Org1MSP"
            export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
            export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
            export CORE_PEER_ADDRESS=localhost:7051
        else
            export CORE_PEER_LOCALMSPID="Org2MSP"
            export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
            export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
            export CORE_PEER_ADDRESS=localhost:9051
        fi
        peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile ${PWD}/organizations/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem --channelID mychannel --name custom --version 1.0.1 --package-id $CC_PACKAGE_ID --sequence 2
        exit_status=$?
        if [ $exit_status -ne 0 ]; then
            echo "Error: Failed to approve chaincode for Org${org}."
            exit $exit_status
        fi
    done

    # Approve chaincode for Org3
    export CORE_PEER_LOCALMSPID="Org3MSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org3.example.com/users/Admin@org3.example.com/msp
    export CORE_PEER_ADDRESS=localhost:11051

    peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile ${PWD}/organizations/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem --channelID mychannel --name custom --version 1.0.1 --package-id $CC_PACKAGE_ID --sequence 2
    exit_status=$?
    if [ $exit_status -ne 0 ]; then
        echo "Error: Failed to approve chaincode for Org3."
        exit $exit_status
    fi

    # Commit chaincode
    peer lifecycle chaincode commit -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile ${PWD}/organizations/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem --channelID mychannel --name custom --version 1.0.1 --sequence 2 --peerAddresses localhost:7051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt --peerAddresses localhost:9051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt --peerAddresses localhost:11051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt
    exit_status=$?
    if [ $exit_status -ne 0 ]; then
        echo "Error: Failed to commit chaincode."
        exit $exit_status
    fi

    # Query committed chaincode
    peer lifecycle chaincode querycommitted --channelID mychannel --name custom
    exit_status=$?
    if [ $exit_status -ne 0 ]; then
        echo "Error: Failed to query committed chaincode."
        exit $exit_status
    fi

else
    echo "Invalid argument. Please specify either --down, --two, or --three."
    exit 1
fi
