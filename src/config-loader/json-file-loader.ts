import { Logger } from '@nestjs/common'
import { readFile } from 'fs/promises'
import { ConfigLoader } from '~/types/config-loader.interface.js'
import { ConfigModuleOptions } from '~/types/config-module-options.interface.js'
import { fsExist } from '../utils/fs-exists.js'


export function jsonFileLoader(filepath: string, encoding: BufferEncoding = 'utf-8'): ConfigLoader {
  return async (options: ConfigModuleOptions) => {
    if (!await fsExist(filepath)) {
      if (!options.suppressWarnings) {
        Logger.warn(`env file not found: ${filepath}`)
      }
      return {}
    }

    const content = await readFile(filepath)
    return JSON.parse(content.toString(encoding)) as Record<string, string>
  }
}
