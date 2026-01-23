import {CopperxClient} from 'copperx-fn'
const COPPERX_API_KEY = process.env.COPPERX_API_KEY
let client: CopperxClient | null = null

export const createClient = () => {
  if (!client) {
    client = new CopperxClient({
      apiKey: COPPERX_API_KEY!,
      baseURL: 'https://api.copperx.io',
    })
  }
  return client
}
