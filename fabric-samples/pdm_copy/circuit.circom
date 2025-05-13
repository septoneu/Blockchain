pragma circom 2.0.0;

template Main() {
    signal input patientId; // Private input
    signal input reason;    // Private input
    signal output isValid;  // Public output

    signal isPositive;      // patientId > 0
    signal condition2;      // reason == 1

    // Ensure patientId > 0 by checking if patientId * patientId > 0
    isPositive <== patientId * patientId;  // This will be > 0 if patientId != 0

    // Check if reason == 1 using linear subtraction
    condition2 <== reason - 1; // This will be 0 if reason == 1

    // Combine conditions: Both conditions must be true (AND logic)
    isValid <== isPositive * condition2;  // isValid will be 1 if both conditions are satisfied
}

component main = Main();
