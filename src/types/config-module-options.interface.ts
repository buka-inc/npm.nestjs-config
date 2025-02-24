/**
 * ConfigModuleOptions['providers] field doesn't seem to have any practical effect.
 * In fact, it ensures that the classes decorated by @Configuration() can be loaded before the ConfigModule.register().
 * Further ensures that ConfigModule can read all classes decorated by @Configuration() from Reflect.
 */
import { Type } from '@nestjs/common'
import { ConfigLoader } from './config-loader.interface.js'

export interface ConfigModuleOptions {
  /**
   * @default ".env"
   */
  loaders?: (string | ConfigLoader)[]

  providers: Type[]

  suppressWarnings?: true

  debug?: true
}
