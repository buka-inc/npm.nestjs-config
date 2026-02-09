import { Logger } from '@nestjs/common'
import chokidar from 'chokidar'
import { Promisable } from 'type-fest'
import { WatcherDisposer } from '../types/config-loader.js'
import { LoaderWatchOptions } from '../types/loader-watch-options.js'
import { fsExist } from '../utils/fs-exists.js'
import { LoadRawConfigFn } from '../types/config-loader.js'

export interface CreateFileWatcherOptions {
  filepath: string
  watchOptions: LoaderWatchOptions
  loader: LoadRawConfigFn
  loggerName: string
}

/**
 * 创建文件监听器的通用工厂函数
 */
export function createFileWatcher(
  options: CreateFileWatcherOptions,
  onReload: () => Promisable<void>,
): WatcherDisposer {
  const { filepath, watchOptions, loader, loggerName } = options
  const logger = new Logger(loggerName)
  const debounceMs = watchOptions.debounceMs ?? 300
  let debounceTimer: NodeJS.Timeout | undefined

  if (watchOptions.type === 'interval') {
    // 定时轮询模式
    const intervalMs = watchOptions.intervalMs ?? 5000
    let lastMtime: number | undefined

    const checkAndReload = async (): Promise<void> => {
      try {
        if (!await fsExist(filepath)) return

        const stats = await import('fs/promises').then((fs) => fs.stat(filepath))
        const currentMtime = stats.mtimeMs

        if (lastMtime !== undefined && currentMtime !== lastMtime) {
          logger.log(`Config file changed (interval check): ${filepath}`)
          if (watchOptions.onChange) {
            const config = await loader({})
            await watchOptions.onChange(config)
          }
          await onReload()
        }

        lastMtime = currentMtime
      } catch (error) {
        logger.error(`Failed to check file: ${(error as Error).message}`)
        if (watchOptions.onError) {
          await watchOptions.onError(error as Error)
        }
      }
    }

    // 初始化 mtime
    void fsExist(filepath).then(async (exists) => {
      if (exists) {
        const stats = await import('fs/promises').then((fs) => fs.stat(filepath))
        lastMtime = stats.mtimeMs
      }
    })

    const intervalId = setInterval(checkAndReload, intervalMs)

    return () => {
      clearInterval(intervalId)
      logger.log(`Stopped watching ${filepath} (interval)`)
    }
  }

  // 文件系统监听模式（默认）
  const watcher = chokidar.watch(filepath, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 100,
    },
  })

  const scheduleReload = (): void => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    debounceTimer = setTimeout(async () => {
      try {
        logger.log(`Config file changed: ${filepath}`)
        if (watchOptions.onChange) {
          const config = await loader({})
          await watchOptions.onChange(config)
        }
        await onReload()
      } catch (error) {
        logger.error(`Failed to reload ${filepath}: ${(error as Error).message}`)
        if (watchOptions.onError) {
          await watchOptions.onError(error as Error)
        }
      } finally {
        debounceTimer = undefined
      }
    }, debounceMs)
  }

  watcher.on('change', scheduleReload)
  watcher.on('error', (error: unknown) => {
    logger.error(`Watcher error for ${filepath}: ${(error as Error).message}`)
    if (watchOptions.onError) {
      void watchOptions.onError(error as Error)
    }
  })

  return async () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    await watcher.close()
    logger.log(`Stopped watching ${filepath}`)
  }
}
