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
  const items = await fetchTopStories(8).catch(() => [])
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
          unparsable: true,
          Content: true,
        },
      })

      if (item.url
          && !post.unparsable
          && !post.Content
          && shouldScrape(item.url)) {
        // Scrape the content from the url.
        const content = await scrape(item.url)

        if (content) {
          await prisma.content.create({
            data: {
              post_id: post.id,
              title: content?.title,
              byline: content?.byline,
              direction: content?.dir,
              content: content?.content,
              length: content?.length,
              excerpt: content?.excerpt,
            },
          })

          log.info('Scraped', item.id, item.url)
        }
        else {
          await markUnparsable(post.id)
        }
      }
      else {
        await markUnparsable(post.id)
      }

      log.info(rank, 'Processed', item.id)
    }
    catch (exception) {
      log.trace(rank, 'Could not process', item.id, exception)
    }
    finally {
      rank -= 1
    }
  }
}

/*
  Returns a boolean flag indicating whether or not the url should be scraped.
*/
function shouldScrape(url: string) {
  if (!url) {
    return false
  }

  if (url.startsWith('https://news.ycombinator.com')) {
    return false
  }

  if (url.startsWith('https://www.youtube.com')) {
    return false
  }

  if (url.endsWith('.pdf')) {
    return false
  }

  return true
}

/*
  Mark the post as unparsable.
*/
async function markUnparsable(id: number) {
  await prisma.post.update({
    data: {
      unparsable: true,
    },
    where: {
      id,
    },
  })
}

/*
  Run the job in the loop.
*/
async function main() {
  log.info('Starting')

  while (true) {
    try {
      await sync()
      log.info('Cycle complete, sleeping')
    }
    catch (exception) {
      log.trace('Cycle failed, sleeping', exception)
    }

    await new Promise((resolve) => setTimeout(
      resolve,
      6 * 60 * 1000,
    ))
  }
}

if (require.main === module) {
  main()
}
