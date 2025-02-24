import { Type } from '@nestjs/common'


export interface IConfigProvider {
  target: Type<any>
  path: string
}
