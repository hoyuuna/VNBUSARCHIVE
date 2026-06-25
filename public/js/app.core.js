
        const DEFAULT_AVATAR = 'https://files.catbox.moe/zzh1q1.png';

window.apiFetch = async function(action, payload, options = {}) {
    let token = null;
    if (window.sb && window.sb.auth) {
        const { data: { session } } = await window.sb.auth.getSession();
        token = session?.access_token;
    }
    const response = await fetch('/api/core', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload, token }),
        signal: options.signal
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data;
};


        // =====================================
        // === CODE Báº®T Lá»–I CONSOLE Tá»° Äá»˜NG ===
        // =====================================
        window._consoleErrors = [];
        const originalConsoleError = console.error;
        const originalConsoleLog = console.log;
        const originalConsoleWarn = console.warn;
        const originalConsoleInfo = console.info;

        // CÆ¡ cháº¿ Ã‰P Cáº£nh bÃ¡o phÃ¡p lÃ½ luÃ´n á»Ÿ dÆ°á»›i cÃ¹ng
        let securityWarningTimeout;
        const printSecurityWarning = () => {
            const cssWarning = "color: red; font-size: 24px; font-weight: bold; text-shadow: 1px 1px black;";
            const cssText = "color: #fff; font-size: 14px; font-weight: 500; line-height: 1.5;";
            const cssLaw = "color: #ffcc00; font-size: 13px; font-style: italic;";

            originalConsoleLog("%câš ï¸ Cáº¢NH BÃO Báº¢O Máº¬T & PHÃP LÃ / SECURITY WARNING âš ï¸", cssWarning);
            originalConsoleLog(
                "%c\nâ€¢ Dá»«ng láº¡i ngay! Má»i hÃ nh vi dÃ² quÃ©t lá»— há»•ng, xÃ¢m nháº­p trÃ¡i phÃ©p, hoáº·c tá»± Ä‘á»™ng cÃ o dá»¯ liá»‡u táº¡i há»‡ thá»‘ng nÃ y Ä‘á»u bá»‹ NGHIÃŠM Cáº¤M.\n",
                cssText
            );
            originalConsoleLog(
                "%c[HÃ€NH VI VI PHáº M Sáº¼ Bá»Š Xá»¬ LÃ THEO PHÃP LUáº¬T VIá»†T NAM]:\n" +
                "- Äiá»u 287 BLHS: Tá»™i cáº£n trá»Ÿ hoáº·c gÃ¢y rá»‘i loáº¡n hoáº¡t Ä‘á»™ng cá»§a máº¡ng mÃ¡y tÃ­nh (Táº¥n cÃ´ng DoS/DDoS) - Pháº¡t tÃ¹ lÃªn Ä‘áº¿n 12 nÄƒm.\n" +
                "- Äiá»u 288 BLHS: Tá»™i Ä‘Æ°a hoáº·c sá»­ dá»¥ng trÃ¡i phÃ©p thÃ´ng tin máº¡ng mÃ¡y tÃ­nh (Scrape/Crawl) - Pháº¡t tiá»n Ä‘áº¿n 1 tá»· hoáº·c pháº¡t tÃ¹ Ä‘áº¿n 7 nÄƒm.\n" +
                "- Äiá»u 289 BLHS: Tá»™i xÃ¢m nháº­p trÃ¡i phÃ©p vÃ o máº¡ng mÃ¡y tÃ­nh cá»§a ngÆ°á»i khÃ¡c (Hack/Báº» khÃ³a) - Pháº¡t tÃ¹ lÃªn Ä‘áº¿n 12 nÄƒm.\n" +
                "- Nghá»‹ Ä‘á»‹nh 13/2023/NÄ-CP: Vi pháº¡m báº£o vá»‡ dá»¯ liá»‡u cÃ¡ nhÃ¢n.\n",
                cssLaw
            );
        };

        const triggerBottomWarning = () => {
            clearTimeout(securityWarningTimeout);
            // Äá»£i 500ms sau log cuá»‘i cÃ¹ng Ä‘á»ƒ chÃ¨n cáº£nh bÃ¡o xuá»‘ng Ä‘Ã¡y
            securityWarningTimeout = setTimeout(printSecurityWarning, 500);
        };

        // Ghi Ä‘Ã¨ toÃ n bá»™ cÃ¡c hÃ m log Ä‘á»ƒ báº¯t tÃ­n hiá»‡u
        console.error = function(...args) {
            try {
                const logString = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
                window._consoleErrors.push(logString);
                if (window._consoleErrors.length > 15) window._consoleErrors.shift();
            } catch (e) {}
            originalConsoleError.apply(console, args);
            triggerBottomWarning();
        };

        console.log = function(...args) { originalConsoleLog.apply(console, args); triggerBottomWarning(); };
        console.warn = function(...args) { originalConsoleWarn.apply(console, args); triggerBottomWarning(); };
        console.info = function(...args) { originalConsoleInfo.apply(console, args); triggerBottomWarning(); };

        window.addEventListener('error', function(e) {
            console.error(`[Global Error] ${e.message} at ${e.filename}:${e.lineno}`);
        });
        window.addEventListener('unhandledrejection', function(e) {
            console.error(`[Unhandled Promise] ${e.reason}`);
        });

        // In láº§n Ä‘áº§u tiÃªn khi trang báº¯t Ä‘áº§u táº£i
        printSecurityWarning();
        // =====================================


window.app = window.app || {};

window.app.toast = {
                currentOfflineToast: null,
                
                show: (type, title, message, duration = 10000, onClickAction = null) => {
                    const container = document.getElementById('toast-container');
                    if (!container) return null;

                    const toast = document.createElement('div');
                    toast.className = 'toast-card toast-enter bg-white/90 backdrop-blur-xl border border-gray-200 shadow-2xl rounded-2xl p-4 flex items-start gap-3 w-11/12 max-w-sm cursor-pointer mx-auto';

                    let iconHtml = '';
                    if (type === 'success') {
                        iconHtml = '<div class="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0 border border-green-100 shadow-sm"><i class="fa-solid fa-check text-sm"></i></div>';
                    } else if (type === 'error' || type === 'offline') {
                        iconHtml = `<div class="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100 shadow-sm"><i class="fa-solid ${type === 'offline' ? 'fa-wifi-slash' : 'fa-triangle-exclamation'} text-sm"></i></div>`;
                    } else if (type === 'heart') {
                        iconHtml = '<div class="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100 shadow-sm"><i class="fa-solid fa-heart text-sm"></i></div>';
                    } else {
                        iconHtml = '<div class="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 shadow-sm"><i class="fa-solid fa-bell text-sm"></i></div>';
                    }

                    toast.innerHTML = `
                        ${iconHtml}
                        <div class="flex-1 overflow-hidden pointer-events-none select-none">
                            <h4 class="text-sm font-bold text-gray-900 leading-tight">${title}</h4>
                            ${message ? `<p class="text-[12px] text-gray-500 mt-1 leading-relaxed">${message}</p>` : ''}
                        </div>
                    `;

                    container.prepend(toast);

                    const removeToast = () => {
                        toast.style.animation = 'none';
                        toast.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease-out';
                        void toast.offsetHeight;
                        toast.style.transform = 'translateY(-40px) scale(0.95)';
                        toast.style.opacity = '0';
                        setTimeout(() => toast.remove(), 300);
                    };

                    let timeout;
                    if (duration > 0) timeout = setTimeout(removeToast, duration);

                    let startX = 0, startY = 0, currentX = 0, currentY = 0;
                    let lastX = 0, lastY = 0, lastTime = 0;
                    let velocityX = 0, velocityY = 0;
                    let isDragging = false;
                    let hasMoved = false;

                    const onStart = (e) => {
                        isDragging = true;
                        hasMoved = false; 
                        startX = e.touches ? e.touches[0].clientX : e.clientX;
                        startY = e.touches ? e.touches[0].clientY : e.clientY;
                        currentX = startX; currentY = startY; lastX = startX; lastY = startY;
                        lastTime = Date.now();
                        toast.style.transition = 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)'; 
                        toast.style.animation = 'none';
                        toast.style.transform = 'scale(0.95)';
                        if (timeout) clearTimeout(timeout);
                    };

                    const onMove = (e) => {
                        if (!isDragging) return;
                        currentX = e.touches ? e.touches[0].clientX : e.clientX;
                        currentY = e.touches ? e.touches[0].clientY : e.clientY;
                        const diffX = currentX - startX;
                        let diffY = currentY - startY;

                        if (Math.abs(diffX) > 5 || Math.abs(diffY) > 5) {
                            hasMoved = true;
                            toast.style.transition = 'none'; 
                        }

                        if (hasMoved) {
                            if (diffY > 0) diffY = diffY * 0.2; 
                            toast.style.transform = `translate(${diffX}px, ${diffY}px)`;
                            const distance = Math.sqrt(diffX * diffX + diffY * diffY);
                            toast.style.opacity = Math.max(0, 1 - distance / 200);

                            const now = Date.now();
                            const dt = now - lastTime;
                            if (dt > 0) {
                                velocityX = (currentX - lastX) / dt;
                                velocityY = (currentY - lastY) / dt;
                            }
                            lastX = currentX; lastY = currentY; lastTime = now;
                        }
                    };

                    const onEnd = () => {
                        if (!isDragging) return;
                        isDragging = false;
                        
                        toast.style.transition = 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.3s ease-out';
                        void toast.offsetHeight;

                        if (!hasMoved) {
                            toast.style.transform = 'scale(1)';
                            toast.style.opacity = '1';
                            if (onClickAction) {
                                onClickAction();
                                removeToast();
                            } else {
                                if (duration > 0) timeout = setTimeout(removeToast, duration);
                            }
                            return;
                        }

                        const diffX = currentX - startX;
                        const diffY = currentY - startY;
                        const isSwipeFastX = Math.abs(velocityX) > 0.5;
                        const isSwipeFastY = velocityY < -0.5; 
                        
                        if (Math.abs(diffX) > 60 || diffY < -40 || isSwipeFastX || isSwipeFastY) {
                            let endX = diffX;
                            let endY = diffY < 0 ? diffY : 0;

                            if (Math.abs(diffX) > 60 || isSwipeFastX) endX = Math.sign(diffX || velocityX) * window.innerWidth;
                            else if (diffY < -40 || isSwipeFastY) endY = -window.innerHeight;
                            
                            toast.style.transform = `translate(${endX}px, ${endY}px)`;
                            toast.style.opacity = '0';
                            setTimeout(() => toast.remove(), 300);
                        } else {
                            toast.style.transform = 'translate(0, 0)';
                            toast.style.opacity = '1';
                            if (duration > 0) timeout = setTimeout(removeToast, duration);
                        }
                    };

                    toast.addEventListener('touchstart', onStart, { passive: true });
                    toast.addEventListener('touchmove', onMove, { passive: true });
                    toast.addEventListener('touchend', onEnd);
                    toast.addEventListener('mousedown', onStart);
                    toast.addEventListener('mouseleave', onEnd);
                    toast.addEventListener('mousemove', onMove);
                    toast.addEventListener('mouseup', onEnd);

                    return removeToast;
                },

                // [Má»šI] TOAST Äáº¶C BIá»†T: KHÃ”NG THá»‚ Táº®T, CHá»ˆ DÃ™NG CHO TIáº¾N TRÃŒNH UPLOAD HÃ€NG Äá»¢I
                createProgress: (title) => {
                    const container = document.getElementById('toast-container');
                    if (!container) return null;

                    const toastId = 'toast-prog-' + Date.now();
                    const toast = document.createElement('div');
                    toast.className = 'toast-card toast-enter bg-white/95 backdrop-blur-2xl border border-gray-200 shadow-2xl rounded-2xl p-4 flex items-center gap-3 w-11/12 max-w-sm mx-auto pointer-events-auto';
                    toast.id = toastId;

                    toast.innerHTML = `
                        <div class="relative w-8 h-8 flex justify-center items-center shrink-0">
                            <svg class="w-full h-full transform -rotate-90 absolute inset-0" viewBox="0 0 120 120">
                                <circle cx="60" cy="60" r="54" fill="none" stroke="#e4e4e7" stroke-width="12" />
                                <circle id="${toastId}-circle" class="transition-all duration-300 ease-out" cx="60" cy="60" r="54" fill="none" stroke="#000" stroke-width="12" stroke-dasharray="339.29" stroke-dashoffset="339.29" stroke-linecap="round" />
                            </svg>
                            <i class="fa-solid fa-cloud-arrow-up text-[11px] text-gray-800 relative z-10 animate-pulse"></i>
                        </div>
                        <div class="flex-1 overflow-hidden pointer-events-none select-none">
                            <h4 id="${toastId}-title" class="text-sm font-bold text-gray-900 leading-tight">${title}</h4>
                            <p id="${toastId}-desc" class="text-[12px] text-gray-500 mt-0.5 leading-relaxed truncate">Vui lÃ²ng Ä‘á»£i trong giÃ¢y lÃ¡t...</p>
                        </div>
                    `;

                    container.prepend(toast);

                    // Hiá»‡u á»©ng "DÃ­u láº¡i" khi cá»‘ vuá»‘t táº¯t Toast nÃ y
                    let startY = 0, currentY = 0, isDragging = false;
                    toast.addEventListener('touchstart', (e) => { 
                        isDragging = true; startY = e.touches[0].clientY; 
                        toast.style.transition = 'none'; 
                    }, {passive: true});
                    
                    toast.addEventListener('touchmove', (e) => {
                        if(!isDragging) return;
                        currentY = e.touches[0].clientY;
                        let diffY = currentY - startY;
                        // KhÃ¡ng cá»± láº¡i lá»±c kÃ©o (DÃ­u láº¡i)
                        if (diffY < 0) diffY = diffY * 0.25;
                        else diffY = diffY * 0.1;
                        toast.style.transform = `translateY(${diffY}px)`;
                    }, {passive: true});
                    
                    toast.addEventListener('touchend', () => {
                        isDragging = false;
                        // Náº£y Ä‘Ã n há»“i vá» láº¡i vá»‹ trÃ­ 0
                        toast.style.transition = 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                        toast.style.transform = 'translateY(0) scale(1)';
                    });

                    return {
                        id: toastId,
                        element: toast,
                        update: (percent, newTitle, newDesc) => {
                            const circle = document.getElementById(`${toastId}-circle`);
                            const titleEl = document.getElementById(`${toastId}-title`);
                            const descEl = document.getElementById(`${toastId}-desc`);
                            if(circle) {
                                const offset = 339.29 * (1 - Math.min(100, Math.max(0, percent)) / 100);
                                circle.style.strokeDashoffset = offset;
                            }
                            if(titleEl && newTitle) titleEl.innerText = newTitle;
                            if(descEl && newDesc) descEl.innerText = newDesc;
                        },
                        remove: () => {
                            toast.style.transition = 'transform 0.3s ease-in, opacity 0.3s ease-out';
                            toast.style.transform = 'translateY(-40px) scale(0.95)';
                            toast.style.opacity = '0';
                            setTimeout(() => toast.remove(), 300);
                        }
                    };
                }
            },


