// eslint-disable-next-line ts/no-explicit-any
export async function fetchAllBrunches(): Promise<any[]> {
  return []
}

export default defineHygraph.queryHandler(BrunchQuery, fetchAllBrunches)
