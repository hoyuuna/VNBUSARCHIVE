window.app = window.app || {};

window.addEventListener('unhandledrejection', function(event) {
    if (event.reason && event.reason.message && event.reason.message.includes("Unexpected token '<'")) {
        if (window.app && window.app.toast) {
            window.app.toast.show('error', 'Lá»—i káº¿t ná»‘i', 'Cloudflare háº¿t háº¡n, vui lÃ²ng báº¥m vÃ o Ä‘Ã¢y Ä‘á»ƒ táº£i láº¡i trang', 10000, () => {
                window.location.reload(true);
            });
        }
    }
});

window.addEventListener('error', function(event) {
    if (event.message && event.message.includes("Unexpected token '<'")) {
        if (window.app && window.app.toast) {
            window.app.toast.show('error', 'Lá»—i káº¿t ná»‘i', 'Cloudflare háº¿t háº¡n, vui lÃ²ng báº¥m vÃ o Ä‘Ã¢y Ä‘á»ƒ táº£i láº¡i trang', 10000, () => {
                window.location.reload(true);
            });
        }
    }
});

Object.assign(window.app, {
  toast: {
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
            }
});

Object.assign(window.app, {
  loadingBar: {
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
            }
});

Object.assign(window.app, {
  ui: {
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
                        okBtn.style.display = options.hideButtons ? 'none' : 'inline-flex';

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
                        cancelBtn.style.display = options.hideButtons ? 'none' : 'inline-flex';
                        app.alertCancelCallback = cancelCallback || (() => { });
                    } else {
                        cancelBtn.classList.add('hidden');
                        cancelBtn.style.display = 'none';
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
                        const cancelBtn = document.getElementById('custom-alert-cancel-btn');
                        if (cancelBtn) {
                            cancelBtn.classList.add('hidden');
                            cancelBtn.style.display = 'none';
                        }
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

                 filterDenyQuick: (query) => {
                    const q = (query || '').trim().toLowerCase();
                    const section = document.getElementById('deny-section-quick');
                    if (!section) return;
                    const labels = section.querySelectorAll('label');
                    labels.forEach(lbl => {
                        const text = (lbl.textContent || '').toLowerCase();
                        lbl.style.display = (!q || text.includes(q)) ? '' : 'none';
                    });
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

                        const searchEl = document.getElementById('deny-quick-search');
                        if (searchEl) {
                            searchEl.value = '';
                            app.ui.filterDenyQuick('');
                        }


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
                        window.sb.from('photos').select('id, created_at, uploader_id, profiles(role)').eq('status', 'pending')
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
                },
                closeUserDropdown: () => app.ui.toggleUserMenu(false)
            }
});

