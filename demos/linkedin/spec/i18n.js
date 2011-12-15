
TLI.I18n = {};
(function(a) {
    a.DEFAULT_LOCALE = "en";
    a.translate = function(b) {
        var c = /\{(\d)\}/g,
        d = arguments,
        f = b;
        if (TLI.currentLocale && TLI.currentLocale[b]) {
            f = TLI.currentLocale[b].replace(c,
            function(e, j) {
                var n = parseInt(j, 10);
                if (!isNaN(n) && n > 0 && n < d.length && d[n] !== null && d[n] !== undefined) return d[n].toString();
                return e
            });
            f = _.template(f)()
        }
        return f
    };
    a.register = function(b, c) {
        TLI.locales[b] = c
    };
    a.setLocale = function(b, c) {
        var d = TLI.locales[b];
        if (!d) {
            d = TLI.locales[TLI.config.defaultLocale];
            TLI.Logging.error("Attempt to set a nonexistent locale")
        }
        TLI.currentLocale = d;
        for (loadedName in TLI.locales) if (loadedName !== b) TLI.locales[loadedName] = null;
        c && setTimeout(c, 0)
    }
})(TLI.I18n);
TLI.locales = {};