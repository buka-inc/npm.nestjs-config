import objectPath from 'object-path'
import { toCamelCase } from './utils/to-camel-case'
import { objectKeysToCamelCase } from './utils/object-keys-to-camel-case'
import { deepMergeAll } from './utils/deep-merge-all'
import { RuntimeConfig } from './runtime-config'
import { ConfigLoader, LoadRawConfigFnOptions } from './types'

/**
 * 配置片段，记录每个 loader 加载的原始配置
 */
interface ConfigFragment {
  loader: ConfigLoader
  rawData: Record<string, any>
  normalizedData: Record<string, any>
}

/**
 * 合并后的配置对象
 * 提供便捷的查询和提取方法
 */
export class MergedConfig {
  /**
   * 原始配置数据
   */
  readonly data: Record<string, any>

  /**
   * 构造函数
   * @param data - 配置数据
   */
  constructor(data: Record<string, any>) {
    this.data = data
  }

  /**
   * 根据路径查询配置值
   * @param path - 配置路径，支持点分隔的嵌套路径
   * @returns 配置值
   */
  path(path: string): any {
    return objectPath.get(this.data, toCamelCase(path))
  }

  /**
   * 提取指定作用域的配置
   * @param scope - 作用域名称
   * @returns 新的 MergedConfig 实例
   */
  extract(scope: string): MergedConfig {
    const scopedData = this.data[scope] || {}
    return new MergedConfig(scopedData)
  }
}

/**
 * 原始配置注册表（静态类）
 * 全局管理所有 loader 的配置片段
 */
export class RawConfigRegistry {
  /**
   * 配置片段注册表，以 loader 为索引
   */
  private static fragments = new Map<ConfigLoader, ConfigFragment>()

  /**
   * 运行时配置选项缓存
   */
  private static runtimeConfigOptions: LoadRawConfigFnOptions = {}

  /**
   * 私有构造函数，禁止实例化
   */
  private constructor() {
    throw new Error('RawConfigRegistry is a static class and cannot be instantiated')
  }

  /**
   * 加载 RuntimeConfig 中的所有 loaders
   * @param rc - RuntimeConfig 实例
   */
  static async load(rc: RuntimeConfig): Promise<void> {
    // 设置运行时配置选项
    this.runtimeConfigOptions = {
      debug: rc.debug,
      suppressWarnings: rc.suppressWarnings,
    }

    // 使用 Set 去重
    const uniqueLoaders = Array.from(new Set(rc.loaders))

    // 加载所有 loaders
    await Promise.all(
      uniqueLoaders.map((loader) => {
        // 如果 loader 已存在，跳过不加载
        if (this.fragments.has(loader)) {
          return Promise.resolve()
        }
        return this.reloadFragment(loader)
      }),
    )
  }

  /**
   * 重新加载配置
   * @param loader - 要重新加载的 loader，如果未指定则重新加载所有 loaders
   */
  static async reload(loader?: ConfigLoader): Promise<void> {
    if (loader) {
      // 重新加载指定的 loader
      await this.reloadFragment(loader)
    } else {
      // 重新加载所有 loaders
      const loaders = Array.from(this.fragments.keys())
      await Promise.all(loaders.map((l) => this.reloadFragment(l)))
    }
  }

  /**
   * 读取合并后的配置
   * @param rc - RuntimeConfig 实例，如果指定则读取该 rc 中 loaders 的配置，否则读取所有已注册的 loaders
   * @returns MergedConfig 实例
   */
  static read(rc?: RuntimeConfig): MergedConfig {
    const targetLoaders = rc ? rc.loaders : Array.from(this.fragments.keys())

    const normalizedDataList = targetLoaders
      .map((loader) => this.fragments.get(loader))
      .filter((fragment): fragment is ConfigFragment => fragment !== undefined)
      .map((fragment) => fragment.normalizedData)

    const mergedData = deepMergeAll(normalizedDataList)
    return new MergedConfig(mergedData)
  }

  /**
   * 重新加载单个 loader 的配置片段
   */
  private static async reloadFragment(loader: ConfigLoader): Promise<void> {
    const rawData = await loader.load(this.runtimeConfigOptions)
    const normalizedData = objectKeysToCamelCase(rawData)

    this.fragments.set(loader, {
      loader,
      rawData,
      normalizedData,
    })
  }
}