Object.assign(window.app, {
  maintenance: {
                settings: {},
                timer: null,
                isBypassed: false,

                fetch: async () => {
                    try {
                        const { data, error } = await window.sb.from('system_settings').select('id, is_active, auto_reactivate_at, reason');
                        if (data) {
                            data.forEach(item => { app.maintenance.settings[item.id] = item; });
                        }
                    } catch (e) { console.error("Lá»—i láº¥y thÃ´ng tin báº£o trÃ¬", e); }
                },

                check: (sysId) => {
                    if (app.maintenance.isBypassed) return false; // Manager bypass

                    // Kiá»ƒm tra cáº§u chÃ¬ tá»•ng trÆ°á»›c, sau Ä‘Ã³ má»›i Ä‘áº¿n module cá»¥ thá»ƒ
                    const target = app.maintenance.settings['global']?.is_active === false
                                 ? app.maintenance.settings['global']
                                 : app.maintenance.settings[sysId];

                    if (!target) return false;

                    // Náº¿u is_active = false, luÃ´n hiá»ƒn thá»‹ mÃ n hÃ¬nh báº£o trÃ¬ (khÃ´ng tá»± má»Ÿ láº¡i khi háº¿t giá»).
                    // auto_reactivate_at giá» chá»‰ dÃ¹ng lÃ m thá»i gian dá»± kiáº¿n Ä‘á»ƒ Ä‘áº¿m ngÆ°á»£c.
                    if (target.is_active === false) {
                        return target;
                    }
                    return false;
                },

                showScreen: (targetData) => {
                    const screen = document.getElementById('maintenance-screen');

                    // áº¨n triá»‡t Ä‘á»ƒ giao diá»‡n ná»n phÃ­a sau Ä‘á»ƒ khÃ´ng bá»‹ há»Ÿ khi cuá»™n trÃªn Mobile
                    document.querySelectorAll('header, main, footer, #header-spacer').forEach(el => el.style.display = 'none');
                    document.body.style.backgroundColor = '#ffffff';

                    // Cáº­p nháº­t text lÃ½ do
                    document.getElementById('mt-reason').innerText = targetData.reason || "Há»‡ thá»‘ng Ä‘ang Ä‘Æ°á»£c báº£o trÃ¬, vui lÃ²ng quay láº¡i sau.";

                    // Hiá»‡n nÃºt cho Manager
                    if (app.role === 'manager') {
                        document.getElementById('mt-manager-bypass').classList.remove('hidden');
                    }

                    if (app.maintenance.timer) clearInterval(app.maintenance.timer);

                    const countdownEl = document.getElementById('mt-countdown');

                    if (targetData.auto_reactivate_at) {
                        const autoTime = new Date(targetData.auto_reactivate_at).getTime();

                        app.maintenance.timer = setInterval(() => {
                            const now = Date.now();
                            const distance = autoTime - now;

                            if (distance < 0) {
                                clearInterval(app.maintenance.timer);
                                countdownEl.innerText = "Cáº­p nháº­t sau";
                                countdownEl.className = "text-xl font-bold tracking-normal text-gray-400";
                                return;
                            }

                            const d = Math.floor(distance / (1000 * 60 * 60 * 24));
                            const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                            const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                            const s = Math.floor((distance % (1000 * 60)) / 1000);

                            let timeStr = "";
                            if(d > 0) timeStr += `${d}d `;
                            timeStr += `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

                            countdownEl.innerText = timeStr;
                        }, 1000);
                    } else {
                        countdownEl.innerText = "Cáº­p nháº­t sau";
                        countdownEl.className = "text-xl font-bold tracking-normal text-gray-400"; // Äá»•i style náº¿u khÃ´ng cÃ³ giá»
                    }

                    screen.classList.remove('hidden');
                    app.ui.lockScroll(); // KhÃ³a cuá»™n trang
                },

                hideScreen: () => {
                    document.getElementById('maintenance-screen').classList.add('hidden');

                    // Tráº£ láº¡i giao diá»‡n ná»n khi táº¯t báº£o trÃ¬
                    document.querySelectorAll('header, main, footer, #header-spacer').forEach(el => el.style.display = '');
                    document.body.style.backgroundColor = '';

                    if (app.maintenance.timer) clearInterval(app.maintenance.timer);
                },

                bypass: () => {
                    app.maintenance.isBypassed = true;
                    app.maintenance.hideScreen();
                    app.handleRoute(); // Khá»Ÿi Ä‘á»™ng láº¡i route
                }
            }
});

Object.assign(window.app, {
  utils: {
                updateCanonical: (customPath = null) => {
                    let link = document.querySelector('link[rel="canonical"]');
                    if (!link) {
                        link = document.createElement('link');
                        link.setAttribute('rel', 'canonical');
                        document.head.appendChild(link);
                    }
                    let path = customPath || window.location.pathname;
                    if (path !== '/' && path.endsWith('/')) {
                        path = path.slice(0, -1);
                    }
                    link.setAttribute('href', `https://www.vnbusarchive.io.vn${path}`);
                },
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
                    return 'image/webp';
                },
                getTargetExtension: () => {
                    return 'webp';
                },
                decodeHeic: async (file) => {
                    if (!file) return null;
                    const isHeic = /\.(heic|heif)$/i.test(file.name) || file.type === 'image/heic' || file.type === 'image/heif';
                    if (!isHeic) return file;

                    let heicBlob = null;
                    if (window.heic2any) {
                        const result = await window.heic2any({ blob: file, toType: 'image/jpeg', quality: 0.95 });
                        heicBlob = Array.isArray(result) ? result[0] : result;
                    } else {
                        const { default: heic2any } = await import("https://esm.sh/heic2any@0.0.4");
                        const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.95 });
                        heicBlob = Array.isArray(result) ? result[0] : result;
                    }
                    if (!heicBlob) throw new Error("KhÃ´ng thá»ƒ chuyá»ƒn Ä‘á»•i áº£nh HEIC/HEIF sang JPEG.");
                    return new File([heicBlob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", { type: "image/jpeg" });
                },
                convertToWebpCpu: async (imageSource, initialQuality = 0.8) => {
                    try {
                        const { encode } = await import("https://esm.sh/@jsquash/webp@1.2.0");
                        let img;
                        if (imageSource instanceof HTMLCanvasElement) {
                            const ctx = imageSource.getContext('2d');
                            const imageData = ctx.getImageData(0, 0, imageSource.width, imageSource.height);
                            let q = Math.round(initialQuality * 100);
                            let webpBuffer = await encode(imageData, { quality: q });
                            return new Blob([webpBuffer], { type: 'image/webp' });
                        } else {
                            img = new Image();
                            const url = imageSource instanceof Blob || imageSource instanceof File ? URL.createObjectURL(imageSource) : imageSource;
                            img.src = url;
                            await new Promise((resolve, reject) => {
                                img.onload = resolve;
                                img.onerror = () => reject(new Error("Lá»—i táº£i áº£nh Ä‘á»ƒ encode WebP CPU"));
                            });
                            if (imageSource instanceof Blob || imageSource instanceof File) URL.revokeObjectURL(url);

                            let w = img.naturalWidth || img.width;
                            let h = img.naturalHeight || img.height;
                            if (w > 1920 || h > 1920) {
                                const ratio = Math.min(1920 / w, 1920 / h);
                                w = Math.round(w * ratio);
                                h = Math.round(h * ratio);
                            }

                            const canvas = document.createElement('canvas');
                            canvas.width = w;
                            canvas.height = h;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0, w, h);
                            const imageData = ctx.getImageData(0, 0, w, h);

                            let q = Math.round(initialQuality * 100);
                            let webpBuffer = await encode(imageData, { quality: q });
                            return new Blob([webpBuffer], { type: 'image/webp' });
                        }
                    } catch (err) {
                        console.warn("WASM WebP encode báº±ng CPU lá»—i, fallback:", err);
                        return null;
                    }
                },
                canvasToBlobUniversal: async (canvas, targetMime = 'image/webp', quality = 0.82) => {
                    const nativeBlob = await new Promise((resolve) => {
                        canvas.toBlob((blob) => resolve(blob), targetMime, quality);
                    });
                    if (nativeBlob && (nativeBlob.type === targetMime || targetMime !== 'image/webp')) {
                        return nativeBlob;
                    }
                    if (nativeBlob) return nativeBlob;
                    return new Promise((resolve) => {
                        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality);
                    });
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
                    const rootPages = ['/', '/profile', '/profile/comments', '/search', '/upload', '/admin', '/contact', '/user/', '/help', '/leaderboard'];
                    // --- ÄÃƒ Sá»¬A: KHAI BÃO THÃŠM TRANG ÄÆ N Vá»Š, DÃ’NG XE, NGÆ¯á»œI DÃ™NG LÃ€ TRANG CON ---
                    const isDestLeaf = url.startsWith('/vehicle/') || url.startsWith('/photo/') || url.startsWith('/operator/') || url.startsWith('/model/') || url.startsWith('/user/');
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
                        else if (prevPath === '/leaderboard') bName = "Báº£ng xáº¿p háº¡ng Ä‘Ã³ng gÃ³p";
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
                        if (app.upload && app.upload.selectProvince) app.upload.selectProvince('');
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
                    if(app.crop && app.crop.close) app.crop.close();
                    if(app.docs && app.docs.close) app.docs.close();
                    if(app.settings && app.settings.close) app.settings.close();

                    // ÄÃ³ng Zoom Modal náº¿u Ä‘ang má»Ÿ (Xá»­ lÃ½ lá»—i báº¥m Back khi Ä‘ang soi áº£nh)
                    const zoomModal = document.getElementById('image-zoom-modal');
                    if (zoomModal && !zoomModal.classList.contains('hidden')) {
                        zoomModal.classList.add('hidden');
                        document.body.style.overflow = '';
                    }

                    // Reset menu tÃ i khoáº£n
                    app.ui.closeUserDropdown();

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
                            const rawData = await res.json();
                            app.utils.provinceData = rawData.sort((a, b) => (a.ten || '').localeCompare(b.ten || '', 'vi'));
                            if (app.upload && app.upload.initProvinceMenu) app.upload.initProvinceMenu();
                            if (app.views && app.views.initInfoProvinceSelect) app.views.initInfoProvinceSelect();
                            if (app.search && app.search.initExactRouteMenu) app.search.initExactRouteMenu();
                            if (app.search && app.search.syncExactUI) app.search.syncExactUI(app.search.currentExactPrefix, app.search.currentExactProvName);
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
                matchProvinceName: (rawText) => {
                    if (!rawText || !app.utils.provinceData || !app.utils.provinceData.length) return null;
                    const clean = rawText
                        .replace(/^(Tá»‰nh|ThÃ nh phá»‘|TP\.?)\s+/i, '')
                        .replace(/\s+(Province|City)$/i, '')
                        .trim().toLowerCase();
                    const found = app.utils.provinceData.find(p => {
                        const pName = p.ten.toLowerCase()
                            .replace(/^(tp\.?\s*)/i, '')
                            .replace(/^(tá»‰nh\s*)/i, '').trim();
                        return clean.includes(pName) || pName.includes(clean);
                    });
                    return found ? found.ten : null;
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
                             const textPlate = wrapper.querySelector('.hero-main-text') || wrapper.querySelector('.hero-sub-text');
                             const textViews = wrapper.querySelector('.hero-main-views') || wrapper.querySelector('.hero-sub-operator');
                             if (textPlate) {
                                 const safePlate = app.utils.displayPlate(app.utils.cleanText(nextPhoto.license_plate));
                                 textPlate.innerHTML = safePlate;
                             }
                             if (textViews) {
                                 const safeOperator = app.utils.cleanText(nextPhoto.operator || 'Äang cáº­p nháº­t');
                                 textViews.innerHTML = safeOperator;
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
                escapeHtml: (str) => {
                    if (!str) return '';
                    return DOMPurify.sanitize(str, { ALLOWED_TAGS: [] });
                },
                checkModelDuplicatePolicy: async (plate, model) => {
                    if (!plate || !model || !String(plate).includes('-')) return false;
                    const parts = String(plate).split('-');
                    if (parts.length < 2 || isNaN(parts[1])) return false;
                    const basePlate = parts[0];
                    try {
                        const { data: relatedVehicles } = await window.sb.from('vehicles').select('license_plate, model').ilike('license_plate', `${basePlate}%`);
                        if (relatedVehicles && relatedVehicles.length > 0) {
                            const currentModelLower = String(model).trim().toLowerCase();
                            const duplicateVehicle = relatedVehicles.find(v => {
                                if (!v.model || v.license_plate === plate) return false;
                                if (v.license_plate !== basePlate) {
                                    const pts = v.license_plate.split('-');
                                    if (pts.length !== 2 || pts[0] !== basePlate || isNaN(pts[1])) return false;
                                }
                                const mLower = v.model.trim().toLowerCase();
                                return mLower === currentModelLower || mLower.includes(currentModelLower) || currentModelLower.includes(mLower);
                            });
                            if (duplicateVehicle) {
                                app.ui.showAlert("Xe Ä‘á»‹nh danh phá»¥ khÃ´ng Ä‘Æ°á»£c trÃ¹ng dÃ²ng xe vá»›i xe khÃ¡c cÃ¹ng biá»ƒn kiá»ƒm soÃ¡t.", null, null, { title: "Vi pháº¡m chÃ­nh sÃ¡ch" });
                                return true;
                            }
                        }
                    } catch(e) { console.warn("Lá»—i kiá»ƒm tra dÃ²ng xe gá»‘c:", e); }
                    return false;
                },
                fixUnicode: (str) => {
                    if (!str) return '';
                    return str.normalize('NFC').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "");
                },
                normOperator: (str) => {
                    if (!str) return '';
                    return String(str)
                        .normalize('NFKC')
                        .replace(/[ï¼ˆï¼‰]/g, m => m === 'ï¼ˆ' ? '(' : ')')
                        .replace(/[Â Â­á…Ÿá… ï»¿]/g, ' ')
                        .replace(/[â€¯]/g, ' ')
                        .replace(/\s+/g, ' ')
                        .trim();
                },
                displayPlate: (plate) => {
                    if (!plate) return '';
                    return plate.replace(/-\d+$/, '');
                },
                formatPlateVariations: (plate) => {
                    if (!plate) return '';
                    const p = String(plate).trim().replace(/-\d+$/, '');
                    if (!p) return '';
                    const clean = p.replace(/[\s.,_-]/g, '').toUpperCase();
                    const match = clean.match(/^([A-Z0-9]*[A-Z])(\d{4,5})$/);
                    if (!match) return p;
                    const prefix = match[1];
                    const num = match[2];
                    if (num.length === 5) {
                        return [...new Set([
                            `${prefix}${num}`,
                            `${prefix}-${num.slice(0, 3)}.${num.slice(3)}`,
                            `${prefix}-${num}`
                        ])].join(' / ');
                    } else if (num.length === 4) {
                        return [...new Set([
                            `${prefix}${num}`,
                            `${prefix}-${num}`
                        ])].join(' / ');
                    }
                    return p;
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



                resolveSandboxUrls: async (items) => {
                    // Há»‡ thá»‘ng Sandbox Ä‘Ã£ bá»‹ khai tá»­: áº£nh pending/denied Ä‘Ã£ náº±m trÃªn CDN tháº­t (url https).
                    // HÃ m nÃ y giá» chá»‰ Ä‘Ã¡nh dáº¥u _isSandboxMissing cho cÃ¡c url cÅ© dáº¡ng sandbox: (khÃ´ng cÃ²n base64).
                    if (!items) return;
                    const list = Array.isArray(items) ? items : [items];
                    list.forEach(item => {
                        if (item && typeof item === 'object' && item.url && typeof item.url === 'string') {
                            if (item.url.startsWith('sandbox:') || item.url.startsWith('data:')) {
                                item._isSandboxMissing = true;
                            }
                        }
                    });
                },

                getProxiedUrl: (url, filename = 'image.jpg', type = 'full') => {
                    if (!url) return '';
                    // Dá»¯ liá»‡u cÅ© dáº¡ng sandbox:/data: khÃ´ng cÃ²n há»£p lá»‡ -> tráº£ vá» rá»—ng Ä‘á»ƒ UI hiá»‡n placeholder
                    if (typeof url === 'string' && (url.startsWith('data:') || url.startsWith('sandbox:'))) return '';

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

                // =========================================================
                // HELPER: TÃNH THá»NG KÃŠ SERVER-SIDE (RPC) + CACHE
                // Thay tháº¿ cÃ¡c vÃ²ng láº·p kÃ©o 999 dÃ²ng vá» client Ä‘á»ƒ tÃ­nh Ä‘áº¿m.
                // TrÃ¡nh bÃ³n rÃºt Egress: chá»‰ tráº£ vá» 1 row tá»•ng há»£p tá»« DB.
                // =========================================================
                _statsCache: {},
                _statsCacheExpire: {},
                getCachedStats: async (cacheKey, ttlMs, fetchFn) => {
                    const now = Date.now();
                    if (app.utils._statsCache[cacheKey] && app.utils._statsCacheExpire[cacheKey] > now) {
                        return app.utils._statsCache[cacheKey];
                    }
                    const data = await fetchFn();
                    app.utils._statsCache[cacheKey] = data;
                    app.utils._statsCacheExpire[cacheKey] = now + ttlMs;
                    return data;
                },

                // Thá»‘ng kÃª tá»•ng quÃ¡t trang chá»§ (sá»‘ áº£nh, sá»‘ xe, sá»‘ tuyáº¿n)
                getHomeStats: async (prefFilter) => {
                    try {
                        const { data, error } = await window.sb.rpc('get_home_stats', { pref_filter: prefFilter || 'both' });
                        if (error) throw error;
                        if (data && data.length > 0) return data[0];
                    } catch (e) {
                        console.warn('RPC get_home_stats lá»—i, fallback vá» cÃ¡ch cÅ©:', e);
                    }
                    return null;
                },

                // Thá»‘ng kÃª theo ÄÆ¡n vá»‹ váº­n hÃ nh (tá»•ng áº£nh, views, sá»‘ xe, sá»‘ tuyáº¿n)
                getOperatorStats: async (operatorName) => {
                    try {
                        const { data, error } = await window.sb.rpc('get_operator_stats', { op_name: operatorName });
                        if (error) throw error;
                        if (data && data.length > 0) return data[0];
                    } catch (e) {
                        console.warn('RPC get_operator_stats lá»—i, fallback vá» cÃ¡ch cÅ©:', e);
                    }
                    return null;
                },

                // Thá»‘ng kÃª theo DÃ²ng xe (tá»•ng áº£nh, views, sá»‘ xe, sá»‘ Ä‘Æ¡n vá»‹)
                getModelStats: async (modelName) => {
                    try {
                        const { data, error } = await window.sb.rpc('get_model_stats', { mdl_name: modelName });
                        if (error) throw error;
                        if (data && data.length > 0) return data[0];
                    } catch (e) {
                        console.warn('RPC get_model_stats lá»—i, fallback vá» cÃ¡ch cÅ©:', e);
                    }
                    return null;
                },

                // Debounce helper (dÃ¹ng cho search thá»±c thi)
                debounce: (fn, delay = 500) => {
                    let timer = null;
                    return function (...args) {
                        const ctx = this;
                        if (timer) clearTimeout(timer);
                        timer = setTimeout(() => { timer = null; fn.apply(ctx, args); }, delay);
                    };
                },


                updateMetaTags: (title, description, imageUrl) => {
                    document.title = title;
                    const setContent = (selector, content) => {
                        const el = document.querySelector(selector);
                        if (el) el.setAttribute("content", content);
                    };
                    setContent('meta[name="description"]', description);
                    setContent('meta[property="og:title"]', title);
                    setContent('meta[property="og:description"]', description);
                    if (imageUrl) setContent('meta[property="og:image"]', imageUrl);
                    setContent('meta[property="twitter:title"]', title);
                    setContent('meta[name="twitter:title"]', title);
                    setContent('meta[property="twitter:description"]', description);
                    setContent('meta[name="twitter:description"]', description);
                    if (imageUrl) {
                        setContent('meta[property="twitter:image"]', imageUrl);
                        setContent('meta[name="twitter:image"]', imageUrl);
                    }
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

                watermark: (file, username, pos = { x: 0.5, y: 0.5, color: 'white' }, filters = 'none', options = { embedBlind: false }) => {
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
                                const scale = pos.scale || 1.0;
                                const wmFontSize = fontSize * 3 * scale;
                                const fontFace = '"Montserrat", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

                                try {
                                    if (document.fonts && document.fonts.load) {
                                        await Promise.all([
                                            document.fonts.load(`italic 900 ${fontSize}px "Montserrat"`),
                                            document.fonts.load(`italic 700 ${fontSize * 0.8}px "Montserrat"`),
                                            document.fonts.load(`700 ${fontSize}px "Montserrat"`),
                                            document.fonts.load(`700 ${wmFontSize}px "Montserrat"`)
                                        ]);
                                    }
                                } catch (e) {
                                    console.warn("Font preloading error:", e);
                                }
                                await document.fonts.ready;

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
                                ctx.textBaseline = 'alphabetic';
                                ctx.textAlign = 'left';
                                const textY = height - barHeight / 2 + (fontSize * 0.35);

                                ctx.font = `italic 900 ${fontSize}px ${fontFace}`;
                                ctx.fillText("VNBUSARCHIVE", barHeight / 2, textY);
                                
                                const vnbusWidth = ctx.measureText("VNBUSARCHIVE").width;
                                ctx.font = `italic 700 ${fontSize * 0.8}px ${fontFace}`;
                                ctx.fillText(".io.vn", (barHeight / 2) + vnbusWidth, textY);

                                ctx.textBaseline = 'middle'; // Reset textBaseline for the right text
                                ctx.font = `700 ${fontSize}px ${fontFace}`;
                                const rightText = `Báº£n quyá»n bá»Ÿi ${username}`;
                                const rightWidth = ctx.measureText(rightText).width;
                                ctx.fillText(rightText, width - rightWidth - (barHeight / 2), height - barHeight / 2);

                                const currentMode = pos.mode || (app.wmState && app.wmState.mode) || (typeof localStorage !== 'undefined' && localStorage.getItem('vnbus_wm_mode')) || 'basic';
                                if (currentMode !== 'standard') {
                                    ctx.save();
                                    ctx.globalAlpha = 0.5;
                                    ctx.fillStyle = pos.color === 'black' ? "black" : "white";
                                    ctx.font = `700 ${wmFontSize}px ${fontFace}`;
                                    ctx.textAlign = 'center';
                                    ctx.textBaseline = 'middle';

                                    ctx.translate(width * pos.x, height * pos.y);
                                    ctx.fillText(`Â© ${username}`, 0, 0);
                                    ctx.restore();
                                }

                                 const isBlind = options.embedBlind && ((currentMode === 'advanced') || (app.upload && app.upload.isBlindWatermarkEnabled));
                                 if (isBlind) {
                                     try {
                                         const hiddenText = `VNBUSARCHIVE/${username}/`;
                                         await app.utils.embedBlindWatermarkOpenCV(canvas, hiddenText);
                                     } catch (bwErr) {
                                         reject(bwErr);
                                         return;
                                     }
                                 }

                                 try {
                                     const blob = await app.utils.canvasToBlobUniversal(canvas, app.utils.getTargetMimeType(), 0.80);
                                     if (blob) resolve(blob);
                                     else reject(new Error("Canvas failed to blob"));
                                 } catch (errBlob) {
                                     reject(errBlob);
                                 }
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

                 embedBlindWatermarkOpenCV: async (canvas, hiddenText) => {
                     const width = canvas.width;
                     const height = canvas.height;
                     if (!width || !height || width < 64 || height < 64) {
                         throw new Error("BLIND_WM_ERROR:KÃ­ch thÆ°á»›c áº£nh quÃ¡ nhá» Ä‘á»ƒ gáº¯n Blind Watermark.");
                     }
                     const ctx = canvas.getContext('2d');
                     const imgData = ctx.getImageData(0, 0, width, height);
                     const data = imgData.data;

                     // 1. Táº¡o ma tráº­n DCT 8x8 vÃ  ma tráº­n chuyá»ƒn vá»‹ T, T^t
                     const T = new Float32Array(64);
                     const Tt = new Float32Array(64);
                     const alpha0 = 1.0 / Math.sqrt(2.0);
                     for (let u = 0; u < 8; u++) {
                         const alpha = (u === 0) ? alpha0 : 1.0;
                         for (let x = 0; x < 8; x++) {
                             const val = 0.5 * alpha * Math.cos(((2 * x + 1) * u * Math.PI) / 16.0);
                             T[u * 8 + x] = val;
                             Tt[x * 8 + u] = val;
                         }
                     }

                     // 2. Táº¡o lÆ°á»›i chá»¯ kÃ½ chuáº©n 90x60 (láº·p Ä‘á»u 6-10 láº§n trÃªn áº£nh giÃºp triá»‡t tiÃªu hoÃ n toÃ n nhiá»…u ná»n khi giáº£i mÃ£)
                     const gridW = 90;
                     const gridH = 60;
                     const wmCanvas = document.createElement('canvas');
                     wmCanvas.width = gridW;
                     wmCanvas.height = gridH;
                     const wmCtx = wmCanvas.getContext('2d');
                     wmCtx.fillStyle = '#000000';
                     wmCtx.fillRect(0, 0, gridW, gridH);
                     wmCtx.fillStyle = '#ffffff';
                     wmCtx.textAlign = 'center';
                     wmCtx.textBaseline = 'middle';
                     
                     // TÃ¡ch chuá»—i rÃµ rÃ ng 3 dÃ²ng trÃªn lÆ°á»›i 90x60
                     const parts = hiddenText.split('/').filter(Boolean);
                     const line1 = "VNBUS";
                     let line2 = parts[0] ? parts[0].replace(/VNBUS/i, '') : "ARCHIVE";
                     if (!line2) line2 = "ARCHIVE";
                     const line3 = parts[1] ? `Â© ${parts[1]}` : "Â© VNBUS";

                     wmCtx.font = `900 15px "Montserrat", -apple-system, sans-serif`;
                     wmCtx.fillText(line1, gridW / 2, gridH * 0.22);

                     let fontSize2 = 13;
                     wmCtx.font = `900 ${fontSize2}px "Montserrat", -apple-system, sans-serif`;
                     const m2 = wmCtx.measureText(line2);
                     if (m2 && m2.width > gridW * 0.9) {
                         fontSize2 = Math.max(9, Math.floor(fontSize2 * ((gridW * 0.9) / m2.width)));
                     }
                     wmCtx.font = `900 ${fontSize2}px "Montserrat", -apple-system, sans-serif`;
                     wmCtx.fillText(line2, gridW / 2, gridH * 0.50);

                     let fontSize3 = 12;
                     wmCtx.font = `900 ${fontSize3}px "Montserrat", -apple-system, sans-serif`;
                     const m3 = wmCtx.measureText(line3);
                     if (m3 && m3.width > gridW * 0.9) {
                         fontSize3 = Math.max(8, Math.floor(fontSize3 * ((gridW * 0.9) / m3.width)));
                     }
                     wmCtx.font = `900 ${fontSize3}px "Montserrat", -apple-system, sans-serif`;
                     wmCtx.fillText(line3, gridW / 2, gridH * 0.78);

                     const wmImgData = wmCtx.getImageData(0, 0, gridW, gridH).data;
                     const wmGrays = new Float32Array(gridW * gridH);
                     for (let i = 0; i < gridW * gridH; i++) {
                         wmGrays[i] = (wmImgData[i * 4] - 128.0) / 128.0;
                     }

                     // 3. Xá»­ lÃ½ tá»«ng khá»‘i 8x8 trÃªn kÃªnh Y (Luminance trong YCbCr)
                     const blocksX = Math.floor(width / 8);
                     const blocksY = Math.floor(height / 8);
                     const block = new Float32Array(64);
                     const temp = new Float32Array(64);
                     const dct = new Float32Array(64);

                     // NgÆ°á»¡ng chÃªnh lá»‡ch tinh táº¿ káº¿t há»£p Äa táº§n sá»‘ (Multi-Carrier DCT Modulation)
                     for (let by = 0; by < blocksY; by++) {
                         for (let bx = 0; bx < blocksX; bx++) {
                             const gx = bx % gridW;
                             const gy = by % gridH;
                             
                             let targetDiff = 0;
                             if (wmGrays[gy * gridW + gx] <= -0.9) {
                                 targetDiff = -1.5;
                             } else {
                                 targetDiff = -1.5 + (wmGrays[gy * gridW + gx] + 1.0) * 12.0; // [-1.5 Ä‘áº¿n +10.5]
                             }

                             for (let y = 0; y < 8; y++) {
                                 const py = (by * 8 + y) * width;
                                 for (let x = 0; x < 8; x++) {
                                     const idx = (py + (bx * 8 + x)) * 4;
                                     const r = data[idx];
                                     const g = data[idx + 1];
                                     const b = data[idx + 2];
                                     const Y = 0.299 * r + 0.587 * g + 0.114 * b - 128.0;
                                     block[y * 8 + x] = Y;
                                 }
                             }

                             // TÃ­nh DCT 2D: C = T * block * T^t
                             for (let row = 0; row < 8; row++) {
                                 for (let col = 0; col < 8; col++) {
                                     let sum = 0.0;
                                     for (let k = 0; k < 8; k++) {
                                         sum += T[row * 8 + k] * block[k * 8 + col];
                                     }
                                     temp[row * 8 + col] = sum;
                                 }
                             }
                             for (let row = 0; row < 8; row++) {
                                 for (let col = 0; col < 8; col++) {
                                     let sum = 0.0;
                                     for (let k = 0; k < 8; k++) {
                                         sum += temp[row * 8 + k] * Tt[k * 8 + col];
                                     }
                                     dct[row * 8 + col] = sum;
                                 }
                             }

                             // Äiá»u cháº¿ trÃªn 3 cáº·p táº§n sá»‘ trung cao [(3,2)/(2,3), (4,2)/(2,4), (4,3)/(3,4)]
                             // Máº¯t ngÆ°á»i hoÃ n toÃ n vÃ´ cáº£m vá»›i thay Ä‘á»•i táº§n sá»‘ báº­c >= 5, giÃºp áº£nh má»‹n 100% dÃ¹ soi ká»¹
                             const freqPairs = [
                                 [3, 2, 2, 3],
                                 [4, 2, 2, 4],
                                 [4, 3, 3, 4]
                             ];
                             for (let p = 0; p < freqPairs.length; p++) {
                                 const [r1, c1Idx, r2, c2Idx] = freqPairs[p];
                                 let c1 = dct[r1 * 8 + c1Idx];
                                 let c2 = dct[r2 * 8 + c2Idx];
                                 const avg = (c1 + c2) / 2.0;
                                 if (targetDiff > 0) {
                                     if (c1 - c2 < targetDiff) {
                                         dct[r1 * 8 + c1Idx] = avg + (targetDiff + 1.2) / 2.0;
                                         dct[r2 * 8 + c2Idx] = avg - (targetDiff + 1.2) / 2.0;
                                     }
                                 } else {
                                     if (c1 - c2 > targetDiff) {
                                         dct[r1 * 8 + c1Idx] = avg + (targetDiff - 1.2) / 2.0;
                                         dct[r2 * 8 + c2Idx] = avg - (targetDiff - 1.2) / 2.0;
                                     }
                                 }
                             }

                             // TÃ­nh IDCT 2D: block = T^t * dct * T
                             for (let row = 0; row < 8; row++) {
                                 for (let col = 0; col < 8; col++) {
                                     let sum = 0.0;
                                     for (let k = 0; k < 8; k++) {
                                         sum += Tt[row * 8 + k] * dct[k * 8 + col];
                                     }
                                     temp[row * 8 + col] = sum;
                                 }
                             }
                             for (let row = 0; row < 8; row++) {
                                 for (let col = 0; col < 8; col++) {
                                     let sum = 0.0;
                                     for (let k = 0; k < 8; k++) {
                                         sum += temp[row * 8 + k] * T[k * 8 + col];
                                     }
                                     block[row * 8 + col] = sum;
                                 }
                             }

                             // Ghi láº¡i sai lá»‡ch Y vÃ o pixel RGB kÃ¨m káº¹p an toÃ n Â±3.8 giÃºp khÃ´ng bao giá» bá»‹ lá»™ Ä‘iá»ƒm dá»‹ thÆ°á»ng
                             for (let y = 0; y < 8; y++) {
                                 const py = (by * 8 + y) * width;
                                 for (let x = 0; x < 8; x++) {
                                     const idx = (py + (bx * 8 + x)) * 4;
                                     const r = data[idx];
                                     const g = data[idx + 1];
                                     const b = data[idx + 2];
                                     const oldY = 0.299 * r + 0.587 * g + 0.114 * b - 128.0;
                                     const newY = block[y * 8 + x];
                                     const diff = Math.min(3.8, Math.max(-3.8, newY - oldY));

                                     data[idx] = Math.min(255, Math.max(0, Math.round(r + diff)));
                                     data[idx + 1] = Math.min(255, Math.max(0, Math.round(g + diff)));
                                     data[idx + 2] = Math.min(255, Math.max(0, Math.round(b + diff)));
                                 }
                             }
                         }
                     }

                     ctx.putImageData(imgData, 0, 0);
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

                        const { error } = await window.sb.from('photo_likes').delete().eq('photo_id', photoId).eq('user_id', app.user.id);

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

                        const { error } = await window.sb.from('photo_likes').insert({ photo_id: photoId, user_id: app.user.id });

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

                        const rawProv = addr.state || addr.city || '';
                        const matchedProv = app.utils.matchProvinceName(rawProv);
                        if (matchedProv && app.upload && app.upload.selectProvince) {
                            app.upload.selectProvince(matchedProv);
                        }

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
                    const selectedProv = document.getElementById('up-province')?.value || document.getElementById('info-province')?.value || null;

                    try {
                        let rQuery = window.sb.from('photos').select('route_no').eq('status', 'approved');

                        if (currentType) rQuery = rQuery.eq('type', currentType);
                        if (selectedProv && selectedProv !== 'KhÃ´ng xÃ¡c Ä‘á»‹nh') {
                            rQuery = rQuery.eq('province', selectedProv);
                        }

                        if (query.trim().length > 0) {
                            const routeWords = query.trim().split(/\s+/).filter(w => w.length > 0);
                            routeWords.forEach(word => { rQuery = rQuery.ilike('route_no', `%${word}%`); });
                        }

                        const { data } = await rQuery.limit(30);
                        if (data) {
                            dbRoutes = data.map(item => item.route_no).filter(Boolean);
                        }
                    } catch (e) { console.log("Route suggestion error:", e.message); }


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
                    const inputEl = document.getElementById(inputId);
                    if (inputEl && inputEl.readOnly) {
                        if (box) box.style.display = 'none';
                        return;
                    }
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

                    const specialRoutes = ['Dá»«ng hoáº¡t Ä‘á»™ng', 'NgoÃ i giá» hoáº¡t Ä‘á»™ng', 'ChÆ°a hoáº¡t Ä‘á»™ng', 'Xe há»£p Ä‘á»“ng / ÄÆ°a Ä‘Ã³n', 'Há»£p Ä‘á»“ng / ÄÆ°a Ä‘Ã³n', 'Há»£p Ä‘á»“ng'];
                    const isSpecialRoute = specialRoutes.includes(routeVal);

                    // Náº¿u Query Ä‘ang rá»—ng VÃ€ (khÃ´ng pháº£i trÆ°á»ng model HOáº¶C trÆ°á»ng model mÃ  khÃ´ng cÃ³ tuyáº¿n HOáº¶C tuyáº¿n Ä‘áº·c biá»‡t) -> áº¨n box
                    if (query.length < 1 && !(field === 'model' && routeVal.length > 0 && !isSpecialRoute)) {
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

                        if (query.length < 1 && field === 'model' && routeVal.length > 0 && !isSpecialRoute) {
                            // TRÆ¯á»œNG Há»¢P 1: Query rá»—ng nhÆ°ng cÃ³ TUYáº¾N -> Fetch cÃ¡c dÃ²ng xe theo Tuyáº¿n tá»« Database
                            let sbQuery = window.sb.from('photos')
                                .select('vehicles!inner(model)')
                                .eq('route_no', routeVal)
                                .eq('status', 'approved'); // CHá»ˆ Gá»¢I Ã Tá»ª áº¢NH ÄÃƒ ÄÆ¯á»¢C DUYá»†T

                            if (currentType) {
                                sbQuery = sbQuery.eq('type', currentType);
                            }

                            // Lá»c chÃ­nh xÃ¡c theo Tuyáº¿n cá»§a tá»‰nh (khÃ´ng trá»™n vá»›i BKS khi Ä‘Ã£ chá»n Tuyáº¿n cá»§a tá»‰nh)
                            const selectedProv = document.getElementById('up-province')?.value || null;
                            if (selectedProv && selectedProv !== 'KhÃ´ng xÃ¡c Ä‘á»‹nh') {
                                sbQuery = sbQuery.eq('province', selectedProv);
                            } else if (plateVal && plateVal.length >= 2) {
                                const prefix = plateVal.substring(0, 2);
                                if (!isNaN(prefix)) {
                                    const relatedPrefixes = app.utils.getRelatedPrefixes(prefix);
                                    if (relatedPrefixes && relatedPrefixes.length > 0) {
                                        const prefixOrCond = relatedPrefixes.map(p => `license_plate.ilike.${p}%`).join(',');
                                        sbQuery = sbQuery.or(prefixOrCond);
                                    }
                                }
                            }

                            sbQuery = app.preference.applyFilter(sbQuery); // <--- THÃŠM DÃ’NG NÃ€Y

                            const res = await sbQuery.limit(100).abortSignal(controller.signal);

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
                            if (table === 'vehicles') {
                                selectStr = `${selectField}, photos!inner(status${(app.preference.current !== 'both' || currentType) ? ', type' : ''})`;
                            }

                            let sbQuery = window.sb.from(table).select(selectStr);

                            // CHá»ˆ Gá»¢I Ã Tá»ª áº¢NH ÄÃƒ ÄÆ¯á»¢C DUYá»†T
                            if (table === 'photos') {
                                sbQuery = sbQuery.eq('status', 'approved');
                            } else if (table === 'vehicles') {
                                sbQuery = sbQuery.eq('photos.status', 'approved');
                            }

                            if (currentType) {
                                if (table === 'photos') {
                                    sbQuery = sbQuery.eq('type', currentType);
                                } else if (table === 'vehicles') {
                                    sbQuery = sbQuery.eq('photos.type', currentType);
                                }
                            }

                            if (table === 'photos') {
                                const selectedProv = document.getElementById('up-province')?.value || null;
                                if (selectedProv && selectedProv !== 'KhÃ´ng xÃ¡c Ä‘á»‹nh') {
                                    sbQuery = sbQuery.eq('province', selectedProv);
                                }
                            }

                            searchWords.forEach(word => {
                                sbQuery = sbQuery.ilike(selectField, `%${word}%`);
                            });

                            sbQuery = app.preference.applyFilter(sbQuery, table);

                            const res = await sbQuery.limit(15).abortSignal(controller.signal);
                            data = res.data;
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
                        app.topUploadersCounts = counts;
                        if (sorted.length > 0) app.topUploaders[sorted[0][0]] = 1;
                        if (sorted.length > 1) app.topUploaders[sorted[1][0]] = 2;
                        if (sorted.length > 2) app.topUploaders[sorted[2][0]] = 3;
                    } catch (e) { console.log("Lá»—i táº£i Top:", e); }
                },

                formatProfileDisplay: (profile) => {
                    if (!profile) return { username: 'áº¨n danh', avatar: DEFAULT_AVATAR, isBanned: false, id: '', linkId: '' };
                    let banInfo = null;
                    if (profile.ban_status) {
                        try { banInfo = typeof profile.ban_status === 'string' ? JSON.parse(profile.ban_status) : profile.ban_status; } catch(e){}
                    }
                    const isBanned = banInfo && (banInfo.banned === true || banInfo.banned === 'true');
                    const username = isBanned ? 'NgÆ°á»i dÃ¹ng bá»‹ cáº¥m' : (profile.username || 'áº¨n danh');
                    const avatar = isBanned ? DEFAULT_AVATAR : (profile.avatar_url ? app.utils.getProxiedUrl(profile.avatar_url.replace(/"/g, ''), 'avatar.jpg', 'avatar') : DEFAULT_AVATAR);
                    return { username, avatar, isBanned, id: profile.id || '', linkId: profile.id || profile.username || '' };
                },

                getBadgesHTML: (userId, role, subroles = []) => {
                    let html = '';

                    if (subroles && subroles.includes('dev')) {
                        html += `<span class="badge-shiny" style="background: linear-gradient(135deg, #22c55e, #15803d);" title="Developer"><i class="fa-solid fa-code mr-1 text-[10px]"></i> Dev</span>`;
                    }

                    if (role === 'admin' || role === 'manager') {
                        const badgeClass = role === 'manager' ? 'badge-manager' : 'badge-admin';
                        const badgeText = role === 'manager' ? 'Quáº£n lÃ½' : 'Kiá»ƒm duyá»‡t';
                        const badgeTitle = role === 'manager' ? 'Quáº£n lÃ½ há»‡ thá»‘ng (Quyá»n cao nháº¥t)' : 'Kiá»ƒm duyá»‡t viÃªn';
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
             }
});

Object.assign(window.app, {
  init: async () => {
        window.onpopstate = () => app.handleRoute();
        if (!window._spaClickListenerRegistered) {
            window._spaClickListenerRegistered = true;
            document.body.addEventListener('click', e => {
                const a = e.target.closest('a');
                if (a && a.getAttribute('href') && a.getAttribute('href').startsWith('/') && !a.getAttribute('target')) {
                    e.preventDefault();
                    app.utils.navigate(a.getAttribute('href'));
                }
            });
        }

            let session = null;

            try {
                const { data } = await window.sb.auth.getSession();
                session = data.session;

                if (session && session.access_token) {
                    fetch('/api/system', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                        body: JSON.stringify({ action: 'log_ip' })
                    }).catch(()=>{});
                }

                // --- CHáº¶N TÃ€I KHOáº¢N CHÆ¯A XÃC MINH NGAY Tá»ª Äáº¦U ---
                if (session && session.user && !session.user.email_confirmed_at) {
                    document.getElementById('loading-screen').style.display = 'none';
                    if(document.getElementById('app-container')) document.getElementById('app-container').style.display = 'none';
                    app.auth.showVerificationModal(session.user.email);
                    return;
                }
                // ---------------------------------------------------

                setTimeout(() => {
                    document.getElementById('loading-screen').style.display = 'none';
                    const appContainer = document.getElementById('app-container');
                    appContainer.style.display = 'block';
                    setTimeout(() => {
                        appContainer.style.opacity = '1';
                        if (!localStorage.getItem('vnbus_donate_toast_shown')) {
                            localStorage.setItem('vnbus_donate_toast_shown', 'true');
                            setTimeout(() => {
                                app.toast.show('heart', 'Website phi lá»£i nhuáº­n', 'KhÃ´ng quáº£ng cÃ¡o, khÃ´ng nguá»“n thu - VNBA duy trÃ¬ báº±ng sá»± á»§ng há»™ cá»§a cÃ¡c báº¡n. Nháº¥n vÃ o Ä‘Ã¢y Ä‘á»ƒ chia sáº» website nhÃ©!', 0, async () => {
                                    const shareText = 'Web lÆ°u trá»¯ hÃ¬nh áº£nh xe buÃ½t/khÃ¡ch Viá»‡t Nam phi lá»£i nhuáº­n https://www.vnbusarchive.io.vn';
                                    if (navigator.share) {
                                        try { await navigator.share({ text: shareText }); } catch (err) {}
                                    } else {
                                        try {
                                            await navigator.clipboard.writeText(shareText);
                                            app.toast.show('success', 'ÄÃ£ copy', 'Thiáº¿t bá»‹ khÃ´ng há»— trá»£ chia sáº», Ä‘Ã£ copy ná»™i dung!');
                                        } catch (e) {}
                                    }
                                });
                            }, 1000);
                        }
                    }, 50);
                }, 400);

                await app.setUser(session ? session.user : null);

                window.sb.auth.onAuthStateChange(async (event, session) => {

                        if (event === 'PASSWORD_RECOVERY') {
    // Chá»‰ xá»­ lÃ½ trÃªn TAB Má»šI (Tab Ä‘Æ°á»£c má»Ÿ tá»« Link Email sáº½ cÃ³ chá»©a chá»¯ type=recovery trÃªn URL)
    if (window.location.hash.includes('type=recovery')) {
        app.auth.mode = 'recovery';

        // Äiá»u hÆ°á»›nh tháº³ng vÃ o trang Auth Ä‘á»ƒ hiá»‡n form
        if (window.location.pathname !== '/auth') {
            app.utils.navigate('/auth');
        } else {
            app.views.switch('auth', false);
        }

        // Báº¯n event gá»i AlpineJS Ä‘á»•i giao diá»‡n sang Form Nháº­p máº­t kháº©u má»›i
        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('set-auth-mode', { detail: 'recovery' }));
        }, 100);
    }
    // Náº¿u lÃ  TAB CÅ¨ (Trang báº¡n vá»«a báº¥m gá»­i yÃªu cáº§u) -> Return, khÃ´ng lÃ m gÃ¬ cáº£!
    return;
}

                        else if (event === 'USER_UPDATED') {
                            const hash = window.location.hash;
                            if (hash && hash.includes('type=email_change')) {
                                setTimeout(() => {
                                    app.ui.showAlert("XÃ¡c nháº­n Ä‘á»•i Ä‘á»‹a chá»‰ Email thÃ nh cÃ´ng!");
                                    window.history.replaceState(null, null, window.location.pathname);
                                }, 500);
                            }
                        }

                        else if (event === 'SIGNED_IN') {
                            const hash = window.location.hash;
                            if (hash && hash.includes('type=signup')) {
                                setTimeout(() => {
                                    app.ui.showAlert("XÃ¡c thá»±c Email thÃ nh cÃ´ng! ChÃ o má»«ng báº¡n Ä‘áº¿n vá»›i há»‡ thá»‘ng.");
                                    window.history.replaceState(null, null, window.location.pathname);
                                }, 500);
                            }
                        }
                    });

                } catch (e) {
                    document.getElementById('loading-screen').style.display = 'none';
                    const appContainer = document.getElementById('app-container');
                    if(appContainer) {
                        appContainer.style.display = 'block';
                        appContainer.style.opacity = '1';
                    }
                    await app.setUser(null);
                }

                // Network Resilience (TÃ­ch há»£p Toast má»›i)
                window.addEventListener('offline', () => {
                    document.body.classList.add('is-offline');
                    if (app.toast.currentOfflineToast) app.toast.currentOfflineToast(); // ÄÃ³ng cÃ¡i cÅ© náº¿u cÃ³
                    app.toast.currentOfflineToast = app.toast.show('offline', 'Máº¥t káº¿t ná»‘i Internet', 'Báº¡n Ä‘ang ngoáº¡i tuyáº¿n. Dá»¯ liá»‡u sáº½ khÃ´ng thá»ƒ Ä‘á»“ng bá»™.', 0);
                });
                
                window.addEventListener('online', () => {
                    document.body.classList.remove('is-offline');
                    if (app.toast.currentOfflineToast) {
                        app.toast.currentOfflineToast(); // áº¨n thÃ´ng bÃ¡o lá»—i
                        app.toast.currentOfflineToast = null;
                    }
                    app.toast.show('success', 'ÄÃ£ khÃ´i phá»¥c káº¿t ná»‘i', 'Máº¡ng Internet Ä‘Ã£ hoáº¡t Ä‘á»™ng trá»Ÿ láº¡i.', 5000);
                });
                
                if (!navigator.onLine) {
                    document.body.classList.add('is-offline');
                    app.toast.currentOfflineToast = app.toast.show('offline', 'Máº¥t káº¿t ná»‘i Internet', 'Báº¡n Ä‘ang ngoáº¡i tuyáº¿n. Dá»¯ liá»‡u sáº½ khÃ´ng thá»ƒ Ä‘á»“ng bá»™.', 0);
                }


                // Upload Form Auto-save Draft on Exit
                window.addEventListener('beforeunload', (e) => {
                    if (app.currentViewMode === 'upload') {
                        app.upload.saveDraft();
                    }
                    if (app.upload && app.upload.isQueueProcessing) {
                        e.preventDefault();
                        e.returnValue = ''; // Cháº·n Ä‘Ã³ng tab náº¿u Ä‘ang táº£i dá»¯ liá»‡u ngáº§m lÃªn
                    }
                });

                app.scrollPositions = {};
                app.currentPathForScroll = window.location.pathname + window.location.search;
                app._isUserScrolling = false;
                let _scrollTimer = null;
                window.addEventListener('scroll', () => {
                    app.scrollPositions[app.currentPathForScroll] = window.scrollY;
                    app._isUserScrolling = true;
                    if (_scrollTimer) clearTimeout(_scrollTimer);
                    _scrollTimer = setTimeout(() => { app._isUserScrolling = false; }, 400);
                }, { passive: true });
                app.lastSearchQuery = '';
                app.lastSearchFilter = '';
                app.lastLoadedUsername = '';
                app.utils.updateBreadcrumbs();
                await app.utils.loadProvinceData();
                app.search.initExactRouteMenu();
                await app.maintenance.fetch();

                app.preference.load();

                app.onboarding.check();



                app.handleRoute();

                const upFileEl = document.getElementById('up-file');
                if (upFileEl) upFileEl.addEventListener('change', app.upload.handleFileSelect);

                const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
                const webrtcFileEl = document.getElementById('webrtc-mobile-file');
                const formatHintEl = document.getElementById('upload-format-hint');
                if (!isMobileDevice) {
                    const pcAccept = "image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif,.nef,.cr2,.cr3,.arw,.dng,.orf,.rw2,.pef,.raf,.srw,.raw";
                    if (upFileEl) upFileEl.accept = pcAccept;
                    if (webrtcFileEl) webrtcFileEl.accept = pcAccept;
                    if (formatHintEl) formatHintEl.innerText = "Äá»ŠNH Dáº NG JPG, PNG, HEIC, RAW (Tá»I ÄA 30MB)";
                } else {
                    const mobileAccept = "image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif";
                    if (upFileEl) upFileEl.accept = mobileAccept;
                    if (webrtcFileEl) webrtcFileEl.accept = mobileAccept;
                    if (formatHintEl) formatHintEl.innerText = "Äá»ŠNH Dáº NG JPG, PNG, HEIC (RAW CHá»ˆ TRÃŠN PC)";
                }

                // Logic Drag & Drop TOÃ€N MÃ€N HÃŒNH (Clean UI: HÃ¬nh trÃ²n tráº¯ng khÃ´ng viá»n)
                const dropZone = document.getElementById('drop-zone');
                if (dropZone) {
                    let dragCounter = 0;

                    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                        window.addEventListener(eventName, e => {
                            e.preventDefault();
                            e.stopPropagation();
                        }, false);
                    });

                    window.addEventListener('dragenter', (e) => {
                        const uploadView = document.getElementById('upload');
                        if (!uploadView || !uploadView.classList.contains('active')) return;

                        dragCounter++;
                        if (dragCounter === 1) {
                            // Giao diá»‡n Ã´ thÃ´ng bÃ¡o mÃ u xanh
                            dropZone.style.backgroundColor = '#eff6ff';
                            dropZone.style.borderColor = '#3b82f6';
                            dropZone.style.color = '#1e40af';
                            dropZone.style.transform = 'scale(1.03)';
                            dropZone.style.boxShadow = '0 25px 50px -12px rgba(59, 130, 246, 0.3)';
                            dropZone.style.transition = 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

                            const icon = dropZone.querySelector('i');
                            const iconContainer = dropZone.querySelector('.w-16');

                            if (icon) {
                                icon.classList.add('animate-bounce');
                                icon.style.color = '#000000'; // ÄÃ¡m mÃ¢y mÃ u Ä‘en
                            }
                            if (iconContainer) {
                                iconContainer.style.backgroundColor = '#ffffff'; // HÃ¬nh trÃ²n tráº¯ng tinh
                                iconContainer.style.border = 'none';            // Bá» hoÃ n toÃ n viá»n
                                iconContainer.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'; // ThÃªm Ä‘á»• bÃ³ng nháº¹ cho hÃ¬nh trÃ²n ná»•i lÃªn
                            }
                        }
                    });

                    const resetDropZoneUI = () => {
                        dropZone.style.backgroundColor = '';
                        dropZone.style.borderColor = '';
                        dropZone.style.color = '';
                        dropZone.style.transform = '';
                        dropZone.style.boxShadow = '';
                        const icon = dropZone.querySelector('i');
                        const iconContainer = dropZone.querySelector('.w-16');
                        if (icon) {
                            icon.classList.remove('animate-bounce');
                            icon.style.color = '';
                        }
                        if (iconContainer) {
                            iconContainer.style.backgroundColor = '';
                            iconContainer.style.border = '';
                            iconContainer.style.boxShadow = '';
                        }
                    };

                    window.addEventListener('dragleave', (e) => {
                        dragCounter--;
                        if (dragCounter <= 0) {
                            dragCounter = 0;
                            resetDropZoneUI();
                        }
                    });

                    window.addEventListener('drop', (e) => {
                        dragCounter = 0;
                        resetDropZoneUI();

                        const uploadView = document.getElementById('upload');
                        if (uploadView && uploadView.classList.contains('active')) {
                            const dt = e.dataTransfer;
                            if (dt.files && dt.files.length > 0) {
                                const fileInput = document.getElementById('up-file');
                                fileInput.files = dt.files;
                                app.upload.handleFileSelect({ target: fileInput });
                            }
                        }
                    });
                }
                app.upload.initDraggable();

                document.getElementById('upload-form').addEventListener('submit', app.upload.submit);
                document.getElementById('inline-edit-form').addEventListener('submit', app.edit.submitInline);
                document.getElementById('up-plate').addEventListener('blur', app.upload.checkDuplicateRealtime);
                document.getElementById('up-date').addEventListener('change', app.upload.checkDuplicateRealtime);
                app.upload.initValidation();

                const fieldMap = {
                    'info-plate': 'plate',
                    'info-operator': 'operator',
                    'info-route': 'route',
                    'info-camera': 'camera'
                };

                Object.keys(fieldMap).forEach(id => {
                    const el = document.getElementById(id);
                    if(!el) return;
                    el.addEventListener('click', function () {
                        if (this.readOnly && this.value && this.value !== '---' && this.value !== 'N/A') {
                            if (id === 'info-plate') {
                                app.utils.navigate(`/vehicle/${encodeURIComponent(this.value)}`);
                            }
                            else if (id === 'info-operator') {
                                app.utils.navigate(`/operator/${encodeURIComponent(this.value)}`);
                            }
                            else if (id === 'info-route') {
                                const plateValue = document.getElementById('info-plate').value;
                                let routePrefix = '';
                                const provName = app.utils.getProvinceFromPlate(plateValue);
                                if (provName && app.utils.provinceData && app.utils.provinceData.length) {
                                    const pData = app.utils.provinceData.find(p => p.ten === provName);
                                    if (pData && pData.ky_hieu) {
                                        routePrefix = Array.isArray(pData.ky_hieu) ? String(pData.ky_hieu[0]).trim() : String(pData.ky_hieu).split()[0].trim();
                                    }
                                }
                                app.searchRedirect(this.value, 'route', routePrefix);
                            }
                            else {
                                app.searchRedirect(this.value, fieldMap[id]);
                            }
                        }
                    });
                });

                // Xá»¬ LÃ RIÃŠNG CHO INFO-MODEL (ÄIá»€U HÆ¯á»šNG SANG PROFILE DÃ’NG XE)
                const elInfoModel = document.getElementById('info-model');
                if (elInfoModel) {
                    elInfoModel.addEventListener('click', function() {
                        if (this.readOnly && this.value && this.value !== '---' && this.value !== 'N/A') {
                            app.utils.navigate(`/model/${encodeURIComponent(this.value)}`);
                        }
                    });
                }

                // ---- KÃCH HOáº T Sá»° KIá»†N CHO Cáº¢ 2 Ã” TÃŒM KIáº¾M ----
                const clearSearchInput = (inputEl, sugId) => {
                    inputEl.value = '';
                    document.getElementById(sugId).classList.remove('active');
                    app.search.triggerMainSuggestion('', inputEl.id, sugId);
                };

                document.getElementById('search-input').addEventListener('keydown', function (e) {
                    if (e.key === 'Enter') { document.getElementById('main-search-suggestions').classList.remove('active'); app.handleSearch(true, 'search-input'); }
                    if (e.key === 'Escape') clearSearchInput(e.target, 'main-search-suggestions');
                });
                document.getElementById('search-input').addEventListener('input', function (e) {
                    const val = e.target.value;
                    const pageInp = document.getElementById('page-search-input');
                    if (pageInp && document.activeElement === e.target) pageInp.value = val;
                    app.search.triggerMainSuggestion(val.trim(), 'search-input', 'main-search-suggestions');
                });
                document.getElementById('search-input').addEventListener('focus', function (e) {
                    app.search.triggerMainSuggestion(e.target.value.trim(), 'search-input', 'main-search-suggestions');
                });

                const pageSearchInput = document.getElementById('page-search-input');
                if (pageSearchInput) {
                    pageSearchInput.addEventListener('keydown', function (e) {
                        if (e.key === 'Enter') { document.getElementById('page-search-suggestions').classList.remove('active'); app.handleSearch(true, 'page-search-input'); }
                        if (e.key === 'Escape') clearSearchInput(e.target, 'page-search-suggestions');
                    });
                    pageSearchInput.addEventListener('input', function (e) {
                        const val = e.target.value;
                        const headerInp = document.getElementById('search-input');
                        if (headerInp && document.activeElement === e.target) headerInp.value = val;
                        app.search.triggerMainSuggestion(val.trim(), 'page-search-input', 'page-search-suggestions');
                    });
                    pageSearchInput.addEventListener('focus', function (e) {
                        app.search.triggerMainSuggestion(e.target.value.trim(), 'page-search-input', 'page-search-suggestions');
                    });
                }

                document.getElementById('up-location').addEventListener('input', function () {
                    clearTimeout(app.searchTimeout);
                    app.searchTimeout = setTimeout(() => {
                        app.utils.geocodeAddress(this.value);
                    }, 1000);
                });

                // Sá»­a logic áº©n menu tháº£ xuá»‘ng Ä‘á»ƒ há»— trá»£ nhiá»u menu Filter
                document.addEventListener('click', function (e) {
                    document.querySelectorAll('.filter-menu').forEach(menu => {
                        const btn = menu.previousElementSibling;
                        if (!menu.contains(e.target) && btn && !btn.contains(e.target)) {
                            menu.classList.remove('active');
                        }
                    });

                    document.querySelectorAll('.suggestion-box').forEach(box => {
                        if (!box.contains(e.target) && !box.previousElementSibling.contains(e.target)) {
                            box.classList.remove('active');
                        }
                    });

                    const userMenuDropdown = document.getElementById('user-dropdown');
                    const userMenuContainer = document.getElementById('user-menu-container');
                    if (userMenuDropdown && userMenuContainer && !userMenuDropdown.contains(e.target) && !userMenuContainer.contains(e.target)) {
                        app.ui.toggleUserMenu(false);
                    }
                });

                app.upload.initMap();
                app.utils.loadAnnouncements();
                app.utils.fetchTopUploaders();


                if (app.realtimeChannel) {
                    window.sb.removeChannel(app.realtimeChannel);
                }

                app.realtimeChannel = window.sb.channel('global-changes')
                    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'photos', filter: 'status=eq.approved' }, payload => {
                        if (app.currentViewMode === 'home') {
                            const now = Date.now();
                            // CHá»NG Báº®N REAL: chá»‰ reload tá»‘i Ä‘a 1 láº§n / 30s, vÃ  bá» qua khi user Ä‘ang cuá»™n
                            if (app._lastHomeRealtimeReload && now - app._lastHomeRealtimeReload < 30000) return;
                            if (app._isUserScrolling) return;
                            app._lastHomeRealtimeReload = now;
                            app.views.loadHome(true);
                        }
                    })
                    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'photos' }, payload => {
                        if (app.currentPhoto && app.currentPhoto.id === payload.new.id) {
                            const viewEl = document.getElementById('stat-views');
                            if (viewEl) viewEl.innerText = payload.new.views || 0;
                        }
                        if (payload.new && payload.new.status !== 'pending') {
                            const cardEl = document.getElementById(`adm-photo-card-${payload.new.id}`);
                            if (cardEl) {
                                if (document.activeElement && cardEl.contains(document.activeElement)) {
                                    document.activeElement.blur();
                                }
                                cardEl.style.transition = 'all 0.35s ease';
                                cardEl.style.opacity = '0';
                                cardEl.style.transform = 'scale(0.92)';
                                cardEl.style.maxHeight = '0px';
                                cardEl.style.margin = '0px';
                                cardEl.style.padding = '0px';
                                cardEl.style.overflow = 'hidden';
                                setTimeout(() => {
                                    cardEl.remove();
                                    const content = document.getElementById('admin-content');
                                    if (content && content.querySelectorAll('.admin-card').length === 0 && app.adminTab === 'photos') {
                                        content.innerHTML = '<p class="p-4">KhÃ´ng cÃ³ áº£nh nÃ o chá» duyá»‡t.</p>';
                                    }
                                }, 350);
                                if (app.admin && app.admin.refreshCounts) app.admin.refreshCounts();
                            }
                        }
                    })
                    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'photos' }, payload => {
                        const cardEl = document.getElementById(`adm-photo-card-${payload.old?.id}`);
                        if (cardEl) {
                            if (document.activeElement && cardEl.contains(document.activeElement)) {
                                document.activeElement.blur();
                            }
                            cardEl.style.transition = 'all 0.35s ease';
                            cardEl.style.opacity = '0';
                            cardEl.style.transform = 'scale(0.92)';
                            cardEl.style.maxHeight = '0px';
                            cardEl.style.margin = '0px';
                            cardEl.style.padding = '0px';
                            cardEl.style.overflow = 'hidden';
                            setTimeout(() => {
                                cardEl.remove();
                                const content = document.getElementById('admin-content');
                                if (content && content.querySelectorAll('.admin-card').length === 0 && app.adminTab === 'photos') {
                                    content.innerHTML = '<p class="p-4">KhÃ´ng cÃ³ áº£nh nÃ o chá» duyá»‡t.</p>';
                                }
                            }, 350);
                            if (app.admin && app.admin.refreshCounts) app.admin.refreshCounts();
                        }
                    })
                    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'photos', filter: 'status=eq.pending' }, async payload => {
                        if (app.adminTab === 'photos' && (app.role === 'admin' || app.role === 'manager') && payload.new && payload.new.id) {
                            try {
                                const { data: newPhoto } = await window.sb.from('photos').select('*, profiles(username, role), vehicles(model)').eq('id', payload.new.id).maybeSingle();
                                if (newPhoto && !document.getElementById(`adm-photo-card-${newPhoto.id}`)) {
                                    await app.utils.resolveSandboxUrls([newPhoto]);
                                    const content = document.getElementById('admin-content');
                                    if (content && app.admin && app.admin.renderSinglePhotoCardHTML) {
                                        const noDataMsg = content.querySelector('p');
                                        if (noDataMsg && noDataMsg.innerText.includes('KhÃ´ng cÃ³ áº£nh nÃ o')) {
                                            content.innerHTML = '';
                                        }
                                        let plateSet = app.admin?.approvedPlateSet || new Set();
                                        let opSet = app.admin?.approvedOpSet || new Set();
                                        let routeSet = app.admin?.approvedRouteSet || new Set();
                                        let modelSet = app.admin?.approvedModelSet || new Set();

                                        const plateKey = (newPhoto.license_plate || '').trim().toUpperCase();
                                        if (plateKey && !plateSet.has(plateKey)) {
                                            const { data: vData } = await window.sb.from('vehicles').select('license_plate').eq('license_plate', plateKey).limit(1);
                                            const { data: pData } = await window.sb.from('photos').select('license_plate').eq('status', 'approved').eq('license_plate', plateKey).limit(1);
                                            if ((vData && vData.length > 0) || (pData && pData.length > 0)) plateSet.add(plateKey);
                                        }
                                        const opKey = app.utils.cleanText(newPhoto.operator || '').trim().toLowerCase();
                                        if (opKey && opKey !== '---' && !opSet.has(opKey)) {
                                            const { data: vData } = await window.sb.from('vehicles').select('operator').ilike('operator', opKey).limit(1);
                                            const { data: oData } = await window.sb.from('operator_info').select('operator_name').ilike('operator_name', opKey).limit(1);
                                            const { data: pData } = await window.sb.from('photos').select('operator').eq('status', 'approved').ilike('operator', opKey).limit(1);
                                            if ((vData && vData.length > 0) || (oData && oData.length > 0) || (pData && pData.length > 0)) opSet.add(opKey);
                                        }
                                        const routeKey = app.utils.cleanText(newPhoto.route_no || '').trim().toLowerCase();
                                        if (routeKey && routeKey !== '---' && !routeSet.has(routeKey)) {
                                            const stripped = routeKey.replace(/^tuyáº¿n\s+/i, '').trim();
                                            const variants = [...new Set([routeKey, stripped, 'tuyáº¿n ' + stripped])];
                                            if (/^\d+$/.test(stripped)) {
                                                const num = String(parseInt(stripped, 10));
                                                const pad = stripped.padStart(2, '0');
                                                variants.push(num, pad, 'tuyáº¿n ' + num, 'tuyáº¿n ' + pad);
                                            }
                                            const { data: vData } = await window.sb.from('vehicles').select('route_no').in('route_no', variants).limit(1);
                                            const { data: pData } = await window.sb.from('photos').select('route_no').eq('status', 'approved').in('route_no', variants).limit(1);
                                            if ((vData && vData.length > 0) || (pData && pData.length > 0)) {
                                                variants.forEach(v => routeSet.add(v.toLowerCase()));
                                            }
                                        }
                                        const modelKey = app.utils.cleanText(newPhoto.vehicles?.model || '').trim().toLowerCase();
                                        if (modelKey && modelKey !== '---' && !modelSet.has(modelKey)) {
                                            const { data: vData } = await window.sb.from('vehicles').select('model').ilike('model', modelKey).limit(1);
                                            const { data: pData } = await window.sb.from('photos').select('vehicles!inner(model)').eq('status', 'approved').ilike('vehicles.model', modelKey).limit(1);
                                            if ((vData && vData.length > 0) || (pData && pData.length > 0)) modelSet.add(modelKey);
                                        }

                                        const tempDiv = document.createElement('div');
                                        tempDiv.innerHTML = app.admin.renderSinglePhotoCardHTML(newPhoto, plateSet, opSet, routeSet, modelSet);
                                        const newCard = tempDiv.firstElementChild;
                                        if (newCard) {
                                            newCard.style.opacity = '0';
                                            newCard.style.transform = 'translateY(-15px)';
                                            newCard.style.transition = 'all 0.4s ease';
                                            const isNewPrivileged = (newPhoto.profiles?.role === 'admin' || newPhoto.profiles?.role === 'manager');
                                            const newId = Number(newPhoto.id) || 0;
                                            const existingCards = Array.from(content.querySelectorAll('.admin-card'));
                                            let insertBeforeTarget = null;

                                            for (const card of existingCards) {
                                                const isCardPrivileged = card.getAttribute('data-privileged') === 'true';
                                                const cardId = Number(card.getAttribute('data-photo-id')) || 0;

                                                if (isNewPrivileged) {
                                                    if (!isCardPrivileged || cardId > newId) {
                                                        insertBeforeTarget = card;
                                                        break;
                                                    }
                                                } else {
                                                    if (!isCardPrivileged && cardId > newId) {
                                                        insertBeforeTarget = card;
                                                        break;
                                                    }
                                                }
                                            }

                                            if (insertBeforeTarget) {
                                                content.insertBefore(newCard, insertBeforeTarget);
                                            } else {
                                                content.appendChild(newCard);
                                            }
                                            requestAnimationFrame(() => {
                                                newCard.style.opacity = '1';
                                                newCard.style.transform = 'translateY(0)';
                                            });
                                        }
                                    }
                                    if (app.admin && app.admin.refreshCounts) app.admin.refreshCounts();
                                }
                            } catch (err) {
                                console.error('Realtime insert photo error:', err);
                            }
                        }
                    })
                    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'vehicles' }, payload => {
                        const upPlate = document.getElementById('up-plate');
                        if (document.getElementById('upload').classList.contains('active') && upPlate && upPlate.value) {
                            if (upPlate.value.replace(/[^A-Z0-9]/gi, '').toUpperCase() === payload.new.license_plate) {
                                app.upload.checkPlate(upPlate.value);
                            }
                        }
                    })

                    .subscribe((status, err) => {
                        if (status === 'SUBSCRIBED') {
                            console.log('ðŸ”Œ Connected to Realtime');
                            app.setRealtimeStatus(true);
                        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
                            console.error('ðŸ”Œ Realtime Error:', err);
                            app.setRealtimeStatus(false);
                        }
                    });

                window.addEventListener('visibilitychange', () => {

                    if (document.visibilityState === 'visible') {
                        if (!app.isReinitializing) {
                            app.reinitializeComponents();
                        }

                        const state = app.realtimeChannel?.state;
                        if (state !== 'joined' && state !== 'joining') {
                            console.log('ðŸ”„ Tab visible: Reconnecting Realtime...');
                            app.setRealtimeStatus(false);
                            if (app.realtimeChannel) window.sb.removeChannel(app.realtimeChannel);
                            window.sb.realtime.connect();
                        }
                    }
                });

                window.addEventListener('offline', () => app.setRealtimeStatus(false));
                window.addEventListener('online', () => {
                    if (app.realtimeChannel && app.realtimeChannel.state !== 'joined' && app.realtimeChannel.state !== 'joining') {
                        app.setRealtimeStatus(false);
                        if (app.realtimeChannel) window.sb.removeChannel(app.realtimeChannel);
                        window.sb.realtime.connect();
                    } else {
                        app.setRealtimeStatus(true);
                    }
                });
            }
});

