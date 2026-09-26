import type { ArgsDef } from 'citty'

export const cwdArgs = {
  cwd: {
    type: 'string',
    description: 'Folder of the Laioutr app.',
    default: '.',
  },
} as const satisfies ArgsDef
