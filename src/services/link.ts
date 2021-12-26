import Readability from '@mozilla/readability'
import { JSDOM } from 'jsdom'
import { Logger } from 'tslog'

const log = new Logger({
  name: 'linkScrape',
})

/*
  Scrape a single link.
*/
export async function scrape(url: string) {
  let dom: JSDOM | null = null

  if (!url) {
    return null
  }

  try {
    dom = await JSDOM.fromURL(url, {
      resources: 'usable',
      runScripts: 'dangerously',
      pretendToBeVisual: true,
    })

    // If Readbility thinks that the document is not parseable.
    if (!Readability.isProbablyReaderable(dom.window.document)) {
      log.info('Unparseable', url)
      return null
    }

    // Parse the document.
    return new Readability
      .Readability(dom.window.document)
      .parse()
  }
  catch {
    log.trace('Could not parse', url)
    return null
  }
  finally {
    dom?.window?.close()
  }
}
