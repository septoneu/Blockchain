import tenseal as ts
import utils

# Setup TenSEAL context
context = ts.context(
            ts.SCHEME_TYPE.CKKS,
            poly_modulus_degree=8192,
            coeff_mod_bit_sizes=[60, 40, 40, 60]
          )
context.generate_galois_keys()
context.global_scale = 2**40

secret_context = context.serialize(save_secret_key=True)
# print(secret_context)

context.make_context_public()
public_context = context.serialize()
# print(public_context)

v1 = [0, 1, 2, 3, 4]
v2 = [4, 3, 2, 1, 0]
num1 = [25]

# encrypted vectors
enc_v1 = ts.ckks_vector(context, num1)
enc_v2 = ts.ckks_vector(context, v2)

print(enc_v1.serialize())


# result = enc_v1 + enc_v2
# result.decrypt() # ~ [4, 4, 4, 4, 4]

# print("Decrypted: ", result.decrypt())

# result = enc_v1.dot(enc_v2)
# result.decrypt() # ~ [10]

# matrix = [
#   [73, 0.5, 8],
#   [81, -5, 66],
#   [-100, -78, -2],
#   [0, 9, 17],
#   [69, 11 , 10],
# ]
# result = enc_v1.matmul(matrix)
# result.decrypt() # ~ [157, -90, 153]