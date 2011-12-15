
TLI.UI = {};
(function(a) {
    a.cssTransitions = "WebKitTransitionEvent" in window;
    a.activePage = null;
    a.activePageClass = "ui-page-active active-page";
    a.pageContainer = null;
    a.historyStack = {
        _stack: [],
        push: function(c) {
            this._stack.push(c)
        },
        pop: function() {
            return this._stack.pop()
        },
        peek: function() {
            return this._stack[this._stack.length - 2]
        }
    };
    var b = null;
    a.pageLock = function(c) {
        if (!c) {
            if (b && b.test()) {
                b.locked.call(this, window.location.hash);
                return true
            }
            b = null;
            return false
        }
        return b = c
    };
    a.clearPageLock = function() {
        b = null
    };
    a.animationComplete = function(c, d) {
        if (a.cssTransitions) return $(c).one("webkitAnimationEnd", d);
        else {
            setTimeout(d, 0);
            return $(this)
        }
    };
    a.animateTo = function(c, d, f, e, j) {
        var n = a.activePage,
        r = $ui.body;
        if (n.length) n.addClass(f + " out " + (e ? "reverse": ""));
        r.addClass("transitioning");
        d.addClass(a.activePageClass + " " + f + " in " + (e ? "reverse": ""));
        a.animationComplete(d,
        function() {
            d.removeClass(f + " in out reverse");
            n.removeClass(a.activePageClass + " " + f + " in out reverse");
            r.removeClass("transitioning");
            j && j.call(d)
        })
    };
    a.isTransitioning = function() {
        return $ui.body.hasClass("transitioning")
    };
    a.detectResolutionBreakpoints = function() {
        var c = $("html"),
        d = [320, 480, 768, 1024],
        f = $(document.body).width(),
        e = [],
        j = [],
        n;
        c.removeClass("min-width-" + d.join("px min-width-") + "px max-width-" + d.join("px max-width-") + "px");
        _.each(d,
        function(r, w) {
            f >= w && e.push("min-width-" + w + "px");
            f <= w && j.push("max-width-" + w + "px")
        });
        if (e.length) n = e.join(" ");
        if (j.length) n += " " + j.join(" ");
        c.addClass(n)
    };
    a.showActionSheet = function(c) {
        if (! (!c || !c.actions || $native.isNative() || $("#action_overlay").length)) {
            $h.hideAllKeyboards();
            $(TLI.templates.shared.action_sheet(c)).appendTo($ui.pageContainer);
            var d = $("#action_overlay"),
            f = function() {
                d.css({
                    height: $(document.body).height() + "px",
                    top: window.innerHeight + document.body.scrollTop + "px"
                })
            };
            $("#action_backdrop").css({
                height: $(document.body).height() + "px"
            });
            f();
            var e = d.find(".sheet");
            _.each(c.actions,
            function(j) {
                var n = $("<div class='text'>" + j.text + "</div>");
                n.appendTo(e);
                n.bind("click",
                function() {
                    a.removeActionSheet();
                    if (j.tap) typeof j.tap === "function" ? j.tap.call(this) : $h.go(j.tap);
                    return false
                })
            });
            a.asOrientationHandler = function() {
                f()
            };
            $(window).bind("orientationchange", a.asOrientationHandler);
            $h.defer(function() {
                d.addClass("in");
                d.css({
                    "-webkit-transform": "translate3d(0, -" + (e.height() + 50) + "px, 0)"
                })
            })
        }
    };
    a.removeActionSheet = function() {
        if (a.asOrientationHandler) {
            $(window).unbind("orientationchange", a.asOrientationHandler);
            a.asOrientationHandler = null
        }
        $("#action_overlay").remove();
        $("#action_backdrop").remove()
    }
})(TLI.UI);