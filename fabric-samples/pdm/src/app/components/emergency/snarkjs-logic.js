import * as snarkjs from 'snarkjs';
window.generateEmergencyProofGlobal = async function(emergencySecret, publicSecret) {
    const emergencyInput = {
      sk: emergencySecret,
      flag: '1',
      pubSecret: publicSecret
    };
  
    // Call snarkjs methods here
    try {
      const result = await snarkjs.groth16.fullProve(
        emergencyInput,
        'assets/EmergencyAccess.wasm',
        'assets/EmergencyAccess_final.zkey'
      );
      return {
        proof: result.proof,
        publicSignals: result.publicSignals
      };
    } catch (error) {
      console.error('Error generating emergency proof (external JS):', error);
      throw error;
    }
  };