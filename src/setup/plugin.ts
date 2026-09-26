import type { ESLint } from 'eslint'

import { name, version } from '../../package.json'
import mutationErrors from '../rules/frontend/data/mutations'
import buttonType from '../rules/frontend/ui-kit/button'
import actionErrors from '../rules/orchestr/actions/errors'
import orchestrCookies from '../rules/orchestr/cookies'
import orchestrFiles from '../rules/orchestr/files'
import handlerContext from '../rules/orchestr/handlers/context'
import handlerDomains from '../rules/orchestr/handlers/domains'
import handlerExports from '../rules/orchestr/handlers/exports'
import contextCookies from '../rules/orchestr/middleware/context'
import middlewareFiles from '../rules/orchestr/middleware/files'
import orchestrMeta from '../rules/orchestr/middleware/meta'
import initwareThrows from '../rules/orchestr/middleware/throws'
import resolverPassthrough from '../rules/orchestr/resolvers/passthrough'
import resolverUndefined from '../rules/orchestr/resolvers/returns'
import tokenNamespaces from '../rules/orchestr/tokens/namespaces'
import tokenNullable from '../rules/orchestr/tokens/nullable'
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
    'orchestr-cookies': orchestrCookies,
    'handler-domains': handlerDomains,
    'handler-exports': handlerExports,
    'handler-context': handlerContext,
    'resolver-undefined': resolverUndefined,
    'resolver-passthrough': resolverPassthrough,
    'action-errors': actionErrors,
    'middleware-files': middlewareFiles,
    'initware-throws': initwareThrows,
    'context-cookies': contextCookies,
    'orchestr-meta': orchestrMeta,
    'token-namespaces': tokenNamespaces,
    'token-nullable': tokenNullable,
    'definition-folder': definitionFolder,
    'definition-prefix': definitionPrefix,
    'component-name': componentName,
    'reserved-field-names': reservedFieldNames,
    'button-type': buttonType,
    'mutation-errors': mutationErrors,
  },
} satisfies ESLint.Plugin
