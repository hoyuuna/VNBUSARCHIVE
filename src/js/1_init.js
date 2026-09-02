window.app = window.app || {};
window.addEventListener('unhandledrejection', function(event) {
    if (event.reason && event.reason.message && event.reason.message.includes("Unexpected token '<'")) {
        if (window.app && window.app.toast) {
            window.app.toast.show('error', 'Lỗi kết nối', 'Cloudflare hết hạn, vui lòng bấm vào đây để tải lại trang', 10000, () => {
                window.location.reload(true);
            });
        }
    }
});
window.addEventListener('error', function(event) {
    if (event.message && event.message.includes("Unexpected token '<'")) {
        if (window.app && window.app.toast) {
            window.app.toast.show('error', 'Lỗi kết nối', 'Cloudflare hết hạn, vui lòng bấm vào đây để tải lại trang', 10000, () => {
                window.location.reload(true);
            });
        }
    }
});
Object.assign(window.app, {
  db: {
      init: () => {
          return new Promise((resolve, reject) => {
              const request = indexedDB.open('vnbus_draft_db', 1);
              request.onupgradeneeded = (e) => {
                  const db = e.target.result;
                  if (!db.objectStoreNames.contains('draft_photo')) {
                      db.createObjectStore('draft_photo');
                  }
              };
              request.onsuccess = (e) => resolve(e.target.result);
              request.onerror = (e) => reject(e.target.error);
          });
      },
      savePhoto: async (file) => {
          try {
              const db = await app.db.init();
              return new Promise((resolve, reject) => {
                  const tx = db.transaction('draft_photo', 'readwrite');
                  const store = tx.objectStore('draft_photo');
                  const request = store.put({ file: file }, 'current_photo');
                  request.onsuccess = () => resolve();
                  request.onerror = (e) => reject(e.target.error);
              });
          } catch (e) { console.warn("Lỗi lưu ảnh draft", e); }
      },
      getPhoto: async () => {
          try {
              const db = await app.db.init();
              return new Promise((resolve, reject) => {
                  const tx = db.transaction('draft_photo', 'readonly');
                  const store = tx.objectStore('draft_photo');
                  const request = store.get('current_photo');
                  request.onsuccess = (e) => resolve(e.target.result);
                  request.onerror = (e) => reject(e.target.error);
              });
          } catch (e) { console.warn("Lỗi lấy ảnh draft", e); return null; }
      },
      clearPhoto: async () => {
          try {
              const db = await app.db.init();
              return new Promise((resolve, reject) => {
                  const tx = db.transaction('draft_photo', 'readwrite');
                  const store = tx.objectStore('draft_photo');
                  const request = store.delete('current_photo');
                  request.onsuccess = () => resolve();
                  request.onerror = (e) => reject(e.target.error);
              });
          } catch (e) { console.warn("Lỗi xóa ảnh draft", e); }
      }
  },
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
                            <p id="${toastId}-desc" class="text-[12px] text-gray-500 mt-0.5 leading-relaxed truncate">Vui lòng đợi trong giây lát...</p>
                        </div>
                    `;
                    container.prepend(toast);
                    let startY = 0, currentY = 0, isDragging = false;
                    toast.addEventListener('touchstart', (e) => { 
                        isDragging = true; startY = e.touches[0].clientY; 
                        toast.style.transition = 'none'; 
                    }, {passive: true});
                    toast.addEventListener('touchmove', (e) => {
                        if(!isDragging) return;
                        currentY = e.touches[0].clientY;
                        let diffY = currentY - startY;
                        if (diffY < 0) diffY = diffY * 0.25;
                        else diffY = diffY * 0.1;
                        toast.style.transform = `translateY(${diffY}px)`;
                    }, {passive: true});
                    toast.addEventListener('touchend', () => {
                        isDragging = false;
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
                    clearInterval(app.loadingBar.interval);
                    clearTimeout(app.loadingBar.timeout1);
                    clearTimeout(app.loadingBar.timeout2);
                    bar.style.transition = 'none';
                    bar.style.width = '0%';
                    bar.style.opacity = '1';
                    void bar.offsetWidth; 
                    bar.style.transition = 'width 0.3s ease, opacity 0.2s ease';
                    bar.style.width = '30%'; 
                    let progress = 30;
                    app.loadingBar.interval = setInterval(() => {
                        progress += (100 - progress) * 0.1; 
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
                    bar.style.width = '100%'; 
                    app.loadingBar.timeout1 = setTimeout(() => {
                        bar.style.opacity = '0'; 
                        app.loadingBar.timeout2 = setTimeout(() => {
                            bar.style.transition = 'none';
                            bar.style.width = '0%'; 
                        }, 250);
                    }, 250);
                }
            }
});
Object.assign(window.app, {
  ui: {
                alertInterval: null,
                showAlert: (msg, okCallback = null, cancelCallback = null, options = {}) => {
                    const cleanMsg = (msg || '').toLowerCase();
                    const isSuccess = cleanMsg.includes('thành công') || cleanMsg.includes('đã lưu') || cleanMsg.includes('đã cập nhật');
                    if (isSuccess && !okCallback && !cancelCallback && !options.countdown) {
                        app.toast.show('success', 'Thành công', msg);
                        return;
                    }
                    if (app.ui.alertInterval) clearInterval(app.ui.alertInterval);
                    if (app.ui.alertCloseTimeout) clearTimeout(app.ui.alertCloseTimeout);
                    document.getElementById('custom-alert-msg').innerHTML = msg;
                    const modal = document.getElementById('custom-alert-modal');
                    const content = document.getElementById('custom-alert-content');
                    const titleEl = document.getElementById('custom-alert-title');
                    const imgEl = document.getElementById('custom-alert-img');
                    const okBtn = document.getElementById('custom-alert-ok-btn');
                    const cancelBtn = document.getElementById('custom-alert-cancel-btn');
                    const iconBox = document.getElementById('custom-alert-icon');
                    if (titleEl) titleEl.innerText = options.title || "Thông báo";
                    if (iconBox) {
                        iconBox.style.display = options.hideButtons ? 'none' : 'flex';
                        iconBox.innerHTML = options.iconHtml || '<i class="fa-solid fa-bell text-xl text-black"></i>';
                    }
                    if (okBtn) {
                        let defaultText = options.btnOkText || "Đồng ý";
                        okBtn.style.display = options.hideButtons ? 'none' : 'inline-flex';
                        if (options.isDestructive) {
                            okBtn.className = "w-full inline-flex items-center justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm transition";
                        } else {
                            okBtn.className = "w-full inline-flex items-center justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-black text-base font-medium text-white hover:bg-gray-800 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm transition";
                        }
                        if (options.countdown) {
                            okBtn.disabled = true;
                            okBtn.classList.add('opacity-50', 'cursor-not-allowed');
                            let timeLeft = 3;
                            okBtn.innerHTML = `${defaultText} (${timeLeft})`;
                            app.ui.alertInterval = setInterval(() => {
                                timeLeft--;
                                if (timeLeft <= 0) {
                                    clearInterval(app.ui.alertInterval);
                                    okBtn.disabled = false;
                                    okBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                                    okBtn.innerHTML = defaultText;
                                } else {
                                    okBtn.innerHTML = `${defaultText} (${timeLeft})`;
                                }
                            }, 1000);
                        } else {
                            okBtn.disabled = false;
                            okBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                            okBtn.innerHTML = defaultText;
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
                        cancelBtn.innerHTML = options.btnCancelText || "Hủy bỏ";
                        cancelBtn.style.display = options.hideButtons ? 'none' : 'inline-flex';
                        if (options.isCancelDestructive) {
                            cancelBtn.className = "mt-3 w-full inline-flex items-center justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition";
                        } else if (options.isCancelPrimary) {
                            cancelBtn.className = "mt-3 w-full inline-flex items-center justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-black text-base font-medium text-white hover:bg-gray-800 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition";
                        } else {
                            cancelBtn.className = "mt-3 w-full inline-flex items-center justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition";
                        }
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
                    if (app.ui.alertCloseTimeout) clearTimeout(app.ui.alertCloseTimeout);
                    const modal = document.getElementById('custom-alert-modal');
                    const content = document.getElementById('custom-alert-content');
                    content.classList.remove('modal-content-enter');
                    content.classList.add('modal-content-leave');
                    app.ui.alertCloseTimeout = setTimeout(() => {
                        modal.classList.add('hidden');
                        content.classList.remove('modal-content-leave');
                        app.ui.unlockScroll();
                        const cb = isOk ? app.alertCallback : app.alertCancelCallback;
                        app.alertCallback = null;
                        app.alertCancelCallback = null;
                        if (cb) cb();
                    }, 200);
                },
                showVerifiedPopup: (type, link) => {
                    let desc = "";
                    let helpUrl = "";
                    if (type === 'vvcc') {
                        helpUrl = 'https://www.vnbusarchive.io.vn/help/1537750814507008101';
                        desc = `Danh hiệu <b>VNBUSARCHIVE Verified Content Creator</b> được cấp cho các nhà sáng tạo nội dung sở hữu kênh truyền thông đạt chuẩn, có công lan tỏa hình ảnh giao thông công cộng đến với cộng đồng.<br><br><a href="${helpUrl}" target="_blank" class="text-black hover:underline font-bold text-[13px] inline-flex items-center">Tìm hiểu thêm về danh hiệu này</a>`;
                        if (link) {
                            app.ui.showAlert(desc, 
                                () => { window.open(link, '_blank'); }, 
                                null, 
                                {
                                    title: "VNBUSARCHIVE Verified",
                                    iconHtml: '<i class="fa-solid fa-circle-check text-3xl text-black"></i>',
                                    btnOkText: '<i class="fa-solid fa-arrow-up-right-from-square mr-2 text-[12px] pt-0.5"></i> Xem kênh',
                                    btnCancelText: "Đóng"
                                }
                            );
                        } else {
                            app.ui.showAlert(desc, 
                                null, 
                                null, 
                                {
                                    title: "VNBUSARCHIVE Verified",
                                    iconHtml: '<i class="fa-solid fa-circle-check text-3xl text-black"></i>',
                                    btnOkText: "Đóng"
                                }
                            );
                        }
                    } else if (type === 'dev') {
                        helpUrl = 'https://www.vnbusarchive.io.vn/help/1538729901798989934';
                        desc = `Danh hiệu <b>VNBUSARCHIVE Code Contributor</b> được cấp cho các lập trình viên đã có đóng góp mã nguồn (Pull Request) hợp lệ trên GitHub, góp phần xây dựng và phát triển nền tảng công nghệ của dự án.<br><br><a href="${helpUrl}" target="_blank" class="text-black hover:underline font-bold text-[13px] inline-flex items-center">Tìm hiểu thêm về danh hiệu này</a>`;
                        app.ui.showAlert(desc, 
                            null, 
                            null, 
                            {
                                title: "VNBUSARCHIVE Verified",
                                iconHtml: '<i class="fa-solid fa-code text-3xl text-black"></i>',
                                btnOkText: "Đóng"
                            }
                        );
                    } else if (type === 'vvbs') {
                        helpUrl = 'https://www.vnbusarchive.io.vn/help/1537761083090018366';
                        desc = `Danh hiệu <b>VNBUSARCHIVE Verified Bus Staff</b> được cấp nhằm xác nhận và tôn vinh những cán bộ, công nhân viên đang trực tiếp công tác và cống hiến cho ngành giao thông công cộng.<br><br><a href="${helpUrl}" target="_blank" class="text-black hover:underline font-bold text-[13px] inline-flex items-center">Tìm hiểu thêm về danh hiệu này</a>`;
                        app.ui.showAlert(desc, 
                            null, 
                            null, 
                            {
                                title: "VNBUSARCHIVE Verified",
                                iconHtml: '<i class="fa-solid fa-circle-check text-3xl text-black"></i>',
                                btnOkText: "Đóng"
                            }
                        );
                    }
                },
                showQuotaInfo: () => {
                    const limitStr = app.maintenance.settings['upload_quota']?.reason;
                    const limitTxt = (limitStr && limitStr.trim() !== '') ? limitStr : 'không giới hạn';
                    app.ui.showAlert(
                        `Nhằm bảo vệ hạ tầng máy chủ và dung lượng lưu trữ, hệ thống giới hạn mỗi người dùng chỉ được tải lên tối đa <b>${limitTxt} ảnh</b> hàng ngày.<br><br>Chu kỳ sẽ được tự động đặt lại vào mỗi <b>7 giờ sáng (Giờ Việt Nam)</b>.`,
                        null, null, { title: "Chính sách giới hạn đăng tải", btnOkText: "Đã hiểu" }
                    );
                },
                showPrompt: (msg, defaultValue = '', callback) => {
                    const modal = document.getElementById('custom-prompt-modal');
                    const content = document.getElementById('custom-prompt-content');
                    const titleEl = document.getElementById('custom-prompt-title');
                    const msgEl = document.getElementById('custom-prompt-msg');
                    const inputEl = document.getElementById('custom-prompt-input');
                    const okBtn = document.getElementById('custom-prompt-ok-btn');
                    titleEl.innerText = "Nhập thông tin";
                    msgEl.innerText = msg;
                    inputEl.value = defaultValue;
                    if (app.ui.promptCloseTimeout) clearTimeout(app.ui.promptCloseTimeout);
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
                            app.ui.showAlert("Vui lòng nhập nội dung, không được để trống!");
                            return;
                        }
                        app.ui.closePrompt(true);
                    };
                },
                closePrompt: (isOk) => {
                    if (app.ui.promptCloseTimeout) clearTimeout(app.ui.promptCloseTimeout);
                    const modal = document.getElementById('custom-prompt-modal');
                    const content = document.getElementById('custom-prompt-content');
                    const inputEl = document.getElementById('custom-prompt-input');
                    content.classList.remove('modal-content-enter');
                    content.classList.add('modal-content-leave');
                    app.ui.promptCloseTimeout = setTimeout(() => {
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
                    titleEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation mr-2"></i>${titleStr || 'Từ chối ảnh'}`;
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
                                app.ui.showAlert("Vui lòng chọn ít nhất một lý do từ danh sách!");
                                return;
                            }
                            reasonString = selectedChecks.join(' + ');
                        } else if (app.activeDenySection === 'custom') {
                            const customText = customInput.value.trim();
                            if (!customText) {
                                app.ui.showAlert("Vui lòng nhập lý do từ chối cụ thể!");
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
                    title.innerText = 'Đang chuẩn bị...';
                    title.className = 'text-lg font-bold text-gray-900 mb-1';
                    desc.innerText = 'Vui lòng không rời khỏi trang';
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
                    title.innerText = 'Ảnh đã upload thành công';
                    title.classList.replace('text-gray-900', 'text-green-600');
                    desc.innerText = 'Ảnh sẽ xuất hiện sau khi được admin duyệt!';
                    if (infoBox && queueCountSpan) {
                        infoBox.classList.remove('hidden');
                        queueCountSpan.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                        window.sb.from('photos').select('id, created_at, uploader_id, profiles(role)').eq('status', 'pending')
                            .then(({ data, error }) => {
                                if (!error && data) {
                                    let ahead = 0;
                                    const isMePrivileged = (app.role === 'admin' || app.role === 'manager');
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
                    actions.className = "mt-6 flex gap-3 justify-center w-full"; 
                    actions.innerHTML = `
                        <button onclick="app.utils.cleanupState(); window.scrollTo({ top: 0, behavior: 'smooth' });" class="flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-md font-bold text-xs hover:bg-gray-50 transition shadow-sm">Upload thêm</button>
                        <button onclick="app.utils.navigate('/');" class="flex-1 bg-black text-white py-2.5 rounded-md font-bold text-xs hover:bg-gray-800 transition shadow-sm">Trang chủ</button>
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
                    title.innerText = 'Không thể tải ảnh lên';
                    title.classList.replace('text-gray-900', 'text-red-600');
                    let cleanMsg = errMsg;
                    if (errMsg.includes('EXCEPTION:')) {
                        cleanMsg = errMsg.split('EXCEPTION:')[1].trim();
                    }
                    if (errMsg.toLowerCase().includes('cloudflare') || errMsg.toLowerCase().includes('turnstile')) {
                        title.innerText = 'Lỗi xác thực bảo mật';
                    } else if (errMsg.toLowerCase().includes('image') || errMsg.toLowerCase().includes('upload')) {
                        title.innerText = 'Lỗi máy chủ hình ảnh';
                    } else {
                        title.innerText = 'Không thể tải ảnh lên';
                    }
                    desc.innerHTML = `<b class="text-red-700">${cleanMsg}</b>`;
                    errorBox.innerHTML = `Mã lỗi: ${cleanMsg}`;
                    errorBox.classList.remove('hidden');
                    
                    const statusTextHtml = `<span id="auto-report-status" class="text-amber-600"><i class="fa-solid fa-spinner fa-spin"></i> Đang gửi báo cáo lỗi tự động...</span>`;
                    
                    actions.className = "mt-5 flex flex-col w-full"; 
                    actions.innerHTML = `
                        <div class="text-[10px] text-black font-medium text-center mb-3">
                            <span class="inline-flex flex-wrap justify-center items-center gap-1">
                                ${statusTextHtml}
                                <a href="javascript:void(0)" onclick="app.ui.closeUploadProgress(); setTimeout(() => app.utils.navigate('/help/1516405301996421281'), 300)" class="font-bold underline hover:text-gray-800 transition-colors inline-flex items-center">Tìm hiểu thêm & hướng dẫn khắc phục</a>
                            </span>
                        </div>
                        <div class="flex gap-3 w-full">
                            <button onclick="app.ui.closeUploadProgress(); app.utils.resetTurnstile('#upload .cf-turnstile');" class="flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-md font-bold text-xs hover:bg-gray-50 transition shadow-sm">Thử lại</button>
                            <button onclick="app.utils.navigate('/');" class="flex-1 bg-black text-white py-2.5 rounded-md font-bold text-xs hover:bg-gray-800 transition shadow-sm">Trang chủ</button>
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
                    } catch (e) { console.error("Lỗi lấy thông tin bảo trì", e); }
                },
                check: (sysId) => {
                    if (app.maintenance.isBypassed) return false; 
                    const target = app.maintenance.settings['global']?.is_active === false
                                 ? app.maintenance.settings['global']
                                 : app.maintenance.settings[sysId];
                    if (!target) return false;
                    if (target.is_active === false) {
                        return target;
                    }
                    return false;
                },
                showScreen: (targetData) => {
                    const screen = document.getElementById('maintenance-screen');
                    document.querySelectorAll('header, main, footer, #header-spacer').forEach(el => el.style.display = 'none');
                    document.body.style.backgroundColor = '#ffffff';
                    document.getElementById('mt-reason').innerText = targetData.reason || "Hệ thống đang được bảo trì, vui lòng quay lại sau.";
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
                                countdownEl.innerText = "Cập nhật sau";
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
                        countdownEl.innerText = "Cập nhật sau";
                        countdownEl.className = "text-xl font-bold tracking-normal text-gray-400"; 
                    }
                    screen.classList.remove('hidden');
                    app.ui.lockScroll(); 
                },
                hideScreen: () => {
                    document.getElementById('maintenance-screen').classList.add('hidden');
                    document.querySelectorAll('header, main, footer, #header-spacer').forEach(el => el.style.display = '');
                    document.body.style.backgroundColor = '';
                    if (app.maintenance.timer) clearInterval(app.maintenance.timer);
                },
                bypass: () => {
                    app.maintenance.isBypassed = true;
                    app.maintenance.hideScreen();
                    app.handleRoute(); 
                }
            }
});
Object.assign(window.app, {
  utils: {
                isValidUsername: (name) => {
                    return /^[\p{L}0-9 ]+$/u.test(name) && name.length >= 3 && name.length <= 20;
                },
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
                resetTurnstile: (selector) => {
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
                    if (!heicBlob) throw new Error("Không thể chuyển đổi ảnh HEIC/HEIF sang JPEG.");
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
                                img.onerror = () => reject(new Error("Lỗi tải ảnh để encode WebP CPU"));
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
                        console.warn("WASM WebP encode bằng CPU lỗi, fallback:", err);
                        return null;
                    }
                },
                compressToSizeLoop: async (imageSource, targetMime = 'image/webp', targetKB = 500) => {
                    const targetBytes = targetKB * 1024;
                    const url = imageSource instanceof Blob || imageSource instanceof File ? URL.createObjectURL(imageSource) : imageSource;
                    const img = new Image();
                    img.src = url;
                    await new Promise((resolve, reject) => {
                        img.onload = resolve;
                        img.onerror = () => reject(new Error("Lỗi tải ảnh để nén vòng lặp"));
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
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, w, h);
                    
                    let bestBlob = null;
                    let hasWebpNative = false;
                    
                    // Thử với WebP Native
                    let minQ = 0.70;
                    let maxQ = 0.95;
                    while (maxQ - minQ >= 0.02) {
                        let midQ = (minQ + maxQ) / 2;
                        let q = parseFloat(midQ.toFixed(3));
                        let compressedBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', q));
                        if (compressedBlob && compressedBlob.type === 'image/webp') {
                            hasWebpNative = true;
                            if (compressedBlob.size <= targetBytes) {
                                bestBlob = compressedBlob;
                                minQ = midQ;
                            } else {
                                maxQ = midQ;
                            }
                        } else {
                            break;
                        }
                    }
                    if (!bestBlob && hasWebpNative) {
                        let finalBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', 0.70));
                        if (finalBlob && finalBlob.size <= targetBytes) bestBlob = finalBlob;
                    }
                    if (bestBlob) return bestBlob;

                    // Nếu không có webp native hoặc không đạt dung lượng
                    if (!hasWebpNative) {
                        try {
                            const { encode } = await import("https://esm.sh/@jsquash/webp@1.2.0");
                            const imageData = ctx.getImageData(0, 0, w, h);
                            minQ = 0.70;
                            maxQ = 0.95;
                            while (maxQ - minQ >= 0.02) {
                                let midQ = (minQ + maxQ) / 2;
                                let q = Math.round(midQ * 100);
                                let webpBuffer = await encode(imageData, { quality: q });
                                let wasmBlob = new Blob([webpBuffer], { type: 'image/webp' });
                                if (wasmBlob.size <= targetBytes) {
                                    bestBlob = wasmBlob;
                                    minQ = midQ;
                                } else {
                                    maxQ = midQ;
                                }
                            }
                            if (!bestBlob) {
                                let webpBuffer = await encode(imageData, { quality: 70 });
                                let wasmBlob = new Blob([webpBuffer], { type: 'image/webp' });
                                if (wasmBlob.size <= targetBytes) bestBlob = wasmBlob;
                            }
                            if (bestBlob) return bestBlob;
                        } catch (e) {
                            console.warn("WASM WebP fallback error:", e);
                        }
                    }

                    // Fallback sang JPEG
                    minQ = 0.70;
                    maxQ = 0.95;
                    while (maxQ - minQ >= 0.02) {
                        let midQ = (minQ + maxQ) / 2;
                        let q = parseFloat(midQ.toFixed(3));
                        let compressedBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', q));
                        if (compressedBlob && compressedBlob.size <= targetBytes) {
                            bestBlob = compressedBlob;
                            minQ = midQ;
                        } else {
                            maxQ = midQ;
                        }
                    }
                    if (!bestBlob) {
                        let finalBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.70));
                        if (finalBlob && finalBlob.size <= targetBytes) bestBlob = finalBlob;
                    }
                    if (bestBlob) return bestBlob;
                    
                    throw new Error(`BLIND_WM_ERROR:Ảnh quá chi tiết, không thể nén xuống dưới ${targetKB}KB (chất lượng tối thiểu 70%). Vui lòng cắt nhỏ hoặc chọn ảnh khác.`);
                },
                canvasToBlobUniversal: async (canvas, targetMime = 'image/webp', quality = 0.95) => {
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
                    const isDestLeaf = url.startsWith('/vehicle/') || url.startsWith('/photo/') || url.startsWith('/operator/') || url.startsWith('/model/') || url.startsWith('/user/');
                    const isCurrentRoot = rootPages.some(r => prevPath === r || (r !== '/' && prevPath.startsWith(r)));
                    if (isCurrentRoot) {
                        let bName = "Trang chủ";
                        if (prevPath === '/profile/comments') bName = "Quản lý bình luận";
                        else if (prevPath === '/profile') bName = "Hồ sơ của tôi";
                        else if (prevPath.startsWith('/search')) bName = "Kết quả tìm kiếm";
                        else if (prevPath.startsWith('/user/')) bName = "Hồ sơ người dùng";
                        else if (prevPath === '/upload') bName = "Đăng tải";
                        else if (prevPath === '/admin') bName = "Quản trị";
                        else if (prevPath === '/contact') bName = "Liên hệ";
                        else if (prevPath === '/leaderboard') bName = "Bảng xếp hạng đóng góp";
                        else if (prevPath === '/help' || prevPath.startsWith('/help/')) bName = "Trung tâm hỗ trợ";
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
                        
                        // Tự động reset lại nút Ghim địa điểm về trạng thái gốc
                        if (app.upload && app.upload.checkLocationPinStatus) {
                            app.upload.checkLocationPinStatus('');
                        }

                        document.getElementById('locked-msg')?.classList.add('hidden');
                        app.vehicleLocked = false;
                        document.getElementById('plate-msg').innerText = '';
                        app.utils.resetTurnstile('#upload .cf-turnstile');
                        app.utils.resetTurnstile('#auth .cf-turnstile');
                        if(app.upload.applyPreferenceUI) app.upload.applyPreferenceUI();
                        document.getElementById('type-msg')?.classList.add('hidden');
                        
                        
                    }
                    app.ui.closeUploadProgress();
                    app.ui.closeAlert(false);
                    app.ui.closePrompt(false);
                    if(app.crop && app.crop.close) app.crop.close();
                    if(app.docs && app.docs.close) app.docs.close();
                    if(app.settings && app.settings.close) app.settings.close();
                    const zoomModal = document.getElementById('image-zoom-modal');
                    if (zoomModal && !zoomModal.classList.contains('hidden')) {
                        zoomModal.classList.add('hidden');
                        document.body.style.overflow = '';
                    }
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
                    } catch (e) { console.warn("Không thể tải licence-no.json", e); }
                },
                getProvinceFromPlate: (plate) => {
                    if (!plate) return 'Không xác định';
                    if (/^[A-Z]{3}\d{4,7}/.test(plate)) return 'Buýt sân bay';
                    if (!app.utils.provinceData.length) return 'Không xác định';
                    if (plate.startsWith('T')) return 'Biển tạm';
                    if (/^[A-Z]{2}/.test(plate.substring(0, 2))) return 'Biển quân đội / Ngoại giao';
                    const prefix = plate.substring(0, 2);
                    const province = app.utils.provinceData.find(p => p.ky_hieu.includes(prefix));
                    return province ? province.ten : 'Không xác định';
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
                        .replace(/^(Tỉnh|Thành phố|TP\.?)\s+/i, '')
                        .replace(/\s+(Province|City)$/i, '')
                        .trim().toLowerCase();
                    const found = app.utils.provinceData.find(p => {
                        const pName = p.ten.toLowerCase()
                            .replace(/^(tp\.?\s*)/i, '')
                            .replace(/^(tỉnh\s*)/i, '').trim();
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
                                    else reject(new Error("File ảnh bị hỏng hoặc trống."));
                                };
                                img.onerror = () => {
                                    reject(new Error("Lỗi máy chủ lưu trữ (404 / Bị chặn)."));
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
                            dotsBtn.innerHTML = '•••';
                            dotsBtn.style.cursor = 'pointer';
                            dotsBtn.title = 'Nhảy đến trang bất kỳ';
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
                                goBtn.textContent = '→';
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
                shareProfile: (userId, userName) => {
                    const id = userId || app.user?.id;
                    const name = userName || app.user?.username || 'Người dùng';
                    if (!id) return;
                    const profileUrl = window.location.origin + '/user/' + id;
                    if (navigator.share) {
                        navigator.share({
                            title: 'Hồ sơ của ' + name,
                            url: profileUrl
                        }).catch(console.error);
                    } else {
                        navigator.clipboard.writeText(profileUrl).then(() => {
                            app.toast.show('success', 'Thành công', 'Đã sao chép liên kết hồ sơ!', 3000);
                        }).catch(() => {
                            app.toast.show('error', 'Lỗi', 'Không thể sao chép liên kết.', 3000);
                        });
                    }
                },
                updateBreadcrumbs: () => {
                    const state = window.history.state;
                    const parent = state?.parentInfo || { name: "Trang chủ", url: "/" };
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
                formatDateInput: (el) => {
                    let val = el.value.replace(/\D/g, '');
                    if (val.length > 8) val = val.substring(0, 8);
                    let formatted = '';
                    if (val.length > 0) formatted += val.substring(0, 2);
                    if (val.length > 2) formatted += '/' + val.substring(2, 4);
                    if (val.length > 4) formatted += '/' + val.substring(4, 8);
                    const oldLen = el.value.length;
                    const oldStart = el.selectionStart;
                    el.value = formatted;
                    const diff = formatted.length - oldLen;
                    el.setSelectionRange(oldStart + diff, oldStart + diff);
                },
                formatDateToDDMMYYYY: (dateStr) => {
                    if (!dateStr) return '';
                    const parts = dateStr.split('-');
                    if (parts.length === 3) {
                        return `${parts[2]}/${parts[1]}/${parts[0]}`;
                    }
                    return dateStr;
                },
                parseDDMMYYYYToDate: (str) => {
                    if (!str || str.length !== 10) return null;
                    const parts = str.split('/');
                    if (parts.length !== 3) return null;
                    const d = parseInt(parts[0], 10);
                    const m = parseInt(parts[1], 10);
                    const y = parseInt(parts[2], 10);
                    if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
                    if (m < 1 || m > 12) return null;
                    const daysInMonth = new Date(y, m, 0).getDate();
                    if (d < 1 || d > daysInMonth) return null;
                    if (y < 1900 || y > 2100) return null;
                    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                },
                formatNoPunctuation: (el) => {
                    return;
                },
                fallbackHeroImage: (imgElement, cacheName, currentIndex) => {
                    const photos = app[cacheName];
                    const wrapper = imgElement.closest('#hero-main') || imgElement.closest('.group');
                    if (!photos || currentIndex >= photos.length - 1) {
                        imgElement.style.display = 'none';
                        if (wrapper) {
                            wrapper.onclick = null;
                            wrapper.classList.remove('cursor-pointer');
                            let errBox = wrapper.querySelector('.fallback-error');
                            if (!errBox) {
                                wrapper.innerHTML += `<div class="fallback-error absolute inset-0 flex flex-col items-center justify-center bg-gray-100 z-10 w-full h-full min-h-[200px]">
                                    <i class="fa-solid fa-image-slash text-gray-400 text-4xl mb-2"></i>
                                    <span class="text-sm font-bold text-gray-500">Ảnh đã bị lỗi hoặc gỡ bỏ</span>
                                </div>`;
                            }
                        }
                        return;
                    }
                    const nextIndex = currentIndex + 1;
                    const nextPhoto = photos[nextIndex];
                    imgElement.src = app.utils.getProxiedUrl(nextPhoto.url, 'fallback.jpg', 'thumb');
                    imgElement.setAttribute('onerror', `app.utils.fallbackHeroImage(this, '${cacheName}', ${nextIndex})`);
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
                                 const safeOperator = app.utils.cleanText(nextPhoto.operator || 'Đang cập nhật');
                                 textViews.innerHTML = safeOperator;
                             }
                        }
                    }
                },
                normalizePlateQuery: (str) => {
                    if (!str) return '';
                    let s = str.toUpperCase().replace(/[\s.,_]/g, '');
                    s = s.replace(/\-(\d{3,5})(?!\d)/g, '$1');
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
                                app.ui.showAlert("Xe định danh phụ không được trùng dòng xe với xe khác cùng biển kiểm soát.", null, null, { title: "Vi phạm chính sách" });
                                return true;
                            }
                        }
                    } catch(e) { console.warn("Lỗi kiểm tra dòng xe gốc:", e); }
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
                        .replace(/[（）]/g, m => m === '（' ? '(' : ')')
                        .replace(/[ ­ᅟᅠ﻿]/g, ' ')
                        .replace(/[ ]/g, ' ')
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
                linkify: (str) => {
                    if (!str) return '';
                    const urlRegex = /(https?:\/\/[^\s]+)/g;
                    return str.replace(urlRegex, function(url) {
                        return `<a href="${url}" target="_blank" class="text-black font-medium hover:underline break-all">${url}</a>`;
                    });
                },
                resolveSandboxUrls: async (items) => {
                    if (!items) return;
                    const list = Array.isArray(items) ? items : [items];
                    list.forEach(item => {
                        if (item && typeof item === 'object' && item.url && typeof item.url === 'string') {
                            if (item.url.startsWith('sandbox:') || item.url.startsWith('data:') || item.url === 'https://cdn.vnbusarchive.io.vn/file/daonguyenthanhnhan') {
                                item._isSandboxMissing = true;
                            }
                        }
                    });
                },
                getProxiedUrl: (url, filename = 'image.jpg', type = 'full') => {
                    if (!url) return '';
                    if (typeof url === 'string' && (url.startsWith('data:') || url.startsWith('sandbox:') || url === 'https://cdn.vnbusarchive.io.vn/file/daonguyenthanhnhan')) return '';
                    const safeName = filename.replace(/[^a-z0-9A-Z.-]/gi, '_');
                    if (url.includes('ik.imagekit.io')) {
                        let transformations = ['f-webp', 'q-auto'];
                        if (type === 'thumb') {
                            transformations.push('w-400', 'h-300', 'c-at_max');
                        } else if (type === 'avatar') {
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
                getHomeStats: async (prefFilter) => {
                    try {
                        const { data, error } = await window.sb.rpc('get_home_stats', { pref_filter: prefFilter || 'both' });
                        if (error) throw error;
                        if (data && data.length > 0) return data[0];
                    } catch (e) {
                        console.warn('RPC get_home_stats lỗi, fallback về cách cũ:', e);
                    }
                    return null;
                },
                getOperatorStats: async (operatorName) => {
                    try {
                        const { data, error } = await window.sb.rpc('get_operator_stats', { op_name: operatorName });
                        if (error) throw error;
                        if (data && data.length > 0) return data[0];
                    } catch (e) {
                        console.warn('RPC get_operator_stats lỗi, fallback về cách cũ:', e);
                    }
                    return null;
                },
                getModelStats: async (modelName) => {
                    try {
                        const { data, error } = await window.sb.rpc('get_model_stats', { mdl_name: modelName });
                        if (error) throw error;
                        if (data && data.length > 0) return data[0];
                    } catch (e) {
                        console.warn('RPC get_model_stats lỗi, fallback về cách cũ:', e);
                    }
                    return null;
                },
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
                                ctx.imageSmoothingEnabled = true;
                                ctx.imageSmoothingQuality = 'high';
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
                                const barHeight = height * 0.0576;
                                const barY = height - barHeight;
                                const fontSize = barHeight * 0.4;
                                const scale = pos.scale || 1.0;
                                const wmFontSize = height * 0.096 * scale;
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
                                ctx.textBaseline = 'middle'; 
                                ctx.font = `700 ${fontSize}px ${fontFace}`;
                                const rightText = `Bản quyền bởi ${username}`;
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
                                    ctx.fillText(`© ${username}`, 0, 0);
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
                                     const blob = await app.utils.canvasToBlobUniversal(canvas, app.utils.getTargetMimeType(), 0.95);
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
                             reject(new Error("Không thể tải ảnh."));
                         };
                         img.src = url;
                     });
                 },
                 embedBlindWatermarkOpenCV: async (canvas, hiddenText) => {
                     const width = canvas.width;
                     const height = canvas.height;
                     if (!width || !height || width < 64 || height < 64) {
                         throw new Error("BLIND_WM_ERROR:Kích thước ảnh quá nhỏ để gắn Blind Watermark.");
                     }
                     const ctx = canvas.getContext('2d');
                     const imgData = ctx.getImageData(0, 0, width, height);
                     const data = imgData.data;
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
                     const parts = hiddenText.split('/').filter(Boolean);
                     const line1 = "VNBUS";
                     let line2 = parts[0] ? parts[0].replace(/VNBUS/i, '') : "ARCHIVE";
                     if (!line2) line2 = "ARCHIVE";
                     const line3 = parts[1] ? `© ${parts[1]}` : "© VNBUS";
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
                     const blocksX = Math.floor(width / 8);
                     const blocksY = Math.floor(height / 8);
                     const block = new Float32Array(64);
                     const temp = new Float32Array(64);
                     const dct = new Float32Array(64);
                     for (let by = 0; by < blocksY; by++) {
                         for (let bx = 0; bx < blocksX; bx++) {
                             const gx = bx % gridW;
                             const gy = by % gridH;
                             let targetDiff = 0;
                             if (wmGrays[gy * gridW + gx] <= -0.9) {
                                 targetDiff = -1.5;
                             } else {
                                 targetDiff = -1.5 + (wmGrays[gy * gridW + gx] + 1.0) * 12.0; 
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
                        likeBtn.classList.replace('bg-gray-400', 'bg-black');
                        likeBtn.innerHTML = '<i class="fa-regular fa-thumbs-up"></i> Thích ảnh này';
                        likeCountEl.innerText = Math.max(0, currentCount - 1);
                        const zBtn = document.getElementById('zoom-btn-like');
                        if(zBtn) {
                            zBtn.className = "flex items-center justify-center gap-1.5 text-gray-800 bg-transparent hover:bg-black hover:text-white px-3 py-2 md:px-4 md:py-2.5 rounded-lg font-bold text-[11px] md:text-sm transition-colors whitespace-nowrap";
                            zBtn.innerHTML = '<i class="fa-regular fa-thumbs-up text-sm md:text-base"></i> <span class="hidden md:inline">Thích</span>';
                        }
                        const { error } = await window.sb.from('photo_likes').delete().eq('photo_id', photoId).eq('user_id', app.user.id);
                        if (error) {
                            likeBtn.classList.replace('bg-black', 'bg-gray-400');
                            likeBtn.innerHTML = '<i class="fa-solid fa-check"></i> Đã thích';
                            likeCountEl.innerText = currentCount;
                            if(zBtn) {
                                zBtn.className = "flex items-center justify-center gap-1.5 bg-black text-white px-3 py-2 md:px-4 md:py-2.5 rounded-lg font-bold text-[11px] md:text-sm transition-colors whitespace-nowrap";
                                zBtn.innerHTML = '<i class="fa-solid fa-check text-sm md:text-base"></i> <span class="hidden md:inline">Đã thích</span>';
                            }
                            app.ui.showAlert("Lỗi khi bỏ thích: " + error.message);
                        }
                    } else {
                        likeBtn.classList.replace('bg-black', 'bg-gray-400');
                        likeBtn.innerHTML = '<i class="fa-solid fa-check"></i> Đã thích';
                        likeCountEl.innerText = currentCount + 1;
                        const zBtn = document.getElementById('zoom-btn-like');
                        if(zBtn) {
                            zBtn.className = "flex items-center justify-center gap-1.5 bg-black text-white px-3 py-2 md:px-4 md:py-2.5 rounded-lg font-bold text-[11px] md:text-sm transition-colors whitespace-nowrap";
                            zBtn.innerHTML = '<i class="fa-solid fa-check text-sm md:text-base"></i> <span class="hidden md:inline">Đã thích</span>';
                        }
                        const { error } = await window.sb.from('photo_likes').insert({ photo_id: photoId, user_id: app.user.id });
                        if (error) {
                            if (error.code !== '23505') {
                                likeBtn.classList.replace('bg-gray-400', 'bg-black');
                                likeBtn.innerHTML = '<i class="fa-regular fa-thumbs-up"></i> Thích ảnh này';
                                likeCountEl.innerText = currentCount;
                                if(zBtn) {
                                    zBtn.className = "flex items-center justify-center gap-1.5 text-gray-800 bg-transparent hover:bg-black hover:text-white px-3 py-2 md:px-4 md:py-2.5 rounded-lg font-bold text-[11px] md:text-sm transition-colors whitespace-nowrap";
                                    zBtn.innerHTML = '<i class="fa-regular fa-thumbs-up text-sm md:text-base"></i> <span class="hidden md:inline">Thích</span>';
                                }
                                app.ui.showAlert("Lỗi khi thích: " + error.message);
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
                        return result.replace(', Việt Nam', '');
                    } catch (e) { return "Vị trí không xác định"; }
                },
                geocodeAddress: async (locationText) => {
                    if (!locationText || locationText.length < 3) return;
                    try {
                        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationText + ', Việt Nam')}&limit=1`);
                        const data = await res.json();
                        if (data && data.length > 0) {
                            const { lat, lon } = data[0];
                            const coords = [parseFloat(lat), parseFloat(lon)];
                            app.uploadMap.setView(coords, 15);
                            if (app.uploadMarker) app.uploadMap.removeLayer(app.uploadMarker);
                            app.uploadMarker = L.marker(coords, {
                                icon: L.icon({
                                    iconUrl: '/media/vnba.png',
                                    iconSize: [64, 36],
                                    iconAnchor: [32, 18],
                                    popupAnchor: [0, -18]
                                })
                            }).addTo(app.uploadMap);
                        }
                    } catch (e) { }
                },
                showDetailMap: async (locationText) => {
                    const mapEl = document.getElementById('detail-map');
                    mapEl.style.display = 'block';
                    mapEl.style.pointerEvents = 'none';
                    if (!app.detailMap) {
                        app.detailMap = L.map('detail-map').setView([10.762622, 106.660172], 13);
                        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', {
                            attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        }).addTo(app.detailMap);
                    }
                    try {
                        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationText + ', Việt Nam')}&limit=1`);
                        const data = await res.json();
                        if (data && data.length > 0) {
                            const { lat, lon } = data[0];
                            const coords = [parseFloat(lat), parseFloat(lon)];
                            app.detailMap.setView(coords, 15);
                            if (app.detailMarker) app.detailMap.removeLayer(app.detailMarker);
                            app.detailMarker = L.marker(coords, {
                                icon: L.icon({
                                    iconUrl: '/media/vnba.png',
                                    iconSize: [64, 36],
                                    iconAnchor: [32, 18],
                                    popupAnchor: [0, -18]
                                })
                            }).addTo(app.detailMap);
                            setTimeout(() => app.detailMap.invalidateSize(), 200);
                        } else {
                            mapEl.style.display = 'none';
                        }
                    } catch (e) { mapEl.style.display = 'none'; }
                },
                
                // THUẬT TOÁN SẮP XẾP ĐỘ PHÙ HỢP
                sortMatchesByRelevance: (items, query, extractTextFn = null) => {
                    if (!query) return items;
                    const q = query.toLowerCase().trim();
                    const safeRegex = new RegExp(`(?:^|\\s|-|_)${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\s|-|_|$)`, 'i');
                    return items.sort((a, b) => {
                        const textA = (extractTextFn ? extractTextFn(a) : a).toLowerCase();
                        const textB = (extractTextFn ? extractTextFn(b) : b).toLowerCase();
                        if (textA === q && textB !== q) return -1;
                        if (textB === q && textA !== q) return 1;
                        const startsA = textA.startsWith(q);
                        const startsB = textB.startsWith(q);
                        if (startsA && !startsB) return -1;
                        if (startsB && !startsA) return 1;
                        const wordA = safeRegex.test(textA);
                        const wordB = safeRegex.test(textB);
                        if (wordA && !wordB) return -1;
                        if (wordB && !wordA) return 1;
                        if (textA.length !== textB.length) return textA.length - textB.length;
                        return textA.localeCompare(textB, 'vi');
                    });
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
                    let staticList = ['Dừng hoạt động', 'Ngoài giờ hoạt động', 'Chưa hoạt động'];
                    if (currentType === 'coach' || currentType === '') {
                        staticList.unshift('Hợp đồng');
                    }
                    let dbRoutes = [];
                    try {
                        let rQuery = window.sb.rpc('get_unique_routes');
                        if (query.trim().length > 0) {
                            const routeWords = query.trim().split(/\s+/).filter(w => w.length > 0);
                            const { data } = await rQuery;
                            if (data) {
                                dbRoutes = data.map(item => item.route_no).filter(Boolean);
                            }
                        } else {
                            const { data } = await rQuery;
                            if (data) {
                                dbRoutes = data.map(item => item.route_no).filter(Boolean);
                            }
                        }
                    } catch (e) { console.log("Route suggestion error:", e.message); }
                    const allRoutes = [...new Set([...staticList, ...dbRoutes])];
                    const filtered = query.length === 0 ? allRoutes : allRoutes.filter(v => v.toLowerCase().includes(query.toLowerCase()));
                    
                    // GỌI HÀM SẮP XẾP
                    if (query.length > 0) app.utils.sortMatchesByRelevance(filtered, query);

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
                            return `<div class="suggestion-item" onmousedown="event.preventDefault(); document.getElementById('${inputId}').value = '${safeJS}'; document.getElementById('${suggestionId}').classList.remove('active'); if('${inputId}' === 'up-route'){ app.upload.autoFillOperatorByRoute(); } if('${inputId}' === 'up-model' && app.upload && app.upload.checkModelPreview){ app.upload.checkModelPreview('${safeJS}'); }">${displayHTML}</div>`;
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
                    if (inputId === 'up-model' && app.upload && app.upload.checkModelPreview) {
                        app.upload.checkModelPreview(query);
                    }
                    if (app.suggestionTimeouts[inputId]) clearTimeout(app.suggestionTimeouts[inputId]);
                    let currentType = '';
                    if (inputId.startsWith('up-')) currentType = document.getElementById('up-type')?.value || '';
                    else if (inputId.startsWith('info-')) currentType = document.getElementById('info-type')?.value || '';
                    else if (inputId.startsWith('adm-p-')) currentType = document.getElementById(`adm-p-type-${inputId.split('-').pop()}`)?.value || '';
                    else if (inputId.startsWith('req-') && !inputId.startsWith('req-v-')) currentType = document.getElementById(`req-type-${inputId.split('-').pop()}`)?.value || '';
                    else if (app.currentVehicle) currentType = app.currentVehicle.type || '';
                    let routeVal = '';
                    let plateVal = '';
                    if (field === 'model') {
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
                    const specialRoutes = ['Dừng hoạt động', 'Ngoài giờ hoạt động', 'Chưa hoạt động', 'Xe hợp đồng / Đưa đón', 'Hợp đồng / Đưa đón', 'Hợp đồng'];
                    const isSpecialRoute = specialRoutes.includes(routeVal);
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
                            let sbQuery = window.sb.from('photos')
                                .select('vehicles!inner(model)')
                                .eq('route_no', routeVal)
                                .eq('status', 'approved'); 
                            if (currentType) {
                                sbQuery = sbQuery.eq('type', currentType);
                            }
                            if (plateVal && plateVal.length >= 2) {
                                const prefix = plateVal.substring(0, 2);
                                if (!isNaN(prefix)) {
                                    const relatedPrefixes = app.utils.getRelatedPrefixes(prefix);
                                    if (relatedPrefixes && relatedPrefixes.length > 0) {
                                        const prefixOrCond = relatedPrefixes.map(p => `license_plate.ilike.${p}%`).join(',');
                                        sbQuery = sbQuery.or(prefixOrCond);
                                    }
                                }
                            }
                            sbQuery = app.preference.applyFilter(sbQuery); 
                            const res = await sbQuery.limit(100).abortSignal(controller.signal);
                            error = res.error;
                            if (res.data) {
                                data = res.data
                                    .map(item => ({ [selectField]: item.vehicles?.model }))
                                    .filter(item => item[selectField]);
                            }
                        } else {
                            let selectStr = selectField;
                            if (table === 'vehicles') {
                                selectStr = `${selectField}, photos!inner(status${(app.preference.current !== 'both' || currentType) ? ', type' : ''})`;
                            }
                            let sbQuery = window.sb.from(table).select(selectStr);
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
                            
                            // GỌI HÀM SẮP XẾP
                            if (query.length > 0) app.utils.sortMatchesByRelevance(uniqueVals, query);

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
                                    const labelHtml = (query.length < 1 && field === 'model' && routeVal.length > 0)
                                        ? `<span class="text-[9px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded ml-2 font-bold whitespace-nowrap border border-blue-100">Dùng ở Tuyến ${app.utils.cleanText(routeVal)}</span>`
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
                    } catch (e) { console.log("Lỗi tải Top:", e); }
                },
                formatProfileDisplay: (profile) => {
                    if (!profile) return { username: 'Ẩn danh', avatar: DEFAULT_AVATAR, isBanned: false, id: '', linkId: '' };
                    let banInfo = null;
                    if (profile.ban_status) {
                        try { banInfo = typeof profile.ban_status === 'string' ? JSON.parse(profile.ban_status) : profile.ban_status; } catch(e){}
                    }
                    const isBanned = banInfo && (banInfo.banned === true || banInfo.banned === 'true');
                    const username = isBanned ? 'Người dùng bị cấm' : (profile.username || 'Ẩn danh');
                    const avatar = isBanned ? DEFAULT_AVATAR : (profile.avatar_url ? app.utils.getProxiedUrl(profile.avatar_url.replace(/"/g, ''), 'avatar.jpg', 'avatar') : DEFAULT_AVATAR);
                    return { username, avatar, isBanned, id: profile.id || '', linkId: profile.id || profile.username || '' };
                },
                getBadgesHTML: (userId, role, subroles = [], enableClick = false) => {
                    let html = '';
                    if (subroles && Array.isArray(subroles)) {
                        const vvccRole = subroles.find(s => s === 'vvcc' || s.startsWith('vvcc|'));
                        if (vvccRole) {
                            const link = vvccRole.includes('|') ? vvccRole.split('|')[1] : null;
                            const innerHtml = `<i class="fa-solid fa-check text-[9px]" style="line-height: 15px; display: block;"></i>`;
                            const styleStr = `background-color: black; color: white; padding: 0; width: 15px; height: 15px; border-radius: 50%; justify-content: center; align-items: center;${enableClick ? ' cursor: pointer;' : ''}`;
                            if (enableClick) {
                                html += `<span class="badge-shiny" style="${styleStr}" onclick="app.ui.showVerifiedPopup('vvcc', '${link ? app.utils.escapeHtml(link) : ''}')" title="Verified Content Creator">${innerHtml}</span>`;
                            } else {
                                html += `<span class="badge-shiny" style="${styleStr}" title="Verified Content Creator">${innerHtml}</span>`;
                            }
                        }
                        if (subroles.includes('dev')) {
                            const innerHtml = `<i class="fa-solid fa-code text-[9px]" style="line-height: 15px; display: block;"></i>`;
                            const styleStr = `background-color: black; color: white; padding: 0; width: 15px; height: 15px; border-radius: 50%; justify-content: center; align-items: center;${enableClick ? ' cursor: pointer;' : ''}`;
                            if (enableClick) {
                                html += `<span class="badge-shiny" style="${styleStr}" onclick="app.ui.showVerifiedPopup('dev', '')" title="VNBUSARCHIVE Code Contributor">${innerHtml}</span>`;
                            } else {
                                html += `<span class="badge-shiny" style="${styleStr}" title="VNBUSARCHIVE Code Contributor">${innerHtml}</span>`;
                            }
                        }
                        const vvbsRole = subroles.find(s => s === 'vvbs');
                        if (vvbsRole) {
                            const innerHtml = `<i class="fa-solid fa-check text-[9px]" style="line-height: 15px; display: block;"></i>`;
                            const styleStr = `background-color: #3b82f6; color: white; padding: 0; width: 15px; height: 15px; border-radius: 50%; justify-content: center; align-items: center;${enableClick ? ' cursor: pointer;' : ''}`;
                            if (enableClick) {
                                html += `<span class="badge-shiny" style="${styleStr}" onclick="app.ui.showVerifiedPopup('vvbs', '')" title="Verified Bus Staff">${innerHtml}</span>`;
                            } else {
                                html += `<span class="badge-shiny" style="${styleStr}" title="Verified Bus Staff">${innerHtml}</span>`;
                            }
                        }
                    }
                    
                    if (role === 'admin' || role === 'manager') {
                        const badgeClass = role === 'manager' ? 'badge-manager' : 'badge-admin';
                        const badgeText = role === 'manager' ? 'Quản lý' : 'Kiểm duyệt';
                        const badgeTitle = role === 'manager' ? 'Quản lý hệ thống (Quyền cao nhất)' : 'Kiểm duyệt viên';
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
                     const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
                     const vnTime = new Date(utc + (3600000 * 7));
                     let target = new Date(vnTime);
                     target.setHours(7, 0, 0, 0);
                     if (vnTime.getTime() < target.getTime()) {
                         target.setDate(target.getDate() - 1);
                     }
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
                if (session && session.user && !session.user.email_confirmed_at) {
                    document.getElementById('loading-screen').style.display = 'none';
                    if(document.getElementById('app-container')) document.getElementById('app-container').style.display = 'none';
                    app.auth.showVerificationModal(session.user.email);
                    return;
                }
                setTimeout(() => {
                    document.getElementById('loading-screen').style.display = 'none';
                    const appContainer = document.getElementById('app-container');
                    appContainer.style.display = 'block';
                    setTimeout(() => {
                        appContainer.style.opacity = '1';
                        if (!localStorage.getItem('vnbus_donate_toast_shown')) {
                            localStorage.setItem('vnbus_donate_toast_shown', 'true');
                            setTimeout(() => {
                                app.toast.show('heart', 'Website phi lợi nhuận', 'Không quảng cáo, không nguồn thu - VNBA duy trì bằng sự ủng hộ của các bạn. Nhấn vào đây để chia sẻ website nhé!', 0, async () => {
                                    const shareText = 'Web lưu trữ hình ảnh xe buýt/khách Việt Nam phi lợi nhuận https://www.vnbusarchive.io.vn';
                                    if (navigator.share) {
                                        try { await navigator.share({ text: shareText }); } catch (err) {}
                                    } else {
                                        try {
                                            await navigator.clipboard.writeText(shareText);
                                            app.toast.show('success', 'Đã copy', 'Thiết bị không hỗ trợ chia sẻ, đã copy nội dung!');
                                        } catch (e) {}
                                    }
                                });
                            }, 1000);
                        }
                    }, 50);
                }, 400);
                // Check if there is an error from OAuth linking
                if (window.location.hash.includes('error_description=')) {
                    const params = new URLSearchParams(window.location.hash.substring(1));
                    const errorDesc = params.get('error_description');
                    if (errorDesc && errorDesc.includes('already linked')) {
                        setTimeout(() => {
                            app.ui.showAlert("Tài khoản này đã được liên kết với một người dùng khác. Vui lòng sử dụng tài khoản khác.");
                            window.history.replaceState(null, null, window.location.pathname);
                        }, 500);
                    }
                }

                await app.setUser(session ? session.user : null);
                window.sb.auth.onAuthStateChange(async (event, session) => {
                        if (event === 'PASSWORD_RECOVERY') {
    if (window.location.hash.includes('type=recovery')) {
        app.auth.mode = 'recovery';
        if (window.location.pathname !== '/auth') {
            app.utils.navigate('/auth');
        } else {
            app.views.switch('auth', false);
        }
        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('set-auth-mode', { detail: 'recovery' }));
        }, 100);
    }
    return;
}
                        else if (event === 'USER_UPDATED') {
                            const hash = window.location.hash;
                            if (hash && hash.includes('type=email_change')) {
                                setTimeout(() => {
                                    app.ui.showAlert("Xác nhận đổi địa chỉ Email thành công!");
                                    window.history.replaceState(null, null, window.location.pathname);
                                }, 500);
                            }
                        }
                        else if (event === 'SIGNED_IN') {
                            const hash = window.location.hash;
                            if (hash && hash.includes('type=signup')) {
                                setTimeout(() => {
                                    app.ui.showAlert("Xác thực Email thành công! Chào mừng bạn đến với hệ thống.");
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
                let offlineTimer = null;
                window.addEventListener('offline', () => {
                    offlineTimer = setTimeout(() => {
                        document.body.classList.add('is-offline');
                        if (app.toast.currentOfflineToast) app.toast.currentOfflineToast(); 
                        app.toast.currentOfflineToast = app.toast.show('offline', 'Mất kết nối Internet', 'Bạn đang ngoại tuyến. Dữ liệu sẽ không thể đồng bộ.', 0);
                    }, 3000);
                });
                window.addEventListener('online', () => {
                    if (offlineTimer) clearTimeout(offlineTimer);
                    document.body.classList.remove('is-offline');
                    if (app.toast.currentOfflineToast) {
                        app.toast.currentOfflineToast(); 
                        app.toast.currentOfflineToast = null;
                        app.toast.show('success', 'Đã khôi phục kết nối', 'Mạng Internet đã hoạt động trở lại.', 5000);
                    }
                });
                window.addEventListener('beforeunload', (e) => {
                    if (app.currentViewMode === 'upload') {
                        app.upload.saveDraft();
                    }
                    if (app.upload && app.upload.isQueueProcessing) {
                        e.preventDefault();
                        e.returnValue = ''; 
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
                    if (formatHintEl) formatHintEl.innerText = "ĐỊNH DẠNG JPG, PNG, HEIC, RAW (TỐI ĐA 30MB)";
                } else {
                    const mobileAccept = "image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif";
                    if (upFileEl) upFileEl.accept = mobileAccept;
                    if (webrtcFileEl) webrtcFileEl.accept = mobileAccept;
                    if (formatHintEl) formatHintEl.innerText = "ĐỊNH DẠNG JPG, PNG, HEIC (RAW CHỈ TRÊN PC)";
                }
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
                        const fileInput = document.getElementById('up-file');
                        if (fileInput && fileInput.disabled) return;
                        dragCounter++;
                        if (dragCounter === 1) {
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
                                icon.style.color = '#000000'; 
                            }
                            if (iconContainer) {
                                iconContainer.style.backgroundColor = '#ffffff'; 
                                iconContainer.style.border = 'none';            
                                iconContainer.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'; 
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
                            const fileInput = document.getElementById('up-file');
                            if (fileInput && fileInput.disabled) return;
                            const dt = e.dataTransfer;
                            if (dt.files && dt.files.length > 0) {
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
                                const typeVal = document.getElementById('info-type')?.value;
                                const specialRoutes = ['Dừng hoạt động', 'Ngoài giờ hoạt động', 'Chưa hoạt động'];
                                // Gộp chung điều kiện Xe khách (coach) và Các tuyến đặc biệt
                                if (typeVal === 'coach' || specialRoutes.includes(this.value.trim())) {
                                    app.searchRedirect(this.value, fieldMap[id]);
                                } else {
                                    let provName = '';
                                    if (el.dataset.borrowed) {
                                        provName = el.dataset.borrowed.split(' - ')[1];
                                    } else {
                                        const plateValue = document.getElementById('info-plate')?.value;
                                        if (plateValue) provName = app.utils.getProvinceFromPlate(plateValue);
                                    }
                                    if (provName && provName !== 'Không xác định' && provName !== 'Biển tạm') {
                                        app.utils.navigate(`/route/${encodeURIComponent(provName)}/${encodeURIComponent(this.value)}`);
                                    } else {
                                        app.utils.navigate(`/route/${encodeURIComponent(this.value)}`);
                                    }
                                }
                            }
                            else {
                                app.searchRedirect(this.value, fieldMap[id]);
                            }
                        }
                    });
                });
                const elInfoModel = document.getElementById('info-model');
                if (elInfoModel) {
                    elInfoModel.addEventListener('click', function() {
                        if (this.readOnly && this.value && this.value !== '---' && this.value !== 'N/A') {
                            app.utils.navigate(`/model/${encodeURIComponent(this.value)}`);
                        }
                    });
                }
                const clearSearchInput = (inputEl, sugId) => {
                    inputEl.value = '';
                    document.getElementById(sugId).classList.remove('active');
                    app.search.triggerMainSuggestion('', inputEl.id, sugId);
                };
                document.getElementById('search-input').addEventListener('keydown', function (e) {
                    if (e.key === 'Enter') { document.getElementById('main-search-suggestions').classList.remove('active'); app.handleSearch(true, 'search-input'); }
                    if (e.key === 'Escape') clearSearchInput(e.target, 'main-search-suggestions');
                });
                document.getElementById('search-input').addEventListener('input', app.utils.debounce(function (e) {
                    const val = e.target.value;
                    const pageInp = document.getElementById('page-search-input');
                    if (pageInp && document.activeElement === e.target) pageInp.value = val;
                    app.search.triggerMainSuggestion(val.trim(), 'search-input', 'main-search-suggestions');
                }, 300));
                document.getElementById('search-input').addEventListener('focus', function (e) {
                    app.search.triggerMainSuggestion(e.target.value.trim(), 'search-input', 'main-search-suggestions');
                });
                const pageSearchInput = document.getElementById('page-search-input');
                if (pageSearchInput) {
                    pageSearchInput.addEventListener('keydown', function (e) {
                        if (e.key === 'Enter') { document.getElementById('page-search-suggestions').classList.remove('active'); app.handleSearch(true, 'page-search-input'); }
                        if (e.key === 'Escape') clearSearchInput(e.target, 'page-search-suggestions');
                    });
                    pageSearchInput.addEventListener('input', app.utils.debounce(function (e) {
                        const val = e.target.value;
                        const headerInp = document.getElementById('search-input');
                        if (headerInp && document.activeElement === e.target) headerInp.value = val;
                        app.search.triggerMainSuggestion(val.trim(), 'page-search-input', 'page-search-suggestions');
                    }, 300));
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
                    const advSugBox = document.getElementById('adv-filter-suggestions');
                    const advInputContainer = document.getElementById('adv-filter-value-container');
                    if (advSugBox && advInputContainer && !advSugBox.contains(e.target) && !advInputContainer.contains(e.target)) {
                        advSugBox.classList.remove('active');
                    }
                    const userMenuDropdown = document.getElementById('user-dropdown');
                    const userMenuContainer = document.getElementById('user-menu-container');
                    if (userMenuDropdown && userMenuContainer && !userMenuDropdown.contains(e.target) && !userMenuContainer.contains(e.target)) {
                        app.ui.toggleUserMenu(false);
                    }
                });

                app.utils.loadAnnouncements();
                app.utils.fetchTopUploaders();
                app.initRealtimeChannel = () => {
                    if (app.realtimeChannel) {
                    window.sb.removeChannel(app.realtimeChannel);
                }
                let channel = window.sb.channel('global-changes')
                    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'photos', filter: 'status=eq.approved' }, payload => {
                        if (app.currentViewMode === 'home') {
                            const now = Date.now();
                            if (app._lastHomeRealtimeReload && now - app._lastHomeRealtimeReload < 30000) return;
                            if (app._isUserScrolling) return;
                            app._lastHomeRealtimeReload = now;
                            app.views.loadHome(true);
                        }
                    });
                if (app.role === 'admin' || app.role === 'manager') {
                    channel = channel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'admin_notes' }, payload => {
                        if (payload.new && payload.new.id === 1) {
                            const noteEl = document.getElementById('adm-board-note');
                            if (noteEl && document.activeElement !== noteEl) {
                                noteEl.value = payload.new.content || '';
                            }
                        }
                    })
                    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_notes' }, payload => {
                        if (payload.new && payload.new.id === 1) {
                            const noteEl = document.getElementById('adm-board-note');
                            if (noteEl && document.activeElement !== noteEl) {
                                noteEl.value = payload.new.content || '';
                            }
                        }
                    });
                }
                channel = channel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'photos' }, payload => {
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
                                        content.innerHTML = '<p class="p-4">Không có ảnh nào chờ duyệt.</p>';
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
                                    content.innerHTML = '<p class="p-4">Không có ảnh nào chờ duyệt.</p>';
                                }
                            }, 350);
                            if (app.admin && app.admin.refreshCounts) app.admin.refreshCounts();
                        }
                    });
                if (app.role === 'admin' || app.role === 'manager') {
                    channel = channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'photos', filter: 'status=eq.pending' }, async payload => {
                        if (app.adminTab === 'photos' && (app.role === 'admin' || app.role === 'manager') && payload.new && payload.new.id) {
                            try {
                                const { data: newPhoto } = await window.sb.from('photos').select('*, profiles(username, role), vehicles(model)').eq('id', payload.new.id).maybeSingle();
                                if (newPhoto && !document.getElementById(`adm-photo-card-${newPhoto.id}`)) {
                                    await app.utils.resolveSandboxUrls([newPhoto]);
                                    const content = document.getElementById('admin-content');
                                    if (content && app.admin && app.admin.renderSinglePhotoCardHTML) {
                                        const noDataMsg = content.querySelector('p');
                                        if (noDataMsg && noDataMsg.innerText.includes('Không có ảnh nào')) {
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
                                            const { data: oData } = await window.sb.from('operator_info').select('operator_name').ilike('operator_name', opKey).limit(1);
                                            const { data: pData } = await window.sb.from('photos').select('operator').eq('status', 'approved').ilike('operator', opKey).limit(1);
                                            if ((oData && oData.length > 0) || (pData && pData.length > 0)) opSet.add(opKey);
                                        }
                                        const routeKey = app.utils.cleanText(newPhoto.route_no || '').trim().toLowerCase();
                                        if (routeKey && routeKey !== '---' && !routeSet.has(routeKey)) {
                                            const stripped = routeKey.replace(/^tuyến\s+/i, '').trim();
                                            const variants = [...new Set([routeKey, stripped, 'tuyến ' + stripped])];
                                            if (/^\d+$/.test(stripped)) {
                                                const num = String(parseInt(stripped, 10));
                                                const pad = stripped.padStart(2, '0');
                                                variants.push(num, pad, 'tuyến ' + num, 'tuyến ' + pad);
                                            }
                                            const { data: pData } = await window.sb.from('photos').select('route_no').eq('status', 'approved').in('route_no', variants).limit(1);
                                            if (pData && pData.length > 0) {
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
                    });
                }
                channel = channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'vehicles' }, payload => {
                        const upPlate = document.getElementById('up-plate');
                        if (document.getElementById('upload').classList.contains('active') && upPlate && upPlate.value) {
                            if (upPlate.value.replace(/[^A-Z0-9]/gi, '').toUpperCase() === payload.new.license_plate) {
                                app.upload.checkPlate(upPlate.value);
                            }
                        }
                    })
                    .subscribe((status, err) => {
                        if (status === 'SUBSCRIBED') {
                            console.log('🔌 Connected to Realtime');
                            app.setRealtimeStatus(true);
                        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
                            console.error('🔌 Realtime Error:', err);
                            app.setRealtimeStatus(false);
                        }
                    });
                app.realtimeChannel = channel;
                };
                app.initRealtimeChannel();
                
                window.app.checkVersion = async () => {
                    try {
                        if (!window.APP_VERSION) return;
                        const res = await fetch(`https://raw.githubusercontent.com/hoyuuna/VNBUSARCHIVE/refs/heads/main/version.json?t=${Date.now()}`);
                        if (res.ok) {
                            const data = await res.json();
                            if (data.version && data.version > window.APP_VERSION) {
                                const msg = `Web đã có phiên bản <b>${data.version}</b> mới!<br><span class="text-xs text-gray-500">(Bạn đang ở ${window.APP_VERSION}).</span><br>Hãy tải lại trang để trải nghiệm các cập nhật mới nhất!`;
                                app.ui.showAlert(msg, () => {
                                    window.location.href = window.location.pathname + '?v=' + Date.now();
                                }, null, { 
                                    title: "Cập nhật", 
                                    btnOkText: '<i class="fa-solid fa-rotate-right mr-1"></i> Tải lại trang',
                                    iconHtml: '<i class="fa-solid fa-cloud-arrow-down text-xl text-black"></i>'
                                });
                            }
                        }
                    } catch(e) {}
                };
                
                window.addEventListener('visibilitychange', () => {
                    if (document.visibilityState === 'visible') {
                        if (!app.isReinitializing) {
                            app.reinitializeComponents();
                        }
                        const state = (app.realtimeChannel?.state || '').toLowerCase();
                        if (state !== 'joined' && state !== 'joining') {
                            console.log('🔄 Tab visible: Reconnecting Realtime...');
                            app.setRealtimeStatus(false);
                            if (typeof app.initRealtimeChannel === 'function') app.initRealtimeChannel();
                        }
                        if (typeof app.checkVersion === 'function') app.checkVersion();
                    }
                });
                
                setInterval(() => { if (typeof app.checkVersion === 'function') app.checkVersion(); }, 30 * 60 * 1000);
                window.addEventListener('offline', () => app.setRealtimeStatus(false));
                window.addEventListener('online', () => {
                    const state = (app.realtimeChannel?.state || '').toLowerCase();
                    if (app.realtimeChannel && state !== 'joined' && state !== 'joining') {
                        app.setRealtimeStatus(false);
                        if (typeof app.initRealtimeChannel === 'function') app.initRealtimeChannel();
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
                app.loadingBar.start(); 
                app.utils.cleanupState();
                if (app.utils && app.utils.updateCanonical) app.utils.updateCanonical();
                const path = window.location.pathname;
                const searchParams = new URLSearchParams(window.location.search);
                app.currentPathForScroll = path + window.location.search;
                if (path === '/login' && searchParams.get('qr')) {
                    app.views.switch('home', false);
                    setTimeout(() => app.qrLogin.initClient(searchParams.get('qr')), 500);
                } else if (path === '/auth') {
                    document.title = 'Xác thực | VNBUSARCHIVE';
                    const isRecovery = window.location.hash.includes('type=recovery') || app.auth.mode === 'recovery';
                    if (app.user && !isRecovery) app.utils.navigate('/');
                    else app.views.switch('auth', false);
                } else if (path === '/setting' || path === '/settings') {
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
                    app.views.loadAccount();
                } else if (path.startsWith('/user/')) {
                    const username = decodeURIComponent(path.split('/')[2]);
                    if (username) {
                        app.views.loadAccount(username);
                    } else app.views.loadHome();
                } else if (path === '/upload') {
                    document.title = 'Đăng tải ảnh | VNBUSARCHIVE';
                    app.views.switch('upload', false);
                } else if (path === '/mobile-upload') {
                    document.title = 'Tải ảnh từ thiết bị | VNBUSARCHIVE';
                    app.views.switch('mobile-upload', false);
                } else if (path === '/admin') {
                    document.title = 'Quản trị hệ thống | VNBUSARCHIVE';
                    app.views.switch('admin', false);
                    app.admin.refreshCounts();
                    app.admin.loadTab(app.adminTab);
                } else if (path === '/contact') {
                    app.views.loadContact();
                } else if (path === '/leaderboard') {
                    document.title = 'Bảng xếp hạng đóng góp | VNBUSARCHIVE';
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
                        app.views.loadDetail(id);
                    }
                } else if (path.startsWith('/vehicle/')) {
                    const plate = decodeURIComponent(path.split('/')[2]);
                    if (plate) {
                        app.views.loadVehiclePage(plate);
                    } else app.views.loadHome();
                } else if (path.startsWith('/operator/')) {
                    const operatorName = decodeURIComponent(path.substring('/operator/'.length));
                    if (operatorName) {
                        app.views.loadOperatorPage(operatorName);
                    } else app.views.loadHome();
                } else if (path.startsWith('/model/')) {
                    const modelName = decodeURIComponent(path.substring('/model/'.length));
                    if (modelName) {
                        app.model.loadModelPage(modelName);
                    } else app.views.loadHome();
                } else if (path.startsWith('/route/')) {
                    const segments = path.split('/');
                    if (segments.length === 4) {
                        const province = decodeURIComponent(segments[2]);
                        const routeNo = decodeURIComponent(segments[3]);
                        app.route.loadRoutePage(province, routeNo);
                    } else if (segments.length === 3) {
                        const routeNo = decodeURIComponent(segments[2]);
                        app.route.loadRoutePage('', routeNo);
                    } else app.views.loadHome();

                } else if (path.startsWith('/search')) {
                    document.title = 'Tìm kiếm | VNBUSARCHIVE';
                    const q = searchParams.get('q');
                    let filter = searchParams.get('filter') || 'all';
                    if (filter === 'absolute_route') filter = 'route'; 
                    app.search.setFilter(filter, false);
                    if (filter === 'route') {
                        app.search.syncExactUI(searchParams.get('prefix') || '');
                    }
                    const fParams = searchParams.getAll('f');
                    if (fParams && fParams.length > 0) {
                        app.search.advancedFilters = fParams.map(fp => {
                            const parts = decodeURIComponent(fp).split(':');
                            if (parts.length === 3) {
                                const fMap = app.search.FIELD_CONFIGS || {};
                                const fieldCfg = fMap[parts[0]] || { label: parts[0] };
                                const opMap = { 'eq': '= Bằng', 'neq': '≠ Khác', 'ilike': 'Chứa', 'not_ilike': 'Không chứa', 'gt': '> Sau', 'gte': '≥ Từ', 'lt': '< Trước', 'lte': '≤ Đến' };
                                let valDisplay = parts[2];
                                if (parts[0] === 'type') valDisplay = parts[2] === 'bus' ? 'Xe Buýt' : 'Xe Khách';
                                return {
                                    id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
                                    field: parts[0],
                                    fieldLabel: fieldCfg.label || parts[0],
                                    op: parts[1],
                                    opLabel: opMap[parts[1]] || parts[1],
                                    value: parts[2],
                                    displayVal: valDisplay
                                };
                            }
                            return null;
                        }).filter(Boolean);
                    } else if (filter !== 'advanced') {
                        app.search.advancedFilters = [];
                    }
                    const hasAdvanced = filter === 'advanced' || (fParams && fParams.length > 0) || (app.search.advancedFilters && app.search.advancedFilters.length > 0);
                    if (q !== null || hasAdvanced || searchParams.has('q')) {
                        const decodedQ = q ? decodeURIComponent(q) : '';
                        const headerInp = document.getElementById('search-input');
                        const pageInp = document.getElementById('page-search-input');
                        if (headerInp) headerInp.value = decodedQ;
                        if (pageInp) pageInp.value = decodedQ;
                        app.views.switch('search', false); 
                        if (typeof app.search.renderAdvancedFilterChips === 'function') {
                            app.search.renderAdvancedFilterChips();
                        }
                        app.handleSearch(false);
                    } else {
                        app.views.loadHome();
                    }
                } else {
                    app.views.switch('home', false);
                    app.views.loadHome();
                }
                app.utils.updateBreadcrumbs();
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
                        { text: "Tùy chỉnh hồ sơ", tab: "profile", parent: "account", icon: "fa-user-pen" },
                        { text: "Avatar", tab: "profile", parent: "account", icon: "fa-user-pen" },
                        { text: "Đổi tên", tab: "profile", parent: "account", icon: "fa-user-pen" },
                        { text: "Bảo mật", tab: "security", parent: "account", icon: "fa-shield-halved" },
                        { text: "Mật khẩu", tab: "security", parent: "account", icon: "fa-shield-halved" },
                        { text: "Email", tab: "security", parent: "account", icon: "fa-shield-halved" },
                        { text: "Mã định danh (UUID)", tab: "security", parent: "account", icon: "fa-shield-halved" },
                        { text: "Liên kết tài khoản", tab: "links", parent: "account", icon: "fa-link" },
                        { text: "Google", tab: "links", parent: "account", icon: "fa-link" },
                        { text: "Discord", tab: "links", parent: "account", icon: "fa-link" },
                        { text: "Danh hiệu", tab: "badges", parent: "main", icon: "fa-medal" },
                        { text: "Role", tab: "badges", parent: "main", icon: "fa-discord" },
                        { text: "Cá nhân hóa", tab: "preference", parent: "main", icon: "fa-layer-group" },
                        { text: "Xe buýt", tab: "preference", parent: "main", icon: "fa-layer-group" },
                        { text: "Xe khách", tab: "preference", parent: "main", icon: "fa-layer-group" },
                        { text: "Gợi ý thông minh", tab: "preference", parent: "main", icon: "fa-layer-group" },
                        { text: "Cài đặt thông báo", tab: "notifications", parent: "account", icon: "fa-bell" },
                        { text: "Bật tắt thông báo", tab: "notifications", parent: "account", icon: "fa-bell" },
                        { text: "Tài liệu", tab: "docs-intro", parent: "docs", icon: "fa-markdown" },
                        { text: "Giới thiệu hệ thống", tab: "docs-intro", parent: "docs", icon: "fa-markdown" },
                        { text: "Quy định", tab: "docs-requirements", parent: "docs", icon: "fa-list-check" },
                        { text: "Kiểm duyệt", tab: "docs-requirements", parent: "docs", icon: "fa-list-check" },
                        { text: "Chính sách bảo mật", tab: "docs-policy", parent: "docs", icon: "fa-shield" },
                        { text: "Tiêu chuẩn bình luận", tab: "docs-chatrule", parent: "docs", icon: "fa-comments" },
                        { text: "Quy tắc bình luận", tab: "docs-chatrule", parent: "docs", icon: "fa-comments" },
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
                        box.innerHTML = `<div class="p-4 text-xs text-gray-500 text-center"><i class="fa-solid fa-magnifying-glass mr-1"></i> Không tìm thấy cài đặt nào phù hợp.</div>`;
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
                    }
                },
                open: async (targetTab = null, targetParent = null) => {
                    const modal = document.getElementById('settings-modal');
                    const content = document.getElementById('settings-content');
                    app.ui.toggleUserMenu(false);
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
                            if (t.startsWith('docs-')) {
                                app.docs.fetchContent(t);
                            } else if (t === 'X') {
                            } else if (t === 'preference') {
                                app.preference.tempSelection = app.preference.current || 'both';
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
                    if (tab === 'badges') {
                        app.settings.loadBadges();
                        app.settings.loadWebBadges();
                    }
                },
                loadDiscordVerifyStatus: async () => {
                    const actionBtn = document.getElementById('discord-verify-action');
                    if (!actionBtn) return;
                    actionBtn.innerHTML = `<button disabled class="px-4 py-2 bg-gray-200 text-gray-400 text-xs font-bold rounded cursor-not-allowed border border-gray-300 whitespace-nowrap"><i class="fa-solid fa-spinner fa-spin"></i></button>`;
                    try {
                        const { data: { session } } = await window.sb.auth.getSession();
                        if (!session) return;
                        const { count } = await window.sb.from('photos').select('*', { count: 'estimated', head: true }).eq('uploader_id', app.user.id).eq('status', 'approved');
                        const res = await fetch('/api/discord', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                            body: JSON.stringify({ action: 'status' })
                        });
                        const data = await res.json();
                        if (!data.linked) {
                            actionBtn.innerHTML = `<button onclick="app.settings.jumpTo('badges', 'main')" class="px-4 py-2 bg-black text-white text-xs font-bold rounded hover:bg-gray-800 transition shadow-sm border border-black whitespace-nowrap">Liên kết Discord</button>`;
                            return;
                        }
                        if (!data.inServer) {
                            actionBtn.innerHTML = `<a href="https://discord.com/invite/BNWyqbuvwq" target="_blank" class="px-4 py-2 bg-[#5865F2] text-white text-xs font-bold rounded hover:bg-[#4752C4] transition shadow-sm border border-[#5865F2] whitespace-nowrap inline-block text-center">Tham gia Server</a>`;
                            return;
                        }
                        const isClaimed = data.claimedRoles && data.claimedRoles.includes('1519296926477058203');
                        const isEligible = (count || 0) >= 1;
                        if (isClaimed) {
                            actionBtn.innerHTML = `<button disabled class="px-4 py-2 bg-gray-100 text-gray-400 text-xs font-bold rounded cursor-not-allowed border border-gray-200 whitespace-nowrap"><i class="fa-solid fa-check mr-1"></i> Đã xác minh</button>`;
                        } else if (isEligible) {
                            actionBtn.innerHTML = `<button id="btn-claim-discord-1" onclick="app.settings.claimDiscordVerify()" class="px-4 py-2 bg-black text-white text-xs font-bold rounded hover:bg-gray-800 transition shadow-sm border border-black whitespace-nowrap">Xác minh ngay</button>`;
                        } else {
                            actionBtn.innerHTML = `<button disabled class="px-4 py-2 bg-gray-50 text-gray-400 text-xs font-bold rounded cursor-not-allowed border border-gray-200 whitespace-nowrap"><i class="fa-solid fa-lock mr-1"></i> Chưa đủ đ/k</button>`;
                        }
                    } catch (err) {
                        actionBtn.innerHTML = `<p class="text-xs text-red-500">Lỗi: ${err.message}</p>`;
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
                            app.ui.showAlert(data.message || 'Xác minh Discord thành công!');
                            app.settings.loadDiscordVerifyStatus();
                        } else {
                            app.ui.showAlert(data.error || 'Lỗi xác minh.');
                            app.settings.loadDiscordVerifyStatus();
                        }
                    } catch (err) {
                        app.ui.showAlert('Lỗi: ' + err.message);
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
                                        <p class="text-[10px] ${isLinked ? 'text-green-600 font-bold' : 'text-gray-500'}">${isLinked ? '<i class="fa-solid fa-check mr-1"></i> Đã liên kết' : 'Chưa liên kết'}</p>
                                    </div>
                                </div>
                                <div>
                                    ${isLinked
                                        ? `<button onclick="app.settings.unlinkIdentity('${identityId}', '${name}')" class="w-full sm:w-auto text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-4 py-2 rounded-md hover:bg-red-100 transition shadow-sm">Hủy liên kết</button>`
                                        : `<button onclick="app.settings.linkIdentity('${providerKey}')" class="w-full sm:w-auto text-xs font-bold text-black bg-white border border-black px-4 py-2 rounded-md hover:bg-gray-100 transition shadow-sm">Thêm liên kết</button>`
                                    }
                                </div>
                            </div>
                            `;
                        };
                        container.innerHTML =
                            renderProvider('Google', 'fa-brands fa-google', 'bg-red-500', 'google') +
                            renderProvider('Discord', 'fa-brands fa-discord', 'bg-[#5865F2]', 'discord') +
                            renderProvider('GitHub', 'fa-brands fa-github', 'bg-[#24292e]', 'github');
                    } catch (err) {
                        container.innerHTML = `<p class="text-xs text-red-500">Lỗi lấy thông tin liên kết: ${err.message}</p>`;
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
                        app.ui.showAlert("Lỗi liên kết: " + err.message);
                    }
                },
                unlinkIdentity: async (identityId, providerName) => {
                    app.ui.showAlert(
                        `Bạn có chắc chắn muốn hủy liên kết tài khoản ${providerName}? Bạn sẽ không thể đăng nhập bằng nền tảng này nữa. Nếu đã được cấp danh hiệu thông qua nền tảng này, chúng cũng sẽ bị thu hồi.`,
                        async () => {
                            try {
                                const { data: { session } } = await window.sb.auth.getSession();
                                if (!session) throw new Error("Chưa đăng nhập");

                                // Call backend API to revoke roles/badges before unlinking
                                const apiRes = await fetch('/api/unlink', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${session.access_token}`
                                    },
                                    body: JSON.stringify({ provider: providerName.toLowerCase() })
                                });
                                
                                if (!apiRes.ok) {
                                    const apiData = await apiRes.json();
                                    console.error("Lỗi thu hồi quyền backend:", apiData.error);
                                    // Vẫn tiếp tục thực hiện unlink Identity dù backend có lỗi
                                }

                                const { error } = await window.sb.auth.unlinkIdentity({ identity_id: identityId });
                                if (error) throw error;

                                app.ui.showAlert(`Đã hủy liên kết với ${providerName} thành công!`);
                                app.settings.loadIdentities();
                            } catch (err) {
                                app.ui.showAlert("Lỗi hủy liên kết: " + err.message);
                            }
                        },
                        () => {},
                        { btnOkText: "Hủy liên kết", btnCancelText: "Đóng", title: "Xác nhận" }
                    );
                },
                claimWebBadge: async () => {
                    const btn = document.getElementById('web-req-claim-action');
                    if (btn) btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;
                    try {
                        const { data: { session } } = await window.sb.auth.getSession();
                        const res = await fetch('/api/github', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                            body: JSON.stringify({ action: 'claim' })
                        });
                        const data = await res.json();
                        if (res.ok) {
                            app.ui.showAlert(data.message || 'Nhận danh hiệu thành công!');
                            app.settings.loadWebBadges();
                        } else {
                            app.ui.showAlert(data.error || 'Lỗi nhận danh hiệu.');
                            app.settings.loadWebBadges();
                        }
                    } catch (err) {
                        app.ui.showAlert('Lỗi: ' + err.message);
                        app.settings.loadWebBadges();
                    }
                },
                loadWebBadges: async () => {
                    const loading = document.getElementById('web-badge-loading');
                    const claimBox = document.getElementById('web-badge-claim-list');
                    
                    if (loading) loading.classList.remove('hidden');
                    if (claimBox) claimBox.classList.add('hidden');
                    
                    try {
                        const { data: { session } } = await window.sb.auth.getSession();
                        if (!session) return;
                        
                        const res = await fetch('/api/github', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                            body: JSON.stringify({ action: 'status' })
                        });
                        const data = await res.json();
                        
                        if (loading) loading.classList.add('hidden');
                        if (claimBox) claimBox.classList.remove('hidden');
                        
                        const claimActionContainer = document.getElementById('web-req-claim-action-container');
                        
                        if (data.isDev) {
                            if (claimActionContainer) {
                                claimActionContainer.innerHTML = `<button disabled class="px-4 py-2 bg-gray-100 text-gray-400 text-xs font-bold rounded cursor-not-allowed border border-gray-200 whitespace-nowrap"><i class="fa-solid fa-check mr-1"></i> Đã nhận</button>`;
                            }
                            return;
                        }
                        
                        if (data.linked) {
                            if (claimActionContainer) {
                                claimActionContainer.innerHTML = `<button id="web-req-claim-action" onclick="app.settings.claimWebBadge()" class="px-4 py-2 bg-black text-white text-xs font-bold rounded hover:bg-gray-800 transition shadow-sm whitespace-nowrap w-full sm:w-auto">Xác minh ngay</button>`;
                            }
                        } else {
                            if (claimActionContainer) {
                                claimActionContainer.innerHTML = `<button onclick="app.settings.switchTab('links')" class="px-4 py-2 bg-black text-white text-xs font-bold rounded hover:bg-gray-800 transition shadow-sm whitespace-nowrap w-full sm:w-auto">Liên kết GitHub</button>`;
                            }
                        }
                    } catch (err) {
                        if (loading) {
                            loading.innerHTML = `<p class="text-xs text-red-500">Lỗi: ${err.message}</p>`;
                            loading.classList.remove('hidden');
                        }
                    }
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
                        if (!token) throw new Error("Chưa đăng nhập");
                        const res = await fetch('/api/discord', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ action: 'status' })
                        });
                        const data = await res.json();
                        app.customRoleDetails = data.customRoleDetails || null;
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
                                reqLinkStatus.innerHTML = `<i class="fa-solid fa-check-circle w-5 text-center text-green-600"></i> <span>Đã liên kết tài khoản Discord</span>`;
                                reqLinkAction.classList.add('hidden');
                            } else {
                                reqLinkContainer.classList.add(...incompleteClasses);
                                reqLinkContainer.classList.remove(...completeClasses);
                                reqLinkStatus.className = 'flex items-center gap-3 text-sm font-medium text-red-800';
                                reqLinkStatus.innerHTML = `<i class="fa-solid fa-times-circle w-5 text-center text-red-600"></i> <span>Chưa liên kết tài khoản Discord</span>`;
                                reqLinkAction.classList.remove('hidden');
                            }
                            if (data.inServer) {
                                reqServerContainer.classList.add(...completeClasses);
                                reqServerContainer.classList.remove(...incompleteClasses);
                                reqServerStatus.className = 'flex items-center gap-3 text-sm font-medium text-green-800';
                                reqServerStatus.innerHTML = `<i class="fa-solid fa-check-circle w-5 text-center text-green-600"></i> <span>Đã tham gia Server</span>`;
                                reqServerAction.classList.add('hidden');
                            } else {
                                reqServerContainer.classList.add(...incompleteClasses);
                                reqServerContainer.classList.remove(...completeClasses);
                                reqServerStatus.className = 'flex items-center gap-3 text-sm font-medium text-red-800';
                                reqServerStatus.innerHTML = `<i class="fa-solid fa-times-circle w-5 text-center text-red-600"></i> <span>Chưa tham gia Server VNBUSARCHIVE</span>`;
                                reqServerAction.classList.remove('hidden');
                            }
                            return;
                        }
                        const { count } = await window.sb.from('photos')
                            .select('*', { count: 'estimated', head: true })
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
const tiers = [50, 100, 200, 500, 1000, 2000];
const grid = document.getElementById('badges-grid');
grid.innerHTML = tiers.map(tier => {
    if (tier === 2000) {
        const hasCustomRole = !!data.customRoleId;
        const isEligible = (count || 0) >= 2000;
        let btnHtml = '';
        if (hasCustomRole) {
            btnHtml = `<button onclick="app.openCustomRolePrompt(true)" class="px-4 py-2 bg-gray-100 text-gray-800 text-xs font-bold rounded-md border border-gray-300 hover:bg-gray-200 transition whitespace-nowrap"><i class="fa-solid fa-pen mr-1"></i> Sửa Role</button>`;
        } else if (isEligible) {
            btnHtml = `<button onclick="app.openCustomRolePrompt(false)" class="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-md hover:opacity-90 transition shadow-sm whitespace-nowrap">Tạo Role Riêng</button>`;
        } else {
            btnHtml = `<button disabled class="px-4 py-2 bg-gray-50 text-gray-400 text-xs font-bold rounded cursor-not-allowed border border-gray-200 whitespace-nowrap"><i class="fa-solid fa-lock mr-1"></i> Chưa đủ đ/k</button>`;
        }
        return `
        <div class="flex items-center justify-between p-3 border border-purple-200 rounded-md bg-purple-50">
            <div class="flex items-center gap-3 overflow-hidden">
                <div class="w-10 h-10 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center text-lg text-purple-600 shrink-0">
                    <i class="fa-solid fa-wand-magic-sparkles"></i>
                </div>
                <div class="overflow-hidden">
                    <p class="font-bold text-sm text-purple-900 truncate">Cột mốc 2000 ảnh</p>
                    <p class="text-[10px] text-purple-700">Đặc quyền tạo Role Custom riêng biệt.</p>
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
        btnHtml = `<button disabled class="px-4 py-2 bg-gray-100 text-gray-400 text-xs font-bold rounded cursor-not-allowed border border-gray-200 whitespace-nowrap"><i class="fa-solid fa-check mr-1"></i> Đã nhận</button>`;
    } else if (isEligible) {
        btnHtml = `<button id="btn-claim-${tier}" onclick="app.settings.claimBadge(${tier})" class="px-4 py-2 bg-black text-white text-xs font-bold rounded hover:bg-gray-800 transition shadow-sm border border-black whitespace-nowrap">Nhận Role</button>`;
    } else {
        btnHtml = `<button disabled class="px-4 py-2 bg-gray-50 text-gray-400 text-xs font-bold rounded cursor-not-allowed border border-gray-200 whitespace-nowrap"><i class="fa-solid fa-lock mr-1"></i> Chưa đủ đ/k</button>`;
    }
    return `
    <div class="flex items-center justify-between p-3 border border-gray-200 rounded-md bg-white">
        <div class="flex items-center gap-3 overflow-hidden">
            <div class="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-lg text-black shrink-0">
                <i class="fa-solid fa-medal"></i>
            </div>
            <div class="overflow-hidden">
                <p class="font-bold text-sm text-gray-800 truncate">Cột mốc ${tier} ảnh</p>
                <p class="text-[10px] text-gray-500">Yêu cầu: Đóng góp ${tier}+ ảnh được duyệt.</p>
            </div>
        </div>
        <div>${btnHtml}</div>
    </div>`;
}).join('');
                        loading.classList.add('hidden');
                        claimBox.classList.remove('hidden');
                    } catch (err) {
                        loading.innerHTML = `<span class="text-red-500"><i class="fa-solid fa-triangle-exclamation"></i> Lỗi: ${err.message}</span>`;
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
                        if (!res.ok) throw new Error(data.error || 'Lỗi không xác định');
                        app.toast.show('success', 'Thành công', data.message || "Đã nhận Role thành công!");
                        app.settings.loadBadges();
                    } catch (err) {
                        app.ui.showAlert("Lỗi: " + err.message);
                        btn.innerHTML = originalText;
                        btn.disabled = false;
                    }
}
                }
});
Object.assign(window.app, {
  openCustomRolePrompt: (hasCustomRole = false) => {
                    const modal = document.getElementById('custom-role-modal');
                    const content = document.getElementById('custom-role-content');
                    const okBtn = document.getElementById('cr-ok-btn');
                    const deleteBtn = document.getElementById('cr-delete-btn');
                    if (deleteBtn) {
                        deleteBtn.classList.toggle('hidden', !hasCustomRole);
                    }
                    const nameInput = document.getElementById('cr-name-input');
                    const colorInput = document.getElementById('cr-color-input');
                    if (hasCustomRole && app.customRoleDetails) {
                        if (nameInput) nameInput.value = app.customRoleDetails.name || '';
                        if (colorInput) colorInput.value = app.customRoleDetails.color || '#000000';
                    } else {
                        if (nameInput) nameInput.value = '';
                        if (colorInput) colorInput.value = '#000000';
                    }
                    app.ui.lockScroll();
                    if (deleteBtn) {
                        deleteBtn.onclick = () => {
                            app.ui.showAlert("Bạn có chắc chắn muốn xóa Custom Role này không? Hành động này không thể hoàn tác.", async () => {
                                const originalDelText = deleteBtn.innerHTML;
                                deleteBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                                deleteBtn.disabled = true;
                                okBtn.disabled = true;
                                try {
                                    const { data: { session } } = await window.sb.auth.getSession();
                                    const token = session?.access_token;
                                    const res = await fetch('/api/discord', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                        body: JSON.stringify({ action: 'delete', tier: 2000 })
                                    });
                                    const data = await res.json();
                                    if (!res.ok) throw new Error(data.error || 'Lỗi không xác định');
                                    app.ui.closeCustomRolePrompt();
                                    app.toast.show('success', 'Thành công', data.message || "Đã xóa Role thành công!");
                                    app.settings.loadBadges();
                                } catch (err) {
                                    app.ui.showAlert("Lỗi: " + err.message);
                                } finally {
                                    deleteBtn.innerHTML = originalDelText;
                                    deleteBtn.disabled = false;
                                    okBtn.disabled = false;
                                }
                            }, () => {}, { title: "Xác nhận xóa Role", btnCancelText: "Hủy bỏ", btnOkText: "Xóa" });
                        };
                    }
                    okBtn.onclick = async () => {
                        const name = document.getElementById('cr-name-input').value.trim();
                        const color = document.getElementById('cr-color-input').value.trim();
                        if (!name || name.length < 2) return app.ui.showAlert("Tên Role phải từ 2 ký tự trở lên!");
                        if (!color.match(/^#[0-9A-Fa-f]{6}$/)) return app.ui.showAlert("Mã màu Hex không hợp lệ!");
                        const originalText = okBtn.innerHTML;
                        okBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                        okBtn.disabled = true;
                        if (deleteBtn) deleteBtn.disabled = true;
                        try {
                            const { data: { session } } = await window.sb.auth.getSession();
                            const token = session?.access_token;
                            const res = await fetch('/api/discord', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                body: JSON.stringify({ action: 'claim', tier: 2000, customName: name, customColor: color })
                            });
                            const data = await res.json();
                            if (!res.ok) throw new Error(data.error || 'Lỗi không xác định');
                            app.ui.closeCustomRolePrompt();
                            app.toast.show('success', 'Thành công', data.message || "Tạo/Sửa Role thành công!");
                            app.settings.loadBadges();
                        } catch (err) {
                            app.ui.showAlert("Lỗi: " + err.message);
                        } finally {
                            okBtn.innerHTML = originalText;
                            okBtn.disabled = false;
                            if (deleteBtn) deleteBtn.disabled = false;
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
                        if (!res.ok) throw new Error('Lỗi mạng');
                        const text = await res.text();
                        const html = DOMPurify.sanitize(marked.parse(text));
                        container.innerHTML = html;
                        container.dataset.loaded = 'true';
                    } catch (e) {
                        container.innerHTML = `
                            <p class="text-red-500 font-bold py-4 text-center"><i class="fa-solid fa-triangle-exclamation"></i> Không thể tải nội dung tự động.</p>
                            <div class="text-center mt-2">
                                <a href="${url.replace('raw.githubusercontent.com/hoyuuna', 'github.com/hoyuuna').replace('/refs/heads/', '/blob/')}" target="_blank" class="inline-flex items-center gap-1.5 bg-black text-white px-4 py-2 rounded-md font-bold hover:bg-gray-800 transition text-[11px] uppercase">
                                    <i class="fa-solid fa-arrow-up-right-from-square text-sm"></i> Xem chi tiết
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
                            app.search.syncExactUI(autoPrefix); 
                        }
                    }
                }
                const clearBtn = document.getElementById('btn-clear-search');
                const pageClearBtn = document.getElementById('btn-page-clear-search');
                const filterType = app.currentFilter;
                const hasProvinceFilter = Boolean(app.search?.currentExactPrefix || app.search?.currentExactProvName);
                const hasAdvancedFilters = filterType === 'advanced' && app.search.advancedFilters && app.search.advancedFilters.length > 0;
                if (!query && !hasProvinceFilter && !hasAdvancedFilters) {
                    if (clearBtn) clearBtn.classList.add('hidden');
                    if (pageClearBtn) pageClearBtn.classList.add('hidden');
                    if (window.location.pathname !== '/') app.utils.navigate('/');
                    return app.views.loadHome();
                } else {
                    const hideClearBtn = !query && !hasProvinceFilter && !hasAdvancedFilters;
                    if (clearBtn) clearBtn.classList.toggle('hidden', hideClearBtn);
                    if (pageClearBtn) pageClearBtn.classList.toggle('hidden', hideClearBtn);
                }
                const currentParams = new URLSearchParams(window.location.search);
                let filterFromUrl = currentParams.get('filter') || 'all';
                if (filterFromUrl === 'absolute_route') filterFromUrl = 'route';
                let prefixToUrl = typeof app.search.currentExactPrefix === 'string' ? app.search.currentExactPrefix : (currentParams.get('prefix') || '');
                if (filterType !== 'route') prefixToUrl = ''; 
                const currentUrlPrefix = currentParams.get('prefix') || '';
                const currentFiltersUrlStr = currentParams.getAll('f').join('|');
                const advancedFiltersStr = (app.search.advancedFilters || []).map(f => `${f.field}:${f.op}:${f.value}`).join('|');
                if (!window.location.pathname.includes('/search') || currentParams.get('q') !== query || filterFromUrl !== filterType || currentUrlPrefix !== prefixToUrl || currentFiltersUrlStr !== advancedFiltersStr) {
                    let url = `/search?q=${encodeURIComponent(query)}&filter=${filterType}`;
                    if (prefixToUrl) url += `&prefix=${encodeURIComponent(prefixToUrl)}`;
                    if (app.search.advancedFilters && app.search.advancedFilters.length > 0) {
                        app.search.advancedFilters.forEach(f => {
                            url += `&f=${encodeURIComponent(`${f.field}:${f.op}:${f.value}`)}`;
                        });
                    }
                    app.utils.navigate(url);
                    return;
                }
                if (app.lastSearchQuery === query && app.lastSearchFilter === filterType && app.lastSearchPrefix === prefixToUrl && app.lastAdvancedFiltersStr === advancedFiltersStr && !forceRefresh) {
                    app.views.switch('search', false);
                    app.loadingBar.finish();
                    return;
                }
                app.lastSearchQuery = query;
                app.lastSearchFilter = filterType;
                app.lastSearchPrefix = prefixToUrl;
                app.lastAdvancedFiltersStr = advancedFiltersStr;
                const currentSearchToken = Date.now();
                app.searchToken = currentSearchToken;
                if (filterType !== 'advanced') {
                    let recents = JSON.parse(localStorage.getItem('vnbus_recent_searches') || '[]');
                    recents = recents.filter(r => r.query !== query);
                    recents.unshift({ query, filter: filterType, prefix: prefixToUrl });
                    if (recents.length > 5) recents.pop();
                    localStorage.setItem('vnbus_recent_searches', JSON.stringify(recents));
                }
                app.views.switch('search', false);
                app.currentViewMode = 'search';
                document.title = 'Tìm kiếm | VNBUSARCHIVE';
                const profileCardsContainer = document.getElementById('search-profile-cards');
                profileCardsContainer.innerHTML = '';
                profileCardsContainer.classList.add('hidden');
                document.getElementById('load-more-cards-container')?.classList.add('hidden');
                app.currentSearchCards =[];
                app.loadedSearchCardsCount = 0;
                const grid = document.getElementById('search-photo-grid');
                grid.innerHTML = '<div class="col-span-full text-center py-10 text-gray-500"><i class="fa-solid fa-circle-notch fa-spin"></i> Đang tìm kiếm...</div>';
                document.getElementById('search-load-more-container')?.classList.add('hidden');
                try {
                    const isIdSearch = query.match(/\/photo\/(\d+)/i) || (filterType === 'all' ? query.match(/^#(\d+)$/) : null);
                    if (isIdSearch) {
                        app.loadingBar.finish();
                        app.utils.navigate(`/photo/${isIdSearch[1]}`);
                        return;
                    }
                    let uploaderCards = [], operatorCards = [], modelCards = [], plateCards = [], routeCards = [];
                    let normalizedQuery = query.toLowerCase().replace(/vin bus/g, 'vinbus').replace(/thanh buoi/g, 'thành bưởi').replace(/phuong trang/g, 'phương trang');
                    const searchWords = normalizedQuery.trim().split(/\s+/).filter(w => w.length > 0);
                    const cardPromises = [];
                    if (filterType === 'uploader' || filterType === 'all') {
                        cardPromises.push((async () => {
                            try {
                                let uQuery = window.sb.from('profiles').select('id, username, avatar_url, role, subroles, ban_status');
                                searchWords.forEach(w => { uQuery = uQuery.ilike('username', `%${w}%`); });
                                const { data: usersData } = await uQuery.limit(5);
                                if (usersData && usersData.length > 0) {
                                    for (const user of usersData) {
                                        const uDisplay = app.utils.formatProfileDisplay(user);
                                        if (uDisplay.isBanned) continue; 
                                        const { count } = await window.sb.from('photos').select('*', { count: 'estimated', head: true }).eq('uploader_id', user.id).eq('status', 'approved');
                                        const avatarSrc = uDisplay.avatar;
                                        const userBadges = app.utils.getBadgesHTML(user.id, user.role, user.subroles);
                                        uploaderCards.push(`
                                            <div class="bg-white border border-gray-200 rounded-md p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition" onclick="app.views.loadUserProfile('${uDisplay.linkId}')">
                                                <img src="${avatarSrc}" onerror="this.onerror=null;this.src='${DEFAULT_AVATAR}';" class="w-12 h-12 rounded-full object-cover bg-gray-100 shrink-0">
                                                <div class="overflow-hidden">
                                                    <div class="font-bold text-black text-sm flex items-center truncate">${uDisplay.username} ${userBadges}</div>
                                                    <div class="text-xs text-gray-500">${count || 0} ảnh đã đăng</div>
                                                </div>
                                            </div>
                                        `);
                                    }
                                }
                            } catch (e) { console.error("Lỗi tìm Uploader:", e); }
                        })());
                    }
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
                                const { data: allOpsForSearch } = await window.sb.from('operator_info').select('parent_operator');
                                const parentMapForSearch = new Map();
                                if (allOpsForSearch) {
                                    allOpsForSearch.forEach(op => {
                                        if (op.parent_operator) {
                                            op.parent_operator.split(';').forEach(p => {
                                                const orig = p.trim();
                                                if (orig) parentMapForSearch.set(app.utils.normOperator(orig).toLowerCase(), orig);
                                            });
                                        }
                                    });
                                }
                                parentMapForSearch.forEach((origName, normKey) => {
                                    const matches = searchWords.every(w => origName.toLowerCase().includes(w));
                                    if (matches) {
                                        const key = origName.toLowerCase();
                                        if (!uniqueOpsMap.has(key)) {
                                            uniqueOpsMap.set(key, origName);
                                        }
                                    }
                                });
                                const finalOps = Array.from(uniqueOpsMap.values()).slice(0, 15);
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
                                                <div class="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5 font-bold">Đơn vị vận hành</div>
                                            </div>
                                        </div>
                                    `);
                                }
                            } catch (e) { console.error("Lỗi tìm Đơn vị:", e); }
                        })());
                    }
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
                                const finalModels = Array.from(uniqueModelsMap.values()).slice(0, 15);
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
                                                <div class="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5 font-bold">Dòng xe</div>
                                            </div>
                                        </div>
                                    `);
                                }
                            } catch (e) { console.error("Lỗi tìm Dòng xe:", e); }
                        })());
                    }
                                                                                                                        if (filterType === 'route' || filterType === 'all') {
                        cardPromises.push((async () => {
                            try {
                                let rQuery = window.sb.from('photos').select('route_no, type, license_plate, borrowed_route').eq('status', 'approved');
                                searchWords.forEach(w => { rQuery = rQuery.ilike('route_no', `%${w}%`); });
                                const { data: rData } = await rQuery.limit(50);
                                if (rData) {
                                    let uniqueRoutesMap = new Map();
                                    const specialRoutes = ['Dừng hoạt động', 'Ngoài giờ hoạt động', 'Chưa hoạt động', 'Hợp đồng', 'Xe hợp đồng / Đưa đón'];
                                    rData.forEach(p => {
                                        if (p.type === 'coach') return;
                                        if (p.route_no && p.route_no !== 'Khác' && p.route_no !== 'Không rõ' && !specialRoutes.includes(p.route_no)) {
                                            let prov = '';
                                            if (p.type !== 'coach') {
                                                if (p.borrowed_route) {
                                                    const parts = p.borrowed_route.split(' - ');
                                                    if (parts.length > 1) prov = parts.slice(1).join(' - ').trim();
                                                }
                                                if (!prov && p.license_plate) {
                                                    prov = app.utils.getProvinceFromPlate ? app.utils.getProvinceFromPlate(p.license_plate) : '';
                                                    if (prov === 'Không xác định' || prov === 'Biển tạm' || prov.includes('quân đội') || prov === 'Buýt sân bay') prov = '';
                                                }
                                            }
                                            const routeNameDB = prov ? `${p.route_no} - ${prov}` : p.route_no;
                                            const key = routeNameDB.toLowerCase();
                                            if (!uniqueRoutesMap.has(key)) {
                                                uniqueRoutesMap.set(key, { r: p.route_no, p: prov, dbName: routeNameDB });
                                            }
                                        }
                                    });
                                    let allRoutes = Array.from(uniqueRoutesMap.values());
                                    const activeProvFilter = app.search?.currentExactProvName;
                                    if (activeProvFilter) {
                                        allRoutes = allRoutes.filter(r => r.p && r.p.toLowerCase().includes(activeProvFilter.toLowerCase()));
                                    } else {
                                        // if no province filter, only show routes that have a province (block coach/invalid)
                                        allRoutes = allRoutes.filter(r => r.p && r.p.trim() !== '');
                                    }
                                    const finalRoutes = allRoutes.slice(0, 15);
                                    let shortPaths = {};
                                    if (finalRoutes.length > 0) {
                                        const dbNames = finalRoutes.map(i => i.dbName);
                                        const { data: rtInfo } = await window.sb.from('route_info').select('route_name, short_path, metadata').in('route_name', dbNames);
                                        if (rtInfo) rtInfo.forEach(rt => { shortPaths[rt.route_name.toLowerCase()] = { short: rt.short_path, meta: rt.metadata }; });
                                    }
                                    for (const info of finalRoutes) {
                                        let displayR = app.utils.cleanText(info.r) + (info.p ? ` (${info.p})` : '');
                                        let rtData = shortPaths[info.dbName.toLowerCase()] || {};
                                        let sp = rtData.short;
                                        let metadata = rtData.meta;
                                        if (sp) displayR += ` (${app.utils.cleanText(sp)})`;
                                        
                                        let iconHtml = '<i class="fa-solid fa-route"></i>';
                                        let iconClass = "w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl shrink-0";
                                        
                                        if (metadata && metadata.icon_type && metadata.icon_type !== 'default') {
                                            const type = metadata.icon_type;
                                            const shortRouteName = info.r.length <= 5 ? info.r : info.r.substring(0, 5);

                                            if (type === 'circle') {
                                                iconClass = "w-12 h-12 rounded-full bg-white flex items-center justify-center shrink-0 border-[2px] border-black shadow-sm overflow-hidden";
                                                await document.fonts.load('400 1em Anton');
                                                const _cpc = document.createElement('canvas'); const _xpc = _cpc.getContext('2d');
                                                _xpc.font = '400 100px Anton, sans-serif';
                                                const _mpc = _xpc.measureText(shortRouteName);
                                                const _sqPC = 29.5; // 95% of inscribed square for w-12 circle
                                                const _scPC = Math.min(_sqPC / _mpc.width, _sqPC / (_mpc.actualBoundingBoxAscent || 72));
                                                const fSizePC = (_scPC * 100).toFixed(1) + 'px';
                                                iconHtml = `<span style="font-weight: 400; font-family: 'Anton', sans-serif; color: #dc2626; font-size: ${fSizePC}; white-space: nowrap; line-height: 1;">${shortRouteName}</span>`;
                                            } else if (type === 'trapezoid') {
                                                iconClass = "w-12 h-12 flex flex-col items-center justify-center shrink-0 relative";
                                                await document.fonts.load('400 1em Anton');
                                                const _ctc = document.createElement('canvas'); const _xtc = _ctc.getContext('2d');
                                                _xtc.font = '400 100px Anton, sans-serif';
                                                const _mtc = _xtc.measureText(shortRouteName);
                                                const _sqTC = 26; // usable space in trapezoid center for card
                                                const _scTC = Math.min(_sqTC / _mtc.width, _sqTC / (_mtc.actualBoundingBoxAscent || 72));
                                                const fSizeTC = (_scTC * 100).toFixed(1) + 'px';
                                                iconHtml = `
                                                <svg viewBox="0 0 100 100" class="absolute inset-0 w-full h-full text-white overflow-visible drop-shadow-sm" preserveAspectRatio="none">
                                                    <polygon points="15,15 85,15 100,85 0,85" fill="white" stroke="black" stroke-width="4" stroke-linejoin="round"/>
                                                </svg>
                                                <span class="relative z-10" style="font-weight: 400; font-family: 'Anton', sans-serif; color: #dc2626; font-size: ${fSizeTC}; white-space: nowrap; line-height: 1;">${shortRouteName}</span>`;
                                            }
                                        }
                                        
                                        const routeUrl = info.p ? `/route/${encodeURIComponent(info.p)}/${encodeURIComponent(info.r)}` : `/route/${encodeURIComponent(info.r)}`;
                                        routeCards.push(`
                                            <div class="bg-white border border-gray-200 rounded-md p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition" onclick="app.utils.navigate('${routeUrl.replace(/'/g, "\\'")}')">
                                                <div class="${iconClass}">${iconHtml}</div>
                                                <div class="overflow-hidden min-w-0 flex-1">
                                                    <div class="font-bold text-black text-sm overflow-x-auto whitespace-nowrap no-scrollbar">${displayR}</div>
                                                    <div class="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5 font-bold">Tuyến xe</div>
                                                </div>
                                            </div>
                                        `);
                                    }
                                }
                            } catch (e) { console.error("Lỗi tìm Tuyến:", e); }
                        })());
                    }
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
                                                    <div class="text-xs text-gray-500 truncate" title="${app.utils.cleanText(v.model || '')}">${app.utils.cleanText(v.model || 'Chưa rõ Model')}</div>
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
                    app.currentSearchCards = [...routeCards, ...operatorCards, ...modelCards, ...plateCards, ...uploaderCards];
                    app.views.loadMoreSearchCards(true);
                    let needsModelJoin = filterType === 'model' || (filterType === 'advanced' && (app.search.advancedFilters || []).some(f => f.field === 'model'));
                    let profileSelect = (filterType === 'uploader' || (filterType === 'advanced' && (app.search.advancedFilters || []).some(f => f.field === 'uploader'))) 
                        ? 'profiles!inner(id, username, role, subroles, ban_status)' 
                        : 'profiles(id, username, role, subroles, ban_status)';
                    let photoQuery = window.sb.from('photos').select(`id, url, license_plate, operator, type, route_no, taken_at, created_at, uploader_id, note, exif_params, borrowed_route, camera_model, location, status, denial_reason, views, ${profileSelect}, vehicles${needsModelJoin ? '!inner' : ''}(model)`, { count: 'estimated' }).eq('status', 'approved');
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
                            const plateFilter = relatedPrefixes.length > 1 ? `or(${relatedPrefixes.map(p => `license_plate.ilike.${p}%`).join(',')})` : `license_plate.ilike.${relatedPrefixes[0]}%`;
                            if (provName) {
                                photoQuery = photoQuery.eq('route_no', query).or(`borrowed_route.eq."${query} - ${provName}",and(borrowed_route.is.null,${plateFilter})`);
                            } else {
                                photoQuery = photoQuery.eq('route_no', query).or(`and(borrowed_route.is.null,${plateFilter})`);
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
                    if (filterType === 'advanced' && app.search.advancedFilters && app.search.advancedFilters.length > 0) {
                        photoQuery = app.search.applyAdvancedFiltersToQuery(photoQuery);
                    }
                    app.searchPageSize = 24;
                    app.searchCurrentPage = 1;
                    const { data: results, error, count } = await photoQuery
                        .order('taken_at', { ascending: false, nullsFirst: false })
                        .order('created_at', { ascending: false })
                        .range(0, app.searchPageSize - 1);
                    if (app.currentViewMode !== 'search' || app.searchToken !== currentSearchToken) return;
                    if (error) throw error;
                    if (!results || results.length === 0) {
                        grid.innerHTML = '<div class="col-span-full text-center py-10 text-gray-500">Không tìm thấy kết quả phù hợp.</div>';
                        document.getElementById('search-load-more-container')?.classList.add('hidden');
                        app.searchTotalPages = 0;
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
                        app.utils.renderPagination('search-load-more-container', 1, app.searchTotalPages, (newPage) => {
                            app.views.fetchSearchPage(newPage);
                        });
                    } else {
                        document.getElementById('search-load-more-container')?.classList.add('hidden');
                    }
                } catch (err) {
                    console.error(err);
                    grid.innerHTML = `<div class="col-span-full text-center py-10 text-red-500">Lỗi hệ thống: ${err.message}</div>`;
                }
                app.loadingBar.finish();
            }
});
Object.assign(window.app, {
  setUser: async (user) => {
                app.user = user;
                const dropdown = document.getElementById('user-dropdown');
                if (user) {
                    let metaName = user.user_metadata?.username ||
                                   user.user_metadata?.full_name ||
                                   user.user_metadata?.name ||
                                   user.user_metadata?.custom_claims?.global_name ||
                                   (user.email ? user.email.split('@')[0] : 'User');
                    let finalName = metaName.substring(0, 20);
                    let finalAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
                    let currentAvatar = finalAvatar;
                    try {
                        const { data: profile } = await window.sb.from('profiles').select('username, avatar_url, role, preferences, ban_status').eq('id', user.id).maybeSingle();
                        if (profile) currentAvatar = profile.avatar_url || finalAvatar;
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
                                const accName = profile.username || user.email || 'của bạn';
                                const reasonText = banInfo.reason || 'Vi phạm quy định của VNBUSARCHIVE';
                                const uuidStr = user.id ? ` (<code>${user.id}</code>)` : '';
                                const banReason = `Tài khoản <b>${accName}</b>${uuidStr} đã bị cấm với lí do: <b>${reasonText}</b>`;
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
                                                TRUY CẬP ĐÃ BỊ HẠN CHẾ
                                            </h2>
                                            <div style="background: #fafafa; border: 1px solid #e4e4e7; border-radius: 10px; padding: 14px 18px; margin-bottom: 24px; text-align: left;">
                                                <div style="font-size: 0.72rem; font-weight: 700; color: #71717a; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px;">
                                                    LÝ DO HẠN CHẾ TRUY CẬP / BAN LOG
                                                </div>
                                                <div style="font-size: 0.92rem; font-weight: 500; color: #27272a; line-height: 1.6; word-break: break-word;">
                                                    ${banReason}
                                                </div>
                                            </div>
                                            <p style="font-size: 0.85rem; line-height: 1.65; margin: 0; color: #52525b;">
                                                Vui lòng tải lại trang hoặc liên hệ: <a href="mailto:lienhe@vnbusarchive.io.vn" style="color: #09090b; font-weight: 700; text-decoration: underline; text-underline-offset: 4px;">lienhe@vnbusarchive.io.vn</a> nếu bạn nghĩ đây là một sai lầm! Xin cảm ơn.
                                            </p>
                                        </div>
                                        <p style="font-size: 0.72rem; letter-spacing: 0.22em; color: #a1a1aa; text-transform: uppercase; font-weight: 600; margin: 0;">VNBUSARCHIVE Foundation</p>
                                    </div>
                                `;
                                return;
                            }
                        }
                        let localPref = localStorage.getItem('vnbus_preference') || 'both';

                        let localWmMode = localStorage.getItem('vnbus_wm_mode') || 'basic';
                        if (!profile || !profile.username) {
                            await window.sb.from('profiles').upsert({
                                id: user.id,
                                username: finalName,
                                avatar_url: finalAvatar,
                                preferences: { type: localPref, wmMode: localWmMode, pinnedLocations: [] }
                            }, { onConflict: 'id' });
                            app.username = finalName;
                            app.role = 'user';
                            app.preference.current = localPref;
                        } else {
                            app.username = profile.username;
                            app.role = profile.role || 'user';
                            if (app.role === 'manager') {
                                sessionStorage.setItem('VNBA_SESS_AUTH', 'active');
                            } else {
                                sessionStorage.removeItem('VNBA_SESS_AUTH');
                            }
                            let dbPrefs = profile.preferences;
                            if (dbPrefs && Object.keys(dbPrefs).length > 0) {
                                app.preference.current = dbPrefs.type || 'both';
                                app.preference.pinnedLocations = dbPrefs.pinnedLocations || [];
                                localStorage.setItem('vnbus_preference', app.preference.current);
                                if (dbPrefs.wmMode) {
                                    localStorage.setItem('vnbus_wm_mode', dbPrefs.wmMode);
                                    if (app.wmState) app.wmState.mode = dbPrefs.wmMode;
                                    if (app.upload) {
                                        app.upload.isBlindWatermarkEnabled = (dbPrefs.wmMode === 'advanced');
                                        if (app.upload.setWmMode) app.upload.setWmMode(dbPrefs.wmMode, false);
                                    }
                                }
                            } else {
                                window.sb.from('profiles').update({
                                    preferences: { type: localPref, wmMode: localWmMode, pinnedLocations: [] }
                                }).eq('id', user.id).then(()=>{});
                                app.preference.current = localPref;
                                app.preference.pinnedLocations = [];
                            }
                        }
                        if(app.upload && app.upload.renderPinnedLocations) app.upload.renderPinnedLocations();
                        if(app.upload && app.upload.checkLocationPinStatus) {
                            const currentLocInput = document.getElementById('up-location');
                            if(currentLocInput) app.upload.checkLocationPinStatus(currentLocInput.value);
                        }
                    } catch (e) {
                        app.username = finalName;
                        app.role = 'user';
                    }
                    document.getElementById('nav-username').innerText = app.username;
                    if (currentAvatar) {
                        const hImg = document.getElementById('nav-user-avatar');
                        if (hImg) {
                            hImg.src = app.utils.getProxiedUrl(currentAvatar.replace(/"/g, ''), 'avatar.jpg', 'avatar');
                            hImg.onerror = () => { hImg.src = DEFAULT_AVATAR; };
                            hImg.classList.remove('hidden');
                        }
                        const hIcon = document.getElementById('nav-user-icon-wrapper');
                        if (hIcon) hIcon.classList.add('hidden');
                    } else {
                        const hImg = document.getElementById('nav-user-avatar');
                        if (hImg) hImg.classList.add('hidden');
                        const hIcon = document.getElementById('nav-user-icon-wrapper');
                        if (hIcon) hIcon.classList.remove('hidden');
                    }
dropdown.innerHTML = `
                         <a href="/profile" class="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100 font-bold"><i class="fa-solid fa-address-card w-5 text-center mr-1"></i> Hồ sơ của tôi</a>
                         <button onclick="app.settings.open()" class="w-full text-left block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100 font-bold"><i class="fa-solid fa-gear w-5 text-center mr-1"></i> Cài đặt</button>
                         <a href="/help" class="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100 font-bold"><i class="fa-solid fa-book-open w-5 text-center mr-1"></i> Trung tâm hỗ trợ</a>
                         <a href="/contact" class="w-full text-left block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100 font-bold"><i class="fa-solid fa-headset w-5 text-center mr-1"></i> Liên hệ hỗ trợ</a>
                         <button onclick="app.auth.logout()" class="w-full text-left block px-4 py-3 text-sm text-red-600 hover:bg-red-50 font-bold"><i class="fa-solid fa-right-from-bracket w-5 text-center mr-1"></i> Đăng xuất</button>
                     `;
                    app.auth.close();
                    if (app.role === 'admin' || app.role === 'manager') {
                        document.getElementById('nav-admin').classList.remove('hidden');
                        app.admin.checkNotification();
                        if (app.role === 'manager') {
                            document.getElementById('adm-tab-manager').classList.remove('hidden');
                        }
                        if (typeof app.initRealtimeChannel === 'function') app.initRealtimeChannel();
                    } else {
                        document.getElementById('nav-admin').classList.add('hidden');
                        if (typeof app.initRealtimeChannel === 'function') app.initRealtimeChannel();
                    }
                } else {
                    document.getElementById('nav-username').innerText = 'Tài khoản';
                    const hImg = document.getElementById('nav-user-avatar');
                    if (hImg) hImg.classList.add('hidden');
                    const hIcon = document.getElementById('nav-user-icon-wrapper');
                    if (hIcon) hIcon.classList.remove('hidden');
                    document.getElementById('nav-admin').classList.add('hidden');
                    app.username = 'Guest';
                    app.role = 'user';
dropdown.innerHTML = `
                         <a href="/auth" class="w-full text-left block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100 font-bold"><i class="fa-solid fa-arrow-right-to-bracket w-5 text-center mr-1"></i> Đăng nhập</a>
                         <a href="/auth" class="w-full text-left block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100 font-bold"><i class="fa-solid fa-user-plus w-5 text-center mr-1"></i> Tạo tài khoản</a>
                         <button onclick="app.settings.open()" class="w-full text-left block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100 font-bold"><i class="fa-solid fa-gear w-5 text-center mr-1"></i> Cài đặt</button>
                         <a href="/help" class="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100 font-bold"><i class="fa-solid fa-book-open w-5 text-center mr-1"></i> Trung tâm hỗ trợ</a>
                         <a href="/contact" class="w-full text-left block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 font-bold"><i class="fa-solid fa-headset w-5 text-center mr-1"></i> Liên hệ hỗ trợ</a>
                     `;
                }
                if (app.auth && app.auth.updateUUIDBox) app.auth.updateUUIDBox();
            }
});
document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('header');
    if (!header) return;
    if (!header.classList.contains('transition-transform')) {
        header.classList.add('transition-transform', 'duration-300');
    }
    let lastScrollY = window.scrollY;
    let lastScrollDirection = 'up';
    let isHoveringHeaderArea = false;
    const threshold = 200; 
    const checkHeaderState = () => {
        const currentScrollY = window.scrollY;
        const isSearchFocused = document.activeElement && document.activeElement.id === 'search-input';
        const userMenu = document.getElementById('user-dropdown');
        const isUserMenuOpen = userMenu && userMenu.classList.contains('opacity-100');
        const filterMenu = document.getElementById('search-filter-menu');
        const isFilterMenuOpen = filterMenu && filterMenu.classList.contains('active');
        const searchSuggestions = document.getElementById('main-search-suggestions');
        const isSuggestionsOpen = searchSuggestions && searchSuggestions.classList.contains('active');
        if (isSearchFocused || isUserMenuOpen || isFilterMenuOpen || isSuggestionsOpen || isHoveringHeaderArea) {
            header.style.transform = 'translateY(0)';
            return;
        }
        if (currentScrollY > threshold) {
            if (lastScrollDirection === 'down') {
                header.style.transform = 'translateY(-100%)';
            } else {
                header.style.transform = 'translateY(0)';
            }
        } else {
            header.style.transform = 'translateY(0)';
        }
    };
    let scrollTicking = false;
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        if (currentScrollY > lastScrollY) {
            lastScrollDirection = 'down';
        } else if (currentScrollY < lastScrollY) {
            lastScrollDirection = 'up';
        }
        lastScrollY = currentScrollY;
        if (!scrollTicking) {
            window.requestAnimationFrame(() => {
                checkHeaderState();
                scrollTicking = false;
            });
            scrollTicking = true;
        }
    }, { passive: true });
    document.addEventListener('click', () => {
        setTimeout(checkHeaderState, 50);
    });
    document.addEventListener('focusout', () => {
        setTimeout(checkHeaderState, 50);
    });
    document.addEventListener('mousemove', (e) => {
        const wasHovering = isHoveringHeaderArea;
        if (e.clientY <= 90) {
            isHoveringHeaderArea = true;
        } else {
            isHoveringHeaderArea = false;
        }
        if (wasHovering !== isHoveringHeaderArea) {
            checkHeaderState();
        }
    });
    document.addEventListener('mouseleave', () => {
        if (isHoveringHeaderArea) {
            isHoveringHeaderArea = false;
            checkHeaderState();
        }
    });
});
