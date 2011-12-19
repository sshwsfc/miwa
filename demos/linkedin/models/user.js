TLI.Person = TLI.BaseModel.extend({
    url: function() {
        return this.buildUrl("<%- base %>/li/v1/people/<%- id %>/profile<%- suffix %>", {
            authToken: this.get("authToken")
        })
    },
    parse: function(a) {
        return a.person
    },
    fullName: function(a) {
        a || (a = 15);
        var b = this.get("formattedName");
        return b && b.length ? $h.breakWords($h.summarize(b, a * 2)) : [$h.summarize(this.get("firstName"), a), $h.summarize(this.get("lastName"), a)].join(" ")
    },
    phoneticName: function(a) {
        a || (a = 50);
        var b = this.get("formattedPhoneticName");
        if (b && b.length) return $h.breakWords($h.summarize(b, a));
        return null
    },
    pictureUrl: function() {
        var a = this.get("picture");
        return a ? a: "images/nophoto.png"
    },
    distanceWithOrdinal: function() {
        if (this._distanceWithOrdinal) return this._distanceWithOrdinal;
        var a = null,
        b = this.get("distance");
        if (b) {
            var c = b.toString();
            a = [b];
            if (c.match(/11$/) || c.match(/12$/) || c.match(/13$/)) a.push("th");
            else if (c.match(/1$/)) a.push("st");
            else if (c.match(/2$/)) a.push("nd");
            else c.match(/3$/) ? a.push("rd") : a.push("th")
        }
        return this._distanceWithOrdinal = a
    },
    primaryPhoneNumber: function() {
        var a = this.get("phoneNumbers"),
        b = null;
        if (a && a.length) {
            a = a[0];
            for (var c in a) {
                b = a[c];
                break
            }
        }
        return b
    },
    getHeadline: function() {
        return this.fullName() ? this.fullName() : this.get("headline")
    },
    sendInviteWithoutEmail: function(a) {
        var b = new TLI.Message;
        b.set({
            type: TLI.Message.Types.INVITATION_NOEMAIL,
            to: this.get("id"),
            authToken: this.get("authToken"),
            subject: $t("inv-subject"),
            body: $t("inv-body")
        });
        $notif.showInfo($t("inv-sending"));
        b.save(null, {
            success: function() {
                a.$(".controls .connect").addClass("disabled");
                $(a.el).find(".controls .connect").remove();
                $notif.showInfo($t("inv-sent"))
            }
        })
    },
    saveToMemory: function() {
        if (!$native.isNative()) {
            var a = $mcache.generateKey("person", this.get("id"));
            $mcache.set(a, this.toJSON())
        }
    }
});
TLI.User = TLI.Person.extend({
    url: function() {
        return this.buildUrl(TLI.config.authUrl)
    },
    fullName: function() {
        return this.get("firstName") + " " + this.get("lastName")
    },
    views: function() {
        return ""
    },
    isAuthenticated: function() {
        return !! this.get("authToken")
    },
    validateForAuthentication: function() {
        var a = this.get("username"),
        b = this.get("password");
        if (! (a && a.length > 0 && b && b.length > 0)) return "Username and password are required.";
        return null
    },
    authenticate: function(a) {
        this.directAuthenticate(a)
    },
    directAuthenticate: function(a) {
        var b = this;
        if (typeof a == "undefined" || a === null) a = {};
        var c = a.success,
        d = a.error,
        f = b.validateForAuthentication();
        if (f) d && setTimeout(function() {
            d.call(b, f)
        },
        0);
        else {
            a = typeof b.url === "function" ? b.url() : b.url;
            $.ajax({
                url: a,
                type: "GET",
                cache: false,
                data: {
                    username: b.get("username"),
                    password: b.get("password")
                },
                dataType: "json",
                success: function(e) {
                    if (e.authToken) {
                        b.set({
                            password: null
                        });
                        b.set(e);
                        c && c.call(b, b)
                    } else d && d.call(b, $t("login-fail"))
                },
                error: function() {
                    d && d.call(b, $t("login-fail"))
                }
            })
        }
    },
    hasTwitter: function() {
        return this.get("twitter")
    },
    updateTwitterHandle: function(a) {
        if (a) {
            var b = this.hasTwitter();
            if (b) b !== a && this.set({
                twitter: a
            });
            else this.set({
                twitter: a
            })
        }
    },
    getTwitterHandle: function() {
        var a = this.hasTwitter();
        return a ? "@" + a: false
    },
    fetchSettings: function() { (new TLI.UserSettings).fetch({
            success: _.bind(function(a, b) {
                this.updateTwitterHandle(b.twitter)
            },
            this)
        })
    }
},
{
    CURRENT_USER_KEY: "TLI:currentUser",
    currentUser: null,
    getCurrentUser: function() {
        if (!TLI.User.currentUser) {
            var a = $storage.get(TLI.User.CURRENT_USER_KEY);
            if (a) {
                TLI.User.currentUser = new TLI.User(a);
                TLI.User.currentUser.saveToMemory()
            }
        }
        return TLI.User.currentUser
    },
    setCurrentUser: function(a) {
        a ? $storage.set(TLI.User.CURRENT_USER_KEY, a.attributes) : $storage.set(TLI.User.CURRENT_USER_KEY, null);
        this.resetAppState();
        TLI.User.currentUser = a
    },
    updateCurrentUser: function(a) {
        a && $storage.set(TLI.User.CURRENT_USER_KEY, a.attributes)
    },
    resetAppState: function() {
        $mcache.clear();
        $(".page").each(function(a, b) {
            b.id !== "login" && $(b).remove()
        })
    },
    logout: function() {
        $h.deleteCookie("linkedin");
        $h.deleteCookie("lim_auth");
        $h.deleteCookie("liuser");
        TLI.User.setCurrentUser(null)
    },
    isLoggedIn: function() {
        return !! TLI.User.getCurrentUser() && (!document.cookie || document.cookie.indexOf("linkedin") > -1 || document.cookie.indexOf("lim_auth") > -1 || $config.env === "test")
    }
});
TLI.PymkPerson = TLI.Person.extend({
    url: function() {
        return this.buildUrl("<%- base %>/li/v1/people/<%- id %><%- suffix %>")
    },
    connect: function(a) {
        var b = this.get("authToken");
        this.id = this.get("id");
        this.clear({
            silent: true
        });
        this.set({
            pymk: "accept",
            authToken: b
        });
        this.save(null, a)
    },
    discard: function(a) {
        this.id = this.get("id");
        this.clear({
            silent: true
        });
        this.set({
            pymk: "decline"
        });
        this.save(null, a)
    }
});
TLI.Profile = TLI.BaseModel.extend({
    url: function() {
        return this.buildUrl("<%- base %>/li/v1/people/<%- id %>/profile<%- suffix %>", {
            authToken: this.get("authToken")
        })
    },
    initialize: function() {
        var a = this;
        TLI.BaseModel.prototype.initialize.apply(this);
        a.bind("change",
        function() {
            a.refreshChildren()
        })
    },
    parse: function(a) {
        var b = new TLI.Person(a.person),
        c = new TLI.ProfileDetails(_.map(a.detail,
        function(f) {
            return new TLI.ProfileSection(f)
        })),
        d = TLI.InCommon.prototype.hash.apply({
            id: a.person.id
        });
        $mcache.set(d, a.incommon);
        a.person = b;
        a.detail = c;
        return a
    },
    refreshChildren: function() {
        this.person = new TLI.Person(this.get("person"))
    },
    saveToMemory: function() {
        if (!$native.isNative()) {
            var a = $mcache.generateKey("profile", this.get("person").id),
            b = this.toJSON();
            $mcache.set(a, b)
        }
    }
});
TLI.ProfileDetails = TLI.BaseCollection.extend({
    model: TLI.ProfileSection,
    params: {
        count: 300
    },
    url: function() {
        return this.buildUrl("<%- base %>/li/v1/people/<%- id %>/profile<%- suffix %>", {
            authToken: this.get("authToken")
        })
    },
    parse: function(a) {
        return a
    },
    group: function() {
        return [{
            group: null,
            groupItems: this.models
        }]
    }
});
TLI.ProfileSection = TLI.BaseModel.extend({
    SIMPLE: "pdt1",
    EXPERIENCE: "pdt2",
    LIST: "pdt3",
    BLURB: "pdt4"
});