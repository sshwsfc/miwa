TLI.NetworkUpdate = TLI.BaseModel.extend({
    SIMPLE_LIST: "nut1",
    RICH_LIST: "nut2",
    SHARE_LIST: "nut3",
    ROLLUP_LIST: "nut4",
    ROLLUP_CONN_LIST: "nut5",
    RICH_SHARE: "nut6",
    TWITTER_LIST: "twitter1",
    TWITTER_SHARE: "twitter2",
    TWITTER_NEWS: "twitter3",
    ROLLUP_DETAIL: "dnut1",
    SHARE_DETAIL: "dnut2",
    GROUP_DETAIL: "dnut3",
    NEWS_DETAIL: "dnut4",
    TWEET_DETAIL: "dtwitter1",
    url: function() {
        return this.buildUrl("<%- base %>/li/v1/updates/<%- id %><%- suffix %>", {
            start: 0,
            count: 10
        })
    },
    getText: function(a) {
        var b = this.get("text");
        return b.length <= a ? b: b.slice(0, a) + "..."
    },
    getDetails: function(a) {
        var b = this.get("details");
        return b.length <= a ? b: b.slice(0, a)
    },
    isGroupType: function() {
        return this.get("dtType") === this.GROUP_DETAIL || this.get("tType") === this.GROUP_DETAIL
    },
    isFromTwitter: function() {
        var a = this.get("tType"),
        b = this.get("dtType");
        return a === this.TWITTER_LIST || a === this.TWITTER_SHARE || a === this.TWITTER_NEWS || b === this.TWEET_DETAIL
    },
    isHot: function() {
        return this.get("footer").logo === "flame"
    },
    isShareable: function() {
        return !! this.get("shareId")
    },
    canSendToConnections: function() {
        return !! this.get("sendConnectionSubject") && !!this.get("sendConnectionBody")
    },
    canReplyPrivately: function() {
        return !! this.get("replyPrivateSubject") && !!this.get("replyPrivateBody")
    },
    getPicture: function() {
        return this.get("picture")
    },
    getReshareDetails: function() {
        if (this.isShareable() && this.get("links")) return this.get("links")[0]
    },
    getHeader: function() {
        return this.get("header")
    },
    hasUserLiked: function(a) {
        var b = false;
        if (!this.get("likes") || this.get("likes").total < 1) return false;
        _.each(this.get("likes").values,
        function(c) {
            if (c.id === a) b = true
        });
        return b
    }
});
TLI.NetworkUpdateStream = TLI.BaseCollection.extend({
    constants: {
        maxrefresh: 9E5
    },
    collectionOptions: {
        length: 100
    },
    initialize: function() {
        TLI.BaseCollection.prototype.initialize.call(this);
        this.params = {
            count: 50,
            start: 0
        }
    },
    model: TLI.NetworkUpdate,
    url: function() {
        var a = this.meFeed,
        b = {};
        _.defaults(b, this.params);
        if (a) b.meFeed = true;
        if (this.models.length > 0) b.start = this.models.length;
        url = this.nus_id ? "<%- base %>/li/v1/updates/" + this.nus_id + "/detail<%- suffix %>": this.id ? "<%- base %>/li/v1/people/" + this.id + "/updates<%- suffix %>": "<%- base %>/li/v1/updates<%- suffix %>";
        return this.buildUrl(url, b)
    },
    parse: function(a) {
        this.total = a.total;
        return a.values
    },
    group: function() {
        return [{
            group: null,
            groupItems: this.models
        }]
    },
    fetch: function(a) {
        var b = (new Date).getTime();
        if (a && a.forceRefresh || !this.lastFetch || b - this.lastFetch > this.constants.maxrefresh) {
            TLI.BaseCollection.prototype.fetch.apply(this, arguments);
            this.lastFetch = b
        }
    }
});
TLI.RecentActivityStream = TLI.NetworkUpdateStream.extend({
    hash: function() {
        return $mcache.generateKey("recentActivity", this.id)
    },
    collectionOptions: {},
    fetch: function(a) {
        var b = this,
        c = this.hash(),
        d = a.success;
        a.success = function(f) {
            f.saveToMemory();
            d && d.call(b, f)
        };
        if ($mcache.get(c) && !a.add) {
            b.refresh($mcache.get(c));
            d && d.call(b, $mcache.get(c))
        } else TLI.NetworkUpdateStream.prototype.fetch.apply(this, [a])
    }
});
TLI.ConnectionsRollupStream = TLI.RecentActivityStream.extend({
    hash: function() {
        return $mcache.generateKey("connectionsRollups", this.nus_id)
    }
});