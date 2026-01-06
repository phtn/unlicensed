export const generateOrderRef = (uuid: string): string => {
  const bytes = Buffer.from(uuid.replace(/-/g, ''), 'hex')
  const num = bytes.subarray(0, 6).readUIntBE(0, 6)

  const encoded = num.toString(36).toUpperCase().padStart(10, '0')

  // Group into chunks: XXXX-XXXX-XX
  // Example: "8K2N-5P7Q-9R"
  return encoded.match(/.{1,4}/g)?.join('-') || encoded
}
