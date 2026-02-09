
import { Promisable } from 'type-fest'


export interface LoadRawConfigFnOptions {
  suppressWarnings?: true
  debug?: true
}

/**
 * 配置加载器函数
 */
export type LoadRawConfigFn = (options: LoadRawConfigFnOptions) => Promisable<Record<string, any>>

/**
 * 静态配置加载器
 */
export interface StaticConfigLoader {
  load: LoadRawConfigFn
}

/**
 * watcher 清理函数
 */
export type WatcherDisposer = () => void | Promise<void>

/**
 * 可监听的配置加载器
 */
export interface WatchableConfigLoader extends StaticConfigLoader {
  startWatch?: (reload: () => Promise<void>) => WatcherDisposer
}


export type ConfigLoader = StaticConfigLoader | WatchableConfigLoader

