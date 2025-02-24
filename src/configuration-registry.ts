import { IConfigKey } from './types/config-key'
import { IConfigProvider } from './types/config-provider'

export const CONFIG_KEY_METADATA = Symbol('@buka/nestjs-config:config-key')
export const CONFIG_KEY_PROPERTIES_METADATA = Symbol('@buka/nestjs-config:config-key:properties')


export class ConfigurationRegistry {
  private static readonly registry: Array<IConfigProvider> = []

  static registerProvider(provider: IConfigProvider): void {
    this.registry.push(provider)
  }

  static registerProperty(target: object, ck: IConfigKey): void {
    if (typeof target !== 'object' || target === null) return

    if (!Array.isArray(target[CONFIG_KEY_PROPERTIES_METADATA])) {
      target[CONFIG_KEY_PROPERTIES_METADATA] = []
    }

    target[CONFIG_KEY_PROPERTIES_METADATA].push(ck.propertyKey)
    Reflect.defineMetadata(CONFIG_KEY_METADATA, ck, target, ck.propertyKey)
  }

  static getProviders(): Array<IConfigProvider> {
    return [...this.registry]
  }

  static getProperties(target: object): Array<string | symbol> {
    if (typeof target !== 'object' || target === null) return []
    return target[CONFIG_KEY_PROPERTIES_METADATA] || []
  }

  static getConfigKey(target: object, propertyKey: string | symbol): IConfigKey {
    const metadata = Reflect.getMetadata(CONFIG_KEY_METADATA, target, propertyKey)
    if (metadata) return metadata as IConfigKey

    if (typeof propertyKey === 'symbol') {
      return {
        ignore: true,
        propertyKey: propertyKey.toString(),
      }
    }

    return {
      ignore: false,
      propertyKey: propertyKey.toString(),
      configKey: undefined,
    }
  }
}
