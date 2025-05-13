pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";

template EmergencyAccess() {
    // Declare inputs
    signal input sk;         // The patient's emergency secret key (private input)
    signal input flag;       // The emergency flag (must be 1)
    signal input pubHash;    // The pre-registered public hash (public input)

    // Check that flag equals 1 using the IsEqual comparator
    component checkFlag = IsEqual();
    checkFlag.in[0] <== flag;
    checkFlag.in[1] <== 1;
    checkFlag.out === 1;

    // Hash the secret key using Poseidon
    component hasher = Poseidon(1);
    hasher.inputs[0] <== sk;

    // Ensure the hash matches the public hash using the IsEqual comparator
    component checkHash = IsEqual();
    checkHash.in[0] <== hasher.out;
    checkHash.in[1] <== pubHash;
    checkHash.out === 1;
}

// Specify which signals are public
component main { public [flag, pubHash] } = EmergencyAccess();
