import promisifyAll from 'util-promisifyall'
import _ from 'lodash'
let Tag = require('./Tag')

class RedisTaggedCache {
    constructor (options = {}) {
        this.options = options
        this.redisClient = ('setAsync' in options.client) ? options.client : promisifyAll(options.client)
        this.options.prefix = this.options.prefix || null

        if (!this.redisClient) throw new Error('Redis client is not set!')
        this.options.prefix = this.options.prefix || 'RedisTaggedCache'
    }

    tags (tags) {
        let tagInstance = new Tag(this)
        tagInstance.tags(tags)
        return tagInstance
    }
    tag (tag) {
        let tagInstance = new Tag(this)
        tagInstance.tag(tag)
        return tagInstance
    }

    async putWithTags (tags, key, val, ttl = 0) {
        tags = tags ? tags.getTags() : []
        let cmds = []
        let actualKey = `${this.options.prefix || 'RedisTaggedCache'}:${key}`
        cmds.push([
            'SET',
            actualKey, val
        ])
        if (ttl) {
            cmds.push([
                'EXPIRE',
                actualKey,
                ttl
            ])
        }
        if (!_.isEmpty(tags)) {
            tags.forEach((tag) => {
                cmds.push([
                    'SADD',
                    `${this.options.prefix || 'RedisTaggedCache'}:tags:${tag}`,
                    actualKey
                ])
            })
        }

        let multi = promisifyAll(this.redisClient.multi(cmds))
        let replies = await multi.execAsync()
        multi.quit()

        return Promise.resolve(replies)
    }

    async put (key, val, ttl = 0) {
        return this.putWithTags(null, key, val, ttl)
    }

    async get (key) {
        // console.log(this.redisClient)
        return this.redisClient.getAsync(`${this.options.prefix || 'RedisTaggedCache'}:${key}`)
    }

    async forget (key) {
        let actualKey = `${this.options.prefix || 'RedisTaggedCache'}:${key}`
        return this.redisClient.delAsync(actualKey)
    }

    async forgetByTags (tags) {
        tags = tags ? tags.getTags() : []
        if (_.isEmpty(tags)) return Promise.reject(new Error('Tags cannot be empty'))

        tags = tags.map(tag => `${this.options.prefix || 'RedisTaggedCache'}:tags:${tag}`)
        let keys = await this.redisClient.sunionAsync(...tags)

        return this.redisClient.delAsync(keys)
    }
}

module.exports = RedisTaggedCache