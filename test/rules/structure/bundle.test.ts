import rule from '../../../src/rules/structure/bundle'
import { runtime, tsTester, vueTester } from '../../utils'

const options = [{ packages: ['leaflet', 'qr-scanner'] }]

vueTester.run('heavy-imports', rule, {
  valid: [
    { filename: runtime('app/sections/SectionMap.vue'), code: `<script setup lang="ts">\nconst Map = defineAsyncComponent(() => import('leaflet'))\n</script>`, options },
    { filename: runtime('app/sections/SectionMap.vue'), code: `<script setup lang="ts">\nimport type { Map } from 'leaflet'\n</script>`, options },
    { filename: runtime('app/components/Map.vue'), code: `<script setup lang="ts">\nimport L from 'leaflet'\n</script>`, options },
    { filename: runtime('app/sections/SectionMap.vue'), code: `<script setup lang="ts">\nimport L from 'leaflet'\n</script>` },
  ],

  invalid: [
    { filename: runtime('app/sections/SectionMap.vue'), code: `<script setup lang="ts">\nimport L from 'leaflet'\n</script>`, options, errors: [{ messageId: 'heavy', data: { name: 'leaflet' } }] },
    { filename: runtime('app/blocks/BlockScanner.vue'), code: `<script setup lang="ts">\nimport QrScanner from 'qr-scanner/qr-scanner.min.js'\n</script>`, options, errors: [{ messageId: 'heavy' }] },
  ],
})

tsTester.run('heavy-imports', rule, {
  valid: [],
  invalid: [
    { filename: runtime('app/plugins/map.ts'), code: `import L from 'leaflet'\nexport default defineNuxtPlugin(() => {})`, options, errors: [{ messageId: 'heavy' }] },
  ],
})
