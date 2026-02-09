# @buka/nestjs-config

[npm]: https://www.npmjs.com/package/@buka/nestjs-config

[![version](https://img.shields.io/npm/v/@buka/nestjs-config.svg?logo=npm&style=for-the-badge)][npm]
[![downloads](https://img.shields.io/npm/dm/@buka/nestjs-config.svg?logo=npm&style=for-the-badge)][npm]
[![dependencies](https://img.shields.io/librariesio/release/npm/@buka/nestjs-config?logo=npm&style=for-the-badge)][npm]
[![license](https://img.shields.io/npm/l/@buka/nestjs-config.svg?logo=github&style=for-the-badge)][npm]
[![Codecov](https://img.shields.io/codecov/c/gh/buka-lnc/npm.nestjs-config?logo=codecov&token=PLF0DT6869&style=for-the-badge)](https://codecov.io/gh/buka-lnc/npm.nestjs-config)

An easy-to-use NestJS config module with powerful features and type safety.

## Features

- ✅ **Type-Safe Configuration**: Config verification by `class-validator`
- ✅ **Config Transformation**: Config transform by `class-transformer`
- ✅ **Flexible Loading**: Load configuration from multiple sources (env, files, etc.)
- ✅ **Auto Naming Convention**: Automatically handles naming styles (camelCase, snake_case, etc.)
- ✅ **Injectable Classes**: Configuration classes can be injected like any other provider
- ✅ **Global Configuration**: Define configuration once, use everywhere
- ✅ **Perfect Type Hints**: Full TypeScript support with excellent IDE autocomplete

## Installation

```bash
npm install @buka/nestjs-config
# or
yarn add @buka/nestjs-config
# or
pnpm add @buka/nestjs-config
```

## Quick Start

### 1. Create Configuration Class

Define your configuration using decorators from `class-validator`:

```typescript
// app.config.ts
import { Configuration } from "@buka/nestjs-config";
import { IsString, IsOptional, IsIn, IsIp } from "class-validator";
import { Split } from "@miaooo/class-transformer-split";

@Configuration()
export class AppConfig {
  @IsIp()
  host = "0.0.0.0"; // default value

  @IsString()
  @IsOptional()
  cacheDir?: string;

  @IsIn(["dev", "test", "prod"])
  nodeEnv: string;

  @Split(",")
  brokers: string[];
}
```

### 2. Create Environment File

Create a `.env` file in your project root:

```bash
# .env
CACHE_DIR="./tmp"
NODE_ENV="dev"
BROKERS="test01.test.com,test02.test.com,test03.test.com"
```

> [!TIP]
> `@buka/nestjs-config` automatically converts naming styles. `cache_dir`, `CACHE_DIR`, `cacheDir`, `CacheDir`, `cache-dir`, `Cache_Dir` are all recognized as the same config name.

### 3. Import ConfigModule

Import `ConfigModule` in your NestJS application:

```typescript
// app.module.ts
import { Module } from "@nestjs/common";
import { ConfigModule } from "@buka/nestjs-config";

@Module({
  imports: [
    ConfigModule.register({ isGlobal: true }),
  ],
})
export class AppModule {}
```

By default, `ConfigModule` loads config from `process.env` and `.env` file.

### 4. Inject Configuration

Use configuration in your services:

```typescript
// app.service.ts
import { Injectable } from "@nestjs/common";
import { AppConfig } from "./app.config";

@Injectable()
export class AppService {
  constructor(private readonly appConfig: AppConfig) {}

  getInfo() {
    return `Host: ${this.appConfig.host}, Env: ${this.appConfig.nodeEnv}`;
  }
}
```

## Configuration

### Global Configuration (Recommended)

When you need to use configuration in multiple places (NestJS modules, ORM configs, scripts), use `ConfigModule.configure()` to avoid duplication:

#### Step 1: Create Configuration File

```typescript
// config/index.ts
import { ConfigModule, processEnvLoader, yamlFileLoader } from "@buka/nestjs-config";

ConfigModule.configure({
  loaders: [
    processEnvLoader(),
    yamlFileLoader("config.yaml"),
  ],
  suppressWarnings: true,
});
```

#### Step 2: Use in NestJS Module

```typescript
// app.module.ts
import { Module } from "@nestjs/common";
import { ConfigModule } from "@buka/nestjs-config";
import "./config"; // Import configuration

@Module({
  imports: [
    ConfigModule.register({ isGlobal: true }), // Uses global config
  ],
})
export class AppModule {}
```

#### Step 3: Use in External Files (ORM configs, scripts, etc.)

```typescript
// mikro-orm.config.ts
import { ConfigModule } from "@buka/nestjs-config";
import { DatabaseConfig } from "./config/database.config";
import "./config"; // Import configuration

export default (async function () {
  await ConfigModule.preload(); // Uses global config
  const config = await ConfigModule.getOrFail(DatabaseConfig);
  return { ...config };
})();
```

> [!TIP]
> **Benefits of Global Configuration:**
> - Configure once, use everywhere
> - No duplication between `preload()` and `register()`
> - Guaranteed consistency across your application
> - Can still override settings when needed by passing options directly

### Configuration Options

```typescript
interface ConfigModuleOptions {
  /**
   * Configuration loaders (default: processEnvLoader + .env file)
   */
  loaders?: (string | ConfigLoader)[];

  /**
   * Suppress warning messages
   */
  suppressWarnings?: boolean;

  /**
   * Enable debug logging
   */
  debug?: boolean;

  /**
   * Manually specify config providers (usually auto-detected)
   */
  providers?: Type[];
}
```

### Custom Loaders

You can customize how configuration is loaded:

```typescript
import { ConfigModule, processEnvLoader, dotenvLoader } from "@buka/nestjs-config";

ConfigModule.configure({
  loaders: [
    processEnvLoader(),
    dotenvLoader(".env", { separator: "__", jsonParse: true }),
    dotenvLoader(`.env.${process.env.NODE_ENV}`),
  ],
});
```

## Advanced Usage

### Nested Configuration

```typescript
import { Configuration } from "@buka/nestjs-config";
import { ValidateNested, Type } from "class-transformer";
import { IsString } from "class-validator";

export class DatabaseConfig {
  @IsString()
  host: string; // DATABASE__HOST

  @IsString()
  password: string; // DATABASE__PASSWORD
}

@Configuration()
export class AppConfig {
  @ValidateNested()
  @Type(() => DatabaseConfig)
  database: DatabaseConfig;
}
```

Environment variables: `DATABASE__HOST=localhost`, `DATABASE__PASSWORD=secret`

### Configuration Prefix

Use `@Configuration(prefix)` to add a prefix to all properties:

```typescript
import { Configuration } from "@buka/nestjs-config";
import { IsString } from "class-validator";

@Configuration("mysql.master")
export class MysqlConfig {
  @IsString()
  host: string; // MYSQL__MASTER__HOST
}
```

Mapping:
- `process.env`: `MYSQL__MASTER__HOST`
- `.env` file: `MYSQL__MASTER__HOST`
- JSON file: `{ mysql: { master: { host: "..." } } }`

### Custom Config Keys

Use `@ConfigKey()` to override the property name:

```typescript
import { Configuration, ConfigKey } from "@buka/nestjs-config";
import { IsString } from "class-validator";

@Configuration("mysql")
export class MysqlConfig {
  @ConfigKey("DATABASE_HOST")
  @IsString()
  host: string; // Now reads from DATABASE_HOST instead of MYSQL__HOST
}
```

> [!NOTE]
> `@ConfigKey(name)` overwrites the prefix from `@Configuration(prefix)`

### Preload Config (Outside NestJS)

Use `ConfigModule.preload()` to load configuration before NestJS initialization:

```typescript
// database-migration.ts
import { ConfigModule } from "@buka/nestjs-config";
import { DatabaseConfig } from "./config/database.config";
import "./config"; // Import global configuration

async function migrate() {
  await ConfigModule.preload(); // Uses global config

  // Get configuration
  const config = await ConfigModule.getOrFail(DatabaseConfig);

  // Use config for migration...
}
```

### Module Integration

Simplify configuration injection into other modules using `ConfigModule.inject()`:

```typescript
import { Module } from "@nestjs/common";
import { ConfigModule, Configuration } from "@buka/nestjs-config";
import { LoggerModule } from "nestjs-pino";
import { IsIn } from "class-validator";

@Configuration("logger")
class LoggerConfig {
  @IsIn(["fatal", "error", "warn", "info", "debug", "trace"])
  level: string = "info";
}

@Module({
  imports: [
    ConfigModule.register({ isGlobal: true }),

    // Using ConfigModule.inject() - Simple and clean
    ConfigModule.inject(LoggerConfig, LoggerModule, (config) => ({
      pinoHttp: { level: config.level },
    })),
  ],
})
class AppModule {}
```

**Equivalent without `ConfigModule.inject()`:**

```typescript
@Module({
  imports: [
    ConfigModule.register({ isGlobal: true }),

    // Using forRootAsync directly - More verbose
    LoggerModule.forRootAsync({
      inject: [LoggerConfig],
      useFactory: (config: LoggerConfig) => ({
        pinoHttp: { level: config.level },
      }),
    }),
  ],
})
class AppModule {}
```

As you can see, `ConfigModule.inject()` provides a cleaner syntax for injecting configuration into other modules.

**Advanced: Inject with additional options**

```typescript
import { TypeOrmModule } from "@nestjs/typeorm";

@Configuration("database")
class DatabaseConfig {
  @IsString()
  host: string;

  @IsNumber()
  port: number;

  @IsString()
  database: string;
}

@Module({
  imports: [
    ConfigModule.register({ isGlobal: true }),

    // With additional module options (e.g., multiple databases)
    ConfigModule.inject(
      DatabaseConfig,
      TypeOrmModule,
      { name: "primary" }, // Additional options
      (config) => config    // Config mapper (optional)
    ),
  ],
})
class AppModule {}
```

Equivalent to:

```typescript
TypeOrmModule.forRootAsync({
  name: "primary",
  inject: [DatabaseConfig],
  useFactory: (config: DatabaseConfig) => config,
})
```

## Built-in Loaders

| Loader | Description |
|--------|-------------|
| `processEnvLoader()` | Load from `process.env` |
| `dotenvLoader(path, options?)` | Load `.env` file using [dotenv](https://www.npmjs.com/package/dotenv) |
| `dotenvxLoader(path, options?)` | Load `.env` file using [@dotenvx/dotenvx](https://www.npmjs.com/package/@dotenvx/dotenvx) |
| `jsonFileLoader(path)` | Load JSON file |
| `yamlFileLoader(path, encoding?)` | Load YAML file using [yaml](https://www.npmjs.com/package/yaml) |
| `tomlFileLoader(path, encoding?)` | Load TOML file using [smol-toml](https://www.npmjs.com/package/smol-toml) |

### Custom Loader Example

```typescript
import { ConfigLoader, ConfigModuleOptions } from "@buka/nestjs-config";
import { readFileSync } from "fs";

export function customLoader(filepath: string): ConfigLoader {
  return (options: ConfigModuleOptions) => {
    const content = readFileSync(filepath, "utf-8");
    // Parse and return configuration object
    return JSON.parse(content);
  };
}
```

## Troubleshooting

### Error: "Every field in my Config class was missing"

This may occur when using TypeScript with `target` set to `ES2021` or lower.

**Solution 1 (Recommended)**: Upgrade to `ES2022` or higher in `tsconfig.json`

**Solution 2**: Add `@ConfigKey()` decorator to every property:

```typescript
import { Configuration, ConfigKey } from "@buka/nestjs-config";

@Configuration()
export class AppConfig {
  @ConfigKey()
  @IsIp()
  host = "0.0.0.0";

  @ConfigKey()
  @IsIn(["dev", "test", "prod"])
  nodeEnv: string;
}
```

### Error: "Nest could not find YourConfig element"

This occurs when a config class is not injected into any service.

**Solution 1**: Use `ConfigModule.get()` instead of `app.get()`:

```typescript
await ConfigModule.preload();
const config = await ConfigModule.get(YourConfig);
```

**Solution 2**: Manually register the config class:

```typescript
@Module({
  imports: [
    ConfigModule.register({
      isGlobal: true,
      providers: [YourConfig],
    }),
  ],
})
class AppModule {}
```

## License

MIT