window.app.utils = {
                stripMarkdown: (md) => {
                    if (!md) return '';
                    const html = marked.parse(md);
                    const temp = document.createElement('div');
                    temp.innerHTML = html;
                    return (temp.textContent || temp.innerText || '').replace(/\s+/g, ' ').trim();
                },
                // ThÃªm hÃ m resetTurnstile dÃ¹ng chung nÃ y vÃ o Ä‘áº§u object utils
                resetTurnstile: (selector) => {
                    // ÄÃ£ chuyá»ƒn sang dÃ¹ng Popup (app.captcha), hÃ m nÃ y bá»‹ vÃ´ hiá»‡u hÃ³a
                },
                isIOS: () => {
                    return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
                },
                getTargetMimeType: () => {
                    return app.utils.isIOS() ? 'image/jpeg' : 'image/webp';
                },
                getTargetExtension: () => {
                    return app.utils.isIOS() ? 'jpg' : 'webp';
                },

                handleImgLoad: (img) => {
                    img.style.opacity = '1';
                    const wrapper = img.closest('.img-wrapper');
                    if (wrapper) {
                        const spinner = wrapper.querySelector('.img-spinner');
                        if (spinner) spinner.style.display = 'none';
                    }
                },

                handleImgError: (img) => {
                    const wrapper = img.closest('.img-wrapper');
                    if (wrapper) {
                        const spinner = wrapper.querySelector('.img-spinner');
                        if (spinner) spinner.style.display = 'none';
                        const errorBox = wrapper.querySelector('.img-error');
                        if (errorBox) errorBox.classList.remove('hidden');
                        img.style.display = 'none';
                    }
                },

                navigate: (url) => {
                    if (window.location.pathname + window.location.search === url) {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        return;
                    }
                    const prevPath = window.location.pathname;
                    const prevFull = prevPath + window.location.search;

                    let parentInfo = window.history.state?.parentInfo;
                    const rootPages = ['/', '/profile', '/profile/comments', '/search', '/upload', '/admin', '/contact', '/user/', '/help'];
                    // --- ÄÃƒ Sá»¬A: KHAI BÃO THÃŠM TRANG ÄÆ N Vá»Š VÃ€ DÃ’NG XE LÃ€ TRANG CON ---
                    const isDestLeaf = url.startsWith('/vehicle/') || url.startsWith('/photo/') || url.startsWith('/operator/') || url.startsWith('/model/');
                    // ----------------------------------------------------------------
                    const isCurrentRoot = rootPages.some(r => prevPath === r || (r !== '/' && prevPath.startsWith(r)));

                    if (isCurrentRoot) {
                        let bName = "Trang chá»§";
                        if (prevPath === '/profile/comments') bName = "Quáº£n lÃ½ bÃ¬nh luáº­n";
                        else if (prevPath === '/profile') bName = "Há»“ sÆ¡ cá»§a tÃ´i";
                        else if (prevPath.startsWith('/search')) bName = "Káº¿t quáº£ tÃ¬m kiáº¿m";
                        else if (prevPath.startsWith('/user/')) bName = "Há»“ sÆ¡ ngÆ°á»i dÃ¹ng";
                        else if (prevPath === '/upload') bName = "ÄÄƒng táº£i";
                        else if (prevPath === '/admin') bName = "Quáº£n trá»‹";
                        else if (prevPath === '/contact') bName = "LiÃªn há»‡";
                        else if (prevPath === '/help' || prevPath.startsWith('/help/')) bName = "Trung tÃ¢m há»— trá»£";
                        parentInfo = { name: bName, url: prevFull };
                    }

                    app.previousPath = prevFull;
                    window.history.pushState({ parentInfo: isDestLeaf ? parentInfo : null }, '', url);
                    app.handleRoute();
                },

cleanupState: () => {
                    if (document.getElementById('upload-form')) {
                        document.getElementById('upload-form').reset();
                        document.querySelectorAll('.upload-req-err').forEach(el => el.classList.add('hidden'));
                        ['up-plate', 'up-route', 'up-operator', 'up-model', 'up-location'].forEach(id => {
                            const el = document.getElementById(id);
                            if (el) {
                                el.classList.remove('border-red-500', 'focus:ring-red-500');
                                el.classList.add('border-gray-300', 'focus:ring-black');
                            }
                        });
                        app.upload.removeImage();
                        document.getElementById('locked-msg')?.classList.add('hidden');
                        app.vehicleLocked = false;
                        document.getElementById('plate-msg').innerText = '';

                        // Gá»i hÃ m reset má»›i, cá»±c ká»³ gá»n gÃ ng
                        app.utils.resetTurnstile('#upload .cf-turnstile');
                        app.utils.resetTurnstile('#auth .cf-turnstile');

                        // Load láº¡i tráº¡ng thÃ¡i khÃ³a nÃºt theo cÃ¡ nhÃ¢n hÃ³a
                        if(app.upload.applyPreferenceUI) app.upload.applyPreferenceUI();
                        document.getElementById('type-msg')?.classList.add('hidden');
                    }

                    app.ui.closeUploadProgress();
                    app.ui.closeAlert(false);
                    app.ui.closePrompt(false);
                    app.ui.closeUploadInfo();
                    if(app.crop && app.crop.close) app.crop.close();
                    if(app.docs && app.docs.close) app.docs.close();
                    if(app.settings && app.settings.close) app.settings.close();

                    // ÄÃ³ng Zoom Modal náº¿u Ä‘ang má»Ÿ (Xá»­ lÃ½ lá»—i báº¥m Back khi Ä‘ang soi áº£nh)
                    const zoomModal = document.getElementById('admin-zoom-modal');
                    if (zoomModal && !zoomModal.classList.contains('hidden')) {
                        app.admin.closeZoom();
                    }

                    document.getElementById('search-filter-menu')?.classList.remove('active');
                    app.ui.toggleUserMenu(false);

                    if (app.edit && app.edit.isEditing) app.edit.cancel();

                    app.ui.unlockScroll();
                    app.upload.checkQuota();
                },

                provinceData: [],
                loadProvinceData: async () => {
                    try {
                        const res = await fetch('/licence-no.json');
                        if (res.ok) {
                            app.utils.provinceData = await res.json();
                        }
                    } catch (e) { console.warn("KhÃ´ng thá»ƒ táº£i licence-no.json", e); }
                },
                getProvinceFromPlate: (plate) => {
                    if (!plate) return 'KhÃ´ng xÃ¡c Ä‘á»‹nh';
                    if (/^[A-Z]{3}\d{4,7}/.test(plate)) return 'BuÃ½t sÃ¢n bay';
                    if (!app.utils.provinceData.length) return 'KhÃ´ng xÃ¡c Ä‘á»‹nh';
                    if (plate.startsWith('T')) return 'Biá»ƒn táº¡m';
                    if (/^[A-Z]{2}/.test(plate.substring(0, 2))) return 'Biá»ƒn quÃ¢n Ä‘á»™i / Ngoáº¡i giao';
                    const prefix = plate.substring(0, 2);
                    const province = app.utils.provinceData.find(p => p.ky_hieu.includes(prefix));
                    return province ? province.ten : 'KhÃ´ng xÃ¡c Ä‘á»‹nh';
                },
                getRelatedPrefixes: (prefix) => {
                    if (!app.utils.provinceData.length) return [prefix];
                    const province = app.utils.provinceData.find(p => p.ky_hieu.includes(prefix));
                    if (province && province.ky_hieu) {
                        return Array.isArray(province.ky_hieu) ? province.ky_hieu : province.ky_hieu.split(',').map(s => s.trim());
                    }
                    return [prefix];
                },
                formatCompact: (num) => {
                    if (!num && num !== 0) return '0';
                    num = parseInt(num);
                    if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'T';
                    if (num >= 1_000_000)     return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'Tr';
                    if (num >= 1_000)         return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'N';
                    return num.toString();
                },
                verifyImageLoaded: async (url, maxRetries = 3) => {
                    const delay = (ms) => new Promise(res => setTimeout(res, ms));

                    for (let i = 0; i < maxRetries; i++) {
                        try {
                            await new Promise((resolve, reject) => {
                                const img = new Image();
                                const cacheBuster = url.includes('?') ? '&cb=' : '?cb=';
                                img.src = url + cacheBuster + new Date().getTime();

                        img.onload = async () => {
                                    if (img.naturalWidth > 10) resolve(true);
                                    else reject(new Error("File áº£nh bá»‹ há»ng hoáº·c trá»‘ng."));
                                };

                                img.onerror = () => {
                                    reject(new Error("Lá»—i mÃ¡y chá»§ lÆ°u trá»¯ (404 / Bá»‹ cháº·n)."));
                                };
                            });
                            return true;
                        } catch (e) {
                            if (i === maxRetries - 1) throw e;
                            await delay(1500);
                        }
                    }
                },
                renderPagination: (containerId, currentPage, totalPages, onPageChange) => {
                    const container = document.getElementById(containerId);
                    if (!container) return;
                    if (totalPages <= 1) { container.innerHTML = ''; return; }


                    const delta = 1;
                    const middle = [];

                    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
                        middle.push(i);
                    }


                    const leftDots  = middle.length > 0 && middle[0] > 2;
                    const rightDots = middle.length > 0 && middle[middle.length - 1] < totalPages - 1;


                    const range = [1];
                    if (leftDots)  range.push('..._left');
                    range.push(...middle);
                    if (rightDots) range.push('..._right');
                    if (totalPages > 1) range.push(totalPages);


                    const wrap = document.createElement('div');
                    wrap.className = 'pagination-wrap';


                    const prevBtn = document.createElement('button');
                    prevBtn.className = 'page-btn';
                    prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left text-xs"></i>';
                    prevBtn.disabled = currentPage === 1;
                    prevBtn.addEventListener('click', () => onPageChange(currentPage - 1));
                    wrap.appendChild(prevBtn);


                    range.forEach((p) => {
                        if (typeof p === 'string' && p.startsWith('...')) {

                            const dotsBtn = document.createElement('button');
                            dotsBtn.className = 'page-btn dots';
                            dotsBtn.innerHTML = 'â€¢â€¢â€¢';
                            dotsBtn.style.cursor = 'pointer';
                            dotsBtn.title = 'Nháº£y Ä‘áº¿n trang báº¥t ká»³';

                            dotsBtn.addEventListener('click', function () {

                                const jumpWrap = document.createElement('span');
                                jumpWrap.className = 'page-jump-wrap';

                                const input = document.createElement('input');
                                input.type = 'number';
                                input.className = 'page-jump-input';
                                input.min = 1;
                                input.max = totalPages;
                                input.placeholder = '#';

                                const goBtn = document.createElement('button');
                                goBtn.className = 'page-jump-btn';
                                goBtn.textContent = 'â†’';

                                const doJump = () => {
                                    const val = parseInt(input.value);
                                    if (val >= 1 && val <= totalPages) onPageChange(val);
                                };

                                goBtn.addEventListener('click', doJump);
                                input.addEventListener('keydown', (e) => { if (e.key === 'Enter') doJump(); });

                                input.addEventListener('blur', () => {
                                    setTimeout(() => {
                                        if (!jumpWrap.contains(document.activeElement)) {
                                            jumpWrap.replaceWith(dotsBtn);
                                        }
                                    }, 150);
                                });

                                jumpWrap.appendChild(input);
                                jumpWrap.appendChild(goBtn);
                                dotsBtn.replaceWith(jumpWrap);
                                input.focus();
                            });

                            wrap.appendChild(dotsBtn);
                        } else {
                            const btn = document.createElement('button');
                            btn.className = 'page-btn' + (p === currentPage ? ' active' : '');
                            btn.textContent = p;
                            if (p !== currentPage) btn.addEventListener('click', () => onPageChange(p));
                            wrap.appendChild(btn);
                        }
                    });


                    const nextBtn = document.createElement('button');
                    nextBtn.className = 'page-btn';
                    nextBtn.innerHTML = '<i class="fa-solid fa-chevron-right text-xs"></i>';
                    nextBtn.disabled = currentPage === totalPages;
                    nextBtn.addEventListener('click', () => onPageChange(currentPage + 1));
                    wrap.appendChild(nextBtn);

                    container.innerHTML = '';
                    container.appendChild(wrap);
                },
                updateBreadcrumbs: () => {
                    const state = window.history.state;
                    const parent = state?.parentInfo || { name: "Trang chá»§", url: "/" };

                    document.querySelectorAll('.crumb-back').forEach(el => {
                        el.innerText = parent.name;
                        el.onclick = () => { app.utils.navigate(parent.url); };
                    });
                },


                formatPlateInput: (el) => {
                    let val = el.value;
                    const upperVal = val.toUpperCase();
                    if (val !== upperVal) {
                        const start = el.selectionStart;
                        const end = el.selectionEnd;
                        el.value = upperVal;
                        el.setSelectionRange(start, end);
                    }
                },
                formatNoPunctuation: (el) => {
                    // ÄÃ£ gá»¡ bá» giá»›i háº¡n dáº¥u cÃ¢u theo yÃªu cáº§u (cho phÃ©p ngÆ°á»i dÃ¹ng nháº­p tá»± do)
                    return;
                },
                fallbackHeroImage: (imgElement, cacheName, currentIndex) => {
                    const photos = app[cacheName];
                    const wrapper = imgElement.closest('#hero-main') || imgElement.closest('.group');

                    // Náº¿u háº¿t áº£nh dá»± phÃ²ng -> Hiá»‡n UI bÃ¡o lá»—i Ä‘áº¹p máº¯t
                    if (!photos || currentIndex >= photos.length - 1) {
                        imgElement.style.display = 'none';
                        if (wrapper) {
                            wrapper.onclick = null;
                            wrapper.classList.remove('cursor-pointer', 'hover:scale-105');
                            let errBox = wrapper.querySelector('.fallback-error');
                            if (!errBox) {
                                wrapper.innerHTML += `<div class="fallback-error absolute inset-0 flex flex-col items-center justify-center bg-gray-100 z-10 w-full h-full min-h-[200px]">
                                    <i class="fa-solid fa-image-slash text-gray-400 text-4xl mb-2"></i>
                                    <span class="text-sm font-bold text-gray-500">áº¢nh Ä‘Ã£ bá»‹ lá»—i hoáº·c gá»¡ bá»</span>
                                </div>`;
                            }
                        }
                        return;
                    }

                    // Thá»­ load áº£nh tiáº¿p theo
                    const nextIndex = currentIndex + 1;
                    const nextPhoto = photos[nextIndex];

                    imgElement.src = app.utils.getProxiedUrl(nextPhoto.url, 'fallback.jpg', 'thumb');
                    imgElement.setAttribute('onerror', `app.utils.fallbackHeroImage(this, '${cacheName}', ${nextIndex})`);

                    // Cáº­p nháº­t láº¡i Link click vÃ  Text (náº¿u cÃ³)
                    if (wrapper) {
                        wrapper.onclick = () => app.views.loadDetail(nextPhoto.id);
                        if (cacheName === 'topPhotosCache') {
                             const textPlate = wrapper.querySelector('.hero-main-text');
                             const textViews = wrapper.querySelector('.hero-main-views');
                             if (textPlate) {
                                 const safePlate = app.utils.displayPlate(app.utils.cleanText(nextPhoto.license_plate));
                                 const safeUser = app.utils.cleanText(nextPhoto.profiles?.username || 'áº¨n danh');
                                 textPlate.innerHTML = `${safePlate} - ${safeUser}`;
                             }
                             if (textViews) {
                                 textViews.innerHTML = `<i class="fa-solid fa-eye mr-1"></i> ${nextPhoto.views || 0} lÆ°á»£t xem`;
                             }
                        }
                    }
                },
                normalizePlateQuery: (str) => {
                    if (!str) return '';
                    // Bá» khoáº£ng tráº¯ng, dáº¥u cháº¥m, pháº©y, gáº¡ch dÆ°á»›i vÃ  in hoa
                    let s = str.toUpperCase().replace(/[\s.,_]/g, '');
                    // Bá» gáº¡ch ngang náº¿u nÃ³ Ä‘á»©ng trÆ°á»›c chuá»—i 3 Ä‘áº¿n 5 chá»¯ sá»‘ (XÃ³a 29F-12345 nhÆ°ng giá»¯ láº¡i -1 á»Ÿ Ä‘uÃ´i)
                    s = s.replace(/\-(\d{3,5})(?!\d)/g, '$1');
                    // Xá»­ lÃ½ lá»—i gÃµ dÆ° gáº¡ch ngang rÃ¡c
                    if (s === '-') return '';
                    return s;
                },
                cleanText: (str) => {
                    if (!str) return '';
                    return DOMPurify.sanitize(str, { ALLOWED_TAGS: [] });
                },
                fixUnicode: (str) => {
                    if (!str) return '';
                    return str.normalize('NFC').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "");
                },
                displayPlate: (plate) => {
                    if (!plate) return '';
                    return plate.replace(/-\d+$/, '');
                },

                escapeAttr: (str) => {
                    if (!str) return '';
                    return String(str)
                        .replace(/&/g, '&amp;')
                        .replace(/"/g, '&quot;')
                        .replace(/'/g, '&#39;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;');
                },



                getProxiedUrl: (url, filename = 'image.jpg', type = 'full') => {
                    if (!url) return '';

                    const safeName = filename.replace(/[^a-z0-9A-Z.-]/gi, '_');

                    if (url.includes('ik.imagekit.io')) {
                        let transformations = ['f-webp', 'q-auto'];

                        if (type === 'thumb') {
                            transformations.push('w-400', 'h-300', 'c-at_max');
                        } else if (type === 'avatar') {
                            // Cáº¯t chuáº©n 200x200 cho Avatar
                            transformations.push('w-200', 'h-200', 'c-maintain_ratio');
                        }

                        const separator = url.includes('?') ? '&' : '?';
                        return `${url}${separator}tr=${transformations.join(',')}`;
                    }

                    if (url.includes('catbox.moe') || url.includes('postimg.cc') || url.includes('supabase.co') || url.includes('vnbusarchive.io.vn')) {
                        return url;
                    }

                    return url;
                },


                updateMetaTags: (title, description, imageUrl) => {
                    document.title = title;


                    let metaDesc = document.querySelector('meta[name="description"]');
                    if (metaDesc) metaDesc.setAttribute("content", description);


                    let ogTitle = document.querySelector('meta[property="og:title"]');
                    if (ogTitle) ogTitle.setAttribute("content", title);

                    let ogDesc = document.querySelector('meta[property="og:description"]');
                    if (ogDesc) ogDesc.setAttribute("content", description);

                    let ogImage = document.querySelector('meta[property="og:image"]');
                    if (ogImage && imageUrl) ogImage.setAttribute("content", imageUrl);
                },

                promiseWithTimeout: (promise, ms = 3000) => {
                    return new Promise((resolve, reject) => {
                        const timeoutId = setTimeout(() => {
                            reject(new Error("TIMEOUT"));
                        }, ms);
                        promise.then((res) => {
                            clearTimeout(timeoutId);
                            resolve(res);
                        }).catch((err) => {
                            clearTimeout(timeoutId);
                            reject(err);
                        });
                    });
                },

                watermark: (file, username, pos = { x: 0.5, y: 0.5, color: 'white' }, filters = 'none') => {
                    return new Promise((resolve, reject) => {
                        const img = new Image();
                        const url = URL.createObjectURL(file);
                        img.onload = async () => {
                            try {
                                const canvas = document.createElement('canvas');
                                const ctx = canvas.getContext('2d');

                                let width = img.width;
                                let height = img.height;
                                const maxDim = 1920;
                                if (width > maxDim || height > maxDim) {
                                    if (width > height) { height = Math.round(height * (maxDim / width)); width = maxDim; }
                                    else { width = Math.round(width * (maxDim / height)); height = maxDim; }
                                }

                                canvas.width = width;
                                canvas.height = height;
                                ctx.filter = filters;
                                ctx.drawImage(img, 0, 0, width, height);
                                ctx.filter = 'none';

                                const imgEl = document.getElementById('preview-img');
                                const blurPanels = document.querySelectorAll('.blur-panel');

                                if (imgEl && blurPanels.length > 0) {
                                    const imgRect = imgEl.getBoundingClientRect();

                                    blurPanels.forEach(panel => {
                                        const panelRect = panel.getBoundingClientRect();

                                        const relX = (panelRect.left - imgRect.left) / imgRect.width;
                                        const relY = (panelRect.top - imgRect.top) / imgRect.height;
                                        const relW = panelRect.width / imgRect.width;
                                        const relH = panelRect.height / imgRect.height;

                                        const blurX = Math.floor(width * relX);
                                        const blurY = Math.floor(height * relY);
                                        const blurW = Math.ceil(width * relW);
                                        const blurH = Math.ceil(height * relH);

                                        if (blurW > 0 && blurH > 0) {
                                            const tempPanelCanvas = document.createElement('canvas');
                                            tempPanelCanvas.width = blurW;
                                            tempPanelCanvas.height = blurH;
                                            const tempPanelCtx = tempPanelCanvas.getContext('2d');

                                            tempPanelCtx.drawImage(ctx.canvas, blurX, blurY, blurW, blurH, 0, 0, blurW, blurH);

                                            const panelBlurRadius = Math.max(15, Math.floor(width * 0.015));
                                            StackBlur.canvasRGBA(tempPanelCanvas, 0, 0, blurW, blurH, panelBlurRadius);

                                            ctx.drawImage(tempPanelCanvas, blurX, blurY);
                                        }
                                    });
                                }

                                const barHeight = height * 0.08;
                                const barY = height - barHeight;
                                const fontSize = barHeight * 0.4;
                                await document.fonts.ready;
                                const fontFace = 'Montserrat, Arial, sans-serif';

                                const safeBarY = Math.floor(barY);
                                const safeBarHeight = Math.ceil(barHeight);

                                const tempCanvas = document.createElement('canvas');
                                tempCanvas.width = width;
                                tempCanvas.height = safeBarHeight;
                                const tempCtx = tempCanvas.getContext('2d');

                                tempCtx.drawImage(ctx.canvas, 0, safeBarY, width, safeBarHeight, 0, 0, width, safeBarHeight);

                                const blurRadius = Math.max(5, Math.floor(width * 0.005));
                                StackBlur.canvasRGBA(tempCanvas, 0, 0, width, safeBarHeight, blurRadius);

                                ctx.drawImage(tempCanvas, 0, safeBarY);

                                ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
                                ctx.fillRect(0, safeBarY, width, safeBarHeight);

                                ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
                                ctx.fillRect(0, barY, width, 1.5);

                                ctx.fillStyle = "white";
                                ctx.font = `italic 900 ${fontSize}px ${fontFace}`;
                                ctx.textBaseline = 'middle';
                                ctx.textAlign = 'left';
                                ctx.fillText("VNBUSARCHIVE", barHeight / 2, height - barHeight / 2);

                                ctx.font = `700 ${fontSize}px ${fontFace}`;
                                const rightText = `Báº£n quyá»n bá»Ÿi ${username}`;
                                const rightWidth = ctx.measureText(rightText).width;
                                ctx.fillText(rightText, width - rightWidth - (barHeight / 2), height - barHeight / 2);

                                ctx.save();
                                ctx.globalAlpha = 0.5;
                                ctx.fillStyle = pos.color === 'black' ? "black" : "white";
                                ctx.font = `700 ${fontSize * 3}px ${fontFace}`;
                                ctx.textAlign = 'center';
                                ctx.textBaseline = 'middle';

                                ctx.translate(width * pos.x, height * pos.y);
                                ctx.fillText(`Â© ${username}`, 0, 0);
                                ctx.restore();

                                canvas.toBlob((blob) => {
                                    if (blob) resolve(blob);
                                    else reject(new Error("Canvas failed to blob"));
                                }, app.utils.getTargetMimeType(), 0.80);
                            } catch (e) {
                                reject(e);
                            } finally {
                                URL.revokeObjectURL(url);
                            }
                        };
                        img.onerror = (e) => {
                            URL.revokeObjectURL(url);
                            reject(new Error("KhÃ´ng thá»ƒ táº£i áº£nh."));
                        };
                        img.src = url;
                    });
                },

                handleLike: async () => {
                    if (!app.user) return app.auth.check();
                    if (!app.currentPhoto) return;
                    if (app.currentPhoto.status === 'denied') return;

                    const photoId = app.currentPhoto.id;
                    const likeBtn = document.getElementById('btn-like');
                    const likeCountEl = document.getElementById('stat-likes');
                    let currentCount = parseInt(likeCountEl.innerText) || 0;

                    const isLiked = likeBtn.classList.contains('bg-gray-400');

                    if (isLiked) {
                        // Optimistic UI Update: Revert UI immediately
                        likeBtn.classList.replace('bg-gray-400', 'bg-black');
                        likeBtn.innerHTML = '<i class="fa-regular fa-thumbs-up"></i> ThÃ­ch áº£nh nÃ y';
                        likeCountEl.innerText = Math.max(0, currentCount - 1);

                        const zBtn = document.getElementById('zoom-btn-like');
                        if(zBtn) {
                            zBtn.className = "flex items-center justify-center gap-1.5 text-gray-800 bg-transparent hover:bg-black hover:text-white px-3 py-2 md:px-4 md:py-2.5 rounded-lg font-bold text-[11px] md:text-sm transition-colors whitespace-nowrap";
                            zBtn.innerHTML = '<i class="fa-regular fa-thumbs-up text-sm md:text-base"></i> <span class="hidden md:inline">ThÃ­ch</span>';
                        }

                        const { error } = await window.apiFetch('unlike_photo', { photoId }).catch(e => ({ error: e }));

                        if (error) {
                            // Rollback UI
                            likeBtn.classList.replace('bg-black', 'bg-gray-400');
                            likeBtn.innerHTML = '<i class="fa-solid fa-check"></i> ÄÃ£ thÃ­ch';
                            likeCountEl.innerText = currentCount;
                            if(zBtn) {
                                zBtn.className = "flex items-center justify-center gap-1.5 bg-black text-white px-3 py-2 md:px-4 md:py-2.5 rounded-lg font-bold text-[11px] md:text-sm transition-colors whitespace-nowrap";
                                zBtn.innerHTML = '<i class="fa-solid fa-check text-sm md:text-base"></i> <span class="hidden md:inline">ÄÃ£ thÃ­ch</span>';
                            }
                            app.ui.showAlert("Lá»—i khi bá» thÃ­ch: " + error.message);
                        }
                    } else {
                        // Optimistic UI Update: Update UI immediately
                        likeBtn.classList.replace('bg-black', 'bg-gray-400');
                        likeBtn.innerHTML = '<i class="fa-solid fa-check"></i> ÄÃ£ thÃ­ch';
                        likeCountEl.innerText = currentCount + 1;

                        const zBtn = document.getElementById('zoom-btn-like');
                        if(zBtn) {
                            zBtn.className = "flex items-center justify-center gap-1.5 bg-black text-white px-3 py-2 md:px-4 md:py-2.5 rounded-lg font-bold text-[11px] md:text-sm transition-colors whitespace-nowrap";
                            zBtn.innerHTML = '<i class="fa-solid fa-check text-sm md:text-base"></i> <span class="hidden md:inline">ÄÃ£ thÃ­ch</span>';
                        }

                        const { error } = await window.apiFetch('like_photo', { photoId }).catch(e => ({ error: e }));

                        if (error) {
                            if (error.code !== '23505') {
                                // Rollback UI
                                likeBtn.classList.replace('bg-gray-400', 'bg-black');
                                likeBtn.innerHTML = '<i class="fa-regular fa-thumbs-up"></i> ThÃ­ch áº£nh nÃ y';
                                likeCountEl.innerText = currentCount;
                                if(zBtn) {
                                    zBtn.className = "flex items-center justify-center gap-1.5 text-gray-800 bg-transparent hover:bg-black hover:text-white px-3 py-2 md:px-4 md:py-2.5 rounded-lg font-bold text-[11px] md:text-sm transition-colors whitespace-nowrap";
                                    zBtn.innerHTML = '<i class="fa-regular fa-thumbs-up text-sm md:text-base"></i> <span class="hidden md:inline">ThÃ­ch</span>';
                                }
                                app.ui.showAlert("Lá»—i khi thÃ­ch: " + error.message);
                            }
                        }
                    }
                },
                reverseGeocode: async (lat, lng) => {
                    try {
                        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
                        const data = await res.json();
                        const addr = data.address;
                        const city = addr.city || addr.town || addr.village || addr.state || '';
                        const road = addr.road || '';
                        const suburb = addr.suburb || addr.quarter || '';

                        let result = [road, suburb, city].filter(Boolean).join(', ');
                        return result.replace(', Viá»‡t Nam', '');
                    } catch (e) { return "Vá»‹ trÃ­ khÃ´ng xÃ¡c Ä‘á»‹nh"; }
                },

                geocodeAddress: async (locationText) => {
                    if (!locationText || locationText.length < 3) return;
                    try {
                        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationText + ', Viá»‡t Nam')}&limit=1`);
                        const data = await res.json();
                        if (data && data.length > 0) {
                            const { lat, lon } = data[0];
                            const coords = [parseFloat(lat), parseFloat(lon)];
                            app.uploadMap.setView(coords, 15);
                            if (app.uploadMarker) app.uploadMap.removeLayer(app.uploadMarker);
                            app.uploadMarker = L.marker(coords).addTo(app.uploadMap);
                        }
                    } catch (e) { }
                },

                showDetailMap: async (locationText) => {
                    const mapEl = document.getElementById('detail-map');
                    mapEl.style.display = 'block';

                    if (!app.detailMap) {
                        app.detailMap = L.map('detail-map').setView([10.762622, 106.660172], 13);
                        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', {
                            attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        }).addTo(app.detailMap);
                    }

                    try {
                        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationText + ', Viá»‡t Nam')}&limit=1`);
                        const data = await res.json();
                        if (data && data.length > 0) {
                            const { lat, lon } = data[0];
                            const coords = [parseFloat(lat), parseFloat(lon)];
                            app.detailMap.setView(coords, 15);
                            if (app.detailMarker) app.detailMap.removeLayer(app.detailMarker);
                            app.detailMarker = L.marker(coords).addTo(app.detailMap);
                            setTimeout(() => app.detailMap.invalidateSize(), 200);
                        } else {
                            mapEl.style.display = 'none';
                        }
                    } catch (e) { mapEl.style.display = 'none'; }
                },

                triggerRouteSuggestion: async (inputId, suggestionId, query) => {
                    const box = document.getElementById(suggestionId);
                    if (!box) return;

                    let currentType = '';
                    if (inputId.startsWith('up-')) currentType = document.getElementById('up-type')?.value || '';
                    else if (inputId.startsWith('info-')) currentType = document.getElementById('info-type')?.value || '';
                    else if (inputId.startsWith('adm-p-')) currentType = document.getElementById(`adm-p-type-${inputId.split('-').pop()}`)?.value || '';
                    else if (inputId.startsWith('req-') && !inputId.startsWith('req-v-')) currentType = document.getElementById(`req-type-${inputId.split('-').pop()}`)?.value || '';
                    else if (app.currentVehicle) currentType = app.currentVehicle.type || '';

                    let staticList = ['Dá»«ng hoáº¡t Ä‘á»™ng', 'NgoÃ i giá» hoáº¡t Ä‘á»™ng', 'ChÆ°a hoáº¡t Ä‘á»™ng'];
                    if (currentType === 'coach' || currentType === '') {
                        staticList.unshift('Há»£p Ä‘á»“ng');
                    }

                    let dbRoutes = [];
                    if (query.length > 0) {
                        try {
                            const routeWords = query.trim().split(/\s+/).filter(w => w.length > 0);
                            // Báº®T BUá»˜C STATUS = APPROVED
                            const { data } = await window.apiFetch('suggest_routes_advanced', { currentType, routeWords }).catch(e => ({ error: e, data: null }));
                            if (data) {
                                dbRoutes = data.map(item => item.route_no).filter(Boolean);
                            }
                        } catch (e) { console.log("Route suggestion error:", e.message); }
                    }


                    const allRoutes = [...new Set([...staticList, ...dbRoutes])];
                    const filtered = query.length === 0 ? allRoutes : allRoutes.filter(v => v.toLowerCase().includes(query.toLowerCase()));

                    if (filtered.length > 0) {
                        box.innerHTML = filtered.map(v => {
                            const safeHTML = app.utils.cleanText(v);
                            const safeJS = v.replace(/'/g, "\\'").replace(/"/g, '&quot;');

                            let displayHTML = safeHTML;
                            if (query) {
                                const escapedQuery = query.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
                                const regex = new RegExp(`(${escapedQuery})`, 'gi');
                                displayHTML = safeHTML.replace(regex, '<strong class="font-extrabold">$1</strong>');
                            }

                            return `<div class="suggestion-item" onmousedown="event.preventDefault(); document.getElementById('${inputId}').value = '${safeJS}'; document.getElementById('${suggestionId}').classList.remove('active'); if('${inputId}' === 'up-route'){ app.upload.autoFillOperatorByRoute(); }">${displayHTML}</div>`;
                        }).join('');
                        box.classList.add('active');
                    } else { box.classList.remove('active'); }
                },

                triggerSuggestion: async (inputId, suggestionId, query, field = 'model') => {
                    const box = document.getElementById(suggestionId);
                    if (app.suggestionTimeouts[inputId]) clearTimeout(app.suggestionTimeouts[inputId]);

                    let currentType = '';
                    if (inputId.startsWith('up-')) currentType = document.getElementById('up-type')?.value || '';
                    else if (inputId.startsWith('info-')) currentType = document.getElementById('info-type')?.value || '';
                    else if (inputId.startsWith('adm-p-')) currentType = document.getElementById(`adm-p-type-${inputId.split('-').pop()}`)?.value || '';
                    else if (inputId.startsWith('req-') && !inputId.startsWith('req-v-')) currentType = document.getElementById(`req-type-${inputId.split('-').pop()}`)?.value || '';
                    else if (app.currentVehicle) currentType = app.currentVehicle.type || '';

                    // LOGIC Má»šI: Tá»± Ä‘á»™ng phÃ¡t hiá»‡n Input "Tuyáº¿n" vÃ  "Biá»ƒn sá»‘" tÆ°Æ¡ng á»©ng
                    let routeVal = '';
                    let plateVal = '';
                    if (field === 'model') {
                        // Ãnh xáº¡ ID cá»§a Ã´ Tuyáº¿n
                        let routeInputId = inputId.replace('model', 'route');
                        let plateInputId = inputId.replace('model', 'plate');

                        if (inputId.includes('req-v-model')) {
                            routeInputId = inputId.replace('req-v-model', 'req-route');
                            plateInputId = inputId.replace('req-v-model', 'req-plate');
                        }

                        const routeEl = document.getElementById(routeInputId);
                        if (routeEl) routeVal = routeEl.value.trim();

                        const plateEl = document.getElementById(plateInputId);
                        if (plateEl) plateVal = plateEl.value.trim();
                    }

                    // Náº¿u Query Ä‘ang rá»—ng VÃ€ (khÃ´ng pháº£i trÆ°á»ng model HOáº¶C trÆ°á»ng model mÃ  khÃ´ng cÃ³ tuyáº¿n) -> áº¨n box
                    if (query.length < 1 && !(field === 'model' && routeVal.length > 0)) {
                        box.classList.remove('active');
                        return;
                    }

                    if (app.suggestionControllers && app.suggestionControllers[inputId]) {
                        app.suggestionControllers[inputId].abort();
                    }

                    const controller = new AbortController();
                    if (!app.suggestionControllers) app.suggestionControllers = {};
                    app.suggestionControllers[inputId] = controller;

                    const table = field === 'operator' ? 'photos' : 'vehicles';
                    const selectField = field === 'operator' ? 'operator' : field;

                    const searchWords = query.trim().split(/\s+/).filter(w => w.length > 0);

                    try {
                        let data, error;

                        if (query.length < 1 && field === 'model' && routeVal.length > 0) {
                            // TRÆ¯á»œNG Há»¢P 1: Query rá»—ng nhÆ°ng cÃ³ TUYáº¾N -> Fetch cÃ¡c dÃ²ng xe theo Tuyáº¿n tá»« Database
                            let relatedPrefixes = null;
                            if (plateVal && plateVal.length >= 2) {
                                const prefix = plateVal.substring(0, 2);
                                if (!isNaN(prefix)) relatedPrefixes = app.utils.getRelatedPrefixes(prefix);
                            }
                            const res = await window.apiFetch('search_autocomplete_model', { routeVal, currentType, relatedPrefixes, filterType: app.preference.current }, { signal: controller.signal }).catch(e => ({ error: e }));

                            error = res.error;
                            if (res.data) {
                                // TrÃ­ch xuáº¥t dá»¯ liá»‡u tráº£ vá» cho Ä‘Ãºng Ä‘á»‹nh dáº¡ng
                                data = res.data
                                    .map(item => ({ [selectField]: item.vehicles?.model }))
                                    .filter(item => item[selectField]);
                            }
                        } else {
                            // TRÆ¯á»œNG Há»¢P 2: Gá»£i Ã½ bÃ¬nh thÆ°á»ng theo Text nháº­p vÃ o
                            let selectStr = selectField;
                            if (table === 'vehicles' && (app.preference.current !== 'both' || currentType)) {
                                selectStr = `${selectField}, photos!inner(type)`;
                            }

                            const res = await window.apiFetch('search_autocomplete', { table, selectStr, currentType, searchWords, selectField, filterType: app.preference.current }, { signal: controller.signal }).catch(e => ({ error: e }));
                            error = res.error;
                        }

                        if (error) { if (error.code === 20 || error.name === 'AbortError') return; throw error; }

                        if (data && data.length > 0) {
                            const uniqueVals = [...new Set(data.map(item => item[selectField]).filter(Boolean))];
                            if (uniqueVals.length > 0) {
                                box.innerHTML = uniqueVals.map(v => {
                                    const safeHTML = app.utils.cleanText(v);
                                    const safeJS = v.replace(/'/g, "\\'").replace(/"/g, '&quot;');

                                    let displayHTML = safeHTML;
                                    if (searchWords.length > 0) {
                                        const escapedWords = searchWords.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
                                        const regex = new RegExp(`(${escapedWords})`, 'gi');
                                        displayHTML = safeHTML.replace(regex, '<strong class="font-extrabold">$1</strong>');
                                    }

                                    // Hiá»ƒn thá»‹ thÃªm nhÃ£n "DÃ¹ng á»Ÿ Tuyáº¿n X" (khÃ´ng nháº¯c gÃ¬ Ä‘áº¿n tá»‰nh)
                                    const labelHtml = (query.length < 1 && field === 'model' && routeVal.length > 0)
                                        ? `<span class="text-[9px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded ml-2 font-bold whitespace-nowrap border border-blue-100">DÃ¹ng á»Ÿ Tuyáº¿n ${app.utils.cleanText(routeVal)}</span>`
                                        : '';

                                     return `<div class="suggestion-item flex justify-between items-start gap-2" onmousedown="event.preventDefault(); const inp = document.getElementById('${inputId}'); inp.value = '${safeJS}'; document.getElementById('${suggestionId}').classList.remove('active'); inp.dispatchEvent(new Event('input')); inp.dispatchEvent(new Event('change'));">
                                                <span class="break-words whitespace-normal leading-snug">${displayHTML}</span>
                                                ${labelHtml}
                                            </div>`;
                                }).join('');
                                box.classList.add('active');
                            } else { box.classList.remove('active'); }
                        } else { box.classList.remove('active'); }
                    } catch (e) {
                        if (e.name !== 'AbortError' && e.message !== 'The user aborted a request.') console.log("Suggestion error:", e.message);
                    }
                },

                loadAnnouncements: () => {
                    app.newsboard.init();
                },

                fetchTopUploaders: async () => {
                    try {
                        let allUploaders = [];
                        let from = 0;
                        let step = 999;
                        let fetchMore = true;

                        while (fetchMore) {
                            const { data, error } = await window.sb
                                .from('photos')
                                .select('uploader_id')
                                .eq('status', 'approved')
                                .range(from, from + step);

                            if (error || !data) break;
                            allUploaders.push(...data);

                            if (data.length <= step) fetchMore = false;
                            from += step + 1;
                        }

                        const counts = {};
                        allUploaders.forEach(p => {
                            if (p.uploader_id) counts[p.uploader_id] = (counts[p.uploader_id] || 0) + 1;
                        });

                        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);

                        app.topUploaders = {};
                        if (sorted.length > 0) app.topUploaders[sorted[0][0]] = 1;
                        if (sorted.length > 1) app.topUploaders[sorted[1][0]] = 2;
                        if (sorted.length > 2) app.topUploaders[sorted[2][0]] = 3;
                    } catch (e) { console.log("Lá»—i táº£i Top:", e); }
                },

                getBadgesHTML: (userId, role, subroles = []) => {
                    let html = '';

                    if (subroles && subroles.includes('dev')) {
                        html += `<span class="badge-shiny" style="background: linear-gradient(135deg, #22c55e, #15803d);" title="Developer"><i class="fa-solid fa-code mr-1 text-[10px]"></i> Dev</span>`;
                    }

                    if (role === 'admin' || role === 'manager') {
                        const badgeClass = role === 'manager' ? 'badge-manager' : 'badge-admin';
                        const badgeText = role === 'manager' ? 'Manager' : 'Admin';
                        const badgeTitle = role === 'manager' ? 'Quáº£n lÃ½ há»‡ thá»‘ng' : 'Administrator';
                        html += `<span class="badge-shiny ${badgeClass}" title="${badgeTitle}"><i class="fa-solid fa-shield-halved mr-1 text-[10px]"></i> ${badgeText}</span>`;
                    }

                     if (userId && app.topUploaders[userId]) {
                         const rank = app.topUploaders[userId];
                         if (rank === 1) html += `<span class="badge-shiny badge-top1" title="Top 1 Uploader"><i class="fa-solid fa-crown mr-1 text-[10px]"></i> Top 1</span>`;
                         else if (rank === 2) html += `<span class="badge-shiny badge-top2" title="Top 2 Uploader"><i class="fa-solid fa-medal mr-1 text-[10px]"></i> Top 2</span>`;
                         else if (rank === 3) html += `<span class="badge-shiny badge-top3" title="Top 3 Uploader"><i class="fa-solid fa-award mr-1 text-[10px]"></i> Top 3</span>`;
                     }
                     return html;
                 },
                 getLast7AM_UTC7: () => {
                     const now = new Date();
                     // Äá»•i giá» hiá»‡n táº¡i sang UTC+7
                     const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
                     const vnTime = new Date(utc + (3600000 * 7));

                     // Thiáº¿t láº­p má»‘c 7:00:00 AM
                     let target = new Date(vnTime);
                     target.setHours(7, 0, 0, 0);

                     // Náº¿u giá» hiá»‡n táº¡i VN < 7h sÃ¡ng, lÃ¹i vá» 7h sÃ¡ng hÃ´m qua
                     if (vnTime.getTime() < target.getTime()) {
                         target.setDate(target.getDate() - 1);
                     }

                     // Chuyá»ƒn ngÆ°á»£c láº¡i sang chuáº©n UTC Ä‘á»ƒ query Supabase
                     const targetUTC = new Date(target.getTime() - (3600000 * 7));
                     return targetUTC.toISOString();
                 }
             },


