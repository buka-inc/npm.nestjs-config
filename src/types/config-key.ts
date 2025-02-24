export interface IConfigExistedKey {
  ignore: false
  propertyKey: string | symbol
  configKey?: string
}

export interface IConfigIgnoredKey {
  ignore: true
  propertyKey: string | symbol
}

export type IConfigKey = IConfigExistedKey | IConfigIgnoredKey
