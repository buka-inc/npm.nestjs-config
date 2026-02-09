/**
 * 配置加载器的监听选项
 */
export interface LoaderWatchOptions {
  /**
   * 监听类型
   * - 'watch': 使用文件系统监听（chokidar）
   * - 'interval': 使用定时轮询
   * @default 'watch'
   */
  type?: 'watch' | 'interval'

  /**
   * 防抖时间（毫秒）
   * 防止短时间内多次触发重载
   * @default 300
   */
  debounceMs?: number

  /**
   * 定时轮询间隔（毫秒）
   * 仅在 type='interval' 时有效
   * @default 5000
   */
  intervalMs?: number

  /**
   * 配置变化时的回调
   * 在配置重载前调用
   */
  onChange?: (newConfig: Record<string, any>) => void | Promise<void>

  /**
   * 错误处理回调
   */
  onError?: (error: Error) => void | Promise<void>
}

/**
 * Loader 的热重载配置
 * - true: 使用默认配置启用监听
 * - LoaderWatchOptions: 使用自定义配置
 * - false/undefined: 不启用监听
 */
export type HotReloadConfig = boolean | LoaderWatchOptions