window.app.ui = {
                alertInterval: null,
                showAlert: (msg, okCallback = null, cancelCallback = null, options = {}) => {
                    // Tá»° Äá»˜NG Báº®T CÃC THÃ”NG BÃO THÃ€NH CÃ”NG VÃ€ CHUYá»‚N SANG TOAST
                    const cleanMsg = (msg || '').toLowerCase();
                    const isSuccess = cleanMsg.includes('thÃ nh cÃ´ng') || cleanMsg.includes('Ä‘Ã£ lÆ°u') || cleanMsg.includes('Ä‘Ã£ cáº­p nháº­t');
                    
                    // Chá»‰ chuyá»ƒn sang Toast náº¿u nÃ³ KHÃ”NG CÃ“ callback báº¯t buá»™c (nÃºt báº¥m lÃ m hÃ nh Ä‘á»™ng gÃ¬ Ä‘Ã³)
                    if (isSuccess && !okCallback && !cancelCallback && !options.countdown) {
                        // Gá»i Toast vÃ  bá» qua viá»‡c báº­t Modal Alert
                        app.toast.show('success', 'ThÃ nh cÃ´ng', msg);
                        return;
                    }

                    if (app.ui.alertInterval) clearInterval(app.ui.alertInterval);

                    document.getElementById('custom-alert-msg').innerHTML = msg;

                    const modal = document.getElementById('custom-alert-modal');
                    const content = document.getElementById('custom-alert-content');
                    const titleEl = document.getElementById('custom-alert-title');
                    const imgEl = document.getElementById('custom-alert-img');
                    const okBtn = document.getElementById('custom-alert-ok-btn');
                    const cancelBtn = document.getElementById('custom-alert-cancel-btn');
                    const iconBox = document.getElementById('custom-alert-icon');

                    if (titleEl) titleEl.innerText = options.title || "ThÃ´ng bÃ¡o";
                    if (iconBox) iconBox.style.display = options.hideButtons ? 'none' : 'flex';

                    if (okBtn) {
                        let defaultText = options.btnOkText || "Äá»“ng Ã½";
                        okBtn.style.display = options.hideButtons ? 'none' : '';

                        if (options.countdown) {
                            okBtn.disabled = true;
                            okBtn.classList.add('opacity-50', 'cursor-not-allowed');
                            let timeLeft = 3;
                            okBtn.innerText = `${defaultText} (${timeLeft})`;

                            app.ui.alertInterval = setInterval(() => {
                                timeLeft--;
                                if (timeLeft <= 0) {
                                    clearInterval(app.ui.alertInterval);
                                    okBtn.disabled = false;
                                    okBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                                    okBtn.innerText = defaultText;
                                } else {
                                    okBtn.innerText = `${defaultText} (${timeLeft})`;
                                }
                            }, 1000);
                        } else {
                            okBtn.disabled = false;
                            okBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                            okBtn.innerText = defaultText;
                        }
                    }

                    if (imgEl) {
                        if (options.imgSrc) {
                            imgEl.src = options.imgSrc;
                            imgEl.classList.remove('hidden');
                        } else {
                            imgEl.src = "";
                            imgEl.classList.add('hidden');
                        }
                    }

                    if (cancelCallback || options.btnCancelText) {
                        cancelBtn.classList.remove('hidden');
                        cancelBtn.innerText = options.btnCancelText || "Há»§y";
                        cancelBtn.style.display = options.hideButtons ? 'none' : '';
                        app.alertCancelCallback = cancelCallback || (() => { });
                    } else {
                        cancelBtn.classList.add('hidden');
                        cancelBtn.style.display = '';
                        app.alertCancelCallback = null;
                    }

                    modal.classList.remove('hidden');
                    content.classList.remove('modal-content-leave');
                    content.classList.add('modal-content-enter');
                    app.alertCallback = okCallback;
                    app.ui.lockScroll();
                },
                closeAlert: (isOk) => {
                    if (app.ui.alertInterval) clearInterval(app.ui.alertInterval);
                    const modal = document.getElementById('custom-alert-modal');
                    const content = document.getElementById('custom-alert-content');

                    content.classList.remove('modal-content-enter');
                    content.classList.add('modal-content-leave');

                    setTimeout(() => {
                        modal.classList.add('hidden');
                        content.classList.remove('modal-content-leave');
                        app.ui.unlockScroll();

                        if (isOk && app.alertCallback) {
                            app.alertCallback();
                        } else if (!isOk && app.alertCancelCallback) {
                            app.alertCancelCallback();
                        }

                        app.alertCallback = null;
                        app.alertCancelCallback = null;
                    }, 200);
                },
                showUploadInfo: () => {
                    const modal = document.getElementById('upload-info-modal');
                    const content = document.getElementById('upload-info-content');
                    modal.classList.remove('hidden');
                    content.classList.remove('modal-content-leave');
                    content.classList.add('modal-content-enter');
                    app.ui.lockScroll();
                },
                closeUploadInfo: () => {
                    const modal = document.getElementById('upload-info-modal');
                    const content = document.getElementById('upload-info-content');
                    content.classList.remove('modal-content-enter');
                    content.classList.add('modal-content-leave');
                    setTimeout(() => {
                        modal.classList.add('hidden');
                        content.classList.remove('modal-content-leave');
                        app.ui.unlockScroll();
                    }, 200);
                },
                showQuotaInfo: () => {
                    const limitStr = app.maintenance.settings['upload_quota']?.reason;
                    const limitTxt = (limitStr && limitStr.trim() !== '') ? limitStr : 'khÃ´ng giá»›i háº¡n';

                    app.ui.showAlert(
                        `Nháº±m báº£o vá»‡ háº¡ táº§ng mÃ¡y chá»§ vÃ  dung lÆ°á»£ng lÆ°u trá»¯, há»‡ thá»‘ng chá»‰ tiáº¿p nháº­n tá»•ng cá»™ng tá»‘i Ä‘a <b>${limitTxt} áº£nh</b> hÃ ng ngÃ y (Ã¡p dá»¥ng chung cho toÃ n server).<br><br>Chu ká»³ sáº½ Ä‘Æ°á»£c tá»± Ä‘á»™ng Ä‘áº·t láº¡i vÃ o má»—i <b>7 giá» sÃ¡ng (Giá» Viá»‡t Nam)</b>.`,
                        null, null, { title: "ChÃ­nh sÃ¡ch giá»›i háº¡n Ä‘Äƒng táº£i", btnOkText: "ÄÃ£ hiá»ƒu" }
                    );
                },
                showPrompt: (msg, defaultValue = '', callback) => {
                    const modal = document.getElementById('custom-prompt-modal');
                    const content = document.getElementById('custom-prompt-content');
                    const titleEl = document.getElementById('custom-prompt-title');
                    const msgEl = document.getElementById('custom-prompt-msg');
                    const inputEl = document.getElementById('custom-prompt-input');
                    const okBtn = document.getElementById('custom-prompt-ok-btn');

                    titleEl.innerText = "Nháº­p thÃ´ng tin";
                    msgEl.innerText = msg;
                    inputEl.value = defaultValue;

                    modal.classList.remove('hidden');
                    content.classList.remove('modal-content-leave');
                    content.classList.add('modal-content-enter');
                    app.promptCallback = callback;
                    app.ui.lockScroll();


                    setTimeout(() => {
                        inputEl.focus();
                        inputEl.select();
                    }, 200);


                    inputEl.onkeydown = (e) => {
                        if (e.key === 'Enter') {
                            app.ui.closePrompt(true);
                        }
                    };


                    okBtn.onclick = () => {
                        if (!inputEl.value.trim()) {
                            app.ui.showAlert("Vui lÃ²ng nháº­p ná»™i dung, khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng!");
                            return;
                        }
                        app.ui.closePrompt(true);
                    };
},
                 closePrompt: (isOk) => {
                     const modal = document.getElementById('custom-prompt-modal');
                     const content = document.getElementById('custom-prompt-content');
                     const inputEl = document.getElementById('custom-prompt-input');

                     content.classList.remove('modal-content-enter');
                     content.classList.add('modal-content-leave');

                     setTimeout(() => {
                         modal.classList.add('hidden');
                         content.classList.remove('modal-content-leave');
                         app.ui.unlockScroll();

                         if (isOk && app.promptCallback) {
                             const value = inputEl.value.trim();
                             app.promptCallback(value);
                         }

                         app.promptCallback = null;
                         inputEl.value = '';
                     }, 200);
                 },

closeCustomRolePrompt: () => {
                    const modal = document.getElementById('custom-role-modal');
                    const content = document.getElementById('custom-role-content');

                    content.classList.remove('modal-content-enter');
                    content.classList.add('modal-content-leave');

                    setTimeout(() => {
                        modal.classList.add('hidden');
                        content.classList.remove('modal-content-leave');
                        app.ui.unlockScroll();
                    }, 200);
                },

                 toggleDenySection: (section) => {
                    app.activeDenySection = section;

                    const quickSection = document.getElementById('deny-section-quick');
                    const customSection = document.getElementById('deny-section-custom');
                    const btnQuick = document.getElementById('btn-deny-quick');
                    const btnCustom = document.getElementById('btn-deny-custom');

                    if (section === 'quick') {

                        quickSection.classList.remove('hidden');
                        customSection.classList.add('hidden');


                        btnQuick.className = "w-full bg-black text-white p-3 text-center font-bold text-sm rounded-lg shadow-sm transition border border-black";
                        btnCustom.className = "w-full bg-white text-gray-700 p-3 text-center font-bold text-sm rounded-lg shadow-sm transition border border-gray-300 hover:bg-gray-50 hover:text-black";


                        document.getElementById('deny-custom-input').value = '';
                    } else if (section === 'custom') {

                        quickSection.classList.add('hidden');
                        customSection.classList.remove('hidden');


                        btnQuick.className = "w-full bg-white text-gray-700 p-3 text-center font-bold text-sm rounded-lg shadow-sm transition border border-gray-300 hover:bg-gray-50 hover:text-black";
                        btnCustom.className = "w-full bg-black text-white p-3 text-center font-bold text-sm rounded-lg shadow-sm transition border border-black";


                        document.querySelectorAll('.deny-quick-cb').forEach(cb => cb.checked = false);
                    }
                },

                showDenyPrompt: (titleStr, callback) => {
                    const modal = document.getElementById('deny-prompt-modal');
                    const content = document.getElementById('deny-prompt-content');
                    const titleEl = document.getElementById('deny-prompt-title');
                    const okBtn = document.getElementById('deny-prompt-ok-btn');
                    const customInput = document.getElementById('deny-custom-input');


                    titleEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation mr-2"></i>${titleStr || 'Tá»« chá»‘i áº£nh'}`;


                    customInput.value = '';
                    document.querySelectorAll('.deny-quick-cb').forEach(cb => cb.checked = false);


                    app.ui.toggleDenySection('quick');

                    modal.classList.remove('hidden');
                    content.classList.remove('modal-content-leave');
                    content.classList.add('modal-content-enter');
                    app.denyPromptCallback = callback;
                    app.ui.lockScroll();


                    okBtn.onclick = () => {
                        let reasonString = '';


                        if (app.activeDenySection === 'quick') {
                            const selectedChecks = Array.from(document.querySelectorAll('.deny-quick-cb:checked')).map(cb => cb.value);
                            if (selectedChecks.length === 0) {
                                app.ui.showAlert("Vui lÃ²ng chá»n Ã­t nháº¥t má»™t lÃ½ do tá»« danh sÃ¡ch!");
                                return;
                            }
                            reasonString = selectedChecks.join(' + ');

                        } else if (app.activeDenySection === 'custom') {
                            const customText = customInput.value.trim();
                            if (!customText) {
                                app.ui.showAlert("Vui lÃ²ng nháº­p lÃ½ do tá»« chá»‘i cá»¥ thá»ƒ!");
                                document.getElementById('deny-custom-input').focus();
                                return;
                            }
                            reasonString = customText;
                        }

                        app.ui.closeDenyPrompt(true, reasonString);
                    };
                },

                closeDenyPrompt: (isOk, reasonString = '') => {
                    const modal = document.getElementById('deny-prompt-modal');
                    const content = document.getElementById('deny-prompt-content');

                    content.classList.remove('modal-content-enter');
                    content.classList.add('modal-content-leave');

                    setTimeout(() => {
                        modal.classList.add('hidden');
                        content.classList.remove('modal-content-leave');
                        app.ui.unlockScroll();

                        if (isOk && app.denyPromptCallback) {
                            app.denyPromptCallback(reasonString);
                        }
                        app.denyPromptCallback = null;
                    }, 200);
                },
                uploadProgressValue: 0,
                progressInterval: null,
                setUploadProgress: (targetPercent, durationMs = 1500) => {
                    const circle = document.getElementById('up-progress-circle');
                    const text = document.getElementById('up-progress-text');
                    if (!circle || !text) return;
                    
                    circle.style.transition = `stroke-dashoffset ${durationMs}ms ease-out, stroke 0.5s ease`;
                    const targetOffset = 339.29 * (1 - targetPercent / 100);
                    circle.setAttribute('stroke-dashoffset', targetOffset.toString());
                    
                    if (app.ui.progressInterval) clearInterval(app.ui.progressInterval);
                    
                    const stepCount = durationMs / 30;
                    const stepSize = (targetPercent - app.ui.uploadProgressValue) / stepCount;
                    
                    app.ui.progressInterval = setInterval(() => {
                        app.ui.uploadProgressValue += stepSize;
                        
                        let displayValue = Math.round(app.ui.uploadProgressValue);
                        if ((stepSize > 0 && displayValue >= targetPercent) || (stepSize < 0 && displayValue <= targetPercent)) {
                            app.ui.uploadProgressValue = targetPercent;
                            displayValue = targetPercent;
                            clearInterval(app.ui.progressInterval);
                        }
                        
                        if (text.innerText.includes('%')) {
                            text.innerText = displayValue + '%';
                        }
                    }, 30);
                },
                showUploadProgress: () => {
                    const modal = document.getElementById('upload-progress-modal');
                    const content = document.getElementById('up-progress-content');
                    const circle = document.getElementById('up-progress-circle');
                    const text = document.getElementById('up-progress-text');
                    const title = document.getElementById('up-progress-title');
                    const desc = document.getElementById('up-progress-desc');
                    const errorBox = document.getElementById('up-progress-error');
                    const infoBox = document.getElementById('up-progress-info');
                    const actions = document.getElementById('up-progress-actions');

                    circle.style.transition = 'none';
                    circle.setAttribute('stroke-dashoffset', '339.29');
                    circle.setAttribute('stroke', '#18181b');

                    app.ui.uploadProgressValue = 0;
                    text.innerHTML = '0%';
                    text.className = 'absolute inset-0 flex items-center justify-center text-2xl font-bold text-black';
                    title.innerText = 'Äang chuáº©n bá»‹...';
                    title.className = 'text-lg font-bold text-gray-900 mb-1';
                    desc.innerText = 'Vui lÃ²ng khÃ´ng rá»i khá»i trang';

                    errorBox.classList.add('hidden');
                    if (infoBox) infoBox.classList.add('hidden');
                    actions.classList.add('hidden');
                    actions.innerHTML = '';

                    modal.classList.remove('hidden');
                    content.classList.remove('modal-content-leave');

                    content.style.opacity = '1';
                    content.classList.add('modal-content-enter');
                    app.ui.lockScroll();

                    setTimeout(() => {
                        app.ui.setUploadProgress(15, 800);
                    }, 150);
                },

                updateUploadSuccess: () => {
                    const circle = document.getElementById('up-progress-circle');
                    const text = document.getElementById('up-progress-text');
                    const title = document.getElementById('up-progress-title');
                    const desc = document.getElementById('up-progress-desc');
                    const infoBox = document.getElementById('up-progress-info');
                    const queueCountSpan = document.getElementById('up-progress-queue-count');
                    const actions = document.getElementById('up-progress-actions');

                    circle.style.transition = 'stroke-dashoffset 0.8s ease-out, stroke 0.5s ease';
                    circle.setAttribute('stroke-dashoffset', '0');
                    circle.setAttribute('stroke', '#16a34a');

                    if (app.ui.progressInterval) clearInterval(app.ui.progressInterval);
                    
                    const interval = setInterval(() => {
                        app.ui.uploadProgressValue += 2;
                        if (app.ui.uploadProgressValue >= 100) {
                            clearInterval(interval);
                            text.innerHTML = '<i class="fa-solid fa-check"></i>';
                            text.classList.replace('text-black', 'text-green-600');
                            text.classList.add('text-4xl', 'modal-content-enter');
                        } else {
                            if (text.innerText.includes('%')) text.innerText = Math.round(app.ui.uploadProgressValue) + '%';
                        }
                    }, 20);

                    title.innerText = 'áº¢nh Ä‘Ã£ upload thÃ nh cÃ´ng';
                    title.classList.replace('text-gray-900', 'text-green-600');
                    desc.innerText = 'áº¢nh sáº½ xuáº¥t hiá»‡n sau khi Ä‘Æ°á»£c admin duyá»‡t!';

                    // Báº­t Ã´ mÃ u vÃ ng vÃ  fetch sá»‘ lÆ°á»£ng hÃ ng Ä‘á»£i
                    if (infoBox && queueCountSpan) {
                        infoBox.classList.remove('hidden');
                        queueCountSpan.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

                        // THÃŠM: TÃ­nh toÃ¡n hÃ ng Ä‘á»£i cÃ³ Æ°u tiÃªn Admin/Manager
                        window.apiFetch('get_pending_photo_queue_admin', {}).catch(e => ({ error: e, data: null }))
                            .then(({ data, error }) => {
                                if (!error && data) {
                                    let ahead = 0;
                                    const isMePrivileged = (app.role === 'admin' || app.role === 'manager');

                                    // Láº¥y áº£nh má»›i nháº¥t vá»«a Ä‘Æ°á»£c thÃªm
                                    const myPhotos = data.filter(p => p.uploader_id === app.user.id).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
                                    if (myPhotos.length === 0) {
                                        queueCountSpan.innerText = Math.max(0, data.length - 1);
                                        return;
                                    }
                                    const myPhoto = myPhotos[0];
                                    const myTime = new Date(myPhoto.created_at).getTime();

                                    data.forEach(p => {
                                        if (p.id === myPhoto.id) return;
                                        const pRole = p.profiles?.role || 'user';
                                        const pPrivileged = (pRole === 'admin' || pRole === 'manager');
                                        const pTime = new Date(p.created_at).getTime();

                                        if (isMePrivileged) {
                                            if (pPrivileged && pTime < myTime) ahead++;
                                        } else {
                                            if (pPrivileged) ahead++;
                                            else if (pTime < myTime) ahead++;
                                        }
                                    });
                                    queueCountSpan.innerText = ahead;
                                } else {
                                    queueCountSpan.innerText = '?';
                                }
                            });
                    }

                    actions.className = "mt-6 flex gap-3 justify-center w-full"; // KhÃ´i phá»¥c class xáº¿p ngang
                    actions.innerHTML = `
                        <button onclick="app.utils.cleanupState(); window.scrollTo({ top: 0, behavior: 'smooth' });" class="flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-md font-bold text-xs hover:bg-gray-50 transition shadow-sm">Upload thÃªm</button>
                        <button onclick="app.utils.navigate('/');" class="flex-1 bg-black text-white py-2.5 rounded-md font-bold text-xs hover:bg-gray-800 transition shadow-sm">Trang chá»§</button>
                    `;
                    actions.classList.remove('hidden');
                },

                updateUploadError: (errMsg) => {
                    const circle = document.getElementById('up-progress-circle');
                    const text = document.getElementById('up-progress-text');
                    const title = document.getElementById('up-progress-title');
                    const desc = document.getElementById('up-progress-desc');
                    const errorBox = document.getElementById('up-progress-error');
                    const actions = document.getElementById('up-progress-actions');


                    circle.style.transition = 'stroke-dashoffset 0.5s ease-out, stroke 0.5s ease';
                    circle.setAttribute('stroke-dashoffset', '339.29');
                    circle.setAttribute('stroke', '#dc2626');


                    let current = parseInt(text.innerText) || 80;
                    const interval = setInterval(() => {
                        current -= 5;
                        if (current <= 0) {
                            clearInterval(interval);
                            text.innerHTML = '<i class="fa-solid fa-exclamation"></i>';
                            text.classList.replace('text-black', 'text-red-600');
                            text.classList.add('text-4xl', 'modal-content-enter');
                        } else {
                            if (text.innerText.includes('%')) text.innerText = current + '%';
                        }
                    }, 10);

                    title.innerText = 'KhÃ´ng thá»ƒ táº£i áº£nh lÃªn';
                    title.classList.replace('text-gray-900', 'text-red-600');

                    // PhÃ¢n loáº¡i lá»—i Ä‘á»ƒ hiá»ƒn thá»‹ tiÃªu Ä‘á» chÃ­nh xÃ¡c
                    let cleanMsg = errMsg;
                    if (errMsg.includes('EXCEPTION:')) {
                        cleanMsg = errMsg.split('EXCEPTION:')[1].trim();
                    }

                    // Tá»± Ä‘á»™ng Ä‘iá»u chá»‰nh tiÃªu Ä‘á» náº¿u lá»—i liÃªn quan Ä‘áº¿n xÃ¡c thá»±c/há»‡ thá»‘ng
                    if (errMsg.toLowerCase().includes('cloudflare') || errMsg.toLowerCase().includes('turnstile')) {
                        title.innerText = 'Lá»—i xÃ¡c thá»±c báº£o máº­t';
                    } else if (errMsg.toLowerCase().includes('image') || errMsg.toLowerCase().includes('upload')) {
                        title.innerText = 'Lá»—i mÃ¡y chá»§ hÃ¬nh áº£nh';
                    } else {
                        title.innerText = 'KhÃ´ng thá»ƒ táº£i áº£nh lÃªn';
                    }

                    desc.innerHTML = `<b class="text-red-700">${cleanMsg}</b>`;
                    
                    const isReported = !errMsg.includes('NO_REPORT'); 
                    const pureErrMsg = errMsg.replace('[NO_REPORT] ', '');

                    // Chá»‰ Ä‘á»ƒ láº¡i mÃ£ lá»—i gá»‘c trong há»™p Ä‘á»
                    errorBox.innerHTML = `MÃ£ lá»—i: ${pureErrMsg}`;
                    errorBox.classList.remove('hidden');

                    const statusText = isReported ? "Lá»—i nÃ y Ä‘Ã£ Ä‘Æ°á»£c thÃ´ng bÃ¡o tá»± Ä‘á»™ng." : "Lá»—i nÃ y sáº½ KHÃ”NG Ä‘Æ°á»£c thÃ´ng bÃ¡o tá»± Ä‘á»™ng.";

                    actions.className = "mt-5 flex flex-col w-full"; // Ghi Ä‘Ã¨ class Ä‘á»ƒ xáº¿p dá»c
                    actions.innerHTML = `
                        <div class="text-[10px] text-black font-medium text-center mb-3">
                            <span class="inline-flex flex-wrap justify-center items-center gap-1">
                                <span>${statusText}</span>
                                <a href="javascript:void(0)" onclick="app.ui.closeUploadProgress(); setTimeout(() => app.utils.navigate('/help/1516405301996421281'), 300)" class="font-bold underline hover:text-gray-800 transition-colors inline-flex items-center">TÃ¬m hiá»ƒu thÃªm & hÆ°á»›ng dáº«n kháº¯c phá»¥c</a>
                            </span>
                        </div>
                        <div class="flex gap-3 w-full">
                            <button onclick="app.ui.closeUploadProgress(); app.utils.resetTurnstile('#upload .cf-turnstile');" class="flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-md font-bold text-xs hover:bg-gray-50 transition shadow-sm">Thá»­ láº¡i</button>
                            <button onclick="app.utils.navigate('/');" class="flex-1 bg-black text-white py-2.5 rounded-md font-bold text-xs hover:bg-gray-800 transition shadow-sm">Trang chá»§</button>
                        </div>
                    `;
                },

                closeUploadProgress: () => {
                    const modal = document.getElementById('upload-progress-modal');
                    modal.classList.add('hidden');
                    app.ui.unlockScroll();
                },
                lockScroll: () => document.body.classList.add('no-scroll'),
                unlockScroll: () => document.body.classList.remove('no-scroll'),
                toggleUserMenu: (forceOpen = null) => {
                    const menu = document.getElementById('user-dropdown');
                    if (!menu) return;
                    const isOpen = menu.classList.contains('opacity-100');
                    let willOpen = !isOpen;
                    if (forceOpen === false) willOpen = false;
                    if (willOpen) {
                        menu.classList.remove('opacity-0', '-translate-y-4', 'pointer-events-none');
                        menu.classList.add('opacity-100', 'translate-y-0', 'pointer-events-auto');
                    } else {
                        menu.classList.remove('opacity-100', 'translate-y-0', 'pointer-events-auto');
                        menu.classList.add('opacity-0', '-translate-y-4', 'pointer-events-none');
                    }
                }
            }

