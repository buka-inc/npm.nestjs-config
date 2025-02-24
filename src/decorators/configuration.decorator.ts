import { Type } from '@nestjs/common'
import { ConfigurationRegistry } from '~/configuration-registry.js'


export function Configuration(path?: string): ClassDecorator {
  return (target) => {
    ConfigurationRegistry.registerProvider({ target: target as unknown as Type<any>, path: path || '' })
  }
}
