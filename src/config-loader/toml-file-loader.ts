import { Logger } from '@nestjs/common'
import { readFile } from 'fs/promises'
import { ConfigLoader } from '~/types/config-loader.interface.js'
import { ConfigModuleOptions } from '~/types/config-module-options.interface.js'
import { fsExist } from '../utils/fs-exists.js'
import { parse } from 'smol-toml'

export function tomlFileLoader(filepath: string): ConfigLoader {
  return async (options: ConfigModuleOptions) => {
    if (!await fsExist(filepath)) {
      if (!options.suppressWarnings) {
        Logger.warn(`env file not found: ${filepath}`)
      }
      return {}
    }

    const content = await readFile(filepath)
    return parse(content.toString())
    // return JSON.parse(content.toString(encoding)) as Record<string, string>
  }
}
