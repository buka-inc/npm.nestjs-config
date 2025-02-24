
import { ConfigurationRegistry } from '~/configuration-registry'


export function ConfigKey(key?: string): PropertyDecorator {
  return (target, propertyKey) => {
    if (typeof propertyKey === 'symbol' && typeof key !== 'string') {
      throw new Error('[@buka/nestjs-config] @ConfigKey("YOUR_KEY") must be set, if the property key of the class is a symbol')
    }

    ConfigurationRegistry.registerProperty(target, { propertyKey, configKey: key, ignore: false })
  }
}
