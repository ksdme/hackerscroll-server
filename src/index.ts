import { PrismaClient } from '@prisma/client'
import { Logger } from 'tslog'
import Fastify from 'fastify'

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

/*
  Returns a list of latest posts with the content on those pages.
*/
fastify.get('/api/top', {
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

    const pageSize = Math.min(
      query.page_size ?? 30,
      30,
    )

    const items = await prisma.post.findMany({
      where: {
        visible: true,
      },
      orderBy: {
        rank: 'desc',
      },
      include: {
        Content: true,
      },
      take: pageSize,
      skip: ((query.page ?? 1) - 1) * pageSize,
    })

    return res.send(items)
  },
})

/*
  Returns a post by its HN ID.
*/
fastify.get('/api/item/:id', {
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
fastify.listen(3000, (error, address) => {
  if (error) {
    return log.trace(error)
  }

  log.info('Started server at', address)
})
