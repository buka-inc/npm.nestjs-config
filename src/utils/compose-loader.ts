import { ConfigLoader } from '~/types/config-loader.interface.js'
import { deepMergeAll } from './deep-merge-all.js'

export function composeLoader(loaders: ConfigLoader[]): ConfigLoader {
  return async (options) => {
    const configs = await Promise.all(loaders.map((loader) => loader(options)))
    return deepMergeAll(configs)
  }
}
