
TLI.Notifications = {
    NOTIFICATION_TIME: 2E3
};

TLI.NativeBridge = {};
(function(a) {
    a.URI_SCHEME = "li";
    a.initialize = function(b) {
        var c = new TLI.User(b.user);
        TLI.User.setCurrentUser(c);
        $ui.activePage = null;
        b.language && TLI.I18n.setLocale($h.flattenLocale(b.language));
        if (b.serviceHost) $config.serviceUrlBase = b.serviceHost
    };
    a.renderTemplate = function(b, c, d) {
        if (!b || !c || !d) throw "viewClass, modelClass, and data are required.";
        c = new c(d);
        b = (new b(c)).render();
        c = _.template('<div id="native" data-role="page" class="page ui-page active-page"><div id="native-content" data-role="content" class="content"><%- content %></div></div>');
        $ui.pageContainer.html(c({
            content: b
        }))
    };
    a.isNative = function() {
        return $config.env === "native" || $config.env === "native_android"
    };
    a.deactivate = function() {
        _isNative = false;
        $ui.body.removeClass("native")
    };
    a.sendMessage = function(b, c) {
        var d;
        d = _.template("<%= uriScheme %>://mn.linkedinlabs.com/?message=<%= message %>&callback=<%= callback %>", {
            uriScheme: a.URI_SCHEME,
            message: encodeURIComponent(JSON.stringify(b)),
            callback: c
        });
        document.location = d
    };
    a.go = function() {
        $h.silentGo.apply(this, arguments)
    };
    a.refresh = function() {
        Backbone.history.loadUrl()
    };
    a.loadData = function(b, c) {
        if (c) if ((b = LINative.getParameters(b)) && b.length) b = JSON.parse(b);
        var d = b.partial;
        delete b.partial;
        for (var f in b) {
            var e = b[f],
            j = null;
            j = e.id ? $mcache.generateKey(f, e.id) : $mcache.generateKey(f, "");
            e.partial = d;
            $mcache.set(j, e)
        }
    };
    a.sendInit = function() {
        a.sendMessage({
            action: "initialize"
        },
        "TLI.NativeBridge.recvInit")
    };
    a.recvInit = function() {};
    a.sendPageLoaded = function(b) {
        a.sendMessage({
            action: "pageLoaded",
            page: b
        },
        "TLI.NativeBridge.recvRecvPageLoaded")
    };
    a.recvPageLoaded = function() {};
    a.sendClose = function() {
        a.sendMessage("close")
    }
})(TLI.NativeBridge);
TLI.Helpers = {};
(function(a) {
    var b = RegExp("[(]?(https?://|www\\.)[\\w\\?\\$\\-\\.\\+\\!\\*\\(\\)\\,\\/\\%\\=\\&\\;\\#\\:]+", "gi"),
    c = RegExp("(mailto:)?[\\w\\.]+@\\w+\\.\\w+", "gi"),
    d = /(^|\s|\'|\\u201c)@(\w+)/g,
    f = /(^|\s)#(\w+)/g;
    a.silentGo = function(e) {
        for (var j = [], n = 1, r = arguments.length; n < r; n++) j.push(arguments[n]);
        e.match(/#/) || (e = "#" + e);
        if (j.length) e += "/" + j.join("/");
        window.location.hash = e
    };
    a.go = function(e) {
        for (var j = [], n = 1, r = arguments.length; n < r; n++) j.push(arguments[n]);
        $native.isNative() ? $native.sendMessage({
            action: "navigate",
            path: e,
            params: j
        }) : a.silentGo.apply(a, arguments)
    };
    a.getAppHost = function() {
        var e = window.location,
        j = parseInt(e.port, 10);
        if (isNaN(j) || j <= 0) j = null;
        return {
            protocol: e.protocol,
            host: e.hostname,
            port: j
        }
    };
    a.isPathStored = function() {
        var e = $storage.generateKey("returnPath");
        return !! $storage.get(e)
    };
    a.storePath = function() {
        var e = $storage.generateKey("returnPath");
        $storage.set(e, window.location.href)
    };
    a.goStoredPath = function() {
        var e = $storage.generateKey("returnPath"),
        j = $storage.get(e);
        $storage.remove(e);
        window.location.href = j
    };
    a.handleAppError = function(e) {
        if ($native.isNative()) $native.sendMessage({
            action: "error",
            data: e
        });
        else $ui.isTransitioning() && e.txt === "parsererror" ? $log.error("Parse error during transition") : a.removeModalOverlay()
    };
    a.deleteCookie = function(e) {
        document.cookie = e + "=; expires=Thu, 01-Jan-1970 00:00:01 GMT;"
    };
    a.hideBrowser = function() {
        $ui.html.hasClass("iosfive") || a.defer(function() {
            window.scrollTo(0, 0)
        })
    };
    a.isUrl = function(e) {
        return !! (e.match(b) || e.match(c))
    };
    a.isTwitterHandle = function(e) {
        return !! e.match(d)
    };
    a.isTwitterHash = function(e) {
        return !! e.match(f)
    };
    a.autoLink = function(e) {
        if (!e) return e;
        var j = _.template("<%= head %><a rel='nofollow' target='_blank' href='<%= url %>'><%= displayUrl %></a><%= tail %>");
        e = e.replace(b,
        function(n) {
            var r = n;
            n = a.breakWords(n, {
                breakUrls: true
            });
            var w = "",
            t = "",
            z = r.match(/(&gt;|\.|\!|\?)$/),
            A = null;
            if (z) {
                t = z[1];
                r = r.slice(0, r.length - t.length);
                n = n.slice(0, n.length - t.length)
            }
            if (r.match(/^\(/)) {
                w = "(";
                if (r.match(/\)$/)) {
                    t = ")" + t;
                    r = r.replace(/\)$/, "");
                    n = n.replace(/\)$/, "")
                }
            }
            r = r.replace(/^\(/, "");
            n = n.replace(/^\(/, "");
            r.match(/^http/i) || (r = "http://" + r);
            return A = j({
                head: w,
                tail: t,
                url: r,
                displayUrl: n
            })
        });
        return e = e.replace(c,
        function(n) {
            var r = n;
            r.match(/^mailto/) || (r = "mailto:" + r);
            n = a.breakWords(n, {
                breakUrls: true
            });
            return j({
                head: "",
                tail: "",
                url: r,
                displayUrl: n
            })
        })
    };
    a.breakWords = function(e, j) {
        j || (j = {});
        var n = RegExp("[^\\s-]{20,}", "g"),
        r = "";
        if (e && e.length) r = e.replace(n,
        function(w) {
            if (w.length === 20 || a.isUrl(w) && !j.breakUrls || a.isTwitterHandle(w) && !j.breakTweet || a.isTwitterHash(w) && !j.breakTweet) return w;
            var t = [];
            for (w = w.split(""); w.length;) t.push(w.splice(0, 20).join(""));
            return t.join("&shy;")
        });
        return r.replace(RegExp("\\n&shy;n", "g"), "\n")
    };
    a.escape = function(e) {
        if (e !== null && typeof e !== "undefined") {
            e = e.toString();
            return e.replace(/&(.+;)?/g,
            function(j, n) {
                return n ? j: "&amp;"
            }).replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;")
        }
    };
    a.convertEscapeCodes = function(e) {
        if (e) return e.replace(/(.*)(\r\n|\n|\r)/g,
        function(j, n) {
            return "<p>" + n + "</p>"
        })
    };
    a.trim = function(e) {
        return e.replace(/^\s+|\s+$/g, "")
    };
    a.summarize = function(e, j) {
        j || (j = 20);
        if (e && e.length > j) e = a.trim(e.slice(0, j)) + "...";
        return e
    };
    a.generateClassName = function(e) {
        if (!e) return "";
        return e.toLowerCase().replace(/\W/g, "-")
    };
    a.defer = function(e) {
        $os.android ? e() : setTimeout(e, 0)
    };
    a.showLoader = function() {
        a.showModalOverlay({
            showSpinner: true,
            message: $t("loading")
        })
    };
    a.hideLoader = function() {
        a.removeModalOverlay()
    };
    a.showModalOverlay = function(e) {
        if (!$native.isNative()) {
            e = $(TLI.templates.shared.modal_overlay(e));
            $("html").append(e);
            e = $("#modal_overlay").css({
                top: window.innerHeight / 2 - $("#modal_overlay").height() / 2 + "px"
            });
            e.show();
            $("#modal_backdrop").css({
                width: $(document.body).width(),
                height: $(document.body).height()
            })
        }
    };
    a.removeModalOverlay = function() {
        $("#modal_overlay").remove();
        $("#modal_backdrop").remove()
    };
    a.showErrorMessage = function(e) {
        e || (e = $t("error"));
        var j = $(TLI.templates.shared.error({
            message: e
        }));
        j.css({
            display: "block",
            opacity: 0.96,
            top: document.body.scrollTop + 100 + "px"
        }).appendTo($ui.pageContainer);
        setTimeout(function() {
            $(j).remove()
        },
        800)
    };
    a.setPageContent = function(e, j) {
        $(e).html("");
        $(e).append(j)
    };
    a.goToLink = function(e) {
        if ($native.isNative()) $native.sendMessage({
            action: "link",
            url: e
        });
        else window.location.href = e
    };
    a.startCall = function(e) {
        if ($native.isNative()) $native.sendMessage({
            action: "call",
            number: e
        });
        else window.location.href = "tel:" + e
    };
    a.launchMap = function(e) {
        e = e.replace(/\s/g, "+");
        $native.isNative() ? $native.sendMessage({
            action: "map",
            address: e
        }) : this.goToLink("http://maps.google.com/maps?q=" + e)
    };
    a.startEmail = function(e) {
        window.location.href = "mailto:" + e
    };
    a.flattenLocale = function(e) {
        var j = ["en", "es", "de", "fr", "pt", "it", "ja"],
        n = e.match(/(\S+)-(\S+)/);
        if (n && j.lastIndexOf(n[1].toLowerCase()) > -1) e = n[1];
        return e.replace("-", "_").toLowerCase()
    };
    a.getBrowserLocale = function() {
        var e = TLI.config.defaultLocale;
        if (TLI.serverData && TLI.serverData.locale) e = TLI.serverData.locale;
        else if (navigator) {
            var j = navigator.language || navigator.browserLanguage || navigator.systemLanguage || navigator.userLanguage;
            if (j) e = j
        }
        j = ["en", "es", "de", "fr", "pt"];
        var n = e.match(/(\S+)-(\S+)/);
        if (n && j.lastIndexOf(n[1]) > -1) e = n[1];
        e = a.flattenLocale(e);
        return e.replace(/\W/, "_")
    };
    a.formatTime = function(e, j) {
        var n = "";
        j || (j = "sdt");
        return n = $h.getSecondsAgo(e) < 0 ? $t(j + "-seconds", 0) : $h.getSecondsAgo(e) < 60 ? $t(j + "-seconds", $h.getSecondsAgo(e)) : $h.getMinutesAgo(e) < 60 ? $t(j + "-minutes", $h.getMinutesAgo(e)) : $h.getHoursAgo(e) < 24 ? $t(j + "-hours", $h.getHoursAgo(e)) : $t(j + "-days", $h.getDaysAgo(e))
    };
    a.getSecondsAgo = function(e) {
        return Math.round((new Date - new Date(e)) / 1E3)
    };
    a.getMinutesAgo = function(e) {
        return Math.round(this.getSecondsAgo(e) / 60)
    };
    a.getHoursAgo = function(e) {
        return Math.round(this.getMinutesAgo(e) / 60)
    };
    a.getDaysAgo = function(e) {
        return Math.round(this.getHoursAgo(e) / 24)
    };
    a.parseTweet = function(e) {
        if (e.match(d)) e = e.replace(d, "$1@<a target='_blank' href='https://twitter.com/intent/user?screen_name=$2'>$2</a>");
        if (e.match(f)) e = e.replace(f, "$1<a target='_blank' href='http://search.twitter.com/search?q=%23$2'>#$2</a>");
        return e
    };
    a.parseLineBreaks = function(e) {
        var j = /\n/g;
        if (e.match(j)) e = e.replace(j, "<br />");
        return e
    };
    a.hideSearchKeyboard = function() {
        _.each($("input#search-keyword"),
        function(e) {
            e.blur()
        })
    };
    a.getCurrentHash = function() {
        var e = window.location.hash;
        return e = (e = (e = (e = e ? e.split("/") : null) && e[0] ? e[0] : null) ? e.split("?") : null) && e[0] ? e[0] : null
    };
    a.hideAllKeyboards = function(e) {
        if (e) {
            _.each(e.$("textarea"),
            function(j) {
                j.blur()
            });
            _.each(e.$("input"),
            function(j) {
                j.blur()
            })
        } else {
            _.each($("textarea"),
            function(j) {
                j.blur()
            });
            _.each($("input"),
            function(j) {
                j.blur()
            })
        }
    }
})(TLI.Helpers);
TLI.Navigation = {};
(function(a) {
    var b = null;
    a.renderNav = function(c) {
        var d = $ui.body,
        f = $("#li-nav");
        $h.getCurrentHash();
        if (f.length === 0) {
            b = new TLI.NavigationView({
                model: c
            });
            f = d.prepend(b.render());
            TLI.canvas.navBug();
            TLI.canvas.add("search", {
                canvasEl: "search-icon",
                insert: ".people-search",
                height: "16px",
                width: "16px",
                top: "8px",
                left: "8px"
            })
        } else {
            a.updatePrimaryRegion(c.primaryAction ? c.primaryAction.template() : null);
            a.updateSecondaryRegion(c.secondaryAction ? c.secondaryAction.template() : null)
        }
        $(document).ready(this.layoutSearchBox);
        $(document).bind("li:pageLoaded", this.layoutSearchBox);
        $(document).bind("li:pageChanged", this.layoutSearchBox);
        $(window).bind("resize", this.layoutSearchBox);
        f.find("." + c.category);
        d.removeClass("headerless");
        this.updateTitle($t(c.title));
        b.composeAction = c.composeAction ? c.composeAction: ""
    };
    a.layoutSearchBox = function() {
        var c;
        c = window.innerWidth;
        var d = $("#linkedin-logo").width(),
        f = $(".primary-region").width();
        c = c - d - (f === 0 ? 12 : f) - 64;
        if ($desktop) c += 28;
        $("#li-header div.people-search").css("width", c + "px")
    };
    a.showSearch = function(c) {
        if (typeof c === "undefined") c = true;
        if (c === true) {
            $(".searchtop").addClass("inview").removeClass("offscreen");
            (c = document.getElementById("search-keyword")) && c.focus()
        } else $(".searchtop").removeClass("inview").addClass("offscreen")
    };
    a.showDrawer = function(c) {
        var d = $("#li-nav"),
        f = $("#drawer-handle");
        if (c) {
            d.addClass("open");
            d.removeClass("closed");
            f.addClass("open")
        } else {
            d.removeClass("open");
            d.addClass("closed");
            f.addClass("closed")
        }
    };
    a.setHeaderless = function() {
        $ui.body.addClass("headerless")
    };
    a.updateTitle = function(c) {
        var d = $("#li-header .header-title"),
        f = $("#li-header .title-wrapper"),
        e = $h.getCurrentHash(),
        j = window.location.hash;
        if (c) {
            d.find(".header-text").text(c);
            d.removeClass("logo")
        } else {
            d.find(".header-text").html("");
            d.addClass("logo")
        }
        if (e === "#home" || e === "#you" || e === "#inbox" || j === "#network" || e === "#profile" || e === "#group") {
            f.removeClass("other-level");
            f.addClass("top-level")
        } else {
            f.removeClass("top-level");
            f.addClass("other-level")
        }
    };
    a.hasTitle = function() {
        var c = $("#li-header .header-title").find(".header-text");
        return !! c && !!c[0].innerHTML
    };
    a.updatePrimaryRegion = function(c) {
        $h.getCurrentHash();
        $("#li-header .primary-region").html(c)
    };
    a.updateSecondaryRegion = function(c) {
        $("#li-header .secondary-region").html(c)
    };
    a.nextPrevious = function(c, d) {
        if (d) {
            if (!c || c < 1) c = 1;
            var f = this.nextPrevious.previousButton || $(".prev-btn"),
            e = this.nextPrevious.nextButton || $(".next-btn");
            $(f).removeClass("disabled");
            $(e).removeClass("disabled");
            c == 1 && $(f).addClass("disabled");
            if (c == d || c > d) $(e).addClass("disabled")
        }
    };
    a.updateCompose = function(c) {
        $(".compose-entry").data("data-action", c)
    }
})(TLI.Navigation);
TLI.Ajax = {};
(function(a) {
    var b = null;
    a.beforeSend = function(c, d) {
        $ui.body.trigger("li:ajaxRequestStarted", c);
        c.requestMeta = {
            url: d.url,
            time: new Date
        };
        var f = {
            sessionId: $metrics.getSessionId()
        };
        if ($config.enableCsrfToken) f._token = TLI.Security.getCsrfToken();
        var e = $abtest.getAllCurrentUserBuckets();
        if (e.length) {
            f.buckets = e;
            c.setRequestHeader("X-LI-TRACK", JSON.stringify(f))
        }
        setTimeout(function() {
            if (c && c.readyState !== 4) {
                c.abort();
                $h.hideLoader()
            }
        },
        $config.requestTimeoutSeconds * 1E3);
        $log.info("AJAX Request - " + c.requestMeta.url)
    };
    a.error = function(c, d, f) {
        c.status !== 401 && $h.handleAppError({
            status: c.status,
            message: f,
            txt: d
        })
    };
    a.complete = function(c, d) {
        $ui.body.trigger("li:ajaxRequestComplete", c);
        d === "error" ? $log.error(c.status + " - " + c.requestMeta.url) : $log.info(function() {
            return "AJAX Request Complete - " + c.requestMeta.url + " - " + (new Date - c.requestMeta.time) + "ms"
        });
        c.status === 200 && d === "error" && $h.handleAppError({
            status: c.status,
            message: d,
            txt: d
        })
    };
    a.ajax = function(c) {
        var d = c.beforeSend,
        f = c.error,
        e = c.complete;
        c.beforeSend = function(j, n) {
            a.beforeSend(j, n);
            d && d.call(this, j, n)
        };
        if (!c.error) c.error = function(j, n, r) {
            a.error(j, n, r);
            f && f.call(this, j, n, r)
        };
        c.complete = function(j, n) {
            a.complete(j, n);
            e && e.call(this, j, n)
        };
        if ($native.isNative()) return null;
        return b(c)
    };
    a.initialize = function() {
        b = $.ajax;
        $.ajax = a.ajax
    };
    a.initialize()
})(TLI.Ajax);
TLI.Backbone = {};
(function(a) {
    var b = null,
    c = /^(\w+)\s*(.*)$/,
    d = function(e, j) {
        return e && (typeof e === "boolean" && e || typeof e === "string" && e === j || e.lastIndexOf && e.lastIndexOf(j) > -1)
    },
    f = function(e, j, n) {
        if (e) for (var r in e) if (d(e[r], n) && !(this.skipFilters && d(this.skipFilters[r], n))) if (!this[r].call(this)) return false;
        return true
    };
    a.route = function(e, j, n) {
        Backbone.history || (Backbone.history = new Backbone.History);
        _.isRegExp(e) || (e = this._routeToRegExp(e));
        Backbone.history.route(e, _.bind(function(r) {
            var w = this._extractParameters(e, r);
            if (f.call(this, this.before, e, j)) {
                if (this.requireBundles) {
                    var t = this;
                    TLI.Loader.requireBundles(t.requireBundles,
                    function() {
                        n.apply(t, w)
                    })
                } else n.apply(this, w);
                this.trigger.apply(this, ["route:" + j].concat(w));
                f.call(this, this.after, e, j)
            }
        },
        this))
    };
    a._extractParameters = function(e, j) {
        var n = j.split("?"),
        r = n[1] ? n[1] : null,
        w = {};
        n = n[0];
        if (r) {
            r = r.split("&");
            _.each(r,
            function(t) {
                t = t.split("=");
                w[t[0]] = t[1]
            });
            this.queryParams = w
        }
        return e.exec(n).slice(1)
    };
    a._add = function(e, j) {
        var n = null;
        j || (j = {});
        e instanceof
        Backbone.Model || (e = new this.model(e, {
            collection: this
        }));
        var r = this.getByCid(e);
        if (r) throw Error(["LIMIXIN:Can't add the same model to a set twice", r.id]);
        if (j.replace) n = this._byId[e.id] ? true: false;
        this._byId[e.id] = e;
        this._byCid[e.cid] = e;
        if (!e.collection) e.collection = this;
        r = this.comparator ? this.sortedIndex(e, this.comparator) : this.length;
        if (j.replace && n) {
            e.replace = true;
            if (this.models[r].id == e.id) this.models[r] = e;
            else if (this.models[r - 1].id == e.id) this.models[r - 1] = e;
            else this.models[r + 1] = e
        } else {
            e.addAfter = r - 1;
            this.models.splice(r, 0, e)
        }
        e.bind("all", this._onModelEvent);
        this.length++;
        j.silent || e.trigger("add", e, this, j);
        return e
    };
    a.checkUrl = function() {
        var e = this.getFragment();
        if (e == this.fragment && this.iframe) e = this.getFragment(this.iframe.location);
        if (e == this.fragment || e == decodeURIComponent(this.fragment)) return false;
        if ($ui.pageLock()) {
            window.location.hash = this.fragment;
            return false
        }
        if (this.iframe) window.location.hash = this.iframe.location.hash = e;
        $log && $h.defer(function() {
            $log.info(function() {
                return "Changing location to: " + window.location.hash
            })
        });
        $ui && $ui.body && $ui.body.trigger("li:pageChanged", window.location.hash);
        return this.loadUrl()
    };
    a.delegateEvents = function(e) {
        if (e || (e = this.events)) {
            $(this.el).unbind(".delegateEvents" + this.cid);
            for (var j in e) {
                var n = e[j],
                r = j.match(c),
                w = r[1];
                r = r[2];
                if ($desktop) if (w === "touchstart") w = "mousedown";
                else if (w === "touchend") w = "mouseup";
                else if (w === "tap") w = "click";
                n = _.bind(this[n], this);
                w += ".delegateEvents" + this.cid;
                r === "" ? $(this.el).bind(w, n) : $(this.el).delegate(r, w, n)
            }
        }
    };
    a.sync = function(e, j, n) {
        $config.enableCsrfToken && e !== "read" && j.set({
            _token: TLI.Security.getCsrfToken()
        },
        {
            silent: true
        });
        b.call(this, e, j, n)
    };
    a.initialize = function() {
        Backbone.Controller.prototype.route = a.route;
        Backbone.Collection.prototype._add = a._add;
        Backbone.History.prototype.checkUrl = a.checkUrl;
        Backbone.Controller.prototype._extractParameters = a._extractParameters;
        Backbone.View.prototype.delegateEvents = a.delegateEvents;
        b = Backbone.sync;
        Backbone.sync = a.sync
    };
    a.initialize()
})(TLI.Ajax);
TLI.Underscore = {};
(function(a) {
    a.outputFilters = ["$h.escape"];
    a.applyFilters = function(b) {
        _.each(a.outputFilters,
        function(c) {
            b = c + "(" + b + ")"
        });
        return b
    };
    a.template = function(b, c) {
        var d = _.templateSettings;
        d = "var __p=[],print=function(){__p.push.apply(__p,arguments);};with(obj||{}){__p.push('" + b.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(d.interpolate,
        function(f, e, j) {
            if (e !== "-") j = a.applyFilters(j);
            return "'," + j.replace(/\\'/g, "'") + ",'"
        }).replace(d.evaluate || null,
        function(f, e) {
            return "');" + e.replace(/\\'/g, "'").replace(/[\r\n\t]/g, " ") + "__p.push('"
        }).replace(/\r/g, "\\r").replace(/\n/g, "\\n").replace(/\t/g, "\\t") + "');}return __p.join('');";
        d = new Function("obj", d);
        return c ? d(c) : d
    };
    a.initialize = function() {
        _.template = a.template;
        _.templateSettings = {
            evaluate: /<%([\s\S]+?)%>/g,
            interpolate: /<%(=|-)([\s\S]+?)%>/g
        }
    };
    a.initialize()
})(TLI.Underscore);
TLI.Cache = {};
(function(a) {
    a.generateKey = function(b, c) {
        return b + ":" + c
    };
    a.initialize = function() {
        Cache.prototype.generateKey = a.generateKey;
        Cache.prototype.get = Cache.prototype.getItem;
        Cache.prototype.set = Cache.prototype.setItem
    };
    a.initialize()
})(TLI.Cache);
TLI.Metrics = {};
(function(a) {
    a.generateSessionId = function() {
        var b = TLI.User.getCurrentUser();
        if (b && b.get("id")) return Crypto.SHA1(b.get("id").toString() + (new Date).getTime())
    };
    a.getSessionId = function() {
        var b = $config.metricsSessionTimeoutMinutes * 6E4,
        c = (new Date).getTime(),
        d = $storage.generateKey("metricsSession"),
        f = $mcache.get(d);
        if (!f) {
            f = $storage.get(d);
            $mcache.set(d, f)
        }
        var e = function() {
            f = {
                start: c,
                id: a.generateSessionId()
            };
            $storage.set(d, f);
            $mcache.set(d, f);
            a.sendEvent({
                name: "new_session"
            })
        };
        if (f) c - f.start > b && e();
        else e();
        return f.id
    };
    a.buildUrl = function() {
        return $config.serviceUrlBase + "/li/v1/metrics" + $config.serviceUrlSuffix
    };
    a.sendEvent = function(b) {
        var c = JSON.stringify([{
            name: b.name,
            timestamp: b.timestamp || (new Date).getTime(),
            params: b.params,
            _token: TLI.Security.getCsrfToken()
        }]);
        $.ajax({
            url: a.buildUrl(),
            type: "POST",
            dataType: "json",
            contentType: "application/json",
            processData: false,
            data: c,
            complete: b.complete
        })
    }
})(TLI.Metrics);
TLI.ABTest = {};
(function(a) {
    a.TEST_BUCKET = "B";
    a.TEST_BUCKET_SELECT = "B";
    a.CONTROL_BUCKET = "A";
    a.CONTROL_BUCKET_SELECT = "A";
    a.NA_BUCKET = "NA";
    a.randomDistribute = function(b, c) {
        return Math.floor(Math.random() * (c - b + 1) + b)
    };
    a.hashDistribute = function(b, c, d) {
        var f = parseInt("ffffffffffffffffffffffffffffffff", 16);
        d = parseInt(md5(d), 16);
        return Math.floor(d / f * (c - b + 1) + b)
    };
    a.selectBucket = function(b, c) {
        var d = null,
        f = $config.experiments[b];
        if (f && f.active) d = a.randomDistribute(0, 100, b + ":" + c.id.toString()) < f.testBucketPercent ? a.TEST_BUCKET: a.CONTROL_BUCKET;
        return d
    };
    a.generateBucketKey = function(b, c) {
        return $storage.generateKey("experiments:" + c.id + ":" + b + ":bucket")
    };
    a.getBucketParam = function(b) {
        if (!$config.experiments[b]) return null;
        var c = window.location.href.split("?");
        if (c[1]) if (b = c[1].match(RegExp(b + "Grp=(\\S+)\\W"))) {
            b = b[1].toUpperCase();
            if (b === a.TEST_BUCKET || b === a.CONTROL_BUCKET) return b
        }
        return null
    };
    a.getBucketsFromCookie = function() {
        for (var b = document.cookie.split(";"), c = 0; c < b.length; c++) {
            var d = b[c].replace(/^\s+|\s+$/g, "").match(/buckets=(.+)/);
            if (d && d.length) return JSON.parse(decodeURIComponent(d[1]))
        }
        return null
    };
    a.updateCookie = function(b) {
        var c = a.getBucketsFromCookie() || {};
        c = _.extend(c, b);
        for (var d in c) c[d] === null && delete c[d];
        document.cookie = "buckets=" + encodeURIComponent(JSON.stringify(c))
    };
    a.store = function(b, c) {
        var d = TLI.User.getCurrentUser();
        if (d) {
            d = {
                _userId: d.id
            };
            d[b] = c;
            a.updateCookie(d)
        }
    };
    a.retrieve = function(b) {
        var c = TLI.User.getCurrentUser();
        if (c && c.id) {
            var d = a.getBucketsFromCookie();
            if (d && d._userId === c.id.toString()) return d[b]
        }
        return null
    };
    a.getCurrentUserBucket = function(b, c) {
        c = _.extend({
            selectBucketIfEmpty: true
        },
        c || {});
        if (TLI.User.getCurrentUser()) {
            var d = null;
            if (d = a.getBucketParam(b)) {
                a.store(b, d);
                return d
            }
            if (d = a.retrieve(b)) return d;
            if (c.selectBucketIfEmpty) {
                d = TLI.serverData && TLI.serverData.buckets ? TLI.serverData.buckets[b] : a.NA_BUCKET;
                a.store(b, d);
                return d
            }
        }
        return null
    };
    a.getAllCurrentUserBuckets = function() {
        var b = [],
        c;
        for (c in $config.experiments) if ($config.experiments[c].active) {
            var d = a.getCurrentUserBucket(c, {
                selectBucketIfEmpty: false
            }),
            f = {};
            f[c] = d || a.NA_BUCKET;
            b.push(f)
        }
        return b
    };
    a.clearCurrentUserBucket = function(b) {
        a.store(b, null)
    };
    a.isInTestGroup = function(b) {
        var c = a.getCurrentUserBucket(b);
        return (b = $config.experiments[b]) && b.active && (c === a.TEST_BUCKET || c === a.TEST_BUCKET_SELECT)
    };
    a.forControlGroup = function(b, c) {
        var d = a.getCurrentUserBucket(b),
        f = $config.experiments[b];
        if (f && (d === a.CONTROL_BUCKET || d === a.CONTROL_BUCKET_SELECT || !f.active) && c) c()
    };
    a.forTestGroup = function(b, c) {
        a.getCurrentUserBucket(b);
        a.isInTestGroup(b) && c && c()
    }
})(TLI.ABTest);
TLI.Security = {};
(function(a) {
    a.getCsrfToken = function() {
        var b = TLI.User.getCurrentUser();
        if (b && b.get("id")) {
            var c = b.get("id");
            b = b.get("authToken");
            var d = $metrics.getSessionId(),
            f = $mcache.generateKey("csrfToken"),
            e = $mcache.get(f);
            if (!e || e.userId != c || e.authToken != b || e.sessionId != d) {
                e = Crypto.SHA1("" + c + ":" + b + ":" + d);
                e = {
                    userId: c,
                    authToken: b,
                    sessionId: d,
                    value: e
                };
                $mcache.set(f, e)
            }
            return e.value
        }
    }
})(TLI.Security);







TLI.ConnectionCollection = TLI.BaseCollection.extend({
    model: TLI.Person,
    initialize: function() {
        TLI.BaseCollection.prototype.initialize.apply(this);
        var a = this,
        b = function() {
            a.conn_id || TLI.ConnectionCollection.setConnections(this)
        };
        this.bind("refresh", b);
        this.bind("add", b)
    },
    url: function() {
        var a = this.sinceTS,
        b = this.conn_id ? "<%- base %>/li/v1/people/" + this.conn_id + "/connections<%- suffix %>": "<%- base %>/li/v1/people/connections<%- suffix %>",
        c = {};
        if (a && a != -1) c.since = a;
        else c.count = 3E3;
        return this.buildUrl(b, c)
    },
    group: function() {
        return this.groupBy(function(a) {
            a = a.get("lastName");
            var b = null,
            c = null;
            if (a) {
                c = a[0].toUpperCase();
                b = /[A-Za-z]/;
                if (b.test(c)) return c;
                b = /[\d\(]/;
                return b.test(c) ? "#": c
            } else return null
        })
    },
    parse: function(a) {
        if (!this.sinceTS || this.sinceTS === -1) this.total = a.total;
        if (!this.conn_id) {
            this.sinceTS = (new Date).getTime();
            $storage.set(TLI.ConnectionCollection.getStorageKey("sinceTS"), this.sinceTS)
        }
        return a.values
    },
    comparator: function(a) {
        return (a = a.get("lastName")) ? a.toUpperCase() : null
    },
    fetch: function(a) {
        a || (a = {});
        if (!a.id && !a.add) this.sinceTS = -1;
        else if (a.id) this.conn_id = a.id;
        TLI.BaseCollection.prototype.fetch.call(this, a)
    }
},
{
    connections: null,
    getStorageKey: function(a) {
        return $storage.generateKey(a, TLI.User.getCurrentUser().id)
    },
    getInstance: function(a) {
        var b = TLI.ConnectionCollection,
        c = $mcache.get("connections");
        a || (a = {});
        if (!a.id && !a.forceRefresh) {
            if (c) {
                a.success && a.success.call(b, c);
                c.fetch({
                    add: true,
                    replace: true
                });
                return
            }
            var d = b.getStorageKey("connections");
            if (c = $storage.get(d)) {
                c = new b(c);
                c.total = c.models.length;
                c.sinceTS = $storage.get(b.getStorageKey("sinceTS"));
                $mcache.set("connections", c);
                a.success && a.success.call(b, c);
                c.fetch({
                    add: true,
                    replace: true
                });
                return
            }
        }
        var f = a.success;
        c = new b;
        c.fetch({
            success: function() {
                f && f.call(b, c)
            },
            error: a.error,
            id: a.id
        })
    },
    setConnections: function(a) {
        var b = TLI.ConnectionCollection;
        $mcache.set("connections", a);
        b = b.getStorageKey("connections");
        $storage.set(b, a)
    }
});
TLI.PeopleCollection = TLI.ConnectionCollection.extend({
    model: TLI.Person,
    initialize: function() {
        TLI.BaseCollection.prototype.initialize.apply(this)
    },
    parse: function(a) {
        this.total = a.total;
        return a.values
    },
    url: function() {},
    group: function() {
        return [{
            group: null,
            groupItems: this.models
        }]
    },
    _reset: function() {
        TLI.ConnectionCollection.prototype._reset.apply(this);
        this.comparator = null
    }
});
TLI.SearchResults = TLI.PeopleCollection.extend({
    parse: function(a) {
        this.total = a.network.total;
        return a.network.values
    },
    url: function() {
        this.params.start = this.cursor.position;
        return this.buildUrl("<%- base %>/li/v1/people<%- suffix %>", this.params)
    }
});
TLI.Search = TLI.BaseModel.extend({
    params: {
        count: 20,
        keywords: ""
    },
    recents: [],
    connections: [],
    network: [],
    url: function() {
        this.params.start = 0;
        return this.buildUrl("<%- base %>/li/v1/people<%- suffix %>", this.params)
    },
    refreshResults: function() {
        if (this.get("network")) {
            this.network = new TLI.SearchResults(this.get("network").values);
            this.network.total = this.get("network").total
        }
        this.network.params = this.params
    },
    search: function(a) {
        var b = this;
        a || (a = {});
        var c = a.params;
        delete a.params;
        if (c) if (this.params) _.extend(this.params, c);
        else this.params = c;
        if (!a.attributes) a.attributes = ["firstName", "lastName", "headline"];
        if (a.category === "connections") TLI.ConnectionCollection.getInstance({
            success: function(f) {
                b.connections = f.search({
                    keywords: c.keywords,
                    attributes: a.attributes,
                    exclude: a.exclude,
                    limit: a.limit
                });
                b.trigger("change");
                a.success && a.success.call(b)
            }
        });
        else {
            var d = a.success;
            a.success = function() {
                b.refreshResults();
                d && d.call(b)
            };
            this.fetch(a)
        }
    }
});
TLI.Message = TLI.BaseModel.extend({
    hash: function() {
        return $mcache.generateKey("message", this.get("id"))
    },
    url: function() {
        return this.buildUrl("<%- base %>/li/v1/messages/<%- id %><%- suffix %>")
    },
    to: [],
    initialize: function() {
        TLI.BaseModel.prototype.initialize.apply(this);
        _.bindAll(this, "refreshChildren");
        this.bind("change", this.refreshChildren);
        this.refreshChildren()
    },
    refreshChildren: function() {
        if (this.get("to") && typeof this.get("to") == "object") this.to = _.map(this.get("to"),
        function(a) {
            return new TLI.Person(a)
        });
        if (this.get("from") && typeof this.get("from") == "object") this.from = new TLI.Person(this.get("from"))
    },
    displayDate: function() {
        return (new Date(this.get("timestamp"))).toDateString()
    },
    getQuote: function() {
        return "\n\n\nOn " + this.displayDate() + ", " + this.from.fullName() + " wrote:\n\n" + this.get("body")
    },
    createReply: function() {
        var a = new TLI.Message;
        a.set({
            replyId: this.id,
            type: TLI.Message.Types.MESSAGE,
            to: [this.get("from")],
            subject: "RE: " + this.get("subject"),
            body: this.getQuote()
        });
        return a
    },
    createForward: function(a) {
        var b = new TLI.Message;
        b.set({
            forwardId: this.id,
            to: a,
            subject: "FW: " + this.get("subject"),
            body: this.get("body")
        });
        return b
    },
    isInvitation: function() {
        return this.get("tType") === TLI.Message.Types.INVITATION || this.get("tType") === "invitation"
    },
    setRead: function(a, b) {
        this.set({
            read: a
        },
        b);
        this.put({
            read: a
        },
        b)
    },
    trash: function(a) {
        this.put({
            folder: "trash"
        },
        {
            success: _.bind(function() {
                TLI.Inbox.messageDeleted(this.id);
                a && a.success && a.success.call(this)
            },
            this),
            error: a.error
        })
    },
    archive: function(a) {
        this.put({
            folder: "archived"
        },
        {
            success: _.bind(function() {
                TLI.Inbox.messageArchived(this.id);
                a && a.success && a.success.call(this)
            },
            this),
            error: a.error
        })
    },
    accept: function(a) {
        this.put({
            invt: "accepted"
        },
        {
            success: _.bind(function() {
                TLI.Inbox.invStateChanged(this);
                a && a.success && a.success.call(this)
            },
            this)
        })
    },
    decline: function() {
        this.put({
            invt: "declined"
        },
        {
            success: _.bind(function() {
                TLI.Inbox.invStateChanged(this)
            },
            this)
        })
    }
},
{
    Types: {
        MESSAGE: "msg",
        INVITATION: "invt",
        INVITATION_NOEMAIL: "iwe"
    }
});
TLI.MessageCollection = TLI.BaseCollection.extend({
    model: TLI.Message,
    params: {
        type: TLI.Message.Types.MESSAGE,
        start: 0,
        count: 50,
        since: null
    },
    group: function() {
        return [{
            group: null,
            groupItems: this.models
        }]
    },
    url: function() {
        if (this.models.length > 0) this.params.start = this.models.length;
        return this.buildUrl("<%- base %>/li/v1/messages<%- suffix %>", this.params)
    },
    parse: function(a) {
        var b = null;
        if (a.values) {
            b = a.values;
            this.total = a.total
        } else if (this.params.type == TLI.Message.Types.MESSAGE) {
            if (a.messages) b = a.messages.values
        } else if (this.params.type == TLI.Message.Types.INVITATION) if (a.invitations) b = a.invitations.values;
        return b
    },
    comparator: function(a) {
        return - a.get("timestamp")
    }
});
TLI.Inbox = TLI.BaseModel.extend({
    params: {
        count: 50
    },
    url: function() {
        return this.buildUrl("<%- base %>/li/v1/pages/mailbox<%- suffix %>", this.params)
    },
    invitations: [],
    messages: [],
    initialize: function() {
        var a = this;
        a.bind("change",
        function() {
            a.refreshCollections()
        })
    },
    refreshCollections: function() {
        var a;
        if (this.get("invitations")) {
            a = new TLI.MessageCollection(_.map(this.get("invitations").values,
            function(b) {
                return new TLI.Message(b)
            }));
            a.total = this.get("invitations").total;
            a.params.type = TLI.Message.Types.INVITATION;
            this.set({
                invitations: a
            },
            {
                silent: true
            })
        }
        if (this.get("messages")) {
            a = new TLI.MessageCollection(_.map(this.get("messages").values,
            function(b) {
                return new TLI.Message(b)
            }));
            a.total = this.get("messages").total;
            a.unread = this.get("messages").unread;
            a.params.type = TLI.Message.Types.MESSAGE;
            this.set({
                messages: a
            },
            {
                silent: true
            })
        }
        this.get("messages").bind("change:read", _.bind(this.updateUnread, this))
    },
    updateUnread: function(a) {
        if (a.get("read")) this.get("messages").unread = this.get("messages").unread - 1;
        else this.get("messages").unread = this.get("messages").unread + 1;
        this.get("messages").trigger("change:unread", this.get("messages").unread)
    }
},
{
    successQ: [],
    isFetching: false,
    get: function(a) {
        var b = TLI.Inbox,
        c = $mcache.get(b.getKey());
        if (c) a.success.call(b, c);
        else {
            b.successQ.push(a.success);
            if (!b.isFetching) {
                b.isFetching = true;
                c = new b;
                c.fetch({
                    success: function() {
                        b.set(c);
                        c.refreshCollections();
                        _.each(b.successQ,
                        function(d) {
                            d.call(b, c)
                        });
                        b.successQ.length = 0;
                        b.isFetching = false
                    },
                    error: function() {
                        b.successQ.length = 0;
                        b.isFetching = false;
                        a.error && a.error.apply(this, arguments)
                    },
                    silent: true
                })
            }
        }
    },
    set: function(a) {
        $mcache.set(TLI.Inbox.getKey(), a)
    },
    getKey: function() {
        return $mcache.generateKey("inbox")
    },
    getInvitations: function(a) {
        var b = TLI.Inbox;
        b.get({
            success: function(c) {
                a.success.call(b, c.get("invitations"))
            },
            error: a.error
        })
    },
    messageRead: function(a, b) {
        TLI.Inbox.get({
            success: _.bind(function(c) { (c = c.get("messages").get(a)) && c.setRead(b)
            },
            this)
        })
    },
    messageDeleted: function(a) {
        this.messageArchived(a)
    },
    messageArchived: function(a) {
        TLI.Inbox.get({
            success: _.bind(function(b) {
                b = b.get("messages");
                var c = b.get(a);
                b.remove(c)
            },
            this)
        })
    },
    invStateChanged: function(a) {
        TLI.Inbox.get({
            success: function(b) {
                b.get("invitations").remove(a)
            }
        })
    }
});
TLI.InCommon = TLI.PeopleCollection.extend({
    params: {
        count: 50
    },
    hash: function() {
        return $mcache.generateKey("incommon", this.id)
    },
    parse: function(a) {
        var b = $mcache.get(this.hash());
        if (b) {
            b.values = b.values.concat(a.values);
            $mcache.set(this.hash(), b)
        } else $mcache.set(this.hash(), a);
        return TLI.PeopleCollection.prototype.parse.apply(this, [a])
    },
    url: function() {
        var a = "<%- base %>/li/v1/people/" + this.id + "/incommon<%- suffix %>",
        b = {};
        _.defaults(b, this.params);
        if (this.models.length > 0) b.start = this.models.length;
        return this.buildUrl(a, b)
    },
    fetch: function(a) {
        var b = this,
        c = this.hash();
        c = $mcache.get(c);
        var d = a.success;
        a.success = function(f) {
            d && d.call(b, f)
        };
        if (c && !a.add) {
            b.total = c.total;
            b.refresh(c.values)
        } else TLI.PeopleCollection.prototype.fetch.apply(this, [a])
    }
});
TLI.PymkCollection = TLI.PeopleCollection.extend({
    model: TLI.PymkPerson,
    params: {
        count: 100
    },
    initialize: function() {
        var a = this;
        TLI.PeopleCollection.prototype.initialize.apply(this);
        this.bind("remove",
        function() {
            TLI.PymkCollection.setPymk(a)
        })
    },
    url: function() {
        return this.buildUrl("<%- base %>/li/v1/people/pymk<%- suffix %>", this.params)
    }
},
{
    getInstance: function(a) {
        var b = TLI.PymkCollection,
        c = TLI.PymkCollection.getPymk();
        _.defaults(a, {
            foceRefresh: false
        });
        if (a.success) if (!a.forceRefresh && c) a.success.call(b, c);
        else {
            var d = a.success;
            c = new b;
            c.fetch({
                success: function() {
                    TLI.PymkCollection.setPymk(c);
                    d.call(b, c)
                },
                error: function() {
                    a.error && a.error.call(b)
                }
            })
        }
    },
    getStorageKey: function() {
        return $mcache.generateKey("pymkmodel")
    },
    getPymk: function() {
        return $mcache.get(TLI.PymkCollection.getStorageKey())
    },
    setPymk: function(a) {
        $mcache.set(TLI.PymkCollection.getStorageKey(), a)
    }
});
TLI.Like = TLI.BaseModel.extend({
    url: function() {
        return this.post_id ? this.buildUrl("<%- base %>/li/v1/posts/" + this.post_id + "<%- suffix %>") : this.buildUrl("<%- base %>/li/v1/updates/" + this.nus_id + "/like<%- suffix %>")
    },
    like: function(a) {
        this.likeCall("true", a)
    },
    unlike: function(a) {
        this.likeCall("false", a)
    },
    likeCall: function(a, b) {
        this.post_id ? this.put({
            isLiked: a
        },
        b) : this.save({
            like: a
        },
        b)
    }
});
TLI.Likes = TLI.PeopleCollection.extend({
    model: TLI.Person,
    params: {
        count: 50
    },
    url: function() {
        var a = _.defaults({
            start: this.cursor.position
        },
        this.params);
        return this.post_id ? this.buildUrl("<%- base %>/li/v1/posts/" + this.post_id + "/likes<%- suffix %>", a) : this.buildUrl("<%- base %>/li/v1/updates/" + this.nus_id + "/likes<%- suffix %>", a)
    }
});
TLI.Comment = TLI.BaseModel.extend({
    url: function() {
        return this.post_id ? this.buildUrl("<%- base %>/li/v1/posts/" + this.post_id + "/comments") : this.buildUrl("<%- base %>/li/v1/updates/" + this.nus_id + "/comment")
    }
});
TLI.Comments = TLI.BaseCollection.extend({
    params: {
        count: 50
    },
    url: function() {
        var a = _.defaults({
            start: this.cursor.position
        },
        this.params);
        return this.post_id ? this.buildUrl("<%- base %>/li/v1/posts/" + this.post_id + "/comments<%- suffix %>", a) : this.buildUrl("<%- base %>/li/v1/updates/" + this.nus_id + "/comments<%- suffix %>", a)
    },
    parse: function(a) {
        this.total = a.total;
        return a.values
    },
    group: function() {
        return this.groupBy(function() {
            return null
        })
    }
});
TLI.UserSettings = TLI.BaseModel.extend({
    url: function() {
        return this.buildUrl("<%- base %>/li/v1/people/person?fields=:(primary-twitter-account)")
    },
    parse: function(a) {
        return a.primaryTwitterAccount
    }
});
TLI.Groups = TLI.BaseModel.extend({
    initialize: function() {}
});
TLI.GroupActivityStream = TLI.NetworkUpdateStream.extend({
    model: TLI.GroupUpdate,
    hash: function() {
        return $mcache.generateKey("groupActivity", this.group_id)
    },
    collectionOptions: {},
    url: function() {
        var a = {};
        _.defaults(a, this.params);
        if (this.models.length > 0) a.start = this.models.length;
        url = "<%- base %>/li/v1/groups/" + this.group_id + "<%- suffix %>";
        return this.buildUrl(url, a)
    },
    parse: function(a) {
        this.total = a.total;
        this.title = a.title;
        a = a.discussions;
        return a.values
    },
    saveToMemory: function() {
        var a;
        if (this.hash) {
            a = typeof this.hash === "function" ? this.hash() : this.hash;
            if (typeof a !== "undefined") {
                this.title && $mcache.set(a + "-title", this.title);
                $mcache.set(a, this.toJSON())
            }
        }
    },
    fetch: function(a) {
        var b = this,
        c = this.hash(),
        d = a.success,
        f = a ? a.forceRefresh: false;
        a.success = function(e) {
            e.saveToMemory();
            d && d.call(a, b, e)
        };
        if ($mcache.get(c) && !a.add && !f) {
            b.refresh($mcache.get(c));
            if ($mcache.get(c + "-title")) b.title = $mcache.get(c + "-title");
            d && d.call(a, b, $mcache.get(c))
        } else TLI.NetworkUpdateStream.prototype.fetch.apply(this, [a])
    }
});
TLI.GroupUpdate = TLI.NetworkUpdate.extend({
    url: function() {
        return this.buildUrl("<%- base %>/li/v1/posts/<%- id %><%- suffix %>", {
            start: 0,
            count: 10
        })
    },
    save: function() {}
});
TLI.Groups = TLI.BaseModel.extend({
    initialize: function() {}
});
TLI.GroupsCollection = TLI.BaseCollection.extend({
    model: TLI.Group,
    hash: function() {
        return $mcache.generateKey("yourGroups")
    },
    initialize: function() {
        TLI.BaseCollection.prototype.initialize.call(this);
        this.params = {
            count: 50,
            start: 0
        }
    },
    url: function() {
        return this.buildUrl("<%- base %>/li/v1/groups<%- suffix %>", {
            authToken: this.get("authToken")
        })
    },
    parse: function(a) {
        return a.yourGroups.values
    },
    group: function() {
        return [{
            group: null,
            groupItems: this.models
        }]
    },
    fetch: function(a) {
        var b = this,
        c = this.hash(),
        d = a.success;
        a.success = function(f) {
            f.saveToMemory();
            d && d.call(a, b, f)
        };
        if ($mcache.get(c) && !a.add) {
            b.refresh($mcache.get(c));
            d && d.call(a, b, $mcache.get(c))
        } else TLI.BaseCollection.prototype.fetch.apply(this, arguments)
    }
});
TLI.PostModel = TLI.BaseModel.extend({
    url: function() {
        return this.buildUrl("<%- base %>/li/v1/groups/" + this.group_id + "/posts")
    }
});
TLI.Review = TLI.BaseModel.extend({
    url: function() {
        return this.buildUrl("<%- base %>/li/v1/pages/wir<%- suffix %>")
    },
    initialize: function() {
        var a = this;
        a.bind("change",
        function() {
            a.refreshCollections()
        })
    },
    refreshCollections: function() {
        var a;
        if (this.get("wvmp")) {
            a = new TLI.PeopleCollection(_.map(this.get("wvmp").values,
            function(b) {
                return new TLI.Person(b)
            }));
            a.total = this.get("wvmp").total;
            a.title = this.get("wvmp").title;
            this.set({
                wvmp: a
            },
            {
                silent: true
            })
        }
        if (this.get("updates")) {
            a = new TLI.NetworkUpdateStream(_.map(this.get("updates").values,
            function(b) {
                return new TLI.NetworkUpdate(b)
            }));
            a.total = this.get("updates").total;
            this.set({
                updates: a
            },
            {
                silent: true
            })
        }
        if (this.get("shares")) {
            a = new TLI.NetworkUpdateStream(_.map(this.get("shares").values,
            function(b) {
                return new TLI.NetworkUpdate(b)
            }));
            a.total = this.get("shares").total;
            this.set({
                shares: a
            },
            {
                silent: true
            })
        }
    }
},
{
    successQ: [],
    isFetching: false,
    get: function(a) {
        var b = TLI.Review,
        c = $mcache.get(b.getKey());
        if (c) a.success.call(b, c);
        else {
            b.successQ.push(a.success);
            if (!b.isFetching) {
                b.isFetching = true;
                c = new b;
                c.fetch({
                    success: function() {
                        b.set(c);
                        c.refreshCollections();
                        _.each(b.successQ,
                        function(d) {
                            d.call(b, c)
                        });
                        b.successQ.length = 0;
                        b.isFetching = false
                    },
                    error: function() {
                        b.successQ.length = 0;
                        b.isFetching = false;
                        a.error && a.error.apply(this, arguments)
                    },
                    silent: true
                })
            }
        }
    },
    set: function(a) {
        $mcache.set(TLI.Review.getKey(), a)
    },
    getKey: function() {
        return $mcache.generateKey("review", "")
    }
});
TLI.templates.comments = {};
TLI.templates.comments.comments = _.template('<div id="comments-list-scroller" class="page-wrapper">   <div class="scroller">     <section>       <ul class="comments-list scrolling-list">       </ul>     </section>   </div> </div> ');
TLI.templates.compose = {};
TLI.templates.compose.to_person = _.template('<div class="to-person">   <%= person.fullName() %> </div> ');
TLI.templates.compose.compose = _.template('<form class="compose-form">   <section class="compose-message">     <div class="compose-header">       <div class="compose-title header-text"><%= header %></div>       <div class="controls">         <div class="cancel text secondary"><%= $t(\'cancel\') %></div>         <div class="send-disabled disabled text secondary"><%= $t(\'send\') %></div>       </div>     </div>     <div class="form-extend to">       <label><%= $t(\'compose-to\') %></label>       <span class="to-people">         <% if (message.to.length) { %>           <% _.each(message.to, function(person) { %>           <%- TLI.templates.compose.to_person({person: person}) %>           <% }); %>         <% } %>       </span>       <input id="compose-to" type="text" value="" placeholder="<%= (message.to.length ? \'\' : $t(\'required_placeholder\')) %>"  />     </div>     <% if(showSubj) { %>       <div class="form-extend subject">         <label><%= $t(\'compose-subject\') %></label>         <input id="compose-subject" type="text" placeholder=<%= $t(\'required_placeholder\') %> value="<%= message.get(\'subject\') %>" />       </div>     <% } %>     <div class="compose-body">       <label for="compose-body body"<%= $t(\'compose-body\') %>></label>       <textarea id="compose-body" value="" placeholder=<%= $t(\'required_placeholder\') %>><%= message.get(\'body\') %></textarea>     </div>   </section> </form> ');
TLI.templates.connections = {};
TLI.templates.connections.connections = _.template('<div id="connections-list-scroller" class="page-wrapper">   <div class="scroller">     <section>       <ul class="connections-list scrolling-list">       </ul>       <div class="screen-empty" style="display:none"><%= $t(\'no_connections\') %></div>     </section>     <div id="loadMoreLink" class="loadmore">       <div class="spinner standalone inverted"></div>       <span><%= $t(\'loadMore_default\') %></span>     </div>     <div class="footer-container"></div>   </div> </div>');
TLI.templates.dev = {};
TLI.templates.dev.log = _.template('<div id="log-view-scroller" class="page-wrapper">   <div class="scroller">     <% if (logItems && logItems.length) { %>     <div class="controls">       <div class="text email-button">Email</div>       <div class="text clear-button">Clear</div>     </div>      <% $abtest.forControlGroup(\'searchHeader\', function() { %>       Control group!     <% }); %>      <% $abtest.forTestGroup(\'searchHeader\', function() { %>       Test group!     <% }); %>      <ul>       <% _.each(logItems, function(i) { %>         <li><%= i %></li>       <% }); %>     </ul>      <div class="controls">       <div class="text email-button">Email</div>       <div class="text clear-button">Clear</div>     </div>     <% } %>   </div> </div> ');
TLI.templates.group = {};
TLI.templates.group.group_update = _.template("<textarea placeholder=\"<%= $t('pc-adddetails') %>\"></textarea>");
TLI.templates.group.group_activity = _.template('<div id="ga-list-scroller" class="nus page-wrapper">   <div class="scroller">     <section>       <header class="section-heading first">         <h2><%= header %></h2>       </header>       <div class="spinner standalone"></div>       <ul class="nus-list scrolling-list">       </ul>       <div class="screen-empty" style="display:none"><%= $t(\'ga-nodiscussions\') %></div>     </section>     <div id="loadMoreLink" class="loadmore">       <div class="spinner standalone inverted"></div>       <span><%= $t(\'loadMore_default\') %></span>     </div>     <div class="footer-container">     </div>   </div> </div> ');
TLI.templates.groups = {};
TLI.templates.groups.groups = _.template('<div id="groups-list-scroller" class="page-wrapper">   <div class="scroller">     <section>       <header class="section-heading first">         <h2><%= $t(\'your-groups\') %></h2>       </header>       <div class="spinner standalone"></div>       <ul class="groups-list scrolling-list">       </ul>     </section>     <div id="loadMoreLink" class="loadmore">       <div class="spinner standalone inverted"></div>       <span><%= $t(\'loadMore_default\') %></span>     </div>     <div class="footer-container"></div>   </div> </div> ');
TLI.templates.groups.groupItem = _.template('<div class="media">   <div class="media-img">     <% if (group.get(\'picture\')) { %>       <img width="50" height="50" style="background: url(<%= group.get(\'picture\') %>) no-repeat" alt="<%= group.get(\'text1\') %>" class="img groups-img">     <% } else { %>       <img class="img ghost-group" height="50" width="50" alt="<%= $t(\'ghost-image-alt\') %>">     <% } %>   </div>   <div class="body">     <header>       <h3 class="media-heading"><%= group.get(\'text1\') %></h3>       <% if (group.get(\'counts\').discussions > 0) { %>         <div class="title<%= group.get("private") ? \' private\' : \'\' %>">           <%= $t(\'discussions\', group.get(\'counts\').discussions) %>         </div>       <% } %>     </header>   </div> </div> ');
TLI.templates.home = {};
TLI.templates.home.login = _.template('<div class="logo">   <%= $t(\'linkedin\') %> </div> <form id="login_form">   <label for="username">     <%= $t(\'login-email\') %>   </label>   <input id="username" placeholder="<%= $t(\'login-email\') %>" type="email" autocapitalize="off" autocomplete="off" autocorrect="off">   <label for="password">     <%= $t(\'login-password\') %>   </label>   <input id="password" placeholder="<%= $t(\'login-password\') %>" type="password">   <div class="controls single">     <input id="login-button" type="submit" value="<%= $t(\'login-signin\') %>" class="text">   </div> </form>  ');
TLI.templates.home.home = _.template('<div id="nus-list-scroller" class="nus page-wrapper">   <div class="scroller">     <div class="rollup-board-container">       <section class="rollup-board news-rollup has-chevron white">         <header>           <h2 class="rollup-heading"><div class="news-icon rollup-hdr-icon"></div><%= $t(\'top-news\') %></h2>         </header>         <div class="running-list-container">           <div class="running-list running-connections">             <div class=\'spinner standalone inverted\'></div>           </div>         </div>       </section>     </div>     <section>       <header class="section-heading">         <h2><%= header %></h2>       </header>       <div class="spinner standalone"></div>       <ul class="nus-list scrolling-list">       </ul>       <div class="screen-empty" style="display:none"><%= $t(\'ra-nonusupdates\') %></div>     </section>     <div id="loadMoreLink" class="loadmore">       <div class="spinner standalone inverted"></div>       <span><%= $t(\'loadMore_default\') %></span>     </div>     <div class="footer-container">     </div>   </div> </div> ');
TLI.templates.inbox = {};
TLI.templates.inbox.message_item = _.template('<div class="bullet<%= message.get(\'read\') ? \' hollow\' : \'\' %>"></div> <div class="media">   <div class="media-img">    <% if (message.from.pictureUrl()) { %>       <img class="img" width="50" height="50" src="<%= message.from.pictureUrl() %>" alt="<%= message.from.fullName() %>">    <% } else { %>       <img class="img ghost-photo" height="50" width="50" alt="<%= $t(\'ghost-image-alt\') %>">    <% } %>     </div>   <div class="body">     <header>       <h3 class="media-heading">         <%= message.from.fullName() %>       </h3>       <span class="timestamp"><%= message.displayDate() %></span>       <div class="title">         <%= message.get("subject") %>       </div>     </header>     <div>       <span class="snippet"><%= message.get("text") %></span>     </div>   </div> </div> ');
TLI.templates.inbox.inbox = _.template('<div id="inbox-list-scroller" class="page-wrapper">   <div class="scroller">     <section>       <header class="section-heading first invitations-header">         <h2><%= $t(\'inbox-invitecount\') %> <span class="invitations-count degree number-badge"><%= inboxInfo.get("invitations").total %></span></h2>       </header>       <ul class="invitations-list scrolling-list">       </ul>        <header class="section-heading inbox-header">         <h2><%= $t(\'inbox-messagecount\') %> <span class="messages-count degree number-badge"><%= inboxInfo.get("messages").unread %></span></h2>       </header>       <ul class="inbox-list scrolling-list">       </ul>     </section>     <div id="loadMoreLink" class="loadmore">       <div class="spinner standalone inverted"></div>       <span><%= $t(\'loadMore_default\') %></span>     </div>     <div class="footer-container"></div>   </div> </div> ');
TLI.templates.incommon = {};
TLI.templates.incommon.incommon = _.template('<div class="scroller">   <section>     <ul class="incommon-list scrolling-list">     </ul>   </section>   <div id="loadMoreLink" class="loadmore">      <div class="spinner standalone inverted"></div>     <span><%= $t(\'loadMore_default\') %></span>   </div> </div>');
TLI.templates.invitations = {};
TLI.templates.invitations.invitations = _.template('<section>   <div id="invitations-list-scroller" class="page-wrapper">     <div class="scroller">       <ul class="invitations-list scrolling-list">       </ul>       <div id="loadMoreLink" class="loadmore">         <div class="spinner standalone inverted"></div>         <span><%= $t(\'loadMore_default\') %></span>       </div>     </div>   </div> </section> ');
TLI.templates.invitations.invitation_accepted = _.template('<header class="section-heading">   <h2>Is now a connection</h2> </header> <section class="meta poster-profile has-chevron inverted">   <div class="media">     <div class="media-img">       <img class="profile_photo img" src="http://media.linkedin.com/mpr/mpr/shrink_80_80/p/2/000/003/2c1/15f0c1c.jpg" alt="Mark Trammell" width="50" height="50">     </div>     <div class="body">       <header>         <h2> Mark Trammell </h2>         <div class="title">           User Researcher at Twitter         </div>       </header>       <div></div>     </div>   </div> </section> <ul class="scrolling-list profile-facts">   <li class="user-incommon has-chevron profile-fact factoid">     <div class="incommon icon"></div>     <header>       <h2 class="profile-fact-title">In Common</h2>     </header>     <div class="body muted profile-fact-text">       <div class="running-list running-connections">         <img height="35" width="35" class="photo" src="http://media.linkedin.com/mpr/mpr/shrink_80_80/p/3/000/0da/3b5/1ffb9ac.jpg">         <img height="35" width="35" class="photo" src="http://media.linkedin.com/mpr/mpr/shrink_80_80/p/1/000/017/343/2804bae.jpg">         <img height="35" width="35" class="photo" src="http://media.linkedin.com/mpr/mpr/shrink_80_80/p/3/000/05d/2d5/16318c5.jpg">         <img height="35" width="35" class="photo" src="http://media.linkedin.com/mpr/mpr/shrink_80_80/p/1/000/02d/0fb/19b8e59.jpg">         <img height="35" width="35" class="photo" src="http://media.linkedin.com/mpr/mpr/shrink_80_80/p/1/000/0f2/086/2b07b7d.jpg">         <div class="ellipsis">           Sid  Viswanathan,                                                                                                Deep  Nishar,                                                                                                Russell  Melick,                                                                                                Alexandre  Lee,                                                                                                Brandon  Duncan         </div>       </div>     </div>   </li> </ul> <header class="section-heading">   <h2>You may know....</h2> </header> <ul class="pymk-list scrolling-list">   <li class="people-item" id="149855181">     <div class="media">       <div class="media-img">         <img width="50" height="50" src="http://media.linkedin.com/mpr/mpr/shrink_80_80/p/3/000/108/043/0cba6ac.jpg" alt="Judd Blair">       </div>       <div class="body">         <header>           <h3 class="media-heading"> Judd Blair </h3>           <div class="title">             Software Engineer at Euclid Inc.           </div>         </header>       </div>       <ul class="actions controls">         <li class="add-connection primary accept">           Accept         </li>         <li class="ignore decline">           Decline         </li>       </ul>     </div>   </li> </ul> ');
TLI.templates.likes = {};
TLI.templates.likes.likes = _.template('<div id="likes-list-scroller" class="page-wrapper">   <div class="scroller">     <section>       <ul class="likes-list scrolling-list">       </ul>     </section>   </div> </div> ');
TLI.templates.message = {};
TLI.templates.message.right_nav = _.template('<div class="message-nav right controls navigation">   <div class="previous prev-btn">   </div>   <div class="next next-btn">   </div> </div> ');
TLI.templates.message.message = _.template('<div id="message-view-scroller" class="page-wrapper with-footer">   <div class="scroller">     <section class="meta has-chevron inverted">       <div class="message-from media">         <div class="media-img">           <% if ( message.from.pictureUrl()) { %>             <img class="img" width="50" height="50" src="<%= message.from.pictureUrl() %>" alt="<%= message.from.fullName() %>">           <% } else { %>             <img class="img ghost-photo" height="50" width="50" alt="<%= $t(\'ghost-image-alt\') %>">           <% } %>          </div>         <div class="body">           <header>             <h3>               <%= message.from.fullName() %>             </h3>             <div class="title">               <%= message.from.get(\'headline\') %>             </div>           </header>         </div>       </div>     </section>      <div class="message-content">       <section class="message-meta">         <h4 class="subject"><%= message.get(\'subject\') %></h4>         <div>           <% if (!message.isInvitation()) { %>             <div class="read-state <%= message.get(\'read\') ? \'markunread\' : \'markread\' %>">               <div class="bullet"></div>               <span class="desc"><%= message.get(\'read\') ? $t("message-markunread") : $t("message-markread") %></span>             </div>           <% } %>           <div class="date muted"><%= message.displayDate() %></div>         </div>       </section>       <section class="body">         <%- $h.autoLink(               $h.convertEscapeCodes(                 $h.escape(                   $h.breakWords(                     message.get(\'body\', { suppressEscaping: true }))))) %>       <div class="spinner standalone"></div>       </section>     </div>      <% if (message.get(\'resource\')) { %>       <section class="message-action">         <div class="controls single">           <div class="text"><%= message.get(\'resource\').text %></div>         </div>       </section>     <% } %>          <ul class="scrolling-list links">       <% if (message.get(\'links\')) { %>         <% _.each(message.get("links"), function(l, i) { %>           <% if (l.type === "web") { %>             <li class="has-chevron" data-index="<%= i %>">               <header>                 <h2><%= l.text %></h2>               </header>               <div class="body muted">                 <%= $h.summarize(l.url,40) %>               </div>             </li>           <% } %>         <% }); %>       <% } %>     </ul>   </div> </div>  <footer>   <% if (message.isInvitation()) { %>     <ul class="controls triple">       <li class="accept">         <%= $t(\'share\') %>       </li>       <li class="ignore">         <%= $t(\'retweet\') %>       </li>       <li class="reply">         <%= $t(\'reply\') %>       </li>     </ul>   <% } else { %>     <ul class="controls quadruple">       <li class="archive">         <%= $t(\'share\') %>       </li>       <li class="trash">         <%= $t(\'retweet\') %>       </li>       <li class="reply">         <%= $t(\'reply\') %>       </li>       <li class="compose">         <%= $t(\'compose\') %>       </li>     </ul>   <% } %> </footer> ');
TLI.templates.message.left_nav = _.template('<div class="message-nav left controls">   <div class="back button text secondary">     <%= $t(\'inbox\') %>   </div> </div> ');
TLI.templates.network = {};
TLI.templates.network.network = _.template('<div id="network-list-scroller" class="page-wrapper">   <div class="scroller">     <div class="rollup-board-container">       <section class="rollup-board pymk-rollup has-chevron white">         <header>           <h2 class="rollup-heading"><div class="pymk-icon rollup-hdr-icon"></div><%= $t(\'pymk-youmayknow\') %></h2>         </header>         <div class="running-list-container">           <div class="running-list running-connections">             <div class=\'spinner standalone inverted\'></div>           </div>         </div>       </section>     </div>     <div class="rollup-board-container">       <section class="rollup-board groups-rollup has-chevron white">         <header>           <h2 class="rollup-heading"><div class="groups-icon rollup-hdr-icon"></div><%= $t(\'title-groups\') %></h2>         </header>         <div class="running-list-container">           <div class="running-list running-groups">             <div class=\'spinner standalone inverted\'></div>           </div>         </div>       </section>     </div>     <section>       <ul class="network-list scrolling-list"></ul>       <div class="screen-empty" style="display:none">         <%= $t(\'no_network\') %>       </div>     </section>     <div id="loadMoreLink" class="loadmore">       <div class="spinner standalone inverted"></div>       <span><%= $t(\'loadMore_default\') %></span>     </div>     <div class="footer-container"></div>   </div> </div>');
TLI.templates.news = {};
TLI.templates.news.topics = _.template('<div id="topics-list-scroller" class="page-wrapper">   <div class="scroller">     <section>       <header class="section-heading first recommended-header">         <h2><%= $t(\'topics-recommended\') %></h2>       </header>       <ul class="recommended-list scrolling-list">       </ul>        <header class="section-heading following-header">         <h2><%= $t(\'topics-following\') %></h2>       </header>       <ul class="topics-list scrolling-list">       </ul>     </section>     <div id="loadMoreLink" class="loadmore">       <div class="spinner standalone inverted"></div>       <span><%= $t(\'loadMore_default\') %></span>     </div>     <div class="footer-container"></div>   </div> </div> ');
TLI.templates.news.topicrecommends = _.template('<div id="topicrecommends-list-scroller" class="page-wrapper">   <div class="scroller">     <section>       <header class="section-heading first recommended-header">         <h2><%= $t(\'topics-recommended\') %></h2>       </header>       <ul class="topicrecommends-list scrolling-list">       </ul>       <div id="loadMoreLink" class="loadmore">         <div class="spinner standalone inverted"></div>         <span><%= $t(\'loadMore_default\') %></span>       </div>     </section>   </div> </div> ');
TLI.templates.news.news_detail = _.template('<div id="newsdetail-list-scroller" class="newsdetail page-wrapper">   <div class="scroller">     <section class="meta article-header has-chevron inverted">       <div class="media">         <div class="media-img">           <img class="profile_photo img" src="<%= news.get(\'picture\') %>" alt="<%= news.get(\'text\') %>" width="50" height="50">         </div>         <div class="body">           <header>             <div class="title">               <% if (news.get(\'header\')) { %>                 <%= news.get(\'header\') %>               <% } else { %>                 <%= news.get(\'source\') %>               <% } %>             </div>             <h2>               <% if (news.get(\'text\')) { %>                 <%= news.get(\'text\') %>               <% } else { %>                 <%= news.get(\'title\') %>               <% } %>             </h2>             <div class="title">               <% if (news.get(\'timestamp\')) { %>                 <%= $t(\'nd-firstshared\', $h.formatTime(news.get(\'timestamp\'))) %>               <% } else { %>                 <%= $t(\'nd-firstshared\', $h.formatTime(news.get(\'sharedTimestamp\'))) %>               <% } %>             </div>           </header>         </div>       </div>     </section>          <section class="nus-detail-news-section news">       <div class="body">         <cite><span class="summary-title"><%= $t(\'nd-summary\') %></span>           <% if (news.get("text2")) { %>             <%- $h.convertEscapeCodes(                   $h.escape(                     $h.breakWords(news.get("text2", { suppressEscaping: true }))))             %>           <% } else { %>             <%- $h.convertEscapeCodes(                   $h.escape(                     $h.breakWords(news.get("summary", { suppressEscaping: true }))))             %>           <% } %>         </cite>                  <% if (news.get("links") && news.get("links")[0] && news.get("links")[0].picture) { %>           <img class="article-image" src="<%= news.get(\'links\')[0].picture %>" alt="<%= news.get("links")[0].text1 %>">         <% } %>       </div>     </section>         <% if (news.get(\'trending\') && news.get("trending").links && news.get("trending").links[0]) { %>       <section class="news-detail-section trending">         <header class="section-heading">           <h2><%= $t(\'nd-alsotrendingin\') %></h2>         </header>         <ul class="scrolling-list">           <% _.each(news.get("trending").links, function(v, i) { %>             <li class="has-chevron" data-index="<%= i %>">               <div class="quantum-bar" style="width: <%= v.trendCount %>%;"><%= $h.breakWords(v.text, {suppressEscaping:true,breakUrls:true}) %></div>             </li>           <% }); %>         </ul>                </section>     <% } %>          <% if (news.get(\'shared\')) { %>       <section class="news-detail-section shares">         <header class="section-heading">           <h2><%= $t(\'nd-comments\') %></h2>         </header>         <ul class="scrolling-list">           <li>             <header>               <h3>                 <img class="thumb-share" src="<%= news.get(\'shared\').picture %>" alt="<%= news.get(\'shared\').text %>" width="25" height="25">                 <%= news.get(\'shared\').text %>               </h3>             </header>           </li>         </ul>       </section>     <% } %>   </div> </div>  <footer>   <ul class="controls double">     <li class="email">       <%= $t(\'compose\') %>     </li>     <li class="reshare">       <%= $t(\'send\') %>     </li>   </ul> </footer> ');
TLI.templates.news.news_activity = _.template('<div id="na-list-scroller" class="nus page-wrapper">   <div class="scroller">     <section>       <% if (type && type === "topNews") { %>         <section class="meta followed-topics has-chevron blue">           <div class="media">             <div class="body">               <header>                 <h3 class="media-heading"><%= $t(\'na-newsyoufollow\') %></h3>               </header>               <div class="title">                 <%= $t(\'na-newsmanage\') %>               </div>             </div>           </div>         </section>       <% } %>       <header class="section-heading">         <h2><%= header %></h2>       </header>              <% if (id) { %>         <section class="follow-action" style="display:none;">           <ul class="controls single center">             <li class="text follow">Follow</li>           </ul>         </section>       <% } %>              <div class="spinner standalone"></div>              <ul class="nus-list scrolling-list">       </ul>       <div class="screen-empty" style="display:none"><%= $t(\'na-nodiscussions\') %></div>     </section>     <div id="loadMoreLink" class="loadmore">       <div class="spinner standalone inverted"></div>       <span><%= $t(\'loadMore_default\') %></span>     </div>     <div class="footer-container">     </div>   </div> </div> ');
TLI.templates.notification = {};
TLI.templates.notification.rich_toast = _.template('<div id="notification-bar" class="notification <%= type %>">   <div class="icon <%= name %>"></div>   <span class="message"><%- message %></span>   <div class="close-button">&nbsp;</div> </div> ');
TLI.templates.nus = {};
TLI.templates.nus.simple_item = _.template('<div class="media">   <div class="media-img">     <% if (update.get("person")) { %>       <img class="img profile-photo" src="<%= person.pictureUrl() %>" alt="<%= person.fullName() %>" width="50" height="50">     <% } else if (update.get("picture")) { %>       <img class="img" width="50" height="50" src="<%= update.get(\'picture\') %>" alt"<%= update.get(\'header\') %>">     <% } else { %>       <img class="img ghost-photo" height="50" width="50" alt="<%= $t(\'ghost-image-alt\') %>">     <% } %>   </div>   <div class="body">     <header>       <div class="title">         <%= update.get(\'header\') %>         <span class="muted">          &middot; <%= $h.formatTime(update.get(\'timestamp\')) %>         </span>       </div>       <h3 class="media-heading">         <%= $h.breakWords(update.get(\'text\'),{\'breakUrls\':true}) %>       </h3>     </header>     <div class="activity">       <span class="muted">         <% if (update.get(\'like\')) { %>           <%= $t(\'home-likes\', update.get(\'like\')) %>           <% if (update.get(\'comment\')) { %>             &middot;            <% } %>         <% } %>         <% if (update.get(\'comment\')) { %>           <%= $t(\'home-comments\', update.get(\'comment\')) %>         <% } %>       </span>       <% if (update.get(\'footer\')) { %>         <span class="source muted<% if (update.isFromTwitter()) { %> via-twitter<% } %>">           <%= update.get(\'footer\').via %>         </span>       <% } %>     </div>   </div> </div>   ');
TLI.templates.nus.share_item = _.template('<div class="media-rich">   <div class="media-img" style="background: -webkit-gradient(linear, left top, left bottom, color-stop(0%,rgba(0,0,0,0.8)), color-stop(50%,rgba(0,0,0,0.3)), color-stop(100%,rgba(0,0,0,0.8))), url(<%= update.get(\'picture\') %>);">     <%= $h.summarize(update.get("text"), 60) %>   </div>    <div class="body">     <% if (update.get("footer") && update.get("footer").pictures) { %>       <div class="running-list running-connections">         <% for (var i=0,len=update.get("footer").pictures.slice(0,4).length;i<len;i++) { %>           <img height="35" width="35" class="photo" src="<%= update.get("footer").pictures[i] %>">         <% } %>         <div class="muted">           <%= update.get("footer").text %>         </div>       </div>     <% } %>     <% if (update.get("like") || update.get("comment") || update.get("footer")) { %>       <div class="activity">                  <% if (update.get("like")) { %>           <span class="muted likes"><%= update.get("like") %></span>         <% } %>                  <% if (update.get("comment")) { %>           <% if (update.get("like")) { %>             &middot;           <% } %>           <span class="muted comments"><%= update.get("comment") %></span>         <% } %>                  <% if (update.get(\'footer\').via) { %>           <% if (update.get("like") || update.get("comment")) { %>             &middot;           <% } %>           <span class="source muted<% if (update.isFromTwitter()) { %> via-twitter<% } %>">           </span>         <% } %>                </div>     <% } %>   </div> <div>');
TLI.templates.nus.rollup_item = _.template('<div class="rollup">   <header>     <h3 class="media-heading">       <% if (update.get(\'title\')) { %>         <%= update.get(\'title\') %>       <% } else { %>         <%= update.get(\'header\') %>       <% } %>     </h3>   </header>   <div class="body muted">     <div class="running-connections">       <% if (update.get(\'links\')) { %>         <% _.each(update.get("links"), function(p,i) { %>           <% if (i < 5 ) { %>             <% if (!p.picture || p.picture == \'DEFAULT.jpg\') { %>               <img height="35" width="35" class="photo" src="images/nophoto.png">              <% } else { %>               <img height="35" width="35" class="photo" src="<%= p.picture %>">             <% } %>           <% } %>         <% }); %>         <div class="ellipsis">           <% _.each(update.get("links"), function(p,i) { %>             <% if (i < 5 ) { %>               <%= p.text %><% if (i < 4 && i < (update.get("links").length-1)) { %>,<% } %>             <% } %>           <% }); %>                </div>       <% } else if (update.get("pictures")) { %>                  <% _.each(update.get("pictures"), function(p, i) { %>           <% if (i < 5 ) { %>             <img height="35" width="35" class="photo" src="<%= p %>">           <% } %>         <% }); %>                  <% if (update.get("footer")) { %>           <div class="ellipsis">             <%= update.get("footer").text %>               </div>         <% } %>                <% } %>      </div>   </div> </div> ');
TLI.templates.nus.rich_item = _.template('<div class="media rich">   <div class="media-img">    <% if (update.get(\'picture\')) { %>      <img class="img" width="50" height="50" src="<%= update.get(\'picture\') %>" alt"<%= update.get(\'header\') %>">    <% } else { %>      <img class="img ghost-photo" height="50" width="50" alt="<%= $t(\'ghost-image-alt\') %>">    <% } %>    </div>   <div class="body">     <div>       <%= update.get(\'header\') %>       <span class="timestamp">          &middot; <%= $h.formatTime(update.get(\'timestamp\')) %>       </span>     </div>     <header>       <h3 class="media-heading title">         <%=update.get(\'text\') %>       </h3>     </header>     <% if (update.get(\'footer\')) { %>       <div class="media activity">         <% if (!update.get(\'footer\').picture || update.get(\'footer\').picture == \'DEFAULT.jpg\') { %>         <% } else { %>           <img class="img" width="25" height="25" src="<%= update.get(\'footer\').picture %>">         <% } %>         <% if (update.get(\'footer\').text) { %>           <div class="body muted<% if (update.isFromTwitter()) { %> via-twitter<% } %><% if (update.isHot()) { %> hot<% } %>">             <%= update.get(\'footer\').text %>             <% if (update.get(\'footer\').via) { %>               &middot; <%= update.get(\'footer\').via %>             <% } %>           </div>         <% } else if (update.get(\'footer\').text1) { %>           <div class="body">             <p><%= update.get(\'footer\').text1 %></p>             <p class="muted<% if (update.isFromTwitter()) { %> via-twitter<% } %>">               <%= update.get(\'footer\').text2 %>               <% if (update.get(\'footer\').via) { %>                 &middot; <%= update.get(\'footer\').via %>               <% } %>             </p>           </div>         <% } %>       </div>     <% } %>   </div> </div>');
TLI.templates.nusdetail = {};
TLI.templates.nusdetail.share_detail = _.template('<div class="body">   <cite>     <%-        $h.parseTweet(         $h.autoLink(           $h.convertEscapeCodes(             $h.escape(               $h.breakWords(update.get("text", { suppressEscaping: true }))))))  %>   </cite>   <% if (update.get("links") && update.get("links")[0]) { %>     <div class="media">       <% if (!update.get("links")[0].picture || update.get("links")[0].picture == \'DEFAULT.jpg\') { %>       <% } else { %>         <img class="img" width="25" height="25" src="<%= update.get("links")[0].picture %>">       <% } %>       <div class="body">         <cite class="media-heading">           <a target=\'_blank\' href="<%= update.get("links")[0].url %>"><%= update.get("links")[0].text1 %></a>         </cite>         <div class="source">           <%= update.get("links")[0].text2 %>         </div>       </div>     </div>   <% } %>   <% if (update.isFromTwitter()) { %>      <div class="muted activity">       <span class="via-twitter">         <a target=\'_blank\' href=\'https://twitter.com/intent/user?screen_name=<%= update.get("source").accountHandle %>\'>           <%= update.get("source").accountHandle %>         </a>         <% if (update.get(\'footer\')) { %>           <% if (update.get(\'footer\').via) { %>             <%= update.get(\'footer\').via %>           <% } %>         <% } %>       </span>       &middot;       <a target=\'_blank\' href=\'https://twitter.com/#!/<%= update.get("source").accountHandle %>/status/<%= update.get("source").shareId %>\'>         <%= $h.formatTime(update.get("timestamp"), "ldt") %>       </a>     </div>   <% } else { %>     <div class="muted activity">       <%= $h.formatTime(update.get("timestamp"), "ldt") %>       <% if (update.get(\'footer\')) { %>         <% if (update.get(\'footer\').via) { %>           &middot; <%= update.get(\'footer\').via %>         <% } %>       <% } %>     </div>   <% } %> </div> ');
TLI.templates.nusdetail.rollup_detail = _.template('<aside class="nus-detail-leading">   <h2>     <% if (update.get("text")) { %>       <%= update.get("text") %>     <% } else if (update.get("header")) { %>       <%= update.get("header") %>     <% } else { %>       <%= update.get("title") %>     <% } %>   </h2>   <% if (update.get("text2")) { %>     <div class="muted">       <%= update.get("text2") %>     </div>   <% } %>      <% if (update.isFromTwitter()) { %>      <div class="muted activity">       <span class="via-twitter">         <a target=\'_blank\' href=\'https://twitter.com/intent/user?screen_name=<%= update.get("source").accountHandle %>\'>           <%= update.get("source").accountHandle %>         </a>         <% if (update.get(\'footer\')) { %>           <% if (update.get(\'footer\').via) { %>             <%= update.get(\'footer\').via %>           <% } %>         <% } %>       </span>       &middot;       <a target=\'_blank\' href=\'https://twitter.com/#!/<%= update.get("source").accountHandle %>/status/<%= update.get("source").shareId %>\'>         <%= $h.formatTime(update.get("timestamp"), "ldt") %>       </a>     </div>   <% } else { %>     <div class="muted activity">       <%= $h.formatTime(update.get("timestamp"), "ldt") %>       <% if (update.get(\'footer\')) { %>         <% if (update.get(\'footer\').via) { %>           &middot; <%= update.get(\'footer\').via %>         <% } %>       <% } %>     </div>   <% } %> </aside> <ul class="scrolling-list rollup-list"> </ul> ');
TLI.templates.nusdetail.nusdetail = _.template('<div id="nusdetail-list-scroller" class="nusdetail page-wrapper">   <div class="scroller">     <section class="meta poster-profile has-chevron inverted">       <div class="media">         <div class="media-img">           <img class="profile_photo img" src="<%= person.pictureUrl() %>" alt="<%= person.fullName() %>" width="50" height="50">         </div>         <div class="body">           <header>             <h2>               <%= person.fullName(10) %>               <% if (person.get(\'distance\') === 100) { %>                 <span class="degree primary"><%= $t(\'group\') %></span>               <% } else if (person.get(\'distance\') > 0) { %>                 <% var distance = person.distanceWithOrdinal(); %>                 <span class="degree primary"><%= distance[0] %><sup><%= distance[1] %></sup></span>               <% } %>             </h2>             <div class="title">               <%= person.get(\'headline\') %>             </div>           </header>           <div>             <% if (person.get(\'location\')) { %>               <span class="location"><%= person.get(\'location\') %></span> &middot;             <% } %>           </div>         </div>       </div>     </section>          <section class="nus-detail-section"></section>          <% if ((update.get("likes") && update.get("likes").total > 0) || (update.get("comments") && update.get("comments").total > 0)) { %>       <section>         <header class="section-heading">           <h2><%= $t(\'nus-comments\') %></h2>         </header>         <ul class="scrolling-list comments-likes-list">           <% if (update.get("likes").total > 0) { %>             <li class="likes has-chevron factoid">               <div class="like icon">               </div>               <header>                 <h3 class="media-heading"><%= $t(\'nus-peoplelike\', update.get("likes").total) %></h3>               </header>             </li>           <% } %>           <% if (update.get("comments").total > update.get("comments").count) { %>             <li class="comments has-chevron factoid">               <div class="comment icon">               </div>               <header>                 <h3 class="media-heading"><%= $t(\'nus-peoplecomment\', (update.get("comments").total-update.get("comments").count)) %></h3>               </header>             </li>           <% } %>         </ul>       </section>     <% } %>   </div> </div>  <% if (update.isFromTwitter() && update.get("source")) { %>   <footer>     <ul class="controls triple">       <a href="http://twitter.com/intent/tweet?in_reply_to=<%= update.get("source").shareId %>">         <li class="twitter-intent reply">           <%= $t(\'twitter-intent\') %>         </li>       </a>       <a href="http://twitter.com/intent/retweet?tweet_id=<%= update.get("source").shareId %>">         <li class="twitter-retweet retweet">           <%= $t(\'twitter-retweet\') %>         </li>       </a>       <a href="http://twitter.com/intent/favorite?tweet_id=<%= update.get("source").shareId %>">         <li class="twitter-favorite favorite">           <%= $t(\'twitter-favorite\') %>         </li>       </a>     </ul>   </footer> <% } else if (update.get("likes") || update.get("comments")) { %>   <% if (update.isGroupType()) { %>     <footer>       <ul class="controls double">         <li class="like-toggle <%= update.get("isLiked") ? \'unlike\' : \'like\' %>">           <%= $t(update.get("isLiked") ? \'unlike\' : \'like\') %>         </li>         <li class="comment">           <%= $t(\'comment\') %>         </li>       </ul>     </footer>   <% } else { %>     <footer>       <ul class="controls triple">         <li class="like-toggle <%= update.hasUserLiked(TLI.User.getCurrentUser().id) ? \'unlike\' : \'like\' %>">           <%= $t(update.hasUserLiked(TLI.User.getCurrentUser().id) ? \'unlike\' : \'like\') %>         </li>         <li class="comment">           <%= $t(\'comment\') %>         </li>         <li class="forward reshare <%= (update.isShareable() || update.canSendToConnections() || update.canReplyPrivately()) ? \'\' : \'disabled\' %>">           <%= $t(\'send\') %>         </li>       </ul>     </footer>   <% } %> <% } %>');
TLI.templates.nusdetail.group_detail = _.template('<div class="body group-detail">   <div class="title <%= update.get("text2") ? \'title-border\' : \'\' %>">     <cite>       <%- $h.convertEscapeCodes(             $h.escape(update.get("text1"))) %>     </cite>     <div class="muted timestamp">       <%= $h.formatTime(update.get("timestamp"), "ldt") %>     </div>   </div>   <% if (update.get("text2")) { %>     <div class="detail">       <%- $h.autoLink(         $h.convertEscapeCodes(           $h.escape(             $h.breakWords(update.get("text2", {suppressEscaping:true, breakUrls:true}))))) %>     </div>   <% } %>   <% if (link) { %>     <div class="media">       <% if (!link.picture || link.picture == \'DEFAULT.jpg\') { %>       <% } else { %>         <img class="img" width="25" height="25" src="<%= link.picture %>">       <% } %>       <div class="body">         <% if (link.url) { %>         <cite class="media-heading">           <a target=\'_blank\' href="<%= link.url %>"><%= link.text1 %></a>         </cite>         <% } %>         <div class="source">           <%- $h.convertEscapeCodes(             $h.escape(               $h.breakWords(link.text2,{suppressEscaping:true,breakUrls:true}))) %>         </div>       </div>     </div>   <% } %>    </div> ');
TLI.templates.profiles = {};
TLI.templates.profiles.simple_section = _.template('<header class="section-heading">    <h3 class="media-heading"><%= detail.get("section") %></h3> </header> <article> <% _.each(detail.get("values"), function(v) { %>   <%- $h.parseLineBreaks($h.breakWords($h.escape(v.text), {suppressEscaping:true,breakUrls:true})) %> <% }); %> </article> ');
TLI.templates.profiles.recent_activity = _.template('<div id="ractivity-list-scroller" class="nus page-wrapper">   <div class="scroller">     <section>       <ul class="nus-list scrolling-list">       </ul>     </section>     <div id="loadMoreLink" class="loadmore">       <div class="spinner standalone inverted"></div>       <span><%= $t(\'loadMore_default\') %></span>     </div>   </div> </div> ');
TLI.templates.profiles.profile_header = _.template('<div id="profile-view-scroller" class="page-wrapper">   <div class="scroller">     <section class="meta secondary">       <div class="media">         <div class="media-img">           <img class="img profile-photo" src="<%= person.pictureUrl() %>" alt="<%= person.fullName() %>" width="90" height="90">           <% if (person.get(\'distance\') == 0) { %>             <div class="profile-camera"></div>             <div class="profile-update-overlay" style="display:none;"><%= $t(\'loading\') %></div>           <% } %>         </div>         <div class="body">           <header>             <h2 class="name">               <%= person.fullName() %><% if (person.get(\'distance\') > 0) { %>                 <% if (person.get(\'distance\') === 100) { %>                   <span class="degree"><%= $t(\'group\') %></span>                 <% } else if (person.get(\'distance\') > 0) { %>                   <% var distance = person.distanceWithOrdinal(); %>                   <span class="degree"><%= distance[0] %><sup><%= distance[1] %></sup></span>                 <% } %>               <% } %>               <% if (person.phoneticName()) { %>               <div class="muted phonetic">                 <%= person.phoneticName() %>               </div>               <% } %>             </h2>             <div class="title">               <%= person.get(\'headline\') %>             </div>             <div class="muted">               <% if (person.get(\'location\')) { %>                 <span class="location"><%= person.get(\'location\') %></span> &middot;               <% } %>               <% if (person.get(\'industry\')) { %>                 <span class="industry"><%= person.get(\'industry\') %></span>               <% } %>             </div>           </header>         </div>       </div>       <% if ( (typeof(person.get(\'distance\')) !== \'undefined\') && (typeof(disabled) === \'undefined\' || !disabled) ) { %>         <% if (person.get(\'distance\') == 0) { %>           <% if ($native.isNative()) { %>             <ul class="controls double">               <li class="text postupdate">                 <%= $t(\'postupdate\') %>               </li>               <li class="text edit">                 <%= $t(\'profileedit\') %>               </li>             </ul>           <% } else { %>             <ul class="controls single">               <li class="text postupdate">                 <%= $t(\'postupdate\') %>               </li>             </ul>           <% } %>         <% } else if (person.get(\'distance\') == 1) { %>         <ul class="controls double">           <li class="<%= person.primaryPhoneNumber() ? \'call phone secondary\' : \'call secondary disabled\' %>">             <%= $t(\'call\') %>           </li>           <li class="email secondary">             <%= $t(\'email\') %>           </li>         </ul>         <% } else { %>         <ul class="controls single">           <% if (person.get(\'pendingInvitation\') && $native.isNative()) { %>             <li class="text accept-invitation"> \t\t\t\t      <%= $t(\'accept-invitation\') %>             </li>           <% } else { %>             <li class="text connect"> \t\t\t        <%= $t(\'connect\') %> \t\t\t      </li> \t\t      <% } %>         </ul>         <% } %>       <% } %>     </section>     <div class="spinner standalone">       <%= $native.isNative() ? $t(\'loading\') : \'\' %>     </div>   \t<section class="profile-data"></section>\t     <div class="profile-details"></div>     <div class="footer-container"></div>   </div> </div>  ');
TLI.templates.profiles.profile_details = _.template('<ul class="scrolling-list profile-facts factoid-container">   <% if (profile.get("wvmp") && profile.get("wvmp").total > 0 && $native.isNative()) { %>     <li class="user-wvmp has-chevron profile-fact factoid">       <div class="wvmp icon"></div>       <header>         <h2 class="profile-fact-title"><%= profile.get("wvmp").title %></h2>       </header>       <div class="body muted profile-fact-text">         <div class="running-list running-connections">           <% _.each(profile.get("wvmp").values, function(v, i) { %>             <% if (i < 5) { %>               <img height="35" width="35" class="photo" src="<%= v.picture %>">             <% } %>           <% }); %>           <div class="ellipsis">             <% _.each(profile.get("wvmp").values, function(v,i) { %>               <% if (i < 5) { %>                 <% if (v.formattedName) { %>                   <%= v.formattedName %><% if (i < (profile.get("wvmp").total-1) && (i < 4)) { %>,<% } %>                 <% } else { %>                   <%= v.firstName %> <%= v.lastName %><% if (i < (profile.get("wvmp").total-1) && (i < 4)) { %>,<% } %>                 <% } %>               <% } %>             <% }); %>           </div>         </div>       </div>     </li>   <% } %>   <% if (profile.get("recents")) { %>     <li class="recent-activity has-chevron profile-fact factoid">       <div class="recents icon"></div>       <header>         <h2 class="profile-fact-title"><%= profile.get("recents").title %></h2>       </header>       <div class="body muted profile-fact-text">         <%= profile.get("recents").text %>       </div>     </li>   <% } %>   <% if (profile.get("incommon") && profile.get("incommon").total > 0) { %>     <li class="user-incommon has-chevron profile-fact factoid">       <div class="incommon icon"></div>       <header>         <h2 class="profile-fact-title"><%= profile.get("incommon").title %></h2>       </header>       <div class="body muted profile-fact-text">         <div class="running-list running-connections">           <% _.each(profile.get("incommon").values, function(v, i) { %>             <% if (i < 5) { %>               <img height="35" width="35" class="photo" src="<%= v.picture %>">             <% } %>           <% }); %>           <div class="ellipsis">             <% _.each(profile.get("incommon").values, function(v,i) { %>               <% if (i < 5) { %>                 <% if (v.formattedName) { %>                   <%= v.formattedName %><% if (i < (profile.get("incommon").total-1) && (i < 4)) { %>,<% } %>                 <% } else { %>                   <%= v.firstName %> <%= v.lastName %><% if (i < (profile.get("incommon").total-1) && (i < 4)) { %>,<% } %>                 <% } %>               <% } %>             <% }); %>           </div>         </div>       </div>     </li>   <% } %>   <% if (profile.get("connections")) { %>     <li class="profile-fact factoid<%= profile.get("connections").total > 0 ? \' user-connections has-chevron\' : \'\'%>">       <div class="conn icon"></div>       <header>         <h2 class="profile-fact-title"><%= profile.get("connections").title %></h2>       </header>       <div class="body muted profile-fact-text">         <%= profile.get("connections").text %>         <aside class="list-item-secondary-value degree secondary">           <% if (profile.person.get(\'distance\') === 0) { %>             <%= profile.get("connections").total %>           <% } else { %>             <%= profile.get("connections").sidebar %>           <% } %>         </aside>       </div>     </li>   <% } %>   <% if (profile.get("groups") && profile.person.get("distance") === 0) { %>     <li class="user-groups has-chevron profile-fact factoid">       <div class="groups icon"></div>       <header>         <h2 class="profile-fact-title"><%= profile.get("groups").title %></h2>       </header>       <div class="body muted profile-fact-text">         <%= profile.get("groups").text %>         <aside class="list-item-secondary-value degree secondary">           <% if (profile.person.get(\'distance\') === 0) { %>             <%= profile.get("groups").total %>           <% } else { %>             <%= profile.get("groups").sidebar %>           <% } %>         </aside>       </div>     </li>   <% } %> </ul> ');
TLI.templates.profiles.list_section = _.template('<header class="section-heading <%= $h.generateClassName(detail.get("section")) %>">   <h3><%= detail.get("section") %></h3> </header> <ul class="scrolling-list">   <% _.each(detail.get("values"), function(v, i) { %>     <li class="<%= v.links ? \'has-chevron\' : \'\'%>" data-index="<%= i %>">       <header>         <h2><%= $h.breakWords(v.title, {suppressEscaping:true,breakUrls:true}) %></h2>       </header>       <div class="body muted">         <%= $h.breakWords(v.text1, {suppressEscaping:true,breakUrls:true}) %>       </div>     </li>   <% }); %> </ul> ');
TLI.templates.profiles.experience_section = _.template('  <header class="section-heading <%= $h.generateClassName(detail.get("section")) %>">     <h3><%= detail.get("section") %></h3>   </header>   <article>     <% _.each(detail.get("values"), function(v) { %>         <header class="separator">         <h4 class="title"><%= v.title %></h4>         <h5 class="subtitle"><%= v.subtitle %></h5>         <div class="when muted">           <%= v.when %>         </div>       </header>       <p class="description">         <%- $h.parseLineBreaks(               $h.breakWords($h.escape(v.text), {suppressEscaping:true, breakUrls:true})) %>       </p>     <% }); %>   </article> ');
TLI.templates.profiles.blurb_section = _.template('<header class="section-heading <%= $h.generateClassName(detail.get("section")) %>">   <h3><%= detail.get("section") %></h3> </header> <article> <% _.each(detail.get("values"), function(v,i) { %>   <blockquote class="blurb">     "<%= $h.breakWords(v.text, {suppressEscaping:true,breakUrls:true}) %>"   </blockquote>   <p class="blurb-footer" data-index="<%= i %>">     <%= $h.breakWords(v.footer1, {suppressEscaping:true,breakUrls:true}) %>   </p> <% }); %> </article> ');
TLI.templates.pymk = {};
TLI.templates.pymk.pymk_rollup = _.template('<div class="pymk-rollup"> </div> ');
TLI.templates.pymk.pymk_list = _.template('<ul id="pymk_list" class="scroller"></ul> ');
TLI.templates.pymk.pymk_item = _.template('<div class="list_item_container">   <div class="pymk_profile_summary">     <img class="pymk_profile_photo" src="<%= person.pictureUrl() %>" alt="<%= person.fullName() %>" />     <div class="pymk_meta">       <div class="name"><%= person.fullName() %></div>       <div class="headline"><%= person.get(\'headline\') %></div>       <div class="time"></div>     </div>   </div>    <div class="remove_button list_button"></div>   <div class="invite_button list_button">     <img class="button_spinner" src="images/button_spinner_grey.gif" style="display: none" />   </div> </div> ');
TLI.templates.pymk.pymk = _.template('<div id="pymk-list-scroller" class="page-wrapper">   <div class="scroller">     <section>       <ul class="pymk-list scrolling-list">       </ul>     </section>     <div id="loadMoreLink" class="loadmore">        <div class="spinner standalone inverted"></div>       <span><%= $t(\'loadMore_default\') %></span>     </div>   </div> </div> ');
TLI.templates.search = {};
TLI.templates.search.search = _.template('<div id="search-list-scroller" class="search-scroll-wrap">   <div class="scroller">     <header class="section-heading search-connections-header">       <h2><%= $t(\'search-connections\') %></h2>     </header>     <ul class="search-connections-list scrolling-list"></ul>     <header class="section-heading search-network-header">       <h2><%= $t(\'search-network\') %></h2>     </header>     <ul class="search-network-list scrolling-list">     </ul>     <div class="searching-msg">       <%= $t(\'search-searching\') %>     </div>     <div class="no-results-msg">       <%= $t(\'search-noresults\') %>     </div>   </div> </div> ');
TLI.templates.share = {};
TLI.templates.share.share_update = _.template('<div class="media">   <div class="media-img">     <% if (update.get(\'picture\')) { %>      <img class="img" width="50" height="50" src="<%= update.get(\'picture\') %>" alt"<%= update.get(\'text1\') %>">    <% } else { %>      <img class="img ghost-photo" height="50" width="50" alt="<%= $t(\'ghost-image-alt\') %>" style="visibility: hidden;">     <% } %>   </div>    <div class="body">     <header>       <h3 class="media-heading"><%= update.get(\'text1\')%></h3>       <div class="title"><%= update.get(\'text2\') %></div>     </header>   </div> </div> ');
TLI.templates.share.share_status = _.template('<ul class="scrolling-list">   <% if(twitter){ %>   <li class="has-chevron">     <div class="media post-to-twitter">       <header>         <h2><%= $t(\'share-twit\') %></h2>       </header>       <span class="list-item-secondary-value value"><%= twitter %></span>     </div>   </li>   <% } %>   <li class="has-chevron">     <div class="media visible-to">       <header>         <h2><%= $t(\'share-visibleTo\') %></h2>       </header>       <span class="list-item-secondary-value value"><%= visibility %></span>     </div>   </li> </ul> ');
TLI.templates.share.share = _.template('<div class="share-header">   <div class="share-title header-text"><%= header %></div>   <div class="controls">     <div class="cancel text secondary"><%= $t(\'cancel\') %></div>     <div class="send text"><%= action %></div>   </div> </div>  <% if (subheader) { %>   <header class="section-heading">     <h2><%= subheader %></h2>   </header> <% } %>  <section id="share-top"> </section>  <div id="share-body">   <textarea placeholder="<%= share_msg %>"></textarea>   <% if( showCounter ) {%>   <span class="share-count">0</span>   <% } %> </div>  <div id="share-options"></div> ');
TLI.templates.shared = {};
TLI.templates.shared.recommend_item = _.template('<div class="media invitation">   <div class="body">     <header>       <h3 class="media-heading"><%= recommend.get("name") %></h3>     </header>   </div>   <div class="controls">     <li class="follow text">       <%= $t(\'follow\') %>     </li>   </div> </div> ');
TLI.templates.shared.pymk_rollup = _.template("<% _.each(models, function(value, i, list) {   var url;   if (value.get('picture')) {     url = value.get('picture');   } else {     url = 'images/nophoto.png';   }   %>     <div class=\"rollup-photos\" style=\"background: -webkit-gradient(linear, left top, left bottom, color-stop(0%,rgba(0,0,0,0.8)), color-stop(50%,rgba(0,0,0,0.3)), color-stop(100%,rgba(0,0,0,0.8))), url(<%= url %>);\">       <%= value.fullName() %>     </div> <% }); %>");
TLI.templates.shared.people_result = _.template('<div class="media">   <div class="media-img">     <% if (result.get("picture")) { %>       <img width="50" height="50" src="<%= result.get(\'picture\') %>" alt="<%= result.getHeadline() %>">     <% } else { %>       <img class="img ghost-photo" height="50" width="50" alt="<%= $t(\'ghost-image-alt\') %>">     <% } %>   </div>   <div class="body">     <header>       <% if (!hideDistance) { %>         <% if (result.get("distance") && result.get("distance") > 0 && result.get("distance") < 100) { %>           <span class="degree secondary"><%= result.distanceWithOrdinal()[0] %><sup><%= result.distanceWithOrdinal()[1] %></sup></span>         <% } %>       <% } %>       <h3 class="media-heading">         <%= result.getHeadline() %>       </h3>       <% if (result.fullName()) { %>         <div class="title">           <%= result.get(\'headline\') %>         </div>       <% } %>     </header>   </div>   <% if( !hideInvitationOptions ) { %>     <ul class="actions controls">       <li class="add-connection primary accept">         <%= $t(\'accept\') %>       </li>       <li class="ignore decline">         <%= $t(\'decline\') %>       </li>     </ul>   <% } %> </div> ');
TLI.templates.shared.page = _.template('<div id="<%= path %>" data-role="page" class="page">   <div id="<%= path %>-content" data-role="content" class="content">   </div> </div> ');
TLI.templates.shared.notification = _.template('<div id="notification-bar" class="notification <%= type %>">   <span class="icon"></span>   <span class="message"><%= message %></span> </div>');
TLI.templates.shared.news_rollup = _.template("<% _.each(models, function(value, i, list) {   var url;   if (value.get('picture')) {     url = value.get('picture');   } else {     url = 'images/nophoto.png';   }   %>     <div class=\"rollup-photos\" style=\"background: -webkit-gradient(linear, left top, left bottom, color-stop(0%,rgba(0,0,0,0.8)), color-stop(50%,rgba(0,0,0,0.3)), color-stop(100%,rgba(0,0,0,0.8))), url(<%= url %>);\">       <%= $h.summarize(value.get('text'), 25) %>     </div> <% }); %>");
TLI.templates.shared.navigation = _.template('<header id="li-header">   <canvas id="linkedin-logo" height="40" width="30">     <h1 class="site-title">LinkedIn</h1>   </canvas>   <div class="title-wrapper top-level">     <div class="header-title"><div class="header-text"><%= pageInfo.title %></div></div>     <div class="people-search">       <%= $t(\'people-search\') %>     </div>   </div>   <div class="primary-region">     <% if (pageInfo.primaryAction) { %>     <div class="<%= pageInfo.primaryAction.className %>">       <%- pageInfo.primaryAction.template() %>     </div>     <% } %>   </div> </header> <nav class="closed" id="li-nav">   <div class="menu-wrapper">     <ul class="nav-list">       <li class="nav-list-item updates" data-hash="#home">         <%= $t(\'updates\') %>       </li>       <li class="nav-list-item you" data-hash="#you">         <%= $t(\'you\') %>       </li>       <li class="nav-list-item inbox" data-hash="#inbox">         <div class="badge"></div>         <%= $t(\'inbox\') %>       </li>       <li class="nav-list-item network" data-hash="#network">        <%= $t(\'network\') %>       </li>     </ul>   </div>   <canvas id="drawer-handle-open"></canvas> </nav> ');
TLI.templates.shared.nav_share = _.template('<div class="compose-entry share"></div> ');
TLI.templates.shared.nav_search = _.template('<div class="search-entry search"></div> ');
TLI.templates.shared.nav_compose = _.template('<div class="compose-entry compose"></div> ');
TLI.templates.shared.modal_overlay = _.template('<div id="modal_backdrop"></div>  <div id="modal_overlay" class=\'ui-loader\'> <% if (showSpinner) { %>   <div style="" class="spinner inverted small"></div>   <%= message %> <% } else { %>   <%= message %> <% } %> </div> ');
TLI.templates.shared.invite_item = _.template('<div class="media invitation">   <div class="media-img">     <img class="img photo" src="<%= invite.from.pictureUrl() %>" width="50" height="50" alt="<%= invite.from.fullName() %>">   </div>   <div class="body">     <header>       <h3 class="media-heading"><%= invite.from.fullName() %></h3>       <div class="title">         <%= invite.from.get("headline") %>       </div>       <div class="timestamp">         <%= $h.formatTime(invite.get(\'timestamp\')) %>       </div>     </header>   </div>   <div class="actions controls">     <li class="accept">       <%= $t(\'accept\') %>     </li>     <li class="ignore decline">       <%= $t(\'decline\') %>     </li>   </div> </div> ');
TLI.templates.shared.groups_rollup = _.template("<% _.each(models, function(value, i, list) {   var url;   if (value.get('picture')) {     url = value.get('picture');   } else {     url = 'images/nophoto.png';   }   %>      <div class=\"rollup-photos\" style=\"background: -webkit-gradient(linear, left top, left bottom, color-stop(0%,rgba(0,0,0,0.8)), color-stop(50%,rgba(0,0,0,0.3)), color-stop(100%,rgba(0,0,0,0.8))), url(<%= url %>);\">       <%= value.get('text1') %>     </div> <% }); %>");
TLI.templates.shared.group_result = _.template('<div class="media">   <\!--   <div class="media-img">     <% if (result.get("picture")) { %>       <img class="img" width="50" height="50" src="<%= result.get(\'picture\') %>" alt="<%= result.get(\'name\') %>">     <% } else { %>      <img class="img ghost-photo" height="50" width="50" alt="<%= $t(\'ghost-image-alt\') %>">     <% } %>   </div>   --\>   <div class="body">     <header>       <h3 class="media-heading">         <%= result.get(\'name\') %>       </h3>       <\!--       <div class="title">         <%= result.get(\'text\') %>       </div>       --\>     </header>   </div> </div> ');
TLI.templates.shared.footer = _.template('<ul>   <li><a href="#" class="signout-button"><%= $t(\'sign-out\') %></a></li>   <li><a href="http://www.linkedin.com" class="full-site-button"><%= $t(\'full-site\') %></a></li> </ul>  <ul>   <li>&copy;2011</li>   <li><a href="http://www.linkedin.com/static?key=user_agreement&trk=hb_ft_userag"><%= $t(\'terms\') %></a></li>   <li><a href="http://www.linkedin.com/static?key=privacy_policy&trk=hb_ft_priv"><%= $t(\'privacy\') %></a></li>   <li><a href="mailto:<%= $config.feedbackEmail %>?subject=<%= $config.feedbackSubject %>" class="feedback-button"><%= $t(\'feedback\') %></a></li> </ul> ');
TLI.templates.shared.following_item = _.template('<div class="media following-item">   <div class="body">     <header>       <h3 class="media-heading"><%= following.get("name") %></h3>     </header>   </div> </div> ');
TLI.templates.shared.error = _.template("<div class='error-msg ui-loader'>   <h1><%= message %></h1> </div> ");
TLI.templates.shared.comment_item = _.template('<div class="media">   <div class="media-img">     <img class="img profile-photo" src="<%= person.pictureUrl() %>" alt="<%= person.fullName() %>" width="50" height="50">   </div>   <div class="body">     <header>       <div class="title">         <%= person.fullName() %>         <span class="muted">          &middot; <%= $h.formatTime(comment.get("timestamp")) %>         </span>       </div>       <h3 class="media-heading">         <%- $h.convertEscapeCodes(           $h.escape(             $h.breakWords(comment.get("comment"),{suppressEscaping:true,breakUrls:true}))) %>       </h3>     </header>   </div> </div> ');
TLI.templates.shared.action_sheet = _.template('<div id="action_backdrop"> </div> <div id="action_overlay">   <div class="sheet controls">   </div> </div> ');
TLI.templates.style_guide = {};
TLI.templates.style_guide.style = _.template('<\!-- Notes regarding HTML:  * Don\'t use closing /> * 2-space indentation * Use <section> where necessary * Use HTML5 inputs where possible (i.e. url, email, etc)  --\> <section>   <header class="section-heading">     <h2>Headings</h2>   </header>   <p>     <h1>Heading 1</h1>     <h2>Heading 2</h2>     <h3>Heading 3</h3>     <h4>Heading 4</h4>     <h5>Heading 5</h5>     <h6>Heading 6</h6>   </p> </section> <section>   <header class="section-heading">     <h2>Text elements</h2>   </header>   <p>     Paragraph of text - Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi vulputate,     <a href="www.siteyounevervisit.net">link</a> turpis a adipiscing lobortis, augue orci gravida nunc, sit amet pellentesque est risus vel lacus.   </p>   <p>     Aliquam mattis dui nibh, et ultrices neque. Nunc laoreet ligula ut tellus elementum     <a href="www.linkedin.com">link</a>. Ut nibh mauris, eleifend eu commodo vel, tempus.   </p>   <ul>     <li>       List item     </li>     <li>       List item     </li>     <li>       List item     </li>     <ul>       <li>         List subitem       </li>       <li>         List subitem       </li>       <li>         List subitem       </li>     </ul>   </ul> </section> <section>   <header class="section-heading">     <h2>Forms</h2>   </header>   <\!-- Note: <label> tags should wrap thier associated <input> where possible --\>   <form>     <fieldset>       <legend>         Fieldset legend       </legend>       <label>         Text field         <input type="text" placeholder="Text field">       </label>       <label class="required">         Required text field         <input type="text" placeholder="Text field" required>       </label>       <label>         Password field         <input type="password">       </label>       <label>         Search field         <input type="search" placeholder="Search for connections...">       </label>       <label>         Email field         <input type="email" placeholder="jweiner@linkedin.com">       </label>       <label>         URL field         <input type="url" placeholder="http://www.linkedin.com">       </label>       <label>         URL field with prefix         <div class="prefix http">           http://           <input type="url" placeholder="www.linkedin.com">         </div>       </label>       <label>         URL field         <input type="url" placeholder="http://www.linkedin.com">       </label>       <label>         Number field         <input type="number" min="0" max="10" value="5">         <input type="number" min="0" max="10000" value="5000" step="1000">       </label>       <label>         Range field         <input type="range" min="0" max="10" value="5">       </label>       <label>         Textfield         <textarea placeholder="Text area">         </textarea>       </label>     </fieldset>     <fieldset>       <legend>         Submit buttons       </legend>       <div class="controls">         <input type="submit" value="Primary" class="text">         <input type="submit" value="Secondary" class="text secondary">         <input type="submit" value="Call-to-action" class="text call-to-action">       </div>     </fieldset>   </form> </section> <section>   <header class="section-heading">     <h2>Media object</h2>   </header>   <ul class="scrolling-list">     <style rel="stylesheet">            </style>     <li class="has-chevron blue">       <div class="media">         <div class="media-img">           <img class="img" height="50" width="50" src="http://o.onionstatic.com/images/amvo/americanvoicesface/4/asian_man_jpg_75x75_crop_q85.jpg">         </div>         <div class="body">           <header>             <h3 class="media-heading">Steve Mackey</h3>             <div class="title">               <div class="tag-line">                 Shank Taper               </div>             </div>           </header>         </div>       </div>     </li>     <li>       <div class="media right has-chevron">         <div class="img ghost-photo">         </div>         <div class="body">           <header>             <h3 class="media-heading">             John Adams             <span class="degree"> 2nd</span>             </h3>             <div class="title">               Vice President of the United States             </div>           </header>           <div>             <span class="location">Boston area</span> &middot;             <span>Politics &amp; Government</span>           </div>         </div>       </div>     </li>     <li class="all-link">       <div class="has-chevron">         See all invitations       </div>     </li>   </ul> </section> <header class="section-heading">   <h2>Meta data</h2> </header> <section class="meta">   <div class="media has-chevron inverted">     <div class="img ghost-photo">     </div>     <div class="body">       <header>         <h3 class="media-heading">         Benjamin Franklin         <span class="degree inverse"> Group</span>         </h3>         <div class="title">           Inventor, Diplomat, Postmaster         </div>       </header>       <div>         <span class="location">Phildelphia area</span> &middot;         <span>Politics &amp; Government</span>       </div>     </div>   </div> </section> <section class="media">   <div class="notch">     <span></span>   </div>   <header>     <h3 class="media-heading">     <cite>       LinkedIn\'s NYSE Debut Scheduled For Thursday     </cite>     </h3>     <h4>     <a href="http://on.wsj.com/lVsi7y">http://on.wsj.com/lVsi7y</a>     </h4>   </header>   <div class="media">     <div class="img">       &nbsp;     </div>     <div class="body">       <h5>       <cite>         <a href="#">Why LinkedIn Hackdays Work</a>       </h5>       <div class="source">         blog.linkedin.com       </div>     </div>   </div> </section> <section>   <header class="section-heading">     <h2>Buttons</h2>   </header>   <div class="controls">     <div class="accept">       Accept     </div>   </div>   <div class="controls">     <div class="text">       Cancel     </div>   </div>   <ul class="controls quadruple">     <li class="share">       Share     </li>     <li class="retweet">       Retweet     </li>     <li class="reply">       Reply     </li>     <li class="like">       Like     </li>   </ul>   <ul class="controls triple">     <li class="forward">       Forward     </li>     <li class="favorite">       Favorite     </li>     <li class="call">       Call     </li>   </ul>   <ul class="controls double">     <li class="email">       Email     </li>     <li class="ignore">       Ignore     </li>   </ul>   <ul class="controls single">     <li class="text">       Primary     </li>     <li class="text secondary">       Secondary     </li>     <li class="text call-to-action">       Call to action     </li>   </ul> </section> <section>   <header class="section-heading">     <h2>Lists</h2>   </header>   <ul class="scrolling-list">     <li>       <div class="media">         <div class="img ghost-photo">         </div>         <div class="actions controls">           <li class="add-connection">             Add connection           </li>           <li class="ignore">             Ignore           </li>         </div>         <div class="body">           <header>             <h3 class="media-heading">Thomas Jefferson</h3>             <div class="title">               President of the United States             </div>           </header>         </div>       </div>     </li>     <li>       <div class="media">         <div class="img ghost-photo">         </div>         <div class="actions controls">           <li class="add-connection">             Add connection           </li>           <li class="ignore">             Ignore           </li>         </div>         <div class="body">           <header>             <h3 class="media-heading">Albert Einstein</h3>             <div class="title">               Physics, Mathematics             </div>           </header>         </div>       </div>     </li>     <li>       <div class="media">         <div class="img ghost-photo">         </div>         <div class="actions controls">           <li class="add-connection">             Add connection           </li>           <li class="ignore">             Ignore           </li>         </div>         <div class="body">           <header>             <h3 class="media-heading">Martin Luther King</h3>             <div class="title">               Activist and Minister             </div>           </header>         </div>       </div>     </li>     <li>       <div class="has-chevron">         <header>           <h2>Recent Activity</h2>         </header>         <div class="body muted">           7 updates since Feb 21, 2011         </div>       </div>     </li>     <li>       <div class="has-chevron">         <header>           <h2>Recent Activity</h2>         </header>         <div class="body muted">           7 updates since Feb 21, 2011           <aside class="list-item-secondary-value">             500+           </aside>         </div>       </div>     </li>     <li class="inverted">       <div class="has-chevron">         <header>           <h2>Recent Activity</h2>         </header>         <div class="body muted">           7 updates since Feb 21, 2011         </div>       </div>     </li>     <li>       <div class="has-chevron">         <header>           <h2>In common</h2>         </header>         <div class="body muted">           <div class="running-list">             <img height="35" width="35" class="photo" src="/images/ghost_photo_small.png" />             <img height="35" width="35" class="photo" />             <img height="35" width="35" class="photo" />             <img height="35" width="35" class="photo" />             <img height="35" width="35" class="photo" />             <div>               Adam Nash, Chad Whitney, Peter Shih, Mic...             </div>           </div>         </div>       </div>     </li>   </ul> </section>');
TLI.templates.you = {};
TLI.templates.you.settings = _.template('<\!-- no settings for now <div class="message-nav left controls">   <div class="settings button text">     <%= $t(\'settings\') %>   </div> </div> --\> ');
TLI.templates.review = {};
TLI.templates.review.review = _.template('<div id="review-scroller" class="page-wrapper">   <div class="scroller">     <section>       <header class="section-heading">         <h2><%= $t(\'title-wir\') %></h2>       </header>              <ul class="scrolling-list action-list <%= (messages > 0 && invitations > 0) ? \'double\' : \'single\' %>">         <% if (messages) { %>           <li class="factoid grey has-chevron user-messages">                    <div class="mail icon"></div>                    <header>                        <h2 class="profile-fact-title">                 <span class="count"><%= messages %></span> <%= $t(\'wir-messages\', messages) %>               </h2>                    </header>           </li>         <% } %>         <% if (invitations > 0) { %>           <li class="factoid grey has-chevron user-invites">                    <div class="invite icon"></div>                    <header>                        <h2 class="profile-fact-title">                 <span class="count"><%= invitations %></span> <%= $t(\'wir-invites\', messages) %>               </h2>                    </header>           </li>         <% } %>       </ul>              <% if (wvmp && wvmp.models.length) { %>         <div class="rollup-board-container">           <section class="rollup-board pymk-rollup has-chevron white">             <header>               <h2 class="rollup-heading"><%= wvmp.title %></h2>             </header>             <div class="running-list-container">               <div class="running-list running-connections">                 <% _.each(wvmp.models.slice(0,6), function(value, i, list) { %>                   <div class="rollup-photos" style="background: -webkit-gradient(linear, left top, left bottom, color-stop(0%,rgba(0,0,0,0.8)), color-stop(50%,rgba(0,0,0,0.3)), color-stop(100%,rgba(0,0,0,0.8))), url(<%= value.pictureUrl() %>);">                     <span><%= value.fullName() %></span>                   </div>                 <% }); %>               </div>             </div>           </section>         </div>       <% } %>              <\!--       <div class="scrolling-rollup-board-container">         <section class="scrolling-rollup-board groups-rollup">                      <header>             <h2 class="scrolling-rollup-heading">               <%= wvmp.title %>               <aside class="degree secondary"><%= wvmp.total %></aside>             </h2>           </header>                      <div id="review-wvmp-scroll"class="scrolling-running-list-container">             <div class="scrolling-running-list running-groups">               <% _.each(wvmp.models.slice(0,3), function(value, i, list) { %>                 <div class="scrolling-rollup-photos" data-index="<%= i %>" style="background: -webkit-gradient(linear, left top, left bottom, color-stop(0%,rgba(0,0,0,0.8)), color-stop(50%,rgba(0,0,0,0.3)), color-stop(100%,rgba(0,0,0,0.8))), url(<%= value.pictureUrl() %>);">                   <span><%= value.fullName() %></span>                 </div>               <% }); %>             </div>           </div>         </section>       </div>       --\>              <ul class="review-updates flat scrolling-list"></ul>       <ul class="review-shares flat scrolling-list"></ul>            </section>   </div> </div>');
TLI.BaseView = Backbone.View.extend({
    initialize: function() {
        throw "This class must be subclassed!";
    },
    goBack: function() {
        history.back()
    },
    showLoader: function() {
        $h.showLoader()
    },
    hideLoader: function() {
        $h.hideLoader()
    },
    showModalOverlay: function(a) {
        $h.showModalOverlay(a)
    },
    removeModalOverlay: function() {
        $h.removeModalOverlay()
    },
    showErrorMessage: function(a) {
        $h.showErrorMessage(a)
    },
    handleError: function(a, b, c) {
        c = c ? c: TLI.Notifications.NOTIFICATION_TIME;
        if (b.status) a && $notif.showError(a, c);
        else $notif.showError($t("network-unavailable"), c)
    },
    pageLoaded: function(a) {
        this.pageInteractive();
        this.pageFullyRendered(a)
    },
    pageInteractive: function() {
        if (this.scroller) {
            this.rememberScrollPos();
            this.removeScroll()
        }
        this.addScroll();
        this.hideLoader()
    },
    pageFullyRendered: function(a) {
        if (this.pageOptions && this.pageOptions.footer && !this.$(".site-footer").length && !$native.isNative()) {
            var b = new TLI.FooterView;
            this.$(".footer-container").append(b.render().el)
        }
        a && a.call(self);
        $ui.body.trigger("li:pageLoaded", this, window.location.hash);
        $h.hideBrowser();
        this.$(".spinner").hide();
        this.refreshScroll();
        $native.isNative() && $native.sendPageLoaded(window.location.hash)
    },
    hideKeyboard: function() {
        $h.hideAllKeyboards(this)
    },
    addScroll: function() {
        if ($scrollEnabled && this.scrollSelector && this.scrollSelector !== "" && !this.scroller) {
            this.scroller = new iScroll(this.scrollSelector, {
                onScrollStart: function() {
                    $h.hideBrowser()
                }
            });
            this.scroller.scrollTo(0, this.getPreviousScrollPos(), 0)
        }
    },
    refreshScroll: function() {
        if ($scrollEnabled && this.scroller) {
            var a = this;
            $h.defer(function() {
                a.scroller.refresh()
            })
        }
    },
    removeScroll: function() {
        if (this.scroller) {
            this.scroller.destroy();
            this.scroller = null
        }
    },
    rememberScrollPos: function() {
        if (!this.scrollCache) this.scrollCache = {};
        this.scrollCache[window.location.hash] = this.scroller.y
    },
    getPreviousScrollPos: function() {
        if (!this.scrollCache) this.scrollCache = {};
        var a = this.scrollCache[window.location.hash];
        return a ? a: 0
    },
    tearDown: function() {},
    handleLink: function(a) {
        var b = a.type;
        if (b === "web" || b === "twitter") $h.goToLink(a.url);
        else if (b === "address") $h.launchMap(a.address);
        else if (b === "phone") $h.startCall(a.number);
        else if (b === "person") {
            b = $mcache.generateKey("person", a.id);
            $mcache.set(b, a);
            $native.isNative() ? $native.sendMessage({
                action: "profile",
                params: a
            }) : $h.go("#profile", a.id, a.authToken)
        }
    }
});
TLI.CollectionView = TLI.BaseView.extend({
    pageOptions: {
        showCategory: true,
        size: 20
    },
    events: {
        "tap #loadMoreLink": "loadMore"
    },
    render: function(a) {
        $(this.pageOptions.collectionSelector).html("");
        if (a) {
            collectionPage = this.collection;
            this.injectNodes($(this.pageOptions.collectionSelector), collectionPage);
            $(this.el).find("div.loadmore").remove();
            this.lastPageRendered()
        } else {
            this.nextPage();
            $(this.el).find("div.loadmore").css("visibility", "visible")
        }
    },
    injectNodes: function(a, b) {
        if (b) for (var c = b.group(), d = null, f = null, e = null, j = 0, n = c.length; j < n; j++) {
            d = c[j];
            this.pageOptions.showCategory && d.group && !this.isGroupRendered(d.group) && a.append("<li class='section-heading'><h2>" + d.group + "</h2></li>");
            e = document.createDocumentFragment();
            for (var r = 0, w = d.groupItems.length; r < w; r++)(f = this.getCollectionNode(d.groupItems[r])) && e.appendChild(f);
            a && a.append(e)
        }
    },
    isGroupRendered: function(a) {
        var b = $(this.pageOptions.collectionSelector).children("li.section-heading"),
        c = false;
        _.each(b,
        function(d) {
            if ($(d).children("h2").html() == a) c = true
        });
        return c
    },
    nextPage: function(a) {
        this.showSpinner();
        this.getNodeCollection().nextPage({
            count: a || this.pageOptions.size,
            callback: _.bind(this.nextPageCallback, this)
        })
    },
    nextPageCallback: function(a) {
        this.hideSpinner();
        var b = a.page;
        a = a.more;
        this.injectNodes($(this.pageOptions.collectionSelector), b);
        this.pageRendered(a)
    },
    getCollectionNode: function() {
        throw "getCollectionNode needs to be implemented by all its subclasses";
    },
    getNodeCollection: function() {
        throw "getNodeCollection needs to be implemented by all its subclasses";
    },
    lastPageRendered: function() {},
    pageRendered: function(a) {
        if (!a) {
            $(this.el).find("div.loadmore").hide();
            this.lastPageRendered()
        }
        this.refreshScroll()
    },
    showSpinner: function() {
        var a = $(".loadmore");
        a.attr("id", "");
        a.children("span").hide();
        a.find(".spinner").show()
    },
    hideSpinner: function() {
        var a = $(".loadmore");
        a.attr("id", "loadMoreLink");
        a.find(".spinner").hide();
        a.children("span").show()
    },
    loadMore: function() {
        this.nextPage()
    }
});
TLI.CollectionView.Events = {
    UPDATE: "ev:pageUpdated"
};
_.extend(TLI.CollectionView, Backbone.Events);
TLI.InvitationsView = TLI.CollectionView.extend({
    template: TLI.templates.invitations.invitations,
    scrollSelector: "invitations-list-scroller",
    pageOptions: _.defaults({
        collectionSelector: "#invitations .invitations-list"
    },
    TLI.CollectionView.prototype.pageOptions),
    initialize: function() {
        _.bindAll(this, "render");
        $(this.el).html(this.template({
            invitations: this.collection
        }));
        $h.setPageContent("#invitations-content", $(this.el))
    },
    render: function() {
        TLI.CollectionView.prototype.render.apply(this);
        this.pageLoaded();
        this.collection.bind("remove", _.bind(function(a) {
            this.remove(a.id)
        },
        this));
        return this
    },
    getCollectionNode: function(a) {
        return (new TLI.InviteListItemView({
            model: a
        })).render().el
    },
    getNodeCollection: function() {
        return this.collection
    },
    remove: function(a) {
        var b = $("#invite-item-" + a),
        c = this;
        b.addClass("removing");
        setTimeout(function() {
            b.remove();
            c.addNext()
        },
        600);
        this.refreshScroll()
    },
    addNext: function() {
        this.nextPage(1)
    }
},
{
    hasRendered: function() {
        return !! $("#invitations-content").html().replace(/\s/g, "").length
    }
});
TLI.LoginView = TLI.BaseView.extend({
    tagName: "section",
    className: "login_view",
    template: TLI.templates.home.login,
    events: {},
    initialize: function() {},
    render: function() {
        $(this.el).html(this.template(this.model));
        $h.setPageContent("#login-content", $(this.el));
        var a = this;
        document.getElementById("login_form").onsubmit = function() {
            a.login();
            return false
        };
        this.pageLoaded();
        return this
    },
    login: function() {
        var a = this;
        this.hideKeyboard();
        var b = $("#username").val(),
        c = $("#password").val();
        this.showLoader();
        TLI.User.logout();
        var d = new TLI.User({
            username: b,
            password: c
        });
        d.authenticate({
            success: function() {
                TLI.User.setCurrentUser(d);
                a.hideLoader();
                $h.isPathStored() ? $h.goStoredPath() : $h.go("#home")
            },
            error: function(f) {
                a.hideLoader();
                $notif.showError(f || "Login failed.")
            }
        });
        return false
    }
},
{
    hasRendered: function() {
        return !! $("#login_form").length
    }
});
TLI.HomeView = TLI.CollectionView.extend({
    template: TLI.templates.home.home,
    templateNews: TLI.templates.shared.news_rollup,
    tagName: "div",
    events: _.extend({
        "tap .news-rollup": "viewNews",
        "tap .you-profile": "goToYou"
    },
    TLI.CollectionView.prototype.events),
    pageOptions: _.defaults({
        collectionSelector: "#home .nus-list",
        footer: true
    },
    TLI.CollectionView.prototype.pageOptions),
    scrollSelector: "nus-list-scroller",
    initialize: function() {
        var a = this;
        _.bindAll(this, "render");
        this.collection.bind("refresh",
        function() {
            a.collection.resetCursor();
            a.$("div.loadmore").show();
            a.render()
        });
        var b = TLI.User.getCurrentUser();
        $(this.el).html(this.template({
            header: $t("home-allupdates"),
            user: b
        }));
        $h.setPageContent("#home-content", $(this.el));
        this.pageInteractive()
    },
    goToYou: function() {
        $h.go("you")
    },
    render: function() {
        var a = this;
        this.collection.models.length === 0 ? this.$(".screen-empty").css("display", "block") : TLI.CollectionView.prototype.render.apply(this);
        this.$(".spinner").hide();
        $h.defer(function() {
            a.refreshScroll()
        });
        this.pageFullyRendered();
        return this
    },
    getNodeCollection: function() {
        return this.collection
    },
    getCollectionNode: function(a) {
        return (new(this.getViewClass(a))({
            model: a,
            id: a.id
        })).render().el
    },
    update: function(a) {
        var b = this.getViewClass(a);
        b = $((new b({
            model: a,
            id: a.id
        })).render().el);
        if (a.replace) {
            a = $(document.getElementById(a.id));
            a.length !== 0 && a.replaceWith(b)
        } else {
            var c = null;
            if (a.addAfter >= 0)(c = $(document.getElementById(this.collection.models[a.addAfter].id))) && c.after(b);
            else if (a.addAfter < 0)(c = $(document.getElementById(this.collection.models[1].id))) && c.before(b)
        }
        this.refreshScroll()
    },
    renderNews: function() {
        this.$(".news-rollup .running-list").html(this.templateNews({
            models: this.news.models.slice(0, 6)
        }));
        this.pageFullyRendered()
    },
    hideNews: function() {
        $(".news-rollup").hide()
    },
    bindNewsRemove: function() {
        this.news.bind("remove", _.bind(this.renderNews, this))
    },
    viewNews: function() {
        $h.go("#news/top")
    },
    getViewClass: function(a) {
        switch (a.get("tType")) {
        case a.SIMPLE_LIST:
        case a.TWITTER_LIST:
            a = TLI.SimpleNusItemView;
            break;
        case a.SHARE_LIST:
        case a.RICH_LIST:
        case a.TWITTER_SHARE_LIST:
        case a.TWITTER_NEWS:
            a = TLI.RichNusItemView;
            break;
        case a.RICH_SHARE:
            a = TLI.ShareNusItemView;
            break;
        case a.ROLLUP_LIST:
        case a.ROLLUP_CONN_LIST:
            a = TLI.RollupNusItemView;
            break;
        default:
            a = TLI.SimpleNusItemView
        }
        return a
    }
});
TLI.RecentActivityView = TLI.HomeView.extend({
    template: TLI.templates.profiles.recent_activity,
    scrollSelector: "ractivity-list-scroller",
    pageOptions: _.defaults({
        collectionSelector: "#updates .nus-list"
    },
    TLI.HomeView.prototype.pageOptions),
    initialize: function() {
        _.bindAll(this, "render");
        $(this.el).html(this.template({
            header: $t("home-allupdates")
        }));
        $h.setPageContent("#updates-content", $(this.el))
    },
    render: function() {
        TLI.HomeView.prototype.render.apply(this);
        this.pageLoaded()
    }
});
TLI.NavigationView = TLI.BaseView.extend({
    template: TLI.templates.shared.navigation,
    events: {
        "tap .compose-entry": "compose",
        "tap .updates, .you, .network, .inbox": "toggle"
    },
    initialize: function() {
        _.bindAll(this, "render")
    },
    updateUnread: function() {
        var a = this.messageCount + this.invCount;
        a ? this.$(".badge").html(a) : this.$(".badge").css("display", "none")
    },
    prefetchInbox: _.once(function() {
        var a = this;
        TLI.Inbox.get({
            success: function(b) {
                a.messageCount = b.get("messages").unread;
                a.invCount = b.get("invitations").total;
                a.updateUnread();
                b.get("messages").bind("change:unread", _.bind(function(c) {
                    this.messageCount = c;
                    this.updateUnread()
                },
                a));
                b.get("invitations").bind("change:total", _.bind(function(c) {
                    this.invCount = c;
                    this.updateUnread()
                },
                a))
            },
            error: function() {}
        })
    }),
    render: function() {
        $(this.el).html(this.template({
            pageInfo: this.model
        }));
        this.prefetchInbox();
        var a = this;
        $(this.el).find(".people-search").unbind($TAP);
        $(this.el).find(".people-search").bind($TAP,
        function(b) {
            b.preventDefault();
            b.stopPropagation();
            a.search(b)
        });
        $(this.el).find("#linkedin-logo").unbind($TAP);
        $(this.el).find("#linkedin-logo").bind($TAP,
        function(b) {
            b.preventDefault();
            b.stopPropagation();
            a.toggleNav(b)
        });
        return this.el
    },
    search: function() {
        $n.showSearch();
        $h.go("#search")
    },
    compose: function() {
        if (this.composeAction) typeof this.composeAction === "function" ? this.composeAction.call(this) : $h.go(this.composeAction)
    },
    home: function() {
        $h.go("#home")
    },
    toggleNav: function(a) {
        a = a.target;
        var b = $n.showDrawer;
        if (a = a.nodeName != "NAV" ? $(this.el).find("nav") : $(a)) a.hasClass("open") ? b(false) : b(true)
    },
    toggle: function(a) {
        var b = a.target;
        b = b.nodeName != "LI" ? $(b).parent() : $(b);
        b.addClass("active");
        setTimeout(function() {
            b.removeClass("active")
        },
        200);
        $n.showDrawer(false);
        $h.go(b.attr("data-hash"))
    }
},
{
    Categories: {
        UPDATES: "updates",
        YOU: "you",
        NETWORK: "network",
        INBOX: "inbox"
    }
});
TLI.PeopleResultView = TLI.BaseView.extend({
    template: TLI.templates.shared.people_result,
    tagName: "li",
    className: "people-item has-chevron",
    events: {
        tap: "activate",
        click: "slowActivate"
    },
    initialize: function(a) {
        _.bindAll(this, "render");
        if (a.activate) this.activateCallback = a.activate;
        if (a.slowActivate) this.slowActivateCallback = a.slowActivate
    },
    render: function(a) {
        a = a || {};
        _.defaults(a, {
            hideDistance: false,
            hideInvitationOptions: true
        });
        $(this.el).html(this.template({
            result: this.model,
            hideDistance: a.hideDistance,
            hideInvitationOptions: a.hideInvitationOptions
        }));
        $(this.el).attr("id", this.model.get("id"));
        return this.el
    },
    activate: function(a) {
        this.highlight(function() {
            if (this.activateCallback) this.activateCallback.call(this, this.model, a);
            else {
                this.model.saveToMemory();
                $h.go("#profile", this.model.get("id"), this.model.get("authToken"))
            }
        });
        $h.hideSearchKeyboard()
    },
    slowActivate: function(a) {
        this.slowActivateCallback && this.slowActivateCallback.call(this, this.model, a)
    },
    highlight: function(a) {
        var b = this;
        $(this.el).addClass("active");
        setTimeout(function() {
            $(b.el).removeClass("active");
            a.apply(b)
        },
        100)
    }
});
TLI.PymkPeopleListView = TLI.PeopleResultView.extend({
    events: {
        "tap .accept": "connect",
        "tap .decline": "discard",
        "tap .media-img": "activate",
        "tap div.body": "activate"
    },
    render: function() {
        return TLI.PeopleResultView.prototype.render.call(this, {
            hideDistance: true,
            hideInvitationOptions: false
        })
    },
    connect: function() {
        var a = this;
        $notif.showInfo($t("inv-sending"));
        a.model.connect({
            success: function() {
                a.remove();
                $notif.showInfo($t("inv-sent"))
            }
        })
    },
    discard: function() {
        var a = this;
        $notif.showInfo($t("pymk-ignore"));
        this.model.discard({
            success: function() {
                a.remove()
            },
            error: function(b, c) {
                a.handleError($t("pymk-ignore-err"), c)
            }
        })
    },
    remove: function() {
        this.options.parentCollection.remove(this.model)
    }
});
TLI.GroupResultView = TLI.BaseView.extend({
    template: TLI.templates.shared.group_result,
    tagName: "li",
    className: "group-item",
    events: {
        tap: "activate"
    },
    initialize: function() {
        _.bindAll(this, "render")
    },
    render: function() {
        $(this.el).html(this.template({
            result: this.model
        }));
        $(this.el).attr("id", this.model.get("id"));
        return this.el
    },
    activate: function() {
        this.highlight(function() {
            $h.go("#group", this.model.get("id"))
        })
    },
    highlight: function(a) {
        var b = this;
        $(this.el).addClass("active");
        setTimeout(function() {
            $(b.el).removeClass("active");
            a.apply(b)
        },
        100)
    }
});
TLI.ListItemView = TLI.BaseView.extend({
    initialize: function() {
        throw "This class must be subclassed!";
    },
    activateUrl: function() {},
    activate: function() {
        var a = this.activateUrl();
        if (a) window.location.href = a
    },
    remove: function() {
        var a = this.$(".list_item_container"),
        b = $(this.el);
        b.height(a.height());
        a.fadeOut(function() {
            b.slideUp()
        })
    }
});
TLI.InviteListItemView = TLI.BaseView.extend({
    tagName: "li",
    className: "invite-item has-controls",
    template: TLI.templates.shared.invite_item,
    events: {
        tap: "message",
        "tap .accept": "invite",
        "tap .decline": "remove"
    },
    initialize: function() {
        _.bindAll(this, "render");
        this.model.bind("change", this.render);
        this.model.view = this
    },
    render: function() {
        this.el.id = "invite-item-" + this.model.id;
        $(this.el).html(this.template({
            invite: this.model
        }));
        return this
    },
    invite: function() {
        $notif.showInfo($t("inv-accepting"));
        this.model.accept({
            success: function() {
                $notif.showInfo($t("inv-accepted"))
            }
        })
    },
    remove: function() {
        this.model.decline()
    },
    message: function(a) {
        a = $(a.target);
        a.hasClass("accept") || a.hasClass("decline") || this.highlight(function() {
            var b = $mcache.generateKey("message", this.model.id);
            $mcache.set(b, this.model.toJSON());
            $h.go("#message", this.model.get("id"), TLI.Message.Types.INVITATION)
        })
    },
    highlight: function(a) {
        var b = this;
        $(this.el).addClass("active");
        setTimeout(function() {
            $(b.el).removeClass("active");
            a.apply(b)
        },
        100)
    }
});
TLI.CommentItemView = TLI.BaseView.extend({
    tagName: "li",
    className: "comments-item",
    template: TLI.templates.shared.comment_item,
    events: {
        tap: "activate"
    },
    initialize: function() {
        _.bindAll(this, "render")
    },
    render: function() {
        $(this.el).html(this.template({
            comment: this.model,
            person: new TLI.Person(this.model.get("person"))
        }));
        return this
    },
    activate: function(a) {
        if (this.activateCallback) this.activateCallback.call(this, this.model, a);
        else {
            a = $mcache.generateKey("person", this.model.get("person").id);
            $mcache.set(a, (new TLI.Person(this.model.get("person"))).toJSON());
            $h.go("#profile", this.model.get("person").id, this.model.get("person").authToken)
        }
    }
});
TLI.NusItemView = TLI.ListItemView.extend({
    initialize: function() {},
    render: function() {
        var a = {
            update: this.model
        };
        if (this.model.get("person")) a.person = new TLI.Person(this.model.get("person"));
        $(this.el).html(this.template(a));
        return this
    },
    activate: function() {
        this.highlight(function() {
            if (this.model.get("tType") === this.model.ROLLUP_CONN_LIST) $h.go("#updates/detail", this.model.get("id"));
            else {
                if (!$native.isNative()) {
                    var a = $mcache.generateKey("nusdetail", this.model.id),
                    b = this.model.toJSON();
                    $mcache.set(a, b);
                    $storage.set(a, b)
                }
                $h.go("#nusdetail", this.model.get("id"))
            }
        })
    },
    highlight: function(a) {
        var b = this;
        $(this.el).addClass("active");
        setTimeout(function() {
            $(b.el).removeClass("active");
            a.apply(b)
        },
        100)
    }
});
TLI.SimpleNusItemView = TLI.NusItemView.extend({
    tagName: "li",
    className: "nus-item simple",
    template: TLI.templates.nus.simple_item,
    events: {
        tap: "activate"
    },
    initialize: function() {
        _.bindAll(this, "render");
        this.model.bind("change", this.render);
        this.model.view = this
    }
});
TLI.RichNusItemView = TLI.NusItemView.extend({
    tagName: "li",
    className: "nus-item rich",
    template: TLI.templates.nus.rich_item,
    events: {
        tap: "activate"
    },
    initialize: function() {
        _.bindAll(this, "render");
        this.model.bind("change", this.render);
        this.model.view = this
    },
    activateUrl: function() {
        return ""
    }
});
TLI.RollupNusItemView = TLI.NusItemView.extend({
    tagName: "li",
    className: "nus-item has-chevron",
    template: TLI.templates.nus.rollup_item,
    events: {
        tap: "activate"
    },
    initialize: function() {
        _.bindAll(this, "render");
        this.model.bind("change", this.render);
        this.model.view = this
    },
    activateUrl: function() {
        return ""
    }
});
TLI.ShareNusItemView = TLI.NusItemView.extend({
    tagName: "li",
    className: "nus-item share",
    template: TLI.templates.nus.share_item,
    events: {
        tap: "activate"
    },
    initialize: function() {
        _.bindAll(this, "render");
        this.model.bind("change", this.render);
        this.model.view = this
    }
});
TLI.PymkView = TLI.CollectionView.extend({
    template: TLI.templates.pymk.pymk,
    events: _.extend({},
    TLI.CollectionView.prototype.events),
    pageOptions: _.defaults({
        collectionSelector: "#pymk-content .pymk-list"
    },
    TLI.CollectionView.prototype.pageOptions),
    scrollSelector: "pymk-list-scroller",
    initialize: function() {
        var a = this;
        _.bindAll(this, "render");
        a.collection.bind("remove",
        function() {
            a.collection.resetCursor();
            a.collection.total = a.collection.models.length;
            a.render()
        })
    },
    render: function() {
        this.el = $("#pymk-content");
        $h.setPageContent(this.el, this.template());
        TLI.CollectionView.prototype.render.apply(this);
        this.delegateEvents();
        this.pageLoaded();
        return this
    },
    getCollectionNode: function(a) {
        return (new TLI.PymkPeopleListView({
            model: a,
            parentCollection: this.collection
        })).render()
    },
    getNodeCollection: function() {
        return this.collection
    }
});
TLI.ProfileView = TLI.CollectionView.extend({
    tagName: "div",
    className: "profile",
    headerTemplate: TLI.templates.profiles.profile_header,
    detailsTemplate: TLI.templates.profiles.profile_details,
    events: {
        "tap .controls .phone": "sendCall",
        "tap .controls .email": "sendEmail",
        "tap .controls .connect": "connect",
        "tap .controls .accept-invitation": "acceptInvitation",
        "tap .controls .postupdate": "postupdate",
        "tap .controls .edit": "edit",
        "tap .recent-activity": "showRecentActivity",
        "tap .user-connections": "viewConn",
        "tap .user-incommon": "viewIncommon",
        "tap .profile-photo": "viewProfileImage",
        "tap .profile-camera": "editProfileImage",
        "tap .user-groups": "viewGroups",
        "tap .user-wvmp": "viewWvmp"
    },
    pageOptions: {
        collectionSelector: ".profile-details",
        footer: true
    },
    scrollSelector: "profile-view-scroller",
    initialize: function() {
        _.bindAll(this, "renderHeader", "viewConn", "showRecentActivity", "renderProfile");
        this.model.bind("change:person", this.renderHeader);
        this.model.bind("change", this.renderProfile);
        this.model.bind("error", this.handleError)
    },
    renderHeader: function() {
        $(this.el).html(this.headerTemplate({
            person: this.model.get("person")
        }));
        $h.setPageContent("#profile-content", $(this.el));
        this.pageInteractive()
    },
    renderDetails: function() {
        this.collection = this.model.get("detail");
        TLI.CollectionView.prototype.render.apply(this, [true])
    },
    renderProfileData: function() {
        this.$(".profile-data").html(this.detailsTemplate({
            profile: this.model
        }))
    },
    renderProfile: function() {
        this.renderProfileData();
        this.renderDetails();
        if (this.options.section) {
            var a = $("." + this.options.section);
            a.length && window.scrollTo(0, a.position().top)
        }
        if (this.model.get("detail")) {
            this.$(".spinner").hide();
            this.pageFullyRendered()
        }
    },
    handleError: function(a, b) {
        var c = JSON.parse(b.responseText)["public"];
        c ? $notif.showError(c) : $notif.showError($t("error"))
    },
    getNodeCollection: function() {
        return this.get("detail")
    },
    getCollectionNode: function(a) {
        var b = null;
        switch (a.get("values")[0].tType) {
        case a.SIMPLE:
            b = TLI.SimpleSectionView;
            break;
        case a.LIST:
            b = TLI.ListSectionView;
            break;
        case a.EXPERIENCE:
            b = TLI.ExperienceSectionView;
            break;
        case a.BLURB:
            b = TLI.BlurbSectionView;
            break;
        default:
            b = TLI.SimpleSectionView
        }
        return (new b({
            model: a
        })).render().el
    },
    remove: function() {
        $(this.el).remove()
    },
    sendCall: function() {
        var a = this.model.person.primaryPhoneNumber();
        a && $h.startCall(a)
    },
    sendEmail: function() {
        $mcache.set(this.model.get("person").id, this.model.get("person"));
        $h.go("#compose", "to", this.model.get("person").id)
    },
    connect: function() {
        $native.isNative() ? $native.sendMessage({
            action: "connect",
            personId: this.model.get("person").id
        }) : this.model.get("person").sendInviteWithoutEmail(this)
    },
    acceptInvitation: function() {
        $native.isNative() && $native.sendMessage({
            action: "acceptInvitation",
            personId: this.model.get("person").id
        })
    },
    activate: function() {
        var a = "/#profile/" + (this.model.id + 1);
        if (a) window.location.href = a
    },
    viewConn: function(a) {
        this.highlight(a,
        function() {
            $h.go("#connections", this.model.get("person").id)
        })
    },
    viewIncommon: function(a) {
        this.highlight(a,
        function() {
            $h.go("#incommon", this.model.get("person").id)
        })
    },
    viewProfileImage: function() {
        $native.isNative() && $native.sendMessage({
            action: "profileImage"
        })
    },
    editProfileImage: function() {
        $native.isNative() && $native.sendMessage({
            action: "editProfileImage"
        })
    },
    viewGroups: function(a) {
        this.highlight(a,
        function() {
            $h.go("#groups")
        })
    },
    viewWvmp: function(a) {
        this.highlight(a,
        function() {
            $h.go("#wvmp")
        })
    },
    postupdate: function() {
        $h.go("#share/status")
    },
    edit: function() {
        $native.isNative() && $native.sendMessage({
            action: "editProfile"
        })
    },
    showRecentActivity: function(a) {
        this.highlight(a,
        function() {
            $h.go("updates", this.model.get("person").id)
        })
    },
    highlight: function(a, b) {
        var c = this,
        d = a.target,
        f = d.nodeName,
        e = $(d),
        j = null;
        if (f === "LI") {
            e.addClass("active");
            setTimeout(function() {
                e.removeClass("active");
                b.apply(c)
            },
            100)
        } else if (j = e.parents("li")) {
            j.addClass("active");
            setTimeout(function() {
                j.removeClass("active");
                b.apply(c)
            },
            100)
        }
    }
},
{
    startPictureUpdate: function() {
        $(".profile-update-overlay").css("display", "inline-block")
    },
    endPictureUpdate: function() {
        $(".profile-update-overlay").css("display", "none")
    }
});
TLI.SectionView = TLI.BaseView.extend({
    initialize: function() {},
    render: function() {
        $(this.el).html(this.template({
            detail: this.model
        }));
        $(this.el).addClass($h.generateClassName(this.model.get("section")));
        return this
    }
});
TLI.SimpleSectionView = TLI.SectionView.extend({
    tagName: "section",
    template: TLI.templates.profiles.simple_section,
    events: {},
    initialize: function() {
        _.bindAll(this, "render");
        this.model.view = this
    }
});
TLI.ListSectionView = TLI.SectionView.extend({
    tagName: "section",
    template: TLI.templates.profiles.list_section,
    events: {
        "tap li": "activate"
    },
    initialize: function() {
        _.bindAll(this, "render");
        this.model.view = this
    },
    activate: function(a) {
        var b = $(a.currentTarget).attr("data-index");
        b = this.model.get("values")[b];
        var c = null;
        this.highlight(a);
        if (b.links) {
            c = b.links[0];
            this.handleLink(c)
        }
    },
    highlight: function(a) {
        a = a.target;
        var b = a.nodeName,
        c = $(a),
        d = null;
        if (b === "LI" && c.hasClass("has-chevron")) {
            c.addClass("active");
            setTimeout(function() {
                c.removeClass("active")
            },
            500)
        } else if ((d = c.parents("li")) && d.hasClass("has-chevron")) {
            d.addClass("active");
            setTimeout(function() {
                d.removeClass("active")
            },
            500)
        }
    }
});
TLI.ExperienceSectionView = TLI.SectionView.extend({
    tagName: "section",
    template: TLI.templates.profiles.experience_section,
    events: {},
    initialize: function() {
        _.bindAll(this, "render");
        this.model.view = this
    }
});
TLI.BlurbSectionView = TLI.SectionView.extend({
    tagName: "section",
    template: TLI.templates.profiles.blurb_section,
    events: {
        "tap .blurb-footer": "activate"
    },
    initialize: function() {
        _.bindAll(this, "render");
        this.model.view = this
    },
    activate: function(a) {
        a = $(a.currentTarget).attr("data-index");
        a = this.model.get("values")[a];
        var b = null;
        if (a.links) {
            b = a.links[0];
            this.handleLink(b)
        }
    }
});
TLI.SearchNetworkResultsView = TLI.CollectionView.extend({
    initialize: function() {
        $(this.el).find("div.loadmore").length === 0 && $(this.el).find("#search-list-scroller .scroller").append('<div id="loadMoreLink" class="loadmore"><div class="spinner standalone inverted"></div><span>' + $t("loadMore_default") + "</span></div>")
    },
    pageOptions: _.defaults({
        collectionSelector: "#search .search-network-list",
        showCategory: false
    },
    TLI.CollectionView.prototype.pageOptions),
    getCollectionNode: function(a) {
        return (new TLI.PeopleResultView({
            model: a
        })).render()
    },
    getNodeCollection: function() {
        return this.collection
    },
    render: function() {
        TLI.CollectionView.prototype.render.apply(this)
    },
    pageRendered: function(a) {
        TLI.CollectionView.prototype.pageRendered.apply(this, [a]);
        this.options.parent.refreshScroll()
    }
});
TLI.SearchView = TLI.BaseView.extend({
    template: TLI.templates.search.search,
    scrollSelector: "search-list-scroller",
    initialize: function() {
        _.bindAll(this, "render", "search", "cancel", "checkEmpty")
    },
    render: function() {
        $(this.el).html(this.template(this.model));
        $h.setPageContent("#search-content", $(this.el));
        this.pageLoaded();
        return this
    },
    styleSearchBox: function() {
        var a = [screen.height, screen.width].sort(),
        b,
        c,
        d,
        f = document.styleSheets[document.styleSheets.length - 1],
        e = f.cssRules.length,
        j = $("#search-cancel .cancel"),
        n = 16,
        r = $("#search-keyword"),
        w = $("#search-form");
        $("#search").css("margin-top", "2px");
        TLI.canvas.add("search", {
            canvasEl: "search-icon",
            insert: "#search-form",
            height: "16px",
            width: n + "px",
            top: "10px",
            left: "8px"
        });
        b = $("#search-cancel").width() + 66;
        n += 16;
        if ($desktop || $os.android) {
            r.attr("type", "text");
            $(document.body).css("overflow", "scroll");
            if ($desktop) b -= 24;
            c = function() {
                d = window.innerWidth - b;
                w.css("width", d + "px");
                $desktop ? r.css("width", d - n - 8 + "px") : r.css("width", d + "px")
            };
            c();
            $(window).bind("resize", c);
            r.get(0).focus()
        } else {
            c = a[0] - b;
            a = a[1] - b;
            f.insertRule(".portrait form.people-search {width: " + c + "px}", e);
            f.insertRule(".landscape form.people-search {width: " + a + "px}", e);
            f.insertRule(".portrait #search-keyword {width: " + (c - n) + "px}", e);
            f.insertRule(".landscape #search-keyword {width: " + (a - n) + "px}", e)
        }
        searchBoxHeight = w.height() - 2 + "px";
        j.css("height", searchBoxHeight).css("line-height", searchBoxHeight)
    },
    pageLoaded: function() {
        $("#search");
        var a, b;
        $n.showSearch();
        a = $("#search-keyword");
        b = $("#search-cancel");
        if (a && b) {
            a.bind("keyup", this.search);
            b.bind("click", this.cancel);
            a.bind("change", this.checkEmpty)
        }
        this.styleSearchBox();
        TLI.BaseView.prototype.pageLoaded.apply(this)
    },
    cancel: function() {
        var a = $("#search-keyword");
        a[0].value = "";
        a[0].blur();
        $h.hideSearchKeyboard();
        this.goBack();
        this.resetState()
    },
    resetState: function() {
        var a = $("#search .search-connections-list"),
        b = $("#search .search-network-list");
        a.html("");
        b.html("");
        this.toggleNoResults(false);
        this.toggleConnList(false);
        this.toggleNetworkList(false);
        this.toggleSearching(false);
        $(this.el).find("#loadMoreLink").remove()
    },
    checkEmpty: function() {
        $("#search-keyword").attr("value") === "" && this.resetState()
    },
    toggleConnList: function(a) {
        var b = $("#search .search-connections-list"),
        c = $("#search .search-connections-header");
        if (a) {
            b.show();
            c.show()
        } else {
            b.hide();
            c.hide()
        }
    },
    toggleNetworkList: function(a) {
        var b = $("#search .search-network-list"),
        c = $("#search .search-network-header");
        if (a) {
            b.show();
            c.show()
        } else {
            b.hide();
            c.hide()
        }
    },
    toggleSearching: function(a) {
        var b = $("#search .searching-msg");
        return a ? b.show() : b.hide()
    },
    toggleNoResults: function(a) {
        var b = $("#search .no-results-msg");
        return a ? b.show() : b.hide()
    },
    processQueue: function() {
        if (this.lastQuery || this.lastQuery === "") {
            this.doSearch(null, this.lastQuery);
            this.lastQuery = null
        } else this.inProgress = false
    },
    doConnSearch: function(a) {
        var b = new TLI.Search,
        c = $("#search .search-connections-list"),
        d = document.createElement("ul"),
        f = this;
        b.search({
            params: {
                keywords: a
            },
            category: "connections",
            success: function() {
                if (this.connections.length === 0) {
                    f.toggleConnList(false);
                    f.noConnections = true
                } else {
                    f.toggleSearching(false);
                    f.toggleConnList(true);
                    for (var e = 0, j = this.connections.length; e < j; e++) d.appendChild((new TLI.PeopleResultView({
                        model: this.connections[e]
                    })).render());
                    c.append($(d).children());
                    f.refreshScroll()
                }
            }
        })
    },
    doNetworkSearch: function(a) {
        var b = new TLI.Search;
        $("#search .search-network-list");
        document.createElement("ul");
        var c = this;
        b.search({
            params: {
                keywords: a,
                filter: "network"
            },
            success: function() {
                if (this.network.length === 0) {
                    c.toggleNetworkList(false);
                    if (c.noConnections) {
                        c.toggleSearching(false);
                        c.toggleNoResults(true)
                    }
                }
                c.toggleSearching(false);
                c.toggleNetworkList(true);
                $(c.el).undelegate("#loadMoreLink");
                var d = TLI.SearchView.getNetworkResultsView();
                if (d) {
                    d.unbind();
                    d.remove()
                }
                d = (new TLI.SearchNetworkResultsView({
                    collection: this.network,
                    el: c.el,
                    parent: c
                })).render();
                TLI.SearchView.setNetworkResultsView(d)
            },
            error: function(d, f) {
                c.handleError($t("unknownErr"), f)
            }
        })
    },
    search: function() {
        var a = this;
        $h.defer(function() {
            a.doSearch()
        })
    },
    doSearch: function() {
        var a = $("#search-keyword").attr("value"),
        b = this;
        this.resetState();
        if ($h.trim(a) !== "") {
            this.toggleSearching(true);
            this.doConnSearch(a);
            this.currentTimeout && clearTimeout(this.currentTimeout);
            this.currentTimeout = setTimeout(function() {
                b.currentTimeout = null;
                $("#search-keyword").attr("value") === "" ? b.resetState() : b.doNetworkSearch(a)
            },
            1500)
        }
    }
},
{
    hasRendered: function() {
        return !! $("#search-content").html().replace(/\s/g, "").length
    },
    getNetworkResultsView: function() {
        return TLI.SearchView.nwView
    },
    setNetworkResultsView: function(a) {
        TLI.SearchView.nwView = a
    }
});
TLI.ConnectionsView = TLI.CollectionView.extend({
    template: TLI.templates.connections.connections,
    scrollSelector: "connections-list-scroller",
    events: _.defaults({},
    TLI.CollectionView.prototype.events),
    pageOptions: _.defaults({
        collectionSelector: "#connections .connections-list",
        footer: true
    },
    TLI.CollectionView.prototype.pageOptions),
    initialize: function() {
        _.bindAll(this, "render", "updateConnectionsCount");
        $(this.el).html(this.template({
            result: this.collection,
            id: this.options.conn_id
        }));
        $h.setPageContent("#connections-content", $(this.el))
    },
    renderConnections: function() {
        this.collection.models.length !== 0 ? TLI.CollectionView.prototype.render.apply(this) : this.$(".screen-empty").css("display", "block");
        this.collection.bind("add", this.update);
        this.collection.bind("add", this.updateConnectionsCount);
        this.updateConnectionsCount();
        this.pageInteractive()
    },
    getCollectionNode: function(a) {
        return (new TLI.PeopleResultView({
            model: a
        })).render({
            hideDistance: true
        })
    },
    getNodeCollection: function() {
        return this.collection
    },
    update: function(a) {
        var b = (new TLI.PeopleResultView({
            model: a
        })).render({
            hideDistance: true
        });
        if (a.replace)(a = document.getElementById(a.get("id"))) && $(a).replaceWith(b);
        else {
            var c = null;
            if (a.addAfter > 0)(c = $(document.getElementById(this.models[a.addAfter].id))) && c.after(b);
            else if (a.addAfter <= 0)(c = $(document.getElementById(this.models[1].id))) && c.before(b)
        }
    },
    updateConnectionsCount: function() {
        $(this.el).find(".connections-count").html(this.collection.length + " total connections")
    },
    lastPageRendered: function() {
        var a = $('<div class="connections-count">' + this.collection.length + " total connections</div>"),
        b = this.$(".footer-container");
        b.parent()[0].insertBefore(a[0], b[0])
    }
});
TLI.ConnectionSearchView = TLI.BaseView.extend({
    tagName: "ul",
    className: "connection-search connections-list",
    template: TLI.templates.shared.people_result,
    events: {},
    initialize: function(a) {
        _.bindAll(this, "render");
        this.model.bind("change", this.render);
        this.model.view = this;
        if (a.activate) this.activateCallback = a.activate
    },
    render: function() {
        var a = this,
        b = $(this.el);
        b.html("");
        _.each(this.model.connections,
        function(c) {
            c = new TLI.PeopleResultView({
                model: c,
                activate: function() {},
                slowActivate: function(d, f) {
                    a.activateCallback(d, f)
                }
            });
            b.append(c.render({
                hideDistance: true
            }))
        });
        return this
    },
    clear: function() {
        var a = $(this.el);
        a.hide();
        a.html("")
    },
    moveUnder: function(a) {
        a = $(a);
        $(this.el).css({
            top: a.position().top + a.height() + "px"
        })
    },
    show: function() {
        $(this.el).show()
    },
    remove: function() {
        $(this.el).remove()
    }
});
TLI.InboxView = TLI.CollectionView.extend({
    template: TLI.templates.inbox.inbox,
    events: _.extend({
        "tap .all-invitations": "viewAllInvites"
    },
    TLI.CollectionView.prototype.events),
    pageOptions: _.defaults({
        collectionSelector: "#inbox-content .inbox-list",
        footer: true
    },
    TLI.CollectionView.prototype.pageOptions),
    scrollSelector: "inbox-list-scroller",
    initialize: function() {
        _.bindAll(this, "render");
        _.bindAll(this, "remove")
    },
    render: function() {
        this.el = $("#inbox-content");
        $h.setPageContent(this.el, this.template({
            inbox: this.model,
            inboxInfo: this.model
        }));
        this.inviteCount = this.model.get("invitations").models.length;
        this.invites = this.model.get("invitations").models;
        this.MAX_INVITES = 2;
        var a = $(this.el).find(".invitations-list"),
        b = document.createElement("ul"),
        c = $(this.el).find(".invitations-header"),
        d = $(this.el).find(".inbox-list"),
        f = $(this.el).find(".inbox-header");
        document.createElement("ul");
        var e = null,
        j = this.MAX_INVITES;
        if (this.inviteCount < this.MAX_INVITES) j = this.inviteCount;
        else this.invitesBackfill = this.invites.slice(this.MAX_INVITES);
        if (this.inviteCount === 0) {
            a.hide();
            c.hide();
            c.removeClass("mailbox-header");
            f.addClass("mailbox-header");
            a.removeClass("mailbox-first-item");
            d.addClass("mailbox-first-item")
        } else {
            a.show();
            c.show();
            c.addClass("mailbox-header");
            f.removeClass("mailbox-header");
            a.addClass("mailbox-first-item");
            d.removeClass("mailbox-first-item")
        }
        for (c = 0; c < j; c++) {
            e = this.invites[c];
            e._position = c;
            e = (new TLI.InviteListItemView({
                model: e,
                parentView: this
            })).render().el;
            e.id = "invite-list-item-" + this.invites[c].get("id");
            b.appendChild(e)
        }
        this.inviteCount > 2 && $(b).append("<li class='all-invitations all-link'><div class='has-chevron'>All Invitations</div></li>");
        a.append($(b).children());
        this.inviteCount <= this.MAX_INVITES ? $(this.el).find(".all-invitations").hide() : $(this.el).find(".all-invitations").show();
        TLI.CollectionView.prototype.render.apply(this);
        this.delegateEvents();
        this.pageLoaded();
        a = this.model.get("messages");
        a.bind("change:unread", _.bind(this.updateMessageCount, this));
        a.bind("remove", _.bind(this.onMessageArchived, this));
        this.model.get("invitations").bind("remove", _.bind(this.onInvitationChanged, this));
        return this
    },
    onMessageArchived: function(a) {
        a.id && this.removeMessage(this.getMessageNodeId(a))
    },
    onMessageDeleted: function(a) {
        a.id && this.removeMessage(this.getMessageNodeId(a))
    },
    onInvitationChanged: function(a) {
        var b = null;
        this.model.get("invitations").total--;
        var c = this.model.get("invitations").total;
        this.model.get("invitations").trigger("change:total", c);
        _.each(this.invitesBackfill,
        function(d, f) {
            if (d.id === a.id) b = f
        });
        b && this.invitesBackfill.splice(b, 1);
        this.remove(a.id);
        this.updateInviteCount(c)
    },
    removeMessage: function(a) {
        this.$("#" + a).remove()
    },
    remove: function(a) {
        var b = this,
        c = $(this.el).find(".invitations-list"),
        d = $(this.el).find(".invitations-header"),
        f = $(this.el).find(".inbox-list"),
        e = $(this.el).find(".inbox-header"),
        j = $(this.el).find(".all-invitations"),
        n = $("#invite-list-item-" + a),
        r = null,
        w = null;
        if (n.length === 0) this.model.get("invitations").models.length <= this.MAX_INVITES && j.hide();
        else {
            if (this.invitesBackfill) r = this.invitesBackfill.pop();
            n.addClass("removing");
            setTimeout(_.bind(function() {
                n.remove();
                var t = this.model.get("invitations").models.length;
                if (t === 0) {
                    c.hide();
                    d.hide();
                    d.removeClass("mailbox-header");
                    e.addClass("mailbox-header");
                    c.removeClass("mailbox-first-item");
                    f.addClass("mailbox-first-item")
                } else t <= b.MAX_INVITES && j.hide();
                if (r) {
                    w = (new TLI.InviteListItemView({
                        model: r,
                        parentView: b
                    })).render().el;
                    w.id = "invite-list-item-" + r.get("id");
                    j.before(w)
                }
            },
            this), 600);
            this.refreshScroll()
        }
    },
    updateInviteCount: function(a) {
        $(this.el).find(".invitations-count").html(a)
    },
    updateMessageCount: function(a) {
        $(this.el).find(".messages-count").html(a)
    },
    viewAllInvites: function() {
        this.highlight(function() {
            window.location.hash = "invitations"
        })
    },
    getNodeCollection: function() {
        return this.model.get("messages")
    },
    getCollectionNode: function(a) {
        return (new TLI.MessageListItemView({
            model: a,
            id: this.getMessageNodeId(a)
        })).render().el
    },
    getMessageNodeId: function(a) {
        return "inbox-message-" + a.id
    },
    highlight: function(a) {
        var b = this;
        $(this.el).find(".all-invitations").addClass("active");
        setTimeout(function() {
            $(b.el).find(".all-invitations").removeClass("active");
            a.apply(b)
        },
        100)
    }
},
{
    hasRendered: function() {
        return !! $("#inbox-list-scroller").length
    },
    tearDown: function() {}
});
TLI.ComposeView = TLI.BaseView.extend({
    template: TLI.templates.compose.compose,
    toPersonTemplate: TLI.templates.compose.to_person,
    searchLimit: 5,
    isDirty: false,
    events: {
        "touchstart .compose-header .cancel": "cancel",
        "tap .compose-header .send": "send",
        "keyup input": "setDirty",
        "keyup textarea": "setDirty"
    },
    previousToVal: "",
    initialize: function() {
        var a = this;
        this.to = [];
        _.bindAll(this, "render", "connectionSearch", "invitationsSelected", "setDirty");
        if (this.model.to.length) this.to = _.map(this.model.to,
        function(b) {
            return b.id
        });
        if (this.model.get("type") !== TLI.Message.Types.INVITATION) {
            this.search = new TLI.Search;
            this.searchView = new TLI.ConnectionSearchView({
                model: this.search,
                activate: function(b, c) {
                    c.preventDefault();
                    c.stopPropagation();
                    a.connectionSelected(b)
                }
            })
        }
    },
    render: function() {
        var a = this;
        $(this.el).html(this.template({
            message: this.model,
            header: this.options.header,
            showSubj: this.options.showSubj
        }));
        $h.setPageContent("#compose-content", $(this.el));
        this.composeTo = $("#compose-to");
        this.composeSubject = $("#compose-subject");
        this.composeBody = $("#compose-body");
        if (this.searchView) {
            $(this.el).append(this.searchView.el);
            this.composeTo.bind("keyup", this.connectionSearch)
        } else this.composeTo.bind("keyup", this.invitationsSelected);
        if (this.model.get("type") === TLI.Message.Types.INVITATION) {
            this.composeBody.val($t("inv-msg-defaultbody"));
            this.appendSignature()
        }
        this.options.showSubj || this.composeBody.addClass("no-subject");
        $ui.pageLock({
            test: function() {
                return a.isDirty
            },
            locked: function(b) {
                _.each(a.$("input, textarea"),
                function(c) {
                    c.blur()
                });
                setTimeout(function() {
                    $ui.showActionSheet({
                        actions: [{
                            text: $t("discardMessage"),
                            tap: function() {
                                $ui.clearPageLock();
                                $h.go(b)
                            }
                        },
                        {
                            text: $t("continue"),
                            tap: null
                        }]
                    })
                },
                750)
            }
        });
        this.fitComposeTo();
        this.pageLoaded();
        this.toggleSend()
    },
    cancel: function(a) {
        a.preventDefault();
        a.stopPropagation();
        this.hideKeyboard();
        this.isDirty || this.clearForm();
        this.goBack()
    },
    clearForm: function() {
        this.to.length = 0;
        this.composeTo.val("");
        this.composeSubject.val("");
        this.composeBody.val("");
        this.isDirty = false;
        $(".to-people").html("")
    },
    send: function() {
        this.hideKeyboard();
        var a = this,
        b = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/,
        c;
        if (this.composeSubject.length === 0 && !
        function(f) {
            d = true;
            _.each(f,
            function(e) {
                b.test(e) || (d = false)
            });
            return d
        } (this.to)) $notif.showError($t("inv-invalid-email"));
        else {
            var d = this.model.set({
                to: this.to.join(","),
                subject: this.composeSubject.length === 0 ? $t("inv-subject") : this.composeSubject.val(),
                body: this.composeBody.val()
            });
            if (d) {
                $notif.showInfo($t("sendingMessage"));
                this.model.save(null, {
                    success: function() {
                        $notif.showInfo($t("messageSent"));
                        setTimeout(function() {
                            a.clearForm();
                            a.goBack()
                        },
                        1E3)
                    }
                })
            }
        }
    },
    fitComposeTo: function() {
        var a = this;
        this.composeTo.css({
            width: "1px"
        });
        var b = function() {
            return $(document.body).width() - a.composeTo.position().left - 20
        },
        c = b();
        if (c < 20) {
            this.composeTo.css({
                width: "20px"
            });
            c = b()
        }
        this.composeTo.css({
            width: c + "px"
        })
    },
    connectionSelected: function(a) {
        this.to.push(a.id);
        $(".to-people").append($(this.toPersonTemplate({
            person: a
        })));
        this.$("#compose-to").removeAttr("placeHolder");
        this.toggleSend();
        this.fitComposeTo();
        this.searchView.clear();
        this.composeTo.val("");
        this.previousToVal = ""
    },
    invitationsSelected: function() {
        this.to = $(this.el).find("#compose-to").val().split(",")
    },
    connectionSearch: function(a) {
        if (a.keyCode === 8 && !this.composeTo.val().length && !this.previousToVal.length) {
            a = $(".to-person");
            $(a[a.length - 1]).remove();
            this.to.pop();
            this.fitComposeTo();
            this.to.length === 0 && this.composeTo.attr("placeholder", $t("required_placeholder"))
        } else {
            var b = this;
            $h.defer(function() {
                b.doSearch()
            })
        }
    },
    doSearch: function() {
        var a = this,
        b = a.composeTo.val();
        this.previousToVal = b;
        b.length ? a.search.search({
            category: "connections",
            params: {
                keywords: b
            },
            attributes: ["firstName", "lastName"],
            limit: a.searchLimit,
            exclude: a.to,
            success: function() {
                a.searchView.moveUnder($(".to"));
                a.searchView.show()
            }
        }) : a.searchView.clear()
    },
    appendSignature: function() {
        this.composeBody.val(this.composeBody.val() + "\r\r- " + TLI.User.getCurrentUser().fullName())
    },
    setDirty: function() {
        this.isDirty = true;
        this.toggleSend()
    },
    toggleSend: function() {
        var a = this.model.get("type") === TLI.Message.Types.MESSAGE ? this.to.length: this.to[0] ? this.to[0] !== "": false,
        b = this.composeBody.val().length,
        c = this.model.get("type") === TLI.Message.Types.MESSAGE ? this.composeSubject.length !== 0 && this.composeSubject.val().length: true;
        a && c && b ? this.$(".send-disabled").removeClass("secondary disabled").addClass("send") : this.$(".send-disabled").removeClass("send").addClass("secondary disabled")
    },
    highlight: function(a) {
        a = a.target;
        var b = a.nodeName,
        c = $(a),
        d = null;
        if (b === "LI") {
            c.addClass("active");
            setTimeout(function() {
                c.removeClass("active")
            },
            500)
        } else if (d = c.parents("li")) {
            d.addClass("active");
            setTimeout(function() {
                d.removeClass("active")
            },
            500)
        }
    }
});
TLI.MessageListItemView = TLI.BaseView.extend({
    tagName: "li",
    className: "inbox-item has-chevron",
    template: TLI.templates.inbox.message_item,
    events: {
        tap: "message"
    },
    initialize: function() {
        _.bindAll(this, "render");
        this.model.bind("change", this.render);
        this.model.view = this
    },
    render: function() {
        $(this.el).addClass(this.model.get("read") ? "read": "unread");
        $(this.el).html(this.template({
            message: this.model
        }));
        return this
    },
    message: function() {
        this.highlight(function() {
            var a = $(this.el);
            a.hasClass("unread") && a.removeClass("unread");
            this.model.saveToMemory();
            $h.go("#message", this.model.get("id"), TLI.Message.Types.MESSAGE)
        })
    },
    highlight: function(a) {
        var b = this;
        $(this.el).addClass("active");
        setTimeout(function() {
            $(b.el).removeClass("active");
            a.apply(b)
        },
        100)
    }
});
TLI.MessageView = TLI.BaseView.extend({
    tagName: "div",
    className: "message",
    template: TLI.templates.message.message,
    events: {
        "tap .message-from": "senderProfile",
        "tap .read-state": "markUnread",
        "tap .compose": "compose",
        "tap .controls .archive": "archive",
        "tap .controls .trash": "trash",
        "tap .controls .reply": "reply",
        "tap .controls .accept": "accept",
        "tap .controls .ignore": "decline",
        "tap .message-action .text": "action",
        "tap .links li": "viewLink"
    },
    scrollSelector: "message-view-scroller",
    initialize: function() {
        _.bindAll(this, "render");
        this.model.bind("change", this.render);
        this.model.bind("loadComplete", _.bind(function() {
            this.pageFullyRendered()
        },
        this));
        TLI.Inbox.messageRead(this.model.id, true)
    },
    render: function() {
        $(this.el).html(this.template({
            message: this.model
        }));
        $h.setPageContent("#message-content", $(this.el));
        var a = this;
        this.initCursor(function() {
            $n.hasTitle() && $n.updateTitle(a.positionTitle());
            $n.nextPrevious(this.getMessages().listCursor.position + 1, this.options.type == TLI.Message.Types.INVITATION ? this.inbox.get("invitations").total: this.inbox.get("messages").total)
        });
        $h.defer(function() {
            a.refreshScroll();
            $("#li-header .back").unbind();
            $("#li-header .back").bind("tap",
            function() {
                a.back()
            });
            $("#li-header .next").unbind();
            $("#li-header .next").bind("click",
            function() {
                a.next()
            });
            $("#li-header .previous").unbind();
            $("#li-header .previous").bind("click",
            function() {
                a.previous()
            })
        });
        this.pageInteractive();
        return this
    },
    positionTitle: function() {
        return $t("x-of-x", this.getMessages().listCursor.position + 1, this.options.type == TLI.Message.Types.INVITATION ? this.inbox.get("invitations").total: this.inbox.get("messages").total)
    },
    senderProfile: function() {
        this.model.from.saveToMemory();
        $h.go("profile", this.model.from.id, this.model.from.get("authToken"))
    },
    markUnread: function() {
        if ($(".read-state").hasClass("markunread")) if ($native.isNative()) {
            $native.sendMessage({
                action: "markUnread",
                messageId: this.model.id
            });
            $(".read-state").removeClass("markunread").addClass("markread");
            $(".read-state .desc").text($t("message-markread"))
        } else {
            $notif.showInfo($t("markingMessageUnread"));
            this.model.setRead(false, {
                success: _.bind(function() {
                    TLI.Inbox.messageRead(this.model.id, false);
                    $notif.showInfo($t("messageMarkedUnread"));
                    $(".read-state").removeClass("markunread").addClass("markread");
                    $(".read-state .desc").text($t("message-markread"))
                },
                this),
                silent: true
            })
        } else if ($(".read-state").hasClass("markread")) if ($native.isNative()) {
            $native.sendMessage({
                action: "markRead",
                messageId: this.model.id
            });
            $(".read-state").removeClass("markread").addClass("markunread");
            $(".read-state .desc").text($t("message-markunread"))
        } else {
            $notif.showInfo($t("markingMessageRead"));
            this.model.setRead(true, {
                success: _.bind(function() {
                    TLI.Inbox.messageRead(this.model.id, true);
                    $notif.showInfo($t("messageMarkedRead"));
                    $(".read-state").removeClass("markread").addClass("markunread");
                    $(".read-state .desc").text($t("message-markunread"))
                },
                this),
                silent: true
            })
        }
    },
    back: function() {
        $h.go("#inbox")
    },
    initCursor: function(a) {
        var b = this;
        TLI.Inbox.get({
            success: function(c) {
                b.inbox = c;
                var d = b.getMessages();
                d && _.detect(d.models,
                function(f, e) {
                    if (f.id === b.model.id) {
                        d.listCursor.position = e;
                        a.call(b);
                        return true
                    }
                })
            }
        })
    },
    move: function(a, b) {
        if (a()) {
            var c = null;
            if (c = b.at(b.listCursor.position)) {
                c.saveToMemory();
                $h.go("#message", c.id, this.options.type)
            }
        }
    },
    next: function() {
        var a = this,
        b = a.getMessages(),
        c = b.listCursor.position,
        d = b.length;
        c == d - 1 && c < b.total - 1 ? b.fetch({
            add: true,
            success: function(f) {
                a.showLoader();
                a.move(function() {
                    if (c < f.length) {
                        f.listCursor.position++;
                        return true
                    }
                    return false
                },
                f)
            }
        }) : this.move(function() {
            if (c < d) {
                b.listCursor.position++;
                return true
            }
            return false
        },
        b)
    },
    previous: function() {
        var a = this.getMessages();
        this.move(function() {
            if (a.listCursor.position <= a.length) {
                a.listCursor.position--;
                return true
            }
            return false
        },
        a)
    },
    getMessages: function() {
        return this.options.type == TLI.Message.Types.INVITATION ? this.inbox.get("invitations") : this.inbox.get("messages")
    },
    compose: function() {
        $h.go("compose")
    },
    archive: function() {
        $notif.showInfo($t("archivingMessage"));
        this.model.archive({
            success: function() {
                $notif.showInfo($t("messageArchived"));
                TLI.InboxView.tearDown();
                $h.go("inbox")
            }
        })
    },
    trash: function() {
        $notif.showInfo($t("deletingMessage"));
        this.model.trash({
            success: function() {
                $notif.showInfo($t("messageDeleted"));
                TLI.InboxView.tearDown();
                $h.go("inbox")
            }
        })
    },
    reply: function() {
        this.model.saveToMemory();
        $h.go("compose", "reply", this.model.id)
    },
    accept: function() {
        this.model.accept();
        $notif.showInfo($t("inv-accepted"));
        $h.go("#inbox")
    },
    decline: function() {
        this.model.decline();
        $h.go("#inbox")
    },
    action: function() {
        var a = this.model.get("resource");
        a && a.url && $h.goToLink(a.url)
    },
    activateControl: function(a) {
        $(a.target).addClass("activated")
    },
    deactivateControl: function(a) {
        $(a.target).removeClass("activated")
    },
    activate: function() {
        var a = "/#message/" + (this.model.id + 1);
        if (a) window.location.href = a
    },
    viewLink: function(a) {
        a = $(a.currentTarget).attr("data-index");
        if (a = this.model.get("links")[a]) window.location = a.url
    }
});
TLI.StyleView = TLI.BaseView.extend({
    template: TLI.templates.style_guide.style,
    events: {},
    initialize: function() {
        _.bindAll(this, "render")
    },
    render: function() {
        $(this.el).html(this.template());
        $h.setPageContent("#style-content", $(this.el))
    }
});
TLI.IncommonView = TLI.CollectionView.extend({
    className: "page-wrapper",
    id: "incommon-list-scroller",
    template: TLI.templates.incommon.incommon,
    pageOptions: _.defaults({
        collectionSelector: "#incommon-content .incommon-list"
    },
    TLI.CollectionView.prototype.pageOptions),
    scrollSelector: "incommon-list-scroller",
    initialize: function() {
        _.bindAll(this, "render");
        this.collection.bind("refresh", this.render)
    },
    render: function() {
        $(this.el).html(this.template());
        $h.setPageContent("#incommon-content", $(this.el));
        TLI.CollectionView.prototype.render.apply(this);
        this.pageLoaded();
        return this
    },
    getCollectionNode: function(a) {
        return (new TLI.PeopleResultView({
            model: a
        })).render({
            hideDistance: true
        })
    },
    getNodeCollection: function() {
        return this.collection
    }
});
TLI.NusDetailView = TLI.BaseView.extend({
    className: "nus-detail",
    template: TLI.templates.nusdetail.nusdetail,
    events: {
        "tap .poster-profile": "posterProfile",
        "tap .like-toggle": "sendLike",
        "tap .comment": "sendComment",
        "click .reshare": "reShare",
        "tap .likes": "viewLikes",
        "tap .comments": "viewComments"
    },
    scrollSelector: "nusdetail-list-scroller",
    initialize: function() {
        _.bindAll(this, "reShare")
    },
    render: function() {
        var a = this,
        b = this.model.get("dtType"),
        c = null;
        c = c = null;
        var d = 0,
        f = 0,
        e = null,
        j = null;
        $(this.el).html(this.template({
            person: this.model.get("person"),
            update: this.model
        }));
        $h.setPageContent("#nusdetail-content", $(this.el));
        switch (b) {
        case this.model.ROLLUP_DETAIL:
            c = TLI.RollupDetailView;
            break;
        case this.model.GROUP_DETAIL:
            c = TLI.GroupDetailView;
            break;
        case this.model.SHARE_DETAIL:
        case this.model.TWEET_DETAIL:
        case this.model.NEWS_DETAIL:
            c = TLI.ShareDetailView;
            break;
        default:
            c = TLI.RollupDetailView
        }
        c = new c({
            model: this.model
        });
        $(this.el).find(".nus-detail-section").append(c.el);
        c.render();
        if (this.model.get("comments") && this.model.get("comments").total > 0) {
            c = new TLI.BaseCollection(this.model.get("comments").values);
            d = this.model.get("comments").values.length;
            e = document.createDocumentFragment();
            for (f = 0; f < d; f++)(j = new TLI.CommentItemView({
                model: c.models[f]
            })) && e.appendChild(j.render().el);
            (c = $(".comments-likes-list")) && c.append(e)
        }
        this.pageLoaded();
        $h.defer(function() {
            a.refreshScroll()
        });
        return this
    },
    back: function() {
        this.removeScroll();
        this.remove();
        this.goBack()
    },
    posterProfile: function() {
        this.model.get("person").saveToMemory();
        $h.go("profile", this.model.get("person").id, this.model.get("person").authToken)
    },
    sendLike: function(a) {
        var b = this,
        c = $(a.target),
        d = c.hasClass("like");
        a = new TLI.Like;
        var f = {
            success: function() {
                b.refreshCommentsLikes();
                if (d) {
                    c.removeClass("like");
                    c.addClass("unlike")
                } else {
                    c.removeClass("unlike");
                    c.addClass("like")
                }
            }
        };
        a.nus_id = this.model.id;
        if (d) {
            $notif.showInfo($t("dnu-liking"));
            $notif.showInfo($t("dnu-liked"));
            a.like(f)
        } else {
            $notif.showInfo($t("dnu-unliking"));
            $notif.showInfo($t("dnu-unliked"));
            a.unlike(f)
        }
    },
    refreshCommentsLikes: function() {
        var a = this,
        b = $mcache.generateKey("nusdetail", this.model.id);
        this.model.fetch({
            id: this.model.get("id"),
            success: function() {
                var c = a.model.toJSON();
                $mcache.set(b, c);
                $storage.set(b, c);
                a.render()
            },
            error: function() {}
        })
    },
    reShare: function(a) {
        if (!$(a.target).hasClass("disabled")) {
            a = [{
                text: $t("cancel"),
                tap: null
            }];
            this.model.canReplyPrivately() && a.unshift({
                text: $t("dnu-reply"),
                tap: _.bind(this.replyPrivately, this)
            });
            this.model.canSendToConnections() && a.unshift({
                text: $t("dnu-send"),
                tap: _.bind(this.sendToConnection, this)
            });
            this.model.isShareable() && a.unshift({
                text: $t("dnu-update"),
                tap: _.bind(this.postToUpdate, this)
            });
            $ui.showActionSheet({
                actions: a
            })
        }
    },
    createActionMessage: function(a, b) {
        return new TLI.Message({
            body: "\n\n\n" + b,
            subject: a,
            type: TLI.Message.Types.MESSAGE
        })
    },
    replyPrivately: function() {
        var a = this.createActionMessage(this.model.get("replyPrivateSubject"), this.model.get("replyPrivateBody")),
        b = $mcache.generateKey("message", this.model.id);
        a.set({
            to: [this.model.get("person")]
        });
        $mcache.set(b, a);
        $h.go("compose", "message", this.model.id)
    },
    sendToConnection: function() {
        var a = this.createActionMessage(this.model.get("sendConnectionSubject"), this.model.get("sendConnectionBody")),
        b = $mcache.generateKey("message", this.model.id);
        $mcache.set(b, a);
        $h.go("compose", "message", this.model.id)
    },
    postToUpdate: function() {
        var a = $mcache.generateKey("reshare", this.model.get("shareId"));
        $mcache.set(a, this.model);
        $h.go("share", "reshare", this.model.get("shareId"))
    },
    sendComment: function(a) {
        this.highlight(a,
        function() {
            $h.go("share/comment", this.model.get("id"))
        })
    },
    viewLikes: function(a) {
        this.highlight(a,
        function() {
            $h.go("#likes", this.model.get("id"))
        })
    },
    viewComments: function(a) {
        this.highlight(a,
        function() {
            $h.go("#comments", this.model.get("id"))
        })
    },
    highlight: function(a, b) {
        var c = this,
        d = a.target,
        f = d.nodeName,
        e = $(d),
        j = null;
        if (f === "LI") {
            e.addClass("active");
            setTimeout(function() {
                e.removeClass("active");
                b.apply(c)
            },
            100)
        } else if (j = e.parents("li")) {
            j.addClass("active");
            setTimeout(function() {
                j.removeClass("active");
                b.apply(c)
            },
            100)
        }
    }
});
TLI.RollupDetailView = TLI.CollectionView.extend({
    tagName: "div",
    template: TLI.templates.nusdetail.rollup_detail,
    events: {},
    pageOptions: {
        collectionSelector: "#nusdetail .rollup-list"
    },
    initialize: function() {
        _.bindAll(this, "render");
        this.model.view = this;
        $(this.el).html(this.template({
            update: this.model
        }))
    },
    render: function() {
        this.collection = this.getNodeCollection();
        TLI.CollectionView.prototype.render.apply(this, [true]);
        return this
    },
    getCollectionNode: function(a) {
        var b = null,
        c = {
            model: a
        };
        switch (a.get("type")) {
        case "person":
            if (!a.get("firstName")) return null;
            b = TLI.PeopleResultView;
            c.model = new TLI.Person(a);
            break;
        case "group":
            b = TLI.GroupResultView;
            break;
        case "web":
            return null;
        default:
            b = TLI.PeopleResultView;
            c.model = new TLI.Person(a)
        }
        return (new b(c)).render({
            hideDistance: true
        })
    },
    getNodeCollection: function() {
        return new TLI.PeopleCollection(this.model.get("links"))
    }
});
TLI.ShareDetailView = TLI.BaseView.extend({
    tagName: "div",
    className: "nus-detail-share-section media",
    template: TLI.templates.nusdetail.share_detail,
    events: {},
    initialize: function() {
        _.bindAll(this, "render");
        this.model.view = this
    },
    render: function() {
        $(this.el).html(this.template({
            update: this.model
        }));
        return this
    }
});
TLI.GroupDetailView = TLI.BaseView.extend({
    tagName: "div",
    className: "nus-detail-group-section media",
    template: TLI.templates.nusdetail.group_detail,
    events: {},
    initialize: function() {
        _.bindAll(this, "render");
        this.model.view = this
    },
    render: function() {
        var a = _.detect(this.model.get("links"),
        function(b) {
            return b.url || b.text2
        });
        $(this.el).html(this.template({
            update: this.model,
            link: a
        }));
        return this
    }
});
TLI.ShareView = TLI.BaseView.extend({
    initialize: function() {
        _.bindAll(this, "render", "cancel")
    },
    tagName: "section",
    className: "share-message",
    base_template: TLI.templates.share.share,
    getShareBox: function() {
        return this.$("#share-body textarea")
    },
    getShareCounter: function() {
        return this.$("#share-body .share-count")
    },
    render: function(a) {
        a || (a = {
            showCounter: true
        });
        $(this.el).html(this.base_template({
            header: a.header || $t("share-header"),
            subheader: a.subheader || null,
            action: a.action || $t("share"),
            share_msg: a.share_msg || $t("share-msg"),
            showCounter: a.showCounter
        }));
        $h.setPageContent("#share-content", $(this.el));
        this.shareBox = this.getShareBox();
        this.counter = this.getShareCounter();
        this.layoutCounter();
        this.shareBox.val("");
        if (this.updateCounterHandle) {
            clearInterval(this.updateCounterHandle);
            this.updateCounterHandle = null
        }
        if (a.showCounter) this.updateCounterHandle = setInterval(_.bind(function() {
            if ($("#share").css("display") == "none") clearInterval(this.updateCounterHandle);
            else {
                this.updateCounter();
                this.checkSize();
                this.resizeShareBox()
            }
        },
        this), 200);
        this.pageLoaded()
    },
    cancel: function(a) {
        a.preventDefault();
        a.stopPropagation();
        this.hideKeyboard();
        this.goBack()
    },
    shareBoxHasOnlySpaces: function() {
        return /^\s*$/.test(this.shareBox.val())
    },
    send: function(a) {
        var b = this;
        this.hideKeyboard();
        _.defaults(a, {
            shareEmptyAllowed: false
        });
        if (!a.shareEmptyAllowed && (b.shareBox.val() === "" || b.shareBoxHasOnlySpaces())) $notif.showError(a.empty);
        else {
            $notif.showInfo(a.sending);
            b.shareBox.val() !== "" && b.setModelToPost();
            b.model.save(null, {
                success: function() {
                    $notif.showInfo(a.sent, 1E3);
                    setTimeout(function() {
                        a.onSuccess ? a.onSuccess.call(b) : b.goBack()
                    },
                    1E3)
                }
            })
        }
    },
    setModelToPost: function() {
        this.model.set({
            comment: this.shareBox.val(),
            text: this.shareBox.val()
        })
    },
    updateCounter: function() {
        this.counter.html(this.shareBox.val().length)
    },
    checkSize: function() {
        if (this.counter.html() > TLI.ShareView.CONSTANTS.max) {
            if (this.$(".share-header .send").length !== 0) {
                this.$(".share-header .send").removeClass("send").addClass("secondary send-disabled");
                this.counter.css("color", "#FF0000")
            }
        } else {
            this.$(".share-header .send-disabled").removeClass("send-disabled secondary").addClass("send");
            this.counter.css("color", "#000000")
        }
    },
    layoutCounter: function() {
        this.counter.css("top", this.$("#share-body").height() + this.$("#share-header").height() + 10 + "px")
    },
    resizeShareBox: function() {
        if (this.shareBox.val().length >= TLI.ShareView.CONSTANTS.char_mid && this.shareBox.val().length < TLI.ShareView.CONSTANTS.char_hi) {
            this.shareBox.css("height", TLI.ShareView.CONSTANTS.mid_ht + "px");
            this.layoutCounter()
        } else if (this.shareBox.val().length > TLI.ShareView.CONSTANTS.char_hi) {
            this.shareBox.css("height", TLI.ShareView.CONSTANTS.hi_ht + "px");
            this.layoutCounter()
        }
    }
},
{
    CONSTANTS: {
        max: 700,
        char_mid: 150,
        char_hi: 300,
        mid_ht: 300,
        hi_ht: 700
    }
});
TLI.ShareStatusView = TLI.ShareView.extend({
    initialize: function() {
        _.bindAll(this, "send", "visibleTo", "twitter", "render");
        TLI.User.getCurrentUser().bind("change:twitter", this.render)
    },
    template: TLI.templates.share.share_status,
    events: _.extend({
        "touchstart .share-header .cancel": "cancel",
        "tap .share-header .send": "send",
        "tap #share .visible-to": "visibleTo",
        "tap #share .post-to-twitter": "twitter"
    },
    TLI.ShareView.prototype.events),
    render: function(a) {
        TLI.ShareView.prototype.render.apply(this, [a]);
        a = {
            visibility: this.model.get("visibility") === "anyone" ? $t("share-visibleAll") : $t("share-visibleC"),
            twitter: this.getTwitterMessage()
        };
        this.$("#share-options").html(this.template(a))
    },
    getTwitterMessage: function() {
        var a = this.getTwitterHandle();
        if (a) switch (this.model.get("twitter")) {
        case "true":
            return a;
        default:
            return $t("no")
        } else return false
    },
    visibleTo: function() {
        this.hideKeyboard();
        $ui.showActionSheet({
            actions: [{
                text: $t("share-visibleAll"),
                tap: _.bind(this.chooseOption, this, "anyone", "visibility", $t("share-visibleAll"), ".visible-to .value")
            },
            {
                text: $t("share-visibleC"),
                tap: _.bind(this.chooseOption, this, "connections", "visibility", $t("share-visibleC"), ".visible-to .value")
            },
            {
                text: $t("cancel"),
                tap: null
            }]
        })
    },
    showTwitterOptions: function() {
        return $config.showTwitter ? !!_.detect(TLI.User.getCurrentUser().get("accounts"),
        function(a) {
            return a.type === "twitter"
        }) : false
    },
    getTwitterHandle: function() {
        return TLI.User.getCurrentUser().getTwitterHandle()
    },
    twitter: function() {
        var a = this.getTwitterHandle() || $t("yes");
        $ui.showActionSheet({
            actions: [{
                text: a,
                tap: _.bind(this.chooseOption, this, "true", "twitter", a, ".post-to-twitter .value")
            },
            {
                text: $t("no"),
                tap: _.bind(this.chooseOption, this, "false", "twitter", $t("no"), ".post-to-twitter .value")
            },
            {
                text: $t("cancel"),
                tap: null
            }]
        })
    },
    chooseOption: function(a, b, c, d) {
        var f = {};
        $storage.set($storage.generateKey(b, TLI.User.getCurrentUser().get("id")), a);
        f[b] = a;
        this.model.set(f);
        this.$(d).html(c)
    },
    send: function() {
        TLI.ShareView.prototype.send.apply(this, [{
            empty: $t("share-empty"),
            sending: $t("share-sending"),
            sent: $t("share-sent")
        }])
    }
});
TLI.ShareCommentView = TLI.ShareView.extend({
    initialize: function() {
        _.bindAll(this, "render", "send")
    },
    events: _.extend({
        "touchstart .share-header .cancel": "cancel",
        "tap .share-header .send": "send"
    },
    TLI.ShareView.prototype.events),
    render: function() {
        TLI.ShareView.prototype.render.apply(this, [{
            showCounter: false,
            header: $t("comment-header"),
            share_msg: $t("comment-placeholder")
        }])
    },
    send: function() {
        this.model.set({
            comment: this.shareBox.val()
        });
        TLI.ShareView.prototype.send.apply(this, [{
            empty: $t("comment-empty"),
            sending: $t("comment-sending"),
            sent: $t("comment-sent")
        }])
    }
});
TLI.ShareUpdateView = TLI.ShareStatusView.extend({
    share_template: TLI.templates.share.share_update,
    render: function() {
        TLI.ShareStatusView.prototype.render.apply(this, [{
            showCounter: false,
            share_msg: $t("share-add-comment")
        }]);
        this.$("#share-top").html(this.share_template({
            update: this.model
        }))
    },
    send: function() {
        TLI.ShareView.prototype.send.apply(this, [{
            shareEmptyAllowed: true,
            empty: $t("share-empty"),
            sending: $t("share-sending"),
            sent: $t("share-sent")
        }])
    }
});
TLI.LikesView = TLI.CollectionView.extend({
    tagName: "div",
    template: TLI.templates.likes.likes,
    events: _.extend({},
    TLI.CollectionView.prototype.events),
    pageOptions: _.defaults({
        collectionSelector: "#likes-content .likes-list"
    },
    TLI.CollectionView.prototype.pageOptions),
    scrollSelector: "likes-list-scroller",
    initialize: function() {
        _.bindAll(this, "render")
    },
    render: function() {
        this.el = $("#likes-content");
        $h.setPageContent(this.el, this.template({
            likes: this.model
        }));
        TLI.CollectionView.prototype.render.apply(this);
        this.delegateEvents();
        this.pageLoaded();
        return this
    },
    getCollectionNode: function(a) {
        return (new TLI.PeopleResultView({
            model: new TLI.Person(a)
        })).render({
            hideDistance: true
        })
    },
    getNodeCollection: function() {
        return this.model
    }
});
TLI.CommentsView = TLI.CollectionView.extend({
    tagName: "div",
    template: TLI.templates.comments.comments,
    events: _.extend({},
    TLI.CollectionView.prototype.events),
    pageOptions: _.defaults({
        collectionSelector: "#comments-content .comments-list"
    },
    TLI.CollectionView.prototype.pageOptions),
    scrollSelector: "comments-list-scroller",
    initialize: function() {
        _.bindAll(this, "render")
    },
    render: function() {
        this.el = $("#comments-content");
        $h.setPageContent(this.el, this.template({
            comments: this.model
        }));
        TLI.CollectionView.prototype.render.apply(this);
        this.delegateEvents();
        this.pageLoaded();
        return this
    },
    getCollectionNode: function(a) {
        return (new TLI.CommentItemView({
            model: a
        })).render().el
    },
    getNodeCollection: function() {
        return this.model
    }
});
TLI.FooterView = TLI.BaseView.extend({
    tagName: "div",
    className: "site-footer",
    template: TLI.templates.shared.footer,
    events: {
        "tap .signout-button": "logout",
        "tap .full-site-button": "goFullSite",
        "tap .feedback-button": "composeFeedback"
    },
    initialize: function() {
        _.bindAll(this, "render")
    },
    render: function() {
        $(this.el).html(this.template());
        return this
    },
    logout: function(a) {
        a.preventDefault();
        TLI.User.logout();
        $h.go("#login")
    },
    goFullSite: function() {
        var a = new Date;
        a.setMinutes(a.getMinutes() + 30);
        document.cookie = "fullsiteselect=true; expires=" + a.toGMTString()
    },
    composeFeedback: function() {}
});
TLI.LogView = TLI.BaseView.extend({
    template: TLI.templates.dev.log,
    tagName: "div",
    events: {
        "tap .email-button": "email",
        "tap .clear-button": "clear"
    },
    scrollSelector: "log-view-scroller",
    initialize: function() {
        _.bindAll(this, "render")
    },
    render: function() {
        var a = this;
        $(this.el).html(this.template({
            logItems: this.model
        }));
        $h.setPageContent("#log-content", $(this.el));
        this.pageLoaded();
        $h.defer(function() {
            a.refreshScroll()
        });
        return this
    },
    email: function(a) {
        a.preventDefault();
        a = TLI.User.getCurrentUser().get("username");
        var b = "Log dump - " + (new Date).toString(),
        c = encodeURIComponent(this.model.join("\n"));
        window.location.href = "mailto:" + a + "?subject= " + b + "&body=" + c
    },
    clear: function(a) {
        a.preventDefault();
        a = $log.LocalStorageWriter.getStorageKey();
        localStorage.removeItem(a);
        this.model = [];
        this.render()
    }
});
TLI.GroupActivityView = TLI.HomeView.extend({
    template: TLI.templates.group.group_activity,
    scrollSelector: "ga-list-scroller",
    pageOptions: _.defaults({
        collectionSelector: "#updates .nus-list",
        footer: true
    },
    TLI.HomeView.prototype.pageOptions),
    initialize: function() {
        _.bindAll(this, "render");
        $(this.el).html(this.template({
            header: $t("ga-alldiscussions")
        }));
        $h.setPageContent("#updates-content", $(this.el));
        this.pageInteractive()
    },
    updateSubheader: function() {
        $(this.el).find(".section-heading h2").text($t("ga-title", $h.summarize(this.collection.title, 28)))
    },
    render: function() {
        TLI.HomeView.prototype.render.apply(this);
        this.pageLoaded()
    },
    getViewClass: function() {
        return TLI.GroupNusItemView
    }
});
TLI.PostDetailView = TLI.NusDetailView.extend({
    initialize: function() {},
    render: function() {
        var a = this,
        b = null;
        b = null;
        var c = 0,
        d = 0,
        f = null,
        e = null;
        this.model.get("title") && $n.updateTitle($h.summarize(this.model.get("title"), 16));
        $(this.el).html(this.template({
            person: new TLI.Person(this.model.get("person")),
            update: this.model
        }));
        $h.setPageContent("#nusdetail-content", $(this.el));
        b = new TLI.GroupDetailView({
            model: this.model
        });
        $(this.el).find(".nus-detail-section").append(b.el);
        b.render();
        if (this.model.get("comments") && this.model.get("comments").total > 0) {
            b = new TLI.BaseCollection(this.model.get("comments").values);
            c = this.model.get("comments").values.length;
            f = document.createDocumentFragment();
            for (d = 0; d < c; d++)(e = new TLI.CommentItemView({
                model: b.models[d]
            })) && f.appendChild(e.render().el);
            (b = $(".comments-likes-list")) && b.append(f)
        }
        this.pageLoaded();
        $h.defer(function() {
            a.refreshScroll()
        });
        return this
    },
    sendLike: function(a) {
        var b = this,
        c = $(a.target),
        d = c.hasClass("like");
        a = new TLI.Like;
        var f = {
            success: function() {
                b.refreshCommentsLikes();
                if (d) {
                    c.removeClass("like");
                    c.addClass("unlike")
                } else {
                    c.removeClass("unlike");
                    c.addClass("like")
                }
            }
        };
        a.post_id = this.model.id;
        if (d) {
            $notif.showInfo($t("dnu-liking"));
            $notif.showInfo($t("dnu-liked"));
            a.like(f)
        } else {
            $notif.showInfo($t("dnu-unliking"));
            $notif.showInfo($t("dnu-unliked"));
            a.unlike(f)
        }
    },
    sendComment: function(a) {
        this.highlight(a,
        function() {
            $h.go("share/groupcomment", this.model.get("id"))
        })
    },
    viewLikes: function(a) {
        if (!$native.isNative()) {
            var b = $mcache.generateKey("likedetail", this.model.id),
            c = this.model.get("likes");
            $mcache.set(b, c);
            $storage.set(b, c)
        }
        this.highlight(a,
        function() {
            $h.go("#likes/post", this.model.get("id"))
        })
    },
    viewComments: function(a) {
        if (!$native.isNative()) {
            var b = $mcache.generateKey("commentdetail", this.model.id),
            c = this.model.get("comments");
            $mcache.set(b, c);
            $storage.set(b, c)
        }
        this.highlight(a,
        function() {
            $h.go("#comments/post", this.model.get("id"))
        })
    },
    posterProfile: function() {
        this.model.get("person").saveToMemory || this.model.set({
            person: new TLI.Person(this.model.get("person"))
        });
        this.model.get("person").saveToMemory();
        $h.go("profile", this.model.get("person").id, this.model.get("person").authToken)
    }
});
TLI.GroupNusItemView = TLI.NusItemView.extend({
    tagName: "li",
    className: "nus-item simple",
    template: TLI.templates.nus.simple_item,
    events: {
        tap: "activate"
    },
    initialize: function() {
        _.bindAll(this, "render");
        this.model.bind("change", this.render);
        this.model.view = this
    },
    activate: function() {
        this.highlight(function() {
            if (!$native.isNative()) {
                var a = $mcache.generateKey("postdetail", this.model.id),
                b = this.model.toJSON();
                $mcache.set(a, b);
                $storage.set(a, b)
            }
            $h.go("#postdetail", this.model.get("id"))
        })
    }
});
TLI.GroupsView = TLI.CollectionView.extend({
    className: "groups-view",
    template: TLI.templates.groups.groups,
    scrollSelector: "groups-list-scroller",
    pageOptions: _.defaults({
        collectionSelector: "#groups .groups-list",
        footer: true
    },
    TLI.CollectionView.prototype.pageOptions),
    initialize: function() {
        _.bindAll(this, "render");
        $(this.el).html(this.template());
        $h.setPageContent("#groups-content", $(this.el));
        this.pageInteractive()
    },
    render: function() {
        var a = this;
        TLI.CollectionView.prototype.render.apply(this);
        $h.defer(function() {
            a.refreshScroll()
        });
        this.pageFullyRendered();
        return this
    },
    getCollectionNode: function(a) {
        return (new TLI.GroupItemView({
            model: a
        })).render().el
    },
    getNodeCollection: function() {
        return this.collection
    }
});
TLI.GroupItemView = TLI.BaseView.extend({
    tagName: "li",
    className: "group-item",
    template: TLI.templates.groups.groupItem,
    events: {
        tap: "activate"
    },
    render: function() {
        var a = {
            group: this.model
        };
        $(this.el).html(this.template(a));
        return this
    },
    initialize: function() {
        _.bindAll(this, "render");
        this.model.bind("change", this.render);
        this.model.view = this
    },
    activate: function() {
        this.highlight(function() {
            $h.go("#group", this.model.get("id"))
        })
    },
    highlight: function(a) {
        var b = this;
        $(this.el).addClass("active");
        setTimeout(function() {
            $(b.el).removeClass("active");
            a.apply(b)
        },
        100)
    }
});
TLI.PostComposeView = TLI.ShareView.extend({
    post_template: TLI.templates.group.group_update,
    events: _.extend({
        "touchstart .share-header .cancel": "cancel",
        "tap .share-header .send": "send"
    },
    TLI.ShareView.prototype.events),
    render: function() {
        TLI.ShareView.prototype.render.apply(this, [{
            showCounter: true,
            share_msg: $t("pc-startdisc"),
            header: $t("pc-newdisc"),
            action: $t("pc-post"),
            subheader: this.model.title
        }]);
        this.$("#share-options").html(this.post_template({
            update: this.model
        }))
    },
    setModelToPost: function() {
        var a = this.$("#share-options textarea").val();
        this.model.set({
            title: this.shareBox.val()
        });
        a && this.model.set({
            summary: a
        })
    },
    send: function() {
        var a = this;
        TLI.ShareView.prototype.send.apply(this, [{
            empty: $t("pc-empty"),
            sending: $t("pc-sending"),
            sent: $t("pc-sent"),
            onSuccess: function() {
                var b = new TLI.GroupActivityStream;
                b.group_id = this.model.group_id;
                b.fetch({
                    success: function() {
                        a.goBack()
                    },
                    error: function() {
                        a.goBack()
                    },
                    forceRefresh: true
                })
            }
        }])
    },
    checkSize: function() {
        if (this.counter.html() > 200) {
            if (this.$(".share-header .send").length !== 0) {
                this.$(".share-header .send").removeClass("send").addClass("secondary send-disabled");
                this.counter.css("color", "#FF0000")
            }
        } else {
            this.$(".share-header .send-disabled").removeClass("send-disabled secondary").addClass("send");
            this.counter.css("color", "#000000")
        }
    }
});
TLI.NetworkView = TLI.BaseView.extend({
    template: TLI.templates.network.network,
    templatePymk: TLI.templates.shared.pymk_rollup,
    templateGroups: TLI.templates.shared.groups_rollup,
    scrollSelector: "network-list-scroller",
    events: {
        "tap .pymk-rollup": "viewPymk",
        "tap .groups-rollup": "viewGroups"
    },
    pageOptions: {
        footer: true
    },
    initialize: function() {
        $(this.el).html(this.template({}));
        $h.setPageContent("#network-content", $(this.el));
        this.pageInteractive()
    },
    renderPymk: function() {
        this.$(".running-connections").html(this.templatePymk({
            models: this.pymk.models.slice(0, 6)
        }));
        this.pageFullyRendered()
    },
    renderGroups: function() {
        this.$(".running-groups").html(this.templateGroups({
            models: this.groups.models.slice(0, 6)
        }));
        this.pageFullyRendered()
    },
    bindPymkRemove: function() {
        this.pymk.bind("remove", _.bind(this.renderPymk, this))
    },
    bindGroupsRemove: function() {
        this.groups.bind("remove", _.bind(this.renderGroups, this))
    },
    viewPymk: function() {
        $h.go("#pymk")
    },
    viewGroups: function() {
        $h.go("#groups")
    }
});
TLI.RichToastView = TLI.BaseView.extend({
    template: TLI.templates.notification.rich_toast,
    events: {
        tap: "activate",
        "tap .close-button": "close"
    },
    initialize: function() {
        _.bindAll(this, "render")
    },
    render: function() {
        $(this.el).html(this.template({
            type: "rich-toast",
            name: this.model.name,
            message: this.model.message
        }));
        return this
    },
    activate: function(a) {
        var b = this;
        if (!$(a.target).hasClass("close-button")) {
            $notif.rememberToastClosed(b.model.name, new Date);
            if (b.model.metricsKey) $metrics.sendEvent({
                name: b.model.metricsKey + "_tapped",
                complete: function() {
                    window.location.href = b.model.url
                }
            });
            else window.location.href = b.model.url
        }
    },
    close: function() {
        $notif.hide();
        $notif.rememberToastClosed(this.model.name, new Date);
        this.model.metricsKey && $metrics.sendEvent({
            name: this.model.metricsKey + "_closed"
        })
    }
});
TLI.ReviewView = TLI.BaseView.extend({
    template: TLI.templates.review.review,
    events: {
        "tap .user-messages": "viewInbox",
        "tap .user-invites": "viewInvites",
        "tap .rollup-board-container": "viewWvmp"
    },
    scrollSelector: "review-scroller",
    initialize: function() {},
    render: function() {
        var a = this;
        $(this.el).html(this.template({
            messages: this.model.get("messages"),
            invitations: this.model.get("invitations"),
            wvmp: this.model.get("wvmp")
        }));
        $h.setPageContent("#review-content", $(this.el));
        this.renderUpdates($(this.el).find(".review-updates"), this.model.get("updates").models);
        this.renderShares($(this.el).find(".review-shares"), this.model.get("shares").models);
        this.pageLoaded();
        $h.defer(function() {
            a.refreshScroll()
        });
        return this
    },
    renderUpdates: function(a, b) {
        var c = document.createDocumentFragment(),
        d = 0,
        f = b.length < 3 ? b.length: 3,
        e = null,
        j = null;
        for (d = 0; d < f; d++) {
            j = b[d];
            e = TLI.HomeView.prototype.getViewClass(j);
            li = (new e({
                model: j,
                id: j.id
            })).render().el;
            d === 0 && this.injectHeader($(li), $t("wir-profileupdates"));
            li && c.appendChild(li)
        }
        a.append(c)
    },
    renderShares: function(a, b) {
        var c = document.createDocumentFragment(),
        d = 0,
        f = b.length < 4 ? b.length: 4,
        e = null,
        j = null;
        for (d = 0; d < f; d++) {
            j = b[d];
            e = TLI.HomeView.prototype.getViewClass(j);
            li = (new e({
                model: j,
                id: j.id
            })).render().el;
            d === 0 && this.injectHeader($(li), $t("wir-mostactiveupdates"));
            li && c.appendChild(li)
        }
        a.append(c)
    },
    injectHeader: function(a, b) {
        a.prepend('<header class="list-header"><h2>' + b + "</h2></header>");
        a.addClass("has-header")
    },
    viewInbox: function() {
        $h.go("#inbox")
    },
    viewInvites: function() {
        $h.go("#invitations")
    },
    viewWvmp: function() {
        $h.go("#wvmp")
    }
});
TLI.BaseController = Backbone.Controller.extend({
    before: {
        requireLogin: true
    },
    getRootPath: function(a) {
        var b = a;
        if (a.match(/\//)) b = a.split(/\//)[0];
        return b
    },
    go: function() {
        $h.go.apply(this, arguments)
    },
    isLoggedIn: function() {
        return !! TLI.User.isLoggedIn()
    },
    requireLogin: function() {
        if (!this.isLoggedIn()) {
            $h.storePath();
            $ui.activePage = null;
            this.go("#login");
            return false
        }
        return true
    },
    requireSSL: function() {
        $h.getAppHost();
        if (TLI.config.env === "production" && window.location.protocol !== "https:") {
            window.location.protocol = "https:";
            return false
        }
        return true
    },
    isPageActive: function(a) {
        a = this.getRootPath(a).replace(/#/, "");
        return $ui.activePage && $ui.activePage.attr("id") == a
    },
    showPage: function(a, b) {
        $h.showLoader();
        $ui.removeActionSheet();
        $n.showDrawer(false);
        a !== "#search" && $n.showSearch(false);
        var c = function() {
            b && typeof b === "function" && b.call(this)
        };
        if (this.isPageActive(a)) c();
        else {
            var d = this.getRootPath(a).replace(/#/, ""); ! $native.isNative() && this.navigation && this.navigation[d] ? $n.renderNav(this.navigation[d]) : $n.setHeaderless();
            this.initializePage(a);
            this.changePage(a, null, c)
        }
    },
    initializePage: function(a) {
        var b = this.getRootPath(a),
        c = b.replace(/#/, "");
        a = $("#touch_linkedin_app");
        if (!$(b).length) {
            b = $(TLI.templates.shared.page({
                path: c
            }));
            a.append(b)
        }
    },
    changePage: function(a, b, c) {
        var d = this,
        f = this.getRootPath(a),
        e = $ui.activePage,
        j = $(f);
        f = false;
        if (window.location.hash === $ui.historyStack.peek()) {
            $ui.historyStack.pop();
            f = true
        } else $ui.historyStack.push(window.location.hash);
        if ($native.isNative()) b = false;
        else b || (b = $ui.activePage ? "slide": false);
        j.addClass("ui-page ui-body-c");
        var n = function() {
            $ui.activePage = j;
            $("html").removeClass("ui-mobile-rendering");
            e && e.removeClass("ui-page-active active-page");
            c && c.call(d)
        };
        if ($transitions && b) $ui.animateTo(a, j, b, f, n);
        else {
            j.addClass("ui-page-active active-page");
            n()
        }
    },
    handleAuthError: function(a, b) {
        if (b.status == 401) {
            TLI.User.logout();
            $h.storePath();
            $ui.activePage = null;
            this.go("#login");
            return true
        }
        return false
    },
    removeModalOverlay: function() {
        TLI.BaseView.prototype.removeModalOverlay.call(this)
    }
});
TLI.HomeController = TLI.BaseController.extend({
    navigation: {
        home: {
            category: TLI.NavigationView.Categories.UPDATES,
            composeAction: "share/status",
            primaryAction: {
                template: TLI.templates.shared.nav_share
            }
        },
        rev: {
            category: TLI.NavigationView.Categories.UPDATES
        }
    },
    skipFilters: {
        requireLogin: ["login", "nativeLoad"]
    },
    routes: {
        "": "index",
        home: "home",
        login: "login",
        nativeLoad: "nativeLoad",
        nativeLoaded: "nativeLoaded",
        rev: "revision"
    },
    index: function() {
        $h.isPathStored() ? $h.goStoredPath() : $h.go("#home")
    },
    home: function() {
        var a = this,
        b = TLI.HomeController;
        this.showPage("#home",
        function() {
            var c = $mcache.get("nus");
            if (c) {
                c.fetch();
                b.getView().pageLoaded()
            } else {
                c = new TLI.NetworkUpdateStream;
                var d = new TLI.HomeView({
                    collection: c
                });
                b.setView(d);
                c.bind("refresh",
                function() {
                    $mcache.set("nus", c)
                });
                c.bind("error",
                function(e, j, n) {
                    d.hideLoader();
                    a.handleAuthError(e, j, n)
                });
                var f = new TLI.NewsActivityStream;
                f.news_type = "topNews";
                f.fetch({
                    success: function(e) {
                        d.news = e;
                        d.bindNewsRemove();
                        e.models.length > 0 ? d.renderNews() : d.hideNews()
                    },
                    error: function() {
                        d.hideNews()
                    }
                });
                c.fetch()
            }
        })
    },
    login: function() {
        if (TLI.config.env !== "unittest") if (TLI.config.env === "test") this.showPage("#login",
        function() { (new TLI.LoginView({
                model: null
            })).render()
        });
        else {
            var a = window.location.href;
            if (TLI.config.env === "production" && !window.location.protocol.match(/^https/)) a = a.replace(/http\:/, "https:");
            a = a.replace(/\/?(\?.+)?#login/, "/login.html");
            window.location.href = a
        }
    },
    nativeLoad: function() {},
    nativeLoadComplete: function() {},
    revision: function() {
        var a = TLI.config.revision;
        a ? this.showPage("#rev",
        function() {
            $("#rev-content").html("<div class='rev page-wrapper'>Rev: <span class='rev-num'>" + a.slice(0, 7) + "</span></div>");
            $h.hideLoader()
        }) : $h.go("#home")
    }
},
{
    getView: function() {
        return $mcache.get("homeView")
    },
    setView: function(a) {
        $mcache.set("homeView", a)
    }
});
TLI.ProfileController = TLI.BaseController.extend({
    navigation: {
        profile: {
            category: TLI.NavigationView.Categories.NETWORK
        }
    },
    routes: {
        profile: "show",
        "profile/:id": "show",
        "profile/:id/:authToken": "show",
        "profile/:id/:authToken/:section": "show",
        "acceptInvite/:id": "acceptInvite",
        "acceptInvite/:id/": "acceptInvite"
    },
    show: function(a, b, c, d) {
        var f = this;
        TLI.User.getCurrentUser().get("id");
        this.showPage("#profile",
        function() {
            var e = $mcache.get($mcache.generateKey("profile", a)),
            j,
            n;
            if (e) {
                j = new TLI.Profile({
                    id: e.id
                });
                n = new TLI.ProfileView({
                    model: j
                });
                j.set(e)
            } else {
                j = new TLI.Profile({
                    id: a
                });
                b && j.set({
                    authToken: b
                });
                n = new TLI.ProfileView({
                    model: j,
                    section: c
                });
                j.bind("error",
                function(r, w, t) {
                    f.handleAuthError(r, w, t)
                });
                e = $mcache.generateKey("person", a);
                e = $mcache.get(e);
                if ($native.isNative()) {
                    if (e) e.profile ? j.set(j.parse(e.profile)) : j.set({
                        person: new TLI.Person(e)
                    })
                } else {
                    e && j.set({
                        person: new TLI.Person(e)
                    });
                    j.fetch({
                        success: function(r) {
                            r.get("person").set({
                                authToken: b
                            });
                            r.saveToMemory();
                            d && r.get("person") && $notif.showInfo($t("invitation-accepted", r.get("person").get("firstName")), 5E3)
                        },
                        error: function() {
                            n.hideLoader();
                            $h.showErrorMessage()
                        }
                    })
                }
            }
        })
    },
    acceptInvite: function(a) {
        this.show(a, null, null, true)
    }
});
TLI.YouController = TLI.ProfileController.extend({
    routes: {
        you: "show"
    },
    show: function() {
        var a = TLI.User.getCurrentUser().get("id");
        TLI.ProfileController.prototype.show.apply(this, [a]);
        $n.updateTitle($t("title-you"))
    }
});
TLI.PymkController = TLI.BaseController.extend({
    navigation: {
        pymk: {
            category: TLI.NavigationView.Categories.NETWORK,
            title: "title-pymk"
        }
    },
    routes: {
        pymk: "show"
    },
    show: function() {
        this.showPage("#pymk",
        function() {
            TLI.PymkController.getView() ? TLI.PymkController.getView().pageLoaded() : TLI.PymkCollection.getInstance({
                success: function(a) {
                    a = new TLI.PymkView({
                        collection: a
                    });
                    TLI.PymkController.setView(a);
                    a.render()
                }
            })
        })
    }
},
{
    setView: function(a) {
        var b = $mcache.generateKey("pymkview");
        $mcache.set(b, a)
    },
    getView: function() {
        return $mcache.get($mcache.generateKey("pymkview"))
    }
});
TLI.SearchController = TLI.BaseController.extend({
    routes: {
        search: "search"
    },
    search: function() {
        this.showPage("#search",
        function() {
            if (TLI.SearchView.hasRendered()) TLI.SearchController.getView().pageLoaded();
            else {
                var a = new TLI.SearchView({
                    model: null
                });
                TLI.SearchController.setView(a);
                a.render();
                $h.defer(TLI.ConnectionCollection.getInstance)
            }
        })
    }
},
{
    setView: function(a) {
        var b = $mcache.generateKey("searchview");
        $mcache.set(b, a)
    },
    getView: function() {
        return $mcache.get($mcache.generateKey("searchview"))
    }
});
TLI.ConnectionsController = TLI.BaseController.extend({
    navigation: {
        connections: {
            category: TLI.NavigationView.Categories.NETWORK,
            title: "title-connections",
            composeAction: "compose",
            primaryAction: {
                template: TLI.templates.shared.nav_compose
            }
        }
    },
    routes: {
        "connections/:id": "show"
    },
    show: function(a) {
        var b = TLI.ConnectionsController,
        c = b.getLastView(),
        d = a == "you" ? null: a;
        c && a !== c.id && c.view.remove();
        this.showPage("#connections",
        function() {
            if (c && a == c.id) c.view.pageLoaded();
            else {
                var f = new TLI.ConnectionsView({
                    conn_id: d
                });
                TLI.ConnectionCollection.getInstance({
                    success: function(e) {
                        e.resetCursor();
                        f.collection = e;
                        f.renderConnections();
                        b.setLastView({
                            id: a,
                            view: f
                        })
                    },
                    error: function() {
                        $h.hideLoader();
                        $h.showErrorMessage()
                    },
                    id: d
                })
            }
        })
    }
},
{
    getKey: function() {
        return $mcache.generateKey("connectionsViewId")
    },
    getLastView: function() {
        var a = TLI.ConnectionsController.getKey();
        return $mcache.get(a)
    },
    setLastView: function(a) {
        var b = TLI.ConnectionsController.getKey();
        $mcache.set(b, a)
    }
});
TLI.InboxController = TLI.BaseController.extend({
    navigation: {
        inbox: {
            category: TLI.NavigationView.Categories.INBOX,
            title: "title-inbox",
            composeAction: function() {
                $ui.showActionSheet({
                    actions: [{
                        text: $t("newMessage"),
                        tap: "#compose"
                    },
                    {
                        text: $t("newInvitation"),
                        tap: "#compose/invite"
                    },
                    {
                        text: $t("cancel"),
                        tap: null
                    }]
                })
            },
            primaryAction: {
                template: TLI.templates.shared.nav_compose
            }
        }
    },
    routes: {
        inbox: "show"
    },
    show: function() {
        var a = this;
        this.showPage("#inbox",
        function() {
            var b = TLI.InboxController,
            c = b.getView();
            if (c) c.pageLoaded();
            else {
                var d = new TLI.InboxView;
                b.setView(d);
                TLI.Inbox.get({
                    success: function(f) {
                        d.model = f;
                        d.render()
                    },
                    error: function(f, e, j) {
                        b.setView(null);
                        d.hideLoader();
                        a.handleAuthError(f, e, j) || $h.showErrorMessage()
                    }
                })
            }
        })
    }
},
{
    getView: function() {
        return $mcache.get("inboxView")
    },
    setView: function(a) {
        $mcache.set("inboxView", a)
    }
});
TLI.InvitationsController = TLI.BaseController.extend({
    navigation: {
        invitations: {
            category: TLI.NavigationView.Categories.INBOX,
            title: "title-invites",
            composeAction: "compose"
        }
    },
    routes: {
        invitations: "show"
    },
    show: function() {
        this.showPage("#invitations",
        function() {
            var a = TLI.InvitationsController,
            b = a.getView();
            if (b) b.pageLoaded();
            else {
                var c = new TLI.InvitationsView;
                a.setView(c);
                TLI.Inbox.getInvitations({
                    success: function(d) {
                        c.collection = d;
                        c.hideLoader();
                        c.render()
                    }
                })
            }
        })
    }
},
{
    getView: function() {
        return $mcache.get("invitationsView")
    },
    setView: function(a) {
        $mcache.set("invitationsView", a)
    }
});
TLI.MessageController = TLI.BaseController.extend({
    navigation: {
        message: {
            category: TLI.NavigationView.Categories.INBOX,
            composeAction: "compose",
            primaryAction: {
                template: TLI.templates.message.right_nav
            }
        }
    },
    routes: {
        message: "show",
        "message/:id": "show",
        "message/:id/:type": "show"
    },
    show: function(a, b) {
        var c = this;
        this.showPage("#message",
        function() {
            var d = new TLI.Message({
                id: a
            });
            new TLI.MessageView({
                model: d,
                type: b
            });
            if (!$native.isNative()) if (c.queryParams && c.queryParams.istxn === "true") {
                $n.updateTitle("");
                c.queryParams = "false"
            } else $n.hasTitle() || $n.updateTitle($t("x-of-x", 0, 0));
            d.bind("error",
            function(e, j, n) {
                c.handleAuthError(e, j, n)
            });
            var f = d.hash();
            (f = $mcache.get(f)) && d.set(f);
            if ($native.isNative()) f.partial || d.trigger("loadComplete");
            else d.fetch({
                error: function(e, j, n) {
                    var r = JSON.parse(j.responseText)["public"];
                    $h.go("#home");
                    c.handleAuthError(e, j, n) || $notif.showError(r)
                },
                success: function(e) {
                    e.trigger("loadComplete")
                }
            })
        });
        return this
    }
});
TLI.ComposeController = TLI.BaseController.extend({
    navigation: {},
    routes: {
        compose: "show",
        "compose/message/:cache_id": "composeWithMessage",
        "compose/reply/:parentId": "reply",
        "compose/to/:recipientId": "to",
        "compose/invite": "invite",
        "compose/post": "post"
    },
    show: function(a, b) {
        this.showPage("#compose",
        function() {
            a || (a = new TLI.Message({
                type: TLI.Message.Types.MESSAGE
            }));
            b || (b = $t("newMessage"));
            (new TLI.ComposeView({
                model: a,
                header: b,
                showSubj: a.get("type") != TLI.Message.Types.INVITATION
            })).render();
            $h.defer(TLI.ConnectionCollection.getInstance)
        })
    },
    composeWithMessage: function(a) {
        a = $mcache.generateKey("message", a);
        this.show(new TLI.Message($mcache.get(a)), $t("reply"))
    },
    reply: function(a) {
        var b = this,
        c = $mcache.generateKey("message", a),
        d = new TLI.Message($mcache.get(c));
        c = function() {
            var f = d.createReply();
            b.show(f, $t("reply"))
        };
        if (d) c();
        else {
            d = new TLI.Message({
                id: a
            });
            d.fetch({
                success: c
            })
        }
    },
    to: function(a) {
        a = $mcache.get(a);
        this.show(new TLI.Message({
            to: a ? [a] : [],
            type: TLI.Message.Types.MESSAGE
        }))
    },
    invite: function() {
        this.show(new TLI.Message({
            type: TLI.Message.Types.INVITATION
        }), $t("inv-invite"))
    },
    post: function() {
        this.showPage("#compose",
        function() {
            message || (message = new TLI.Message({
                type: TLI.Message.Types.MESSAGE
            }));
            header || (header = $t("newMessage"));
            (new TLI.ComposeView({
                model: message,
                header: header,
                showSubj: message.get("type") != TLI.Message.Types.INVITATION
            })).render();
            $h.defer(TLI.ConnectionCollection.getInstance)
        })
    }
});
TLI.StyleController = TLI.BaseController.extend({
    navigation: {
        style: {
            category: TLI.NavigationView.Categories.UPDATES
        }
    },
    routes: {
        style: "show"
    },
    show: function() {
        this.showPage("#style",
        function() { (new TLI.StyleView).render()
        })
    }
});
TLI.IncommonController = TLI.BaseController.extend({
    navigation: {
        incommon: {
            category: TLI.NavigationView.Categories.NETWORK,
            title: "title-incommon",
            composeAction: "compose"
        }
    },
    routes: {
        "incommon/:id": "show"
    },
    show: function(a) {
        a && this.showPage("#incommon",
        function() {
            var b = new TLI.InCommon,
            c = new TLI.IncommonView({
                collection: b
            });
            b.id = a;
            b.fetch({
                error: function() {
                    c.hideLoader()
                }
            })
        })
    }
});
TLI.NusDetailController = TLI.BaseController.extend({
    navigation: {
        nusdetail: {
            category: TLI.NavigationView.Categories.UPDATES,
            title: "title-nusdetail",
            composeAction: "share/status",
            primaryAction: {
                template: TLI.templates.shared.nav_share
            }
        }
    },
    routes: {
        "nusdetail/:id": "show"
    },
    show: function(a) {
        this.showPage("#nusdetail",
        function() {
            var b = $mcache.generateKey("nusdetail", a),
            c = $mcache.get(b),
            d = null,
            f = null;
            c || (c = $storage.get(b));
            d = new TLI.NetworkUpdate(c);
            c.person && d.set({
                person: new TLI.Person(c.person)
            });
            f = new TLI.NusDetailView({
                model: d
            });
            f.render(); ! d.get("like") && d.get("like") !== 0 || $native.isNative() || f.refreshCommentsLikes()
        })
    }
});
TLI.ShareController = TLI.BaseController.extend({
    routes: {
        share: "show",
        "share/:type": "show",
        "share/:type/:id": "show"
    },
    show: function(a, b) {
        this.showPage("#share",
        function() {
            $config.showTwitter && TLI.User.getCurrentUser().fetchSettings();
            var c, d, f = $storage.get($storage.generateKey("visibility", TLI.User.getCurrentUser().get("id"))) || "anyone";
            c = $storage.get($storage.generateKey("twitter", TLI.User.getCurrentUser().get("id"))) || "false";
            f = {
                visibility: f
            };
            var e = {};
            switch (a) {
            case "status":
                if ($config.showTwitter) e.twitter = c;
                _.defaults(e, f);
                c = new TLI.NetworkUpdate(e);
                d = new TLI.ShareStatusView({
                    model: c
                });
                break;
            case "comment":
                c = new TLI.Comment;
                c.nus_id = b;
                d = new TLI.ShareCommentView({
                    model: c
                });
                break;
            case "groupcomment":
                c = new TLI.Comment;
                c.post_id = b;
                d = new TLI.ShareCommentView({
                    model: c
                });
                break;
            case "reshare":
                d = $mcache.generateKey("reshare", b);
                d = $mcache.get(d);
                var j = null,
                n = {};
                if ($config.showTwitter) e.twitter = c;
                _.defaults(n, f);
                if (d.get("type") === "article") {
                    j = d.get("links")[0];
                    n.contentTitle = j.text1;
                    n.contentUrl = j.url;
                    n.contentImage = j.picture
                } else n.contentId = b;
                c = new TLI.NetworkUpdate(n);
                f = d.getReshareDetails();
                c.set(f);
                d = new TLI.ShareUpdateView({
                    model: c
                });
                break;
            case "grouppost":
                c = new TLI.PostModel;
                c.group_id = b;
                c.title = $mcache.get($mcache.generateKey("groupActivity", b) + "-title");
                d = new TLI.PostComposeView({
                    model: c
                });
                break;
            default:
                console.log("here");
                $h.go("#share", "status")
            }
            d.render()
        })
    }
});
TLI.LikesController = TLI.BaseController.extend({
    navigation: {
        likes: {
            category: TLI.NavigationView.Categories.UPDATES,
            title: "title-likes",
            composeAction: "share"
        }
    },
    routes: {
        "likes/:id": "show",
        "likes/post/:id": "showPostLikes"
    },
    show: function(a) {
        this.showPage("#likes",
        function() {
            var b = new TLI.Likes,
            c = new TLI.LikesView({
                model: b
            });
            c.render();
            b.nus_id = a;
            b.fetch({
                success: function() {
                    c.render()
                }
            })
        })
    },
    showPostLikes: function(a) {
        this.showPage("#likes",
        function() {
            var b = $mcache.generateKey("likedetail", a),
            c = $mcache.get(b),
            d = null,
            f = null;
            c || (c = $storage.get(b));
            d = new TLI.Likes(c.values);
            f = new TLI.LikesView({
                model: d
            });
            f.render();
            d.post_id = a;
            d.fetch({
                success: function() {
                    f.render()
                },
                error: function() {}
            })
        })
    }
});
TLI.RecentActivityController = TLI.BaseController.extend({
    navigation: {
        updates: {
            category: TLI.NavigationView.Categories.NETWORK,
            title: "ra-title"
        }
    },
    routes: {
        "updates/:id": "show",
        "updates/detail/:id": "shownus"
    },
    show: function(a) {
        var b = this;
        this.showPage("#updates",
        function() {
            var c = new TLI.RecentActivityStream,
            d = TLI.User.getCurrentUser().get("id");
            c.id = a;
            if (!a || a === d) c.meFeed = true;
            b.fetchNus(c)
        })
    },
    shownus: function(a) {
        var b = this;
        this.showPage("#updates",
        function() {
            $n.updateTitle($t("title-nusdetail"));
            var c = new TLI.ConnectionsRollupStream;
            c.nus_id = a;
            b.fetchNus(c)
        })
    },
    fetchNus: function(a) {
        var b = new TLI.RecentActivityView({
            collection: a
        });
        a.bind("refresh",
        function() {
            b.render()
        });
        a.fetch({
            success: function(c) {
                c.length === 0 && $notif.showInfo($t("ra-noupdates"))
            },
            error: function(c, d) {
                b.hideLoader();
                d = JSON.parse(d.responseText);
                d.statusCode === 401 ? $notif.showError($t("ra-noshare")) : self.handleError($t("error"), d)
            }
        })
    }
});
TLI.CommentsController = TLI.BaseController.extend({
    navigation: {
        comments: {
            category: TLI.NavigationView.Categories.UPDATES,
            title: "title-comments",
            composeAction: "share"
        }
    },
    routes: {
        "comments/:id": "show",
        "comments/post/:id": "showPostComments"
    },
    show: function(a) {
        this.showPage("#comments",
        function() {
            var b = new TLI.Comments,
            c = new TLI.CommentsView({
                model: b
            });
            b.nus_id = a;
            b.fetch({
                success: function() {
                    c.render()
                }
            })
        })
    },
    showPostComments: function(a) {
        this.showPage("#comments",
        function() {
            var b = $mcache.generateKey("commentdetail", a),
            c = $mcache.get(b),
            d = null,
            f = null;
            c || (c = $storage.get(b));
            d = new TLI.Comments(c.values);
            f = new TLI.CommentsView({
                model: d
            });
            f.render();
            d.post_id = a;
            d.fetch({
                success: function() {
                    f.render()
                },
                error: function() {}
            })
        })
    }
});
TLI.DevController = TLI.BaseController.extend({
    navigation: {
        log: {
            category: TLI.NavigationView.Categories.UPDATES
        }
    },
    routes: {
        devlog: "log"
    },
    log: function() {
        this.showPage("#log",
        function() {
            var a = $log.LocalStorageWriter.getStorageKey();
            if (a = localStorage[a]) a = JSON.parse(a);
            (new TLI.LogView({
                model: a
            })).render()
        })
    }
});
TLI.GroupActivityController = TLI.BaseController.extend({
    navigation: {
        updates: {
            category: TLI.NavigationView.Categories.NETWORK,
            composeAction: "share/grouppost/",
            primaryAction: {
                template: TLI.templates.shared.nav_compose
            }
        }
    },
    routes: {
        "group/:id": "show"
    },
    show: function(a) {
        var b = this;
        this.navigation.updates.composeAction = "share/grouppost/" + a;
        this.showPage("#updates",
        function() {
            var c = new TLI.GroupActivityStream;
            c.group_id = a;
            b.fetchDiscussions(c)
        })
    },
    fetchDiscussions: function(a) {
        var b = new TLI.GroupActivityView({
            collection: a
        });
        a.bind("refresh",
        function() {
            b.render()
        });
        a.fetch({
            success: function(c) {
                c.length === 0 && $notif.showInfo($t("ga-noposts"));
                if (c.title) {
                    $n.updateTitle($h.summarize(c.title, 16));
                    b.updateSubheader()
                }
            },
            error: function(c, d) {
                b.hideLoader();
                d = JSON.parse(d.responseText);
                var f = d["public"];
                if (d.statusCode === 401) $notif.showError($t("ga-noshare"));
                else if (d.statusCode === 404) {
                    $h.go("#home");
                    $notif.showError(f)
                } else self.handleError($t("error"), d)
            }
        })
    }
});
TLI.GroupsController = TLI.BaseController.extend({
    navigation: {
        groups: {
            category: TLI.NavigationView.Categories.NETWORK,
            title: "title-groups"
        }
    },
    routes: {
        groups: "show"
    },
    show: function() {
        var a = this;
        this.showPage("#groups",
        function() {
            var b = new TLI.GroupsCollection;
            a.fetchGroups(b)
        })
    },
    fetchGroups: function(a) {
        var b = new TLI.GroupsView({
            collection: a
        });
        a.bind("refresh",
        function() {
            b.render()
        });
        a.fetch({
            success: function(c) {
                c.length === 0 && $notif.showInfo($t("g-nogroups"))
            }
        })
    }
},
{
    getView: function() {
        return $mcache.get("groupsView")
    },
    setView: function(a) {
        $mcache.set("groupsView", a)
    }
});
TLI.PostDetailController = TLI.BaseController.extend({
    navigation: {
        nusdetail: {
            category: TLI.NavigationView.Categories.NETWORK,
            title: "title-postdetail"
        }
    },
    routes: {
        "postdetail/:id": "show"
    },
    show: function(a) {
        this.showPage("#nusdetail",
        function() {
            var b = $mcache.generateKey("postdetail", a),
            c = $mcache.get(b),
            d = null,
            f = null;
            c || (c = $storage.get(b));
            d = new TLI.GroupUpdate(c);
            if (c) {
                if (c.person) {
                    d.set({
                        person: new TLI.Person(c.person)
                    });
                    f = new TLI.PostDetailView({
                        model: d
                    });
                    f.render(); ! d.get("like") && d.get("like") !== 0 || $native.isNative() || f.refreshCommentsLikes()
                }
            } else {
                d.set({
                    id: a
                });
                d.fetch({
                    success: function(e) {
                        var j = e.toJSON();
                        $mcache.set(b, j);
                        $mcache.set(b, j);
                        e.set({
                            person: new TLI.Person(e.get("person"))
                        });
                        f = new TLI.PostDetailView({
                            model: e
                        });
                        f.render()
                    },
                    error: function(e, j) {
                        var n = JSON.parse(j.responseText)["public"];
                        $h.go("#home");
                        j.status === 403 && $notif.showError(n)
                    }
                })
            }
        })
    }
});
TLI.NewsActivityController = TLI.BaseController.extend({
    navigation: {
        updates: {
            category: TLI.NavigationView.Categories.NETWORK
        }
    },
    routes: {
        "news/top": "showTop",
        "news/shared": "showShared",
        "news/:id": "show"
    },
    showTop: function() {
        var a = this;
        a.showPage("#updates",
        function() {
            var b = new TLI.NewsActivityStream;
            b.news_type = "topNews";
            a.fetchNews(b)
        })
    },
    showShared: function() {
        var a = this;
        this.showPage("#updates",
        function() {
            var b = new TLI.NewsActivityStream;
            b.news_type = "shared";
            a.fetchNews(b)
        })
    },
    show: function(a) {
        var b = this;
        b.showPage("#updates",
        function() {
            var c = new TLI.NewsActivityStream;
            c.news_id = a;
            b.fetchNews(c)
        })
    },
    fetchNews: function(a) {
        var b = new TLI.NewsActivityView({
            collection: a
        });
        a.bind("refresh",
        function() {
            b.render()
        });
        a.fetch({
            success: function(c) {
                c.length === 0 && $notif.showInfo($t("na-noposts"));
                if (a.news_type === "topNews") $n.updateTitle($t("top-news"));
                else if (c.title) {
                    $n.updateTitle($h.summarize(c.title, 15));
                    b.updateSubheader()
                }
            },
            error: function(c, d) {
                b.hideLoader();
                d = JSON.parse(d.responseText);
                var f = d["public"];
                if (d.statusCode === 401) $notif.showError($t("na-noshare"));
                else if (d.statusCode === 404) {
                    $h.go("#home");
                    $notif.showError(f)
                } else {
                    b.handleError(f, d);
                    b.pageLoaded()
                }
            }
        });
        a.news_id && TLI.Topics.get({
            success: function(c) {
                var d = c.get("recommended"),
                f = c.get("following"),
                e = function(j) {
                    return j.get("entityCode") == a.news_id
                };
                a.isFollowing = c.isFollowing(a.news_id);
                a.topicObj = a.isFollowing ? f.get(a.news_id) : d.get(a.news_id);
                if (!a.topicObj) {
                    a.topicObj = d.find(e);
                    if (a.topicObj) a.isFollowing = false;
                    else {
                        a.isFollowing = true;
                        a.topicObj = f.find(e)
                    }
                }
                a.topicObj.get("entityCode") ? b.showFollowAction(a.isFollowing) : b.hideFollowAction()
            },
            error: function() {
                b.hideFollowAction()
            }
        })
    }
});
TLI.NewsDetailController = TLI.BaseController.extend({
    navigation: {
        newsdetail: {
            category: TLI.NavigationView.Categories.NETWORK,
            title: "title-newsdetail"
        }
    },
    routes: {
        "newsdetail/:id": "show"
    },
    show: function(a) {
        this.showPage("#newsdetail",
        function() {
            var b = $mcache.generateKey("newsdetail", a),
            c = $mcache.get(b),
            d = null,
            f = null;
            c || (c = $storage.get(b));
            d = new TLI.NewsUpdate(c);
            if (c) {
                f = new TLI.NewsDetailView({
                    model: d
                });
                f.render()
            } else {
                d.set({
                    id: a
                });
                d.fetch({
                    success: function(e) {
                        var j = e.toJSON();
                        $mcache.set(b, j);
                        $mcache.set(b, j);
                        f = new TLI.NewsDetailView({
                            model: e
                        });
                        f.render()
                    },
                    error: function(e, j) {
                        var n = JSON.parse(j.responseText)["public"];
                        $h.go("#home");
                        j.status === 403 && $notif.showError(n)
                    }
                })
            }
        })
    }
});
TLI.TopicsController = TLI.BaseController.extend({
    navigation: {
        topics: {
            category: TLI.NavigationView.Categories.NETWORK,
            title: "title-topics"
        }
    },
    routes: {
        topics: "show"
    },
    show: function() {
        var a = this;
        this.showPage("#topics",
        function() {
            var b = TLI.TopicsController,
            c = b.getView();
            if (c) c.pageLoaded();
            else {
                var d = new TLI.TopicsView;
                b.setView(d);
                TLI.Topics.get({
                    success: function(f) {
                        d.model = f;
                        TLI.Topics.getRecommended({
                            success: function(e) {
                                f.set({
                                    recommended: e
                                },
                                {
                                    silent: true
                                });
                                d.render()
                            }
                        })
                    },
                    error: function(f, e, j) {
                        b.setView(null);
                        d.hideLoader();
                        a.handleAuthError(f, e, j) || $h.showErrorMessage()
                    }
                })
            }
        })
    }
},
{
    getView: function() {
        return $mcache.get("topicsView")
    },
    setView: function(a) {
        $mcache.set("topicsView", a)
    }
});
TLI.RecommendedTopicsController = TLI.BaseController.extend({
    navigation: {
        topicrecommends: {
            category: TLI.NavigationView.Categories.INBOX,
            title: "title-topicrecommends"
        }
    },
    routes: {
        "topics/recommends": "show"
    },
    show: function() {
        this.showPage("#topicrecommends",
        function() {
            var a = TLI.RecommendedTopicsController,
            b = a.getView();
            if (b) b.pageLoaded();
            else {
                var c = new TLI.RecommendedTopicsView;
                a.setView(c);
                TLI.Topics.get({
                    success: function(d) {
                        c.collection = d.get("recommended");
                        TLI.Topics.getRecommended({
                            success: function(f) {
                                for (var e = 0, j = f.models.length; e < j; e++) d.get("recommended").get(f.models[e]) || d.get("recommended").add(f.models[e], {
                                    silent: true
                                });
                                c.collection = d.get("recommended");
                                c.render()
                            }
                        })
                    },
                    error: function(d, f, e) {
                        tController.setView(null);
                        c.hideLoader();
                        self.handleAuthError(d, f, e) || $h.showErrorMessage()
                    }
                })
            }
        })
    }
},
{
    getView: function() {
        return $mcache.get("topicRecommendsView")
    },
    setView: function(a) {
        $mcache.set("topicRecommendsView", a)
    }
});
TLI.NetworkController = TLI.BaseController.extend({
    navigation: {
        network: {
            category: TLI.NavigationView.Categories.NETWORK,
            title: "title-network",
            composeAction: "compose",
            primaryAction: {
                template: TLI.templates.shared.nav_compose
            }
        }
    },
    routes: {
        network: "show"
    },
    show: function() {
        var a = TLI.NetworkController.getLastView();
        this.showPage("#network",
        function() {
            if (a) a.view.pageLoaded();
            else {
                var b = new TLI.NetworkView({}),
                c = function() {
                    b.$(".pymk-rollup").hide()
                },
                d = function() {
                    b.$(".groups-rollup").hide()
                };
                TLI.PymkCollection.getInstance({
                    success: function(f) {
                        b.pymk = f;
                        b.bindPymkRemove();
                        f.models.length > 0 ? b.renderPymk() : c()
                    },
                    error: function() {
                        c()
                    }
                });
                (new TLI.GroupsCollection).fetch({
                    success: function(f) {
                        b.groups = f;
                        b.bindGroupsRemove();
                        f.models.length > 0 ? b.renderGroups() : d()
                    },
                    error: function() {
                        d()
                    }
                })
            }
        })
    }
},
{
    getKey: function() {
        return $mcache.generateKey("networkViewId")
    },
    getLastView: function() {
        var a = TLI.NetworkController.getKey();
        return $mcache.get(a)
    },
    setLastView: function(a) {
        var b = TLI.NetworkController.getKey();
        $mcache.set(b, a)
    }
});
TLI.DevController = TLI.BaseController.extend({
    navigation: {
        log: {
            category: TLI.NavigationView.Categories.UPDATES
        }
    },
    routes: {
        devlog: "log"
    },
    log: function() {
        this.showPage("#log",
        function() {
            var a = $log.LocalStorageWriter.getStorageKey();
            if (a = localStorage[a]) a = JSON.parse(a);
            (new TLI.LogView({
                model: a
            })).render()
        })
    }
});
TLI.NotificationsController = TLI.BaseController.extend({
    navigation: {
        notifications: {
            category: TLI.NavigationView.Categories.NETWORK
        }
    },
    routes: {
        notifications: "show"
    },
    show: function() {
        this.showPage("#notifications",
        function() { (new TLI.NotificationsView).render()
        })
    }
});
TLI.ReviewController = TLI.BaseController.extend({
    navigation: {
        review: {
            category: TLI.NavigationView.Categories.NETWORK
        }
    },
    routes: {
        review: "show"
    },
    show: function() {
        var a = this;
        this.showPage("#review",
        function() {
            var b = new TLI.ReviewView;
            if ($native.isNative()) {
                var c = new TLI.Review,
                d = TLI.Review.getKey();
                if (d = $mcache.get(d)) {
                    c.set(d);
                    b.model = c;
                    b.render()
                }
            } else {
                var f = TLI.ReviewController;
                if (c = f.getView()) c.pageLoaded();
                else {
                    f.setView(b);
                    TLI.Review.get({
                        success: function(e) {
                            b.model = e;
                            b.render()
                        },
                        error: function(e, j, n) {
                            f.setView(null);
                            b.hideLoader();
                            a.handleAuthError(e, j, n) || $h.showErrorMessage()
                        }
                    })
                }
            }
        })
    }
},
{
    getView: function() {
        return $mcache.get("reviewView")
    },
    setView: function(a) {
        $mcache.set("reviewView", a)
    }
});
TLI.NewsActivityStream = TLI.NetworkUpdateStream.extend({
    model: TLI.NewsUpdate,
    hash: function() {
        return this.news_type ? $mcache.generateKey("newsActivity", this.news_type) : $mcache.generateKey("newsActivity", this.news_id)
    },
    collectionOptions: {},
    url: function() {
        var a = {};
        _.defaults(a, this.params);
        if (this.models.length > 0) a.start = this.models.length;
        a.count = 0;
        url = this.news_type ? "<%- base %>/li/v1/topics/" + this.news_type + "<%- suffix %>": "<%- base %>/li/v1/topics/" + encodeURIComponent(this.news_id) + "<%- suffix %>";
        return this.buildUrl(url, a)
    },
    parse: function(a) {
        this.total = a.total;
        this.title = a.title;
        a = a.articles;
        return a.values
    },
    saveToMemory: function() {
        var a;
        if (this.hash) {
            a = typeof this.hash === "function" ? this.hash() : this.hash;
            if (typeof a !== "undefined") {
                this.title && $mcache.set(a + "-title", this.title);
                $mcache.set(a, this.toJSON())
            }
        }
    },
    fetch: function(a) {
        var b = this,
        c = this.hash(),
        d = a.success,
        f = a ? a.forceRefresh: false;
        a.success = function(e) {
            e.saveToMemory();
            d && d.call(a, b, e)
        };
        if ($mcache.get(c) && !a.add && !f) {
            b.refresh($mcache.get(c));
            if ($mcache.get(c + "-title")) b.title = $mcache.get(c + "-title");
            d && d.call(a, b, $mcache.get(c))
        } else TLI.NetworkUpdateStream.prototype.fetch.apply(this, [a])
    }
});
TLI.NewsActivityView = TLI.HomeView.extend({
    template: TLI.templates.news.news_activity,
    scrollSelector: "na-list-scroller",
    events: _.defaults({
        "tap .followed-topics": "showFollowing",
        "tap .follow-action li": "followTopic"
    },
    TLI.HomeView.prototype.events),
    pageOptions: _.defaults({
        collectionSelector: "#updates .nus-list",
        footer: true
    },
    TLI.HomeView.prototype.pageOptions),
    initialize: function() {
        _.bindAll(this, "render");
        $(this.el).html(this.template({
            id: this.collection.news_id,
            type: this.collection.news_type,
            header: $t("na-alldiscussions")
        }));
        $h.setPageContent("#updates-content", $(this.el));
        this.pageInteractive()
    },
    render: function() {
        TLI.HomeView.prototype.render.apply(this);
        this.pageLoaded()
    },
    getViewClass: function() {
        return TLI.NewsNusItemView
    },
    updateSubheader: function() {
        $(this.el).find(".section-heading h2").text($t("na-title", $h.summarize(this.collection.title, 30)))
    },
    showFollowing: function() {
        $h.go("#topics")
    },
    showFollowAction: function(a) {
        var b = $(this.el).find(".follow-action"),
        c = b.find(".text");
        b.show();
        c.html(a ? "Stop Following": "Follow");
        if (a) {
            c.addClass("secondary");
            c.addClass("unfollow");
            c.removeClass("follow")
        } else {
            c.removeClass("secondary");
            c.addClass("follow");
            c.addClass("unfollow")
        }
    },
    hideFollowAction: function() {
        $(this.el).find(".follow-action").hide()
    },
    followTopic: function() {
        var a = $(this.el).find(".follow-action .text");
        if (this.collection.topicObj) {
            if (a.hasClass("follow")) {
                $notif.showInfo($t("top-following"));
                this.collection.topicObj.set({
                    isFollowing: "true"
                });
                this.showFollowAction(true)
            } else if (a.hasClass("unfollow")) {
                $notif.showInfo($t("top-unfollowed"));
                this.collection.topicObj.set({
                    isFollowing: "false"
                });
                this.showFollowAction(false)
            }
            this.collection.topicObj.saveFollow()
        }
    }
});
TLI.NewsUpdate = TLI.NetworkUpdate.extend({
    url: function() {
        return this.buildUrl("<%- base %>/li/v1/articles/<%- id %><%- suffix %>", {
            start: 0,
            count: 10
        })
    },
    getReshareDetails: function() {
        if (this.get("links")) return this.get("links")[0]
    }
});
TLI.Topics = TLI.BaseModel.extend({
    params: {
        count: 50
    },
    url: function() {
        if (this.type) {
            this.params.type = this.type;
            return this.buildUrl("<%- base %>/li/v1/topics<%- suffix %>", this.params)
        } else return this.buildUrl("<%- base %>/li/v1/pages/topics<%- suffix %>", this.params)
    },
    following: [],
    recommended: [],
    initialize: function() {
        var a = this;
        a.bind("change",
        function() {
            a.refreshCollections()
        })
    },
    refreshCollections: function() {
        var a;
        if (this.get("following")) {
            a = new TLI.TopicCollection(_.map(this.get("following").values,
            function(b) {
                return new TLI.Topic(b)
            }));
            a.total = this.get("following").total;
            a.params.type = "following";
            this.set({
                following: a
            },
            {
                silent: true
            })
        }
        if (this.get("recommended")) {
            a = new TLI.TopicCollection(_.map(this.get("recommended").values,
            function(b) {
                return new TLI.Topic(b)
            }));
            a.total = this.get("recommended").total;
            a.params.type = "recommended";
            this.set({
                recommended: a
            },
            {
                silent: true
            })
        }
    },
    isFollowing: function(a) {
        return !! this.get("following").get(a)
    }
},
{
    successQ: [],
    isFetching: false,
    get: function(a) {
        var b = TLI.Topics,
        c = $mcache.get(b.getKey());
        if (c) a.success.call(b, c);
        else {
            b.successQ.push(a.success);
            if (!b.isFetching) {
                b.isFetching = true;
                c = new b;
                c.fetch({
                    success: function() {
                        b.set(c);
                        c.refreshCollections();
                        _.each(b.successQ,
                        function(d) {
                            d.call(b, c)
                        });
                        b.successQ.length = 0;
                        b.isFetching = false
                    },
                    error: function() {
                        b.successQ.length = 0;
                        b.isFetching = false;
                        a.error && a.error.apply(this, arguments)
                    },
                    silent: true
                })
            }
        }
    },
    set: function(a) {
        $mcache.set(TLI.Topics.getKey(), a)
    },
    getKey: function() {
        return $mcache.generateKey("topics")
    },
    getRecommended: function(a) {
        var b = new TLI.Topics;
        b.type = "recommended";
        b.fetch({
            success: function() {
                var c = new TLI.TopicCollection(_.map(b.get("values"),
                function(d) {
                    return new TLI.Topic(d)
                }));
                c.total = b.get("total");
                c.params.type = "recommended";
                a.success.call(b, c)
            },
            error: a.error,
            silent: true
        })
    },
    recStateChanged: function(a, b) {
        TLI.Topics.get({
            success: function(c) {
                if (b === "true") {
                    c.get("recommended").remove(a);
                    c.get("following").add(a)
                } else {
                    c.get("following").remove(a);
                    c.get("recommended").add(a)
                }
            }
        })
    }
});
TLI.TopicCollection = TLI.BaseCollection.extend({
    model: TLI.Topic,
    params: {
        start: 0,
        count: 50,
        since: null
    },
    group: function() {
        return [{
            group: null,
            groupItems: this.models
        }]
    },
    url: function() {
        if (this.models.length > 0) this.params.start = this.models.length;
        if (this.type) this.params.type = this.type;
        return this.buildUrl("<%- base %>/li/v1/topics<%- suffix %>", this.params)
    },
    parse: function(a) {
        var b = null;
        if (a.values) {
            b = a.values;
            this.total = a.total
        }
        return b
    }
});
TLI.Topic = TLI.BaseModel.extend({
    url: function() {
        var a = {};
        _.defaults(a, this.params);
        a.entityCode = this.get("entityCode");
        url = "<%- base %>/li/v1/topics/" + encodeURIComponent(this.get("id")) + "<%- suffix %>";
        return this.buildUrl(url, a)
    },
    saveFollow: function() {
        this.get("entityCode") && this.get("isFollowing") && this.put({
            entityCode: this.get("entityCode"),
            follow: this.get("isFollowing")
        },
        {
            success: _.bind(function() {
                TLI.Topics.recStateChanged(this, this.get("isFollowing"))
            },
            this)
        })
    }
});
TLI.NewsNusItemView = TLI.NusItemView.extend({
    tagName: "li",
    className: "nus-item simple",
    template: TLI.templates.nus.rich_item,
    events: {
        tap: "activate"
    },
    initialize: function() {
        _.bindAll(this, "render");
        this.model.bind("change", this.render);
        this.model.view = this
    },
    activate: function() {
        this.highlight(function() {
            if (!$native.isNative()) {
                var a = $mcache.generateKey("newsdetail", this.model.id),
                b = this.model.toJSON();
                $mcache.set(a, b);
                $storage.set(a, b)
            }
            $h.go("#newsdetail", this.model.get("id"))
        })
    }
});
TLI.NewsDetailView = TLI.BaseView.extend({
    className: "news-detail",
    template: TLI.templates.news.news_detail,
    events: {
        "tap .article-header, .article-image": "showArticle",
        "tap .trending li": "showTopic",
        "tap .reshare": "postToUpdate",
        "tap .email": "sendToConnection"
    },
    scrollSelector: "newsdetail-list-scroller",
    initialize: function() {},
    render: function() {
        var a = this;
        $(this.el).html(this.template({
            news: this.model
        }));
        $h.setPageContent("#newsdetail-content", $(this.el));
        this.pageLoaded();
        $h.defer(function() {
            a.refreshScroll()
        });
        return this
    },
    showArticle: function() {
        $h.goToLink(this.model.get("links")[0].url)
    },
    showTopic: function(a) {
        a = $(a.currentTarget).attr("data-index");
        a = this.model.get("trending").links[a];
        $h.go("#news", a.id)
    },
    createMessageBody: function() {
        var a = this.model.get("text") + "\n\n" + $t("news_summary") + this.model.get("text2");
        if (this.model.get("links") && this.model.get("links")[0]) a = a + "\n\n" + this.model.get("links")[0].url;
        return a
    },
    createActionMessage: function(a, b) {
        return new TLI.Message({
            body: "\n\n\n" + b,
            subject: a,
            type: TLI.Message.Types.MESSAGE
        })
    },
    sendToConnection: function() {
        var a = this.createActionMessage(this.model.get("text"), this.createMessageBody()),
        b = $mcache.generateKey("message", this.model.id);
        $mcache.set(b, a);
        $h.go("compose", "message", this.model.id)
    },
    postToUpdate: function() {
        var a = $mcache.generateKey("reshare", this.model.id);
        $mcache.set(a, this.model);
        $h.go("share", "reshare", this.model.id)
    }
});
TLI.TopicsView = TLI.CollectionView.extend({
    template: TLI.templates.news.topics,
    events: _.extend({
        "tap .all-recommended": "viewAllRecommended"
    },
    TLI.CollectionView.prototype.events),
    pageOptions: _.defaults({
        collectionSelector: "#topics-content .topics-list",
        footer: true
    },
    TLI.CollectionView.prototype.pageOptions),
    scrollSelector: "topics-list-scroller",
    initialize: function() {
        _.bindAll(this, "render")
    },
    render: function() {
        this.el = $("#topics-content");
        $h.setPageContent(this.el, this.template({
            topics: this.model,
            topicsInfo: this.model
        }));
        this.recommendedCount = this.model.get("recommended").models.length;
        this.recommendedList = this.model.get("recommended");
        this.recommended = this.recommendedList.models;
        this.MAX_RECOMMENDED = 2;
        var a = $(this.el).find(".recommended-list"),
        b = document.createElement("ul"),
        c = $(this.el).find(".recommended-header"),
        d = $(this.el).find(".following-list"),
        f = $(this.el).find(".following-header");
        document.createElement("ul");
        var e = null,
        j = this.MAX_RECOMMENDED;
        if (this.recommendedCount < this.MAX_RECOMMENDED) j = this.recommendedCount;
        else this.recommendedBackfill = this.recommended.slice(this.MAX_RECOMMENDED);
        if (this.recommendedCount === 0) {
            a.hide();
            c.hide()
        } else {
            d.show();
            f.show()
        }
        for (c = 0; c < j; c++) {
            e = this.recommended[c];
            e._position = c;
            e = (new TLI.RecommendListItemView({
                model: e,
                parentView: this
            })).render().el;
            e.id = "recommend-item-" + this.recommended[c].get("id");
            b.appendChild(e)
        }
        this.recommendedCount > 2 && $(b).append("<li class='all-recommended all-link'><div class='has-chevron body'><header><h3 class='media-heading'>" + $t("topics-more") + "</h3></header></div></li>");
        a.append($(b).children());
        this.recommendedCount <= this.MAX_RECOMMENDED ? $(this.el).find(".all-recommended").hide() : $(this.el).find(".all-recommended").show();
        TLI.CollectionView.prototype.render.apply(this);
        this.delegateEvents();
        this.pageLoaded();
        this.initDataEvents();
        return this
    },
    initDataEvents: function() {
        var a = this,
        b = this.model.get("following"),
        c = this.model.get("recommended");
        b.bind("add", _.bind(function(d) {
            a.onTopicFollowed(d)
        }));
        b.bind("remove", _.bind(function(d) {
            a.onTopicUnfollowed(d)
        }));
        c.bind("remove", _.bind(function(d) {
            a.onRecommendedChange(d)
        },
        this));
        c.bind("add", _.bind(function(d) {
            a.onRecommendedAdd(d)
        }))
    },
    onTopicUnfollowed: function(a) {
        this.model.get("following").total--;
        this.model.get("following").trigger("change:total", this.model.get("following").total);
        this.removeFollowing(a.get("entityCode") ? a.get("entityCode") : a.id)
    },
    onTopicFollowed: function(a) {
        this.model.get("following").total++;
        this.model.get("following").trigger("change:total", this.model.get("following").total);
        this.add(a)
    },
    onRecommendedAdd: function(a) {
        this.model.get("recommended").total++;
        this.model.get("recommended").trigger("change:total", this.model.get("recommended").total);
        this.addRecommended(a)
    },
    addRecommended: function(a) {
        var b = $(this.el).find(".recommended-list"),
        c = $(this.el).find(".recommended-header"),
        d = b.find("li.recommend-item"),
        f = null;
        if (d.length < 2) {
            f = (new TLI.RecommendListItemView({
                model: a,
                parentView: this
            })).render().el;
            f.id = a.get("entityCode") ? "recommend-item-" + a.get("entityCode") : "recommend-item-" + a.id;
            b.prepend(f);
            b.show();
            c.show()
        } else if (d.length === 2 && b.find("li.all-recommended").length === 0) {
            this.recommendedBackfill.push(a);
            b.append("<li class='all-recommended all-link media'><div class='has-chevron body'><header><h3 class='media-heading'>" + $t("topics-more") + "</h3></header></div></li>")
        } else this.recommendedBackfill.push(a)
    },
    onRecommendedChange: function(a) {
        var b = null;
        this.model.get("recommended").total--;
        var c = this.model.get("recommended").total;
        this.model.get("recommended").trigger("change:total", c);
        _.each(this.recommendedBackfill,
        function(d, f) {
            if (d.id === a.id) b = f
        });
        b && this.recommendedBackfill.splice(b, 1);
        this.remove(a.id)
    },
    removeFollowing: function(a) { (a = $("#topics-following-" + a)) && a.remove()
    },
    add: function(a) {
        var b = $(this.el).find(".topics-list"),
        c = null;
        c = (new TLI.FollowingListItemView({
            model: a,
            parentView: this
        })).render().el;
        c.id = a.get("entityCode") ? "topics-following-" + a.get("entityCode") : "topics-following-" + a.id;
        b.prepend(c)
    },
    remove: function(a) {
        var b = this,
        c = $(this.el).find(".recommended-list"),
        d = $(this.el).find(".recommended-header"),
        f = $(this.el).find(".all-recommended"),
        e = null;
        if ($(this.el).find("#recommend-item-" + a).length === 0) this.model.get("recommended").models.length <= this.MAX_RECOMMENDED && f.remove();
        else {
            if (this.recommendedBackfill) e = this.recommendedBackfill.pop();
            setTimeout(_.bind(function() {
                $("#recommend-item-" + a).remove();
                var j = this.model.get("recommended").models.length;
                if (j === 0) {
                    c.hide();
                    d.hide()
                } else j <= b.MAX_RECOMMENDED && f.remove();
                if (e) {
                    newRecommended = (new TLI.RecommendListItemView({
                        model: e,
                        parentView: b
                    })).render().el;
                    newRecommended.id = "recommend-item-" + e.get("id");
                    c.prepend(newRecommended)
                }
            },
            this), 600);
            this.refreshScroll()
        }
    },
    viewAllRecommended: function() {
        $h.go("#topics/recommends")
    },
    getNodeCollection: function() {
        return this.model.get("following")
    },
    getCollectionNode: function(a) {
        if (!a.get("name")) return null;
        return (new TLI.FollowingListItemView({
            model: a,
            id: this.getFollowingNodeId(a)
        })).render().el
    },
    getFollowingNodeId: function(a) {
        return a.get("entityCode") ? "topics-following-" + a.get("entityCode") : "topics-following-" + a.id
    },
    highlight: function(a) {
        var b = this;
        $(this.el).find(".all-recommended").addClass("active");
        setTimeout(function() {
            $(b.el).find(".all-recommended").removeClass("active");
            a.apply(b)
        },
        100)
    }
},
{
    hasRendered: function() {
        return !! $("#topics-list-scroller").length
    },
    tearDown: function() {}
});
TLI.RecommendListItemView = TLI.BaseView.extend({
    tagName: "li",
    className: "recommend-item has-controls",
    template: TLI.templates.shared.recommend_item,
    events: {
        tap: "viewTopic",
        "tap .follow": "followTopic"
    },
    initialize: function() {
        _.bindAll(this, "render");
        this.model.bind("change", this.render);
        this.model.view = this
    },
    render: function() {
        this.el.id = "recommend-item-" + this.model.id;
        $(this.el).html(this.template({
            recommend: this.model
        }));
        return this
    },
    followTopic: function() {
        $notif.showInfo($t("top-following"));
        this.model.set({
            isFollowing: "true"
        });
        this.model.saveFollow()
    },
    viewTopic: function(a) {
        $(a.target).hasClass("follow") || $h.go("#news", this.model.id)
    },
    highlight: function(a) {
        var b = this;
        $(this.el).addClass("active");
        setTimeout(function() {
            $(b.el).removeClass("active");
            a.apply(b)
        },
        100)
    }
});
TLI.FollowingListItemView = TLI.BaseView.extend({
    tagName: "li",
    className: "following-item has-chevron",
    template: TLI.templates.shared.following_item,
    events: {
        tap: "viewTopic"
    },
    initialize: function() {
        _.bindAll(this, "render");
        this.model.bind("change", this.render);
        this.model.view = this
    },
    render: function() {
        this.el.id = this.model.get("entityCode") ? "topics-following-" + this.model.get("entityCode") : "topics-following-" + this.model.id;
        $(this.el).html(this.template({
            following: this.model
        }));
        return this
    },
    viewTopic: function() {
        $h.go("#news", this.model.id)
    },
    highlight: function(a) {
        var b = this;
        $(this.el).addClass("active");
        setTimeout(function() {
            $(b.el).removeClass("active");
            a.apply(b)
        },
        100)
    }
});
TLI.RecommendedTopicsView = TLI.CollectionView.extend({
    template: TLI.templates.news.topicrecommends,
    scrollSelector: "topicrecommends-list-scroller",
    pageOptions: _.defaults({
        collectionSelector: "#topicrecommends .topicrecommends-list"
    },
    TLI.CollectionView.prototype.pageOptions),
    initialize: function() {
        _.bindAll(this, "render");
        $(this.el).html(this.template({
            recommends: this.collection
        }));
        $h.setPageContent("#topicrecommends-content", $(this.el))
    },
    render: function() {
        TLI.CollectionView.prototype.render.apply(this);
        this.pageLoaded();
        this.collection.bind("remove", _.bind(function(a) {
            this.remove(a.id)
        },
        this));
        this.collection.bind("add", _.bind(function(a) {
            this.add(a)
        },
        this));
        return this
    },
    getCollectionNode: function(a) {
        return (new TLI.RecommendListItemView({
            model: a,
            collection: this.collection
        })).render().el
    },
    getNodeCollection: function() {
        return this.collection
    },
    add: function(a) {
        var b = $(this.el).find(".topicrecommends-list");
        b.find("li.recommend-item");
        var c = null;
        c = (new TLI.RecommendListItemView({
            model: a,
            parentView: this
        })).render().el;
        c.id = a.get("entityCode") ? "recommend-item-" + a.get("entityCode") : "recommend-item-" + a.id;
        b.prepend(c)
    },
    remove: function(a) {
        a = $(this.el).find("#recommend-item-" + a);
        a.addClass("removing");
        a.remove();
        this.refreshScroll()
    }
},
{
    hasRendered: function() {
        return !! $("#topicrecommends-content").html().replace(/\s/g, "").length
    }
});