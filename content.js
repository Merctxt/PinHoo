// Pin Hoo - Browse Pinterest anonymously without login
(function() {
    'use strict';

    let observer = null;
    let makingChanges = false;
    let debounceTimer = null;

    // ─── Helpers to pause/resume observer ───────────────────────────────

    function pauseObserver() {
        if (observer) {
            makingChanges = true;
            observer.disconnect();
        }
    }

    function resumeObserver() {
        makingChanges = false;
        if (observer) {
            observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['style', 'class']
            });
        }
    }

    /**
     * Run a function safely without triggering observer feedback loops.
     * Pauses the observer, runs the function, then resumes the observer.
     */
    function safely(fn) {
        pauseObserver();
        try { fn(); } catch (e) { console.warn('[PinHoo]', e); }
        resumeObserver();
    }

    // ─── Remove signup blocker ──────────────────────────────────────────

    function removeSignupBlocker() {
        const signupModal = document.querySelector('div[data-test-id="fullPageSignupModal"]');
        if (signupModal) {
            const trapFocusInside = signupModal.querySelectorAll('div[name="trap-focus"]');
            trapFocusInside.forEach(el => el.remove());
            signupModal.remove();
        }

        const trapFocusElements = document.querySelectorAll('div[name="trap-focus"]');
        trapFocusElements.forEach(el => el.remove());

        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        document.body.style.position = '';
        document.documentElement.style.position = '';

        document.querySelectorAll('style').forEach(style => {
            if (style.textContent.includes('overflow') && style.textContent.includes('hidden')) {
                style.textContent = style.textContent
                    .replace(/body\s*\{[^}]*?overflow\s*:\s*hidden[^}]*?\}/gi, '')
                    .replace(/html\s*\{[^}]*?overflow\s*:\s*hidden[^}]*?\}/gi, '');
            }
        });
    }

    // ─── Download helpers ───────────────────────────────────────────────

    function getPinImageUrl() {
        const selectors = [
            'div[data-test-id="pin-closeup-image"] img',
            'div[data-test-id="closeup-image"] img',
            'div[data-test-id="pin-closeup"] img',
            '[data-test-id="pin-closeup-image"] img',
            'div[data-test-id="carousel-modal"] img'
        ];

        for (const sel of selectors) {
            const img = document.querySelector(sel);
            if (img) {
                const srcset = img.getAttribute('srcset');
                if (srcset) {
                    const sources = srcset.split(',')
                        .map(s => s.trim().split(/\s+/))
                        .filter(s => s.length >= 2)
                        .sort((a, b) => parseInt(b[1]) - parseInt(a[1]));
                    if (sources.length > 0) return sources[0][0];
                }
                const src = img.getAttribute('src');
                if (src) return src;
            }
        }
        return null;
    }

    function getPinId() {
        const match = window.location.pathname.match(/\/pin\/(\d+)/);
        return match ? match[1] : null;
    }

    function downloadImage(url, pinId) {
        const filename = pinId ? `pin-${pinId}` : 'pinterest-pin';

        fetch(url, { mode: 'cors', credentials: 'omit' })
            .then(res => {
                if (!res.ok) throw new Error('Fetch failed');
                return res.blob();
            })
            .then(blob => {
                const ext = blob.type === 'image/png' ? '.png' : '.jpg';
                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = filename + ext;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
            })
            .catch(() => {
                window.open(url, '_blank');
            });
    }

    // ─── Download button interceptor ────────────────────────────────────

    function setupDownloadInterceptor() {
        const downloadBtn = document.querySelector(
            'button[data-test-id="pin-action-dropdown-download"], ' +
            '[data-test-id="pin-action-dropdown-download"]'
        );

        if (!downloadBtn || downloadBtn.dataset.pinHooReady) return;

        downloadBtn.dataset.pinHooReady = 'true';

        // Clone to remove all existing listeners, then re-attach our handler
        const newBtn = downloadBtn.cloneNode(true);
        downloadBtn.parentNode.replaceChild(newBtn, downloadBtn);

        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            const imageUrl = getPinImageUrl();
            const pinId = getPinId();

            if (imageUrl) {
                downloadImage(imageUrl, pinId);
            } else {
                const anyImage = document.querySelector(
                    'img[src*="i.pinimg.com"][src*="/originals/"], ' +
                    'img[src*="i.pinimg.com"][src*="/736x/"], ' +
                    'img[src*="i.pinimg.com"]'
                );
                if (anyImage) downloadImage(anyImage.src, pinId);
            }
        });
    }

    function setupDownloadFeatures() {
        setupDownloadInterceptor();
    }

    // ─── Check if a mutation added relevant elements ────────────────────

    function hasRelevantNodes(mutations) {
        const relevantSelectors = [
            'div[data-test-id="fullPageSignupModal"]',
            'div[name="trap-focus"]',
            '[data-test-id="pin-action-dropdown-download"]'
        ];

        for (const mutation of mutations) {
            if (mutation.type === 'attributes') return true; // style/class changes
            for (const node of mutation.addedNodes) {
                if (node.nodeType === 1) {
                    const el = node;
                    // Check if the added node itself matches
                    for (const sel of relevantSelectors) {
                        if (el.matches && el.matches(sel)) return true;
                        if (el.querySelector && el.querySelector(sel)) return true;
                    }
                }
            }
        }
        return false;
    }

    // ─── Debounced handler ──────────────────────────────────────────────

    function onMutation(mutations) {
        if (makingChanges) return;
        if (!hasRelevantNodes(mutations)) return;

        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            safely(() => {
                removeSignupBlocker();
                setupDownloadFeatures();
            });
        }, 200);
    }

    // ─── Init ───────────────────────────────────────────────────────────

    // Run once on page load (no observer running yet, so no loop risk)
    removeSignupBlocker();
    setupDownloadFeatures();

    // Start observer with debounce and relevance check
    observer = new MutationObserver(onMutation);
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
    });
})();