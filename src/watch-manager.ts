import { Inject, Injectable, Logger, LoggerService, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { WatcherDisposer, WatchableConfigLoader, ConfigLoader } from './types'
import { MODULE_RUNTIME_CONFIG_TOKEN } from './constants'
import { RuntimeConfig } from './runtime-config'
import { RawConfigRegistry } from './raw-config-registry'
import { ConfigurationFactory } from './configuration-factory'

/**
 * 配置监听管理器
 * 负责管理所有文件监听器
 */
@Injectable()
export class WatchManager implements OnModuleInit, OnModuleDestroy {
  private watchers = new Map<ConfigLoader, WatcherDisposer>()
  private readonly logger: LoggerService

  constructor(
    @Inject(MODULE_RUNTIME_CONFIG_TOKEN) private readonly rc: RuntimeConfig,
  ) {
    this.logger = new Logger(WatchManager.name)
  }

  /**
   * 模块初始化时启动配置监听
   */
  async onModuleInit(): Promise<void> {
    await this.startWatching()
  }

  /**
   * 模块销毁时停止配置监听
   */
  async onModuleDestroy(): Promise<void> {
    await this.stopWatching()
  }

  /**
   * 启动配置监听
   */
  private async startWatching(): Promise<void> {
    const loaders = this.rc.loaders

    for (const loader of loaders) {
      if (this.isWatchable(loader) && loader.startWatch) {
        try {
          const disposer = loader.startWatch(async () => await this.reloadConfiguration(loader))
          this.watchers.set(loader, disposer)
        } catch (error) {
          this.logger.error(
            `Failed to start watching loader: ${(error as Error).message}`,
            (error as Error).stack,
          )
        }
      }
    }

    if (this.watchers.size > 0) {
      this.logger.log(`Started watching ${this.watchers.size} configuration source(s)`)
    }
  }

  /**
   * 重新加载配置
   * @param loader - 触发变更的 loader，如果提供则仅重新加载该 loader
   */
  private async reloadConfiguration(loader?: ConfigLoader): Promise<void> {
    // 重新加载配置（传入 loader 则仅重新加载该 loader，否则重新加载所有）
    await RawConfigRegistry.reload(loader)
    const raw = RawConfigRegistry.read()
    await ConfigurationFactory.reload(this.rc, raw)
  }

  /**
   * 停止所有配置监听
   */
  private async stopWatching(): Promise<void> {
    if (this.watchers.size === 0) {
      return
    }

    this.logger.log('Stopping all configuration watchers')

    // 清理所有 watchers
    await Promise.all(
      Array.from(this.watchers.values()).map(async (disposer) => {
        try {
          await disposer()
        } catch (error) {
          this.logger.error(
            `Failed to dispose watcher: ${(error as Error).message}`,
          )
        }
      }),
    )

    this.watchers.clear()
    this.logger.log('All configuration watchers stopped')
  }

  /**
   * 类型守卫：检查 loader 是否可监听
   * @param loader - 配置加载器
   */
  private isWatchable(loader: ConfigLoader): loader is WatchableConfigLoader {
    return (
      loader !== null &&
      typeof loader === 'object' &&
      'load' in loader &&
      'startWatch' in loader
    )
  }
}
