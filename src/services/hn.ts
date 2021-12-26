import axios from 'axios'
import $ from 'cheerio'
import { DateTime } from 'luxon'
import { Logger } from 'tslog'

const log = new Logger({
  name: 'hn',
})

/*
  Returns a batch of the top stories.
*/
export async function fetchTopStories(pages: number) {
  const stories: HNStory[] = []

  for (let index = 1; index <= pages; index++) {
    try {
      const response = await axios.get('https://news.ycombinator.com/news', {
        params: {
          p: index,
        },
      })

      const page = $.load(response.data)
      for (const tr of page('tr.athing')) {
        const id = $(tr).attr('id')

        // Post title and link.
        const anchor = $(tr).find('td.title a.titlelink')
        const link = anchor.attr('href')
        const title = anchor.text()

        // TODO: Home page doesn't have the text for the story
        // But because link posts cannot have text, it's ok for now.
        const text = undefined

        // Author and other metadata.
        const meta = $(tr.nextSibling!)
        const by = meta.find('a.hnuser').text()
        const time = meta.find('span.age').attr('title')

        DateTime.fromISO('', {

        })

        stories.push({
          id: id
            ? parseInt(id)
            : -1,
          by,
          title,
          url: link,
          text,
          type: 'story',
          created_at: time
            ? DateTime
                .fromISO(time, { zone: 'UTC' })
                .toJSDate()
            : undefined,
        })
      }

      log.info('HN page processed', index)
    }
    catch {
      log.trace('Error while processing page', index)
    }
  }

  return stories
}

/*
  A single post on the HN Feed.
*/
interface HNStory {
  id: number
  by: string
  title: string
  url?: string
  text?: string
  type: 'story'
  created_at?: Date
}
