class Tag {
    constructor (RedisTaggedCacheInstance, options = {}) {
        this.RedisTaggedCacheInstance = RedisTaggedCacheInstance
        this._tags = []
    }

    tags (tags) {
        this._tags = this._tags.concat(tags)
        return this
    }

    tag (tag) {
        return this.tags([tag])
    }

    getTags () {
        return this._tags
    }

    put (...params) {
        return this.RedisTaggedCacheInstance.putWithTags(this, ...params)
    }
    forget () {
        return this.RedisTaggedCacheInstance.forgetByTags(this)
    }
}

module.exports = Tag
