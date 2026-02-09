import { Logger } from '@nestjs/common'
import { readFile } from 'fs/promises'
import { Promisable } from 'type-fest'
import { LoadRawConfigFn } from '~/types/config-loader.js'
import { ConfigModuleOptions } from '~/types/config-module-options.js'
import { fsExist } from '../utils/fs-exists.js'
import { parse } from 'smol-toml'
import { WatchableConfigLoader, WatcherDisposer } from '../types/config-loader.js'
import { HotReloadConfig, LoaderWatchOptions } from '../types/loader-watch-options.js'
import { createFileWatcher } from './create-file-watcher.js'

interface TomlFileLoaderOptions {
  /**
   * 热重载配置
   */
  hotReload?: HotReloadConfig
}

export function tomlFileLoader(
  filepath: string,
  encoding: BufferEncoding = 'utf-8',
  options: TomlFileLoaderOptions = {},
): WatchableConfigLoader {
  const hotReload = normalizeWatchOptions(options.hotReload)

  const load: LoadRawConfigFn = async (moduleOptions: ConfigModuleOptions) => {
    if (!await fsExist(filepath)) {
      if (!moduleOptions.suppressWarnings) {
        Logger.warn(`toml file not found: ${filepath}`, '@buka/nestjs-config')
      }
      return {}
    }

    const content = await readFile(filepath)
    return parse(content.toString(encoding))
  }

  if (!hotReload) {
    return { load }
  }

  const startWatch = (onReload: () => Promisable<void>): WatcherDisposer => createFileWatcher(
    {
      filepath,
      watchOptions: hotReload,
      loader: load,
      loggerName: 'TomlFileLoader',
    },
    onReload,
  )

  return { load, startWatch }
}

function normalizeWatchOptions(config?: HotReloadConfig): LoaderWatchOptions | null {
  if (!config) return null
  if (config === true) return { type: 'watch' }
  return config
}
