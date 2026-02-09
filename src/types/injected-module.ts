import { DynamicModule } from '@nestjs/common'
import { Promisable } from 'type-fest'

/**
 * Options for asynchronous module configuration using factory pattern
 *
 * @description
 * Defines the structure for async configuration options that use a factory function
 * to generate configuration objects. The factory can return either a synchronous value
 * or a Promise.
 *
 * @example
 * ```typescript
 * const asyncOptions: AsyncOptions = {
 *   useFactory: (configService: ConfigService) => ({
 *     apiKey: configService.get('API_KEY'),
 *     timeout: 5000
 *   })
 * };
 * ```
 *
 * @example
 * ```typescript
 * // Async factory returning a Promise
 * const asyncOptions: AsyncOptions = {
 *   useFactory: async (httpService: HttpService) => {
 *     const remoteConfig = await httpService.get('/config').toPromise();
 *     return remoteConfig.data;
 *   }
 * };
 * ```
 */
export interface AsyncOptions {
  useFactory<T extends object>(...args: any[]): T
  useFactory<T extends object>(...args: any[]): Promisable<T>
}

/**
 * Interface for NestJS modules that support async registration via registerAsync method
 *
 * @description
 * Represents a module that can be dynamically registered with asynchronous configuration.
 * This pattern is commonly used for modules that need to be configured with dependencies
 * from other modules (e.g., ConfigService, DatabaseService).
 *
 * @example
 * ```typescript
 * @Module({})
 * class DatabaseModule implements InjectedModuleWithRegisterAsync {
 *   static registerAsync<T extends AsyncOptions>(options: T): DynamicModule {
 *     return {
 *       module: DatabaseModule,
 *       providers: [
 *         {
 *           provide: 'DATABASE_OPTIONS',
 *           useFactory: options.useFactory,
 *           inject: options.inject || []
 *         }
 *       ]
 *     };
 *   }
 * }
 * ```
 */
export interface InjectedModuleWithRegisterAsync {
  registerAsync<T extends AsyncOptions>(options: T): DynamicModule
}

/**
 * Interface for NestJS modules that support async registration via forRootAsync method
 *
 * @description
 * Represents a module that can be dynamically registered as a global/root module
 * with asynchronous configuration. This pattern is commonly used for singleton
 * modules that should be registered once at the application root level.
 *
 * @example
 * ```typescript
 * @Module({})
 * class CacheModule implements InjectedModuleWithForRootAsync {
 *   static forRootAsync<T extends AsyncOptions>(options: T): DynamicModule {
 *     return {
 *       module: CacheModule,
 *       global: true,
 *       providers: [
 *         {
 *           provide: 'CACHE_OPTIONS',
 *           useFactory: options.useFactory,
 *           inject: options.inject || []
 *         }
 *       ]
 *     };
 *   }
 * }
 * ```
 */
export interface InjectedModuleWithForRootAsync {
  forRootAsync<T extends AsyncOptions>(options: T): DynamicModule
}

/**
 * Union type representing any module that can be injected with async configuration
 *
 * @description
 * A module can use either `registerAsync` or `forRootAsync` pattern for
 * asynchronous configuration injection.
 *
 * @example
 * ```typescript
 * function configureModule(Module: InjectedModule, options: any) {
 *   if ('forRootAsync' in Module) {
 *     return Module.forRootAsync(options);
 *   } else {
 *     return Module.registerAsync(options);
 *   }
 * }
 * ```
 */
export type InjectedModule = InjectedModuleWithRegisterAsync | InjectedModuleWithForRootAsync

/**
 * Type utility to infer the async options type from an injected module
 *
 * @description
 * Extracts the options type from a module's async registration method.
 * This is useful for type-safe configuration when working with different
 * module types dynamically.
 *
 * @template M - The injected module type
 * @returns The inferred async options type for the given module
 *
 * @example
 * ```typescript
 * class MyModule implements InjectedModuleWithForRootAsync {
 *   static forRootAsync(options: { useFactory: () => { apiKey: string } }) {
 *     // ...
 *   }
 * }
 *
 * // Type will be: { useFactory: () => { apiKey: string } }
 * type MyModuleOptions = InferAsyncOptions<typeof MyModule>;
 * ```
 *
 * @example
 * ```typescript
 * // Generic function with type inference
 * function registerModuleAsync<M extends InjectedModule>(
 *   Module: M,
 *   options: InferAsyncOptions<M>
 * ) {
 *   if ('forRootAsync' in Module) {
 *     return Module.forRootAsync(options);
 *   }
 *   return (Module as InjectedModuleWithRegisterAsync).registerAsync(options);
 * }
 * ```
 */
export type InferAsyncOptions<M extends InjectedModule> = M extends InjectedModuleWithForRootAsync ? Parameters<M['forRootAsync']>[0] : M extends InjectedModuleWithRegisterAsync ? Parameters<M['registerAsync']>[0] : never
