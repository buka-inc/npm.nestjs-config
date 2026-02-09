import { Class } from 'type-fest'


/**
 * Configuration class constructor type
 * Represents a NestJS type that can be instantiated as a configuration class
 */
export type ConfigurationCtor = Class<any>

/**
 * Configuration definition interface
 * Defines how a configuration class should be registered and bound to config source
 */
export interface ConfigurationDefinition {
  /**
   * The scope in the configuration source from which this configuration object reads its properties
   * For example, if scope is 'database', all properties will be read from the 'database' scope in config source
   * e.g., 'database', 'auth', 'app'
   */
  scope: string

  /**
   * The constructor of the configuration class
   */
  ctor: ConfigurationCtor
}

/**
 * Configuration property metadata
 * Used to define metadata for properties decorated with @ConfigKey
 */
export interface ConfigurationProperty {
  /**
   * Whether to exclude this property from configuration binding
   * @default false
   */
  exclude?: boolean

  /**
   * The property key in the configuration class
   */
  propertyKey: string | symbol

  /**
   * Custom path to bind the configuration value from
   * If not specified, uses the property key as the path
   */
  bind?: string
}
