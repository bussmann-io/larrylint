import rule from '../../../../src/rules/sections/template/root'
import { fixtureRuntime, runtime, vueTester } from '../../../utils'

const filename = fixtureRuntime('app/sections/SectionMenu.vue', 'components')

function section(template: string, imports = '') {
  return `<script lang="ts">\nexport const definition = defineSection({ component: 'SectionMenu', schema: [] })\n</script>\n\n<script setup lang="ts">\n${imports}\n</script>\n\n<template>\n${template}\n</template>\n`
}

vueTester.run('single-root', rule, {
  valid: [
    { filename, code: section(`  <section>Menu</section>`) },
    { filename, code: section(`  <section v-if="open">Menu</section>\n  <p v-else-if="loading">Loading</p>\n  <p v-else>Closed</p>`) },
    { filename, code: section(`  <OneRoot />`, `import OneRoot from '../components/OneRoot.vue'`) },
    { filename, code: section(`  <TwoRootsForwarding />`, `import TwoRootsForwarding from '../components/TwoRootsForwarding.vue'`) },
    { filename: runtime('app/components/Menu.vue'), code: `<template>\n  <nav />\n  <aside />\n</template>` },
    { filename, code: section(`  <section>Menu</section>\n  <MenuSheet :open="open" />`, `defineOptions({ inheritAttrs: false })`) },
  ],

  invalid: [
    { filename, code: section(`  <section>Menu</section>\n  <MenuSheet :open="open" />`), errors: [{ messageId: 'roots', line: 11 }] },
    { filename, code: section(`  <TwoRoots />`, `import TwoRoots from '../components/TwoRoots.vue'`), errors: [{ messageId: 'componentRoots', data: { name: 'TwoRoots' } }] },
  ],
})
