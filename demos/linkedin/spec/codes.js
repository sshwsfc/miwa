
(function() {
    var a = window.Crypto = {},
    b = a.util = {
        rotl: function(d, f) {
            return d << f | d >>> 32 - f
        },
        rotr: function(d, f) {
            return d << 32 - f | d >>> f
        },
        endian: function(d) {
            if (d.constructor == Number) return b.rotl(d, 8) & 16711935 | b.rotl(d, 24) & 4278255360;
            for (var f = 0; f < d.length; f++) d[f] = b.endian(d[f]);
            return d
        },
        randomBytes: function(d) {
            for (var f = []; d > 0; d--) f.push(Math.floor(Math.random() * 256));
            return f
        },
        bytesToWords: function(d) {
            for (var f = [], e = 0, j = 0; e < d.length; e++, j += 8) f[j >>> 5] |= d[e] << 24 - j % 32;
            return f
        },
        wordsToBytes: function(d) {
            for (var f = [], e = 0; e < d.length * 32; e += 8) f.push(d[e >>> 5] >>> 24 - e % 32 & 255);
            return f
        },
        bytesToHex: function(d) {
            for (var f = [], e = 0; e < d.length; e++) {
                f.push((d[e] >>> 4).toString(16));
                f.push((d[e] & 15).toString(16))
            }
            return f.join("")
        },
        hexToBytes: function(d) {
            for (var f = [], e = 0; e < d.length; e += 2) f.push(parseInt(d.substr(e, 2), 16));
            return f
        },
        bytesToBase64: function(d) {
            if (typeof btoa == "function") return btoa(c.bytesToString(d));
            for (var f = [], e = 0; e < d.length; e += 3) for (var j = d[e] << 16 | d[e + 1] << 8 | d[e + 2], n = 0; n < 4; n++) e * 8 + n * 6 <= d.length * 8 ? f.push("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt(j >>> 6 * (3 - n) & 63)) : f.push("=");
            return f.join("")
        },
        base64ToBytes: function(d) {
            if (typeof atob == "function") return c.stringToBytes(atob(d));
            d = d.replace(/[^A-Z0-9+\/]/ig, "");
            for (var f = [], e = 0, j = 0; e < d.length; j = ++e % 4) j != 0 && f.push(("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".indexOf(d.charAt(e - 1)) & Math.pow(2, -2 * j + 8) - 1) << j * 2 | "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".indexOf(d.charAt(e)) >>> 6 - j * 2);
            return f
        }
    };
    a = a.charenc = {};
    a.UTF8 = {
        stringToBytes: function(d) {
            return c.stringToBytes(unescape(encodeURIComponent(d)))
        },
        bytesToString: function(d) {
            return decodeURIComponent(escape(c.bytesToString(d)))
        }
    };
    var c = a.Binary = {
        stringToBytes: function(d) {
            for (var f = [], e = 0; e < d.length; e++) f.push(d.charCodeAt(e) & 255);
            return f
        },
        bytesToString: function(d) {
            for (var f = [], e = 0; e < d.length; e++) f.push(String.fromCharCode(d[e]));
            return f.join("")
        }
    }
})();
(function() {
    var a = Crypto,
    b = a.util,
    c = a.charenc,
    d = c.UTF8,
    f = c.Binary,
    e = a.SHA1 = function(j, n) {
        var r = b.wordsToBytes(e._sha1(j));
        return n && n.asBytes ? r: n && n.asString ? f.bytesToString(r) : b.bytesToHex(r)
    };
    e._sha1 = function(j) {
        if (j.constructor == String) j = d.stringToBytes(j);
        var n = b.bytesToWords(j),
        r = j.length * 8;
        j = [];
        var w = 1732584193,
        t = -271733879,
        z = -1732584194,
        A = 271733878,
        E = -1009589776;
        n[r >> 5] |= 128 << 24 - r % 32;
        n[(r + 64 >>> 9 << 4) + 15] = r;
        for (r = 0; r < n.length; r += 16) {
            for (var x = w, k = t, m = z, o = A, v = E, g = 0; g < 80; g++) {
                if (g < 16) j[g] = n[r + g];
                else {
                    var i = j[g - 3] ^ j[g - 8] ^ j[g - 14] ^ j[g - 16];
                    j[g] = i << 1 | i >>> 31
                }
                i = (w << 5 | w >>> 27) + E + (j[g] >>> 0) + (g < 20 ? (t & z | ~t & A) + 1518500249 : g < 40 ? (t ^ z ^ A) + 1859775393 : g < 60 ? (t & z | t & A | z & A) - 1894007588 : (t ^ z ^ A) - 899497514);
                E = A;
                A = z;
                z = t << 30 | t >>> 2;
                t = w;
                w = i
            }
            w += x;
            t += k;
            z += m;
            A += o;
            E += v
        }
        return [w, t, z, A, E]
    };
    e._blocksize = 16;
    e._digestsize = 20
})();