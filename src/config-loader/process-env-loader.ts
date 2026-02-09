import * as R from 'ramda'
import { LoadRawConfigFn } from '../types/config-loader.js'
import { parseValue } from '~/utils/parse-value.js'


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

export function processEnvLoader(loaderOptions: ProcessEnvLoaderOptions = {}): LoadRawConfigFn {
  const separator = loaderOptions.separator || '__'

  return () => {
    let config = {}

    for (const key of Object.keys(process.env)) {
      const value = parseValue(process.env[key], loaderOptions.jsonParse)
      config = R.assocPath(key.split(separator), value, config)
    }

    return config
  }
}
