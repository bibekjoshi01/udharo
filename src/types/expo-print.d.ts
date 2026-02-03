declare module 'expo-print' {
  export type PrintOptions = {
    html: string;
    base64?: boolean;
  };
  export type PrintFile = {
    uri: string;
  };
  export function printToFileAsync(options: PrintOptions): Promise<PrintFile>;
}
