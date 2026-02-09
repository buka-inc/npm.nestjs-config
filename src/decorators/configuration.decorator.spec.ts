import { expect, test } from '@jest/globals'
import { Configuration } from './configuration.decorator.js'
import { ConfigurationDefinitionRegistry } from '~/configuration-registry.js'


@Configuration('test')
class TestClass {
}

test('Configuration', () => {
  const providers = ConfigurationDefinitionRegistry.getAll()
  expect(providers.map((p) => p.target)).toEqual([TestClass])
})
