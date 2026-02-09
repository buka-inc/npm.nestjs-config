import { Type } from '@nestjs/common'
import { ConfigurationDefinitionRegistry } from '~/configuration-registry.js'


export function Configuration(scope?: string): ClassDecorator {
  return (target) => {
    ConfigurationDefinitionRegistry.register({ ctor: target as unknown as Type<any>, scope: scope || '' })
  }
}
