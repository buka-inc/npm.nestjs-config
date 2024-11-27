# @buka/nestjs-config

[npm]: https://www.npmjs.com/package/@buka/nestjs-config

[![version](https://img.shields.io/npm/v/@buka/nestjs-config.svg?logo=npm&style=for-the-badge)][npm]
[![downloads](https://img.shields.io/npm/dm/@buka/nestjs-config.svg?logo=npm&style=for-the-badge)][npm]
[![dependencies](https://img.shields.io/librariesio/release/npm/@buka/nestjs-config?logo=npm&style=for-the-badge)][npm]
[![license](https://img.shields.io/npm/l/@buka/nestjs-config.svg?logo=github&style=for-the-badge)][npm]
[![Codecov](https://img.shields.io/codecov/c/gh/buka-lnc/npm.nestjs-config?logo=codecov&token=PLF0DT6869&style=for-the-badge)](https://codecov.io/gh/buka-lnc/npm.nestjs-config)

This is an easy-to-use nestjs config module with many surprising features.

## Feature

- Config verification by `class-validator`
- Config transform by `class-transformer`
- Load configuration files from anywhere
- Perfect coding tips
- Automatically handle naming styles
- Injectable config class

## Install

```bash
npm install @buka/nestjs-config
yarn install @buka/nestjs-config
pnpm install @buka/nestjs-config
```

## Usage

`@buka/nestjs-config` load config from `process.env` and `.env` in `process.cwd()` by defaulted. let us create `.env` first:

```bash
# .env
CACHE_DIR="./tmp"
BROKERS="test01.test.com,test02.test.com,test03.test.com"
```

Then, define a `AppConfig` class with the `@Configuration()` decorator. And add decorators
of `class-validator` to properties:

```typescript
// app.config.ts
import { Configuration } from "@buka/nestjs-config";
import { IsString, IsOptional, IsIn, isIp } from "class-validator";
import { Split } from "@miaooo/class-transformer-split";

@Configuration()
export class AppConfig {
  // set default value
  @IsIp()
  host = "0.0.0.0";

  // CACHE_DIR in .env
  @IsString()
  @IsOptional()
  cacheDir?: string;

  // process.env.NODE_ENV
  @IsIn(["dev", "test", "prod"])
  nodeEnv: string;

  @Split(",")
  brokers: string[];
}
```

> `@buka/nestjs-config` automatically convert naming styles. For example: `cache_dir`、`CACHE_DIR`、`cacheDir`、`CacheDir`、`cache-dir`、`Cache_Dir` are considered to be the same config name.

Import `ConfigModule` in your `AppModule`:

```typescript
// app.module.ts
import { Module } from "@nestjs/common";
import { ConfigModule } from "@buka/nestjs-config";
import { AppConfig } from "./app.config";

@Module({
  // use process.env and read .env by defaulted
  imports: [
    ConfigModule.register({
      isGlobal: true,
      providers: [AppConfig],
    }),
  ],
})
export class AppModule {}
```

Inject and use `AppConfig` in your service:

```typescript
import { Injectable } from "@nestjs/common";
import { AppConfig } from "./app.config";

@Injectable()
export class AppService {
  constructor(private readonly appConfig: AppConfig) {}
}
```

### Add more dotenv files

```typescript
import { Module } from "@nestjs/common";
import {
  ConfigModule,
  processEnvLoader,
  dotenvLoader,
} from "@buka/nestjs-config";
import { AppConfig } from "./app.config";

@Module({
  imports: [
    ConfigModule.register({
      isGlobal: true,
      providers: [AppConfig],
      loaders: [
        processEnvLoader,
        // transform DATABASE__HOST="0.0.0.0"
        // to DATABASE = { HOST: "0.0.0.0" }
        // transform LOG="true"
        // to LOG = true
        dotenvLoader(".env", { separator: "__", jsonParse: true }),
        dotenvLoader(`.${process.env.NODE_ENV}.env`),
      ],
    }),
  ],
})
export class AppModule {}
```

### Custom config loader

```typescript
// yaml-config-loader.ts
import { ConfigLoader } from "@buka/nestjs-config";
import { parse } from "yaml";

export async function yamlConfigLoader(filepath: string): ConfigLoader {
  return (options: ConfigModuleOptions) => {
    if (!existsSync(filepath)) {
      if (!options.suppressWarnings) {
        Logger.warn(`yaml file not found: ${filepath}`);
      }

      return {};
    }

    const content = await readFile(filepath);
    return parse(content);
  };
}
```

Use `yamlConfigLoader`:

```typescript
import { Module } from "@nestjs/common";
import { ConfigModule } from "@buka/nestjs-config";
import { AppConfig } from "./app.config";
import { yamlConfigLoader } from "./yamlConfigLoader";

@Module({
  imports: [
    ConfigModule.register({
      isGlobal: true,
      providers: [AppConfig],
      loaders: [yamlConfigLoader("my-yaml-config.yaml")],
    }),
  ],
})
export class AppModule {}
```

### Add prefix to all class properties

```typescript
// mysql.config.ts
import { Configuration } from "@buka/nestjs-config";
import { IsString } from "class-validator";

@Configuration("mysql.master")
export class MysqlConfig {
  // process : process.env.MYSQL__MASTER__HOST
  // .env    : MYSQL__MASTER__HOST
  // .json   : { mysql: { master: { host: "" } } }
  @IsString()
  host: string;
}
```

### Custom the config name of property

```typescript
// app.config.ts
import { Configuration, ConfigName } from "@buka/nestjs-config";
import { IsString } from "class-validator";

@Configuration("mysql.master")
export class MysqlConfig {
  // process : process.env.DATABASE_HOST
  // .env    : DATABASE_HOST
  // .json   : { databaseHost: "" }
  @ConfigName("DATABASE_HOST")
  @IsString()
  host: string;
}
```

> `@ConfigName(name)` will overwrite the prefix of `@Configuration([prefix])`

### Remove warning logs

```typescript
import { Module } from "@nestjs/common";
import { ConfigModule } from "@buka/nestjs-config";
import { AppConfig } from "./app.config";

@Module({
  imports: [
    ConfigModule.register({
      isGlobal: true,
      suppressWarnings: true,
      providers: [AppConfig],
    }),
  ],
})
export class AppModule {}
```

### ConfigModule.inject(ConfigProvider, DynamicModule[, dynamicModuleOptions])

Simplify the writing of `.forRootAsync`/`.registerAsync`.

```typescript
import { Module } from "@nestjs/common";
import { ConfigModule } from "@buka/nestjs-config";
import { KafkaModule, KafkaModuleOptions } from "@buka/nestjs-kafka";
import { AppConfig } from "./app.config";
import { KafkaConfig } from "./kafka.config";

@Module({
  imports: [
    ConfigModule.register({
      isGlobal: true,
      providers: [AppConfig, KafkaConfig],
    }),

    ConfigModule.inject(KafkaConfig, KafkaModule, { name: "my-kafka" }),
    // this is equal to
    KafkaModule.forRootAsync({
      name: "my-kafka",
      inject: [KafkaConfig],
      useFactory: (config: KafkaModuleOptions) => config,
    }),

    // Mapping KafkaConfig to options of KafkaModule manually
    ConfigModule.inject(
      KafkaConfig,
      KafkaModule,
      // override asyncOptions of KafkaModule
      { name: "my-kafka" },
      // override options of KafkaModule
      (config: KafkaConfig) => ({
        ...config,
        groupId: `prefix_${config.groupId}`,
      })
    ),

    // if you don't need override asyncOptions
    ConfigModule.inject(KafkaConfig, KafkaModule, (config: KafkaConfig) => ({
      ...config,
      groupId: `prefix_${config.groupId}`,
    })),
  ],
})
export class AppModule {}
```

### Preload Config

Sometimes, we have to get config outside the nestjs lifecycle. `ConfigModule.preload(options)` is designed for this.

There is an example of [MikroORM](https://mikro-orm.io/) config file:

```typescript
// mikro-orm.config.ts
import { ConfigModule } from "@buka/nestjs-config";
import { MySqlDriver, defineConfig } from "@mikro-orm/mysql";
import { MysqlConfig } from "./config/mysql.config";
import { Migrator } from "@mikro-orm/migrations";
import { BadRequestException } from "@nestjs/common";

export default (async function loadConfig() {
  // Load MysqlConfig
  await ConfigModule.preload({
    providers: [MysqlConfig],
  });

  // Get MysqlConfig Instance
  const config = await ConfigModule.get(MysqlConfig);

  return defineConfig({
    ...config,
    entities: ["dist/**/*.entity.js"],
    driver: MySqlDriver,
  });
})();
```

> [!TIP]
>
> The `options` of `ConfigModule.preload(options)` is the `options` of `ConfigModule.register(options)`
