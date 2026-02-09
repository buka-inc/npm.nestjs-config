import { Logger } from '@nestjs/common'
import dotenv from 'dotenv'
import { readFile } from 'fs/promises'
import * as R from 'ramda'
import { Promisable } from 'type-fest'
import { LoadRawConfigFn } from '../types/config-loader.js'
import { ConfigModuleOptions } from '../types/config-module-options.js'
import { fsExist } from '../utils/fs-exists.js'
import { parseValue } from '~/utils/parse-value.js'
import { WatchableConfigLoader, WatcherDisposer } from '../types/config-loader.js'
import { HotReloadConfig, LoaderWatchOptions } from '../types/loader-watch-options.js'
import { createFileWatcher } from './create-file-watcher.js'


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
   * 热重载配置
   * - true: 使用默认配置启用文件监听
   * - LoaderWatchOptions: 自定义监听配置
   * - false/undefined: 不启用监听
   */
  hotReload?: HotReloadConfig
}

export function dotenvLoader(filepath: string, loaderOptions: DotenvLoaderOptions = {}): WatchableConfigLoader {
  const separator = loaderOptions.separator || '__'
  const jsonParse = loaderOptions.jsonParse ?? true
  const hotReload = normalizeWatchOptions(loaderOptions.hotReload)

  const load: LoadRawConfigFn = async (moduleOptions: ConfigModuleOptions) => {
    if (!await fsExist(filepath)) {
      if (!moduleOptions.suppressWarnings) {
        Logger.warn(`env file not found: ${filepath}`, '@buka/nestjs-config/dotenvLoader')
      }
      return {}
    }

    const content = await readFile(filepath)
    const config = dotenv.parse(content)

    let result = {}

    for (const key of Object.keys(config)) {
      const value = parseValue(config[key], jsonParse)
      result = R.assocPath(key.split(separator), value, result)
    }

    return result
  }

  // 如果没有启用热重载，直接返回
  if (!hotReload) {
    return { load }
  }

  // 实现 startWatch 方法
  const startWatch = (onReload: () => Promisable<void>): WatcherDisposer => createFileWatcher(
    {
      filepath,
      watchOptions: hotReload,
      loader: load,
      loggerName: 'DotenvLoader',
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
