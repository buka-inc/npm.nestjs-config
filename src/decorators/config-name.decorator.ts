
import { ConfigurationRegistry } from '~/configuration-registry'


/**
 * @deprecated Use `@ConfigKey` instead
 */
export function ConfigName(name: string): PropertyDecorator {
  return (target, propertyKey) => {
    ConfigurationRegistry.registerProperty(target, { ignore: false, propertyKey, configKey: name })
  }
}
