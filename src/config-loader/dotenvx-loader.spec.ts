import { afterEach, expect, jest, test } from '@jest/globals'
import * as fs from 'fs/promises'
import { dotenvxLoader } from './dotenvx-loader.js'
import { Logger } from '@nestjs/common'


afterEach(() => {
  jest.clearAllMocks()
})

test('dotenvxLoader', async () => {
  const warn = jest.spyOn(Logger, 'warn')

  process.env.T2 = 't2'
  await fs.writeFile('/.env', 'T1=t1\nT2=${T2}')

  const testConfig = await dotenvxLoader('/.env')({ suppressWarnings: true, providers: [] })
  expect(testConfig['T1']).toBe('t1')
  expect(testConfig['T2']).toEqual('t2')
  expect(warn.mock.calls.length).toBe(0)


  const unknownConfig = await dotenvxLoader('unknown.env')({ providers: [] })
  expect(unknownConfig).toEqual({})

  expect(warn.mock.calls.length).toBe(1)
})
