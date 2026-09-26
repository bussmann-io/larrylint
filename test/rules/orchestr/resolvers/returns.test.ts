import rule from '../../../../src/rules/orchestr/resolvers/returns'
import { runtime, tsTester } from '../../../utils'

const filename = runtime('server/orchestr/gastronomy/Gastronomy.resolver.ts')

function resolver(component: string) {
  return `export default defineHygraphResolver({\n  resolve: async ({ $entity }) => ({\n    entities: [$entity({ id: 'a', base: ${component} })],\n  }),\n})`
}

tsTester.run('resolver-undefined', rule, {
  valid: [
    { filename, code: resolver(`() => ({ title: gas.title ?? '', description: gas.description ? { html: gas.description.html } : { html: '' } })`) },
    { filename, code: resolver(`() => {\n  const title = gas.title ?? ''\n  return { title, tags: gas.tags ?? [] }\n}`) },
    { filename: runtime('server/utils/gastronomy.ts'), code: `export const map = gas => ({ title: gas.title ?? undefined })` },
  ],

  invalid: [
    {
      filename,
      code: resolver(`() => ({ title: gas.title ?? null, subtitle: undefined, badge: gas.badge ? gas.badge : null })`),
      errors: [{ messageId: 'empty' }, { messageId: 'empty' }, { messageId: 'empty' }],
    },
    {
      filename,
      code: resolver(`{ googlePlaceId: site.googlePlaceId ?? undefined }`),
      errors: [{ messageId: 'empty' }],
    },
    {
      filename,
      code: resolver(`() => {\n  if (!gas) return { title: null }\n  return { title: gas.title }\n}`),
      errors: [{ messageId: 'empty' }],
    },
  ],
})
