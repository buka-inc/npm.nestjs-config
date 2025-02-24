/* eslint-disable @typescript-eslint/no-explicit-any */
export interface AsyncOptions {
  useFactory<T extends object>(...args: any[]): T
  useFactory<T extends object>(...args: any[]): Promise<T> | T
}
