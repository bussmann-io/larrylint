import { describe, expect, it } from 'vitest'
import { classify } from '../../../src/lib/laioutr/layout'

describe('classify', () => {
  it('finds handlers and plugins in orchestr/', () => {
    expect(classify('/app/src/runtime/server/orchestr/ticketing/Order.query.ts')).toMatchObject({ root: '/app', path: 'src/runtime/server/orchestr/ticketing/Order.query.ts', side: 'server', kind: 'handler', handler: 'query' })
    expect(classify('/app/src/runtime/server/orchestr/Brunch.resolver.ts')).toMatchObject({ kind: 'handler', handler: 'resolver' })
    expect(classify('/app/src/runtime/server/orchestr/blog/bySlug.templates.ts')).toMatchObject({ kind: 'handler', handler: 'template' })
    expect(classify('/app/src/runtime/server/orchestr/Brunch.query')).toMatchObject({ kind: 'handler' })
    expect(classify('/app/src/runtime/server/orchestr/plugins/zodFix.ts')).toMatchObject({ kind: 'orchestr-plugin' })
    expect(classify('/app/src/runtime/server/orchestr/helpers.ts')).toMatchObject({ kind: 'orchestr-file' })
  })

  it('finds server layers', () => {
    expect(classify('/app/src/runtime/server/utils/ticketing/checkout.ts')).toMatchObject({ kind: 'server-util' })
    expect(classify('/app/src/runtime/server/middleware/hygraph.ts')).toMatchObject({ kind: 'middleware' })
    expect(classify('/app/src/runtime/server/client/shopware.ts')).toMatchObject({ kind: 'client' })
    expect(classify('/app/src/runtime/server/api/tickets/status.get.ts')).toMatchObject({ kind: 'route' })
    expect(classify('/app/src/runtime/server/routes/feed.xml.ts')).toMatchObject({ kind: 'route' })
    expect(classify('/app/src/runtime/server/plugins/log.ts')).toMatchObject({ kind: 'nitro-plugin' })
    expect(classify('/app/src/runtime/server/media-library/tickets.ts')).toMatchObject({ kind: 'media-library' })
    expect(classify('/app/src/runtime/server/media-libraries/shopware.ts')).toMatchObject({ kind: 'media-library' })
    expect(classify('/app/src/runtime/server/graphql/documents.ts')).toMatchObject({ side: 'server', kind: 'other' })
  })

  it('finds app layers and shared code', () => {
    expect(classify('/app/src/runtime/app/sections/SectionHero.vue')).toMatchObject({ side: 'app', kind: 'section' })
    expect(classify('/app/src/runtime/app/blocks/account/BlockProfile.vue')).toMatchObject({ kind: 'block' })
    expect(classify('/app/src/runtime/app/section/SectionHeroSlider.vue')).toMatchObject({ kind: 'section' })
    expect(classify('/app/src/runtime/app/block/BlockPlanCard.vue')).toMatchObject({ kind: 'block' })
    expect(classify('/app/src/runtime/app/components/Card.vue')).toMatchObject({ kind: 'component' })
    expect(classify('/app/src/runtime/app/composables/useCart.ts')).toMatchObject({ kind: 'composable' })
    expect(classify('/app/src/runtime/app/utils/format.ts')).toMatchObject({ kind: 'app-util' })
    expect(classify('/app/src/runtime/app/plugins/theme.ts')).toMatchObject({ kind: 'app-plugin' })
    expect(classify('/app/src/runtime/app/overrides/Media.vue')).toMatchObject({ kind: 'override' })
    expect(classify('/app/src/runtime/shared/tokens/Brunch.ts')).toMatchObject({ side: 'shared', kind: 'shared' })
  })

  it('tells build-time code, types and other files apart', () => {
    expect(classify('/app/src/module.ts')).toMatchObject({ root: '/app', path: 'src/module.ts', side: 'build' })
    expect(classify('/app/src/setup/cropper.ts')).toMatchObject({ side: 'build' })
    expect(classify('/app/src/types/hygraph.d.ts')).toMatchObject({ side: 'other' })
    expect(classify('/app/src/runtime/public/robots.txt')).toMatchObject({ side: 'other' })
    expect(classify('/app/playground/app.vue')).toBeUndefined()
  })

  it('marks tests', () => {
    expect(classify('/app/src/runtime/server/utils/checkout.test.ts')).toMatchObject({ test: true })
    expect(classify('/app/src/runtime/server/utils/checkout.ts')).toMatchObject({ test: false })
  })
})
