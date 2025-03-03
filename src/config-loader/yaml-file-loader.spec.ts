import { afterEach, expect, jest, test } from '@jest/globals'
import * as fs from 'fs/promises'
import { Logger } from '@nestjs/common'
import { yamlFileLoader } from './yaml-file-loader'


afterEach(() => {
  jest.clearAllMocks()
})


test('yamlFileLoader', async () => {
  const warn = jest.spyOn(Logger, 'warn')

  await fs.writeFile('/test.yaml', 'test: test')

  const testConfig = await yamlFileLoader('/test.yaml')({ suppressWarnings: true, providers: [] })
  expect(testConfig).toEqual({ test: 'test' })

  const unknownConfig = await yamlFileLoader('/unknown.yaml')({ providers: [] })
  expect(unknownConfig).toEqual({})

  expect(warn.mock.calls.length).toBe(1)
})
