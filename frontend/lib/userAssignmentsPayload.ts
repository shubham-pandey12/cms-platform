export type AssignmentRowInput = {
  roleDefinitionId: string;
  scopeType: 'organization' | 'brand';
  scopeId: string | null;
};

/**
 * Maps UI rows to the PUT /api/users/{id}/assignments body shape.
 * Organization rows must not send a brand scope id.
 */
export function toUserAssignmentsUpdatePayload(rows: AssignmentRowInput[]) {
  return rows.map((row) => ({
    roleDefinitionId: row.roleDefinitionId,
    scopeType: row.scopeType,
    scopeId: row.scopeType === 'brand' ? row.scopeId : null,
  }));
}
