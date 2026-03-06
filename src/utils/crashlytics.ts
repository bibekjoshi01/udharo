import crashlytics from '@react-native-firebase/crashlytics';

export function logError(error: unknown) {
  crashlytics().recordError(error as Error);
}

export function logMessage(message: string) {
  crashlytics().log(message);
}
