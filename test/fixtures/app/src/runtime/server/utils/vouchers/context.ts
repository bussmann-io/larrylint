import { orders } from '../ticketing'
import { price } from '../product/price'
import { track } from '../tracking/track'

export function context() {
  track('context')

  return orders.map(order => price(order.length))
}
