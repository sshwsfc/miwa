TLI.BaseCollection = Backbone.Collection.extend({
    searchLimit: 10,
    collectionOptions: {},
    resetCursor: function() {
        this.cursor.position = 0
    },
    initialize: function() {
        this.cursor = {
            position: 0
        };
        this.listCursor = {
            position: 0
        }
    },
    getNextPage: function(a) {
        var b;
        b = this.cursor.position + a.count;
        var c = this.models.length;
        b = b > c ? c: b;
        c = this.models.slice(this.cursor.position, b);
        this.cursor.position = b;
        b = {
            page: new this.constructor(c),
            more: !(this.cursor.position == this.models.length && this.models.length == this.total)
        };
        a.callback(b)
    },
    nextPage: function(a) {
        if (typeof this.total === "undefined") this.total = this.collectionOptions.length || this.models.length;
        if (this.models.length !== 0 && this.cursor.position == this.models.length) this.total > this.models.length && this.fetch({
            add: true,
            forceRefresh: true,
            success: _.bind(function() {
                this.getNextPage(a)
            },
            this)
        });
        else this.getNextPage(a)
    },
    buildUrl: function(a, b) {
        return TLI.BaseModel.prototype.buildUrl(a, b)
    },
    groupBy: function(a) {
        var b = [],
        c = null,
        d;
        this.each(function(f) {
            var e = a(f);
            if (d !== e) {
                c = {
                    group: e,
                    groupItems: [f]
                };
                b.push(c);
                d = e
            } else c && c.groupItems.push(f)
        });
        return b
    },
    group: function() {
        throw "Abstract Method group needs to be overridden by the subclass";
    },
    search: function(a) {
        var b = a.keywords,
        c = a.attributes,
        d = [],
        f = {};
        if (a.exclude) {
            _.each(a.exclude,
            function(n) {
                f[n] = true
            });
            delete a.exclude
        }
        var e = a.limit || this.searchLimit;
        delete a.limit;
        var j = b.split(/\s/);
        this.detect(function(n) {
            var r = {},
            w = 0;
            _.each(j,
            function(t) {
                for (var z = 0, A = c.length; z < A; z++) {
                    var E = n.get(c[z]);
                    if (E && E.toLowerCase().indexOf(t.toLowerCase()) > -1 && !r[t]) {
                        r[t] = true;
                        w++;
                        break
                    }
                }
            });
            if (w === j.length && !f[n.id]) {
                d.push(n);
                f[n.id] = true
            }
            return d.length == e
        });
        return d
    },
    saveToMemory: function() {
        var a;
        if (this.hash) {
            a = typeof this.hash === "function" ? this.hash() : this.hash;
            typeof a !== "undefined" && $mcache.set(a, this.toJSON())
        }
    }
});
