TLI.canvas = {
    retinaFix: function(a, b) {
        if (window.devicePixelRatio && a && b) {
            var c = $(a).width() || a.width,
            d = $(a).height() || a.height,
            f = c + "px",
            e = d + "px",
            j = window.devicePixelRatio;
            $(a).attr("width", c * j).attr("height", d * j);
            $(a).css("width", f).css("height", e);
            b.scale(j, j);
            return b
        } else return false
    },
    CanvasManager: function() {
        if (typeof TLI.canvas.CanvasManager.instance !== "undefined") return TLI.canvas.CanvasManager.instance;
        TLI.canvas.imageManifest = {};
        return TLI.canvas.CanvasManager.instance = this
    },
    add: function(a, b) {
        var c, d, f;
        new TLI.canvas.CanvasManager("search");
        var e = b.insert || document.body,
        j = b.height.replace(/[A-Za-z]/g, "") || "30",
        n = b.width.replace(/[A-Za-z]/g, "") || "30",
        r = b.top,
        w = b.left,
        t = b.right,
        z = b.bottom,
        A = b.innerHtml,
        E = b.className,
        x = document.getElementById(b.canvasEl);
        if (!x) {
            x = document.createElement("canvas");
            f = function() {
                return "canvas-" + a + "-" + Math.floor(Math.random() * 1E3)
            };
            c = f();
            if ($("#" + c).get(0)) x.id = f();
            x.id = c
        }
        x.width = n;
        x.height = j;
        if (A) x.innerHTML = A;
        if (E) x.className = E;
        if (r || z || w || t) {
            x.style.position = "absolute";
            if (r) x.style.top = r.replace(/[A-Za-z]/g, "") + "px";
            if (z) x.style.bottom = z.replace(/[A-Za-z]/g, "") + "px";
            if (w) x.style.left = w.replace(/[A-Za-z]/g, "") + "px";
            if (t) x.style.right = t.replace(/[A-Za-z]/g, "") + "px"
        }
        d = function() {
            typeof e === "function" ? e(x) : $(e).get(0).appendChild(x)
        };
        d();
        $(document).bind("li:pageLoaded",
        function() {
            d()
        });
        c = x.getContext("2d");
        TLI.canvas.retinaFix(x, c);
        TLI.canvas[a](c);
        return x
    }
};
TLI.canvas.drawHandle = function() {
    function a(j) {
        j.moveTo(0, 8.7);
        j.bezierCurveTo(18.3, 8.7, 28.2, 16.2, 45.2, 16.2);
        j.bezierCurveTo(62.2, 16.2, 72, 8.7, 90.3, 8.7);
        j.shadowOffsetX = 0;
        j.shadowOffsetY = 2 * devicePixelRatio;
        if ($os.android) {
            j.shadowOffsetY *= -1;
            j.shadowBlur = devicePixelRatio;
            j.shadowOffsetY++
        } else j.shadowBlur = 2 * devicePixelRatio;
        return j
    }
    var b = 5,
    c, d, f, e;
    c = document.getElementById("drawer-handle");
    d = document.getElementById("drawer-handle-open");
    if (c && d) {
        closedContext = c.getContext("2d");
        f = d.getContext("2d");
        devicePixelRatio = window.devicePixelRatio || 1;
        e = 1 * devicePixelRatio;
        TLI.canvas.retinaFix(c, closedContext);
        TLI.canvas.retinaFix(d, f);
        closedContext.fillStyle = "#d2cfca";
        closedContext.beginPath();
        a(closedContext);
        closedContext.shadowColor = "#000";
        closedContext.fill();
        closedContext.fillStyle = "#807e7c";
        closedContext.beginPath();
        closedContext.moveTo(32, 0 + b);
        closedContext.lineTo(57, 0 + b);
        closedContext.lineTo(44.5, 6 + b);
        closedContext.shadowOffsetX = 0;
        closedContext.shadowOffsetY = e;
        closedContext.shadowBlur = 0;
        closedContext.shadowColor = "#fff";
        closedContext.fill();
        f.fillStyle = "#403E3D";
        f.beginPath();
        a(f);
        f.shadowColor = "#000";
        f.fill();
        b = 0;
        f.fillStyle = "#BAB7B4";
        f.beginPath();
        f.moveTo(32, 6 + b);
        f.lineTo(57, 6 + b);
        f.lineTo(44.5, 0 + b);
        f.shadowOffsetX = 0;
        f.shadowOffsetY = e;
        f.shadowBlur = 0;
        f.shadowColor = "#000";
        f.fill()
    }
};
TLI.canvas.navBug = function() {
    var a = document.getElementById("linkedin-logo"),
    b = a.getContext("2d");
    TLI.canvas.retinaFix(a, b);
    a = b.globalAlpha;
    var c;
    b.save();
    b.save();
    b.beginPath();
    b.moveTo(28.4, 26.3);
    b.bezierCurveTo(28.4, 27.4, 27.5, 28.4, 26.4, 28.4);
    b.lineTo(2.4, 28.4);
    b.bezierCurveTo(1.3, 28.4, 0.4, 27.4, 0.4, 26.3);
    b.lineTo(0.4, 2.4);
    b.bezierCurveTo(0.4, 1.3, 1.3, 0.4, 2.4, 0.4);
    b.lineTo(26.4, 0.4);
    b.bezierCurveTo(27.5, 0.4, 28.4, 1.3, 28.4, 2.4);
    b.lineTo(28.4, 26.3);
    b.closePath();
    c = b.createLinearGradient(14.4, 28.4, 14.4, 0.4);
    c.addColorStop(0.28, "rgb(0, 100, 153)");
    c.addColorStop(0.38, "rgb(11, 109, 160)");
    c.addColorStop(0.58, "rgb(42, 133, 177)");
    c.addColorStop(0.84, "rgb(93, 171, 206)");
    c.addColorStop(1, "rgb(128, 198, 225)");
    b.fillStyle = c;
    b.fill();
    b.beginPath();
    b.moveTo(28.4, 26.3);
    b.bezierCurveTo(28.4, 27.4, 27.5, 28.4, 26.4, 28.4);
    b.lineTo(2.4, 28.4);
    b.bezierCurveTo(1.3, 28.4, 0.4, 27.4, 0.4, 26.3);
    b.lineTo(0.4, 2.4);
    b.bezierCurveTo(0.4, 1.3, 1.3, 0.4, 2.4, 0.4);
    b.lineTo(26.4, 0.4);
    b.bezierCurveTo(27.5, 0.4, 28.4, 1.3, 28.4, 2.4);
    b.lineTo(28.4, 26.3);
    b.closePath();
    b.lineWidth = 0.8;
    b.strokeStyle = "rgb(31, 100, 149)";
    b.lineJoin = "miter";
    b.miterLimit = 4;
    b.stroke();
    b.restore();
    b.save();
    b.globalAlpha = a * 0.1;
    b.globalAlpha = a * 1;
    b.save();
    b.save();
    b.beginPath();
    b.moveTo(4.5, 10.9);
    b.lineTo(8.7, 10.9);
    b.lineTo(8.7, 24.2);
    b.lineTo(4.5, 24.2);
    b.lineTo(4.5, 10.9);
    b.closePath();
    b.moveTo(6.6, 4.2);
    b.bezierCurveTo(7.9, 4.2, 9, 5.3, 9, 6.6);
    b.bezierCurveTo(9, 8, 7.9, 9, 6.6, 9);
    b.bezierCurveTo(5.3, 9, 4.2, 8, 4.2, 6.6);
    b.bezierCurveTo(4.2, 5.3, 5.3, 4.2, 6.6, 4.2);
    b.fillStyle = "rgb(255, 255, 255)";
    b.fill();
    b.beginPath();
    b.moveTo(11.3, 10.9);
    b.lineTo(15.3, 10.9);
    b.lineTo(15.3, 12.7);
    b.lineTo(15.3, 12.7);
    b.bezierCurveTo(15.9, 11.6, 17.2, 10.5, 19.2, 10.5);
    b.bezierCurveTo(23.4, 10.5, 24.2, 13.3, 24.2, 16.9);
    b.lineTo(24.2, 24.2);
    b.lineTo(20.1, 24.2);
    b.lineTo(20.1, 17.7);
    b.bezierCurveTo(20.1, 16.2, 20, 14.2, 17.9, 14.2);
    b.bezierCurveTo(15.8, 14.2, 15.4, 15.9, 15.4, 17.6);
    b.lineTo(15.4, 24.2);
    b.lineTo(11.3, 24.2);
    b.lineTo(11.3, 10.9);
    b.closePath();
    b.fill();
    b.fillStyle = "#807e7c";
    b.beginPath();
    b.moveTo(8, 32);
    b.lineTo(20, 32);
    b.lineTo(14, 36);
    b.shadowOffsetX = 0;
    b.shadowOffsetY = 2;
    b.shadowBlur = 0;
    b.shadowColor = "#fff";
    b.fill()
};
TLI.canvas.search = function(a) {
    a.save();
    a.beginPath();
    a.moveTo(16, 14.5);
    a.lineTo(11.9, 10.5);
    a.bezierCurveTo(12.7, 9.4, 13.2, 8.1, 13.2, 6.6);
    a.bezierCurveTo(13.2, 3, 10.3, 0, 6.6, 0);
    a.bezierCurveTo(3, 0, 0, 3, 0, 6.6);
    a.bezierCurveTo(0, 10.3, 3, 13.2, 6.6, 13.2);
    a.bezierCurveTo(7.9, 13.2, 9, 12.9, 10, 12.2);
    a.lineTo(14.2, 16.4);
    a.lineTo(16, 14.5);
    a.closePath();
    a.moveTo(1.9, 6.6);
    a.bezierCurveTo(1.9, 4, 4, 1.9, 6.6, 1.9);
    a.bezierCurveTo(9.2, 1.9, 11.3, 4, 11.3, 6.6);
    a.bezierCurveTo(11.3, 9.2, 9.2, 11.3, 6.6, 11.3);
    a.bezierCurveTo(4, 11.3, 1.9, 9.2, 1.9, 6.6);
    a.closePath();
    a.fillStyle = "rgb(173, 173, 173)";
    a.fill();
    a.restore();
    return a
};