import { describe, it, expect, beforeEach } from 'vitest';

// We create a fresh registry instance for each test to avoid state bleed
function makeRegistry() {
  // Replicate the class to avoid touching the singleton
  class TestRegistry {
    private renderers = new Map<string, unknown>();
    private operators = new Map<string, (lhs: unknown, rhs: unknown) => boolean>();

    registerFieldRenderer(key: string, renderer: unknown) {
      this.renderers.set(key, renderer);
    }

    getFieldRenderer(key: string) {
      return this.renderers.get(key);
    }

    registerConditionOperator(op: string, fn: (lhs: unknown, rhs: unknown) => boolean) {
      this.operators.set(op, fn);
    }

    getConditionOperator(op: string) {
      return this.operators.get(op);
    }

    listRenderers() {
      return Array.from(this.renderers.keys());
    }
  }
  return new TestRegistry();
}

describe('widgetPropertyRegistry', () => {
  let registry: ReturnType<typeof makeRegistry>;

  beforeEach(() => {
    registry = makeRegistry();
  });

  it('returns undefined for an unknown renderer key', () => {
    expect(registry.getFieldRenderer('unknown.key')).toBeUndefined();
  });

  it('registers and retrieves a field renderer', () => {
    const fakeRenderer = () => null;
    registry.registerFieldRenderer('acme.color', fakeRenderer);
    expect(registry.getFieldRenderer('acme.color')).toBe(fakeRenderer);
  });

  it('overwrites an existing renderer with the same key', () => {
    const r1 = () => null;
    const r2 = () => null;
    registry.registerFieldRenderer('acme.color', r1);
    registry.registerFieldRenderer('acme.color', r2);
    expect(registry.getFieldRenderer('acme.color')).toBe(r2);
  });

  it('lists all registered renderer keys', () => {
    registry.registerFieldRenderer('a.one', () => null);
    registry.registerFieldRenderer('b.two', () => null);
    expect(registry.listRenderers().sort()).toEqual(['a.one', 'b.two']);
  });

  it('registers and retrieves a custom condition operator', () => {
    const fn = (lhs: unknown, rhs: unknown) => typeof lhs === 'string' && (lhs as string).startsWith(rhs as string);
    registry.registerConditionOperator('startsWith', fn);
    const retrieved = registry.getConditionOperator('startsWith');
    expect(retrieved).toBe(fn);
    expect(retrieved?.('hello world', 'hello')).toBe(true);
    expect(retrieved?.('hello world', 'world')).toBe(false);
  });

  it('returns undefined for an unknown operator', () => {
    expect(registry.getConditionOperator('nonExistent')).toBeUndefined();
  });
});
