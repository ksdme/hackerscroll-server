import Readability from '@mozilla/readability'
import axios from 'axios'
import { JSDOM, VirtualConsole } from 'jsdom'
import { Logger } from 'tslog'

const log = new Logger({
  name: 'link-scrape',
})

/*
  Scrape a single link.

  TODO: Remove JS from the HTML Content.
  TODO: Remove empty nodes recursively.
*/
export async function scrape(url: string) {
  let dom: JSDOM | null = null

  if (!url) {
    return null
  }

  try {
    // JSDOM does not support a request timeout yet,
    // Check https://github.com/jsdom/jsdom/issues/2824
    // So check if the site is reachable within a timeout before
    // trying to scrape it.
    // TODO: A proper timeout needs to be implemented.
    if (!await isSiteReachable(url)) {
      return null
    }

    dom = await JSDOM.fromURL(url, {
      resources: 'usable',
      runScripts: 'dangerously',
      pretendToBeVisual: true,
      // Hide site console messages.
      virtualConsole: new VirtualConsole(),
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
  catch (exception) {
    log.trace('Could not parse', url, exception)
    return null
  }
  finally {
    dom?.window?.close()
  }
}

/*
  Returns a boolean indicating if the site is reachable.
*/
async function isSiteReachable(url: string) {
  try {
    await axios.get(url, {
      timeout: 15000,
    })
  }
  catch {
    return false
  }

  return true
}
