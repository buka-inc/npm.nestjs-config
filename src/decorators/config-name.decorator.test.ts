import { expect, test } from '@jest/globals'
import { ConfigName } from './config-name.decorator.js'
import { ConfigurationRegistry } from '~/configuration-registry.js'
import { IConfigExistedKey } from '~/types/config-key.js'

class TestClass {
  @ConfigName('test_class_url')
  url!: string
}

test('ConfigName', () => {
  const t = new TestClass()

  const ck = ConfigurationRegistry.getConfigKey(t, 'url')
  expect(ck.ignore).toBe(false)
  expect((ck as IConfigExistedKey).configKey).toBe('test_class_url')
})
