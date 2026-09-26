import type { ESLint } from 'eslint'

import { name, version } from '../../../package.json'
import mutationErrors from '../../rules/frontend/data/mutations'
import internalAnchors from '../../rules/frontend/links/anchors'
import handBuiltLinks from '../../rules/frontend/links/paths'
import resolveResult from '../../rules/frontend/links/resolve'
import buttonType from '../../rules/frontend/ui-kit/button'
import orchestrCookies from '../../rules/orchestr/cookies'
import orchestrFiles from '../../rules/orchestr/files'
import handlerExports from '../../rules/orchestr/handlers/exports'
import middlewareFiles from '../../rules/orchestr/middleware/files'
import initwareThrows from '../../rules/orchestr/middleware/throws'
import tokenNamespaces from '../../rules/orchestr/tokens/namespaces'
import definitionDescription from '../../rules/sections/definition/description'
import definitionFolder from '../../rules/sections/definition/folder'
import componentName from '../../rules/sections/definition/name'
import deadFallbacks from '../../rules/sections/props/fallbacks'
import unusedFields from '../../rules/sections/props/unused'
import fieldNameCase from '../../rules/sections/schema/casing'
import requiredFields from '../../rules/sections/schema/required'
import reservedFieldNames from '../../rules/sections/schema/reserved'
import singleRoot from '../../rules/sections/template/root'
import slotChildren from '../../rules/sections/template/slots'
import heavyImports from '../../rules/structure/bundle'
import configKeys from '../../rules/structure/config/keys'
import publicConfig from '../../rules/structure/config/public'
import layers from '../../rules/structure/layers'

export const plugin = {
  meta: { name, version },
  rules: {
    'layers': layers,
    'heavy-imports': heavyImports,
    'config-keys': configKeys,
    'public-config': publicConfig,
    'orchestr-files': orchestrFiles,
    'orchestr-cookies': orchestrCookies,
    'handler-exports': handlerExports,
    'middleware-files': middlewareFiles,
    'initware-throws': initwareThrows,
    'token-namespaces': tokenNamespaces,
    'definition-folder': definitionFolder,
    'component-name': componentName,
    'definition-description': definitionDescription,
    'single-root': singleRoot,
    'slot-children': slotChildren,
    'reserved-field-names': reservedFieldNames,
    'field-name-case': fieldNameCase,
    'required-fields': requiredFields,
    'unused-fields': unusedFields,
    'dead-fallbacks': deadFallbacks,
    'button-type': buttonType,
    'mutation-errors': mutationErrors,
    'resolve-result': resolveResult,
    'hand-built-links': handBuiltLinks,
    'internal-anchors': internalAnchors,
  },
} satisfies ESLint.Plugin
