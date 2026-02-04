/**
 * Customer form validation.
 * Name: at least 3 characters.
 * Mobile: if provided, must be exactly 10 digits (Nepali mobile).
 */

import { getStrings } from '../../constants/strings';

const MIN_NAME_LENGTH = 3;
const MOBILE_LENGTH = 10;
const MOBILE_DIGITS_ONLY = /^\d+$/;

export interface CustomerFormInput {
  name: string;
  mobile?: string;
  address?: string;
  note?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof CustomerFormInput, string>>;
}

export const CUSTOMER_VALIDATION = {
  minNameLength: MIN_NAME_LENGTH,
  mobileLength: MOBILE_LENGTH,
} as const;

export function validateCustomerInput(input: CustomerFormInput): ValidationResult {
  const STRINGS = getStrings();
  const errors: ValidationResult['errors'] = {};
  const name = input.name?.trim() ?? '';
  const mobile = input.mobile?.trim() ?? '';

  if (name.length < MIN_NAME_LENGTH) {
    errors.name = STRINGS.nameMinLength(MIN_NAME_LENGTH);
  }

  if (mobile.length > 0) {
    if (!MOBILE_DIGITS_ONLY.test(mobile)) {
      errors.mobile = STRINGS.mobileDigitsOnly;
    } else if (mobile.length !== MOBILE_LENGTH) {
      errors.mobile = STRINGS.mobileLength(MOBILE_LENGTH);
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
