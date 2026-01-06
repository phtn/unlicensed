import {useCallback} from 'react'
import {uuidv7 as v7} from 'uuidv7'

export const useRefGen = () => {
  const generateOrderRef = (uuid: string): string => {
    const bytes = Buffer.from(uuid.replace(/-/g, ''), 'hex')
    const num = bytes.subarray(0, 6).readUIntBE(0, 6)
    const encoded = num.toString(36).toUpperCase().padStart(10, '0')
    return encoded.match(/.{1,4}/g)?.join('-') || encoded
    // "8K2N-5P7Q-9R"
  }

  const generateRefPair = useCallback(() => {
    const newUuid = v7()
    const newRefNum = generateOrderRef(newUuid)
    return {uuid: newUuid, refNum: newRefNum}
  }, [])

  return {generateRefPair}
}
