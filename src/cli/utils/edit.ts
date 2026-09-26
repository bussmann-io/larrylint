export interface AstNode {
  type: string
  start: number
  end: number
  [key: string]: any
}

export interface Edit {
  start: number
  end: number
  text: string
}

/**
 * Appends an item to an array literal or call arguments, matching the surrounding line breaks.
 *
 * @param code The source.
 * @param container The array literal or call.
 * @param items Its elements or arguments.
 * @param text The code to append.
 *
 * @returns Where to insert what.
 */
export function appendItem(code: string, container: AstNode, items: AstNode[], text: string): Edit {
  const closing = container.end - 1
  const last = items.at(-1)
  const insert = (at: number, insertion: string) => ({ start: at, end: at, text: insertion })

  if (!last) {
    return insert(closing, text)
  }

  if (!code.slice(container.start, container.end).includes('\n')) {
    return insert(last.end, `, ${text}`)
  }

  const indent = code.slice(code.lastIndexOf('\n', last.start) + 1, last.start).match(/^[ \t]*/)![0]
  const comma = code.indexOf(',', last.end)

  return comma !== -1 && comma < closing
    ? insert(comma + 1, `\n${indent}${text},`)
    : insert(last.end, `,\n${indent}${text}`)
}
