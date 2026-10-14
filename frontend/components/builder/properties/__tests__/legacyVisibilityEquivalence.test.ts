/**
 * Verifies that the new schema-driven visibility logic produces the same results
 * as the old shouldHideField function for the known legacy field names.
 */
import { describe, it, expect } from 'vitest';
import { evaluateCondition } from '@/lib/widgetSchema/evaluateCondition';
import type { Condition, WidgetConfigField } from '@/types/cms';

const LEGACY_RULES: Record<string, string> = {
  packages: 'apiEndpoint',
  images: 'apiEndpoint',
  features: 'apiEndpoint',
  slides: 'apiEndpoint',
  questions: 'apiEndpoint',
  holidayTypes: 'holidayTypesApiEndpoint',
  destinations: 'destinationsApiEndpoint',
  importantLinks: 'importantLinksApiEndpoint',
  destinationsItems: 'destinationsApiEndpoint',
  holidayTypesItems: 'holidayTypesApiEndpoint',
};

/** Reproduce old shouldHideField logic */
function oldShouldHide(fieldName: string, config: Record<string, unknown>): boolean {
  const hasValue = (v: unknown) =>
    typeof v === 'string' ? v.trim().length > 0 : false;

  const apiBackedFields = new Set(['packages', 'images', 'features', 'slides', 'questions']);
  if (hasValue(config.apiEndpoint) && apiBackedFields.has(fieldName)) return true;
  if (fieldName === 'holidayTypes' && hasValue(config.holidayTypesApiEndpoint)) return true;
  if ((fieldName === 'destinations' || fieldName === 'destinationsItems') && hasValue(config.destinationsApiEndpoint)) return true;
  if (fieldName === 'importantLinks' && hasValue(config.importantLinksApiEndpoint)) return true;
  if (fieldName === 'holidayTypesItems' && hasValue(config.holidayTypesApiEndpoint)) return true;
  return false;
}

/** Derive new condition from hiddenIfFieldHasValue */
function newCondition(field: WidgetConfigField): Condition | undefined {
  if (field.hiddenIfFieldHasValue) return { field: field.hiddenIfFieldHasValue, op: 'falsy' };
  return undefined;
}

/** Build a fixture field with hiddenIfFieldHasValue */
function makeField(name: string): WidgetConfigField {
  const source = LEGACY_RULES[name];
  return {
    name,
    label: name,
    type: 'array',
    required: false,
    hiddenIfFieldHasValue: source,
  };
}

const CONFIGS = [
  {},
  { apiEndpoint: '' },
  { apiEndpoint: 'https://api.example.com/packages' },
  { holidayTypesApiEndpoint: 'https://api.example.com/holidayTypes' },
  { destinationsApiEndpoint: 'https://api.example.com/destinations' },
  { importantLinksApiEndpoint: 'https://api.example.com/links' },
];

describe('legacy shouldHideField equivalence', () => {
  for (const fieldName of Object.keys(LEGACY_RULES)) {
    for (const config of CONFIGS) {
      const configDescription = Object.entries(config).map(([k, v]) => `${k}="${v}"`).join(', ') || 'empty config';

      it(`field="${fieldName}" config={${configDescription}} old==new`, () => {
        const field = makeField(fieldName);
        const cond = newCondition(field);

        // Old: shouldHide=true means field should be hidden (NOT visible)
        const oldHidden = oldShouldHide(fieldName, config);
        // New: evaluateCondition returns true means field IS visible
        const newVisible = evaluateCondition(cond, config);

        expect(newVisible).toBe(!oldHidden);
      });
    }
  }
});
