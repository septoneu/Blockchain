#!/bin/bash

cd /home/fabric/test/fab/fabric/fabric-samples/test-network

if [ "$1" == "--deploy" ]; then
    #Changing to ORG3
    export PATH=${PWD}/../bin:$PATH
    export FABRIC_CFG_PATH=$PWD/../config/
    export CORE_PEER_TLS_ENABLED=true
    export CORE_PEER_LOCALMSPID=Org3MSP
    export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org3.example.com/users/Admin@org3.example.com/msp
    export CORE_PEER_ADDRESS=localhost:11051

    # Package the chaincode
    peer lifecycle chaincode package custom.tar.gz --path ../pdm-custom/chaincode-javascript --lang node --label custom_1.0.1
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

    output=$(peer lifecycle chaincode queryinstalled)
    # Extract the package ID using grep and cut
    package_id=$(echo "$output" | grep -o 'Package ID: [^,]*' | cut -d' ' -f3)
    # Export the package ID as an environment variable
    export CC_PACKAGE_ID="$package_id"
    # Print the extracted package ID
    echo "Exported CC_PACKAGE_ID: $CC_PACKAGE_ID"

    # Approve the chaincode for Org3
    peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile ${PWD}/organizations/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem --channelID mychannel --name custom --version 1.0.1 --package-id $CC_PACKAGE_ID --sequence 1
    exit_status=$?
    if [ $exit_status -ne 0 ]; then
        echo "Error: Failed to approve chaincode for Org3."
        exit $exit_status
    fi

    # Commit the chaincode
    peer lifecycle chaincode commit -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile ${PWD}/organizations/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem --channelID mychannel --name custom --version 1.0.1 --sequence 1 --peerAddresses localhost:11051 --tlsRootCertFiles ${CORE_PEER_TLS_ROOTCERT_FILE}
    exit_status=$?
    if [ $exit_status -ne 0 ]; then
        echo "Error: Failed to commit chaincode."
        exit $exit_status
    fi

    # Check if the chaincode has been committed successfully
    peer lifecycle chaincode querycommitted --channelID mychannel --name custom
    exit_status=$?
    if [ $exit_status -ne 0 ]; then
        echo "Error: Failed to query committed chaincode."
        exit $exit_status
    fi

    echo "Chaincode deployed successfully."

else
    echo "Invalid argument. Please specify --deploy."
    exit 1
fi
