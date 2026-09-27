import { describe, expect, it } from 'vitest'
import { classify } from '../../../src/lib/laioutr/layout'
import { fixtureRuntime } from '../../utils'

describe('classify', () => {
  it('finds handlers and plugins in orchestr/', () => {
    expect(classify('/app/src/runtime/server/orchestr/ticketing/Order.query.ts')).toMatchObject({ root: '/app', path: 'src/runtime/server/orchestr/ticketing/Order.query.ts', side: 'server', kind: 'handler', handler: 'query' })
    expect(classify('/app/src/runtime/server/orchestr/Brunch.resolver.ts')).toMatchObject({ kind: 'handler', handler: 'resolver' })
    expect(classify('/app/src/runtime/server/orchestr/blog/bySlug.templates.ts')).toMatchObject({ kind: 'handler', handler: 'template' })
    expect(classify('/app/src/runtime/server/orchestr/Brunch.query')).toMatchObject({ kind: 'handler' })
    expect(classify('/app/src/runtime/server/orchestr/plugins/zodFix.ts')).toMatchObject({ kind: 'orchestr-plugin' })
    expect(classify('/app/src/runtime/server/orchestr/helpers.ts')).toMatchObject({ kind: 'orchestr-file' })
  })

  it('finds middleware and API clients on the server', () => {
    expect(classify('/app/src/runtime/server/middleware/hygraph.ts')).toMatchObject({ kind: 'middleware' })
    expect(classify('/app/src/runtime/server/client/shopware.ts')).toMatchObject({ kind: 'client' })
    expect(classify('/app/src/runtime/server/orchestr-helper/cart.ts')).toMatchObject({ side: 'server', kind: 'other' })
  })

  it('finds sections, blocks and components in the app', () => {
    expect(classify('/app/src/runtime/app/sections/SectionHero.vue')).toMatchObject({ side: 'app', kind: 'section' })
    expect(classify('/app/src/runtime/app/blocks/account/BlockProfile.vue')).toMatchObject({ kind: 'block' })
    expect(classify('/app/src/runtime/app/sections/heroItems.ts')).toMatchObject({ kind: 'other' })
    expect(classify('/app/src/runtime/app/components/Card.vue')).toMatchObject({ kind: 'component' })
    expect(classify('/app/src/runtime/app/plugins/theme.ts')).toMatchObject({ kind: 'other' })
    expect(classify('/app/src/runtime/shared/tokens/Brunch.ts')).toMatchObject({ side: 'shared' })
  })

  it('follows what module.ts registers', () => {
    const registered = (path: string) => classify(fixtureRuntime(path, 'registered'))

    expect(registered('app/section/hero/SectionHeroSlider.vue')).toMatchObject({ kind: 'section' })
    expect(registered('app/section/hero/BlockSlide.vue')).toMatchObject({ kind: 'block' })
    expect(registered('app/block/BlockPlanCard.vue')).toMatchObject({ kind: 'block' })
    expect(registered('app/section/hero/HeroSlide.vue')).toMatchObject({ kind: 'other' })
    expect(registered('app/sections/SectionHero.vue')).toMatchObject({ kind: 'other' })
    expect(registered('app/plugins/map.ts')).toMatchObject({ kind: 'app-plugin' })
    expect(registered('app/plugins/scanner.client.ts')).toMatchObject({ kind: 'app-plugin' })
    expect(registered('app/plugins/unused.ts')).toMatchObject({ kind: 'other' })
    expect(registered('server/handlers/Order.query.ts')).toMatchObject({ kind: 'handler', handler: 'query' })
    expect(registered('server/orchestr/Order.query.ts')).toMatchObject({ kind: 'other' })
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
