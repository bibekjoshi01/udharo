declare module 'react-native-nepali-picker' {
  import * as React from 'react';

  export type CalendarPickerProps = {
    visible: boolean;
    onClose: () => void;
    onDateSelect: (bsDate: string) => void;
    language?: 'np' | 'en';
    title?: string;
  };

  export const CalendarPicker: React.ComponentType<CalendarPickerProps>;

  export function BsToAd(bsDate: string): string | null;
  export function AdToBs(adDate: string): string | null;
}
