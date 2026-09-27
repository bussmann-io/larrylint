import { registerLaioutrApp } from '@laioutr-core/kit'
import { addPlugin, createResolver, defineNuxtModule } from '@nuxt/kit'
import { name, version } from '../package.json'

export default defineNuxtModule({
  meta: { name, version, configKey: name },
  async setup(_options, nuxt) {
    const { resolve } = createResolver(import.meta.url)
    const resolveRuntimeModule = (path: string) => resolve('./runtime', path)

    await registerLaioutrApp({
      name,
      version,
      orchestrDirs: [resolveRuntimeModule('server/handlers')],
      sections: [resolveRuntimeModule('./app/section/**/Section*.vue')],
      blocks: [resolveRuntimeModule('./app/section/**/Block*.vue'), resolveRuntimeModule('./app/block/**/Block*.vue')],
    })

    addPlugin(resolve('./runtime/app/plugins/map'))
    addPlugin({ src: resolve('./runtime/app/plugins/scanner.client'), mode: 'client' })

    const productDetail = resolve('./runtime/app/overrides/SectionProductDetail.vue')

    nuxt.hook('components:extend', (components) => {
      components.find(component => component.pascalName === 'SectionProductDetail')!.filePath = productDetail
    })
  },
})
