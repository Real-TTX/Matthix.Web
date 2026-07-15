(function () {
    "use strict";

    /* ---------------------------------------------------------------
       Masthead scroll-progress hairline (scaleX = scroll ratio).
       One throttled rAF listener drives it.
    --------------------------------------------------------------- */
    var progress = document.getElementById("scroll-progress");
    var ticking = false;

    function updateProgress() {
        ticking = false;
        if (!progress) return;
        var doc = document.documentElement;
        var max = doc.scrollHeight - doc.clientHeight;
        var ratio = max > 0 ? doc.scrollTop / max : 0;
        progress.style.transform = "scaleX(" + Math.min(1, Math.max(0, ratio)).toFixed(4) + ")";
    }

    window.addEventListener("scroll", function () {
        if (!ticking) {
            ticking = true;
            window.requestAnimationFrame(updateProgress);
        }
    }, { passive: true });
    updateProgress();

    /* ---------------------------------------------------------------
       Active section -> nav underline + live gutter-rail readout.
    --------------------------------------------------------------- */
    var railSection = document.getElementById("rail-section");
    var navLinks = Array.prototype.slice.call(document.querySelectorAll("[data-nav-link]"));
    var sections = Array.prototype.slice.call(document.querySelectorAll("[data-rail]"));

    function setActive(id) {
        navLinks.forEach(function (link) {
            link.classList.toggle("is-active", link.getAttribute("href") === "#" + id);
        });
    }

    if (sections.length && "IntersectionObserver" in window) {
        // Activate a section when it crosses a thin band around the viewport middle,
        // which stays robust even for sections taller than the viewport.
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    var section = entry.target;
                    if (railSection && section.dataset.rail) {
                        railSection.textContent = section.dataset.rail;
                    }
                    setActive(section.id);
                }
            });
        }, { threshold: 0, rootMargin: "-48% 0px -48% 0px" });

        sections.forEach(function (section) { observer.observe(section); });
    }
})();
