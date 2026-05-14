(function () {
    'use strict';

    // ---------- Reading progress bar ----------
    const progressBar = document.createElement('div');
    progressBar.id = 'reading-progress';
    document.body.prepend(progressBar);

    let rafId = null;
    function updateProgress() {
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrolled = window.scrollY;
        const progress = docHeight > 0 ? (scrolled / docHeight) * 100 : 0;
        progressBar.style.width = progress + '%';
        rafId = null;
    }
    function onScroll() {
        if (rafId === null) rafId = requestAnimationFrame(updateProgress);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    updateProgress();

    // ---------- Section counter (X / N) ----------
    const sectionHeadings = Array.from(document.querySelectorAll('.post-content h2'));
    let counterEl = null;
    let counterCurrentEl = null;
    if (sectionHeadings.length) {
        counterEl = document.createElement('button');
        counterEl.id = 'section-counter';
        counterEl.type = 'button';
        counterEl.setAttribute('aria-label', 'Otwórz spis treści');
        counterEl.innerHTML =
            '<span class="sc-label">Sekcja</span>' +
            '<span class="sc-current">0</span>' +
            '<span class="sc-sep">/</span>' +
            '<span class="sc-total">' + sectionHeadings.length + '</span>';
        document.body.appendChild(counterEl);
        counterCurrentEl = counterEl.querySelector('.sc-current');

        counterEl.addEventListener('click', (e) => {
            e.stopPropagation();
            const tocEl = document.querySelector('details.toc');
            if (!tocEl) return;
            tocEl.setAttribute('open', '');
            const summary = tocEl.querySelector('summary');
            if (summary) summary.focus();
        });
    }

    function updateSectionCounter() {
        if (!counterEl) return;
        const offset = 140;
        let activeIdx = 0;
        for (let i = 0; i < sectionHeadings.length; i++) {
            if (sectionHeadings[i].getBoundingClientRect().top - offset <= 0) {
                activeIdx = i + 1;
            } else {
                break;
            }
        }
        if (activeIdx === 0) {
            counterEl.classList.remove('visible');
        } else {
            counterEl.classList.add('visible');
            if (counterCurrentEl.textContent !== String(activeIdx)) {
                counterCurrentEl.textContent = activeIdx;
            }
        }
    }

    let counterRaf = null;
    function onCounterScroll() {
        if (counterRaf === null) {
            counterRaf = requestAnimationFrame(() => {
                updateSectionCounter();
                counterRaf = null;
            });
        }
    }
    window.addEventListener('scroll', onCounterScroll, { passive: true });
    window.addEventListener('resize', onCounterScroll);
    updateSectionCounter();

    // ---------- TOC scroll-spy ----------
    const tocLinks = Array.from(document.querySelectorAll('.toc a[href^="#"]'));
    if (!tocLinks.length) return;

    const entries = [];
    tocLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (!href || href.length < 2) return;
        try {
            const id = decodeURIComponent(href.slice(1));
            const heading = document.getElementById(id);
            if (heading) entries.push({ link, heading });
        } catch (e) { /* ignore malformed */ }
    });
    if (!entries.length) return;

    function updateActive() {
        const offset = 120;
        let activeIdx = -1;
        for (let i = 0; i < entries.length; i++) {
            if (entries[i].heading.getBoundingClientRect().top - offset <= 0) {
                activeIdx = i;
            } else {
                break;
            }
        }
        tocLinks.forEach(a => a.classList.remove('active'));
        if (activeIdx >= 0) entries[activeIdx].link.classList.add('active');
    }

    let activeRaf = null;
    window.addEventListener('scroll', () => {
        if (activeRaf === null) {
            activeRaf = requestAnimationFrame(() => {
                updateActive();
                activeRaf = null;
            });
        }
    }, { passive: true });
    updateActive();

    // ---------- Glossary terms (tap + flip) ----------
    const terms = Array.from(document.querySelectorAll('.post-content .term'));
    if (terms.length) {
        function closeAllTerms(except) {
            terms.forEach(t => { if (t !== except) t.classList.remove('term-open'); });
        }

        function positionTerm(t) {
            const def = t.querySelector('.term-def');
            if (!def) return;
            t.classList.remove('term-flip');
            const rect = t.getBoundingClientRect();
            const defHeight = def.offsetHeight;
            if (rect.top - defHeight - 20 < 0) {
                t.classList.add('term-flip');
            }
        }

        terms.forEach(t => {
            t.addEventListener('mouseenter', () => positionTerm(t));
            t.addEventListener('focus', () => positionTerm(t));
            t.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const wasOpen = t.classList.contains('term-open');
                closeAllTerms(t);
                if (!wasOpen) {
                    positionTerm(t);
                    t.classList.add('term-open');
                } else {
                    t.classList.remove('term-open');
                }
            });
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.term')) closeAllTerms(null);
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeAllTerms(null);
        });
    }

    // ---------- Floating TOC panel UX ----------
    const tocEl = document.querySelector('details.toc');
    if (!tocEl) return;

    // Close when clicking a link
    tocEl.addEventListener('click', (e) => {
        if (e.target.closest('a[href^="#"]')) {
            tocEl.removeAttribute('open');
        }
    });

    // Close on ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && tocEl.hasAttribute('open')) {
            tocEl.removeAttribute('open');
            const summary = tocEl.querySelector('summary');
            if (summary) summary.focus();
        }
    });

    // Close when clicking outside the panel
    document.addEventListener('click', (e) => {
        if (!tocEl.hasAttribute('open')) return;
        if (tocEl.contains(e.target)) return;
        tocEl.removeAttribute('open');
    });
})();
