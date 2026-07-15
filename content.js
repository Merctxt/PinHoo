// Pin Hoo - Browse Pinterest anonymously without login
(function() {
    'use strict';

    function removeLoginModal() {
        // Remove the full-page signup modal and trap-focus elements
        const modal = document.querySelector('div[data-test-id="fullPageSignupModal"]');
        if (modal) {
            modal.querySelectorAll('div[name="trap-focus"]').forEach(el => el.remove());
            modal.remove();
        }

        // Remove any standalone trap-focus elements
        document.querySelectorAll('div[name="trap-focus"]').forEach(el => el.remove());

        // Remove injected <style> that forces overflow:hidden with !important
        const styleEl = document.querySelector(
            '#__PWS_ROOT__ > div:nth-child(2) > style:nth-child(4)'
        );
        if (styleEl && styleEl.textContent.includes('overflow')) {
            styleEl.remove();
        }

        // Reset scroll — Pinterest locks body/html with overflow:hidden + position:fixed
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        document.body.style.position = '';
        document.documentElement.style.position = '';
    }

    function checkStopModals() {
        const checkbox = document.querySelector('#StopModalsRequest');
        if (checkbox && !checkbox.checked) {
            checkbox.click();
        }
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

    // ─── Observer for dynamic content ──────────────────────────────────

    const observer = new MutationObserver(() => {
        checkStopModals();
        removeLoginModal();
        setupDownloadInterceptor();
    });

    // ─── Init ───────────────────────────────────────────────────────────

    checkStopModals();
    removeLoginModal();
    setupDownloadInterceptor();

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();