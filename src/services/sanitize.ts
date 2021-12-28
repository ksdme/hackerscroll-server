import createDOMPurify from 'dompurify'
import { JSDOM } from 'jsdom'

/*
  Sanitizes the given html string.
*/
export async function sanitize(html: string) {
  const dom = new JSDOM()
  const window = dom.window

  const DOMPurify = createDOMPurify(window as unknown as Window)
  return DOMPurify.sanitize(html)
}
