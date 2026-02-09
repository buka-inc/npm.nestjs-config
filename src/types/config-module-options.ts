/**
 * ConfigModuleOptions['providers] field doesn't seem to have any practical effect.
 * In fact, it ensures that the classes decorated by @Configuration() can be loaded before the ConfigModule.register().
 * Further ensures that ConfigModule can read all classes decorated by @Configuration() from Reflect.
 */
import { Type } from '@nestjs/common'
import { LoadRawConfigFn, LoadRawConfigFnOptions } from './config-loader.js'
import { ConfigLoader } from '~/index.js'


export interface ConfigModuleOptions extends LoadRawConfigFnOptions {
  /**
   * @default ".env"
   */
  loaders?: (string | LoadRawConfigFn | ConfigLoader)[]

  /**
   * Provider can be automatically loaded, in most cases.
   */
  providers?: Type[]
}
