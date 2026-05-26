/* =========================================================
   SMS Varanasi — Landing page interactions
   ========================================================= */

(function () {
    'use strict';

    /* ---------- Helpers ---------- */
    const $ = (sel, scope = document) => scope.querySelector(sel);
    const $$ = (sel, scope = document) => Array.from(scope.querySelectorAll(sel));

    /* ---------- Sticky header shadow on scroll ---------- */
    const header = $('#siteHeader');
    if (header) {
        const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
        document.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    /* ---------- Modal ---------- */
    const modal = $('#brochureModal');
    let modalShown = false;
    const openModal = (preselectCourse) => {
        if (!modal) return;
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        modalShown = true;

        if (preselectCourse) {
            const sel = $('#m-course');
            if (sel) sel.value = preselectCourse;
        }

        // focus first field
        setTimeout(() => {
            const firstInput = modal.querySelector('input, select');
            firstInput && firstInput.focus();
        }, 200);
    };
    const closeModal = () => {
        if (!modal) return;
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    };

    /* ---------- Auto-open inquiry modal after 15s (once per session) ---------- */
    const AUTO_OPEN_KEY = 'sms_auto_modal_shown';
    const AUTO_OPEN_DELAY = 15000;
    if (modal && !sessionStorage.getItem(AUTO_OPEN_KEY)) {
        const timer = setTimeout(() => {
            // Don't pop if user already opened it manually or any form is in success state
            const anySuccessVisible = $$('.form-success').some(el => !el.hidden);
            if (!modalShown && !anySuccessVisible && !modal.classList.contains('open')) {
                openModal();
                sessionStorage.setItem(AUTO_OPEN_KEY, '1');
            }
        }, AUTO_OPEN_DELAY);

        // If user opens the modal manually before timer fires, cancel auto-open
        $$('[data-modal-open]').forEach(btn => {
            btn.addEventListener('click', () => {
                clearTimeout(timer);
                sessionStorage.setItem(AUTO_OPEN_KEY, '1');
            }, { once: true });
        });
    }

    $$('[data-modal-open]').forEach(btn => {
        btn.addEventListener('click', e => {
            e.preventDefault();
            const preselect = btn.getAttribute('data-preselect');
            openModal(preselect);
        });
    });
    $$('[data-modal-close]').forEach(btn => btn.addEventListener('click', closeModal));

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && modal && modal.classList.contains('open')) {
            closeModal();
        }
    });

    /* ---------- FAQ / Accordion: only one open at a time per group ---------- */
    const setupSingleOpen = (selector) => {
        const items = $$(selector);
        items.forEach(item => {
            item.addEventListener('toggle', () => {
                if (item.open) {
                    items.forEach(other => {
                        if (other !== item) other.open = false;
                    });
                }
            });
        });
    };
    setupSingleOpen('#whyAccordion .acc-item');
    setupSingleOpen('.faq-list .faq-item');

    /* ---------- Video poster: replace with embedded YouTube player on click ---------- */
    const videoThumb = $('#videoThumb');
    if (videoThumb) {
        videoThumb.addEventListener('click', () => {
            const videoId = videoThumb.dataset.videoId || 'Mp_B5c56sA8';
            const iframe = document.createElement('iframe');
            iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
            iframe.title = 'SMS Varanasi Campus Tour';
            iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
            iframe.allowFullscreen = true;
            iframe.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0;';
            videoThumb.innerHTML = '';
            videoThumb.appendChild(iframe);
            videoThumb.style.cursor = 'default';
        });
    }

    /* ---------- Form validation + submission ---------- */
    const showToast = (msg = 'Form submitted successfully!') => {
        const toast = $('#toast');
        if (!toast) return;
        const msgEl = toast.querySelector('.toast-msg');
        if (msgEl) msgEl.textContent = msg;
        toast.hidden = false;
        requestAnimationFrame(() => toast.classList.add('show'));
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => { toast.hidden = true; }, 300);
        }, 3200);
    };

    const validateField = (field) => {
        const value = field.value.trim();
        let isValid = true;

        if (!value) {
            isValid = false;
        } else if (field.type === 'email') {
            isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        } else if (field.type === 'tel') {
            isValid = /^[0-9]{10}$/.test(value);
        }

        field.classList.toggle('error', !isValid);
        return isValid;
    };

    const handleFormSubmit = (form) => {
        const fields = $$('input[required], select[required]', form);
        let allValid = true;

        fields.forEach(field => {
            if (!validateField(field)) allValid = false;
        });

        if (!allValid) {
            const firstError = form.querySelector('.error');
            firstError && firstError.focus();
            showToast('Please fill all fields correctly.');
            return;
        }

        // Gather data
        const data = {};
        new FormData(form).forEach((v, k) => { data[k] = v; });
        // Hidden meta (mirrors the original WP form payload)
        data.AuthToken = 'SMSVARANASI-11-03-2021';
        data.Source = 'smsvaranasi';
        data.LeadType = 'Online';
        data.LeadName = 'aajneeti Google ads';
        data.LeadSource = 'SMSadword';

        // === Replace with real API call ===
        // fetch('/api/inquiry', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) })

        console.log('[SMS Varanasi] Inquiry submitted:', data);

        // Show success state
        const successEl = form.parentElement.querySelector('.form-success');
        form.style.display = 'none';
        if (successEl) successEl.hidden = false;
        showToast('Thank you! Your brochure is on the way.');

        // Reset after 6s so user can submit again
        setTimeout(() => {
            form.reset();
            form.style.display = '';
            if (successEl) successEl.hidden = true;
        }, 6000);
    };

    $$('.inquiry-form').forEach(form => {
        form.addEventListener('submit', e => {
            e.preventDefault();
            handleFormSubmit(form);
        });

        // Live validation: clear error as user fixes the field
        $$('input, select', form).forEach(field => {
            field.addEventListener('input', () => {
                if (field.classList.contains('error')) validateField(field);
            });
            field.addEventListener('blur', () => {
                if (field.value.trim()) validateField(field);
            });
        });

        // Phone: digits only
        const phone = form.querySelector('input[type="tel"]');
        if (phone) {
            phone.addEventListener('input', () => {
                phone.value = phone.value.replace(/\D/g, '').slice(0, 10);
            });
        }
    });

    /* ---------- Animated counters for placement stats ---------- */
    const animateCount = (el) => {
        const target = parseInt(el.dataset.target || '0', 10);
        const duration = 1500;
        const start = performance.now();
        const step = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            // ease-out
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(target * eased).toLocaleString();
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    };

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCount(entry.target);
                counterObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.4 });

    $$('.p-num[data-target]').forEach(el => counterObserver.observe(el));

    /* ---------- Mobile menu ---------- */
    const navToggle = $('#navToggle');
    const mobileMenu = $('#mobileMenu');
    const mobileBackdrop = $('#mobileMenuBackdrop');
    const mmClose = $('#mmClose');

    const closeMobileMenu = () => {
        if (!mobileMenu) return;
        mobileMenu.classList.remove('open');
        mobileBackdrop && mobileBackdrop.classList.remove('open');
        navToggle && navToggle.classList.remove('open');
        mobileMenu.setAttribute('aria-hidden', 'true');
        mobileBackdrop && mobileBackdrop.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    };

    const openMobileMenu = () => {
        if (!mobileMenu) return;
        mobileMenu.classList.add('open');
        mobileBackdrop && mobileBackdrop.classList.add('open');
        navToggle && navToggle.classList.add('open');
        mobileMenu.setAttribute('aria-hidden', 'false');
        mobileBackdrop && mobileBackdrop.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    };

    if (navToggle && mobileMenu) {
        navToggle.addEventListener('click', openMobileMenu);
        mmClose && mmClose.addEventListener('click', closeMobileMenu);
        mobileBackdrop && mobileBackdrop.addEventListener('click', closeMobileMenu);
        $$('#mobileMenu a, #mobileMenu .btn').forEach(el => {
            el.addEventListener('click', closeMobileMenu);
        });
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && mobileMenu.classList.contains('open')) closeMobileMenu();
        });
    }

    /* ---------- Sliders (active only on mobile via CSS media query) ---------- */
    const mobileSliderMQ = window.matchMedia('(max-width: 820px)');

    $$('.slider').forEach(slider => {
        const track = $('.slider-track', slider);
        const prev = $('.slider-prev', slider);
        const next = $('.slider-next', slider);
        const dotsWrap = $('.slider-dots', slider);
        if (!track) return;

        const isSliderMode = () => mobileSliderMQ.matches;

        const updateState = () => {
            if (!isSliderMode()) return;
            const max = track.scrollWidth - track.clientWidth - 2;
            if (prev) prev.disabled = track.scrollLeft <= 2;
            if (next) next.disabled = track.scrollLeft >= max;

            if (dotsWrap && dotsWrap.children.length) {
                const ratio = max > 0 ? track.scrollLeft / max : 0;
                const idx = Math.round(ratio * (dotsWrap.children.length - 1));
                Array.from(dotsWrap.children).forEach((d, i) => {
                    d.classList.toggle('active', i === idx);
                });
            }
        };

        const getStep = () => {
            const first = track.children[0];
            if (!first) return track.clientWidth * 0.8;
            const gap = parseFloat(getComputedStyle(track).gap) || 0;
            return first.getBoundingClientRect().width + gap;
        };

        const scrollByCards = (n) => {
            track.scrollBy({ left: getStep() * n, behavior: 'smooth' });
        };

        prev && prev.addEventListener('click', () => scrollByCards(-1));
        next && next.addEventListener('click', () => scrollByCards(1));
        track.addEventListener('scroll', updateState, { passive: true });

        const buildDots = () => {
            if (!dotsWrap) return;
            dotsWrap.innerHTML = '';
            if (!isSliderMode()) return;
            const step = getStep();
            if (step <= 0) return;
            const total = track.children.length;
            const visible = Math.max(1, Math.round(track.clientWidth / step));
            const pages = Math.max(1, total - visible + 1);
            if (pages <= 1) return;
            for (let i = 0; i < pages; i++) {
                const dot = document.createElement('button');
                dot.className = 'slider-dot';
                dot.type = 'button';
                dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
                dot.addEventListener('click', () => {
                    track.scrollTo({ left: step * i, behavior: 'smooth' });
                });
                dotsWrap.appendChild(dot);
            }
        };

        buildDots();
        updateState();

        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => { buildDots(); updateState(); }, 150);
        });
    });

    /* ---------- Smooth scroll for in-page anchors ---------- */
    $$('a[href^="#"]').forEach(link => {
        const href = link.getAttribute('href');
        if (href.length <= 1) return;
        link.addEventListener('click', (e) => {
            const target = document.querySelector(href);
            if (!target) return;
            e.preventDefault();
            const headerH = header ? header.offsetHeight : 0;
            const y = target.getBoundingClientRect().top + window.scrollY - headerH - 8;
            window.scrollTo({ top: y, behavior: 'smooth' });
        });
    });

    /* ---------- Reveal on scroll (subtle) ---------- */
    const revealEls = [
        ...$$('.program-card'),
        ...$$('.aff-card'),
        ...$$('.p-stat'),
        ...$$('.testimonial')
    ];
    if ('IntersectionObserver' in window && revealEls.length) {
        revealEls.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s cubic-bezier(.2,.8,.2,1)';
        });
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry, idx) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }, idx * 60);
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12 });
        revealEls.forEach(el => revealObserver.observe(el));
    }

})();
