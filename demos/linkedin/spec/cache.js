var CachePriority = {
    LOW: 1,
    NORMAL: 2,
    HIGH: 4
};
function Cache(a, b) {
    this.maxSize_ = a || -1;
    this.debug_ = b || false;
    this.items_ = {};
    this.count_ = 0;
    this.purgeSize_ = Math.round(this.maxSize_ * 0.9);
    this.stats_ = {};
    this.stats_.hits = 0;
    this.stats_.misses = 0;
    this.log_("Initialized cache with size " + a)
}
Cache.prototype.getItem = function(a) {
    var b = this.items_[a];
    if (b != null) if (this.isExpired_(b)) {
        this.removeItem_(a);
        b = null
    } else b.lastAccessed = (new Date).getTime();
    if (b = b ? b.value: null) {
        this.stats_.hits++;
        this.log_("Cache HIT for key " + a)
    } else {
        this.stats_.misses++;
        this.log_("Cache MISS for key " + a)
    }
    return b
};
Cache._CacheItem = function(a, b, c) {
    if (!a) throw Error("key cannot be null or empty");
    this.key = a;
    this.value = b;
    c = c || {};
    if (c.expirationAbsolute) c.expirationAbsolute = c.expirationAbsolute.getTime();
    if (!c.priority) c.priority = CachePriority.NORMAL;
    this.options = c;
    this.lastAccessed = (new Date).getTime()
};
Cache.prototype.setItem = function(a, b, c) {
    this.items_[a] != null && this.removeItem_(a);
    this.addItem_(new Cache._CacheItem(a, b, c));
    this.log_("Setting key " + a);
    if (this.maxSize_ > 0 && this.count_ > this.maxSize_) {
        var d = this;
        setTimeout(function() {
            d.purge_.call(d)
        },
        0)
    }
};
Cache.prototype.clear = function() {
    for (var a in this.items_) this.removeItem_(a);
    this.log_("Cache cleared")
};
Cache.prototype.getStats = function() {
    return this.stats_
};
Cache.prototype.toHtmlString = function() {
    var a = this.count_ + " item(s) in cache<br /><ul>",
    b;
    for (b in this.items_) {
        var c = this.items_[b];
        a = a + "<li>" + c.key.toString() + " = " + c.value.toString() + "</li>"
    }
    a += "</ul>";
    return a
};
Cache.prototype.purge_ = function() {
    var a = [],
    b;
    for (b in this.items_) {
        var c = this.items_[b];
        this.isExpired_(c) ? this.removeItem_(b) : a.push(c)
    }
    if (a.length > this.purgeSize_) for (a = a.sort(function(d, f) {
        return d.options.priority != f.options.priority ? f.options.priority - d.options.priority: f.lastAccessed - d.lastAccessed
    }); a.length > this.purgeSize_;) this.removeItem_(a.shift().key);
    this.log_("Purged cached")
};
Cache.prototype.addItem_ = function(a) {
    this.items_[a.key] = a;
    this.count_++
};
Cache.prototype.removeItem_ = function(a) {
    var b = this.items_[a];
    delete this.items_[a];
    this.count_--;
    this.log_("removed key " + a);
    b.options.callback != null && setTimeout(function() {
        b.options.callback.call(null, b.key, b.value)
    },
    0)
};
Cache.prototype.isExpired_ = function(a) {
    var b = (new Date).getTime(),
    c = false;
    if (a.options.expirationAbsolute && a.options.expirationAbsolute < b) c = true;
    if (!c && a.options.expirationSliding) if (a.lastAccessed + a.options.expirationSliding * 1E3 < b) c = true;
    return c
};
Cache.prototype.log_ = function(a) {
    this.debug_ && console.log(a)
};