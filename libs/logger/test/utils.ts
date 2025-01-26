/* eslint-disable no-control-regex */
export function stripAnsi(str: string): string {
  return str.replace(/\u001B\[\d+m/g, '');
}