Object.assign(window.app, {
  isRealtimeConnected: true,
  setRealtimeStatus: (isConnected) => {
      app.isRealtimeConnected = isConnected;
      const banner = document.getElementById('admin-realtime-warning');
      const adminContent = document.getElementById('admin-content');
      if (!isConnected) {
          if (banner) banner.classList.remove('hidden');
          if (adminContent) {
              adminContent.style.pointerEvents = 'none';
              adminContent.style.opacity = '0.55';
              adminContent.querySelectorAll('button, input, select, textarea').forEach(el => {
                  el.disabled = true;
              });
          }
      } else {
          if (banner) banner.classList.add('hidden');
          if (adminContent) {
              adminContent.style.pointerEvents = 'auto';
              adminContent.style.opacity = '1';
              if (app.currentViewMode === 'admin' && app.admin && typeof app.admin.loadTab === 'function') {
                  app.admin.loadTab(app.adminTab || 'photos');
              }
          }
      }
  },
  handleRoute: () => {
                app.loadingBar.start(); // Báº­t thanh loading ngay láº­p tá»©c
                app.utils.cleanupState();
                if (app.utils && app.utils.updateCanonical) app.utils.updateCanonical();

                const path = window.location.pathname;
                const searchParams = new URLSearchParams(window.location.search);
                app.currentPathForScroll = path + window.location.search;

                // CHUYá»‚N GIAO DIá»†N (UI) NGAY Láº¬P Tá»¨C TRÆ¯á»šC, DATA LOAD NGáº¦M SAU
                if (path === '/login' && searchParams.get('qr')) {
                    app.views.switch('home', false);
                    setTimeout(() => app.qrLogin.initClient(searchParams.get('qr')), 500);
                } else if (path === '/auth') {
                    document.title = 'XÃ¡c thá»±c | VNBUSARCHIVE';
                    const isRecovery = window.location.hash.includes('type=recovery') || app.auth.mode === 'recovery';
                    if (app.user && !isRecovery) app.utils.navigate('/');
                    else app.views.switch('auth', false);
                } else if (path === '/setting' || path === '/settings') {
                    app.views.switch('account', false);
                    app.views.loadAccount();
                    setTimeout(() => {
                        app.settings.open();
                        const tab = searchParams.get('tab') || searchParams.get('caigido');
                        if (tab) {
                            app.settings.jumpTo(tab, 'account');
                        }
                    }, 400);
                } else if (path === '/profile/comments') {
                    app.comments.openDashboard();
                } else if (path === '/profile') {
                    app.views.switch('account', false);
                    app.views.loadAccount();
                } else if (path.startsWith('/user/')) {
                    const username = decodeURIComponent(path.split('/')[2]);
                    if (username) {
                        app.views.switch('account', false);
                        app.views.loadAccount(username);
                    } else app.views.loadHome();
                } else if (path === '/upload') {
                    document.title = 'ÄÄƒng táº£i áº£nh | VNBUSARCHIVE';
                    app.views.switch('upload', false);
                } else if (path === '/mobile-upload') {
                    document.title = 'Táº£i áº£nh tá»« thiáº¿t bá»‹ | VNBUSARCHIVE';
                    app.views.switch('mobile-upload', false);
                } else if (path === '/admin') {
                    document.title = 'Quáº£n trá»‹ há»‡ thá»‘ng | VNBUSARCHIVE';
                    app.views.switch('admin', false);
                    app.admin.refreshCounts();
                    app.admin.loadTab(app.adminTab);
                } else if (path === '/contact') {
                    app.views.loadContact();
                } else if (path === '/leaderboard') {
                    document.title = 'Báº£ng xáº¿p háº¡ng Ä‘Ã³ng gÃ³p | VNBUSARCHIVE';
                    app.views.switch('leaderboard', false);
                    app.leaderboard.load();
                } else if (path === '/help' || path === '/help/') {
                    app.help.loadList();
                } else if (path.startsWith('/help/')) {
                    const id = path.split('/')[2];
                    if (id) app.help.loadDetail(id);
                    else app.help.loadList();
                } else if (path.startsWith('/photo/')) {
                    const id = path.split('/')[2];
                    if (id) {
                        app.views.switch('detail', false);
                        app.views.loadDetail(id);
                    }
                } else if (path.startsWith('/vehicle/')) {
                    const plate = decodeURIComponent(path.split('/')[2]);
                    if (plate) {
                        app.views.switch('vehicle', false);
                        app.views.loadVehiclePage(plate);
                    } else app.views.loadHome();
                } else if (path.startsWith('/operator/')) {
                    const operatorName = decodeURIComponent(path.substring('/operator/'.length));
                    if (operatorName) {
                        app.views.switch('operator-view', false);
                        app.views.loadOperatorPage(operatorName);
                    } else app.views.loadHome();
                } else if (path.startsWith('/model/')) {
                    const modelName = decodeURIComponent(path.substring('/model/'.length));
                    if (modelName) {
                        app.views.switch('model-view', false);
                        app.model.loadModelPage(modelName);
                    } else app.views.loadHome();
                } else if (path.startsWith('/search')) {
                    document.title = 'TÃ¬m kiáº¿m | VNBUSARCHIVE';
                    const q = searchParams.get('q');
                    let filter = searchParams.get('filter') || 'all';

                    // Náº¿u gáº·p URL format cÅ© (cÃ²n lÆ°u láº¡i) thÃ¬ Ã©p chuyá»ƒn qua chuáº©n má»›i
                    if (filter === 'absolute_route') filter = 'route'; 

                    app.search.setFilter(filter, false);
                    if (filter === 'route') {
                        app.search.syncExactUI(searchParams.get('prefix') || '');
                    }

                    if (q) {
                        const decodedQ = decodeURIComponent(q);
                        const headerInp = document.getElementById('search-input');
                        const pageInp = document.getElementById('page-search-input');
                        if (headerInp) headerInp.value = decodedQ;
                        if (pageInp) pageInp.value = decodedQ;
                        app.views.switch('search', false);
                        app.handleSearch(false);
                    } else app.views.loadHome();
                } else {
                    app.views.switch('home', false);
                    app.views.loadHome();
                }

                app.utils.updateBreadcrumbs();
                
                // Tráº£ cáº£m giÃ¡c mÆ°á»£t mÃ : Báº¥t cháº¥p Database load lÃ¢u cá»¡ nÃ o, thanh Loading cháº¡y xong ngay sau khi Ä‘á»•i UI!
                setTimeout(() => {
                    app.loadingBar.finish();
                }, 150);
            }
});

