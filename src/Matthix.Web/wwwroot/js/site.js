(function () {
    "use strict";

    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ---------------------------------------------------------------
       Masthead scroll-progress hairline (scaleX = scroll ratio)
    --------------------------------------------------------------- */
    var progress = document.getElementById("scroll-progress");
    var pTicking = false;
    function updateProgress() {
        pTicking = false;
        if (!progress) return;
        var doc = document.documentElement;
        var max = doc.scrollHeight - doc.clientHeight;
        var ratio = max > 0 ? doc.scrollTop / max : 0;
        progress.style.transform = "scaleX(" + Math.min(1, Math.max(0, ratio)).toFixed(4) + ")";
    }
    window.addEventListener("scroll", function () {
        if (!pTicking) { pTicking = true; window.requestAnimationFrame(updateProgress); }
    }, { passive: true });
    updateProgress();

    /* ---------------------------------------------------------------
       Active nav link via IntersectionObserver
    --------------------------------------------------------------- */
    var navLinks = Array.prototype.slice.call(document.querySelectorAll("[data-nav-link]"));
    var navTargets = navLinks
        .map(function (l) { return document.getElementById(l.getAttribute("href").replace("#", "")); })
        .filter(Boolean);
    if (navTargets.length && "IntersectionObserver" in window) {
        var navObs = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (e.isIntersecting) {
                    navLinks.forEach(function (l) {
                        l.classList.toggle("is-active", l.getAttribute("href") === "#" + e.target.id);
                    });
                }
            });
        }, { threshold: 0, rootMargin: "-48% 0px -48% 0px" });
        navTargets.forEach(function (t) { navObs.observe(t); });
    }

    /* ---------------------------------------------------------------
       The living signature
    --------------------------------------------------------------- */
    var signature = document.querySelector(".signature");
    if (reduce || !signature) return; // static, fully-drawn fallback via CSS

    var inkGroup = signature.querySelector(".sig-ink-group");
    var ink = signature.querySelector(".sig-ink");
    var glint = signature.querySelector(".sig-glint");
    var brandMark = document.querySelector(".brand-mark");
    var hero = document.getElementById("home");
    var finePointer = window.matchMedia("(pointer: fine)").matches;

    // Masthead mark starts faint; it "signs" solid when the hero scrolls away.
    if (brandMark) brandMark.classList.add("is-pending");

    var glintOn = false;
    var glintOffset = 0;
    var heroVisible = true;
    var signedOff = false;

    // hand off from the CSS draw-on to the perpetual travelling glint
    if (ink) {
        ink.addEventListener("animationend", startGlint, { once: true });
        // safety net if animationend does not fire
        window.setTimeout(startGlint, 3200);
    } else {
        startGlint();
    }
    function startGlint() {
        if (glintOn) return;
        glintOn = true;
        if (glint) glint.style.opacity = "1";
    }

    // wet-ink cursor lean (fine pointers only)
    var target = { x: 0, y: 0 };
    var cur = { x: 0, y: 0 };
    if (finePointer) {
        window.addEventListener("pointermove", function (e) {
            var r = signature.getBoundingClientRect();
            if (!r.width) return;
            var dx = (e.clientX - (r.left + r.width / 2)) / r.width;
            var dy = (e.clientY - (r.top + r.height / 2)) / r.height;
            target.x = Math.max(-1, Math.min(1, dx));
            target.y = Math.max(-1, Math.min(1, dy));
        }, { passive: true });
        document.addEventListener("pointerleave", function () { target.x = 0; target.y = 0; });
    }

    // sign-off: park the masthead mark the first time the hero leaves view;
    // pause the glint while the hero is offscreen to save work.
    if (hero && "IntersectionObserver" in window) {
        new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                heroVisible = e.isIntersecting;
                if (!e.isIntersecting && !signedOff) {
                    signedOff = true;
                    if (brandMark) { brandMark.classList.remove("is-pending"); brandMark.classList.add("is-parked"); }
                }
            });
        }, { threshold: 0 }).observe(hero);
    }

    var last = 0;
    function frame(t) {
        var dt = last ? Math.min(48, t - last) : 16;
        last = t;

        // lean lerp -> transform the ink group (ghost stays put for a wet offset)
        cur.x += (target.x - cur.x) * 0.08;
        cur.y += (target.y - cur.y) * 0.08;
        if (inkGroup) {
            inkGroup.style.transform =
                "translate(" + (cur.x * 10).toFixed(2) + "px," + (cur.y * 10).toFixed(2) + "px) " +
                "skewX(" + (cur.x * 4).toFixed(2) + "deg)";
        }

        // travelling glint
        if (glintOn && heroVisible && glint) {
            glintOffset -= dt / 9000;
            if (glintOffset <= -1) glintOffset += 1;
            glint.style.strokeDashoffset = glintOffset.toFixed(4);
        }

        window.requestAnimationFrame(frame);
    }
    window.requestAnimationFrame(frame);
})();
