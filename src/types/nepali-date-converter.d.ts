declare module 'nepali-date-converter' {
  export default class NepaliDate {
    constructor(date?: Date | string);
    format(format: string): string;
  }
}