Object.assign(window.app, {
  previousPath: '/'
});

Object.assign(window.app, {
  rawFile: null
});

Object.assign(window.app, {
  wmState: { x: 0.5, y: 0.5, color: 'white', scale: 1.0, mode: (typeof localStorage !== 'undefined' && localStorage.getItem('vnbus_wm_mode')) || 'basic' }
});

Object.assign(window.app, {
  vehicleLocked: false
});

Object.assign(window.app, {
  currentPlate: null
});

Object.assign(window.app, {
  currentPhoto: null
});

Object.assign(window.app, {
  currentVehicle: null
});

Object.assign(window.app, {
  adminTab: 'photos'
});

Object.assign(window.app, {
  loadedCount: 0
});

Object.assign(window.app, {
  uploadMap: null
});

Object.assign(window.app, {
  uploadMarker: null
});

Object.assign(window.app, {
  detailMap: null
});

Object.assign(window.app, {
  detailMarker: null
});

Object.assign(window.app, {
  currentExif: { camera: 'N/A', params: 'N/A' }
});

Object.assign(window.app, {
  searchTimeout: null
});

Object.assign(window.app, {
  currentFilter: 'all'
});

Object.assign(window.app, {
  alertCallback: null
});

Object.assign(window.app, {
  alertCancelCallback: null
});

