import { describe, expect, it } from 'vitest';
import { toUserAssignmentsUpdatePayload } from './userAssignmentsPayload';

describe('toUserAssignmentsUpdatePayload', () => {
  it('clears scopeId for organization rows', () => {
    const payload = toUserAssignmentsUpdatePayload([
      { roleDefinitionId: 'a', scopeType: 'organization', scopeId: 'should-drop' },
    ]);
    expect(payload).toEqual([{ roleDefinitionId: 'a', scopeType: 'organization', scopeId: null }]);
  });

  it('keeps scopeId for brand rows', () => {
    const payload = toUserAssignmentsUpdatePayload([
      { roleDefinitionId: 'b', scopeType: 'brand', scopeId: 'brand-1' },
    ]);
    expect(payload).toEqual([{ roleDefinitionId: 'b', scopeType: 'brand', scopeId: 'brand-1' }]);
  });
});
