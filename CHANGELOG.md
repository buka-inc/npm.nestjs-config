# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [2.1.5](https://github.com/buka-inc/npm.nestjs-config/compare/v2.1.4...v2.1.5) (2024-11-27)


### Performance Improvements

* upgrade dependens and use fs.access replace existsSync ([15cec8f](https://github.com/buka-inc/npm.nestjs-config/commit/15cec8fdaef5c49914eb19036715e5519c58e5be))

## [2.1.4](https://github.com/buka-lnc/npm.nestjs-config/compare/v2.1.3...v2.1.4) (2024-10-20)


### Bug Fixes

* cannot import package ([f80ffe3](https://github.com/buka-lnc/npm.nestjs-config/commit/f80ffe329684d4c319191d6359bf3ce717c71aa9))

## [2.1.3](https://github.com/buka-lnc/npm.nestjs-config/compare/v2.1.2...v2.1.3) (2024-09-11)


### Bug Fixes

* cannot import esm ([2d604fd](https://github.com/buka-lnc/npm.nestjs-config/commit/2d604fd75a634624ae76db35747f03c9a35252f8))

## [2.1.2](https://github.com/buka-lnc/npm.nestjs-config/compare/v2.1.1...v2.1.2) (2024-08-26)


### Performance Improvements

* display the correct class name in the error message ([d7d8392](https://github.com/buka-lnc/npm.nestjs-config/commit/d7d839253fcb0f7dfeb58364f617370c2acee0de)), closes [#19](https://github.com/buka-lnc/npm.nestjs-config/issues/19)

## [2.1.1](https://github.com/buka-lnc/npm.nestjs-config/compare/v2.1.0...v2.1.1) (2024-06-16)


### Bug Fixes

* the name set by Configuration decorator not work ([152e37a](https://github.com/buka-lnc/npm.nestjs-config/commit/152e37a974d0a3208299fc6d93d2b5db0252adac))

## [2.1.0](https://github.com/buka-lnc/npm.nestjs-config/compare/v2.0.0...v2.1.0) (2024-06-14)


### Features

* add composeLoader function and beautify error log ([6147ccd](https://github.com/buka-lnc/npm.nestjs-config/commit/6147ccd679c5bdd2f7022e2a99f3a45a08491385))
* add StaticConfig decorator ([de0bdbf](https://github.com/buka-lnc/npm.nestjs-config/commit/de0bdbf5a3d8e71483fd82d2726406fbb7ab7c9c))
* cache config/provider and add debug log ([21613c2](https://github.com/buka-lnc/npm.nestjs-config/commit/21613c2796859bc67b41e37c34a6dfd3ef5660a3))

## [2.0.0](https://github.com/buka-lnc/npm.nestjs-config/compare/v1.5.3...v2.0.0) (2024-06-14)


### ⚠ BREAKING CHANGES

* `config` option is deprecated, use `loaders` to instead

### Bug Fixes

* avoid conflicts caused by useless ts definitions ([c3d6b98](https://github.com/buka-lnc/npm.nestjs-config/commit/c3d6b98bf4f3fc6d7f1308f99d40dffa3113e293))
* compatible with useFacotry without Promise ([472013e](https://github.com/buka-lnc/npm.nestjs-config/commit/472013ec320ae7166584be58515a9b5f0068a23c))


### Code Refactoring

* rename config =&gt; loaders ([033987c](https://github.com/buka-lnc/npm.nestjs-config/commit/033987cde36f3fa7b5710592c45a80b04efbf56b))

## [1.5.3](https://github.com/buka-lnc/npm.nestjs-config/compare/v1.5.2...v1.5.3) (2024-04-15)


### Bug Fixes

* wrong return type of ConfigModule.get ([a039239](https://github.com/buka-lnc/npm.nestjs-config/commit/a039239a0ccad3fc27b43ef2c070802aed360196))

## [1.5.2](https://github.com/buka-lnc/npm.nestjs-config/compare/v1.5.1...v1.5.2) (2024-04-03)


### Bug Fixes

* wrong init loader options ([29eff18](https://github.com/buka-lnc/npm.nestjs-config/commit/29eff188cce08e33d41727b4757ff066e83a939f))

## [1.5.1](https://github.com/buka-lnc/npm.nestjs-config/compare/v1.5.0...v1.5.1) (2024-04-03)


### Bug Fixes

* dotenv-loader options cannot control jsonParse ([8a28ae0](https://github.com/buka-lnc/npm.nestjs-config/commit/8a28ae052f21bb4915e7d42269ef59f72ec83deb))

## [1.5.0](https://github.com/buka-lnc/npm.nestjs-config/compare/v1.4.0...v1.5.0) (2024-04-03)


### Features

* process.env support jsonParse ([9e666ae](https://github.com/buka-lnc/npm.nestjs-config/commit/9e666ae94fdb73b84baeb5eac9df3e192a9f96f7))

## [1.4.0](https://github.com/buka-lnc/npm.nestjs-config/compare/v1.3.0...v1.4.0) (2024-04-02)


### Features

* dotenvLoader auto parse json value ([578c010](https://github.com/buka-lnc/npm.nestjs-config/commit/578c0105952eb2a23a8aa4212608ae0003cf80da))

## [1.3.0](https://github.com/buka-lnc/npm.nestjs-config/compare/v1.2.0...v1.3.0) (2024-04-02)


### Features

* can load config and provider before registering the module ([d46ae63](https://github.com/buka-lnc/npm.nestjs-config/commit/d46ae63ec597d14ebc9b5f7f42e7e1ed379e41a6))

## [1.2.0](https://github.com/buka-lnc/npm.nestjs-config/compare/v1.1.2...v1.2.0) (2024-01-29)


### Features

* .inject() addition override config ability ([ec69fd0](https://github.com/buka-lnc/npm.nestjs-config/commit/ec69fd0c50a2d41e9068528657d679740274919f))

## [1.1.2](https://github.com/buka-lnc/npm.nestjs-config/compare/v1.1.1...v1.1.2) (2024-01-22)


### Bug Fixes

* wrong package keywords ([75a64ae](https://github.com/buka-lnc/npm.nestjs-config/commit/75a64ae5fb37949fce6f5c934cfb04e1006415e7))

## [1.1.1](https://github.com/buka-lnc/npm.nestjs-config/compare/v1.1.0...v1.1.1) (2024-01-20)


### Bug Fixes

* class-validator and class-transformer should be peer dependencies ([89bd0dd](https://github.com/buka-lnc/npm.nestjs-config/commit/89bd0dd2523d1918e6b4e9674f9a5937ea9d161c))
* transforme should before validate ([d6a2501](https://github.com/buka-lnc/npm.nestjs-config/commit/d6a2501d8eeb30c8e6817bb9ce5da19d254c5db6))

## [1.1.0](https://github.com/buka-lnc/npm.nestjs-config/compare/v1.0.5...v1.1.0) (2024-01-20)


### Features

* add ConfigModule.inject(provider, module[, moduleAsyncOptions]) ([71f9ed5](https://github.com/buka-lnc/npm.nestjs-config/commit/71f9ed5ca929c14aa6788e1b16347fb1ef87e351))

## [1.0.5](https://github.com/buka-lnc/npm.nestjs-config/compare/v1.0.4...v1.0.5) (2024-01-18)


### Bug Fixes

* crash when prefixed config is not defined ([5ae9fd1](https://github.com/buka-lnc/npm.nestjs-config/commit/5ae9fd142900f0c53c187493d36e1bab4bc0e429))

## [1.0.4](https://github.com/buka-lnc/npm.nestjs-config/compare/v1.0.3...v1.0.4) (2024-01-18)


### Bug Fixes

* unabled publish in actions ([f7fb7b7](https://github.com/buka-lnc/npm.nestjs-config/commit/f7fb7b72c0546ec353e442c7b09ebe3d1049ca5d))

## [1.0.3](https://github.com/buka-lnc/npm.nestjs-config/compare/v1.0.2...v1.0.3) (2024-01-18)


### Bug Fixes

* unable to read configuration providers ([05fce44](https://github.com/buka-lnc/npm.nestjs-config/commit/05fce442088385f8bd9fa74b3fbc1fdf05aa7338))

## [1.0.2](https://github.com/buka-lnc/npm.nestjs-config/compare/v1.0.1...v1.0.2) (2024-01-18)


### Bug Fixes

* crash when no configuration ([f0a70e8](https://github.com/buka-lnc/npm.nestjs-config/commit/f0a70e8704dcb705a62c22879a4c41866d794112))

## [1.0.1](https://github.com/buka-lnc/npm.nestjs-config/compare/v1.0.0...v1.0.1) (2024-01-06)


### Bug Fixes

* the default value of configuration class property not take effect ([b0cae86](https://github.com/buka-lnc/npm.nestjs-config/commit/b0cae86ba1be3832809a47933177624076e854ee))

## 1.0.0 (2024-01-06)