Object.assign(window.app, {
  isReinitializing: false
});

Object.assign(window.app, {
  draggableInitialized: false
});

Object.assign(window.app, {
  suggestionTimeouts: {}
});

Object.assign(window.app, {
  suggestionControllers: {}
});

Object.assign(window.app, {
  currentSearchResults: []
});

Object.assign(window.app, {
  currentSearchCards: []
});

Object.assign(window.app, {
  loadedSearchCardsCount: 0
});

Object.assign(window.app, {
  PROFILE_PAGE_SIZE: 12
});

Object.assign(window.app, {
  profilePage: 1
});

Object.assign(window.app, {
  likedPage: 1
});

Object.assign(window.app, {
  currentProfileId: null
});

Object.assign(window.app, {
  _isOwnProfile: false
});

Object.assign(window.app, {
  reinitializeComponents: async () => {
                if (app.isReinitializing) return;
                app.isReinitializing = true;

                try {
                    if (app.uploadMap) {
                        setTimeout(() => app.uploadMap.invalidateSize(), 100);
                    }
                    if (app.detailMap) {
                        setTimeout(() => app.detailMap.invalidateSize(), 100);
                    }

                    if (document.getElementById('upload').classList.contains('active')) {
                        app.upload.initDraggable();
                    }

                    if (document.getElementById('admin').classList.contains('active')) {
                        app.admin.loadTab(app.adminTab);
                    }

                    if (app.suggestionTimeouts) {
                        Object.keys(app.suggestionTimeouts).forEach(key => clearTimeout(app.suggestionTimeouts[key]));
                    }
                    app.suggestionTimeouts = {};

                    if (app.suggestionControllers) {
                        Object.keys(app.suggestionControllers).forEach(key => {
                            if (app.suggestionControllers[key]) {
                                app.suggestionControllers[key].abort();
                            }
                        });
                    }
                    app.suggestionControllers = {};

                } catch (e) {
                    console.warn('Re-init warning:', e);
                } finally {
                    app.isReinitializing = false;
                }
            }
});

Object.assign(window.app, {
  searchRedirect: (query, filterType = 'all', prefix = '') => {
                let url = `/search?q=${encodeURIComponent(query)}&filter=${filterType}`;
                if (prefix) url += `&prefix=${encodeURIComponent(prefix)}`;
                app.utils.navigate(url);
            }
});

Object.assign(window.app, {
  notifications: { init: ()=>{}, add: async ()=>{} }
});

