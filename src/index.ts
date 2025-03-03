export { ConfigModule } from './config.module.js'
export type { ConfigModuleOptions } from './types/config-module-options.interface.js'

export { ConfigKey } from './decorators/config-key.decorator.js'
export { ConfigName } from './decorators/config-name.decorator.js'
export { Configuration } from './decorators/configuration.decorator.js'
export { StaticConfig } from './decorators/static-config.decorator.js'

export { composeLoader } from './utils/compose-loader.js'
export { dotenvLoader } from './config-loader/dotenv-loader.js'
export { jsonFileLoader } from './config-loader/json-file-loader.js'
export { processEnvLoader } from './config-loader/process-env-loader.js'
export { dotenvxLoader } from './config-loader/dotenvx-loader.js'
export { yamlFileLoader } from './config-loader/yaml-file-loader.js'
export { tomlFileLoader } from './config-loader/toml-file-loader.js'

export type { ConfigLoader } from './types/config-loader.interface.js'
