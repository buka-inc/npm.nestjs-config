
import { ConfigurationDefinitionRegistry } from '~/configuration-registry'
import { ConfigurationCtor } from '~/types'


/**
 * @deprecated Use `@ConfigKey` instead
 */
export function ConfigName(name: string): PropertyDecorator {
  return (target, propertyKey) => {
    ConfigurationDefinitionRegistry.registerProperty(target as ConfigurationCtor, { exclude: false, propertyKey, bind: name })
  }
}
