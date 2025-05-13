import seal
from seal import BFVParameters, SEALContext, KeyGenerator, Encryptor, Decryptor, IntegerEncoder, Plaintext, Ciphertext
import requests

# Fetch data from the endpoint
response = requests.get("http://main.infili.com:5001/readPatientData")
data = response.json()["patient"]

# Set up SEAL BFV environment
parms = BFVParameters(poly_modulus_degree=4096)
parms.set_coeff_modulus(seal.coeff_modulus_128(4096))
parms.set_plain_modulus(256)

context = SEALContext.Create(parms)
keygen = KeyGenerator(context)
public_key = keygen.public_key()
secret_key = keygen.secret_key()
encryptor = Encryptor(context, public_key)
decryptor = Decryptor(context, secret_key)
encoder = IntegerEncoder(context)

# Function to encrypt TAG data
def encrypt_tag_data(tag_value):
    plaintext = encoder.encode(tag_value)
    ciphertext = Ciphertext()
    encryptor.encrypt(plaintext, ciphertext)
    return ciphertext

encrypted_tags = []

# Encrypt TAG field for each patient
for patient in data:
    tag_value = patient.get("TAG")
    if tag_value is not None:  # Ensure there's a TAG value
        encrypted_tag = encrypt_tag_data(tag_value)
        # For demonstration, we'll just show the size of the encrypted data.
        # PySEAL doesn't directly support converting ciphertexts to strings easily.
        encrypted_tags.append(encrypted_tag.size())

print("Encrypted TAG values (ciphertext sizes shown for demonstration):")
print(encrypted_tags)

# Note: In a real scenario, you'd need to handle the encrypted data appropriately.
# This might involve storing the ciphertexts for later computation or decryption.
