
import { ConfigurationDefinitionRegistry } from '~/configuration-registry'
import { ConfigurationCtor } from '~/types'


export function ConfigKey(key?: string): PropertyDecorator {
  return (target, propertyKey) => {
    if (typeof propertyKey === 'symbol' && typeof key !== 'string') {
      throw new Error('[@buka/nestjs-config] @ConfigKey("YOUR_KEY") must be set, if the property key of the class is a symbol')
    }

    ConfigurationDefinitionRegistry.registerProperty(target as ConfigurationCtor, { propertyKey, bind: key, exclude: false })
  }
}
