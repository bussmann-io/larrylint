import rule from '../../../../src/rules/structure/config/public'
import { tsTester } from '../../../utils'

const filename = '/app/src/module.ts'

function module(body: string) {
  return `export default defineNuxtModule({\n  async setup(options, nuxt) {\n${body}\n  },\n})`
}

tsTester.run('public-config', rule, {
  valid: [
    { filename, code: module(`    nuxt.options.runtimeConfig.public[name] = nuxt.options.runtimeConfig[name].public ?? {}`) },
    { filename, code: module(`    nuxt.options.runtimeConfig.public[name] = defu(nuxt.options.runtimeConfig.public[name], options.public)`) },
    { filename, code: module(`    nuxt.options.runtimeConfig[name] = defu(nuxt.options.runtimeConfig[name], options)`) },
    { filename, code: module(`    nuxt.options.runtimeConfig.public[name] = defu(nuxt.options.runtimeConfig.public[name], { storefrontOrigin: options.storefrontUrl ? new URL(options.storefrontUrl).origin : '' })`) },
    { filename, code: module(`    nuxt.options.runtimeConfig.public.maps = { apiKey: options.maps.apiKey }`) },
  ],

  invalid: [
    { filename, code: module(`    nuxt.options.runtimeConfig.public[name] = defu(nuxt.options.runtimeConfig.public[name], options)`), errors: [{ messageId: 'options' }] },
    { filename, code: module(`    nuxt.options.runtimeConfig.public[name] = { ...options, token: undefined }`), errors: [{ messageId: 'options' }] },
  ],
})