Object.assign(window.app, {
  settings: {

                search: (query, inputId = 'set-search-input-main', sugId = 'set-search-sug-main') => {
                    const box = document.getElementById(sugId);
                    if (!query.trim()) {
                        box.classList.remove('active');
                        return;
                    }

                    const keywords = [
                        { text: "TÃ¹y chá»‰nh há»“ sÆ¡", tab: "profile", parent: "account", icon: "fa-user-pen" },
                        { text: "Avatar", tab: "profile", parent: "account", icon: "fa-user-pen" },
                        { text: "Äá»•i tÃªn", tab: "profile", parent: "account", icon: "fa-user-pen" },
                        { text: "Báº£o máº­t", tab: "security", parent: "account", icon: "fa-shield-halved" },
                        { text: "Máº­t kháº©u", tab: "security", parent: "account", icon: "fa-shield-halved" },
                        { text: "Email", tab: "security", parent: "account", icon: "fa-shield-halved" },
                        { text: "MÃ£ Ä‘á»‹nh danh (UUID)", tab: "security", parent: "account", icon: "fa-shield-halved" },
                        { text: "LiÃªn káº¿t tÃ i khoáº£n", tab: "links", parent: "account", icon: "fa-link" },
                        { text: "Google", tab: "links", parent: "account", icon: "fa-link" },
                        { text: "Discord", tab: "links", parent: "account", icon: "fa-link" },
                        { text: "Huy hiá»‡u Discord", tab: "badges", parent: "main", icon: "fa-discord" },
                        { text: "Role", tab: "badges", parent: "main", icon: "fa-discord" },
                        { text: "CÃ¡ nhÃ¢n hÃ³a", tab: "preference", parent: "main", icon: "fa-layer-group" },
                        { text: "Xe buÃ½t", tab: "preference", parent: "main", icon: "fa-layer-group" },
                        { text: "Xe khÃ¡ch", tab: "preference", parent: "main", icon: "fa-layer-group" },
                        { text: "Gá»£i Ã½ thÃ´ng minh", tab: "preference", parent: "main", icon: "fa-layer-group" },
                        { text: "CÃ i Ä‘áº·t thÃ´ng bÃ¡o", tab: "notifications", parent: "account", icon: "fa-bell" },
                        { text: "Báº­t táº¯t thÃ´ng bÃ¡o", tab: "notifications", parent: "account", icon: "fa-bell" },
                        { text: "TÃ i liá»‡u", tab: "docs-intro", parent: "docs", icon: "fa-markdown" },
                        { text: "Giá»›i thiá»‡u há»‡ thá»‘ng", tab: "docs-intro", parent: "docs", icon: "fa-markdown" },
                        { text: "Quy Ä‘á»‹nh", tab: "docs-requirements", parent: "docs", icon: "fa-list-check" },
                        { text: "Kiá»ƒm duyá»‡t", tab: "docs-requirements", parent: "docs", icon: "fa-list-check" },
                        { text: "ChÃ­nh sÃ¡ch báº£o máº­t", tab: "docs-policy", parent: "docs", icon: "fa-shield" },
                        { text: "TiÃªu chuáº©n bÃ¬nh luáº­n", tab: "docs-chatrule", parent: "docs", icon: "fa-comments" },
                        { text: "Quy táº¯c bÃ¬nh luáº­n", tab: "docs-chatrule", parent: "docs", icon: "fa-comments" },
                        { text: "Chat rule", tab: "docs-chatrule", parent: "docs", icon: "fa-comments" }
                    ];

                    const lowerQ = app.utils.cleanText(query.toLowerCase());
                    const words = lowerQ.split(/\s+/);

                    const results = keywords.filter(k => {
                        const target = k.text.toLowerCase();
                        return words.every(w => target.includes(w));
                    });

                    if (results.length > 0) {
                        box.innerHTML = results.map(r => `
                            <div class="suggestion-item border-b border-gray-100 last:border-0 flex items-center gap-3 py-3"
                                 onmousedown="event.preventDefault(); app.settings.jumpTo('${r.tab}', '${r.parent}'); document.getElementById('${inputId}').value=''; document.getElementById('${sugId}').classList.remove('active');">
                                <div class="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-500 shrink-0"><i class="${r.icon.includes('discord') ? 'fa-brands' : 'fa-solid'} ${r.icon}"></i></div>
                                <div class="text-[13px] text-black font-medium leading-snug">${r.text}</div>
                            </div>
                        `).join('');
                        box.classList.add('active');
                    } else {
                        box.innerHTML = `<div class="p-4 text-xs text-gray-500 text-center"><i class="fa-solid fa-magnifying-glass mr-1"></i> KhÃ´ng tÃ¬m tháº¥y cÃ i Ä‘áº·t nÃ o phÃ¹ há»£p.</div>`;
                        box.classList.add('active');
                    }
                },

                jumpTo: (tab, parent) => {
                    app.settings.closeDocsMenu(true);
                    app.settings.closeAccountMenu(true);
                    app.settings.closeAccountMenu(true);

                    if (parent === 'account') app.settings.openAccountMenu();
                    if (parent === 'docs') app.settings.openDocsMenu();

                    app.settings.switchTab(tab);
                },

                openAccountMenu: () => {
                    const main = document.getElementById('set-menu-main');
                    const acc = document.getElementById('set-menu-account');

                    main.classList.add('hidden');
                    main.classList.remove('flex');
                    acc.classList.remove('hidden');
                    acc.classList.add('flex', 'slide-left-enter');
                    acc.classList.remove('slide-right-enter');

                    // app.settings.switchTab('profile');
                },

                closeAccountMenu: (instant = false) => {
                    const main = document.getElementById('set-menu-main');
                    const acc = document.getElementById('set-menu-account');

                    if (instant) {
                        acc.classList.add('hidden');
                        acc.classList.remove('flex', 'slide-left-enter', 'slide-right-enter');
                        main.classList.remove('hidden', 'slide-left-enter', 'slide-right-enter');
                        main.classList.add('flex');
                    } else {
                        acc.classList.add('hidden');
                        acc.classList.remove('flex');
                        main.classList.remove('hidden');
                        main.classList.add('flex', 'slide-right-enter');
                        main.classList.remove('slide-left-enter');
                        // Táº¯t tá»± Ä‘á»™ng nháº£y tab Ä‘á»ƒ ná»™i dung bÃªn pháº£i Ä‘á»™c láº­p vá»›i menu
            // app.settings.switchTab(app.user ? 'badges' : 'preference');
                    }
                },

                open: async (targetTab = null, targetParent = null) => {
                    const modal = document.getElementById('settings-modal');
                    const content = document.getElementById('settings-content');

                    app.ui.toggleUserMenu(false);

                    // Reset menu trÆ°á»£t vá» menu chÃ­nh
                    app.settings.closeDocsMenu(true);
                    app.settings.closeAccountMenu(true);

                    if (targetParent === 'account') app.settings.openAccountMenu();
                    else if (targetParent === 'docs') app.settings.openDocsMenu();

                    if (app.user) {
                        document.querySelectorAll('.account-only-btn').forEach(el => el.style.display = '');

                        if (app.user.email) {
                            const currentEmailEl = document.getElementById('set-current-email');
                            if (currentEmailEl) currentEmailEl.innerText = app.user.email;
                        }

                        app.settings.switchTab(targetTab || 'blank');
                        app.settings.loadIdentities();

                        const avatarImg = document.getElementById('set-avatar-img');
                        try {
                            const { data: profile } = await window.sb.from('profiles').select('avatar_url').eq('id', app.user.id).single();
                            if (profile && profile.avatar_url) {
                                const safeUrl = profile.avatar_url.replace(/"/g, '');
                                avatarImg.src = app.utils.getProxiedUrl(safeUrl, 'avatar.jpg', 'avatar');
                            } else {
                                avatarImg.src = DEFAULT_AVATAR;
                            }
                        } catch (e) {
                            avatarImg.src = app.user.user_metadata?.avatar_url ? app.utils.getProxiedUrl(app.user.user_metadata.avatar_url, 'avatar.jpg', 'avatar') : DEFAULT_AVATAR;
                        }
                        avatarImg.onerror = () => { avatarImg.src = DEFAULT_AVATAR; };
                    } else {
                        // KhÃ¡ch áº©n pháº§n TÃ i khoáº£n, má»Ÿ tháº³ng CÃ¡ nhÃ¢n hÃ³a
                        document.querySelectorAll('.account-only-btn').forEach(el => el.style.display = 'none');
                        app.settings.switchTab(targetTab || 'blank');
                        app.preference.updateUI();
                    }

                    modal.classList.remove('hidden');
                    app.ui.lockScroll();
                    setTimeout(() => {
                        content.classList.remove('opacity-0', 'scale-95');
                        content.classList.add('opacity-100', 'scale-100');
                    }, 10);
                },

                close: () => {
                    const modal = document.getElementById('settings-modal');
                    const content = document.getElementById('settings-content');
                    content.classList.remove('opacity-100', 'scale-100');
                    content.classList.add('opacity-0', 'scale-95');
                    setTimeout(() => {
                        modal.classList.add('hidden');
                        app.ui.unlockScroll();
                    }, 200);
                },

                openDocsMenu: () => {
                    const main = document.getElementById('set-menu-main');
                    const docs = document.getElementById('set-menu-docs');

                    main.classList.add('hidden');
                    main.classList.remove('flex');
                    docs.classList.remove('hidden');
                    docs.classList.add('flex', 'slide-left-enter');
                    docs.classList.remove('slide-right-enter');

                    // app.settings.switchTab('docs-intro');
                },

                closeDocsMenu: (instant = false) => {
                    const main = document.getElementById('set-menu-main');
                    const docs = document.getElementById('set-menu-docs');

                    if (instant) {
                        docs.classList.add('hidden');
                        docs.classList.remove('flex', 'slide-left-enter', 'slide-right-enter');
                        main.classList.remove('hidden', 'slide-left-enter', 'slide-right-enter');
                        main.classList.add('flex');
                    } else {
                        docs.classList.add('hidden');
                        docs.classList.remove('flex');
                        main.classList.remove('hidden');
                        main.classList.add('flex', 'slide-right-enter');
                        main.classList.remove('slide-left-enter');
                        // Táº¯t tá»± Ä‘á»™ng nháº£y tab Ä‘á»ƒ ná»™i dung bÃªn pháº£i Ä‘á»™c láº­p vá»›i menu
            // app.settings.switchTab(app.user ? 'badges' : 'preference');
                    }
                },

                switchTab: (tab) => {
                    const tabs = ['blank', 'profile', 'security', 'links', 'badges', 'preference', 'docs-intro', 'docs-requirements', 'docs-policy', 'docs-chatrule'];
                    const activeClasses = ['bg-black', 'text-white', 'border-black', 'shadow-sm'];
                    const inactiveClasses = ['bg-white', 'text-gray-600', 'hover:bg-gray-50', 'border-gray-200'];

                    tabs.forEach(t => {
                        const btn = document.getElementById('set-tab-' + t);
                        const content = document.getElementById('set-content-' + t);
                        if(!btn || !content) return;

                        if(t === tab) {
                            btn.classList.remove(...inactiveClasses);
                            btn.classList.add(...activeClasses);
                            content.classList.remove('hidden');
                            content.classList.add('block');

                            // Náº¿u lÃ  tab tÃ i liá»‡u thÃ¬ táº£i ná»™i dung
                            if (t.startsWith('docs-')) {
                                app.docs.fetchContent(t);
                            } else if (t === 'X') {

                            } else if (t === 'preference') {
                                app.preference.tempSelection = app.preference.current || 'both';
                                app.preference.tempShowRec = app.preference.showRecommendations; // FIX: Äá»“ng bá»™ Ä‘Ãºng tráº¡ng thÃ¡i
                                app.preference.updateUI();
                            }
                        } else {
                            btn.classList.remove(...activeClasses);
                            btn.classList.add(...inactiveClasses);
                            content.classList.add('hidden');
                            content.classList.remove('block');
                        }
                    });

                    if (tab === 'links') {
                        app.settings.loadIdentities();
                        if (app.settings.loadDiscordVerifyStatus) app.settings.loadDiscordVerifyStatus();
                    }
                    if (tab === 'badges') app.settings.loadBadges();
                },
                loadDiscordVerifyStatus: async () => {
                    const actionBtn = document.getElementById('discord-verify-action');
                    if (!actionBtn) return;
                    actionBtn.innerHTML = `<button disabled class="px-4 py-2 bg-gray-200 text-gray-400 text-xs font-bold rounded cursor-not-allowed border border-gray-300 whitespace-nowrap"><i class="fa-solid fa-spinner fa-spin"></i></button>`;
                    try {
                        const { data: { session } } = await window.sb.auth.getSession();
                        if (!session) return;
                        
                        const { count } = await window.sb.from('photos').select('*', { count: 'exact', head: true }).eq('uploader_id', app.user.id).eq('status', 'approved');
                        
                        const res = await fetch('/api/discord', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                            body: JSON.stringify({ action: 'status' })
                        });
                        const data = await res.json();
                        
                        if (!data.linked) {
                            actionBtn.innerHTML = `<button onclick="app.settings.jumpTo('badges', 'main')" class="px-4 py-2 bg-black text-white text-xs font-bold rounded hover:bg-gray-800 transition shadow-sm border border-black whitespace-nowrap">LiÃªn káº¿t Discord</button>`;
                            return;
                        }
                        if (!data.inServer) {
                            actionBtn.innerHTML = `<a href="https://discord.com/invite/BNWyqbuvwq" target="_blank" class="px-4 py-2 bg-[#5865F2] text-white text-xs font-bold rounded hover:bg-[#4752C4] transition shadow-sm border border-[#5865F2] whitespace-nowrap inline-block text-center">Tham gia Server</a>`;
                            return;
                        }
                        
                        const isClaimed = data.claimedRoles && data.claimedRoles.includes('1519296926477058203');
                        const isEligible = (count || 0) >= 1;
                        
                        if (isClaimed) {
                            actionBtn.innerHTML = `<button disabled class="px-4 py-2 bg-gray-100 text-gray-400 text-xs font-bold rounded cursor-not-allowed border border-gray-200 whitespace-nowrap"><i class="fa-solid fa-check mr-1"></i> ÄÃ£ xÃ¡c minh</button>`;
                        } else if (isEligible) {
                            actionBtn.innerHTML = `<button id="btn-claim-discord-1" onclick="app.settings.claimDiscordVerify()" class="px-4 py-2 bg-black text-white text-xs font-bold rounded hover:bg-gray-800 transition shadow-sm border border-black whitespace-nowrap">XÃ¡c minh ngay</button>`;
                        } else {
                            actionBtn.innerHTML = `<button disabled class="px-4 py-2 bg-gray-50 text-gray-400 text-xs font-bold rounded cursor-not-allowed border border-gray-200 whitespace-nowrap"><i class="fa-solid fa-lock mr-1"></i> ChÆ°a Ä‘á»§ Ä‘/k</button>`;
                        }
                    } catch (err) {
                        actionBtn.innerHTML = `<p class="text-xs text-red-500">Lá»—i: ${err.message}</p>`;
                    }
                },
                claimDiscordVerify: async () => {
                    const btn = document.getElementById('btn-claim-discord-1');
                    if (btn) btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;
                    try {
                        const { data: { session } } = await window.sb.auth.getSession();
                        const res = await fetch('/api/discord', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                            body: JSON.stringify({ action: 'claim', tier: 1 })
                        });
                        const data = await res.json();
                        if (res.ok) {
                            app.ui.showAlert(data.message || 'XÃ¡c minh Discord thÃ nh cÃ´ng!');
                            app.settings.loadDiscordVerifyStatus();
                        } else {
                            app.ui.showAlert(data.error || 'Lá»—i xÃ¡c minh.');
                            app.settings.loadDiscordVerifyStatus();
                        }
                    } catch (err) {
                        app.ui.showAlert('Lá»—i: ' + err.message);
                        app.settings.loadDiscordVerifyStatus();
                    }
                },
                loadIdentities: async () => {
                    const container = document.getElementById('linked-accounts-container');
                    if(!app.user) return;

                    try {
                        const { data: { user }, error } = await window.sb.auth.getUser();
                        if (error || !user) throw error;

                        const identities = user.identities || [];
                        const providers = identities.map(id => id.provider);

                        const renderProvider = (name, iconClass, colorClass, providerKey) => {
                            const isLinked = providers.includes(providerKey);
                            const identity = identities.find(id => id.provider === providerKey);
                            const identityId = identity ? identity.identity_id : null;

                            return `
                            <div class="flex flex-col sm:flex-row sm:items-center justify-between p-3 border border-gray-200 rounded-md bg-gray-50 gap-3">
                                <div class="flex items-center gap-3">
                                    <div class="w-8 h-8 rounded-full ${colorClass} text-white flex items-center justify-center text-lg shadow-sm shrink-0">
                                        <i class="${iconClass}"></i>
                                    </div>
                                    <div>
                                        <p class="font-bold text-sm text-gray-800">${name}</p>
                                        <p class="text-[10px] ${isLinked ? 'text-green-600 font-bold' : 'text-gray-500'}">${isLinked ? '<i class="fa-solid fa-check mr-1"></i> ÄÃ£ liÃªn káº¿t' : 'ChÆ°a liÃªn káº¿t'}</p>
                                    </div>
                                </div>
                                <div>
                                    ${isLinked
                                        ? `<button onclick="app.settings.unlinkIdentity('${identityId}', '${name}')" class="w-full sm:w-auto text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-4 py-2 rounded-md hover:bg-red-100 transition shadow-sm">Há»§y liÃªn káº¿t</button>`
                                        : `<button onclick="app.settings.linkIdentity('${providerKey}')" class="w-full sm:w-auto text-xs font-bold text-black bg-white border border-black px-4 py-2 rounded-md hover:bg-gray-100 transition shadow-sm">ThÃªm liÃªn káº¿t</button>`
                                    }
                                </div>
                            </div>
                            `;
                        };

                        container.innerHTML =
                            renderProvider('Google', 'fa-brands fa-google', 'bg-red-500', 'google') +
                            renderProvider('Discord', 'fa-brands fa-discord', 'bg-[#5865F2]', 'discord');

                    } catch (err) {
                        container.innerHTML = `<p class="text-xs text-red-500">Lá»—i láº¥y thÃ´ng tin liÃªn káº¿t: ${err.message}</p>`;
                    }
                },
                linkIdentity: async (provider) => {
                    try {
                        const { error } = await window.sb.auth.linkIdentity({
                            provider: provider,
                            options: { redirectTo: window.location.origin }
                        });
                        if (error) throw error;
                    } catch (err) {
                        app.ui.showAlert("Lá»—i liÃªn káº¿t: " + err.message);
                    }
                },
                unlinkIdentity: async (identityId, providerName) => {
                    app.ui.showAlert(
                        `Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n há»§y liÃªn káº¿t tÃ i khoáº£n ${providerName}? Báº¡n sáº½ khÃ´ng thá»ƒ Ä‘Äƒng nháº­p báº±ng ná»n táº£ng nÃ y ná»¯a.`,
                        async () => {
                            try {
                                const { error } = await window.sb.auth.unlinkIdentity({ identity_id: identityId });
                                if (error) throw error;

                                app.ui.showAlert(`ÄÃ£ há»§y liÃªn káº¿t vá»›i ${providerName} thÃ nh cÃ´ng!`);
                                app.settings.loadIdentities();
                            } catch (err) {
                                app.ui.showAlert("Lá»—i há»§y liÃªn káº¿t: " + err.message);
                            }
                        },
                        () => {},
                        { btnOkText: "Há»§y liÃªn káº¿t", btnCancelText: "ÄÃ³ng", title: "XÃ¡c nháº­n" }
                    );
                },
                loadBadges: async () => {
                    const loading = document.getElementById('badge-loading');
                    const reqBox = document.getElementById('badge-requirements');
                    const claimBox = document.getElementById('badge-claim-list');

                    loading.classList.remove('hidden');
                    reqBox.classList.add('hidden');
                    claimBox.classList.add('hidden');

                    try {
                        const { data: { session } } = await window.sb.auth.getSession();
                        const token = session?.access_token;
                        if (!token) throw new Error("ChÆ°a Ä‘Äƒng nháº­p");

                        const res = await fetch('/api/discord', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ action: 'status' })
                        });
                        const data = await res.json();

                        if (!data.linked || !data.inServer) {
                            loading.classList.add('hidden');
                            reqBox.classList.remove('hidden');

                            const reqLinkContainer = document.getElementById('req-link-container');
                            const reqLinkStatus = document.getElementById('req-link-status');
                            const reqLinkAction = document.getElementById('req-link-action');

                            const reqServerContainer = document.getElementById('req-server-container');
                            const reqServerStatus = document.getElementById('req-server-status');
                            const reqServerAction = document.getElementById('req-server-action');

                            const incompleteClasses = ['bg-red-50', 'border', 'border-red-200'];
                            const completeClasses = ['bg-green-50', 'border', 'border-green-200'];

                            if (data.linked) {
                                reqLinkContainer.classList.add(...completeClasses);
                                reqLinkContainer.classList.remove(...incompleteClasses);
                                reqLinkStatus.className = 'flex items-center gap-3 text-sm font-medium text-green-800';
                                reqLinkStatus.innerHTML = `<i class="fa-solid fa-check-circle w-5 text-center text-green-600"></i> <span>ÄÃ£ liÃªn káº¿t tÃ i khoáº£n Discord</span>`;
                                reqLinkAction.classList.add('hidden');
                            } else {
                                reqLinkContainer.classList.add(...incompleteClasses);
                                reqLinkContainer.classList.remove(...completeClasses);
                                reqLinkStatus.className = 'flex items-center gap-3 text-sm font-medium text-red-800';
                                reqLinkStatus.innerHTML = `<i class="fa-solid fa-times-circle w-5 text-center text-red-600"></i> <span>ChÆ°a liÃªn káº¿t tÃ i khoáº£n Discord</span>`;
                                reqLinkAction.classList.remove('hidden');
                            }

                            if (data.inServer) {
                                reqServerContainer.classList.add(...completeClasses);
                                reqServerContainer.classList.remove(...incompleteClasses);
                                reqServerStatus.className = 'flex items-center gap-3 text-sm font-medium text-green-800';
                                reqServerStatus.innerHTML = `<i class="fa-solid fa-check-circle w-5 text-center text-green-600"></i> <span>ÄÃ£ tham gia Server</span>`;
                                reqServerAction.classList.add('hidden');
                            } else {
                                reqServerContainer.classList.add(...incompleteClasses);
                                reqServerContainer.classList.remove(...completeClasses);
                                reqServerStatus.className = 'flex items-center gap-3 text-sm font-medium text-red-800';
                                reqServerStatus.innerHTML = `<i class="fa-solid fa-times-circle w-5 text-center text-red-600"></i> <span>ChÆ°a tham gia Server VNBUSARCHIVE</span>`;
                                reqServerAction.classList.remove('hidden');
                            }
                            return;
                        }

                        const { count } = await window.sb.from('photos')
                            .select('*', { count: 'exact', head: true })
                            .eq('uploader_id', app.user.id)
                            .eq('status', 'approved');

                        document.getElementById('badge-photo-count').innerText = count || 0;

const ROLE_MAP_FRONTEND = {
    50: '1506239795175620728',
    100: '1505158627747561482',
    200: '1505158752372920320',
    500: '1505158986725462078',
    1000: '1505159111686488164'
};

const tiers = [50, 100, 200, 500, 1000, 1500];
const grid = document.getElementById('badges-grid');

grid.innerHTML = tiers.map(tier => {
    if (tier === 1500) {
        const hasCustomRole = !!data.customRoleId;
        const isEligible = (count || 0) >= 1500;
        let btnHtml = '';

        if (hasCustomRole) {
            btnHtml = `<button onclick="app.settings.openCustomRolePrompt()" class="px-4 py-2 bg-gray-100 text-gray-800 text-xs font-bold rounded border border-gray-300 hover:bg-gray-200 transition whitespace-nowrap"><i class="fa-solid fa-pen mr-1"></i> Sá»­a Role</button>`;
        } else if (isEligible) {
            btnHtml = `<button onclick="app.settings.openCustomRolePrompt()" class="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded hover:opacity-90 transition shadow-sm border border-transparent whitespace-nowrap">Táº¡o Role RiÃªng</button>`;
        } else {
            btnHtml = `<button disabled class="px-4 py-2 bg-gray-50 text-gray-400 text-xs font-bold rounded cursor-not-allowed border border-gray-200 whitespace-nowrap"><i class="fa-solid fa-lock mr-1"></i> ChÆ°a Ä‘á»§ Ä‘/k</button>`;
        }

        return `
        <div class="flex items-center justify-between p-3 border border-purple-200 rounded-md bg-purple-50">
            <div class="flex items-center gap-3 overflow-hidden">
                <div class="w-10 h-10 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center text-lg text-purple-600 shrink-0">
                    <i class="fa-solid fa-wand-magic-sparkles"></i>
                </div>
                <div class="overflow-hidden">
                    <p class="font-bold text-sm text-purple-900 truncate">Cá»™t má»‘c 1500 áº£nh (TÃ¹y chá»‰nh)</p>
                    <p class="text-[10px] text-purple-700">Äáº·c quyá»n táº¡o Role Custom riÃªng biá»‡t.</p>
                </div>
            </div>
            <div>${btnHtml}</div>
        </div>`;
    }

    const roleId = ROLE_MAP_FRONTEND[tier];
    const isClaimed = data.claimedRoles.includes(roleId);
    const isEligible = (count || 0) >= tier;

    let btnHtml = '';
    if (isClaimed) {
        btnHtml = `<button disabled class="px-4 py-2 bg-gray-100 text-gray-400 text-xs font-bold rounded cursor-not-allowed border border-gray-200 whitespace-nowrap"><i class="fa-solid fa-check mr-1"></i> ÄÃ£ nháº­n</button>`;
    } else if (isEligible) {
        btnHtml = `<button id="btn-claim-${tier}" onclick="app.settings.claimBadge(${tier})" class="px-4 py-2 bg-black text-white text-xs font-bold rounded hover:bg-gray-800 transition shadow-sm border border-black whitespace-nowrap">Nháº­n Role</button>`;
    } else {
        btnHtml = `<button disabled class="px-4 py-2 bg-gray-50 text-gray-400 text-xs font-bold rounded cursor-not-allowed border border-gray-200 whitespace-nowrap"><i class="fa-solid fa-lock mr-1"></i> ChÆ°a Ä‘á»§ Ä‘/k</button>`;
    }

    return `
    <div class="flex items-center justify-between p-3 border border-gray-200 rounded-md bg-white">
        <div class="flex items-center gap-3 overflow-hidden">
            <div class="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-lg text-black shrink-0">
                <i class="fa-solid fa-medal"></i>
            </div>
            <div class="overflow-hidden">
                <p class="font-bold text-sm text-gray-800 truncate">Cá»™t má»‘c ${tier} áº£nh</p>
                <p class="text-[10px] text-gray-500">YÃªu cáº§u: ÄÃ³ng gÃ³p ${tier}+ áº£nh Ä‘Æ°á»£c duyá»‡t.</p>
            </div>
        </div>
        <div>${btnHtml}</div>
    </div>`;
}).join('');

                        loading.classList.add('hidden');
                        claimBox.classList.remove('hidden');

                    } catch (err) {
                        loading.innerHTML = `<span class="text-red-500"><i class="fa-solid fa-triangle-exclamation"></i> Lá»—i: ${err.message}</span>`;
                    }
                },

                claimBadge: async (tier) => {
                    const btn = document.getElementById(`btn-claim-${tier}`);
                    const originalText = btn.innerHTML;
                    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                    btn.disabled = true;

                    try {
                        const { data: { session } } = await window.sb.auth.getSession();
                        const token = session?.access_token;

                        const res = await fetch('/api/discord', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ action: 'claim', tier: tier })
                        });

                        const data = await res.json();

                        if (!res.ok) throw new Error(data.error || 'Lá»—i khÃ´ng xÃ¡c Ä‘á»‹nh');

                        app.toast.show('success', 'ThÃ nh cÃ´ng', data.message || "ÄÃ£ nháº­n Role thÃ nh cÃ´ng!");
                        app.settings.loadBadges();

                    } catch (err) {
                        app.ui.showAlert("Lá»—i: " + err.message);
                        btn.innerHTML = originalText;
                        btn.disabled = false;
                    }
}
                }
});

