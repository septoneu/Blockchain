pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/comparators.circom";

template EmergencyAccess() {
    // Declare public inputs that will be provided via the input file.
    // (For testing, these are public; later you may wish to keep 'sk' and 'flag' as secret.)
    signal input sk;         // The patient's emergency secret key.
    signal input flag;       // The emergency flag (must be 1).
    signal input pubSecret;  // The pre-registered public secret.

    // Check that flag equals 1 using the IsEqual comparator.
    component checkFlag = IsEqual();
    checkFlag.in[0] <== flag;
    checkFlag.in[1] <== 1;
    // Enforce that checkFlag.out is 1 (i.e. flag == 1).
    checkFlag.out === 1;

    // Check that the secret key equals the public secret.
    component checkSecret = IsEqual();
    checkSecret.in[0] <== sk;
    checkSecret.in[1] <== pubSecret;
    // Enforce that checkSecret.out is 1 (i.e. sk == pubSecret).
    checkSecret.out === 1;
}

// For testing purposes, expose all three signals as public.
component main { public [sk, flag, pubSecret] } = EmergencyAccess();
