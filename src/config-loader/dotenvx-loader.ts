import { Logger } from '@nestjs/common'
import dotenvx from '@dotenvx/dotenvx'
import { readFile } from 'fs/promises'
import * as R from 'ramda'
import { ConfigLoader } from '../types/config-loader.interface.js'
import { ConfigModuleOptions } from '../types/config-module-options.interface.js'
import { fsExist } from '../utils/fs-exists.js'


interface DotenvLoaderOptions {
  /**
   * @default '__'
   */
  separator?: string

  /**
   * @default true
   */
  jsonParse?: boolean

  /**
   * See More: https://dotenvx.com/docs/advanced/parse-process-env
   */
  processEnv?: Record<string, string>

  /**
   * See More: https://dotenvx.com/docs/advanced/parse-private-key
   */
  privateKey?: string
}

export function dotenvxLoader(filepath: string, options: DotenvLoaderOptions = {}): ConfigLoader {
  const separator = options.separator || '__'
  const jsonParse = options.jsonParse || true
  const processEnv = options.processEnv
  const privateKey = options.privateKey


  return async (options: ConfigModuleOptions) => {
    if (!await fsExist(filepath)) {
      if (!options.suppressWarnings) {
        Logger.warn(`env file not found: ${filepath}`)
      }
      return {}
    }

    const content = await readFile(filepath)
    const config = dotenvx.parse(content, { processEnv, privateKey })

    let result = {}

    for (const key of Object.keys(config)) {
      let value = config[key]
      if (jsonParse && typeof value === 'string') {
        try {
          value = JSON.parse(value)
        } catch (e) {
        // ignore
        }
      }
      result = R.assocPath(key.split(separator), value, result)
    }

    return result
  }
}