Object.assign(window.app, {
  openCustomRolePrompt: () => {
                    const modal = document.getElementById('custom-role-modal');
                    const content = document.getElementById('custom-role-content');
                    const okBtn = document.getElementById('cr-ok-btn');

                    app.ui.lockScroll();

                    okBtn.onclick = async () => {
                        const name = document.getElementById('cr-name-input').value.trim();
                        const color = document.getElementById('cr-color-input').value.trim();

                        if (!name || name.length < 2) return app.ui.showAlert("TÃªn Role pháº£i tá»« 2 kÃ½ tá»± trá»Ÿ lÃªn!");
                        if (!color.match(/^#[0-9A-Fa-f]{6}$/)) return app.ui.showAlert("MÃ£ mÃ u Hex khÃ´ng há»£p lá»‡!");

                        const originalText = okBtn.innerHTML;
                        okBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                        okBtn.disabled = true;

                        try {
                            const { data: { session } } = await window.sb.auth.getSession();
                            const token = session?.access_token;

                            const res = await fetch('/api/discord', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                body: JSON.stringify({ action: 'claim', tier: 1500, customName: name, customColor: color })
                            });

                            const data = await res.json();
                            if (!res.ok) throw new Error(data.error || 'Lá»—i khÃ´ng xÃ¡c Ä‘á»‹nh');

                            app.ui.closeCustomRolePrompt();
                            app.toast.show('success', 'ThÃ nh cÃ´ng', data.message || "Táº¡o/Sá»­a Role thÃ nh cÃ´ng!");
                            app.settings.loadBadges();
                        } catch (err) {
                            app.ui.showAlert("Lá»—i: " + err.message);
                        } finally {
                            okBtn.innerHTML = originalText;
                            okBtn.disabled = false;
                        }
                    };

                    modal.classList.remove('hidden');
                    content.classList.remove('modal-content-leave');
                    content.classList.add('modal-content-enter');
                }
});

Object.assign(window.app, {
  docs: {
                open: () => {
                    app.settings.open();
                    app.settings.openDocsMenu();
                },
                close: () => {
                },
                fetchContent: async (tab) => {
                    const container = document.getElementById('set-content-' + tab);
                    if (!container || container.dataset.loaded === 'true') return;

                    const url = container.dataset.url;
                    try {
                        const res = await fetch(url);
                        if (!res.ok) throw new Error('Lá»—i máº¡ng');
                        const text = await res.text();

                        const html = DOMPurify.sanitize(marked.parse(text));
                        container.innerHTML = html;
                        container.dataset.loaded = 'true';
                    } catch (e) {
                        container.innerHTML = `
                            <p class="text-red-500 font-bold py-4 text-center"><i class="fa-solid fa-triangle-exclamation"></i> KhÃ´ng thá»ƒ táº£i ná»™i dung tá»± Ä‘á»™ng.</p>
                            <div class="text-center mt-2">
                                <a href="${url.replace('raw.githubusercontent.com/hoyuuna', 'github.com/hoyuuna').replace('/refs/heads/', '/blob/')}" target="_blank" class="inline-flex items-center gap-1.5 bg-black text-white px-4 py-2 rounded-md font-bold hover:bg-gray-800 transition text-[11px] uppercase">
                                    <i class="fa-brands fa-github text-sm"></i> Xem trá»±c tiáº¿p trÃªn GitHub
                                </a>
                            </div>
                        `;
                    }
                }
            }
});

Object.assign(window.app, {
  handleSearch: async (forceRefresh = false, sourceInputId = null) => {
                const headerInput = document.getElementById('search-input');
                const pageInput = document.getElementById('page-search-input');

                const activeId = sourceInputId || document.activeElement?.id;
                let query = '';
                if (activeId === 'search-input' && headerInput) {
                    query = headerInput.value.trim();
                    if (pageInput) pageInput.value = query;
                } else if (activeId === 'page-search-input' && pageInput) {
                    query = pageInput.value.trim();
                    if (headerInput) headerInput.value = query;
                } else if (app.currentViewMode === 'search' && pageInput) {
                    query = pageInput.value.trim();
                    if (headerInput) headerInput.value = query;
                } else {
                    query = headerInput ? headerInput.value.trim() : '';
                    if (pageInput) pageInput.value = query;
                }

                // Nháº­n diá»‡n tá»± Ä‘á»™ng chuá»—i gÃµ báº±ng tay: vÃ­ dá»¥ "01 (HÃ  Ná»™i)"
                let autoPrefix = null;
                const provMatch = query.match(/^(.*?)\s*\((.+?)\)$/);
                if (provMatch) {
                    const extractedRoute = provMatch[1].trim();
                    const extractedProvName = provMatch[2].trim();

                    if (app.utils.provinceData && app.utils.provinceData.length) {
                        const prov = app.utils.provinceData.find(p => p.ten.toLowerCase() === extractedProvName.toLowerCase());
                        if (prov && prov.ky_hieu) {
                            autoPrefix = Array.isArray(prov.ky_hieu) ? String(prov.ky_hieu[0]).trim() : String(prov.ky_hieu).split(',')[0].trim();
                            query = extractedRoute;
                            headerInput.value = query;
                            if (pageInput) pageInput.value = query;
                            
                            app.currentFilter = 'route';
                            app.search.syncExactUI(autoPrefix); // Äá»“ng bá»™ UI Dropdown má»›i
                        }
                    }
                }

                const clearBtn = document.getElementById('btn-clear-search');
                const pageClearBtn = document.getElementById('btn-page-clear-search');
                const filterType = app.currentFilter;

                const hasProvinceFilter = Boolean(app.search?.currentExactPrefix || app.search?.currentExactProvName);
                if (!query && !hasProvinceFilter) {
                    if (clearBtn) clearBtn.classList.add('hidden');
                    if (pageClearBtn) pageClearBtn.classList.add('hidden');
                    if (window.location.pathname !== '/') app.utils.navigate('/');
                    return app.views.loadHome();
                } else {
                    if (clearBtn) clearBtn.classList.toggle('hidden', !query && !hasProvinceFilter);
                    if (pageClearBtn) pageClearBtn.classList.toggle('hidden', !query && !hasProvinceFilter);
                }

                const currentParams = new URLSearchParams(window.location.search);
                let filterFromUrl = currentParams.get('filter') || 'all';

                // Bá» qua legacy cá»§a URL cÅ©
                if (filterFromUrl === 'absolute_route') filterFromUrl = 'route';

                let prefixToUrl = typeof app.search.currentExactPrefix === 'string' ? app.search.currentExactPrefix : (currentParams.get('prefix') || '');
                if (filterType !== 'route') prefixToUrl = ''; // Chá»‰ Ã¡p dá»¥ng prefix cho route

                const currentUrlPrefix = currentParams.get('prefix') || '';

                if (!window.location.pathname.includes('/search') || currentParams.get('q') !== query || filterFromUrl !== filterType || currentUrlPrefix !== prefixToUrl) {
                    let url = `/search?q=${encodeURIComponent(query)}&filter=${filterType}`;
                    if (prefixToUrl) url += `&prefix=${encodeURIComponent(prefixToUrl)}`;
                    app.utils.navigate(url);
                    return;
                }

                if (app.lastSearchQuery === query && app.lastSearchFilter === filterType && app.lastSearchPrefix === prefixToUrl && !forceRefresh) {
                    app.views.switch('search', false);
                    app.loadingBar.finish();
                    return;
                }
                app.lastSearchQuery = query;
                app.lastSearchFilter = filterType;
                app.lastSearchPrefix = prefixToUrl;
                
                const currentSearchToken = Date.now();
                app.searchToken = currentSearchToken;

                let recents = JSON.parse(localStorage.getItem('vnbus_recent_searches') || '[]');
                recents = recents.filter(r => r.query !== query);
                recents.unshift({ query, filter: filterType, prefix: prefixToUrl });
                if (recents.length > 5) recents.pop();
                localStorage.setItem('vnbus_recent_searches', JSON.stringify(recents));

                app.views.switch('search', false);
                app.currentViewMode = 'search';
                document.title = 'TÃ¬m kiáº¿m | VNBUSARCHIVE';

                const profileCardsContainer = document.getElementById('search-profile-cards');
                profileCardsContainer.innerHTML = '';
                profileCardsContainer.classList.add('hidden');
                document.getElementById('load-more-cards-container')?.classList.add('hidden');
                app.currentSearchCards =[];
                app.loadedSearchCardsCount = 0;

                const grid = document.getElementById('search-photo-grid');
                grid.innerHTML = '<div class="col-span-full text-center py-10 text-gray-500"><i class="fa-solid fa-circle-notch fa-spin"></i> Äang tÃ¬m kiáº¿m...</div>';

                try {
                    const isIdSearch = query.match(/\/photo\/(\d+)/i) || (filterType === 'all' ? query.match(/^#(\d+)$/) : null);
                    if (isIdSearch) {
                        app.loadingBar.finish();
                        app.utils.navigate(`/photo/${isIdSearch[1]}`);
                        return;
                    }

                    // TÃ¡i sá»­ dá»¥ng logic láº¥y card nhÆ° cÅ© (chá»‰ sá»­a tÃªn filter)
                    let uploaderCards = [], operatorCards = [], modelCards = [], plateCards = [];
                    let normalizedQuery = query.toLowerCase().replace(/vin bus/g, 'vinbus').replace(/thanh buoi/g, 'thÃ nh bÆ°á»Ÿi').replace(/phuong trang/g, 'phÆ°Æ¡ng trang');
                    const searchWords = normalizedQuery.trim().split(/\s+/).filter(w => w.length > 0);
                    const cardPromises = [];

                    // 1. Láº¤Y UPLOADER
                    if (filterType === 'uploader' || filterType === 'all') {
                        cardPromises.push((async () => {
                            try {
                                let uQuery = window.sb.from('profiles').select('id, username, avatar_url, role, subroles, ban_status');
                                searchWords.forEach(w => { uQuery = uQuery.ilike('username', `%${w}%`); });
                                const { data: usersData } = await uQuery.limit(5);

                                if (usersData && usersData.length > 0) {
                                    for (const user of usersData) {
                                        const uDisplay = app.utils.formatProfileDisplay(user);
                                        if (uDisplay.isBanned) continue; // áº¨n hoÃ n toÃ n ngÆ°á»i dÃ¹ng bá»‹ cáº¥m khá»i search

                                        const { count } = await window.sb.from('photos').select('*', { count: 'exact', head: true }).eq('uploader_id', user.id).eq('status', 'approved');
                                        const avatarSrc = uDisplay.avatar;
                                        const userBadges = app.utils.getBadgesHTML(user.id, user.role, user.subroles);
                                        uploaderCards.push(`
                                            <div class="bg-white border border-gray-200 rounded-md p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition" onclick="app.views.loadUserProfile('${uDisplay.linkId}')">
                                                <img src="${avatarSrc}" onerror="this.onerror=null;this.src='${DEFAULT_AVATAR}';" class="w-12 h-12 rounded-full object-cover bg-gray-100 shrink-0">
                                                <div class="overflow-hidden">
                                                    <div class="font-bold text-black text-sm flex items-center truncate">${uDisplay.username} ${userBadges}</div>
                                                    <div class="text-xs text-gray-500">${count || 0} áº£nh Ä‘Ã£ Ä‘Äƒng</div>
                                                </div>
                                            </div>
                                        `);
                                    }
                                }
                            } catch (e) { console.error("Lá»—i tÃ¬m Uploader:", e); }
                        })());
                    }

                    // 2. Láº¤Y ÄÆ N Vá»Š Váº¬N HÃ€NH
                    if (filterType === 'operator' || filterType === 'all') {
                        cardPromises.push((async () => {
                            try {
                                let opInfoQuery = window.sb.from('operator_info').select('operator_name, logo_url, description');
                                let opPhotoQuery = window.sb.from('photos').select('operator').eq('status', 'approved');
                                
                                searchWords.forEach(w => { 
                                    opInfoQuery = opInfoQuery.ilike('operator_name', `%${w}%`); 
                                    opPhotoQuery = opPhotoQuery.ilike('operator', `%${w}%`); 
                                });

                                const [infoRes, photoRes] = await Promise.all([
                                    opInfoQuery.limit(10),
                                    opPhotoQuery.limit(50)
                                ]);

                                let uniqueOpsMap = new Map();
                                const opInfoMap = {};

                                // CHá»ˆ láº¥y Ä‘Æ¡n vá»‹ tá»« áº£nh Ä‘Ã£ duyá»‡t (nguá»“n duy nháº¥t Ä‘á»§ Ä‘iá»u kiá»‡n hiá»ƒn thá»‹)
                                if (photoRes.data) {
                                    photoRes.data.forEach(p => {
                                        if (p.operator) {
                                            const key = p.operator.toLowerCase();
                                            if (!uniqueOpsMap.has(key)) {
                                                uniqueOpsMap.set(key, p.operator);
                                            }
                                        }
                                    });
                                }

                                // ÄÆ¡n vá»‹ cÃ³ logo/thÃ´ng tin nhÆ°ng KHÃ”NG cÃ³ áº£nh duyá»‡t nÃ o sáº½ bá»‹ áº©n
                                if (infoRes.data) {
                                    infoRes.data.forEach(info => {
                                        if (info.operator_name) {
                                            opInfoMap[info.operator_name.toLowerCase()] = info;
                                        }
                                    });
                                }

                                const finalOps = Array.from(uniqueOpsMap.values()).slice(0, 4);

                                const missingInfos = finalOps.filter(op => !opInfoMap[op.toLowerCase()]);
                                if (missingInfos.length > 0) {
                                    const { data: extraInfos } = await window.sb.from('operator_info').select('operator_name, logo_url, description').in('operator_name', missingInfos);
                                    if (extraInfos) {
                                        extraInfos.forEach(info => { opInfoMap[info.operator_name.toLowerCase()] = info; });
                                    }
                                }

                                for (const op of finalOps) {
                                    const info = opInfoMap[op.toLowerCase()] || {};
                                    const logo = info.logo_url ? app.utils.escapeAttr(info.logo_url.includes('wsrv.nl') ? info.logo_url : 'https://wsrv.nl/?url=' + encodeURIComponent(info.logo_url)) : '';
                                    
                                    const iconHtml = logo 
                                        ? `<img src="${logo}" class="w-12 h-12 object-contain shrink-0" onerror="this.outerHTML='<div class=&quot;w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl shrink-0&quot;><i class=&quot;fa-solid fa-building&quot;></i></div>';">` 
                                        : `<div class="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl shrink-0"><i class="fa-solid fa-building"></i></div>`;

                                    operatorCards.push(`
                                        <div class="bg-white border border-gray-200 rounded-md p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition" onclick="app.views.loadOperatorPage('${app.utils.escapeAttr(op)}')">
                                            ${iconHtml}
                                            <div class="overflow-hidden min-w-0 flex-1">
                                                <div class="font-bold text-black text-sm overflow-x-auto whitespace-nowrap no-scrollbar">${app.utils.cleanText(op)}</div>
                                                <div class="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5 font-bold">ÄÆ¡n vá»‹ váº­n hÃ nh</div>
                                            </div>
                                        </div>
                                    `);
                                }
                            } catch (e) { console.error("Lá»—i tÃ¬m ÄÆ¡n vá»‹:", e); }
                        })());
                    }

                    // 3. Láº¤Y DÃ’NG XE (MODEL)
                    if (filterType === 'model' || filterType === 'all') {
                        cardPromises.push((async () => {
                            try {
                                let mdlInfoQuery = window.sb.from('model_info').select('model_name, logo_url, description');
                                let mdlVehicleQuery = window.sb.from('vehicles').select('model, photos!inner(status)').eq('photos.status', 'approved');
                                
                                searchWords.forEach(w => { 
                                    mdlInfoQuery = mdlInfoQuery.ilike('model_name', `%${w}%`); 
                                    mdlVehicleQuery = mdlVehicleQuery.ilike('model', `%${w}%`); 
                                });

                                const [infoRes, vehicleRes] = await Promise.all([
                                    mdlInfoQuery.limit(10),
                                    mdlVehicleQuery.limit(50)
                                ]);

                                let uniqueModelsMap = new Map();
                                const mdlInfoMap = {};

                                if (infoRes.data) {
                                    infoRes.data.forEach(info => {
                                        if (info.model_name) {
                                            const key = info.model_name.toLowerCase();
                                            mdlInfoMap[key] = info;
                                        }
                                    });
                                }

                                if (vehicleRes.data) {
                                    vehicleRes.data.forEach(v => {
                                        if (v.model) {
                                            const key = v.model.toLowerCase();
                                            if (!uniqueModelsMap.has(key)) {
                                                const matchedName = mdlInfoMap[key] ? mdlInfoMap[key].model_name : v.model;
                                                uniqueModelsMap.set(key, matchedName);
                                            }
                                        }
                                    });
                                }

                                const finalModels = Array.from(uniqueModelsMap.values()).slice(0, 4);

                                const missingInfos = finalModels.filter(m => !mdlInfoMap[m.toLowerCase()]);
                                if (missingInfos.length > 0) {
                                    const { data: extraInfos } = await window.sb.from('model_info').select('model_name, logo_url, description').in('model_name', missingInfos);
                                    if (extraInfos) {
                                        extraInfos.forEach(info => { mdlInfoMap[info.model_name.toLowerCase()] = info; });
                                    }
                                }

                                for (const m of finalModels) {
                                    const info = mdlInfoMap[m.toLowerCase()] || {};
                                    let logo = info.logo_url ? app.utils.escapeAttr(info.logo_url.includes('wsrv.nl') ? info.logo_url : 'https://wsrv.nl/?url=' + encodeURIComponent(info.logo_url)) : '';
                                    
                                    if (!logo) {
                                        const brandName = m.split(' ')[0];
                                        const { data: brandLogoData } = await window.sb.from('model_info')
                                            .select('logo_url')
                                            .ilike('model_name', `${brandName}%`)
                                            .not('logo_url', 'is', null)
                                            .limit(1)
                                            .maybeSingle();
                                        if (brandLogoData && brandLogoData.logo_url) {
                                            logo = app.utils.escapeAttr(brandLogoData.logo_url.includes('wsrv.nl') ? brandLogoData.logo_url : 'https://wsrv.nl/?url=' + encodeURIComponent(brandLogoData.logo_url));
                                        }
                                    }

                                    const iconHtml = logo 
                                        ? `<img src="${logo}" class="w-12 h-12 object-contain shrink-0" onerror="this.outerHTML='<div class=&quot;w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl shrink-0&quot;><i class=&quot;fa-solid fa-layer-group&quot;></i></div>';">` 
                                        : `<div class="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl shrink-0"><i class="fa-solid fa-layer-group"></i></div>`;

                                    modelCards.push(`
                                        <div class="bg-white border border-gray-200 rounded-md p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition" onclick="app.model.loadModelPage('${app.utils.escapeAttr(m)}')">
                                            ${iconHtml}
                                            <div class="overflow-hidden min-w-0 flex-1">
                                                <div class="font-bold text-black text-sm overflow-x-auto whitespace-nowrap no-scrollbar">${app.utils.cleanText(m)}</div>
                                                <div class="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5 font-bold">DÃ²ng xe</div>
                                            </div>
                                        </div>
                                    `);
                                }
                            } catch (e) { console.error("Lá»—i tÃ¬m DÃ²ng xe:", e); }
                        })());
                    }

                    // 4. Láº¤Y XE (VEHICLE / PLATE)
                    if (filterType === 'plate' || filterType === 'model' || filterType === 'all') {
                        cardPromises.push((async () => {
                            try {
                                let selectStr = app.preference.current !== 'both' ? '*, photos!inner(type, status)' : '*, photos!inner(status)';
                                let vQuery = window.sb.from('vehicles').select(selectStr).eq('photos.status', 'approved').limit(10);
                                if (filterType === 'plate') {
                                    searchWords.forEach(w => { vQuery = vQuery.ilike('license_plate', `%${app.utils.normalizePlateQuery(w)}%`); });
                                } else if (filterType === 'model') {
                                    searchWords.forEach(w => { vQuery = vQuery.ilike('model', `%${w}%`); });
                                } else {
                                    searchWords.forEach(w => {
                                        const safeW = w.replace(/"/g, '');
                                        const safeWPlate = app.utils.normalizePlateQuery(safeW);
                                        if (safeWPlate) vQuery = vQuery.or(`license_plate.ilike."%${safeWPlate}%",model.ilike."%${safeW}%",note.ilike."%${safeW}%"`);
                                        else vQuery = vQuery.or(`model.ilike."%${safeW}%",note.ilike."%${safeW}%"`);
                                    });
                                }
                                vQuery = app.preference.applyFilter(vQuery, 'vehicles');
                                const { data: vData } = await vQuery;
                                if (vData) {
                                    vData.forEach(v => {
                                        const iconClass = (app.preference.current === 'coach') ? 'fa-van-shuttle' : 'fa-bus';
                                        plateCards.push(`
                                            <div class="bg-white border border-gray-200 rounded-md p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition" onclick="app.views.loadVehiclePage('${app.utils.cleanText(v.license_plate)}')">
                                                <div class="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl shrink-0"><i class="fa-solid ${iconClass}"></i></div>
                                                <div class="overflow-hidden">
                                                    <div class="font-bold text-black text-sm truncate">${app.utils.displayPlate(app.utils.cleanText(v.license_plate))}</div>
                                                    <div class="text-xs text-gray-500 truncate" title="${app.utils.cleanText(v.model || '')}">${app.utils.cleanText(v.model || 'ChÆ°a rÃµ Model')}</div>
                                                </div>
                                            </div>
                                        `);
                                    });
                                }
                            } catch (e) { }
                        })());
                    }

                    await Promise.all(cardPromises);
                    if (app.searchToken !== currentSearchToken) return;

                    app.currentSearchCards = [...operatorCards, ...modelCards, ...plateCards, ...uploaderCards];
                    app.views.loadMoreSearchCards(true);


                    // ================= TÃŒM KIáº¾M áº¢NH CHÃNH =================
                    const profileSelect = (filterType === 'uploader') ? 'profiles!inner(id, username, role, subroles, ban_status)' : 'profiles(id, username, role, subroles, ban_status)';
                        let photoQuery = window.sb.from('photos').select(`id, url, license_plate, operator, type, route_no, taken_at, created_at, uploader_id, note, exif_params, province, camera_model, location, status, denial_reason, views, ${profileSelect}, vehicles${filterType === 'model' ? '!inner' : ''}(model)`, { count: 'exact' }).eq('status', 'approved');
                    photoQuery = app.preference.applyFilter(photoQuery);

                    if (filterType === 'route') {
                        const prefix = prefixToUrl;
                        if (prefix) {
                            let provName = null;
                            if (app.utils.provinceData) {
                                const prov = app.utils.provinceData.find(p => {
                                    const k = Array.isArray(p.ky_hieu) ? p.ky_hieu : p.ky_hieu.split(',');
                                    return k.map(s => s.trim()).includes(prefix);
                                });
                                if (prov) provName = prov.ten;
                            }
                            const relatedPrefixes = app.utils.getRelatedPrefixes(prefix);
                            const prefixOrCond = relatedPrefixes.map(p => `license_plate.ilike.${p}%`).join(',');
                            if (provName) {
                                photoQuery = photoQuery.eq('route_no', query).or(`province.eq.${provName},${prefixOrCond}`);
                            } else {
                                photoQuery = photoQuery.eq('route_no', query).or(prefixOrCond);
                            }
                        } else {
                            searchWords.forEach(w => { photoQuery = photoQuery.ilike('route_no', `%${w}%`); });
                        }
                    } else if (filterType === 'plate') {
                        searchWords.forEach(w => { photoQuery = photoQuery.ilike('license_plate', `%${app.utils.normalizePlateQuery(w)}%`); });
                    } else if (filterType === 'operator') {
                        searchWords.forEach(w => { photoQuery = photoQuery.ilike('operator', `%${w}%`); });
                    } else if (filterType === 'camera') {
                        searchWords.forEach(w => { photoQuery = photoQuery.ilike('camera_model', `%${w}%`); });
                    } else if (filterType === 'location') {
                        searchWords.forEach(w => { photoQuery = photoQuery.ilike('location', `%${w}%`); });
                    } else if (filterType === 'uploader') {
                        searchWords.forEach(w => { photoQuery = photoQuery.ilike('profiles.username', `%${w}%`); });
                    } else if (filterType === 'model') {
                        searchWords.forEach(w => { photoQuery = photoQuery.ilike('vehicles.model', `%${w}%`); });
                    } else {
                        // All
                        let mQ = window.sb.from('vehicles').select('license_plate, photos!inner(status)').eq('photos.status', 'approved');
                        let uQ = window.sb.from('profiles').select('id, ban_status');

                        searchWords.forEach(w => {
                            const safeW = w.replace(/"/g, '');
                            mQ = mQ.or(`model.ilike."%${safeW}%",note.ilike."%${safeW}%"`);
                            uQ = uQ.ilike('username', `%${w}%`);
                        });

                        const [mRes, uRes] = await Promise.all([mQ.limit(150), uQ.limit(10)]);
                        if (app.searchToken !== currentSearchToken) return;

                        const plates = mRes.data ? mRes.data.map(v => v.license_plate) : [];
                        const validUploaders = (uRes.data || []).filter(u => !app.utils.formatProfileDisplay(u).isBanned);
                        const uploaderIds = validUploaders.map(u => u.id);

                        searchWords.forEach(w => {
                            const safeW = w.replace(/"/g, '');
                            const safeWPlate = app.utils.normalizePlateQuery(safeW);
                            
                            let orConditions = [];
                            if (safeWPlate) orConditions.push(`license_plate.ilike."%${safeWPlate}%"`);
                            orConditions.push(`operator.ilike."%${safeW}%"`);
                            orConditions.push(`route_no.ilike."%${safeW}%"`);
                            orConditions.push(`camera_model.ilike."%${safeW}%"`);
                            orConditions.push(`location.ilike."%${safeW}%"`);
                            orConditions.push(`note.ilike."%${safeW}%"`);

                            if (plates.length > 0) orConditions.push(`license_plate.in.(${plates.join(',')})`);
                            if (uploaderIds.length > 0) orConditions.push(`uploader_id.in.(${uploaderIds.join(',')})`);
                            
                            photoQuery = photoQuery.or(orConditions.join(','));
                        });
                    }

                    // PHÃ‚N TRANG: CHá»ˆ KÃ‰O TRANG Äáº¦U (24 áº¢NH) THAY VÃŒ LIMIT(500)
                    app.searchPageSize = 24;
                    app.searchCurrentPage = 1;
                    const { data: results, error, count } = await photoQuery
                        .order('taken_at', { ascending: false, nullsFirst: false })
                        .order('created_at', { ascending: false })
                        .range(0, app.searchPageSize - 1);

                    if (app.currentViewMode !== 'search' || app.searchToken !== currentSearchToken) return;
                    if (error) throw error;

                    if (!results || results.length === 0) {
                        grid.innerHTML = '<div class="col-span-full text-center py-10 text-gray-500">KhÃ´ng tÃ¬m tháº¥y káº¿t quáº£ phÃ¹ há»£p.</div>';
                        return;
                    }

                    app.currentSearchResults = results;
                    app.searchTotalCount = count || results.length;
                    app.searchTotalPages = Math.ceil(app.searchTotalCount / app.searchPageSize);
                    app.loadedCount = results.length;
                    app.searchCurrentPage = 1;

                    grid.innerHTML = results.map(p => app.views.renderPhotoCard(p)).join('');

                    if (app.searchTotalPages > 1) {
                        document.getElementById('search-load-more-container')?.classList.remove('hidden');
                    } else {
                        document.getElementById('search-load-more-container')?.classList.add('hidden');
                    }

                } catch (err) {
                    console.error(err);
                    grid.innerHTML = `<div class="col-span-full text-center py-10 text-red-500">Lá»—i há»‡ thá»‘ng: ${err.message}</div>`;
                }
                app.loadingBar.finish();
            }
});

Object.assign(window.app, {
  setUser: async (user) => {
                app.user = user;
                const dropdown = document.getElementById('user-dropdown');

                if (user) {
                    // Láº¥y tÃªn tá»« metadata (Há»— trá»£ Google, Discord, Email)
                    let metaName = user.user_metadata?.username ||
                                   user.user_metadata?.full_name ||
                                   user.user_metadata?.name ||
                                   user.user_metadata?.custom_claims?.global_name ||
                                   (user.email ? user.email.split('@')[0] : 'User');

                    let finalName = metaName.substring(0, 20);
                    let finalAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

                    try {
                        const { data: profile } = await window.sb.from('profiles').select('username, role, preferences, ban_status').eq('id', user.id).maybeSingle();

                        if (profile && profile.ban_status) {
                            let banInfo = null;
                            try { banInfo = typeof profile.ban_status === 'string' ? JSON.parse(profile.ban_status) : profile.ban_status; } catch(e){}
                            if (banInfo && (banInfo.banned === true || banInfo.banned === 'true')) {
                                try { await window.sb.auth.signOut(); } catch(err){}
                                for (let i = 0; i < localStorage.length; i++) {
                                    const key = localStorage.key(i);
                                    if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
                                        localStorage.removeItem(key);
                                    }
                                }
                                sessionStorage.removeItem('VNBA_SESS_AUTH');
                                const accName = profile.username || user.email || 'cá»§a báº¡n';
                                const reasonText = banInfo.reason || 'Vi pháº¡m quy Ä‘á»‹nh cá»§a VNBUSARCHIVE';
                                const uuidStr = user.id ? ` (<code>${user.id}</code>)` : '';
                                const banReason = `TÃ i khoáº£n <b>${accName}</b>${uuidStr} Ä‘Ã£ bá»‹ cáº¥m vá»›i lÃ­ do: <b>${reasonText}</b>`;
                                document.body.innerHTML = `
                                    <div style="background-color: #f4f4f5; color: #09090b; width: 100vw; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; text-align: center; padding: 24px; box-sizing: border-box; user-select: none;">
                                        <div style="margin-bottom: 32px; display: flex; align-items: center; justify-content: center; gap: 8px;">
                                            <img src="/media/vnba.png" alt="VNBUSARCHIVE Logo" style="height: 38px; width: auto; object-contain;">
                                            <span style="font-family: 'Montserrat', sans-serif; font-weight: 800; font-style: italic; font-size: 1.35rem; letter-spacing: 0.05em; color: #000000;">VNBUSARCHIVE</span>
                                        </div>
                                        <div style="max-width: 520px; width: 100%; border: 1px solid #e4e4e7; background: #ffffff; border-radius: 16px; padding: 36px 28px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05); margin-bottom: 24px;">
                                            <div style="width: 64px; height: 64px; border-radius: 50%; background: #f4f4f5; border: 1px solid #e4e4e7; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px auto;">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#18181b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg>
                                            </div>
                                            <h2 style="font-size: 1.15rem; font-weight: 700; letter-spacing: -0.01em; margin: 0 0 16px 0; color: #09090b; text-transform: uppercase;">
                                                TRUY Cáº¬P ÄÃƒ Bá»Š Háº N CHáº¾
                                            </h2>
                                            <div style="background: #fafafa; border: 1px solid #e4e4e7; border-radius: 10px; padding: 14px 18px; margin-bottom: 24px; text-align: left;">
                                                <div style="font-size: 0.72rem; font-weight: 700; color: #71717a; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px;">
                                                    LÃ DO Háº N CHáº¾ TRUY Cáº¬P / BAN LOG
                                                </div>
                                                <div style="font-size: 0.92rem; font-weight: 500; color: #27272a; line-height: 1.6; word-break: break-word;">
                                                    ${banReason}
                                                </div>
                                            </div>
                                            <p style="font-size: 0.85rem; line-height: 1.65; margin: 0; color: #52525b;">
                                                Vui lÃ²ng táº£i láº¡i trang hoáº·c liÃªn há»‡: <a href="mailto:lienhe@vnbusarchive.io.vn" style="color: #09090b; font-weight: 700; text-decoration: underline; text-underline-offset: 4px;">lienhe@vnbusarchive.io.vn</a> náº¿u báº¡n nghÄ© Ä‘Ã¢y lÃ  má»™t sai láº§m! Xin cáº£m Æ¡n.
                                            </p>
                                        </div>
                                        <p style="font-size: 0.72rem; letter-spacing: 0.22em; color: #a1a1aa; text-transform: uppercase; font-weight: 600; margin: 0;">VNBUSARCHIVE Foundation</p>
                                    </div>
                                `;
                                return;
                            }
                        }

                        let localPref = localStorage.getItem('vnbus_preference') || 'both';
                        let localShowRec = localStorage.getItem('vnbus_show_rec');
                        localShowRec = localShowRec !== null ? localShowRec === 'true' : true;
                        let localWmMode = localStorage.getItem('vnbus_wm_mode') || 'basic';

                        if (!profile || !profile.username) {
                            // Táº¡o má»›i user vÃ  Ä‘áº©y thiáº¿t láº­p trÃ¬nh duyá»‡t hiá»‡n táº¡i lÃªn Database
                            await window.sb.from('profiles').upsert({
                                id: user.id,
                                username: finalName,
                                avatar_url: finalAvatar,
                                preferences: { type: localPref, showRec: localShowRec, wmMode: localWmMode }
                            }, { onConflict: 'id' });

                            app.username = finalName;
                            app.role = 'user';
                            app.preference.current = localPref;
                            app.preference.showRecommendations = localShowRec;
                        } else {
                            app.username = profile.username;
                            app.role = profile.role || 'user';
                            // Cáº¥p quyá»n bypass cho Manager trong phiÃªn nÃ y
                            if (app.role === 'manager') {
                                sessionStorage.setItem('VNBA_SESS_AUTH', 'active');
                            } else {
                                sessionStorage.removeItem('VNBA_SESS_AUTH');
                            }

                            let dbPrefs = profile.preferences;
                            if (dbPrefs && Object.keys(dbPrefs).length > 0) {
                                // Náº¿u DB CÃ“ Dá»® LIá»†U -> Láº¥y DB Ä‘Ã¨ lÃªn LocalStorage (Æ¯u tiÃªn DB)
                                app.preference.current = dbPrefs.type || 'both';
                                app.preference.showRecommendations = dbPrefs.showRec !== false;

                                localStorage.setItem('vnbus_preference', app.preference.current);
                                localStorage.setItem('vnbus_show_rec', app.preference.showRecommendations);

                                if (dbPrefs.wmMode) {
                                    localStorage.setItem('vnbus_wm_mode', dbPrefs.wmMode);
                                    if (app.wmState) app.wmState.mode = dbPrefs.wmMode;
                                    if (app.upload) {
                                        app.upload.isBlindWatermarkEnabled = (dbPrefs.wmMode === 'advanced');
                                        if (app.upload.setWmMode) app.upload.setWmMode(dbPrefs.wmMode, false);
                                    }
                                }
                            } else {
                                // Náº¿u DB TRá»NG (User cÅ© chÆ°a lÆ°u bao giá») -> Láº¥y LocalStorage Ä‘áº©y lÃªn DB
                                window.sb.from('profiles').update({
                                    preferences: { type: localPref, showRec: localShowRec, wmMode: localWmMode }
                                }).eq('id', user.id).then(()=>{});

                                app.preference.current = localPref;
                                app.preference.showRecommendations = localShowRec;
                            }
                        }
                    } catch (e) {
                        app.username = finalName;
                        app.role = 'user';
                    }

                    // Render tÃªn lÃªn UI Header
                    document.getElementById('nav-username').innerText = app.username;

dropdown.innerHTML = `
                         <a href="/profile" class="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100 font-bold"><i class="fa-solid fa-address-card w-5 text-center mr-1"></i> Há»“ sÆ¡ cá»§a tÃ´i</a>
                         <button onclick="app.settings.open()" class="w-full text-left block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100 font-bold"><i class="fa-solid fa-gear w-5 text-center mr-1"></i> CÃ i Ä‘áº·t</button>
                         <a href="/help" class="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100 font-bold"><i class="fa-solid fa-book-open w-5 text-center mr-1"></i> Trung tÃ¢m há»— trá»£</a>
                         <a href="/contact" class="w-full text-left block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100 font-bold"><i class="fa-solid fa-headset w-5 text-center mr-1"></i> LiÃªn há»‡ há»— trá»£</a>
                         <button onclick="app.auth.logout()" class="w-full text-left block px-4 py-3 text-sm text-red-600 hover:bg-red-50 font-bold"><i class="fa-solid fa-right-from-bracket w-5 text-center mr-1"></i> ÄÄƒng xuáº¥t</button>
                     `;

                    app.auth.close();

                    if (app.role === 'admin' || app.role === 'manager') {
                        document.getElementById('nav-admin').classList.remove('hidden');
                        app.admin.checkNotification();

                        // [THÃŠM Má»šI] Hiá»ƒn thá»‹ tab Quáº£n lÃ½ náº¿u lÃ  Manager
                        if (app.role === 'manager') {
                            document.getElementById('adm-tab-manager').classList.remove('hidden');
                        }
                    } else {
                        document.getElementById('nav-admin').classList.add('hidden');
                    }

                    // ÄÃ£ táº¯t tá»± Ä‘á»™ng nháº£y sang Telegram




                } else {
                    document.getElementById('nav-username').innerText = 'TÃ i khoáº£n';
                    document.getElementById('nav-admin').classList.add('hidden');
                    app.username = 'Guest';
                    app.role = 'user';


dropdown.innerHTML = `
                         <a href="/auth" class="w-full text-left block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100 font-bold"><i class="fa-solid fa-arrow-right-to-bracket w-5 text-center mr-1"></i> ÄÄƒng nháº­p</a>
                         <a href="/auth" class="w-full text-left block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100 font-bold"><i class="fa-solid fa-user-plus w-5 text-center mr-1"></i> Táº¡o tÃ i khoáº£n</a>
                         <button onclick="app.settings.open()" class="w-full text-left block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100 font-bold"><i class="fa-solid fa-gear w-5 text-center mr-1"></i> CÃ i Ä‘áº·t</button>
                         <a href="/help" class="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100 font-bold"><i class="fa-solid fa-book-open w-5 text-center mr-1"></i> Trung tÃ¢m há»— trá»£</a>
                         <a href="/contact" class="w-full text-left block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 font-bold"><i class="fa-solid fa-headset w-5 text-center mr-1"></i> LiÃªn há»‡ há»— trá»£</a>
                     `;



                    // ÄÃ£ táº¯t tá»± Ä‘á»™ng nháº£y sang Telegram

                }
                if (app.auth && app.auth.updateUUIDBox) app.auth.updateUUIDBox();
            }
});
