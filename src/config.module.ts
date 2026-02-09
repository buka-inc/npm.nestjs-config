import * as R from 'ramda'
import { DynamicModule, FactoryProvider, Logger, Module } from '@nestjs/common'
import { instanceToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import objectPath from 'object-path'
import { Class } from 'type-fest'
import { dotenvLoader } from './config-loader/dotenv-loader.js'
import { processEnvLoader } from './config-loader/process-env-loader.js'
import { ASYNC_OPTIONS_TYPE, ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } from './config.module-definition.js'
import { MODULE_LOADED_CONFIG_TOKEN, RESET_COLOR } from './constants.js'
import { AsyncOptions } from './types/async-options.js'
import { ConfigProvider } from './types/config-provider.interface.js'
import { AsyncOptionsOfModule, InjectedModule } from './types/injected-module.interface.js'
import { objectKeysToCamelCase } from './utils/object-keys-to-camel-case.js'
import { toCamelCase } from './utils/to-camel-case.js'
import { ConfigModuleOptions } from './types/config-module-options.interface.js'
import { deepMergeAll } from './utils/deep-merge-all.js'
import { inspect } from 'util'
import { ConfigurationRegistry } from './configuration-registry.js'
import { IConfigProvider } from './types/config-provider.js'


@Module({})
export class ConfigModule extends ConfigurableModuleClass {
  private static config: object | null = null
  private static providers = new Map()
  private static globalOptions: ConfigModuleOptions | null = null

  private static async createConfigProvider(options: typeof OPTIONS_TYPE, config: Record<string, any>, configProvider: IConfigProvider): Promise<ConfigProvider> {
    const ConfigProviderClass = configProvider.target
    if (this.providers.has(ConfigProviderClass)) return this.providers.get(ConfigProviderClass)


    const path: string = toCamelCase(configProvider.path)
    const subConfig = objectPath.get(config, path)

    const instance: typeof ConfigProviderClass = new ConfigProviderClass()
    function set(property: string | symbol, value: any): void {
      if (value !== undefined) instance[property] = value
    }

    const properties = R.uniq([
      ...Object.getOwnPropertyNames(instance),
      ...ConfigurationRegistry.getProperties(instance),
    ])

    for (const property of properties) {
      const ck = ConfigurationRegistry.getConfigKey(ConfigProviderClass, property)
      if (ck.ignore) continue

      if (ck.configKey) {
        const value = objectPath.get(config, ck.configKey)
        set(property, value)
      }

      if (typeof ck.propertyKey === 'symbol') continue

      set(property, subConfig && subConfig[toCamelCase(ck.propertyKey)])
    }

    const result = instanceToInstance(instance)
    const errors = await validate(result)

    if (errors.length) {
      const message = errors
        .map((error) => {
          let message = `An instance of ${ConfigProviderClass.name} has failed the validation:\n`
          for (const constraint in error.constraints) {
            message += `  - Property: \`${error.property}\`\n`
            message += `    Value: ${JSON.stringify(error.value)}\n`
            message += `    Constraint: ${constraint}\n`
            message += `    Expect: ${error.constraints[constraint]}\n`
          }

          return message
        })
        .join('\n')

      Logger.error(message, '@buka/nestjs-config')
      throw new Error(message)
    }


    if (options.debug) {
      Logger.debug(`${ConfigProviderClass.name} initialized${RESET_COLOR}\n${inspect(result, false, null, true)}`, '@buka/nestjs-config')
    }

    this.providers.set(ConfigProviderClass, result)
    return result
  }

  private static mergeOptions(options: ConfigModuleOptions = {}): ConfigModuleOptions {
    if (!this.globalOptions) return options

    return {
      ...this.globalOptions,
      ...options,
      loaders: options.loaders ?? this.globalOptions.loaders,
      providers: options.providers ?? this.globalOptions.providers,
      suppressWarnings: options.suppressWarnings ?? this.globalOptions.suppressWarnings,
      debug: options.debug ?? this.globalOptions.debug,
    }
  }

  private static async loadConfig(options: typeof OPTIONS_TYPE = {}): Promise<object> {
    if (this.config !== null) return this.config

    const mergedOptions = this.mergeOptions(options)
    const configLoaders = (mergedOptions.loaders || [processEnvLoader(), '.env'])
      .map((c) => (typeof c === 'string' ? dotenvLoader(c) : c))

    const configs = await Promise.all(configLoaders.map((loader) => loader(mergedOptions)))
    const config = objectKeysToCamelCase(deepMergeAll(configs))
    this.config = config
    return config
  }

  private static createConfigProviderFactory(configProvider: IConfigProvider): FactoryProvider {
    return {
      provide: configProvider.target,
      inject: [MODULE_OPTIONS_TOKEN, MODULE_LOADED_CONFIG_TOKEN],
      useFactory: (options: typeof OPTIONS_TYPE, config: Record<string, any>) => {
        const provider = this.providers.get(configProvider.target)
        if (provider) return provider

        return this.createConfigProvider(options, config, configProvider)
      },
    }
  }

  private static createLoadedConfigProviderFactory(): FactoryProvider {
    return {
      provide: MODULE_LOADED_CONFIG_TOKEN,
      inject: [MODULE_OPTIONS_TOKEN],
      useFactory: async (options: typeof OPTIONS_TYPE) => this.loadConfig(options),
    }
  }

  /**
   * Configure global options for ConfigModule
   * These options will be used as defaults for preload() and register()
   */
  static configure(options: ConfigModuleOptions): void {
    this.globalOptions = options
  }

  /**
   * Load config and provider before registering the module
   * If no options provided, will use global options set by configure()
   */
  static async preload(options: ConfigModuleOptions = {}): Promise<void> {
    const mergedOptions = this.mergeOptions(options)
    const config = await this.loadConfig(mergedOptions)
    const configProviders: IConfigProvider[] = ConfigurationRegistry.getProviders()
    await Promise.all(configProviders.map((provider) => this.createConfigProvider(mergedOptions, config, provider)))
  }

  /**
   * Get the loaded config
   */
  static get<T extends ConfigProvider>(ConfigProviderClass: T): Promise<InstanceType<T> | undefined> {
    return this.providers.get(ConfigProviderClass)
  }

  static async getOrFail<T extends ConfigProvider>(ConfigProviderClass: T): Promise<InstanceType<T>> {
    const config = await this.get(ConfigProviderClass)
    if (!config) {
      throw new Error(`[@buka/nestjs-config] ${ConfigProviderClass.name} Not Founded`)
    }
    return config
  }

  static register(options: typeof OPTIONS_TYPE = {}): DynamicModule {
    const mergedOptions = this.mergeOptions(options)
    const configProviders = ConfigurationRegistry.getProviders()
    const dynamicModule = super.register(mergedOptions)

    dynamicModule.providers = [
      ...(dynamicModule.providers || []),
      this.createLoadedConfigProviderFactory(),
      ...configProviders.map((provider) => this.createConfigProviderFactory(provider)),
    ]

    dynamicModule.exports = [
      ...(dynamicModule.exports || []),
      ...configProviders.map((provider) => provider.target),
    ]

    return dynamicModule
  }

  static registerAsync(options: typeof ASYNC_OPTIONS_TYPE = {}): DynamicModule {
    const mergedOptions = this.mergeOptions(options as ConfigModuleOptions)
    const configProviders = ConfigurationRegistry.getProviders()
    const dynamicModule = super.registerAsync({ ...options, ...mergedOptions } as typeof ASYNC_OPTIONS_TYPE)

    dynamicModule.providers = [
      ...(dynamicModule.providers || []),
      this.createLoadedConfigProviderFactory(),
      ...configProviders.map((provider) => this.createConfigProviderFactory(provider)),
    ]

    dynamicModule.exports = [
      ...(dynamicModule.exports || []),
      ...configProviders.map((provider) => provider.target),
    ]

    return dynamicModule
  }

  static inject<
    M extends InjectedModule,
    AO extends AsyncOptionsOfModule<M>,
    O extends Awaited<ReturnType<AO['useFactory']>>,
    P extends Class<O>,
  >(
    provider: P,
    module: M,
  ): DynamicModule

  static inject<
    M extends InjectedModule,
    AO extends AsyncOptionsOfModule<M>,
    O extends Awaited<ReturnType<AO['useFactory']>>,
    P extends Class<any>,
  >(
    provider: P,
    module: M,
    optionsFactory: (config: P['prototype']) => Promise<O> | O,
  ): DynamicModule

  static inject<
    M extends InjectedModule,
    AO extends AsyncOptionsOfModule<M>,
    O extends Awaited<ReturnType<AO['useFactory']>>,
    P extends Class<O>,
  >(
    provider: P,
    module: M,
    moduleAsyncOptions: Omit<AO, keyof AsyncOptions>,
  ): DynamicModule

  static inject<
    M extends InjectedModule,
    AO extends AsyncOptionsOfModule<M>,
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
    AO extends AsyncOptionsOfModule<M>,
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
