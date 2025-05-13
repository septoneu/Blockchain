from lightphe import LightPHE
# build an additively homomorphic cryptosystem
cs = LightPHE(algorithm_name = "Paillier")

private_key = cs.cs.keys['private_key']

public_key = cs.cs.keys['public_key']
# define plaintexts
m1 = 17
m2 = 23

# calculate ciphertexts
c1 = cs.encrypt(m1)
c2 = cs.encrypt(m2)
print(c1)
print(c2)
# homomorphic addition - private key is not required!
c3 = c1 + c2
print(c3)

# proof of work
print(cs.decrypt(c3) == m1 + m2)