declare module 'expo-file-system' {
  export const documentDirectory: string;
  export const EncodingType: {
    UTF8: string;
  };
  export type FileInfo = {
    exists: boolean;
    uri: string;
    size?: number;
    isDirectory?: boolean;
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
  export function copyAsync(options: { from: string; to: string }): Promise<void>;
  export function getInfoAsync(
    uri: string,
    options?: { size?: boolean },
  ): Promise<FileInfo>;
}
