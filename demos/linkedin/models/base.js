TLI.BaseModel = Backbone.Model.extend({
    initialize: function() {
        this.bind("error", this.showError)
    },
    showError: function(a, b) {
        var c = b && b.responseText ? JSON.parse(b.responseText) : {};
        $notif.showError(c["public"])
    },
    put: function(a, b) {
        b || (b = {});
        if ($config.enableCsrfToken) a._token = TLI.Security.getCsrfToken();
        $.ajax({
            url: this.url(),
            type: "PUT",
            data: a,
            success: b.success,
            error: b.error,
            dataType: "json"
        })
    },
    wrapError: function(a, b, c) {
        return function(d) {
            a ? a(b, d, c) : b.trigger("error", b, d, c)
        }
    },
    save: function(a, b) {
        b || (b = {});
        if (a && !this.set(a, b)) return false;
        var c = this,
        d = b.success;
        b.success = function(e, j, n) {
            if ("id" in e && !c.set(c.parse(e, n), b)) return false;
            d && d(c, e, n);
            return true
        };
        b.error = this.wrapError(b.error, c, b);
        var f = this.isNew() ? "create": "update";
        return (this.sync || Backbone.sync).call(this, f, this, b)
    },
    buildUrl: function(a, b) {
        var c = [];
        b || (b = {});
        b.nc = (new Date).getTime().toString();
        var d = {
            appHost: $h.getAppHost().host,
            base: $config.serviceUrlBase,
            suffix: $config.serviceUrlSuffix,
            id: this.id
        },
        f = TLI.User.getCurrentUser();
        if (f) {
            d.username = f.get("username");
            b.nc = (f.get("id") || "") + b.nc
        }
        a = _.template(a, d);
        a = _.template(a, d);
        if (b) for (var e in b) {
            d = b[e];
            typeof d !== "undefined" && d !== null && c.push(encodeURIComponent(e) + "=" + encodeURIComponent(d))
        }
        return c.length ? a + "?" + c.join("&") : a
    },
    validateExists: function(a, b) {
        if (! (b && b.length)) return a + " is required.";
        return null
    },
    validate: function(a) {
        var b = this,
        c = null;
        b.validateRequired && _.each(b.validateRequired,
        function(d) {
            if (d = b.validateExists(d, a[d])) {
                c || (c = []);
                c.push(d)
            }
        });
        return c
    },
    saveToMemory: function() {
        if (!$native.isNative()) {
            var a;
            if (this.hash) {
                a = this.hash.apply(this);
                $mcache.set(a, this.toJSON())
            }
        }
    }
});
