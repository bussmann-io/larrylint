import type { ESLint } from 'eslint'

import { name, version } from '../../package.json'
import { button } from '../rules/components/button'
import { definition } from '../rules/components/definition'
import { files } from '../rules/orchestr/files'
import { layers } from '../rules/structure/layers'

export const plugin = {
  meta: { name, version },
  rules: {
    'layers': layers,
    'orchestr-files': files,
    'definitions': definition,
    'button-type': button,
  },
} satisfies ESLint.Plugin
