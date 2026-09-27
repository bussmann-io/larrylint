import rule from '../../../src/rules/structure/layers'
import { runtime, tsTester } from '../../utils'

tsTester.run('layers', rule, {
  valid: [
    { filename: runtime('app/composables/useBrunch.ts'), code: `import { BrunchQuery } from '../../shared/tokens/Brunch'` },
    { filename: runtime('server/orchestr/ticketing/Order.query.ts'), code: `import { fetchOrders } from '../../orchestr-helper/ticketing/orders'` },
    { filename: runtime('server/orchestr/ticketing/Order.query.ts'), code: `import { defineTicketApi } from '../../middleware/ticketApi'` },
    { filename: runtime('server/orchestr/ticketing/Order.query.ts'), code: `import { mapAsset } from '../../mappers/asset'` },
    { filename: runtime('server/orchestr/ticketing/Order.query.ts'), code: `import type { TicketApi } from '../../client/ticketApi'` },
    { filename: runtime('server/utils/accountDeletion.ts'), code: `import { photoApi } from '../client/photoApi'` },
    { filename: runtime('server/middleware/identity.ts'), code: `import { createUnidyClient } from '../client/unidy'` },
    { filename: runtime('server/utils/status.ts'), code: `import status from '../api/tickets/status.get'` },
    { filename: runtime('server/utils/brunch.ts'), code: `import type { Brunch } from '../orchestr/brunch/Brunch.resolver'` },
    { filename: runtime('server/orchestr/ticketing/Order.query.test.ts'), code: `import handler from './Order.query'` },
    { filename: runtime('app/composables/useOrder.ts'), code: `import type { Order } from '../../server/utils/orders'` },
    { filename: runtime('app/composables/useCards.ts'), code: `import Card from '../components/Card.vue'` },
    { filename: runtime('app/components/Grid.ts'), code: `import type { SectionHeroProps } from '../sections/SectionHero.vue'` },
    { filename: runtime('app/plugins/options.ts'), code: `import type { ModuleOptions } from '../../../module'` },
    { filename: runtime('app/plugins/styleTokens.server.ts'), code: `import { readFile } from 'node:fs/promises'` },
    { filename: runtime('server/utils/hash.ts'), code: `import { createHash } from 'node:crypto'` },
    { filename: runtime('shared/models/buffer.ts'), code: `import type { Buffer } from 'node:buffer'` },
    { filename: runtime('app/sections/SectionCards.ts'), code: `import BlockCard from '../blocks/BlockCard.vue'` },
    { filename: '/app/src/module.ts', code: `import handler from './runtime/server/orchestr/Brunch.query'` },
  ],

  invalid: [
    { filename: runtime('app/composables/useOrder.ts'), code: `import { orders } from '../../server/utils/orders'`, errors: [{ messageId: 'appImportsServer' }] },
    { filename: runtime('app/composables/useOrder.ts'), code: `export { orders } from '../../server/utils/orders'`, errors: [{ messageId: 'appImportsServer' }] },
    { filename: runtime('app/composables/useOrder.ts'), code: `const utils = await import('../../server/utils/orders')`, errors: [{ messageId: 'appImportsServer' }] },
    { filename: runtime('server/utils/cards.ts'), code: `import Card from '../../app/components/Card.vue'`, errors: [{ messageId: 'serverImportsApp' }] },
    { filename: runtime('shared/tokens/Order.ts'), code: `import { orders } from '../../server/utils/orders'`, errors: [{ messageId: 'sharedImportsSide', data: { side: 'server' } }] },
    { filename: runtime('app/plugins/cropper.ts'), code: `import { setup } from '../../../setup/cropper'`, errors: [{ messageId: 'runtimeImportsBuild' }] },
    { filename: runtime('server/orchestr/brunch/BrunchByStandort.query.ts'), code: `import { fetchAllBrunches } from './Brunch.query'`, errors: [{ messageId: 'handlerImported' }] },
    { filename: runtime('server/orchestr/shop/Product.query.ts'), code: `import { createShopwareClient } from '../../client/shopware'`, errors: [{ messageId: 'clientInHandler' }] },
    { filename: runtime('app/components/Grid.ts'), code: `import SectionHero from '../sections/SectionHero.vue'`, errors: [{ messageId: 'schemaInComponent', data: { kind: 'section' } }] },
    { filename: runtime('app/components/CardList.ts'), code: `import BlockCard from '../blocks/BlockCard.vue'`, errors: [{ messageId: 'schemaInComponent', data: { kind: 'block' } }] },
    { filename: runtime('app/utils/files.ts'), code: `import { readFile } from 'node:fs/promises'`, errors: [{ messageId: 'nodeBuiltin', data: { name: 'node:fs/promises' } }] },
  ],
})
