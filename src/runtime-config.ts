import { Type } from '@nestjs/common'
import { dotenvLoader } from './config-loader/dotenv-loader.js'
import { processEnvLoader } from './config-loader/process-env-loader.js'
import { ConfigModuleOptions, ConfigLoader, WatchableConfigLoader, LoadRawConfigFn } from './types'

/**
 * Normalized configuration options object
 * Automatically normalizes and merges options on construction
 */
export class RuntimeConfig {
  /**
   * Global options used as defaults for all ConfigOption instances
   */
  private static globalOptions: ConfigModuleOptions | null = null

  /**
   * Normalized loaders in WatchableConfigLoader format
   */
  readonly loaders: ConfigLoader[]

  /**
   * Provider classes
   */
  readonly providers?: Type[]

  /**
   * Suppress warnings flag
   */
  readonly suppressWarnings?: true

  /**
   * Debug mode flag
   */
  readonly debug?: true

  /**
   * Set global options that will be used as defaults
   */
  static setGlobal(options: ConfigModuleOptions): void {
    RuntimeConfig.globalOptions = options
  }

  /**
   * Get current global options
   */
  static getGlobal(): ConfigModuleOptions | null {
    return RuntimeConfig.globalOptions
  }

  /**
   * Reset global options (useful for testing)
   */
  static resetGlobal(): void {
    RuntimeConfig.globalOptions = null
  }

  /**
   * Normalize loaders to unified WatchableConfigLoader format
   */
  private static normalizeLoaders(loaders?: (string | LoadRawConfigFn | WatchableConfigLoader)[]): WatchableConfigLoader[] {
    const rawLoaders = loaders || [processEnvLoader(), '.env']
    return rawLoaders.map((loader) => {
      if (typeof loader === 'string') {
        // 字符串转为 dotenvLoader
        return dotenvLoader(loader)
      }
      // 如果是旧的 ConfigLoader 函数，包装为 WatchableConfigLoader
      if (typeof loader === 'function') {
        return { load: loader } as WatchableConfigLoader
      }
      // 已经是 WatchableConfigLoader
      return loader as WatchableConfigLoader
    })
  }

  /**
   * Constructor that automatically normalizes and merges options
   * @param options - Raw configuration options
   */
  constructor(options: ConfigModuleOptions = {}) {
    const global = RuntimeConfig.globalOptions

    if (!global) {
      // 无全局配置，只需标准化当前配置
      this.loaders = RuntimeConfig.normalizeLoaders(options.loaders)
      this.providers = options.providers
      this.suppressWarnings = options.suppressWarnings
      this.debug = options.debug
    } else {
      // 合并全局配置和当前配置
      this.loaders = RuntimeConfig.normalizeLoaders(options.loaders ?? global.loaders)
      this.providers = options.providers ?? global.providers
      this.suppressWarnings = options.suppressWarnings ?? global.suppressWarnings
      this.debug = options.debug ?? global.debug
    }
  }
}
