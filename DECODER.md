# 1. First, decode the base64 content
base64 -D -i encoded.txt > decoded.bin

# 2. Extract IV (Initialization Vector)
head -c 16 decoded.bin > iv.bin

# 3. Extract encrypted data (remaining bytes)
tail -c +17 decoded.bin > encrypted.bin

# 4. Generate key from your password (replace YOUR_PASSWORD with actual password)
echo -n "YOUR_PASSWORD" | openssl dgst -sha256 -binary > key.bin

# 5. Decrypt the data
openssl enc -aes-256-cbc -d \
  -in encrypted.bin \
  -K $(xxd -p -c 64 key.bin) \
  -iv $(xxd -p -c 32 iv.bin)

# 6. Clean up
rm decoded.bin iv.bin encrypted.bin key.bin
