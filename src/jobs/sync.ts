import { PrismaClient } from '@prisma/client'
import { Logger } from 'tslog'
import { fetchTopStories } from '../services/hn'
import { scrape } from '../services/link'

const log = new Logger({
  name: 'sync',
})

const prisma = new PrismaClient()

/*
  Get a batch of top articles to process.
*/
export default async function sync() {
  const items = await fetchTopStories(5).catch(() => [])
  log.info('Processing', items?.length, 'items')

  // Calculate the starting rank for the posts.
  const base = await prisma.post.aggregate({
    _max: {
      rank: true,
    },
  })

  let rank = (base._max.rank ?? 0) + items.length
  log.info('Starting rank at', rank)

  // Update the post item with at least the updated rank or create
  // a new post if one doesn't exist already.
  for (const item of items) {
    try {
      const post = await prisma.post.upsert({
        create: {
          hn_id: item.id,
          title: item.title,
          text: item.text,
          url: item.url,
          by: item.by,
          rank,
          date: item.created_at,
        },
        update: {
          rank,
        },
        where: {
          hn_id: item.id,
        },
        select: {
          id: true,
          Content: true,
        },
      })

      if (!post.Content && item.url) {
        // Scrape the content from the url.
        const content = await scrape(item.url)

        if (content) {
          await prisma.content.create({
            data: {
              post_id: post.id,
              title: content?.title,
              byline: content?.byline,
              direction: content?.dir,
              content: content?.textContent,
              html_content: content?.content,
              length: content?.length,
              excerpt: content?.excerpt,
            },
          })

          log.info('Scraped', item.id, item.url)
        }
      }

      log.info('Processed', item.id)
    }
    catch {
      log.trace('Could not process', item.id)
    }
    finally {
      rank -= 1
    }
  }
}
