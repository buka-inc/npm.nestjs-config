import { Transform } from 'class-transformer'

/**
 * @deprecated
 */
export function StaticConfig(): PropertyDecorator {
  return Transform(({ key, obj }) => obj[key])
}
