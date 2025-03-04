export function parseValue(value: any, jsonParse?: boolean): any {
  if ((jsonParse === undefined || jsonParse === true) && typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch (e) {
      return value
    }
  }

  return value
}