window.app.loadingBar = {
                interval: null,
                timeout1: null,
                timeout2: null,
                start: () => {
                    const bar = document.getElementById('top-loading-bar');
                    if (!bar) return;

                    // XÃ³a dá»©t Ä‘iá»ƒm cÃ¡c vÃ²ng láº·p cÅ© náº¿u ngÆ°á»i dÃ¹ng click liÃªn tá»¥c
                    clearInterval(app.loadingBar.interval);
                    clearTimeout(app.loadingBar.timeout1);
                    clearTimeout(app.loadingBar.timeout2);

                    bar.style.transition = 'none';
                    bar.style.width = '0%';
                    bar.style.opacity = '1';

                    void bar.offsetWidth; // Ã‰p trÃ¬nh duyá»‡t reset CSS ngay láº­p tá»©c

                    bar.style.transition = 'width 0.3s ease, opacity 0.2s ease';
                    bar.style.width = '30%'; // PhÃ³ng nhanh lÃªn 30% cho mÆ°á»£t

                    let progress = 30;
                    app.loadingBar.interval = setInterval(() => {
                        progress += (100 - progress) * 0.1; // Cháº¡y cháº­m dáº§n vá» 90%
                        if (progress > 90) progress = 90;
                        bar.style.width = progress + '%';
                    }, 150);
                },
                finish: () => {
                    const bar = document.getElementById('top-loading-bar');
                    if (!bar) return;

                    clearInterval(app.loadingBar.interval);
                    clearTimeout(app.loadingBar.timeout1);
                    clearTimeout(app.loadingBar.timeout2);

                    bar.style.transition = 'width 0.2s ease-out, opacity 0.2s ease';
                    bar.style.width = '100%'; // PhÃ³ng tháº³ng lÃªn 100%

                    app.loadingBar.timeout1 = setTimeout(() => {
                        bar.style.opacity = '0'; // Má» dáº§n
                        app.loadingBar.timeout2 = setTimeout(() => {
                            bar.style.transition = 'none';
                            bar.style.width = '0%'; // Reset ngáº§m
                        }, 250);
                    }, 250);
                }
            },


