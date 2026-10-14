import { describe, expect, it, vi } from 'vitest';
import { apiClient } from '../apiClient';
import { getRoles } from './rolesApi';

describe('rolesApi', () => {
  it('returns roles from api client', async () => {
    const payload = [
      {
        id: '1',
        key: 'admin',
        name: 'Admin',
        description: 'Full access',
        isSystem: true,
        permissions: [],
      },
    ];
    const spy = vi.spyOn(apiClient, 'getRoles').mockResolvedValue(payload);

    const result = await getRoles();

    expect(result).toEqual(payload);
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
});

