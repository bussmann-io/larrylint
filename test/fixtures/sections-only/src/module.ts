import { registerLaioutrApp } from '@laioutr-core/kit'
import { createResolver, defineNuxtModule } from '@nuxt/kit'
import { name, version } from '../package.json'

export default defineNuxtModule({
  meta: { name, version, configKey: name },
  async setup() {
    const { resolve } = createResolver(import.meta.url)
    const resolveRuntimeModule = (path: string) => resolve('./runtime', path)

    await registerLaioutrApp({
      name,
      version,
      orchestrDirs: [resolveRuntimeModule('server/orchestr')],
      sections: [resolveRuntimeModule('app/sections/')],
      mediaLibraryProviders: [resolveRuntimeModule('./server/media-libraries/shop')],
    })
  },
})
