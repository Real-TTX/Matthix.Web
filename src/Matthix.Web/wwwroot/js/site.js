(function () {
    "use strict";

    var root = document.documentElement;
    var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ---------------------------------------------------------------
       Theme toggle (persisted in localStorage)
    --------------------------------------------------------------- */
    var themeToggle = document.getElementById("theme-toggle");
    if (themeToggle) {
        themeToggle.addEventListener("click", function () {
            var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
            root.setAttribute("data-theme", next);
            try { localStorage.setItem("matthix-theme", next); } catch (e) { /* ignore */ }
        });
    }

    /* ---------------------------------------------------------------
       Sticky header shadow after scroll
    --------------------------------------------------------------- */
    var masthead = document.getElementById("masthead");
    var onScroll = function () {
        if (masthead) {
            masthead.classList.toggle("is-scrolled", window.scrollY > 24);
        }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    /* ---------------------------------------------------------------
       Scroll reveal
    --------------------------------------------------------------- */
    var revealEls = document.querySelectorAll(".reveal");
    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
        revealEls.forEach(function (el) { el.classList.add("is-visible"); });
    } else {
        var revealObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

        revealEls.forEach(function (el, i) {
            el.style.transitionDelay = Math.min(i % 4, 3) * 70 + "ms";
            revealObserver.observe(el);
        });
    }

    /* ---------------------------------------------------------------
       Active nav link based on section in view
    --------------------------------------------------------------- */
    var navLinks = Array.prototype.slice.call(document.querySelectorAll("[data-nav-link]"));
    var sections = navLinks
        .map(function (link) {
            var id = link.getAttribute("href").replace("#", "");
            return document.getElementById(id);
        })
        .filter(Boolean);

    if (sections.length && "IntersectionObserver" in window) {
        var navObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    navLinks.forEach(function (link) {
                        link.classList.toggle(
                            "is-active",
                            link.getAttribute("href") === "#" + entry.target.id
                        );
                    });
                }
            });
        }, { threshold: 0.5 });
        sections.forEach(function (section) { navObserver.observe(section); });
    }

    /* ---------------------------------------------------------------
       Network constellation background
       (nods to "Netzwerke" — nodes linked by proximity, drifting)
    --------------------------------------------------------------- */
    var canvas = document.getElementById("network-canvas");
    if (!canvas || prefersReducedMotion) {
        return;
    }

    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var nodes = [];
    var width = 0;
    var height = 0;
    var pointer = { x: -9999, y: -9999 };
    var rafId = null;

    var css = function (name) {
        return getComputedStyle(root).getPropertyValue(name).trim();
    };

    var resize = function () {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + "px";
        canvas.style.height = height + "px";
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        var target = Math.round((width * height) / 24000);
        var count = Math.max(28, Math.min(90, target));
        nodes = [];
        for (var i = 0; i < count; i++) {
            nodes.push({
                x: pseudoRandom() * width,
                y: pseudoRandom() * height,
                vx: (pseudoRandom() - 0.5) * 0.28,
                vy: (pseudoRandom() - 0.5) * 0.28,
                r: pseudoRandom() * 1.6 + 0.8
            });
        }
    };

    // Small deterministic-ish PRNG so we don't depend on Math.random availability quirks.
    var seed = 20260714;
    function pseudoRandom() {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        return seed / 0x7fffffff;
    }

    var LINK_DIST = 132;

    var draw = function () {
        ctx.clearRect(0, 0, width, height);
        var lineColor = css("--net-line") || "rgba(120,205,210,0.22)";
        var dotColor = css("--net-dot") || "rgba(120,220,226,0.55)";

        for (var i = 0; i < nodes.length; i++) {
            var n = nodes[i];
            n.x += n.vx;
            n.y += n.vy;

            if (n.x < 0 || n.x > width) n.vx *= -1;
            if (n.y < 0 || n.y > height) n.vy *= -1;

            // gentle pointer repulsion
            var pdx = n.x - pointer.x;
            var pdy = n.y - pointer.y;
            var pd2 = pdx * pdx + pdy * pdy;
            if (pd2 < 14000 && pd2 > 0.01) {
                var f = (14000 - pd2) / 14000 * 0.9;
                var pd = Math.sqrt(pd2);
                n.x += (pdx / pd) * f;
                n.y += (pdy / pd) * f;
            }

            for (var j = i + 1; j < nodes.length; j++) {
                var m = nodes[j];
                var dx = n.x - m.x;
                var dy = n.y - m.y;
                var dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < LINK_DIST) {
                    ctx.globalAlpha = (1 - dist / LINK_DIST) * 0.8;
                    ctx.strokeStyle = lineColor;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(n.x, n.y);
                    ctx.lineTo(m.x, m.y);
                    ctx.stroke();
                }
            }
        }

        ctx.globalAlpha = 1;
        ctx.fillStyle = dotColor;
        for (var k = 0; k < nodes.length; k++) {
            var node = nodes[k];
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
            ctx.fill();
        }

        rafId = window.requestAnimationFrame(draw);
    };

    window.addEventListener("resize", function () {
        window.cancelAnimationFrame(rafId);
        resize();
        rafId = window.requestAnimationFrame(draw);
    });

    window.addEventListener("pointermove", function (e) {
        pointer.x = e.clientX;
        pointer.y = e.clientY;
    }, { passive: true });

    window.addEventListener("pointerleave", function () {
        pointer.x = -9999;
        pointer.y = -9999;
    });

    // Pause the animation when the tab is hidden to save resources.
    document.addEventListener("visibilitychange", function () {
        if (document.hidden) {
            window.cancelAnimationFrame(rafId);
        } else {
            rafId = window.requestAnimationFrame(draw);
        }
    });

    resize();
    rafId = window.requestAnimationFrame(draw);
})();
