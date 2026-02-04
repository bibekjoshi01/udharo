import { useStore } from '../store/useStore';
import { STRINGS_NE } from './strings.ne';
import { STRINGS_EN } from './strings.en';

type StringValue<T> = T extends (...args: any[]) => any ? T : string;
export type Strings = {
  [K in keyof typeof STRINGS_NE]: StringValue<typeof STRINGS_NE[K]>;
};
export type LanguageCode = 'ne' | 'en';

export function getStrings(language?: string): Strings {
  const resolved = language ?? useStore.getState().prefs.language;
  return resolved === 'en' ? STRINGS_EN : STRINGS_NE;
}

export function useStrings(): Strings {
  const language = useStore((state) => state.prefs.language);
  return getStrings(language);
}
