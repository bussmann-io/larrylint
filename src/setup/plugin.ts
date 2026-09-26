import type { ESLint } from 'eslint'

import { name, version } from '../../package.json'
import mutationErrors from '../rules/frontend/data/mutations'
import buttonType from '../rules/frontend/ui-kit/button'
import orchestrFiles from '../rules/orchestr/files'
import handlerDomains from '../rules/orchestr/handlers/domains'
import handlerExports from '../rules/orchestr/handlers/exports'
import definitionFolder from '../rules/sections/definition/folder'
import componentName from '../rules/sections/definition/name'
import definitionPrefix from '../rules/sections/definition/prefix'
import reservedFieldNames from '../rules/sections/schema/reserved'
import layers from '../rules/structure/layers'

export const plugin = {
  meta: { name, version },
  rules: {
    'layers': layers,
    'orchestr-files': orchestrFiles,
    'handler-domains': handlerDomains,
    'handler-exports': handlerExports,
    'definition-folder': definitionFolder,
    'definition-prefix': definitionPrefix,
    'component-name': componentName,
    'reserved-field-names': reservedFieldNames,
    'button-type': buttonType,
    'mutation-errors': mutationErrors,
  },
} satisfies ESLint.Plugin
