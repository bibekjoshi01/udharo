declare module 'expo-local-authentication' {
  export type AuthenticationOptions = {
    promptMessage?: string;
    cancelLabel?: string;
    disableDeviceFallback?: boolean;
  };

  export type AuthenticationResult = {
    success: boolean;
    error?: string;
    warning?: string;
  };

  export function hasHardwareAsync(): Promise<boolean>;
  export function isEnrolledAsync(): Promise<boolean>;
  export function authenticateAsync(
    options?: AuthenticationOptions
  ): Promise<AuthenticationResult>;
}
