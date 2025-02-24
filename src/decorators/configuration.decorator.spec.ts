import { expect, test } from '@jest/globals'
import { Configuration } from './configuration.decorator.js'
import { ConfigurationRegistry } from '~/configuration-registry.js'


@Configuration('test')
class TestClass {
}

test('Configuration', () => {
  const providers = ConfigurationRegistry.getProviders()
  expect(providers.map((p) => p.target)).toEqual([TestClass])
})
