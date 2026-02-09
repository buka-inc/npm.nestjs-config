import * as R from 'ramda'
import { RuntimeConfig } from './runtime-config'
import { ConfigurationCtor, ConfigurationDefinition, ConfigurationProperty } from './types'
import { ConfigurationDefinitionRegistry } from './configuration-registry'
import { instanceToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { Logger } from '@nestjs/common'
import { RESET_COLOR } from './constants'
import { inspect } from 'util'
import { MergedConfig } from './raw-config-registry'
import { logger } from './utils/logger'


export class ConfigurationFactory {
  private static instances = new Map<ConfigurationCtor, InstanceType<ConfigurationCtor>>()

  /**
   * 原地更新实例属性
   */
  private static updateInstanceProperties(target: any, source: any): void {
    // 删除 target 中不存在于 source 的属性
    for (const key of Object.keys(target)) {
      if (!(key in source)) {
        delete target[key]
      }
    }

    // 更新/添加属性
    for (const key of Object.keys(source)) {
      target[key] = source[key]
    }
  }


  /**
   * 构建配置提供者实例（核心逻辑，不包含缓存）
   */
  static async build(
    rc: RuntimeConfig,
    raw: MergedConfig,
    definition: ConfigurationDefinition,
  ): Promise<any> {
    const DefinitionCtor = definition.ctor
    const scopedRaw = raw.extract(definition.scope)

    const instance: typeof DefinitionCtor = new DefinitionCtor()

    function set(property: string | symbol, value: any): void {
      if (value !== undefined) instance[property] = value
    }

    const propertyMap = new Map<string | symbol, ConfigurationProperty>(
      ConfigurationDefinitionRegistry.getProperties(instance)
        .map((prop) => <const>[prop.propertyKey, prop]),
    )

    const propertyKeys = R.uniq([
      ...Object.getOwnPropertyNames(instance),
      ...propertyMap.keys(),
    ])
      .filter((key) => {
        const property = propertyMap.get(key)
        if (property && property.exclude) return false
        if (typeof key === 'symbol') return false
        return true
      })

    for (const propertyKey of propertyKeys) {
      const property = propertyMap.has(propertyKey)
        ? propertyMap.get(propertyKey)!
        : { exclude: false, propertyKey }

      if (property.bind) {
        set(propertyKey, raw.extract(property.bind))
      } else if (scopedRaw && typeof property.propertyKey === 'string') {
        set(propertyKey, scopedRaw.extract(property.propertyKey))
      }
    }

    const result = instanceToInstance(instance)
    const errors = await validate(result)

    if (errors.length) {
      const message = errors
        .map((error) => {
          let message = `An instance of ${DefinitionCtor.name} has failed the validation:\n`
          for (const constraint in error.constraints) {
            message += `  - Property: \`${error.property}\`\n`
            message += `    Value: ${JSON.stringify(error.value)}\n`
            message += `    Constraint: ${constraint}\n`
            message += `    Expect: ${error.constraints[constraint]}\n`
          }

          return message
        })
        .join('\n')

      throw new Error(message)
    }

    if (rc.debug) {
      Logger.debug(`${DefinitionCtor.name} initialized${RESET_COLOR}\n${inspect(result, false, null, true)}`, '@buka/nestjs-config')
    }

    return result
  }

  /**
   * 创建配置提供者（带缓存）
   */
  static async create<T extends ConfigurationDefinition>(rc: RuntimeConfig, raw: MergedConfig, definition: T): Promise<InstanceType<T['ctor']>> {
    const DefinitionCtor = definition.ctor
    if (this.instances.has(DefinitionCtor)) return this.instances.get(DefinitionCtor)!

    try {
      const result = await this.build(rc, raw, definition)
      this.instances.set(DefinitionCtor, result)
      return result
    } catch (error) {
      logger.error((error as Error).message)

      throw error
    }
  }


  static async compile(rc: RuntimeConfig, raw: MergedConfig): Promise<Map<ConfigurationCtor, object>> {
    const definitions = ConfigurationDefinitionRegistry.getAll()

    const store = new Map<ConfigurationCtor, object>()
    for (const definition of definitions) {
      try {
        const instance = await this.build(rc, raw, definition)
        store.set(definition.ctor, instance)
      } catch (error) {
        logger.error(`Failed to create provider ${definition.ctor.name}: ${(error as Error).message}`)
        throw error
      }
    }

    return store
  }

  /**
   * 重新加载配置
   */
  static async reload(rc: RuntimeConfig, raw: MergedConfig): Promise<void> {
    try {
      const newInstanceStore = await this.compile(rc, raw)

      // Step 3: 原地更新现有实例的属性
      for (const [DefinitionCtor, newInstance] of newInstanceStore.entries()) {
        const oldInstance = this.instances.get(DefinitionCtor)
        this.updateInstanceProperties(oldInstance, newInstance)
      }

      logger.log('Configuration reloaded successfully')
    } catch (error) {
      logger.error(`Configuration reload failed: ${(error as Error).message}`)

      // 不抛出错误，避免影响应用运行
    }
  }

  static get<T extends ConfigurationCtor>(ConfigProviderClass: T): InstanceType<T> | undefined {
    return this.instances.get(ConfigProviderClass)
  }
}
