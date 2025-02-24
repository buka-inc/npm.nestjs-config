import { DynamicModule } from '@nestjs/common'
import { AsyncOptions } from './async-options.js'


export interface InjectedModuleWithRegisterAsync {
  registerAsync<T extends AsyncOptions>(options: T): DynamicModule
}

export interface InjectedModuleWithForRootAsync {
  forRootAsync<T extends AsyncOptions>(options: T): DynamicModule
}

export type InjectedModule = InjectedModuleWithRegisterAsync | InjectedModuleWithForRootAsync

export type AsyncOptionsOfModule<M extends InjectedModule> = M extends InjectedModuleWithForRootAsync ? Parameters<M['forRootAsync']>[0] : M extends InjectedModuleWithRegisterAsync ? Parameters<M['registerAsync']>[0] : never
