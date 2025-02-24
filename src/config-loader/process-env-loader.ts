import * as R from 'ramda'
import { ConfigLoader } from '../types/config-loader.interface.js'


interface ProcessEnvLoaderOptions {
  /**
   * @default '__'
   */
  separator?: string

  /**
   * @default true
   */
  jsonParse?: boolean
}

export function processEnvLoader(options: ProcessEnvLoaderOptions = {}): ConfigLoader {
  const separator = options.separator || '__'
  const jsonParse = options.jsonParse || true

  return () => {
    let config = {}

    for (const key of Object.keys(process.env)) {
      let value = process.env[key]
      if (jsonParse && typeof value === 'string') {
        try {
          value = JSON.parse(value)
        } catch (e) {
        // ignore
        }
      }

      config = R.assocPath(key.split(separator), value, config)
    }

    return config
  }
}
