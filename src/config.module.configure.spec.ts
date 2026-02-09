import { expect, test, beforeEach } from '@jest/globals'
import { ConfigModule } from './config.module'
import { Test } from '@nestjs/testing'
import { processEnvLoader } from './config-loader/process-env-loader.js'
import { Configuration } from './decorators/configuration.decorator.js'

@Configuration('shared_config')
class SharedConfig {
  apiUrl!: string
  timeout!: number
}

beforeEach(() => {
  // Reset static state before each test
  ;(ConfigModule as any).config = null
  ;(ConfigModule as any).providers = new Map()
  ;(ConfigModule as any).globalOptions = null
})

test('ConfigModule.configure() - preload without options', async () => {
  process.env['shared_config__api_url'] = 'http://api.example.com'
  process.env['shared_config__timeout'] = '5000'

  // Configure global options once
  ConfigModule.configure({
    providers: [SharedConfig],
    loaders: [processEnvLoader()],
  })

  // Preload without passing options
  await ConfigModule.preload()

  const config = await ConfigModule.getOrFail(SharedConfig)
  expect(config.apiUrl).toEqual('http://api.example.com')
  expect(config.timeout).toEqual(5000)
})

test('ConfigModule.configure() - register without options', async () => {
  process.env['shared_config__api_url'] = 'http://api2.example.com'
  process.env['shared_config__timeout'] = '3000'

  // Configure global options once
  ConfigModule.configure({
    providers: [SharedConfig],
    loaders: [processEnvLoader()],
  })

  // Register without passing options
  const dynamicModule = ConfigModule.register()

  expect(dynamicModule.global).toBeTruthy()
  expect(dynamicModule.providers).toHaveLength(3)

  const moduleRef = await Test.createTestingModule({
    providers: dynamicModule.providers,
  }).compile()
  const config = moduleRef.get<SharedConfig>(SharedConfig)

  expect(config?.apiUrl).toEqual('http://api2.example.com')
  expect(config?.timeout).toEqual(3000)
})

test('ConfigModule.configure() - options override global config', async () => {
  process.env['shared_config__api_url'] = 'http://global.example.com'
  process.env['shared_config__timeout'] = '1000'

  // Configure global options
  ConfigModule.configure({
    providers: [SharedConfig],
    loaders: [processEnvLoader()],
    suppressWarnings: true,
  })

  // Preload with override options
  await ConfigModule.preload({
    debug: true,
  })

  const config = await ConfigModule.getOrFail(SharedConfig)
  expect(config.apiUrl).toEqual('http://global.example.com')
  expect(config.timeout).toEqual(1000)
})

test('ConfigModule without configure() - backward compatibility', async () => {
  process.env['shared_config__api_url'] = 'http://compat.example.com'
  process.env['shared_config__timeout'] = '2000'

  // Should still work without configure()
  await ConfigModule.preload({
    providers: [SharedConfig],
    loaders: [processEnvLoader()],
  })

  const config = await ConfigModule.getOrFail(SharedConfig)
  expect(config.apiUrl).toEqual('http://compat.example.com')
  expect(config.timeout).toEqual(2000)
})
