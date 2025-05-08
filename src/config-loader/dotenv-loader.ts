import { Logger } from '@nestjs/common'
import dotenv from 'dotenv'
import { readFile } from 'fs/promises'
import * as R from 'ramda'
import { ConfigLoader } from '../types/config-loader.interface.js'
import { ConfigModuleOptions } from '../types/config-module-options.interface.js'
import { fsExist } from '../utils/fs-exists.js'
import { parseValue } from '~/utils/parse-value.js'


interface DotenvLoaderOptions {
  /**
   * @default '__'
   */
  separator?: string

  /**
   * @default true
   */
  jsonParse?: boolean
}

export function dotenvLoader(filepath: string, loaderOptions: DotenvLoaderOptions = {}): ConfigLoader {
  const separator = loaderOptions.separator || '__'

  return async (moduleOptions: ConfigModuleOptions) => {
    if (!await fsExist(filepath)) {
      if (!moduleOptions.suppressWarnings) {
        Logger.warn(`env file not found: ${filepath}`, '@buka/nestjs-config/dtoenvLoader')
      }
      return {}
    }

    const content = await readFile(filepath)
    const config = dotenv.parse(content)

    let result = {}

    for (const key of Object.keys(config)) {
      const value = parseValue(config[key], loaderOptions.jsonParse)
      result = R.assocPath(key.split(separator), value, result)
    }

    return result
  }
}
