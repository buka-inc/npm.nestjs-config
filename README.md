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

`@buka/nestjs-config` load config from `process.env` and `.env`(local `process.cwd()`) by defaulted. let us create `.env` first:

```bash
# .env
CACHE_DIR="./tmp"
BROKERS="test01.test.com,test02.test.com,test03.test.com"
```

Then, define a `AppConfig` class with the `@Configuration()` decorator.

```typescript
// app.config.ts
import { Configuration } from "@buka/nestjs-config";
import { IsString, IsOptional, IsIn, IsIp } from "class-validator";
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

> [!TIP]
>
> `@buka/nestjs-config` automatically convert naming styles. For example: `cache_dir`、`CACHE_DIR`、`cacheDir`、`CacheDir`、`cache-dir`、`Cache_Dir` are considered to be the same config name.

Import `ConfigModule` in your `AppModule`:

```typescript
// app.module.ts
import { Module } from "@nestjs/common";
import { ConfigModule } from "@buka/nestjs-config";
import { AppConfig } from "./app.config";

@Module({
  // use process.env and read .env by defaulted
  imports: [ConfigModule.register({ isGlobal: true })],
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

### Nested Configuration

Nested configuration is the same as using `class-validator` and `class-transformer`:

```typescript
import { Configuration } from "@buka/nestjs-config";
import { IsString } from "class-validator";

export class SubConfig {
  // process.env.{ParentFieldName}__KEY
  @IsString()
  key: string;
}

@Configuration()
export class AppConfig {
  // process.env.SUB_FIRST__KEY
  @ValidateNested()
  @Type(() => SmsTemplate)
  subFirst!: SubConfig;

  // process.env.SUB_SECOND__KEY
  @ValidateNested()
  @Type(() => SmsTemplate)
  subSecond!: SubConfig;
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
import { Configuration, ConfigKey } from "@buka/nestjs-config";
import { IsString } from "class-validator";

@Configuration("mysql.master")
export class MysqlConfig {
  // process : process.env.DATABASE_HOST
  // .env    : DATABASE_HOST
  // .json   : { databaseHost: "" }
  @ConfigKey("DATABASE_HOST")
  @IsString()
  host: string;
}
```

> `@ConfigKey(name)` will overwrite the prefix of `@Configuration([prefix])`

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
    }),
  ],
})
export class AppModule {}
```

### ConfigModule.inject(ConfigProvider, DynamicModule[, dynamicModuleOptions])

Simplify the writing of `.forRootAsync`/`.registerAsync`.

```typescript
// pino.config.ts
@Configuration("pino")
export class PinoConfig implements Pick<Params, "assignResponse"> {
  @ToBoolean()
  @IsBoolean()
  assignResponse?: boolean | undefined;
}

// app.module.ts
@Module({
  imports: [
    ConfigModule.register({ isGlobal: true }),
    ConfigModule.inject(PinoConfig, LoggerModule),
  ],
})
class AppModule {}
```

If the config class implement options of module `.forRootAsync`/`.registerAsync`,
The code will become very beautiful.

And `implement` is not necessary:

```typescript
import { Module } from "@nestjs/common";
import { ConfigModule } from "@buka/nestjs-config";

// pino.config.ts
@Configuration("pino")
export class PinoConfig {
  @IsIn(["fatal", "error", "warn", "info", "debug", "trace"])
  level: string = "info";
}

// app.module.ts
@Module({
  imports: [
    ConfigModule.register({ isGlobal: true }),
    // map .level to .pinoHttp.level
    ConfigModule.inject(PinoConfig, LoggerModule, (config) => ({
      pinoHttp: { level: config.level },
    })),
  ],
})
class AppModule {}
```

Sometimes, a `name` property is need by options of `.forRootAsync`/`.registerAsync`,
like [add multiple database in `@nestjs/typeorm`](https://docs.nestjs.com/techniques/database#multiple-databases).

> Another one is `isGlobal`

```typescript
@Module({
  imports: [
    ConfigModule.register({ isGlobal: true }),

    ConfigModule.inject(
      TypeOrmConfig,
      TypeOrmModule,
      { name: "my-orm" },
      (config) => config // config mapping function is optional
    ),

    // this is equal to
    TypeOrmModule.forRootAsync({
      name: "my-orm",
      inject: [TypeOrmConfig],
      useFactory: (config: TypeOrmConfig) => config,
    }),
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
  await ConfigModule.preload();

  // Get MysqlConfig Instance
  const config = await ConfigModule.get(MysqlConfig);
  if (!config) throw new Error("Config Not Founded");

  // or
  // const config = await ConfigModule.getOrFail(MysqlConfig);

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

## Loaders

| **Name**           | **Description**                                                                          |
| :----------------- | :--------------------------------------------------------------------------------------- |
| `processEnvLoader` | load from `process.env`                                                                  |
| `dotenvLoader`     | load `.env` file by [`dotenv`](https://www.npmjs.com/package/dotenv)                     |
| `dotenvxLoader`    | load `.env` file by [`@dotenvx/dotenvx`](https://www.npmjs.com/package/@dotenvx/dotenvx) |
| `jsonFileLoader`   | load json file by `JSON.parse`                                                           |

## Q&A

### Reported every field in my Config class was missing, even though they weren't.

**This may be due to `target` in tsconfig.json is `ES2021` or lower.** We recommend using `ES2022` and above.
But, if you must use `ES2021`, every property key should add `@ConfigKey()` decorator ([See More](https://github.com/buka-inc/npm.nestjs-config/issues/26)):

```typescript
// app.config.ts
import { Configuration, ConfigKey } from "@buka/nestjs-config";
import { IsIp, IsIn } from "class-validator";

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

### Nest could not find `YourConfig` element.

**`@buka/nestjs-config` will autoload all the config classes injected by service.**
However, a config that is not used by any service may not be injected into the nestjs app.
And this will causes you to get this error when attempt to `app.get(YourConfig)`.

One solution is use `ConfigModule.get(YourConfig)` replace `app.get(YourConfig)`:

```typescript
await ConfigModule.preload();
const yourConfig = await ConfigModule.get(YourConfig);

// If you do this, you probably want to do something outside of the nestjs runtime.
// do...
```

If you have to inject config class which is not used by any service, you can do it like this:

```typescript
@Module({
  ConfigModule.register({
    isGlobal: true,
    providers: [YourConfig]
  }),
})
class AppModule {}
```
