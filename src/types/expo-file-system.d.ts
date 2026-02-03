declare module 'expo-file-system' {
  export const documentDirectory: string;
  export const EncodingType: {
    UTF8: string;
  };
  export function writeAsStringAsync(
    uri: string,
    data: string,
    options?: { encoding?: string },
  ): Promise<void>;
  export function readAsStringAsync(
    uri: string,
    options?: { encoding?: string },
  ): Promise<string>;
}
