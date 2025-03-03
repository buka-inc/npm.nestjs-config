import { afterEach, expect, jest, test } from '@jest/globals'
import * as fs from 'fs/promises'
import { Logger } from '@nestjs/common'
import { tomlFileLoader } from './toml-file-loader'


afterEach(() => {
  jest.clearAllMocks()
})

const toml = `
title = "TOML Title"

[owner]
name = "TOML Owner Name"
`

test('jsonFileLoader', async () => {
  const warn = jest.spyOn(Logger, 'warn')

  const filepath = '/test.toml'

  await fs.writeFile(filepath, toml)

  const testConfig = await tomlFileLoader(filepath)({ suppressWarnings: true, providers: [] })
  console.log('🚀 ~ test ~ testConfig:', testConfig)
  expect(testConfig.title).toBe('TOML Title')
  expect(testConfig.owner.name).toBe('TOML Owner Name')

  const unknownConfig = await tomlFileLoader('/unknown.json')({ providers: [] })
  expect(unknownConfig).toEqual({})

  expect(warn.mock.calls.length).toBe(1)
})
