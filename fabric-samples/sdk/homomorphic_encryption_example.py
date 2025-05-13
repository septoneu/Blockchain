
import tenseal as ts

# Create a TenSEAL context
context = ts.context(ts.SCHEME_TYPE.CKKS, poly_modulus_degree=8192, coeff_mod_bit_sizes=[60, 40, 40, 60])

# Set a global scale
global_scale = 2**40
context.global_scale = global_scale

# Generate encryption keys
secret_key = context.secret_key()
public_key = context.public_key()

# Encrypt plaintext
plain_text = [1.0, 2.0, 3.0, 4.0]
encrypted_data = ts.ckks_vector(context, plain_text)

# Print the encrypted data
print("Encrypted Data:")
print(encrypted_data)

# Perform homomorphic operations (e.g., addition, multiplication)

# Decrypt the result
decrypted_data = encrypted_data.decrypt(secret_key)

# Print the original and decrypted data
print("Original Data:", plain_text)
print("Decrypted Data:", decrypted_data)
