import Readability from '@mozilla/readability'
import { JSDOM } from 'jsdom'
import ArticleContent from '../models/Article'

/*
  Scrape a single article.
*/
export async function scrape(url: string): Promise<ArticleContent | null> {
  let dom: JSDOM | null = null

  try {
    dom = await JSDOM.fromURL(url, {
      resources: 'usable',
      runScripts: 'dangerously',
      pretendToBeVisual: true,
    })

    // If Readbility thinks that the document is not parseable.
    if (!Readability.isProbablyReaderable(dom.window.document)) {
      return null
    }

    // Parse the document.
    return new Readability.Readability(dom.window.document).parse()
  }
  catch (exception) {
    return null
  }
  finally {
    dom?.window?.close()
  }
}