window.app.views = {
                currentProfileSort: 'newest',
                currentProfileFilter: 'all',
                _profileCache: {},
                _likedCache: {},
                updateSortFilterUI: () => {
                    const btns = ['all', 'approved', 'pending', 'denied'];
                    btns.forEach(btnId => {
                        const el = document.getElementById('btn-filter-' + btnId);
                        if (el) {
                            if (btnId === app.views.currentProfileFilter) el.className = "px-3 py-1.5 bg-black text-white text-xs font-bold rounded shadow-sm transition whitespace-nowrap border border-black";
                            else el.className = "px-3 py-1.5 bg-white text-gray-600 text-xs font-bold rounded hover:bg-gray-50 transition whitespace-nowrap border border-gray-300";
                        }
                    });

                    const labelEl = document.getElementById('profile-sort-label');
                    if (labelEl) labelEl.innerText = app.views.currentProfileSort === 'newest' ? 'Má»›i nháº¥t' : 'Phá»• biáº¿n nháº¥t';

                    document.querySelectorAll('.profile-sort-item').forEach(item => {
                        item.classList.remove('selected');
                        const icon = item.querySelector('.check-icon');
                        if (icon) icon.classList.add('opacity-0');
                        if (item.dataset.sort === app.views.currentProfileSort) {
                            item.classList.add('selected');
                            if (icon) icon.classList.remove('opacity-0');
                        }
                    });
                },
                sortProfilePhotos: (type) => {
                    app.views.currentProfileSort = type;
                    app.profilePage = 1;
                    const menu = document.getElementById('profile-sort-menu');
                    if (menu) menu.classList.remove('active');
                    app.views.updateSortFilterUI();
                    app.views.fetchProfilePhotosPage(1);
                },
                filterProfilePhotos: (status) => {
                    app.views.currentProfileFilter = status;
                    app.profilePage = 1;
                    app.views.updateSortFilterUI();
                    app.views.fetchProfilePhotosPage(1);
                },
                switch: async (id, updateUrl = true) => {
                    if (id === 'home' && window.location.pathname !== '/' && !window.location.pathname.startsWith('/search')) {
                        app.utils.navigate('/'); return;
                    }
                    if (id === 'upload' && window.location.pathname !== '/upload') {
                        app.utils.navigate('/upload'); return;
                    }
                    if (id === 'admin' && window.location.pathname !== '/admin') {
                        app.utils.navigate('/admin'); return;
                    }

                    if (id === 'admin') {
                        if (!app.user) { app.utils.navigate('/auth'); return; }
                        const { data: securityCheck } = await window.apiFetch('check_role', {});
                        if (!securityCheck || (securityCheck.role !== 'admin' && securityCheck.role !== 'manager')) {
                            app.ui.showAlert("Truy cáº­p bá»‹ tá»« chá»‘i: Báº¡n khÃ´ng cÃ³ quyá»n truy cáº­p.");
                            if (window.location.pathname === '/admin') window.history.pushState({}, '', '/');
                            app.views.switch('home', false);
                            return;
                        }
                    }

                    let mtCheck = false;
                    if (['home', 'search', 'detail', 'vehicle', 'account'].includes(id)) mtCheck = app.maintenance.check('global');
                    else if (id === 'auth') mtCheck = app.maintenance.check('auth');
                    else if (id === 'upload') mtCheck = app.maintenance.check('upload');

                    if (mtCheck) {
                        app.maintenance.showScreen(mtCheck);
                        return; // Äang báº£o trÃ¬ thÃ¬ dá»«ng Ä‘á»•i trang
                    } else {
                        app.maintenance.hideScreen();
                    }

                    if (id === 'auth') {
                        window.dispatchEvent(new CustomEvent('auth-opened'));
                        app.utils.resetTurnstile('#auth .cf-turnstile');
                    }

                    const searchBox = document.getElementById('header-search-box');
                    const headerSpacer = document.getElementById('header-spacer');

                    if (['upload', 'search', 'mobile-upload'].includes(id)) {
                        searchBox.classList.add('hidden');
                        if (headerSpacer) {
                            headerSpacer.classList.remove('h-28');
                            headerSpacer.classList.add('h-20');
                        }
                        if (id === 'upload') {
                            app.upload.fetchRequirements();
                            app.upload.checkQuota();
                            app.upload.checkAndPromptDraft();
                            setTimeout(() => app.uploadMap && app.uploadMap.invalidateSize(), 200);
                            app.utils.resetTurnstile('#upload .cf-turnstile');
                        }
                    } else {
                        searchBox.classList.remove('hidden');
                        if (headerSpacer) {
                            headerSpacer.classList.remove('h-20');
                            headerSpacer.classList.add('h-28');
                        }
                    }

                    if (id === 'upload' && !app.user) { app.utils.navigate('/auth'); return; }

                    if (app.currentViewMode === 'upload' && id !== 'upload') {
                        app.upload.saveDraft();
                    }

                    // --- LOGIC ANIMATION TRÆ¯á»¢T NGANG ---
                    // Cáº¥p báº­c trang Ä‘á»ƒ biáº¿t nÃªn trÆ°á»£t tiáº¿n (pháº£i -> trÃ¡i) hay lÃ¹i (trÃ¡i -> pháº£i)
                    const depths = {
                        'home': 0,
                        'search': 1, 'account': 1, 'upload': 1, 'mobile-upload': 1, 'admin': 1, 'contact': 1, 'help-list': 1, 'comment-dashboard': 1,
                        'detail': 2, 'vehicle': 2, 'operator-view': 2, 'model-view': 2, 'help-detail': 2
                    };

                    const currentId = document.querySelector('.view-section.active')?.id || 'home';
                    const currentDepth = depths[currentId] || 0;
                    const targetDepth = depths[id] || 0;

                    let animationClass = 'slide-in-right'; // Tiáº¿n tá»›i
                    if (targetDepth < currentDepth) {
                        animationClass = 'slide-in-left';  // Quay lÃ¹i láº¡i
                    } else if (targetDepth === currentDepth) {
                        animationClass = 'fade-zoom-in-page'; // Ngang cáº¥p (Fade)
                    }

                    document.querySelectorAll('.view-section').forEach(el => {
                        el.classList.remove('active', 'slide-in-right', 'slide-in-left', 'fade-zoom-in-page');
                    });

                    const targetPath = window.location.pathname + window.location.search;
                    if (app.scrollPositions && app.scrollPositions[targetPath] !== undefined) {
                        window.scrollTo(0, app.scrollPositions[targetPath]);
                    } else {
                        window.scrollTo(0, 0);
                    }

                    const targetEl = document.getElementById(id);
                    if (targetEl) {
                        targetEl.classList.add('active', animationClass);
                        targetEl.onanimationend = () => {
                            targetEl.classList.remove(animationClass);
                            targetEl.onanimationend = null;
                        };
                    }
                },

                loadUserProfile: (username) => {
                    app.utils.navigate(`/user/${encodeURIComponent(username)}`);
                },

                loadHome: async (forceRefresh = false) => {
                    const wasSearch = app.currentViewMode === 'search';
                    app.currentViewMode = 'home';
                    document.title = 'VNBUSARCHIVE';

                    if (app.loadedCount > 0 && !forceRefresh && !wasSearch) {
                        document.getElementById('hero-section').style.display = 'block';
                        document.getElementById('db-stats-section').style.display = 'block';
                        document.getElementById('grid-title').innerText = "áº¢nh má»›i nháº¥t Ä‘Ã£ Ä‘Æ°á»£c duyá»‡t";
                        document.getElementById('search-input').value = "";
                        document.getElementById('btn-clear-search').classList.add('hidden');
                        document.getElementById('search-profile-cards').classList.add('hidden');
                        document.getElementById('load-more-cards-container')?.classList.add('hidden');

                        if (app.loadedCount >= 20) document.getElementById('load-more-container').classList.remove('hidden');

                        app.ui.unlockScroll();
                        app.loadingBar.finish();
                        return;
                    }

                    document.getElementById('hero-section').style.display = 'block';
                    document.getElementById('db-stats-section').style.display = 'block';
                    document.getElementById('grid-title').innerText = "áº¢nh má»›i nháº¥t Ä‘Ã£ Ä‘Æ°á»£c duyá»‡t";
                    document.getElementById('search-input').value = "";
                    document.getElementById('btn-clear-search').classList.add('hidden');
                    document.getElementById('load-more-container').classList.add('hidden');
                    document.getElementById('search-profile-cards').classList.add('hidden');
                    document.getElementById('load-more-cards-container')?.classList.add('hidden');
                    app.search.setFilter('all', false);

                    app.loadedCount = 0;

                    let topQuery = window.sb
                        .from('photos')
                        .select(`*, profiles(id, username, role, subroles), vehicles(model)`)
                        .eq('status', 'approved')
                        .order('views', { ascending: false, nullsFirst: false })
                        .limit(5);

                    topQuery = app.preference.applyFilter(topQuery);
                    const { data: topPhotos } = await topQuery;

// Báº®T Lá»–I RACE CONDITION
                    if (app.currentViewMode !== 'home') return;

                    const heroMain = document.getElementById('hero-main');
                    const heroSub = document.getElementById('hero-sub');

                    if (topPhotos && topPhotos.length > 0) {
                        app.topPhotosCache = topPhotos;
                        const main = topPhotos[0];
                        const safeMainPlate = app.utils.displayPlate(app.utils.cleanText(main.license_plate));
                        const safeMainUser = app.utils.cleanText(main.profiles?.username);
                        heroMain.innerHTML = `
                            <img src="${app.utils.getProxiedUrl(main.url, 'main.jpg', 'full')}" onerror="app.utils.fallbackHeroImage(this, 'topPhotosCache', 0)" class="w-full h-[400px] object-cover block hover:scale-105 transition-transform duration-700 relative z-0">
                            <div class="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-12 pointer-events-none z-10">
                                <p class="text-white font-bold text-lg tracking-tight flex items-center flex-wrap gap-y-1 hero-main-text pointer-events-auto">${safeMainPlate} - ${safeMainUser}</p>
                                <p class="text-gray-300 text-xs mt-1 hero-main-views pointer-events-auto"><i class="fa-solid fa-eye mr-1"></i> ${main.views || 0} lÆ°á»£t xem</p>
                            </div>
                        `;
                        heroMain.onclick = () => app.views.loadDetail(main.id);

                        heroSub.innerHTML = '';
                        for (let i = 1; i < topPhotos.length; i++) {
                            const p = topPhotos[i];
                            heroSub.innerHTML += `
                                <div class="relative group cursor-pointer h-[196px] rounded-md overflow-hidden" onclick="app.views.loadDetail(${p.id})">
                                    <img src="${app.utils.getProxiedUrl(p.url, 'sub.jpg', 'thumb')}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                                    <div class="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent pt-6 pb-2 px-2 text-white text-[10px] truncate">
                                        <i class="fa-solid fa-eye mr-1"></i> ${p.views || 0}
                                    </div>
                                </div>`;
                        }
                    } else {
                        heroMain.innerHTML = '<div class="w-full h-[400px] flex items-center justify-center text-gray-400">ChÆ°a cÃ³ dá»¯ liá»‡u ná»•i báº­t</div>';
                        heroSub.innerHTML = '';
                    }

                    const grid = document.getElementById('photo-grid');
                    let gridQuery = window.sb
                        .from('photos')
                        .select(`*, profiles(id, username, role, subroles), vehicles(model)`)
                        .eq('status', 'approved')
                        .order('created_at', { ascending: false })
                        .range(0, 19);

                    gridQuery = app.preference.applyFilter(gridQuery);
                    const { data: photos } = await gridQuery;

// Báº®T Lá»–I RACE CONDITION
                    if (app.currentViewMode !== 'home') return;

                    if (!photos || photos.length === 0) {
                        grid.innerHTML = '<div class="col-span-full text-center py-10">ChÆ°a cÃ³ áº£nh nÃ o.</div>';
                        return;
                    }

                    app.loadedCount = photos.length;
                    if (photos.length === 20) document.getElementById('load-more-container').classList.remove('hidden');

                    grid.innerHTML = photos.map(p => app.views.renderPhotoCard(p)).join('');

                    try {
                        // 1. Äáº¿m tá»•ng sá»‘ áº£nh
                        const { data: photoCount } = await window.apiFetch('get_approved_photos_count_admin', { filterType: app.preference.current }).catch(e => ({ error: e, data: 0 }));

                        // 2. Äáº¿m sá»‘ Xe vÃ  Tuyáº¿n (Sá»­ dá»¥ng vÃ²ng láº·p Ä‘á»ƒ vÆ°á»£t qua giá»›i háº¡n 1000 row)
                        const uniquePlates = new Set();
                        const uniqueRoutes = new Set();
                        let from = 0;
                        const step = 999;
                        let fetchMore = true;

                        // Gom chung viá»‡c láº¥y Biá»ƒn sá»‘ vÃ  Tuyáº¿n vÃ o 1 truy váº¥n Ä‘á»ƒ tiáº¿t kiá»‡m API Call
                        while (fetchMore) {
                            const { data, error } = await window.apiFetch('get_photo_stats', { filterType: app.preference.current }).catch(e => ({ error: e, data: null }));

                            if (error || !data || data.length === 0) break;

                            data.forEach(item => {
                                if (item.license_plate) {
                                    uniquePlates.add(item.license_plate.trim().toUpperCase());
                                }
                                if (item.route_no && item.route_no !== '---') {
                                    uniqueRoutes.add(item.route_no.trim().toLowerCase());
                                }
                            });

                            if (data.length <= step) {
                                fetchMore = false;
                            } else {
                                from += step + 1;
                            }
                        }

                        // 3. Render ra giao diá»‡n
                        document.getElementById('db-stat-photos').innerText = app.utils.formatCompact(photoCount || 0);
                        document.getElementById('db-stat-vehicles').innerText = app.utils.formatCompact(uniquePlates.size || 0);
                        document.getElementById('db-stat-routes').innerText = app.utils.formatCompact(uniqueRoutes.size || 0);
                        
                    } catch (e) {
                        console.error("Lá»—i táº£i thÃ´ng kÃª:", e);
                    }

                    app.newsboard.checkAndShow();
                    app.views.loadRecommendations();
                    app.loadingBar.finish();
                },

                loadRecommendations: async () => {
                    const recSection = document.getElementById('recommendation-section');
                    const recGrid = document.getElementById('rec-grid');

                    // Náº¿u táº¯t gá»£i Ã½, áº©n luÃ´n section vÃ  dá»«ng hÃ m
                    if (!app.preference.showRecommendations) {
                        return recSection.classList.add('hidden');
                    }

                    try {
                        let prefs = JSON.parse(localStorage.getItem('vnbus_prefs'));


                        const getTop = (obj) => Object.keys(obj).reduce((a, b) => obj[a] > obj[b] ? a : b, '');
                        const topRoute = prefs ? getTop(prefs.routes || {}) : null;
                        const topOp = prefs ? getTop(prefs.ops || {}) : null;
                        const topModel = prefs ? getTop(prefs.models || {}) : null;


                        if (!app.user && !topRoute && !topOp && !topModel) {
                            return recSection.classList.add('hidden');
                        }

                        recSection.classList.remove('hidden');
                        recGrid.innerHTML = '<div class="col-span-full text-center py-2 text-xs font-bold text-gray-700"><i class="fa-solid fa-spinner fa-spin"></i> Äang chá»n lá»c...</div>';



                        let recQuery = window.sb
                            .from('photos')
                            .select('*, vehicles(model)')
                            .eq('status', 'approved')
                            .order('created_at', { ascending: false })
                            .limit(100);

                        recQuery = app.preference.applyFilter(recQuery);
                        const { data: recentPhotos } = await recQuery;

                        if (!recentPhotos || recentPhotos.length === 0) return recSection.classList.add('hidden');

                        let matched =[];

                        if (!app.user) {



                            matched = recentPhotos.filter(p => {
                                const route = p.route_no || '';
                                const op = p.operator || '';
                                const model = p.vehicles?.model || '';
                                return (topRoute && route === topRoute) ||
                                    (topOp && op === topOp) ||
                                    (topModel && model === topModel);
                            });


                            matched = Array.from(new Map(matched.map(item => [item.id, item])).values());
                            matched = matched.sort(() => 0.5 - Math.random()).slice(0, 8);
                        } else {



                            let likedRoutes = new Set();
                            let likedOps = new Set();
                            let likedModels = new Set();
                            let likedPhotoIds = new Set();


                            const { data: likedData } = await window.apiFetch('get_user_liked_photos', { userId: app.user.id }).catch(e => ({ error: e, data: null }));
                            const likedIds = likedData ? likedData.map(l => l.photo_id) :[];

                            if (likedIds.length > 0) {
                                likedIds.forEach(id => likedPhotoIds.add(id));



                                const { data: likedPhotos } = await window.sb
                                    .from('photos')
                                    .select('*, vehicles(model)')
                                    .in('id', likedIds);

                                if (likedPhotos) {
                                    likedPhotos.forEach(p => {
                                        if (p.route_no && p.route_no !== '---') likedRoutes.add(p.route_no);
                                        if (p.operator && p.operator !== '---') likedOps.add(p.operator);
                                        if (p.vehicles?.model && p.vehicles.model !== '---') likedModels.add(p.vehicles.model);
                                    });
                                }
                            }


                            if (likedIds.length === 0 && !topRoute && !topOp && !topModel) {
                                return recSection.classList.add('hidden');
                            }


                            let scoredPhotos =[];
                            recentPhotos.forEach(p => {

                                if (likedPhotoIds.has(p.id)) return;

                                const route = p.route_no || '';
                                const op = p.operator || '';
                                const model = p.vehicles?.model || '';

                                let score = 0;


                                if (topRoute && route === topRoute) score += 1;
                                if (topOp && op === topOp) score += 1;
                                if (topModel && model === topModel) score += 1;


                                if (route && likedRoutes.has(route)) score += 2;
                                if (op && likedOps.has(op)) score += 2;
                                if (model && likedModels.has(model)) score += 2;

                                if (score > 0) {
                                    p._score = score;
                                    scoredPhotos.push(p);
                                }
                            });


                            scoredPhotos = Array.from(new Map(scoredPhotos.map(item => [item.id, item])).values());


                            scoredPhotos.sort((a, b) => {
                                if (b._score !== a._score) return b._score - a._score;
                                return 0.5 - Math.random();
                            });


                            matched = scoredPhotos.slice(0, 8);
                        }

                        if (matched.length === 0) return recSection.classList.add('hidden');

                        recGrid.innerHTML = matched.map(p => `
                            <div class="relative group cursor-pointer aspect-square rounded-md overflow-hidden shadow-sm hover:shadow-lg transition-all border border-white/40" onclick="app.views.loadDetail(${p.id})">
                                <img loading="lazy" decoding="async" src="${app.utils.getProxiedUrl(p.url, 'rec.jpg', 'thumb')}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
                                <div class="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-2 text-white">
                                    <div class="text-[10px] font-bold truncate tracking-wide">${app.utils.displayPlate(p.license_plate)}</div>
                                </div>
                            </div>
                        `).join('');

                    } catch (e) {
                        console.error("Recommend logic error:", e);
                        recSection.classList.add('hidden');
                    }
                },

                loadMoreSearchCards: (isInitial = false) => {
                    const container = document.getElementById('search-profile-cards');
                    const btnContainer = document.getElementById('load-more-cards-container');
                    if (!container || !btnContainer) return;

                    if (isInitial) {
                        app.loadedSearchCardsCount = 0;
                        container.innerHTML = '';
                    }

                    const start = app.loadedSearchCardsCount || 0;
                    const limit = isInitial ? 4 : 12;
                    const end = start + limit;

                    const cardsToRender = app.currentSearchCards.slice(start, end);

                    if (cardsToRender.length > 0) {
                        container.innerHTML += cardsToRender.join('');
                        container.classList.remove('hidden');

                        app.loadedSearchCardsCount = start + cardsToRender.length;

                        if (app.loadedSearchCardsCount >= app.currentSearchCards.length) {
                            btnContainer.classList.add('hidden');
                        } else {
                            btnContainer.classList.remove('hidden');
                        }
                    } else if (isInitial) {
                        container.classList.add('hidden');
                        btnContainer.classList.add('hidden');
                    }
                },

                loadMorePhotos: async () => {
                    const isSearch = app.currentViewMode === 'search';
                    const btnContainerId = isSearch ? 'search-load-more-container' : 'load-more-container';
                    const gridId = isSearch ? 'search-photo-grid' : 'photo-grid';

                    const btn = document.querySelector(`#${btnContainerId} button`);
                    const originalText = btn.innerHTML;
                    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Äang táº£i...';
                    btn.disabled = true;

                    const start = app.loadedCount;
                    const end = start + 11;
                    const grid = document.getElementById(gridId);

                    if (isSearch) {
                        const photos = app.currentSearchResults.slice(start, end + 1);
                        if (photos.length > 0) {
                            grid.innerHTML += photos.map(p => app.views.renderPhotoCard(p)).join('');
                            app.loadedCount += photos.length;
                            if (app.loadedCount >= app.currentSearchResults.length) {
                                document.getElementById('search-load-more-container').classList.add('hidden');
                            } else {
                                document.getElementById('search-load-more-container').classList.remove('hidden');
                            }
                        } else {
                            document.getElementById('search-load-more-container').classList.add('hidden');
                        }
                    } else {
                        let moreQuery = window.sb
                            .from('photos')
                            .select(`*, profiles(id, username, role, subroles), vehicles(model)`)
                            .eq('status', 'approved')
                            .order('created_at', { ascending: false })
                            .range(start, end);

                        moreQuery = app.preference.applyFilter(moreQuery);
                        const { data: photos } = await moreQuery;

                        if (photos && photos.length > 0) {
                            const existingIds = Array.from(grid.querySelectorAll('[data-id]')).map(el => el.getAttribute('data-id'));
                            const uniquePhotos = photos.filter(p => !existingIds.includes(String(p.id)));

                            if (uniquePhotos.length > 0) {
                                grid.innerHTML += uniquePhotos.map(p => app.views.renderPhotoCard(p)).join('');
                            }
                            app.loadedCount += photos.length;
                            if (photos.length < 12) document.getElementById('load-more-container').classList.add('hidden');
                        } else {
                            document.getElementById('load-more-container').classList.add('hidden');
                        }
                    }

                    btn.innerHTML = originalText;
                    btn.disabled = false;
                },

                renderPhotoCard: (p) => {
                    const safePlate = app.utils.displayPlate(app.utils.cleanText(p.license_plate));
                    const safeOp = app.utils.cleanText(p.operator || 'ÄÃ£ bá»‹ xÃ³a');
                    const safeUser = app.utils.cleanText(p.profiles?.username || 'áº¨n danh');

                    // Sá»­ dá»¥ng mode 'thumb' Ä‘á»ƒ tá»‘i Æ°u kÃ­ch thÆ°á»›c áº£nh preview
                    const proxyUrl = app.utils.getProxiedUrl(p.url, `${safePlate}.jpg`, 'thumb');

                    // Láº¥y NgÃ y chá»¥p (taken_at) thay vÃ¬ NgÃ y Ä‘Äƒng
                    const dateStr = p.taken_at ? p.taken_at.split('T')[0].split('-').reverse().join('/') : new Date(p.created_at).toLocaleDateString('vi-VN');

                    return `
                        <div data-id="${p.id}" class="bg-white border border-gray-200 hover:border-gray-300 hover:shadow-lg cursor-pointer rounded-xl p-2 transition-all flex flex-col fade-zoom-in-page" onclick="app.views.loadDetail(${p.id})">
                            <div class="img-wrapper relative w-full aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-100">
                                <div class="img-spinner absolute inset-0 flex items-center justify-center text-gray-400">
                                    <i class="fa-solid fa-circle-notch fa-spin text-2xl"></i>
                                </div>
                                <img loading="lazy" src="${proxyUrl}"
                                     onload="app.utils.handleImgLoad(this)"
                                     onerror="app.utils.handleImgError(this)"
                                     alt="Xe buÃ½t ${safePlate}"
                                     class="absolute inset-0 w-full h-full object-cover opacity-0 transition-all duration-500 hover:scale-105">
                                <div class="img-error absolute inset-0 hidden flex-col items-center justify-center p-4 text-center bg-red-50/50">
                                    <i class="fa-solid fa-image-slash text-red-400 text-2xl mb-1"></i>
                                    <span class="text-[10px] font-bold text-red-500 leading-tight">áº¢nh hiá»‡n khÃ´ng thá»ƒ<br>Ä‘Æ°á»£c táº£i</span>
                                </div>
                            </div>

                            <div class="pt-3 px-1.5 pb-1 flex-1 flex flex-col justify-between">
                                <div>
                                    <div class="font-bold text-sm text-black">${safePlate}</div>
                                    <div class="text-xs text-gray-600 font-semibold truncate">${safeOp}</div>
                                </div>
                                <div class="text-[10px] text-gray-400 mt-2 flex justify-between">
                                    <span class="truncate pr-2">${safeUser}</span>
                                    <span class="shrink-0"><i class="fa-regular fa-calendar mr-1"></i>${dateStr}</span>
                                </div>
                            </div>
                        </div>
                    `;
                },

                loadAccount: async (usernameStr = null, forceRefresh = false) => {
                    let targetUsername = usernameStr;
                    let isOwnProfile = false;

                    if (!targetUsername) {
                        if (!app.user) return app.utils.navigate('/auth');
                        targetUsername = app.username;
                        isOwnProfile = true;
                        if (window.location.pathname !== '/profile') return app.utils.navigate('/profile');
                    } else {
                        isOwnProfile = (app.user && app.username === targetUsername);
                        if (isOwnProfile && window.location.pathname !== '/profile') return app.utils.navigate('/profile');
                        if (!isOwnProfile && window.location.pathname !== `/user/${encodeURIComponent(targetUsername)}`) return app.utils.navigate(`/user/${encodeURIComponent(targetUsername)}`);
                    }

                    // KIá»‚M TRA QUAY Láº I CÃ™NG 1 PROFILE (TrÃ¡nh load láº¡i tá»« Ä‘áº§u lÃ m giáº­t trang)
                    const isReturningToSameProfile = (app.lastLoadedUsername === targetUsername) && !forceRefresh;
                    app._isOwnProfile = isOwnProfile;
                    app.lastLoadedUsername = targetUsername;

                    app.views.switch('account', false);
                    document.title = isOwnProfile ? 'TÃ i khoáº£n cá»§a tÃ´i | VNBUSARCHIVE' : `Há»“ sÆ¡: ${targetUsername} | VNBUSARCHIVE`;

                    // Náº¿u quay láº¡i cÃ¹ng 1 profile vÃ  Ä‘Ã£ cÃ³ giao diá»‡n -> Bá» qua pháº§n gá»i API táº¡o giao diá»‡n láº¡i
                    if (isReturningToSameProfile && document.getElementById('acc-name').innerText !== '...') {
                        app.loadingBar.finish();
                        return;
                    }

                    // --- RESET UI TRá»NG Äá»‚ CHá»NG NHÃY THÃ”NG TIN CÅ¨ ---
                    document.getElementById('acc-name').innerText = '...';
                    document.getElementById('acc-avatar-img').classList.add('hidden');
                    document.getElementById('acc-avatar-icon').classList.remove('hidden');
                    document.getElementById('profile-bio-content').innerHTML = '<i class="fa-solid fa-spinner fa-spin text-gray-400"></i>';
                    document.getElementById('profile-fav-photo-container').innerHTML = '';
                    document.getElementById('my-stat-photos').innerHTML = '<i class="fa-solid fa-spinner fa-spin text-gray-400"></i>';
                    document.getElementById('my-stat-views').innerHTML = '<i class="fa-solid fa-spinner fa-spin text-gray-400"></i>';
                    document.getElementById('my-stat-likes').innerHTML = '<i class="fa-solid fa-spinner fa-spin text-gray-400"></i>';
                    document.getElementById('my-photos-grid').innerHTML = '<p class="text-xs text-gray-500 col-span-4 text-center py-10"><i class="fa-solid fa-spinner fa-spin"></i> Äang táº£i dá»¯ liá»‡u...</p>';
                    document.getElementById('liked-photos-grid').innerHTML = '<p class="text-xs text-gray-500 col-span-4 text-center py-10"><i class="fa-solid fa-spinner fa-spin"></i> Äang táº£i dá»¯ liá»‡u...</p>';
                    document.getElementById('approval-rate-island').classList.add('hidden');
                    // --------------------------------------------------

                    const { data: profile } = await window.apiFetch('get_profile', { username: targetUsername });
                    if (window.location.pathname !== (isOwnProfile ? '/profile' : `/user/${encodeURIComponent(targetUsername)}`)) return;

                    if (!profile) {
                        app.ui.showAlert("KhÃ´ng tÃ¬m tháº¥y ngÆ°á»i dÃ¹ng nÃ y.");
                        return app.views.loadHome();
                    }

                    const targetUserId = profile.id;
                    app.currentProfileId = targetUserId;

                    if (Object.keys(app.topUploaders).length === 0) await app.utils.fetchTopUploaders();

                    const badges = app.utils.getBadgesHTML(profile.id, profile.role, profile.subroles);
                    document.getElementById('acc-name').innerHTML = `${profile.username} ${badges}`;

                    const avatarIcon = document.getElementById('acc-avatar-icon');
                    const avatarImg = document.getElementById('acc-avatar-img');
                    const safeAvatar = profile.avatar_url ? app.utils.getProxiedUrl(profile.avatar_url, 'avatar.jpg', 'avatar') : DEFAULT_AVATAR;

                    avatarImg.src = safeAvatar;
                    avatarImg.onerror = () => { avatarImg.src = DEFAULT_AVATAR; };
                    avatarImg.classList.remove('hidden');
                    avatarIcon.classList.add('hidden');

                    // --- RENDER GIAO DIá»†N GIá»šI THIá»†U (BIO & FAV PHOTO) ---
                    const bioContent = document.getElementById('profile-bio-content');
                    const bioControls = document.getElementById('profile-bio-controls');
                    
                    if (profile.bio) bioContent.innerHTML = app.utils.cleanText(profile.bio);
                    else bioContent.innerHTML = '<span class="text-gray-400 italic">ChÆ°a cÃ³ thÃ´ng tin giá»›i thiá»‡u.</span>';
                    
                    if (isOwnProfile) {
                        bioControls.classList.remove('hidden');
                        bioControls.classList.add('flex');
                    } else {
                        bioControls.classList.add('hidden');
                        bioControls.classList.remove('flex');
                    }

                    const favContainer = document.getElementById('profile-fav-photo-container');
                    const favControls = document.getElementById('profile-fav-photo-controls');
                    const btnAddFav = document.getElementById('btn-add-fav-photo');
                    const placeholderWrap = document.getElementById('fav-photo-placeholder'); // <-- Láº¥y Ä‘Ãºng Wrapper

                    if (profile.favorite_photo_id) {
                        window.apiFetch('get_favorite_photo', { favoritePhotoId: profile.favorite_photo_id }).catch(e => ({ error: e, data: null }))
                        .then(({data: favPhoto}) => {
                            if (favPhoto) {
                                // áº¨n cÃ¡i ná»n rÃ¡c Ä‘i
                                placeholderWrap.classList.add('hidden');
                                placeholderWrap.classList.remove('flex');

                                favContainer.innerHTML = `
                                    <img src="${app.utils.getProxiedUrl(favPhoto.url, 'fav.jpg', 'thumb')}" class="absolute inset-0 w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-700 pointer-events-auto" onclick="app.views.loadDetail(${favPhoto.id})">
                                `;
                                if (isOwnProfile) {
                                    favControls.classList.remove('hidden');
                                    favControls.classList.add('flex');
                                    btnAddFav.classList.add('hidden');
                                    btnAddFav.classList.remove('flex');
                                } else {
                                    favControls.classList.add('hidden');
                                    btnAddFav.classList.add('hidden');
                                }
                            } else {
                                favContainer.innerHTML = '';
                                favControls.classList.add('hidden');
                                favControls.classList.remove('flex');
                                if (isOwnProfile) {
                                    btnAddFav.classList.remove('hidden');
                                    btnAddFav.classList.add('flex');
                                    placeholderWrap.classList.add('hidden');
                                    placeholderWrap.classList.remove('flex');
                                } else {
                                    placeholderWrap.classList.remove('hidden');
                                    placeholderWrap.classList.add('flex');
                                    btnAddFav.classList.add('hidden');
                                }
                            }
                        });
                    } else {
                        favContainer.innerHTML = '';
                        favControls.classList.add('hidden');
                        favControls.classList.remove('flex');
                        if (isOwnProfile) {
                            btnAddFav.classList.remove('hidden');
                            btnAddFav.classList.add('flex');
                            
                            // Nick chá»§ thÃ¬ áº¨N "ChÆ°a cÃ³ áº£nh"
                            placeholderWrap.classList.add('hidden');
                            placeholderWrap.classList.remove('flex');
                        } else {
                            // NgÆ°á»i xem thÃ¬ HIá»†N "ChÆ°a cÃ³ áº£nh"
                            placeholderWrap.classList.remove('hidden');
                            placeholderWrap.classList.add('flex');
                            btnAddFav.classList.add('hidden');
                        }
                    }
                    // --- Káº¾T THÃšC RENDER GIá»šI THIá»†U ---

                    const likedSection = document.getElementById('acc-liked-section');
                    const reportBtn = document.getElementById('btn-report-profile');
                    const manageCommentBtn = document.getElementById('btn-manage-comments'); // Láº¥y nÃºt Quáº£n lÃ½ BL

                    if (isOwnProfile) {
                        likedSection.classList.remove('hidden');
                        reportBtn.classList.add('hidden');
                        if (document.getElementById('btn-detailed-stats')) document.getElementById('btn-detailed-stats').classList.remove('hidden');
                        if (manageCommentBtn) manageCommentBtn.classList.remove('hidden'); // HIá»†N NÃšT
                        document.getElementById('profile-stats-title').innerText = "THá»NG KÃŠ HOáº T Äá»˜NG";
                        document.getElementById('profile-photos-title').innerText = "áº¢nh cá»§a báº¡n";
                    } else {
                        likedSection.classList.add('hidden');
                        reportBtn.classList.remove('hidden');
                        if (document.getElementById('btn-detailed-stats')) document.getElementById('btn-detailed-stats').classList.add('hidden');
                        if (manageCommentBtn) manageCommentBtn.classList.add('hidden'); // áº¨N NÃšT
                        document.getElementById('profile-stats-title').innerText = "THá»NG KÃŠ Cá»¦A " + profile.username.toUpperCase();
                        document.getElementById('profile-photos-title').innerText = "áº¢nh Ä‘Ã£ Ä‘Äƒng";
                    }

                    // Gá»ŒI HÃ€M RPC Äá»‚ Láº¤Y THá»NG KÃŠ SIÃŠU Tá»C
                    document.getElementById('my-stat-photos').innerHTML = '<i class="fa-solid fa-spinner fa-spin text-gray-400"></i>';
                    document.getElementById('my-stat-views').innerHTML = '<i class="fa-solid fa-spinner fa-spin text-gray-400"></i>';
                    document.getElementById('my-stat-likes').innerHTML = '<i class="fa-solid fa-spinner fa-spin text-gray-400"></i>';

                    const { data: stats, error: statsError } = await window.apiFetch('get_user_profile_stats', { targetUserId, isOwnProfile }).catch(e => ({ error: e, data: null }));

                    if (!statsError && stats && stats.length > 0) {
                        document.getElementById('my-stat-photos').innerText = app.utils.formatCompact(stats[0].total_photos);
                        document.getElementById('my-stat-views').innerText = app.utils.formatCompact(stats[0].total_views);
                        document.getElementById('my-stat-likes').innerText = app.utils.formatCompact(stats[0].total_likes);

                        const approvalIsland = document.getElementById('approval-rate-island');
                        if (isOwnProfile && stats[0].total_photos > 0) {
                            const { data: approvedCount, error: approvedError } = await window.apiFetch('get_user_approved_count', { targetUserId }).catch(e => ({ error: e, data: 0 }));
                            const { data: deniedCount, error: deniedError } = await window.apiFetch('get_user_denied_count', { targetUserId }).catch(e => ({ error: e, data: 0 }));

                            const processedCount = (approvedError || deniedError) ? 0 : ((approvedCount || 0) + (deniedCount || 0));
                            if (processedCount > 0) {
                                const rate = Math.round(((approvedCount || 0) / processedCount) * 100);
                                const rateValueEl = document.getElementById('approval-rate-value');
                                const gradientEl = document.getElementById('approval-gradient');

                                rateValueEl.innerText = `${rate}%`;
                                rateValueEl.classList.remove('text-green-600', 'text-red-600');
                                gradientEl.classList.remove('from-green-100', 'from-red-100');

                                if (rate >= 85) { rateValueEl.classList.add('text-green-600'); gradientEl.classList.add('from-green-100'); }
                                else { rateValueEl.classList.add('text-red-600'); gradientEl.classList.add('from-red-100'); }

                                approvalIsland.classList.remove('hidden');
                            } else {
                                approvalIsland.classList.add('hidden');
                            }
                        } else if (approvalIsland) {
                            approvalIsland.classList.add('hidden');
                        }
                    }

                    if (!isReturningToSameProfile) {
                        app.views.currentProfileSort = 'newest';
                        app.views.currentProfileFilter = 'all';
                        app.profilePage = 1;
                        app.likedPage = 1;
                    }

                    const filterContainer = document.getElementById('profile-photo-filters');
                    if (filterContainer) {
                        if (isOwnProfile) filterContainer.classList.remove('hidden');
                        else filterContainer.classList.add('hidden');
                    }

                    app.views.updateSortFilterUI();
                    await app.views.fetchProfilePhotosPage(app.profilePage || 1);

                    if (isOwnProfile) await app.views.fetchLikedPhotosPage(app.likedPage || 1);

                    app.lastLoadedUsername = targetUsername;

                    app.loadingBar.finish();
                },

                fetchProfilePhotosPage: async (page) => {
                    app.profilePage = page;
                    const size = app.PROFILE_PAGE_SIZE || 12;
                    const fromRow = (page - 1) * size;
                    const toRow = fromRow + size - 1;
                    const grid = document.getElementById('my-photos-grid');

                    // Táº O KHÃ“A CACHE DUY NHáº¤T
                    const cacheKey = `${app.currentProfileId}_${app.views.currentProfileFilter}_${app.views.currentProfileSort}_${page}`;

                    // Náº¾U TRANG NÃ€Y ÄÃƒ Táº¢I TRÆ¯á»šC ÄÃ“ -> Láº¤Y Tá»ª CACHE RA XÃ€I NGAY Láº¬P Tá»¨C
                    if (app.views._profileCache[cacheKey]) {
                        const { photos, count } = app.views._profileCache[cacheKey];
                        app.views.renderProfileGridHTML(photos, count, page);
                        return;
                    }

                    if (grid.children.length === 0) {
                        grid.innerHTML = '<p class="text-xs text-gray-500 col-span-4 text-center py-10"><i class="fa-solid fa-spinner fa-spin"></i> Äang táº£i dá»¯ liá»‡u...</p>';
                    } else {
                        grid.style.opacity = '0.5';
                        grid.style.pointerEvents = 'none';
                    }

                    const { data, count, error } = await window.apiFetch('get_profile_photos', {
                        profileId: app.currentProfileId,
                        isOwnProfile: app._isOwnProfile,
                        profileFilter: app.views.currentProfileFilter,
                        filterType: app.preference.current,
                        sort: app.views.currentProfileSort,
                        fromRow, toRow
                    }).catch(e => ({ error: e, data: null, count: 0 }));
                    if (error) console.error(error);
                    const photos = data || [];
                    if (!photos || photos.length === 0) {
                        grid.style.opacity = '1';
                        grid.style.pointerEvents = 'auto';
                        grid.innerHTML = '<p class="text-xs text-gray-500 col-span-4 text-center py-4">Chưa có ảnh nào.</p>';
                        const pagerEl = document.getElementById('profile-pager');
                        if (pagerEl) pagerEl.innerHTML = '';
                        return;
                    }

                    // LÆ¯U VÃ€O CACHE TRÆ¯á»šC KHI RENDER
                    app.views._profileCache[cacheKey] = { photos, count };
                    app.views.renderProfileGridHTML(photos, count, page);
                },

                // HÃ m há»— trá»£ render (Ä‘á»ƒ trÃ¡nh láº·p code)
                renderProfileGridHTML: (photos, count, page) => {
                    const grid = document.getElementById('my-photos-grid');
                    grid.style.opacity = '1';
                    grid.style.pointerEvents = 'auto';
                    grid.innerHTML = photos.map(p => {
                        let cardStyleClasses = "profile-photo-item cursor-pointer group transition-all duration-300 relative";
                        let textHtml = `<span class="block truncate">${app.utils.cleanText(app.utils.displayPlate(p.license_plate))}</span>`;

                        if (app._isOwnProfile) {
                            if (p.status === 'approved') {
                                cardStyleClasses += " !border-2 !border-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] hover:shadow-[0_0_14px_rgba(34,197,94,0.8)] hover:z-10";
                                textHtml = `<span class="block truncate font-bold drop-shadow-md">${app.utils.cleanText(app.utils.displayPlate(p.license_plate))}</span>`;
                            } else if (p.status === 'pending') {
                                cardStyleClasses += " !border-2 !border-[#f58e27] shadow-[0_0_8px_rgba(245,142,39,0.5)] hover:shadow-[0_0_14px_rgba(245,142,39,0.8)] hover:z-10";
                                textHtml = `<span class="block truncate group-hover:hidden">${app.utils.cleanText(app.utils.displayPlate(p.license_plate))}</span><span class="hidden truncate group-hover:block font-bold drop-shadow-md tracking-wide">Äang chá» duyá»‡t...</span>`;
                            } else if (p.status === 'denied') {
                                cardStyleClasses += " !border-2 !border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] hover:shadow-[0_0_14px_rgba(239,68,68,0.8)] hover:z-10";
                                textHtml = `<span class="block truncate group-hover:hidden">${app.utils.cleanText(app.utils.displayPlate(p.license_plate))}</span><span class="hidden truncate group-hover:block font-bold drop-shadow-md tracking-wide">ÄÃ£ bá»‹ tá»« chá»‘i</span>`;
                            }
                        }

                        return `
                            <div class="${cardStyleClasses}" onclick="app.views.loadDetail('${p.id}')">
                                <img loading="lazy" decoding="async" src="${app.utils.getProxiedUrl(p.url, 'profile.jpg', 'thumb')}" class="w-full h-full object-cover">
                                <div class="absolute bottom-0 left-0 bg-black/70 text-white text-[10px] w-full p-1.5 backdrop-blur-sm transition-all duration-300">
                                    ${textHtml}
                                </div>
                            </div>
                        `;
                    }).join('');

                    const size = app.PROFILE_PAGE_SIZE || 12;
                    const totalPages = Math.ceil(count / size);
                    let pagerEl = document.getElementById('profile-pager');
                    if (!pagerEl) {
                        pagerEl = document.createElement('div');
                        pagerEl.id = 'profile-pager';
                        grid.parentNode.insertBefore(pagerEl, grid.nextSibling);
                    }

                    if (totalPages <= 1) { pagerEl.innerHTML = ''; return; }
                    pagerEl.innerHTML = `<div id="profile-pagination-container" class="mt-4 w-full"></div><p class="text-center text-[10px] text-gray-400 mt-3">Trang ${page}/${totalPages} Â· Tá»•ng ${count} áº£nh</p>`;
                    app.utils.renderPagination('profile-pagination-container', page, totalPages, (newPage) => app.views.fetchProfilePhotosPage(newPage));
                },
                fetchLikedPhotosPage: async (page) => {
                    app.likedPage = page;
                    const size = app.PROFILE_PAGE_SIZE || 12;
                    const fromRow = (page - 1) * size;
                    const toRow = fromRow + size - 1;
                    const grid = document.getElementById('liked-photos-grid');

                    // CACHE LIKED PHOTOS
                    const cacheKey = `liked_${app.currentProfileId}_${page}`;
                    if (app.views._likedCache[cacheKey]) {
                        const { likedData, count } = app.views._likedCache[cacheKey];
                        app.views.renderLikedGridHTML(likedData, count, page);
                        return;
                    }

                    if (grid.children.length === 0) {
                        grid.innerHTML = '<p class="text-xs text-gray-500 col-span-4 text-center py-10"><i class="fa-solid fa-spinner fa-spin"></i> Äang táº£i áº£nh Ä‘Ã£ thÃ­ch...</p>';
                    } else {
                        grid.style.opacity = '0.5';
                        grid.style.pointerEvents = 'none';
                    }

                    const { data: likedData, count, error } = await window.apiFetch('get_my_liked_photos', {
                        userId: app.user.id,
                        filterType: app.preference.current,
                        fromRow, toRow
                    }).catch(e => ({ error: e, data: null, count: 0 }));

                    if (error || !likedData || likedData.length === 0) {
                        grid.style.opacity = '1';
                        grid.style.pointerEvents = 'auto';
                        grid.innerHTML = '<p class="text-xs text-gray-500 col-span-4 text-center py-4">Báº¡n chÆ°a thÃ­ch áº£nh nÃ o.</p>';
                        const pagerEl = document.getElementById('liked-pager');
                        if (pagerEl) pagerEl.innerHTML = '';
                        return;
                    }

                    // LÆ¯U CACHE VÃ€ RENDER
                    app.views._likedCache[cacheKey] = { likedData, count };
                    app.views.renderLikedGridHTML(likedData, count, page);
                },

                renderLikedGridHTML: (likedData, count, page) => {
                    const grid = document.getElementById('liked-photos-grid');
                    grid.style.opacity = '1';
                    grid.style.pointerEvents = 'auto';
                    grid.innerHTML = likedData.map(item => {
                        const p = item.photos;
                        return `
                        <div class="profile-photo-item cursor-pointer hover:shadow-md transition-shadow" onclick="app.views.loadDetail(${p.id})">
                            <img loading="lazy" decoding="async" src="${app.utils.getProxiedUrl(p.url, 'liked.jpg', 'thumb')}" class="w-full h-full object-cover">
                            <div class="absolute bottom-0 left-0 bg-black/60 text-white text-[10px] w-full p-1.5 truncate backdrop-blur-sm">
                                ${app.utils.displayPlate(p.license_plate)} - ${p.operator || 'N/A'}
                            </div>
                        </div>`
                    }).join('');

                    const size = app.PROFILE_PAGE_SIZE || 12;
                    const totalPages = Math.ceil(count / size);
                    let pagerEl = document.getElementById('liked-pager');
                    if (!pagerEl) {
                        pagerEl = document.createElement('div');
                        pagerEl.id = 'liked-pager';
                        grid.parentNode.insertBefore(pagerEl, grid.nextSibling);
                    }
                    if (totalPages <= 1) { pagerEl.innerHTML = ''; return; }
                    pagerEl.innerHTML = `<div id="liked-pagination-container" class="mt-4 w-full"></div><p class="text-center text-[10px] text-gray-400 mt-3">Trang ${page}/${totalPages} Â· Tá»•ng ${count} áº£nh</p>`;
                    app.utils.renderPagination('liked-pagination-container', page, totalPages, (newPage) => app.views.fetchLikedPhotosPage(newPage));
                },

                loadDetail: async (photoId, forceRefresh = false) => {
                    if (window.location.pathname !== `/photo/${photoId}`) {
                        app.utils.navigate(`/photo/${photoId}`);
                        return;
                    }

                    // --- KIá»‚M TRA Bá»˜ NHá»š Táº M: Náº¾U VÃ€O Láº I ÄÃšNG áº¢NH ÄÃ“ THÃŒ Má»ž LUÃ”N, KHÃ”NG Táº¢I Láº I ---
                    if (app.currentPhoto && String(app.currentPhoto.id) === String(photoId) && !forceRefresh) {
                        app.views.switch('detail', false);
                        app.loadingBar.finish();
                        return;
                    }

                    // --- RESET UI AN TOÃ€N TRÆ¯á»šC KHI Táº¢I DATA ---
                    document.getElementById('detail-title').innerText = 'Äang táº£i dá»¯ liá»‡u...';
                    document.getElementById('crumb-model').innerText = '...';
                    
                    const imgEl = document.getElementById('detail-img');
                    if (imgEl) {
                        imgEl.style.opacity = '0';
                        const wrapper = imgEl.closest('.img-wrapper');
                        if (wrapper) {
                            const errorBox = wrapper.querySelector('.img-error');
                            const spinner = wrapper.querySelector('.img-spinner');
                            if (errorBox) errorBox.classList.add('hidden');
                            if (spinner) spinner.style.display = 'flex';
                        }
                    }
                    
                    const statUploader = document.getElementById('stat-uploader');
                    if (statUploader) statUploader.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-gray-400"></i>';
                    
                    const statDate = document.getElementById('stat-date');
                    if (statDate) statDate.innerText = '...';
                    
                    const statViews = document.getElementById('stat-views');
                    if (statViews) statViews.innerText = '0';
                    
                    const statLikes = document.getElementById('stat-likes');
                    if (statLikes) statLikes.innerText = '0';
                    
                    ['info-plate', 'info-operator', 'info-route', 'info-model', 'info-location', 'info-note', 'info-camera', 'info-exif-params'].forEach(id => {
                        const el = document.getElementById(id);
                        if (el) el.value = '';
                    });
                    
                    const historyList = document.getElementById('history-list');
                    if (historyList) historyList.innerHTML = '<tr><td colspan="4" class="text-center py-2"><i class="fa-solid fa-spinner fa-spin"></i> Äang táº£i...</td></tr>';
                    
                    const commentList = document.getElementById('comment-list');
                    if (commentList) commentList.innerHTML = '<p class="text-center text-gray-400 py-10"><i class="fa-solid fa-circle-notch fa-spin"></i> Äang táº£i...</p>';
                    
                    const detailRecGrid = document.getElementById('detail-rec-grid');
                    if (detailRecGrid) detailRecGrid.innerHTML = '';
                    
                    const fbCommentsWrapper = document.getElementById('fb-comments-wrapper');
                    if (fbCommentsWrapper) fbCommentsWrapper.innerHTML = '';
                    // -------------------------------------------------------------------

                    const { data: photo } = await window.sb
                        .from('photos')
                        .select(`*, profiles(id, username, avatar_url, role, subroles), vehicles(model)`)
                        .eq('id', photoId)
                        .single();

                    // Báº®T Lá»–I RACE CONDITION
                    if (window.location.pathname !== `/photo/${photoId}`) return;

                    if (!photo) {
                        app.ui.showAlert("áº¢nh khÃ´ng tá»“n táº¡i hoáº·c Ä‘Ã£ bá»‹ xÃ³a khá»i há»‡ thá»‘ng.");
                        return app.views.loadHome();
                    }

                    app.currentPhoto = photo;
                    app.currentPlate = photo.license_plate;
                    const v = photo.vehicles;

                    const snapshot = {
                        operator: photo.operator,
                        type: photo.type || 'bus',
                        route_no: photo.route_no,
                        model: v?.model
                    };
                    app.currentVehicle = { ...v, ...snapshot };

                    if (snapshot) {
                        try {
                            let prefs = JSON.parse(localStorage.getItem('vnbus_prefs') || '{"routes":{}, "ops":{}, "models":{}}');
                            if (snapshot.route_no && snapshot.route_no !== '---') prefs.routes[snapshot.route_no] = (prefs.routes[snapshot.route_no] || 0) + 1;
                            if (snapshot.operator && snapshot.operator !== '---') prefs.ops[snapshot.operator] = (prefs.ops[snapshot.operator] || 0) + 1;
                            if (snapshot.model && snapshot.model !== '---') prefs.models[snapshot.model] = (prefs.models[snapshot.model] || 0) + 1;
                            localStorage.setItem('vnbus_prefs', JSON.stringify(prefs));
                        } catch (e) { }
                    }

                    const isDenied = photo.status === 'denied';
                    const isPending = photo.status === 'pending';

                    if (isPending) {
                        if (!app.user || app.user.id !== photo.uploader_id) {
                            app.ui.showAlert("Báº¡n khÃ´ng cÃ³ quyá»n xem áº£nh Ä‘ang chá» duyá»‡t nÃ y.");
                            return app.views.loadHome();
                        }
                    }

                    if (isDenied) {
                        if (!app.user || (app.user.id !== photo.uploader_id && app.role !== 'manager')) {
                            app.ui.showAlert("Báº¡n khÃ´ng cÃ³ quyá»n xem áº£nh bá»‹ tá»« chá»‘i nÃ y.");
                            return app.views.loadHome();
                        }
                        document.getElementById('denial-reason-box').classList.remove('hidden');
                        document.getElementById('denial-reason-text').innerText = photo.denial_reason || 'KhÃ´ng rÃµ lÃ½ do';
                    } else {
                        document.getElementById('denial-reason-box').classList.add('hidden');
                    }

                    if (isPending) {
                        document.getElementById('pending-status-box').classList.remove('hidden');
                        const queueBox = document.getElementById('pending-queue-box');
                        if (queueBox) {
                            queueBox.classList.remove('hidden');
                            document.getElementById('pending-queue-count').innerText = '...';

                            window.apiFetch('get_pending_photos_queue', {}).catch(e => ({ error: e, data: null }))
                                .then(({ data, error }) => {
                                    if (!error && data) {
                                        let ahead = 0;
                                        const myRole = photo.profiles?.role || 'user';
                                        const isMePrivileged = (myRole === 'admin' || myRole === 'manager');
                                        const myTime = new Date(photo.created_at).getTime();

                                        data.forEach(p => {
                                            if (p.id === photo.id) return;
                                            const pRole = p.profiles?.role || 'user';
                                            const pPrivileged = (pRole === 'admin' || pRole === 'manager');
                                            const pTime = new Date(p.created_at).getTime();

                                            if (isMePrivileged) {
                                                if (pPrivileged && pTime < myTime) ahead++;
                                            } else {
                                                if (pPrivileged) ahead++;
                                                else if (pTime < myTime) ahead++;
                                            }
                                        });
                                        document.getElementById('pending-queue-count').innerText = ahead;
                                    } else {
                                        document.getElementById('pending-queue-count').innerText = '?';
                                    }
                                });
                        }
                    } else {
                        document.getElementById('pending-status-box').classList.add('hidden');
                        const queueBox = document.getElementById('pending-queue-box');
                        if (queueBox) queueBox.classList.add('hidden');
                    }

                    const views = isDenied ? 0 : ((photo.views || 0) + 1);

                    if (!isDenied) {
                        await window.apiFetch('increment_views', { photoId, views }).catch(e => console.error(e));
                    }
                    document.getElementById('detail-title').innerText = `${app.utils.displayPlate(photo.license_plate)} - ${snapshot.operator || 'ÄÃ£ bá»‹ xÃ³a'}`;

                    const pageTitle = `${app.utils.displayPlate(photo.license_plate)} - ${snapshot.operator || 'ÄÃ£ bá»‹ xÃ³a'} | VNBUSARCHIVE`;
                    const pageDesc = `áº¢nh chá»¥p chi tiáº¿t xe buÃ½t/xe khÃ¡ch ${app.utils.displayPlate(photo.license_plate)} thuá»™c Ä‘Æ¡n vá»‹ ${snapshot.operator}, dÃ²ng xe ${snapshot.model}.`;
                    const pageImg = app.utils.getProxiedUrl(photo.url);
                    if (window.location.pathname === `/photo/${photoId}`) {
                        app.utils.updateMetaTags(pageTitle, pageDesc, pageImg);
                    }
                    document.getElementById('crumb-model').innerText = app.utils.displayPlate(photo.license_plate);


                    const proxyUrl = app.utils.getProxiedUrl(photo.url, `${app.utils.displayPlate(photo.license_plate)}.jpg`);

                    imgEl.style.display = 'block';
                    imgEl.style.opacity = '0';
                    const wrapper2 = imgEl.closest('.img-wrapper');
                    if(wrapper2) {
                        const errBox2 = wrapper2.querySelector('.img-error');
                        const spinner2 = wrapper2.querySelector('.img-spinner');
                        if (errBox2) errBox2.classList.add('hidden');
                        if (spinner2) spinner2.style.display = 'flex';
                    }

                    imgEl.onload = () => app.utils.handleImgLoad(imgEl);
                    imgEl.onerror = () => app.utils.handleImgError(imgEl);

                    imgEl.src = proxyUrl;
                    imgEl.alt = `HÃ¬nh áº£nh xe buÃ½t ${app.utils.displayPlate(photo.license_plate)} - ${snapshot.operator || 'ÄÃ£ bá»‹ xÃ³a'}`;
                    imgEl.title = "Nháº¥n vÃ o áº£nh Ä‘á»ƒ phÃ³ng to toÃ n mÃ n hÃ¬nh";
                    imgEl.style.cursor = 'zoom-in';

                    imgEl.onclick = () => {
                        app.admin.openZoom(proxyUrl, true);
                    };

                    const safeUploaderName = app.utils.cleanText(photo.profiles?.username || 'áº¨n danh');
                    document.getElementById('detail-copyright').innerHTML = `Báº£n quyá»n &copy; <strong>${safeUploaderName}</strong>`;

                    app.edit.cancel();

                    const elInfoPlate = document.getElementById('info-plate');
                    const elInfoOperator = document.getElementById('info-operator');
                    const elInfoRoute = document.getElementById('info-route');
                    const elInfoModel = document.getElementById('info-model');
                    const elInfoType = document.getElementById('info-type');
                    const elInfoLocation = document.getElementById('info-location');
                    const elInfoNote = document.getElementById('info-note');
                    const elInfoDate = document.getElementById('info-date');
                    const elInfoCamera = document.getElementById('info-camera');
                    const elInfoExif = document.getElementById('info-exif-params');

                    if (elInfoPlate) elInfoPlate.value = photo.license_plate;
                    if (elInfoOperator) elInfoOperator.value = snapshot.operator || 'ÄÃ£ bá»‹ xÃ³a';
                    if (elInfoType) elInfoType.value = snapshot.type || 'bus';
                    if (elInfoRoute) elInfoRoute.value = snapshot.route_no || 'ÄÃ£ bá»‹ xÃ³a';
                    const lblDetailRoute = document.getElementById('lbl-detail-route');
                    if (lblDetailRoute) lblDetailRoute.innerText = snapshot.type === 'coach' ? 'Lá»™ trÃ¬nh' : 'MÃ£ sá»‘ tuyáº¿n';
                    if (elInfoModel) elInfoModel.value = snapshot.model || 'ÄÃ£ bá»‹ xÃ³a';
                    if (elInfoLocation) elInfoLocation.value = photo.location || '---';
                    if (elInfoNote) elInfoNote.value = photo.note || '---';

                    const displayDate = photo.taken_at || photo.created_at;
                    if (elInfoDate) elInfoDate.value = displayDate ? displayDate.split('T')[0] : '';
                    if (elInfoCamera) elInfoCamera.value = photo.camera_model || 'N/A';
                    if (elInfoExif) elInfoExif.value = photo.exif_params || 'N/A';

                    const statUploaderEl = document.getElementById('stat-uploader');

                    if (Object.keys(app.topUploaders).length === 0) {
                        await app.utils.fetchTopUploaders();
                    }

                    const badges = app.utils.getBadgesHTML(photo.profiles?.id, photo.profiles?.role, photo.profiles?.subroles);
                    const safeAvatar = photo.profiles?.avatar_url ? app.utils.getProxiedUrl(photo.profiles.avatar_url.replace(/"/g, '&quot;'), 'avatar.jpg', 'avatar') : DEFAULT_AVATAR;

                    if (photo.profiles?.avatar_url) {
                        statUploaderEl.innerHTML = `<img loading="lazy" decoding="async" src="${safeAvatar}" onerror="this.onerror=null;this.src='${DEFAULT_AVATAR}';" class="w-5 h-5 rounded-full inline-block mr-1 object-cover align-middle"> ${safeUploaderName} ${badges}`;
                    } else {
                        statUploaderEl.innerHTML = `<img loading="lazy" decoding="async" src="${DEFAULT_AVATAR}" class="w-5 h-5 rounded-full inline-block mr-1 object-cover align-middle"> ${safeUploaderName} ${badges}`;
                    }
                    statUploaderEl.onclick = () => app.views.loadUserProfile(photo.profiles?.username);

                    document.getElementById('stat-date').innerText = new Date(photo.created_at).toLocaleDateString('vi-VN');
                    document.getElementById('stat-views').innerText = views;

                    let realLikeCount = 0;
                    const { data: count } = await window.apiFetch('get_photo_like_count', { photoId }).catch(e => ({ error: e, data: 0 }));
                    realLikeCount = isDenied ? 0 : (count || 0);

                    document.getElementById('stat-likes').innerText = realLikeCount;

                    let isLikedByMe = false;
                    if (app.user) {
                        const { data: likeData } = await window.apiFetch('check_user_liked_photo', { photoId, userId: app.user.id }).catch(e => ({ error: e, data: null }));
                        if (likeData) isLikedByMe = true;
                    }

                    const likeBtn = document.getElementById('btn-like');
                    const deleteBtn = document.getElementById('btn-request-delete');

                    if (isLikedByMe || isDenied) {
                        likeBtn.classList.replace('bg-black', 'bg-gray-400');
                        likeBtn.innerHTML = isDenied ? 'áº¢nh Ä‘Ã£ bá»‹ tá»« chá»‘i' : '<i class="fa-solid fa-check"></i> ÄÃ£ thÃ­ch';
                        likeBtn.disabled = isDenied;
                    } else {
                        likeBtn.classList.replace('bg-gray-400', 'bg-black');
                        likeBtn.innerHTML = '<i class="fa-regular fa-thumbs-up"></i> ThÃ­ch áº£nh nÃ y';
                        likeBtn.disabled = false;
                    }

                    const reapproveBtn = document.getElementById('btn-manager-reapprove');
                    deleteBtn.onclick = null;
                    deleteBtn.classList.add('hidden');
                    if (reapproveBtn) {
                        reapproveBtn.onclick = null;
                        reapproveBtn.classList.add('hidden');
                    }

                    if (app.user && app.user.id === photo.uploader_id) {
                        deleteBtn.classList.remove('hidden');
                        if (isPending || isDenied) {
                            deleteBtn.innerHTML = `<i class="fa-solid fa-trash-can mr-1"></i> XÃ³a áº£nh ${isDenied ? '(Bá»‹ tá»« chá»‘i)' : '(Äang chá» duyá»‡t)'}`;
                            deleteBtn.className = "w-full border border-gray-500 text-gray-600 py-2.5 text-sm font-bold rounded-md hover:bg-gray-50 transition shadow-sm";
                        } else {
                            deleteBtn.innerHTML = '<i class="fa-solid fa-trash-can mr-1"></i> YÃªu cáº§u xÃ³a áº£nh';
                            deleteBtn.className = "w-full border border-red-500 text-red-600 py-2.5 text-sm font-bold rounded-md hover:bg-red-50 transition shadow-sm";
                        }
                        deleteBtn.onclick = () => app.photo.requestDelete();
                    }
                    else if (app.user && app.role === 'manager' && !isDenied) {
                        deleteBtn.classList.remove('hidden');
                        deleteBtn.innerHTML = '<i class="fa-solid fa-radiation mr-1"></i> Manager: XÃ³a áº£nh nÃ y';
                        deleteBtn.className = "w-full bg-red-600 border border-red-600 text-white py-2.5 text-sm font-bold rounded-md hover:bg-red-700 transition shadow-sm";
                        deleteBtn.onclick = () => {
                            app.ui.showDenyPrompt("ADMIN - XÃ³a áº£nh nÃ y", async (reason) => {
                                try {
                                    await window.apiFetch('admin_deny_photo', { photoId: photo.id, reason });
                                    app.admin.logAction('admin_delete_from_detail', photo.id, { plate: photo.license_plate, reason: reason });
                                    app.toast.show('success', 'ÄÃ£ xÃ³a áº£nh', 'áº¢nh Ä‘Ã£ Ä‘Æ°á»£c xÃ³a khá»i há»‡ thá»‘ng thÃ nh cÃ´ng.');
                                    app.views.loadHome();
                                } catch (e) { app.ui.showAlert("Lá»—i: " + e.message); }
                            });
                        };
                    }

                    if (app.user && app.role === 'manager' && isDenied) {
                        if (reapproveBtn) {
                            reapproveBtn.classList.remove('hidden');
                            reapproveBtn.onclick = () => {
                                app.ui.showPrompt("Nháº­p ghi chÃº cho viá»‡c duyá»‡t láº¡i (TÃ¹y chá»n):", "", async (reason) => {
                                    try {
                                        const originalText = reapproveBtn.innerHTML;
                                        reapproveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Äang xá»­ lÃ½...';
                                        reapproveBtn.disabled = true;

                                        const { error } = await window.apiFetch('admin_approve_photo', { photoId: photo.id }).catch(e => ({ error: e }));
                                        if (error) throw error;
                                        app.admin.logAction('manager_reapprove', photo.id, { plate: photo.license_plate, reason: reason });

                                        app.toast.show('success', 'ÄÃ£ duyá»‡t láº¡i', 'áº¢nh nÃ y Ä‘Ã£ Ä‘Æ°á»£c cáº¥p phÃ©p hiá»ƒn thá»‹ trá»Ÿ láº¡i trÃªn há»‡ thá»‘ng.');
                                        app.views.loadDetail(photo.id);
                                    } catch (e) {
                                        app.ui.showAlert("Lá»—i: " + e.message);
                                        reapproveBtn.innerHTML = '<i class="fa-solid fa-rotate-left mr-1"></i> Manager: Duyá»‡t láº¡i áº£nh nÃ y';
                                        reapproveBtn.disabled = false;
                                    }
                                });
                            };
                        }
                    }

                    const historyPlate = v?.license_plate || photo.license_plate;
                    
                    // --- CHá»T CHáº¶N CUá»I CÃ™NG TRÃNH Lá»–I KÃ‰O NGÆ¯á»¢C GIAO DIá»†N ---
                    // Náº¿u URL hiá»‡n táº¡i khÃ´ng cÃ²n lÃ  áº£nh nÃ y ná»¯a (do user Ä‘Ã£ báº¥m back/thoÃ¡t ra), 
                    // Dá»«ng ngay láº­p tá»©c, khÃ´ng load Lá»‹ch sá»­, Báº£n Ä‘á»“ hay BÃ¬nh luáº­n Facebook ná»¯a.
                    if (window.location.pathname !== `/photo/${photoId}`) return;
                    
                    app.views.loadHistory(historyPlate);

                    // ÄÃƒ XÃ“A Lá»†NH app.views.switch('detail', false); Táº I ÄÃ‚Y Äá»‚ TRÃNH Lá»–I JUMP UI

                    if (photo.location && photo.location !== '---') {
                        app.utils.showDetailMap(photo.location);
                    } else {
                        document.getElementById('detail-map').style.display = 'none';
                    }

                    app.views.loadDetailRecommendations(photo, snapshot);
                    app.comments.init(photoId);

                    const fbSection = document.getElementById('fb-comments-section');
                    // fbCommentsWrapper Ä‘Ã£ Ä‘Æ°á»£c khai bÃ¡o á»Ÿ Ä‘áº§u hÃ m
                    
                    if (fbCommentsWrapper) {
                        if (photo.status === 'approved') {
                            if (fbSection) fbSection.classList.remove('hidden');
                            const currentUrl = window.location.origin + '/photo/' + photoId;
                            fbCommentsWrapper.innerHTML = '<div class="fb-comments" data-href="' + currentUrl + '" data-width="100%" data-numposts="5"></div>';
                            
                            const tryRenderFB = () => {
                                if (window.FB) window.FB.XFBML.parse(fbCommentsWrapper);
                                else setTimeout(tryRenderFB, 300);
                            };
                            tryRenderFB();
                        } else {
                            if (fbSection) fbSection.classList.add('hidden');
                            fbCommentsWrapper.innerHTML = '';
                        }
                    }

                    app.loadingBar.finish();
                },

                loadDetailRecommendations: async (photo, snapshot) => {
                    const recSection = document.getElementById('detail-recommendation-section');
                    const recGrid = document.getElementById('detail-rec-grid');
                    if (!recSection || !recGrid) return;

                    // Náº¿u táº¯t gá»£i Ã½, áº©n luÃ´n section vÃ  dá»«ng hÃ m
                    if (!app.preference.showRecommendations) {
                        return recSection.classList.add('hidden');
                    }

                    recSection.classList.add('hidden');
                    recGrid.innerHTML = '<div class="col-span-full text-center py-4 text-gray-500"><i class="fa-solid fa-spinner fa-spin"></i> Äang táº£i gá»£i Ã½...</div>';
                    recSection.classList.remove('hidden');

                    try {
                        const promises = [];

                        // Cáº¥u hÃ¬nh tÃ¬m 3 tiÃªu chÃ­ Ä‘áº§u tiÃªn
                        const queriesConfig = [
                            { type: 'operator', val: snapshot.operator },
                            { type: 'route_no', val: snapshot.route_no },
                            { type: 'uploader_id', val: photo.uploader_id }
                        ];

                        queriesConfig.forEach(cfg => {
                            if (cfg.val && cfg.val !== '---') {
                                promises.push(window.apiFetch('get_related_photos', { photoId: photo.id, type: cfg.type, val: cfg.val, filterType: app.preference.current }).catch(e => ({ error: e, data: [] })));
                            }
                        });

                        // Láº¥y áº£nh ngáº«u nhiÃªn lÃ m Backup dá»± phÃ²ng thiáº¿u (náº±m á»Ÿ vá»‹ trÃ­ cuá»‘i máº£ng Promise)
                        promises.push(window.apiFetch('get_backup_photos', { photoId: photo.id, filterType: app.preference.current }).catch(e => ({ error: e, data: [] })));

                        // Äáº©y táº¥t cáº£ truy váº¥n cháº¡y song song cho tá»‘c Ä‘á»™ nhanh nháº¥t
                        const results = await Promise.all(promises);

                        // --- THÃŠM CHá»T CHáº¶N TRÃNH Váº¼ Gá»¢I Ã NHáº¦M SANG áº¢NH KHÃC ---
                        if (app.currentPhoto && app.currentPhoto.id !== photo.id) return;
                        if (window.location.pathname !== `/photo/${photo.id}`) return;
                        // --------------------------------------------------------

                        let finalPhotos = [];
                        let usedIds = new Set([photo.id]); // Chá»‘ng trÃ¹ng láº·p áº£nh vá»›i nhau

                        // Nháº·t má»—i tiÃªu chÃ­ Ä‘Ãºng 1 áº£nh
                        for (let i = 0; i < promises.length - 1; i++) {
                            const data = results[i].data || [];
                            data.sort(() => 0.5 - Math.random()); // Trá»™n ngáº«u nhiÃªn
                            for (const p of data) {
                                if (!usedIds.has(p.id)) {
                                    finalPhotos.push(p);
                                    usedIds.add(p.id);
                                    break;
                                }
                            }
                        }

                        // Xá»­ lÃ½ tiÃªu chÃ­ DÃ²ng xe (pháº£i Ä‘i Ä‘Æ°á»ng vÃ²ng qua báº£ng vehicles)
                        if (snapshot.model && snapshot.model !== '---') {
                            const { data: vData } = await window.apiFetch('get_vehicles_by_model', { model: snapshot.model }).catch(e => ({ error: e, data: [] }));
                            if (vData && vData.length > 0) {
                                const plates = vData.map(v => v.license_plate);
                                const { data: mPhotos } = await window.apiFetch('get_related_photos_by_plates', { photoId: photo.id, plates, filterType: app.preference.current }).catch(e => ({ error: e, data: [] }));
                                if (mPhotos) {
                                    mPhotos.sort(() => 0.5 - Math.random());
                                    for (const p of mPhotos) {
                                        if (!usedIds.has(p.id)) {
                                            finalPhotos.push(p);
                                            usedIds.add(p.id);
                                            break;
                                        }
                                    }
                                }
                            }
                        }

                        // BÃ¹ lá»— há»•ng (náº¿u < 4 áº£nh) báº±ng cÃ¡c áº£nh Backup
                        const backupData = results[results.length - 1].data || [];
                        backupData.sort(() => 0.5 - Math.random());
                        for (const p of backupData) {
                            if (finalPhotos.length >= 4) break;
                            if (!usedIds.has(p.id)) {
                                finalPhotos.push(p);
                                usedIds.add(p.id);
                            }
                        }

                        // Náº¿u cÃ³ áº£nh, xÃ¡o trá»™n láº§n cuá»‘i vÃ  in ra giao diá»‡n
                        if (finalPhotos.length > 0) {
                            finalPhotos.sort(() => 0.5 - Math.random());
                            recGrid.innerHTML = finalPhotos.slice(0, 4).map(p => app.views.renderPhotoCard(p)).join('');
                        } else {
                            recSection.classList.add('hidden');
                        }

                    } catch (e) {
                        console.error("Lá»—i load Detail Recommendations:", e);
                        recSection.classList.add('hidden');
                    }
                },

                loadHistory: async (plate) => {
                    const editUi = document.getElementById('history-edit-ui');
                    if(editUi) editUi.classList.add('hidden');
                    
                    const tbody = document.getElementById('history-list');
                    if(tbody) tbody.innerHTML = '<tr><td colspan="4" class="text-center py-2"><i class="fa-solid fa-spinner fa-spin text-gray-400"></i> Äang táº£i...</td></tr>';

                    const { data: history } = await window.sb
                        .from('vehicle_history')
                        .select('*')
                        .eq('license_plate', plate);

                    // --- CHá»T CHáº¶N ÄÃƒ Sá»¬A Lá»–I: KIá»‚M TRA Báº°NG BIáº¾N THAY VÃŒ URL ---
                    if (app.currentPlate !== plate) return;
                    if (!window.location.pathname.startsWith('/photo/') && !window.location.pathname.startsWith('/vehicle/')) return;
                    // -------------------------------------------------------------

                    let parsedHistory = (history || []).map(h => {
                        if (!h.effective_date && h.note) {
                            const dateMatch = h.note.match(/Tá»« ngÃ y:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i);
                            if (dateMatch) {
                                const parts = dateMatch[1].split('/');
                                h.effective_date = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                                h.note = h.note.replace(dateMatch[0], '').trim();
                            }
                        }
                        return h;
                    }).sort((a, b) => new Date(a.effective_date || '1970-01-01') - new Date(b.effective_date || '1970-01-01'));

                    app.vehicle.currentHistoryData = parsedHistory;
                    
                    if(!tbody) return; // Cháº·n lá»—i náº¿u tháº» HTML Ä‘Ã£ bá»‹ há»§y
                    tbody.innerHTML = '';

                    if (parsedHistory.length > 0) {
                        parsedHistory.forEach(h => {
                            let displayPlate = h.license_plate;
                            let displayNote = h.note || '';

                            const match = displayNote.match(/BKS cÅ©:\s*([A-Z0-9.-]+)/i);
                            if (match) {
                                displayPlate = match[1];
                                displayNote = displayNote.replace(match[0], '').trim();
                            }
                            displayNote = displayNote.replace(/^[-,]\s*/, '').trim();

                            const safePlate = app.utils.cleanText(displayPlate);
                            const safeOp = app.utils.cleanText(h.operator);
                            const safeRoute = app.utils.cleanText(h.route || '-');
                            const safeNote = app.utils.cleanText(displayNote);

                            tbody.innerHTML += `
                                <tr>
                                    <td class="font-bold">${safePlate}</td>
                                    <td>${safeOp}</td>
                                    <td>${safeRoute}</td>
                                    <td class="text-xs text-gray-500">${safeNote}</td>
                                </tr>
                            `;
                        });
                    } else {
                        tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-gray-500">ChÆ°a cÃ³ lá»‹ch sá»­ hoáº¡t Ä‘á»™ng.</td></tr>';
                    }
                    if (document.getElementById('hist-new-plate')) document.getElementById('hist-new-plate').value = plate;
                },

                loadContact: () => {
                    if (window.location.pathname !== '/contact') {
                        app.utils.navigate('/contact');
                        return;
                    }
                    document.title = 'LiÃªn há»‡ há»— trá»£ | VNBUSARCHIVE';
                    app.views.switch('contact', false);
                    app.loadingBar.finish();
                },

                loadVehiclePage: async (plate, forceRefresh = false) => {
                    const decodedPath = decodeURIComponent(window.location.pathname);
                    if (decodedPath !== `/vehicle/${encodeURIComponent(plate)}`) {
                        app.utils.navigate(`/vehicle/${encodeURIComponent(plate)}`);
                        return;
                    }

                    // --- Sá»¬A Lá»–I TRáº®NG TRANG: TÃCH RIÃŠNG BIáº¾N CACHE Cá»¦A XE ---
                    // KhÃ´ng dÃ¹ng chung app.currentPlate vá»›i trang áº£nh ná»¯a, mÃ  dÃ¹ng app.vehicle._renderedPlate
                    if (app.vehicle._renderedPlate === plate && document.getElementById('vehicle').innerHTML.includes('history-table') && !forceRefresh) {
                        app.loadingBar.finish();
                        return;
                    }

                    app.vehicle._renderedPlate = null; // Äáº·t láº¡i tráº¡ng thÃ¡i
                    const container = document.getElementById('vehicle');
                    container.innerHTML = '<div class="text-center py-20"><i class="fa-solid fa-circle-notch fa-spin text-2xl text-gray-400"></i></div>';

                    try {

                        const [vehicleRes, allPhotosRes, historyRes] = await Promise.all([
                            window.apiFetch('get_vehicle_by_plate', { plate }).catch(e => ({ error: e, data: null })),
                            window.apiFetch('get_photos_by_plate', { plate, filterType: app.preference.current }).catch(e => ({ error: e, data: [] })),
                            window.apiFetch('get_vehicle_history', { plate }).catch(e => ({ error: e, data: [] }))
                        ]);

// Báº®T Lá»–I RACE CONDITION
                    if (window.location.pathname !== `/vehicle/${encodeURIComponent(plate)}`) return;

                        const vehicle = vehicleRes.data;
                        if (!vehicle) {
                            app.ui.showAlert("KhÃ´ng tÃ¬m tháº¥y thÃ´ng tin cho xe nÃ y.", () => app.views.loadHome());
                            return;
                        }

                        const allPhotos = allPhotosRes.data || [];
                        
                        // YÃŠU Cáº¦U XE PHáº¢I CÃ“ ÃT NHáº¤T 1 áº¢NH ÄÆ¯á»¢C DUYá»†T Má»šI CHO XEM Há»’ SÆ 
                        if (allPhotos.length === 0) {
                            app.ui.showAlert("Há»“ sÆ¡ áº©n: Xe nÃ y chÆ°a cÃ³ áº£nh nÃ o Ä‘Æ°á»£c duyá»‡t trÃªn há»‡ thá»‘ng.", () => app.views.loadHome());
                            return;
                        }

                        const pageTitle = `Há»“ sÆ¡ xe ${vehicle.license_plate} | VNBUSARCHIVE`;
                        app.vehiclePhotosCache = allPhotos;
                        // Láº¥y áº£nh á»Ÿ Ä‘áº§u danh sÃ¡ch (má»›i chá»¥p nháº¥t theo taken_at)
                        const topPhoto = allPhotos.length > 0 ? allPhotos[0] : null;
                        const isCoach = topPhoto && topPhoto.type === 'coach';


                        const specialRoutes = ['Dá»«ng hoáº¡t Ä‘á»™ng', 'NgoÃ i giá» hoáº¡t Ä‘á»™ng', 'ChÆ°a hoáº¡t Ä‘á»™ng'];
                        let currentRouteClientSide = '';
                        let currentOpClientSide = '';

                        if (allPhotos.length > 0) {
                            const latestPhoto = allPhotos[0];
                            currentOpClientSide = latestPhoto.operator || '';
                            const r = (latestPhoto.route_no || '').trim();
                            if (r && !specialRoutes.includes(r)) {
                                currentRouteClientSide = r;
                            } else if (r === 'NgoÃ i giá» hoáº¡t Ä‘á»™ng') {
                                const validPhotos = allPhotos.filter(p => p.route_no && !specialRoutes.includes(p.route_no));
                                if (validPhotos.length > 0) {
                                    const latestValid = validPhotos[0];
                                    currentRouteClientSide = (latestValid.route_no || '').trim();
                                    currentOpClientSide = latestValid.operator || '';
                                }
                            } else if (r === 'Dá»«ng hoáº¡t Ä‘á»™ng' || r === 'ChÆ°a hoáº¡t Ä‘á»™ng') {
                                currentRouteClientSide = r;
                            }
                        }

                        const pageDesc = `Lá»‹ch sá»­ hoáº¡t Ä‘á»™ng vÃ  thÆ° viá»‡n áº£nh cá»§a xe ${vehicle.license_plate}${currentOpClientSide ? ' - ' + currentOpClientSide : ''}`;
                        app.utils.updateMetaTags(pageTitle, pageDesc, topPhoto ? app.utils.getProxiedUrl(topPhoto.url) : 'https://files.catbox.moe/ddvw49.png');


                        let rawHistory = historyRes.data || [];

                        let vehPrefix = '';
                        const vehProvName = app.utils.getProvinceFromPlate(vehicle.license_plate);
                        if (vehProvName && app.utils.provinceData && app.utils.provinceData.length) {
                            const pData = app.utils.provinceData.find(p => p.ten === vehProvName);
                            if (pData && pData.ky_hieu) {
                                vehPrefix = Array.isArray(pData.ky_hieu) ? String(pData.ky_hieu[0]).trim() : String(pData.ky_hieu).split(',')[0].trim();
                            }
                        }

                        let historyData = rawHistory.map(h => {
                            if (!h.effective_date && h.note) {
                                const dateMatch = h.note.match(/Tá»« ngÃ y:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i);
                                if (dateMatch) {
                                    const parts = dateMatch[1].split('/');
                                    h.effective_date = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                                    h.note = h.note.replace(dateMatch[0], '').trim();
                                }
                            }
                            return h;
                        }).sort((a, b) => new Date(a.effective_date || '1970-01-01') - new Date(b.effective_date || '1970-01-01'));

                        app.currentPlate = vehicle.license_plate;
                        app.vehicle.currentHistoryData = historyData;

                        let historyHTML = '<div class="p-3 text-xs text-gray-500">ChÆ°a cÃ³ lá»‹ch sá»­ hoáº¡t Ä‘á»™ng.</div>';
                        if (historyData.length > 0) {
                            historyHTML = `
                                <div class="history-table-wrapper">
                                    <table class="history-table" style="margin-bottom: 0 !important;">
                                        <thead><tr>
                                            <th class="border-r border-gray-200">ÄÆ¡n vá»‹</th>
                                            <th class="border-r border-gray-200">${isCoach ? 'Lá»™ trÃ¬nh' : 'MÃ£ sá»‘ tuyáº¿n'}</th>
                                            <th>Ghi chÃº</th>
                                        </tr></thead>
                                        <tbody>
                                            ${historyData.map(h => {
                                                let displayNote = h.note || '';
                                                const oldBksMatch = displayNote.match(/BKS cÅ©:\s*([A-Z0-9.-]+)/i);
                                                let bksHtml = '';
                                                if (oldBksMatch) {
                                                    bksHtml = `<br><span class="text-[10px] bg-gray-100 px-1 rounded border">BKS cÅ©: ${oldBksMatch[1]}</span>`;
                                                    displayNote = displayNote.replace(oldBksMatch[0], '').trim();
                                                }
                                                displayNote = displayNote.replace(/^[-,]\s*/, '').trim();

                                                return `
                                                <tr>
                                                    <td class="font-bold border-r border-gray-200">${h.operator}${bksHtml}</td>
                                                    <td class="font-bold border-r border-gray-200">${h.route || '-'}</td>
                                                    <td class="text-xs text-gray-500">${displayNote}</td>
                                                </tr>`;
                                            }).join('')}
                                        </tbody>
                                    </table>
                                </div>`;
                        }

                        const editHistoryUI = `
                            <div id="veh-history-edit-ui" class="hidden mt-3 bg-amber-50 p-3 border border-amber-200 rounded-lg">
                                <div class="flex justify-between items-center mb-3">
                                    <h4 class="font-bold text-sm text-amber-900">Sá»­a trá»±c tiáº¿p danh sÃ¡ch</h4>
                                    <span class="text-[10px] font-bold text-amber-700 bg-amber-200 px-2 py-1 rounded">Tá»± Ä‘á»™ng sáº¯p xáº¿p</span>
                                </div>
                                <div id="veh-sortable-history" class="space-y-2 mb-4"></div>

                                <h4 class="font-bold text-xs text-amber-900 mt-4 mb-2 border-t border-amber-200 pt-3">ThÃªm má»‘c lá»‹ch sá»­ má»›i</h4>
                                <div class="flex flex-wrap sm:flex-nowrap gap-2">
                                    <input type="date" id="veh-hist-new-date" class="border border-amber-200 p-2 sm:p-1.5 text-xs w-full sm:w-[18%] rounded bg-white text-gray-700 outline-none focus:ring-1 focus:ring-amber-500 transition" title="NgÃ y Ã¡p dá»¥ng">
                                    <input type="text" id="veh-hist-new-op" placeholder="ÄÆ¡n vá»‹ váº­n hÃ nh" class="border border-amber-200 p-2 sm:p-1.5 text-xs w-[48%] sm:w-[25%] rounded bg-white outline-none focus:ring-1 focus:ring-amber-500 transition" oninput="app.utils.formatNoPunctuation(this)">
                                    <input type="text" id="veh-hist-new-route" placeholder="MÃ£ sá»‘ tuyáº¿n" class="border border-amber-200 p-2 sm:p-1.5 text-xs w-[48%] sm:w-[15%] rounded bg-white outline-none focus:ring-1 focus:ring-amber-500 transition">
                                    <input type="text" id="veh-hist-new-note" placeholder="Ghi chÃº (BKS cÅ©...)" class="border border-amber-200 p-2 sm:p-1.5 text-xs w-full sm:flex-1 rounded bg-white outline-none focus:ring-1 focus:ring-amber-500 transition">
                                    <button onclick="app.vehicle.addHistoryItem('veh-')" class="bg-green-600 text-white p-2 text-xs rounded font-bold hover:bg-green-700 transition w-full sm:w-auto shadow-sm">ThÃªm Má»›i</button>
                                </div>
                                <div class="mt-3 pt-3 border-t border-amber-200 flex justify-end gap-3">
                                    <button onclick="app.vehicle.toggleEditHistory('veh-')" class="text-xs text-gray-500 hover:text-black font-medium">Há»§y bá»</button>
                                    <button onclick="app.vehicle.saveHistory()" class="bg-black text-white px-4 py-2 text-xs font-bold rounded-md hover:bg-gray-800 transition shadow-sm">LÆ°u dá»¯ liá»‡u / Gá»­i yÃªu cáº§u</button>
                                </div>
                            </div>
                        `;

                        let photosHTML = '<p class="text-xs text-gray-500">ChÆ°a cÃ³ áº£nh nÃ o cho xe nÃ y.</p>';
                        if (allPhotos.length > 0) {
                            photosHTML = `<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">${allPhotos.map(p => app.views.renderPhotoCard(p)).join('')}</div>`;
                        }

                        const html = `
                            <div class="flex flex-col lg:flex-row gap-6">
                                <div class="w-full lg:w-1/3 space-y-6">
                                    ${topPhoto ? `<div class="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden relative group cursor-pointer" onclick="app.views.loadDetail(${topPhoto.id})"><img src="${app.utils.getProxiedUrl(topPhoto.url, 'vehicle-top.jpg', 'thumb')}" onerror="app.utils.fallbackHeroImage(this, 'vehiclePhotosCache', 0)" class="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500 relative z-0"></div>` : '<div class="aspect-[4/3] bg-gray-100 flex items-center justify-center text-gray-400 rounded-xl border border-gray-200">ChÆ°a cÃ³ áº£nh</div>'}

                                     <div class="bg-white border border-gray-200 shadow-sm rounded-xl p-2.5 pt-3.5 pb-2.5 md:p-3 md:pt-4 md:pb-3 overflow-hidden">
                                        <h3 class="font-black text-lg sm:text-xl uppercase text-black tracking-widest mb-3 px-1">${app.utils.displayPlate(vehicle.license_plate)}</h3>
                                        
                                        <div class="border border-gray-200 rounded-lg overflow-hidden bg-white mb-3">
                                            <table class="info-table border-gray-200 w-full" style="margin-bottom: 0 !important;">
                                                <tr>
                                                    <td class="label bg-gray-50 border-r border-b border-gray-200" style="width: 40%">ÄÆ¡n vá»‹ váº­n hÃ nh</td>
                                                    <td class="value-cell border-b border-gray-200">
                                                        <input type="text" id="vehicle-edit-operator" value="${currentOpClientSide}" class="info-input text-gray-700 ${currentOpClientSide ? 'clickable-search' : 'cursor-not-allowed'}" readonly ${currentOpClientSide ? `onclick="if(this.readOnly && this.value && this.value!=='---') app.utils.navigate('/operator/' + encodeURIComponent(this.value))"` : ''}>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td class="label bg-gray-50 border-r border-b border-gray-200">${isCoach ? 'Lá»™ trÃ¬nh' : 'MÃ£ sá»‘ tuyáº¿n'} hiá»‡n táº¡i</td>
                                                    <td class="value-cell border-b border-gray-200">
                                                        <div class="relative w-full h-full">
                                                            <input type="text" id="vehicle-edit-route" value="${currentRouteClientSide}" autocomplete="off" class="info-input text-gray-700 w-full ${currentRouteClientSide ? 'clickable-search' : 'cursor-not-allowed'}" readonly ${currentRouteClientSide ? `onclick="if(this.readOnly && this.value && this.value!=='---') app.searchRedirect(this.value, 'absolute_route', '${vehPrefix}')"` : ''} onfocus="if(!this.readOnly) app.utils.triggerRouteSuggestion('vehicle-edit-route', 'veh-sug-route', '')" oninput="app.utils.triggerRouteSuggestion('vehicle-edit-route', 'veh-sug-route', this.value)">
                                                            <div id="veh-sug-route" class="suggestion-box"></div>
                                                        </div>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td class="label bg-gray-50 border-r border-b border-gray-200">DÃ²ng xe</td>
                                                    <td class="value-cell border-b border-gray-200">
                                                        <div class="relative w-full h-full">
                                                            <input type="text" id="vehicle-edit-model" value="${app.utils.escapeAttr(vehicle.model || '')}" autocomplete="off" class="info-input text-gray-700 w-full ${vehicle.model ? 'clickable-search' : 'cursor-not-allowed'}" readonly ${vehicle.model ? `onclick="if(this.readOnly && this.value && this.value!=='---') app.utils.navigate('/model/' + encodeURIComponent(this.value))"` : ''} oninput="app.utils.triggerSuggestion('vehicle-edit-model', 'veh-sug-model', this.value, 'model')">
                                                            <div id="veh-sug-model" class="suggestion-box"></div>
                                                        </div>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td class="label bg-gray-50 border-r border-b border-gray-200">ÄÄƒng kÃ½ táº¡i</td>
                                                    <td class="value-cell border-b border-gray-200">
                                                        <input type="text" value="${app.utils.getProvinceFromPlate(vehicle.license_plate)}" class="info-input text-gray-700 cursor-not-allowed" readonly>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td class="label bg-gray-50 border-r border-gray-200">Ghi chÃº chung xe</td>
                                                    <td class="value-cell">
                                                        <textarea id="vehicle-edit-note" rows="3" class="info-input text-gray-700 w-full resize-y min-h-[40px] block cursor-not-allowed" readonly>${app.utils.escapeAttr(vehicle.note || '')}</textarea>
                                                    </td>
                                                </tr>
                                            </table>
                                        </div>

                                        <div id="veh-edit-trigger-container" class="mt-3 pt-3 border-t border-gray-100">
                                            <button id="btn-vehicle-edit" onclick="app.vehicle.toggleVehiclePageEdit('${plate}')" class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 text-sm font-bold rounded-md hover:bg-gray-50 transition shadow-sm flex justify-center items-center gap-1.5">
                                                <i class="fa-solid fa-pen-to-square"></i> <span id="btn-veh-edit-label">Sá»­a thÃ´ng tin xe</span>
                                            </button>
                                        </div>

                                        <div id="vehicle-edit-actions" class="hidden mt-3 pt-3 border-t border-gray-100 justify-end gap-3">
                                            <button onclick="app.vehicle.toggleVehiclePageEdit('${plate}')" class="text-xs text-gray-500 hover:text-black font-medium">Há»§y bá»</button>
                                            <button id="btn-vehicle-save" onclick="app.vehicle.saveVehiclePageChanges('${plate}')" class="bg-black text-white text-xs font-bold px-4 py-2 rounded-md hover:bg-gray-800 transition shadow-sm">Gá»­i yÃªu cáº§u</button>
                                        </div>
                                    </div>
                                </div>

                                <div class="w-full lg:w-2/3 space-y-6">
                                    <div class="bg-white relative border border-gray-200 shadow-sm rounded-xl p-2.5 pt-3.5 pb-2.5 md:p-3 md:pt-4 md:pb-3 overflow-hidden">
                                        <h3 class="font-bold text-xs uppercase text-black tracking-wider mb-2.5 px-1">Lá»‹ch sá»­ hoáº¡t Ä‘á»™ng</h3>
                                        
                                        <div class="border border-gray-200 rounded-lg overflow-hidden bg-white">
                                            ${historyHTML}
                                        </div>

                                        <div class="mt-3 pt-3 border-t border-gray-100">
                                            <button onclick="app.vehicle.toggleEditHistory('veh-')"
                                                class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 text-sm font-bold rounded-md hover:bg-gray-50 transition shadow-sm flex justify-center items-center gap-1.5">
                                                <i class="fa-solid fa-clock-rotate-left"></i> Cáº­p nháº­t lá»‹ch sá»­
                                            </button>
                                        </div>
                                        ${editHistoryUI}
                                    </div>

                                    <div>
                                        <h3 class="font-bold text-lg mb-3 tracking-tight text-black uppercase">ThÆ° viá»‡n áº£nh (${allPhotos.length})</h3>
                                        ${photosHTML}
                                    </div>
                                </div>
                            </div>
                        `;
                        container.innerHTML = html;
                        app.vehicle._renderedPlate = plate; // ÄÃNH Dáº¤U XE NÃ€Y ÄÃƒ RENDER THÃ€NH CÃ”NG
                        app.loadingBar.finish();

                    } catch (err) {
                        console.error("Lá»—i khi táº£i trang xe:", err);
                        container.innerHTML = `<p class="text-center text-red-500 p-10">ÄÃ£ xáº£y ra lá»—i: ${err.message}</p>`;
                        app.loadingBar.finish();
                    }
                },

                // --- Báº®T Äáº¦U LOGIC PROFILE ÄÆ N Vá»Š Váº¬N HÃ€NH ---
                currentOperator: '',
                operatorLoadedCount: 0,
                operatorPhotos: [],

                loadOperatorPage: async (operatorName, forceRefresh = false) => {
                    const decodedPath = decodeURIComponent(window.location.pathname);
                    if (decodedPath !== `/operator/${operatorName}`) {
                        app.utils.navigate(`/operator/${encodeURIComponent(operatorName)}`);
                        return;
                    }

                    // --- KIá»‚M TRA Bá»˜ NHá»š Táº M ---
                    if (app.currentOperator === operatorName && app.operatorPhotos && app.operatorPhotos.length > 0 && !forceRefresh) {
                        app.views.switch('operator-view', false);
                        app.loadingBar.finish();
                        return;
                    }

                    app.views.switch('operator-view', false);
                    document.title = `${operatorName} | VNBUSARCHIVE`;
                    app.currentOperator = operatorName;
                    app.operatorLoadedCount = 0;

                    // --- RESET UI TRá»NG Äá»‚ CHá»NG NHÃY THÃ”NG TIN CÅ¨ ---
                    document.getElementById('crumb-operator').innerText = operatorName;
                    document.getElementById('operator-title').innerText = operatorName;
                    document.getElementById('operator-logo').classList.add('hidden');
                    document.getElementById('operator-logo-fallback').classList.remove('hidden');
                    document.getElementById('operator-desc').classList.add('hidden');
                    document.getElementById('op-stat-photos').innerText = '...';
                    document.getElementById('op-stat-vehicles').innerText = '...';
                    document.getElementById('op-stat-routes').innerText = '...';
                    document.getElementById('op-stat-views').innerText = '...';
                    document.getElementById('op-stats-tabs-wrapper').classList.add('hidden');
                    
                    const grid = document.getElementById('operator-photo-grid');
                    grid.innerHTML = '<div class="col-span-full text-center py-10 text-gray-500"><i class="fa-solid fa-circle-notch fa-spin"></i> Äang tá»•ng há»£p dá»¯ liá»‡u...</div>';
                    document.getElementById('operator-load-more-container').classList.add('hidden');
                    // --------------------------------------------------

                    try {
                        // Gá»i DB Láº¥y thÃ´ng tin Operator (Logo, MÃ´ táº£)
                        const { data: opInfo } = await window.apiFetch('get_operator_info', { operatorName });
                        
                        const logoEl = document.getElementById('operator-logo');
                        const fallbackEl = document.getElementById('operator-logo-fallback');
                        const descEl = document.getElementById('operator-desc');

                        if (opInfo && opInfo.logo_url) {
                            logoEl.src = opInfo.logo_url;
                            logoEl.classList.remove('hidden');
                            fallbackEl.classList.add('hidden');
                        } else {
                            logoEl.classList.add('hidden');
                            fallbackEl.classList.remove('hidden');
                        }

                        if (opInfo && opInfo.description) {
                            descEl.innerHTML = app.utils.cleanText(opInfo.description).replace(/\n/g, '<br>');
                            descEl.classList.remove('hidden');
                        } else {
                            descEl.classList.add('hidden');
                        }

                        // =========================================================
                        // LOGIC THÃ”NG MINH: VÃ’NG Láº¶P Láº¤Y THá»NG KÃŠ (VÆ¯á»¢T GIá»šI Háº N 1000 DÃ’NG)
                        // Chá»‰ táº£i text (BKS, Tuyáº¿n, DÃ²ng xe), tuyá»‡t Ä‘á»‘i khÃ´ng táº£i URL áº£nh Ä‘á»ƒ tiáº¿t kiá»‡m RAM
                        // =========================================================
                        let allStatsData = [];
                        let from = 0;
                        const step = 999;
                        let fetchMore = true;

                        while (fetchMore) {
                            const { data, error } = await window.apiFetch('get_photos_by_operator_chunk', { operatorName, offset: from, limit: step }).catch(e => ({ error: e, data: null }));

                            if (error || !data || data.length === 0) break;

                            allStatsData.push(...data);

                            if (data.length <= step) {
                                fetchMore = false;
                            } else {
                                from += step + 1;
                            }
                        }

                        if (allStatsData.length === 0) {
                            grid.innerHTML = '<div class="col-span-full text-center py-10 text-gray-500">ChÆ°a cÃ³ áº£nh nÃ o cá»§a Ä‘Æ¡n vá»‹ nÃ y Ä‘Æ°á»£c duyá»‡t trÃªn há»‡ thá»‘ng.</div>';
                            document.getElementById('op-stat-photos').innerText = '0';
                            document.getElementById('op-stat-vehicles').innerText = '0';
                            document.getElementById('op-stat-routes').innerText = '0';
                            document.getElementById('op-stat-views').innerText = '0';
                            document.getElementById('op-stats-tabs-wrapper').classList.add('hidden');
                            app.loadingBar.finish();
                            return;
                        }

                        // 1. TÃNH TOÃN 4 Ã” THá»NG KÃŠ TRÃŠN CÃ™NG
                        let totalViews = 0;
                        let uniquePlates = new Set();
                        let uniqueRoutes = new Set();

                        allStatsData.forEach(p => {
                            totalViews += (p.views || 0);
                            if (p.license_plate) uniquePlates.add(p.license_plate.toUpperCase());
                            if (p.route_no && p.route_no !== '---') uniqueRoutes.add(p.route_no.toLowerCase());
                        });

                        document.getElementById('op-stat-photos').innerText = app.utils.formatCompact(allStatsData.length);
                        document.getElementById('op-stat-vehicles').innerText = app.utils.formatCompact(uniquePlates.size);
                        document.getElementById('op-stat-routes').innerText = app.utils.formatCompact(uniqueRoutes.size);
                        document.getElementById('op-stat-views').innerText = app.utils.formatCompact(totalViews);

                        // 2. TÃNH TOÃN Báº¢NG CÆ  Cáº¤U DÃ’NG XE Tá»ª Lá»ŠCH Sá»¬ HOáº T Äá»˜NG (VEHICLE_HISTORY)
                        const absoluteLatestStatus = new Map();
                        const uniquePlatesArr = Array.from(uniquePlates);

                        for (let i = 0; i < uniquePlatesArr.length; i += 150) {
                            const chunk = uniquePlatesArr.slice(i, i + 150);
                            const { data } = await window.apiFetch('get_vehicle_history_by_plates', { chunk }).catch(e => ({ error: e, data: [] }));

                            if (data) {
                                data.forEach(h => {
                                    const pl = h.license_plate.toUpperCase();
                                    if (!absoluteLatestStatus.has(pl)) {
                                        absoluteLatestStatus.set(pl, h);
                                    }
                                });
                            }
                        }

                        const modelStats = {};
                        let totalActive = 0;
                        let totalInactive = 0;

                        absoluteLatestStatus.forEach((h) => {
                            const currentOp = h.operator || '';
                            const route = (h.route || '').trim();
                            const model = h.vehicles?.model || 'ChÆ°a cáº­p nháº­t';
                            let isInactive = false;

                            if (currentOp.toLowerCase() !== operatorName.toLowerCase()) isInactive = true;
                            else if (route === 'Dá»«ng hoáº¡t Ä‘á»™ng') isInactive = true;

                            if (!modelStats[model]) modelStats[model] = { active: 0, inactive: 0, total: 0 };
                            if (!isInactive) { modelStats[model].active++; totalActive++; } 
                            else { modelStats[model].inactive++; totalInactive++; }
                            modelStats[model].total++;
                        });

                        const sortedModels = Object.entries(modelStats)
                            .map(([name, stats]) => ({ name, ...stats }))
                            .sort((a, b) => b.total - a.total);

                        app.operator.modelStatsData = sortedModels;
                        app.operator.modelStatsTotals = { active: totalActive, inactive: totalInactive, all: totalActive + totalInactive };
                        app.operator.isModelTableExpanded = false;

                        // 3. TÃNH TOÃN CÆ  Cáº¤U TUYáº¾N CHUYáº¾N (THÃ”NG MINH Dá»°A TRÃŠN XE ACTIVE VÃ€ CLEAN ROUTE)
                        const specialRoutes = ['Dá»«ng hoáº¡t Ä‘á»™ng', 'NgoÃ i giá» hoáº¡t Ä‘á»™ng', 'ChÆ°a hoáº¡t Ä‘á»™ng', 'Há»£p Ä‘á»“ng', 'Xe há»£p Ä‘á»“ng / ÄÆ°a Ä‘Ã³n'];
                        
                        // TÃ¬m clean route_no gáº§n nháº¥t cho má»—i xe (dá»±a trÃªn áº£nh duyá»‡t)
                        const latestCleanRouteMap = new Map();
                        const sortedPhotos = [...allStatsData].sort((a,b) => new Date(b.taken_at || b.created_at || 0) - new Date(a.taken_at || a.created_at || 0));
                        sortedPhotos.forEach(p => {
                            if (p.license_plate && p.route_no && p.route_no !== '---') {
                                const pl = p.license_plate.toUpperCase();
                                if (!latestCleanRouteMap.has(pl)) {
                                    latestCleanRouteMap.set(pl, p.route_no.trim());
                                }
                            }
                        });

                        let activeRoutesMap = new Map();
                        const operatorProvinces = new Set();

                        absoluteLatestStatus.forEach((h) => {
                            const currentOp = h.operator || '';
                            const routeRaw = (h.route || '').trim();
                            const model = h.vehicles?.model || 'ChÆ°a xÃ¡c Ä‘á»‹nh';
                            const pl = h.license_plate.toUpperCase();

                            let isInactive = false;
                            if (currentOp.toLowerCase() !== operatorName.toLowerCase()) isInactive = true;
                            else if (routeRaw === 'Dá»«ng hoáº¡t Ä‘á»™ng') isInactive = true;

                            if (!isInactive) {
                                const cleanRoute = latestCleanRouteMap.get(pl);
                                if (cleanRoute && cleanRoute !== '---' && !specialRoutes.includes(cleanRoute)) {
                                    
                                    const extractedProv = app.utils.getProvinceFromPlate(pl);
                                    let prov = '';
                                    if (extractedProv && extractedProv !== 'KhÃ´ng xÃ¡c Ä‘á»‹nh' && extractedProv !== 'Biá»ƒn táº¡m') {
                                        prov = extractedProv;
                                    }

                                    const routeKey = cleanRoute.toLowerCase() + '|' + prov;
                                    if (!activeRoutesMap.has(routeKey)) {
                                        activeRoutesMap.set(routeKey, { route: cleanRoute, prov: prov, count: 0, models: {} });
                                    }
                                    const rData = activeRoutesMap.get(routeKey);
                                    rData.count++;
                                    rData.models[model] = (rData.models[model] || 0) + 1;

                                    if (prov) operatorProvinces.add(prov);
                                }
                            }
                        });

                        const operatesInMultipleProvinces = operatorProvinces.size > 1;

                        let activeRoutes = [];
                        activeRoutesMap.forEach(rData => {
                            let maxModel = 'ChÆ°a xÃ¡c Ä‘á»‹nh';
                            let maxCount = 0;
                            for (let m in rData.models) {
                                if (rData.models[m] > maxCount) {
                                    maxCount = rData.models[m];
                                    maxModel = m;
                                }
                            }
                            
                            let displayName = rData.route;
                            let prefix = '';
                            if (operatesInMultipleProvinces && rData.prov) {
                                displayName = `${rData.route} (${rData.prov})`;
                            }
                            
                            try {
                                if (rData.prov && app.utils.provinceData && app.utils.provinceData.length) {
                                    const provData = app.utils.provinceData.find(p => p.ten === rData.prov);
                                    if (provData && provData.ky_hieu) {
                                        prefix = Array.isArray(provData.ky_hieu) ? String(provData.ky_hieu[0]).trim() : String(provData.ky_hieu).split(',')[0].trim();
                                    }
                                }
                            } catch (e) { }

                            activeRoutes.push({ route: rData.route, displayName: displayName, prefix: prefix, vehicleCount: rData.count, mainModel: maxModel });
                        });
                        
                        // Sáº¯p xáº¿p Tuyáº¿n theo sá»‘ lÆ°á»£ng xe giáº£m dáº§n, náº¿u báº±ng thÃ¬ theo mÃ£ sá»‘ tuyáº¿n
                        activeRoutes.sort((a, b) => {
                            if (b.vehicleCount !== a.vehicleCount) {
                                return b.vehicleCount - a.vehicleCount;
                            }
                            return a.route.localeCompare(b.route, undefined, {numeric: true});
                        });
                        
                        app.operator.routeStatsData = activeRoutes;
                        app.operator.isRouteTableExpanded = false;

                        // Tá»”NG Há»¢P VÃ€ Má»ž TABS
                        if (sortedModels.length > 0 || activeRoutes.length > 0) {
                            document.getElementById('op-stats-tabs-wrapper').classList.remove('hidden');
                            app.operator.renderModelTable();
                            app.operator.renderRouteTable();
                        } else {
                            document.getElementById('op-stats-tabs-wrapper').classList.add('hidden');
                        }

                        // LOAD áº¢NH...
                        const { data: pData } = await window.apiFetch('get_operator_photos_filtered', { operatorName, filterType: app.preference.current }).catch(e => ({ error: e, data: [] }));
                        const { data: photos, error } = await pQuery;
                        if (error) throw error;

                        app.operatorPhotos = photos || [];
                        grid.innerHTML = '';
                        app.views.loadMoreOperatorPhotos();

                    } catch (err) {
                        grid.innerHTML = `<div class="col-span-full text-center py-10 text-red-500">Lá»—i láº¥y dá»¯ liá»‡u: ${err.message}</div>`;
                    }
                    app.loadingBar.finish();
                },

                loadMoreOperatorPhotos: () => {
                    const start = app.operatorLoadedCount;
                    const limit = 12; // Load má»—i láº§n 12 áº£nh
                    const end = start + limit;
                    const grid = document.getElementById('operator-photo-grid');
                    
                    const photosToRender = app.operatorPhotos.slice(start, end);
                    if (photosToRender.length > 0) {
                        grid.innerHTML += photosToRender.map(p => app.views.renderPhotoCard(p)).join('');
                        app.operatorLoadedCount += photosToRender.length;
                    }

                    if (app.operatorLoadedCount >= app.operatorPhotos.length) {
                        document.getElementById('operator-load-more-container').classList.add('hidden');
                    } else {
                        document.getElementById('operator-load-more-container').classList.remove('hidden');
                    }
                },

                loadMoreModelPhotos: () => {
                    const start = app.model.modelLoadedCount;
                    const limit = 12;
                    const end = start + limit;
                    const grid = document.getElementById('model-photo-grid');
                    
                    const photosToRender = app.model.modelPhotos.slice(start, end);
                    if (photosToRender.length > 0) {
                        grid.innerHTML += photosToRender.map(p => app.views.renderPhotoCard(p)).join('');
                        app.model.modelLoadedCount += photosToRender.length;
                    }

                    if (app.model.modelLoadedCount >= app.model.modelPhotos.length) {
                        document.getElementById('model-load-more-container').classList.add('hidden');
                    } else {
                        document.getElementById('model-load-more-container').classList.remove('hidden');
                    }
                }
                // --- Káº¾T THÃšC LOGIC PROFILE ÄÆ N Vá»Š ---

            },


window.app.user = null

window.app.username = 'Guest'

window.app.previousPath = '/'

window.app.role = 'user'

window.app.rawFile = null

window.app.vehicleLocked = false

window.app.currentPlate = null

window.app.currentPhoto = null

window.app.currentVehicle = null

window.app.adminTab = 'photos'

window.app.loadedCount = 0

window.app.uploadMap = null

window.app.uploadMarker = null

window.app.detailMap = null

window.app.detailMarker = null

window.app.searchTimeout = null

window.app.currentFilter = 'all'

window.app.alertCallback = null

window.app.alertCancelCallback = null

window.app.isReinitializing = false

window.app.draggableInitialized = false

window.app.loadedSearchCardsCount = 0

window.app.PROFILE_PAGE_SIZE = 12

window.app.profilePage = 1

window.app.likedPage = 1

window.app.currentProfileId = null

window.app._isOwnProfile = false


