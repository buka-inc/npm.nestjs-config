import { Logger } from '@nestjs/common'
import dotenv from 'dotenv'
import { readFile } from 'fs/promises'
import * as R from 'ramda'
import { ConfigLoader } from '../types/config-loader.interface.js'
import { ConfigModuleOptions } from '../types/config-module-options.interface.js'
import { fsExist } from '../utils/fs-exists.js'


interface DotenvLoaderOptions {
  separator?: string
  jsonParse?: boolean
}

export function dotenvLoader(filepath: string, options: DotenvLoaderOptions = {}): ConfigLoader {
  const separator = options.separator || '__'
  const jsonParse = options.jsonParse || true

  return async (options: ConfigModuleOptions) => {
    if (!await fsExist(filepath)) {
      if (!options.suppressWarnings) {
        Logger.warn(`env file not found: ${filepath}`)
      }
      return {}
    }

    const content = await readFile(filepath)
    const config = dotenv.parse(content)

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
