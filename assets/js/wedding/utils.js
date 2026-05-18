/**
 * Shared utilities for the wedding invite app.
 */
(function initWeddingUtils(global) {
    'use strict';

    const WeddingInvite = global.WeddingInvite = global.WeddingInvite || {};

    WeddingInvite.utils = {
        refreshAos() {
            if (typeof global.AOS !== 'undefined') {
                global.AOS.refresh();
            }
        },

        getHeaderOffset() {
            const header = document.getElementById('header');
            return header ? header.offsetHeight : 0;
        },

        closeMobileNav() {
            document.body.classList.remove('mobile-nav-active');
            const mobileNavShow = document.querySelector('.mobile-nav-show');
            const mobileNavHide = document.querySelector('.mobile-nav-hide');
            if (mobileNavShow) {
                mobileNavShow.classList.remove('d-none');
            }
            if (mobileNavHide) {
                mobileNavHide.classList.add('d-none');
            }
        },

        setFilterActive(container, selector, activeElement) {
            if (!container || !activeElement) {
                return;
            }
            container.querySelectorAll(selector).forEach((element) => {
                element.classList.remove('filter-active', 'active');
            });
            activeElement.classList.add('filter-active', 'active');
        }
    };
})(typeof window !== 'undefined' ? window : globalThis);
