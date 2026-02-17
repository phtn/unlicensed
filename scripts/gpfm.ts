import * as bip39 from 'bip39'
import HDKey from 'hdkey'

type Chain = 'ethereum' | 'bitcoin_legacy' | 'bitcoin_segwit' | 'solana'

const DERIVATION_PATHS: Record<Chain, string> = {
  ethereum: "m/44'/60'/0'/0/0",
  bitcoin_legacy: "m/44'/0'/0'/0/0",
  bitcoin_segwit: "m/84'/0'/0'/0/0",
  solana: "m/44'/501'/0'/0'",
}

function gpfm(
  mnemonic: string,
  chain: Chain,
  accountIndex: number = 0,
): string {
  if (!bip39.validateMnemonic(mnemonic)) {
    console.error('Invalid mnemonic phrase')
    return ''
  }

  const basePath = DERIVATION_PATHS[chain]
  const derivationPath = basePath.replace(/\/0$/, `/${accountIndex}`)

  const seed: Buffer = bip39.mnemonicToSeedSync(mnemonic)
  const root: HDKey = HDKey.fromMasterSeed(seed)
  const child: HDKey = root.derive(derivationPath)

  if (!child.privateKey) {
    throw new Error(`Failed to derive private key for chain: ${chain}`)
  }

  return child.privateKey.toString('hex')
}

// Example usage
const mnemonic =
  'pottery avocado bar sign wolf enforce orient baby stage leg garbage click'

const ethKey = gpfm(mnemonic, 'ethereum')
const btcKey = gpfm(mnemonic, 'bitcoin_segwit')
const btcLeg = gpfm(mnemonic, 'bitcoin_legacy')
const solKey = gpfm(mnemonic, 'solana')
const ethAccount2 = gpfm(mnemonic, 'ethereum', 1)

// console.log('ETH Private Key:', ethKey)
// console.log('BTC Legacy Key:', btcLeg)
console.log('BTC Private Key:', btcKey)
// console.log('SOL Private Key:', solKey)
// console.log('ETH Account 2:', ethAccount2)
