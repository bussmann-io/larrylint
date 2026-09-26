import type { ESLint } from 'eslint'

import { name, version } from '../../package.json'
import money from '../rules/canonical/money'
import mutationErrors from '../rules/frontend/data/mutations'
import orchestrStore from '../rules/frontend/data/store'
import internalAnchors from '../rules/frontend/links/anchors'
import handBuiltLinks from '../rules/frontend/links/paths'
import resolveResult from '../rules/frontend/links/resolve'
import buttonType from '../rules/frontend/ui-kit/button'
import uiKitTags from '../rules/frontend/ui-kit/tags'
import actionErrors from '../rules/orchestr/actions/errors'
import orchestrCookies from '../rules/orchestr/cookies'
import orchestrFiles from '../rules/orchestr/files'
import handlerContext from '../rules/orchestr/handlers/context'
import handlerDomains from '../rules/orchestr/handlers/domains'
import handlerExports from '../rules/orchestr/handlers/exports'
import middlewareFiles from '../rules/orchestr/middleware/files'
import orchestrMeta from '../rules/orchestr/middleware/meta'
import initwareThrows from '../rules/orchestr/middleware/throws'
import resolverPassthrough from '../rules/orchestr/resolvers/passthrough'
import resolverUndefined from '../rules/orchestr/resolvers/returns'
import tokenNamespaces from '../rules/orchestr/tokens/namespaces'
import tokenNullable from '../rules/orchestr/tokens/nullable'
import definitionDescription from '../rules/sections/definition/description'
import definitionFolder from '../rules/sections/definition/folder'
import componentName from '../rules/sections/definition/name'
import definitionPrefix from '../rules/sections/definition/prefix'
import deadFallbacks from '../rules/sections/props/fallbacks'
import unusedFields from '../rules/sections/props/unused'
import fieldNameCase from '../rules/sections/schema/casing'
import schemaGroups from '../rules/sections/schema/groups'
import requiredFields from '../rules/sections/schema/required'
import reservedFieldNames from '../rules/sections/schema/reserved'
import rootId from '../rules/sections/template/id'
import singleRoot from '../rules/sections/template/root'
import slotChildren from '../rules/sections/template/slots'
import heavyImports from '../rules/structure/bundle'
import configKeys from '../rules/structure/config/keys'
import publicConfig from '../rules/structure/config/public'
import knownFolders from '../rules/structure/folders'
import layers from '../rules/structure/layers'

export const plugin = {
  meta: { name, version },
  rules: {
    'layers': layers,
    'known-folders': knownFolders,
    'heavy-imports': heavyImports,
    'config-keys': configKeys,
    'public-config': publicConfig,
    'orchestr-files': orchestrFiles,
    'orchestr-cookies': orchestrCookies,
    'handler-domains': handlerDomains,
    'handler-exports': handlerExports,
    'handler-context': handlerContext,
    'resolver-undefined': resolverUndefined,
    'resolver-passthrough': resolverPassthrough,
    'action-errors': actionErrors,
    'middleware-files': middlewareFiles,
    'initware-throws': initwareThrows,
    'orchestr-meta': orchestrMeta,
    'token-namespaces': tokenNamespaces,
    'token-nullable': tokenNullable,
    'definition-folder': definitionFolder,
    'definition-prefix': definitionPrefix,
    'component-name': componentName,
    'definition-description': definitionDescription,
    'root-id': rootId,
    'single-root': singleRoot,
    'slot-children': slotChildren,
    'reserved-field-names': reservedFieldNames,
    'field-name-case': fieldNameCase,
    'required-fields': requiredFields,
    'schema-groups': schemaGroups,
    'unused-fields': unusedFields,
    'dead-fallbacks': deadFallbacks,
    'button-type': buttonType,
    'ui-kit-tags': uiKitTags,
    'mutation-errors': mutationErrors,
    'orchestr-store': orchestrStore,
    'resolve-result': resolveResult,
    'hand-built-links': handBuiltLinks,
    'internal-anchors': internalAnchors,
    'money': money,
  },
} satisfies ESLint.Plugin
