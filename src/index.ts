import { PrismaClient } from '@prisma/client'
import Fastify from 'fastify'
import CORS from 'fastify-cors'
import memoizee from 'memoizee'
import { Logger } from 'tslog'

// TODO: Compress the response
// TODO: Add caching headers
// TODO: Cache database lookups
// TODO: Add Cloudflare CDN

const log = new Logger({
  name: 'server',
})

// Database client.
const prisma = new PrismaClient()

// Fastify app.
const fastify = Fastify({
  logger: true,
})

// Enable CORS.
fastify.register(CORS, {
  origin: [
    process.env.FRONTEND_URL!,
  ],
})

/*
  Returns a memoized function that returns top posts.
*/
const fetchTopCached = memoizee(async (page: number, size: number) => {
  return await prisma.post.findMany({
    where: {
      visible: true,
    },
    orderBy: {
      rank: 'desc',
    },
    include: {
      Content: true,
    },
    take: size,
    skip: page * size,
  })
}, {
  async: true,
  maxAge: 1 * 60 * 100,
})

/*
  Returns a list of latest posts with the content on those pages.
*/
fastify.get('/top', {
  schema: {
    querystring: {
      page: {
        type: 'number',
        default: 1,
      },
      page_size: {
        type: 'number',
        default: 30,
      },
    },
  },
  handler: async (req, res) => {
    const query = req.query as {
      page: number
      page_size: number
    }

    const size = Math.min(
      query.page_size ?? 30,
      30,
    )

    return res.send({
      page: query.page ?? 1,
      items: await fetchTopCached(query.page ?? 1, size),
    })
  },
})

/*
  Returns a post by its HN ID.
*/
fastify.get('/item/:id', {
  schema: {
    params: {
      id: {
        type: 'number',
      },
    },
  },
  handler: async (req, res) => {
    const params = req.params as {
      id: number
    }

    const item = await prisma.post.findFirst({
      where: {
        hn_id: params.id,
        visible: true,
      },
      include: {
        Content: true,
      },
    })

    return res.send(item)
  },
})

/*
  Start the server.
*/
fastify.listen(
  process.env.BIND_PORT ?? 3001,
  process.env.BIND_ADDR ?? 'localhost',
  (error, address) => {
    if (error) {
      return log.trace(error)
    }

    log.info('Started server at', address)
  },
)
