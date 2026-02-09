import { DynamicModule, FactoryProvider, Module } from '@nestjs/common'
import { Class } from 'type-fest'
import { ASYNC_OPTIONS_TYPE, ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } from './config.module-definition.js'

import {
  MODULE_RUNTIME_CONFIG_TOKEN,
} from './constants.js'

import {
  AsyncOptions,
  ConfigurationDefinition,
  InferAsyncOptions,
  InjectedModule,
  ConfigModuleOptions,
  ConfigurationCtor,
} from './types'

import { ConfigurationDefinitionRegistry } from './configuration-registry.js'
import { RuntimeConfig } from './runtime-config.js'
import { RawConfigRegistry } from './raw-config-registry.js'
import { ConfigurationFactory } from './configuration-factory.js'
import { WatchManager } from './watch-manager.js'


@Module({})
export class ConfigModule extends ConfigurableModuleClass {
  /**
   * Configure global options for ConfigModule
   * These options will be used as defaults for preload() and register()
   */
  static configure(options: ConfigModuleOptions): void {
    RuntimeConfig.setGlobal(options)
  }

  /**
   * Load config and provider before registering the module
   * If no options provided, will use global options set by configure()
   */
  static async preload(options: ConfigModuleOptions = {}): Promise<void> {
    const rc = new RuntimeConfig(options)
    await RawConfigRegistry.load(rc)
    const raw = RawConfigRegistry.read()
    await ConfigurationFactory.compile(rc, raw)
  }

  /**
   * Get the loaded config
   */
  static async get<T extends ConfigurationCtor>(ctor: T, options?: ConfigModuleOptions): Promise<InstanceType<T> | undefined> {
    const inst = ConfigurationFactory.get(ctor)
    if (inst) return inst

    if (!inst && options) {
      await this.preload(options)
      return ConfigurationFactory.get(ctor)
    }

    return undefined
  }

  static async getOrFail<T extends ConfigurationCtor>(ctor: T, options: ConfigModuleOptions): Promise<InstanceType<T>> {
    const config = await this.get(ctor, options)
    if (!config) {
      throw new Error(`[@buka/nestjs-config] ${ctor.name} Not Founded`)
    }
    return config
  }


  private static createConfigurationProvider(definition: ConfigurationDefinition): FactoryProvider {
    return {
      provide: definition.ctor,
      inject: [MODULE_RUNTIME_CONFIG_TOKEN],
      useFactory: (rc: RuntimeConfig) => {
        const raw = RawConfigRegistry.read(rc)
        return ConfigurationFactory.create(rc, raw, definition)
      },
    }
  }

  private static createRuntimeConfigProvider(): FactoryProvider {
    return {
      provide: MODULE_RUNTIME_CONFIG_TOKEN,
      inject: [MODULE_OPTIONS_TOKEN],
      useFactory: async (options: typeof OPTIONS_TYPE) => {
        const rc = new RuntimeConfig(options)
        await RawConfigRegistry.load(rc)
        return rc
      },
    }
  }

  static register(options: typeof OPTIONS_TYPE = {}): DynamicModule {
    const definitions = ConfigurationDefinitionRegistry.getAll()
    const dynamicModule = super.register(options)

    dynamicModule.providers = [
      ...(dynamicModule.providers || []),
      this.createRuntimeConfigProvider(),
      WatchManager,
      ...definitions.map((provider) => this.createConfigurationProvider(provider)),
    ]

    dynamicModule.exports = [
      ...(dynamicModule.exports || []),
      ...definitions.map((definition) => definition.ctor),
    ]

    return dynamicModule
  }

  static registerAsync(options: typeof ASYNC_OPTIONS_TYPE = {}): DynamicModule {
    const definitions = ConfigurationDefinitionRegistry.getAll()
    const dynamicModule = super.registerAsync(options)

    dynamicModule.providers = [
      ...(dynamicModule.providers || []),
      this.createRuntimeConfigProvider(),
      WatchManager,
      ...definitions.map((definition) => this.createConfigurationProvider(definition)),
    ]

    dynamicModule.exports = [
      ...(dynamicModule.exports || []),
      ...definitions.map((definition) => definition.ctor),
    ]

    return dynamicModule
  }

  static inject<
    M extends InjectedModule,
    AO extends InferAsyncOptions<M>,
    O extends Awaited<ReturnType<AO['useFactory']>>,
    P extends Class<O>,
  >(
    provider: P,
    module: M,
  ): DynamicModule

  static inject<
    M extends InjectedModule,
    AO extends InferAsyncOptions<M>,
    O extends Awaited<ReturnType<AO['useFactory']>>,
    P extends Class<any>,
  >(
    provider: P,
    module: M,
    optionsFactory: (config: P['prototype']) => Promise<O> | O,
  ): DynamicModule

  static inject<
    M extends InjectedModule,
    AO extends InferAsyncOptions<M>,
    O extends Awaited<ReturnType<AO['useFactory']>>,
    P extends Class<O>,
  >(
    provider: P,
    module: M,
    moduleAsyncOptions: Omit<AO, keyof AsyncOptions>,
  ): DynamicModule

  static inject<
    M extends InjectedModule,
    AO extends InferAsyncOptions<M>,
    O extends Awaited<ReturnType<AO['useFactory']>>,
    P extends Class<any>,
  >(
    provider: P,
    module: M,
    moduleAsyncOptions: Omit<AO, keyof AsyncOptions>,
    optionsFactory: (config: P['prototype']) => Promise<O>,
  ): DynamicModule

  static inject<
    M extends InjectedModule,
    AO extends InferAsyncOptions<M>,
    O extends Awaited<ReturnType<AO['useFactory']>>,
    P extends Class<any>,
  >(
    provider: P,
    module: M,
    moduleAsyncOptionsOrFactory?: Omit<AO, keyof AsyncOptions> | ((config: P) => Promise<O> | O),
    optionsFactory?: (config: P['prototype']) => Promise<O>,
  ): DynamicModule {
    let moduleAsyncOptions: Omit<AO, keyof AsyncOptions> | undefined = undefined
    let useFactory: AsyncOptions['useFactory'] = (config) => config

    if (typeof moduleAsyncOptionsOrFactory === 'function') {
      useFactory = moduleAsyncOptionsOrFactory as any
    } else if (typeof moduleAsyncOptionsOrFactory === 'object') {
      moduleAsyncOptions = moduleAsyncOptionsOrFactory
    }

    if (typeof optionsFactory === 'function') {
      useFactory = optionsFactory as any
    }


    if ('registerAsync' in module && module.registerAsync) {
      return module.registerAsync({
        ...moduleAsyncOptions,
        inject: [provider],
        useFactory,
      })
    }

    if ('forRootAsync' in module && module.forRootAsync) {
      return module.forRootAsync({
        ...moduleAsyncOptions,
        inject: [provider],
        useFactory,
      })
    }

    throw new TypeError('Invalid module')
  }
}
