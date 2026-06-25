window.app = window.app || {};

        app.webrtc = {
            peer: null,
            conn: null,
            timer: null,
            timeLeft: 180,
            CHUNK_SIZE: 64 * 1024,

            init: () => {
                const urlParams = new URLSearchParams(window.location.search);
                const mobilePeerId = urlParams.get('peer');

                if (window.location.pathname === '/mobile-upload' && mobilePeerId) {
                    app.webrtc.startClient(mobilePeerId);
                }
            },

            // ================= TẠI MÁY TÍNH (HOST) =================
            startHost: () => {
                const modal = document.getElementById('webrtc-qr-modal');
                const loadingQr = document.getElementById('webrtc-loading-qr');
                const qrContainer = document.getElementById('webrtc-qrcode-container');
                const countdownEl = document.getElementById('webrtc-countdown');

                modal.classList.remove('hidden');
                qrContainer.innerHTML = '';
                loadingQr.classList.remove('hidden');
                countdownEl.innerText = "03:00";
                app.ui.lockScroll();

                if(app.webrtc.peer) app.webrtc.peer.destroy();
                app.webrtc.peer = new Peer();

                app.webrtc.peer.on('open', (id) => {
                    loadingQr.classList.add('hidden');
                    const mobileUrl = window.location.origin + '/mobile-upload?peer=' + id;

                    new QRCode(qrContainer, {
                        text: mobileUrl, width: 224, height: 224,
                        colorDark : "#000000", colorLight : "#ffffff",
                        correctLevel : QRCode.CorrectLevel.H
                    });

                    app.webrtc.startCountdown();
                });

                app.webrtc.peer.on('connection', (conn) => {
                    app.webrtc.conn = conn;

                    conn.on('open', () => {
                        // 1. Tắt Modal QR ngay lập tức khi điện thoại join thành công
                        document.getElementById('webrtc-qr-modal').classList.add('hidden');
                        app.ui.unlockScroll();
                        if(app.webrtc.timer) clearInterval(app.webrtc.timer);

                        // 2. Chuyển UI Dropzone thành UI Connected
                        document.getElementById('drop-zone').classList.add('hidden');
                        document.getElementById('webrtc-connected-zone').classList.remove('hidden');
                        document.getElementById('webrtc-connected-zone').classList.add('flex');
                    });

                    let pendingMeta = null;
                    let receivedChunks = [];

                    conn.on('data', (data) => {
                        if (data.type === 'file_meta') {
                            pendingMeta = data;
                            receivedChunks = [];
                        }
                        else if (data.type === 'chunk') {
                            receivedChunks.push(data.data);

                            if (receivedChunks.length === pendingMeta.totalChunks) {
                                const blob = new Blob(receivedChunks, { type: pendingMeta.mime });
                                const receivedFile = new File([blob], pendingMeta.name, { type: pendingMeta.mime });

                                const fakeEvent = { target: { files: [receivedFile] } };
                                app.upload.handleFileSelect(fakeEvent);
                            }
                        }
                    });

                    conn.on('close', () => {
                        app.webrtc.disconnect(true);
                    });
                });
            },

            startCountdown: () => {
                app.webrtc.timeLeft = 180;
                const timerEl = document.getElementById('webrtc-countdown');

                if(app.webrtc.timer) clearInterval(app.webrtc.timer);
                app.webrtc.timer = setInterval(() => {
                    app.webrtc.timeLeft--;
                    const m = Math.floor(app.webrtc.timeLeft / 60).toString().padStart(2, '0');
                    const s = (app.webrtc.timeLeft % 60).toString().padStart(2, '0');
                    timerEl.innerText = `${m}:${s}`;

                    if (app.webrtc.timeLeft <= 0) {
                        app.ui.showAlert("Mã QR đã hết hạn (3 phút). Vui lòng tạo lại.");
                        app.webrtc.cancelHost();
                    }
                }, 1000);
            },

            cancelHost: () => {
                if(app.webrtc.timer) clearInterval(app.webrtc.timer);
                if(app.webrtc.conn) app.webrtc.conn.close();
                if(app.webrtc.peer) app.webrtc.peer.destroy();

                document.getElementById('webrtc-qr-modal').classList.add('hidden');
                app.ui.unlockScroll();
            },

            disconnect: (isFromMobile = false) => {
                if(app.webrtc.conn) app.webrtc.conn.close();
                if(app.webrtc.peer) app.webrtc.peer.destroy();
                app.webrtc.conn = null;
                app.webrtc.peer = null;

                // Trả UI về Dropzone gốc NẾU khung preview đang tắt
                const connectedZone = document.getElementById('webrtc-connected-zone');
                const dropZone = document.getElementById('drop-zone');
                const previewBox = document.getElementById('preview-box');

                if (connectedZone) {
                    connectedZone.classList.remove('flex');
                    connectedZone.classList.add('hidden');
                }

                if (dropZone && previewBox && previewBox.classList.contains('hidden')) {
                    dropZone.classList.remove('hidden');
                }

                if (app.upload && app.upload.restoreDropZone) app.upload.restoreDropZone();

                if (isFromMobile) {
                    app.ui.showAlert("Thiết bị còn lại đã ngắt kết nối.", null, null, {title: "Ngắt kết nối"});
                }
            },

            resetMobile: () => {
                if (app.webrtc.conn && app.webrtc.conn.open) {
                    app.webrtc.conn.send({ type: 'reset_ui' });
                }
            },

            // ================= TẠI ĐIỆN THOẠI (CLIENT) =================
            startClient: (hostId) => {
                const statusEl = document.getElementById('webrtc-mobile-status');
                const btnEl = document.getElementById('webrtc-mobile-btn');
                const fileInput = document.getElementById('webrtc-mobile-file');

                app.webrtc.peer = new Peer();

                const showMobileDropzone = () => {
                    if (app.webrtc.successTimeout) clearTimeout(app.webrtc.successTimeout);
                    statusEl.classList.add('hidden');
                    btnEl.classList.remove('hidden');
                    btnEl.classList.add('flex');
                    fileInput.value = ''; // Xóa cache file cũ để có thể chọn lại đúng file đó
                };

                const showMobileError = (title, sub) => {
                    if (app.webrtc.successTimeout) clearTimeout(app.webrtc.successTimeout);
                    statusEl.classList.remove('hidden');
                    statusEl.className = "w-full flex flex-col items-center justify-center min-h-[120px] bg-red-50 rounded-xl border border-red-200 p-4 mb-2 fade-zoom-in";
                    statusEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation text-3xl text-red-500 mb-3"></i><p class="text-sm font-bold text-red-700">${title}</p><p class="text-xs text-red-600 mt-1 font-medium text-center">${sub}</p>`;
                    btnEl.classList.remove('flex');
                    btnEl.classList.add('hidden');
                };

                app.webrtc.peer.on('open', (id) => {
                    app.webrtc.conn = app.webrtc.peer.connect(hostId, { reliable: true });

                    app.webrtc.conn.on('open', () => {
                        showMobileDropzone();
                    });

                    app.webrtc.conn.on('data', (data) => {
                        // Nhận tín hiệu từ PC báo đã sẵn sàng cho ảnh tiếp theo
                        if (data.type === 'reset_ui') {
                            showMobileDropzone();
                        }
                    });

                    app.webrtc.conn.on('close', () => {
                        showMobileError("Mất kết nối với thiết bị nhận.", "Thiết bị nhận đã đóng kết nối hoặc bị tải lại trang. Vui lòng quét lại mã QR mới.");
                    });
                });

                app.webrtc.peer.on('error', (err) => {
                    showMobileError("Lỗi kết nối WebRTC.", "Có thể mạng của bạn đang chặn P2P. Vui lòng tải lại trang hoặc đổi mạng.");
                });

                fileInput.addEventListener('change', async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;

                    if (file.size > 20 * 1024 * 1024) {
                        app.ui.showAlert("File quá 20MB. Vui lòng chọn file khác!");
                        return;
                    }

                    btnEl.classList.remove('flex');
                    btnEl.classList.add('hidden');
                    statusEl.classList.remove('hidden');
                    statusEl.className = "w-full flex flex-col items-center justify-center min-h-[120px] bg-gray-50 rounded-xl border border-gray-200 p-4 mb-2";
                    statusEl.innerHTML = `
                        <i class="fa-solid fa-circle-notch fa-spin text-4xl text-black mb-4"></i>
                        <p class="text-sm font-bold text-black">Đang truyền dữ liệu sang thiết bị nhận...</p>
                        <p class="text-[10px] text-gray-500 mt-2 uppercase tracking-widest font-bold">Giữ nguyên màn hình này</p>
                    `;

                    try {
                        const arrayBuffer = await file.arrayBuffer();
                        const totalChunks = Math.ceil(arrayBuffer.byteLength / app.webrtc.CHUNK_SIZE);

                        app.webrtc.conn.send({
                            type: 'file_meta',
                            name: file.name,
                            size: file.size,
                            mime: file.type,
                            totalChunks: totalChunks
                        });

                        for (let i = 0; i < totalChunks; i++) {
                            const start = i * app.webrtc.CHUNK_SIZE;
                            const end = Math.min(start + app.webrtc.CHUNK_SIZE, arrayBuffer.byteLength);
                            app.webrtc.conn.send({
                                type: 'chunk',
                                current: i,
                                data: arrayBuffer.slice(start, end)
                            });
                            await new Promise(r => setTimeout(r, 10));
                        }

                        // Giữ nguyên giao diện thành công cho tới khi PC gởi tín hiệu reset_ui
                        if (app.webrtc.successTimeout) clearTimeout(app.webrtc.successTimeout);
                        app.webrtc.successTimeout = setTimeout(() => {
                            statusEl.className = "w-full flex flex-col items-center justify-center min-h-[160px] bg-green-50 rounded-xl border border-green-200 p-4 mb-2 fade-zoom-in";
                            statusEl.innerHTML = `
                                <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 border border-green-200">
                                    <i class="fa-solid fa-check text-3xl text-green-600"></i>
                                </div>
                                <p class="text-lg font-black text-green-800 uppercase tracking-tight">Đã chuyển ảnh!</p>
                                <p class="text-xs text-green-700 mt-1.5 font-medium text-center px-4 leading-relaxed">Tiếp tục thao tác trên màn hình máy tính.<br>Màn hình này sẽ tự mở khóa khi Thiết bị nhận sẵn sàng nhận ảnh tiếp theo.</p>
                            `;
                        }, 500);
                    } catch (error) {
                        app.ui.showAlert("Lỗi khi gửi file: " + error.message);
                        showMobileDropzone();
                    }
                });
            }
        };
        // Kích hoạt khi trang đã tải
        document.addEventListener('DOMContentLoaded', () => {
            app.webrtc.init();

            // Zoom Modal Logic (Wheel & Touch)
            const zoomImg = document.getElementById('admin-zoom-img');
            const zoomModal = document.getElementById('admin-zoom-modal');
            let currentZoom = 1;
            let isPanning = false;
            let startX = 0, startY = 0;
            let panX = 0, panY = 0;

            const resetZoom = () => {
                currentZoom = 1;
                panX = 0;
                panY = 0;
                zoomImg.style.transform = `translate(${panX}px, ${panY}px) scale(${currentZoom})`;
                zoomImg.style.transition = 'transform 0.3s';
            };

            const updateTransform = () => {
                if (currentZoom <= 1) {
                    panX = 0;
                    panY = 0;
                } else {
                    const maxX = Math.max(0, (zoomImg.clientWidth * currentZoom - window.innerWidth) / 2);
                    const maxY = Math.max(0, (zoomImg.clientHeight * currentZoom - window.innerHeight) / 2);
                    panX = Math.max(-maxX - 50, Math.min(maxX + 50, panX));
                    panY = Math.max(-maxY - 50, Math.min(maxY + 50, panY));
                }
                zoomImg.style.transform = `translate(${panX}px, ${panY}px) scale(${currentZoom})`;
            };

            zoomModal.addEventListener('wheel', (e) => {
                e.preventDefault();
                zoomImg.classList.remove('modal-content-enter');
                zoomImg.style.transition = 'none';
                
                const oldZoom = currentZoom;
                const zoomAmount = e.deltaY * -0.0015;
                currentZoom += zoomAmount;
                if (currentZoom < 0.5) currentZoom = 0.5;
                if (currentZoom > 10) currentZoom = 10;
                
                if (oldZoom !== currentZoom) {
                    const cx = e.clientX;
                    const cy = e.clientY;
                    const dx = cx - window.innerWidth / 2;
                    const dy = cy - window.innerHeight / 2;
                    panX = dx - (dx - panX) * (currentZoom / oldZoom);
                    panY = dy - (dy - panY) * (currentZoom / oldZoom);
                }
                
                updateTransform();
            }, { passive: false });

            let initialDistance = 0;
            let initialZoom = 1;
            let lastTapTime = 0;
            let lastPinchCenter = { x: 0, y: 0 };

            zoomModal.addEventListener('touchstart', (e) => {
                zoomImg.classList.remove('modal-content-enter');
                zoomImg.style.transition = 'none';
                if (e.touches.length === 2) {
                    initialDistance = Math.hypot(
                        e.touches[0].pageX - e.touches[1].pageX,
                        e.touches[0].pageY - e.touches[1].pageY
                    );
                    initialZoom = currentZoom;
                    lastPinchCenter = {
                        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
                        y: (e.touches[0].clientY + e.touches[1].clientY) / 2
                    };
                } else if (e.touches.length === 1) {
                    const now = Date.now();
                    if (now - lastTapTime < 300) {
                        resetZoom();
                        lastTapTime = 0;
                        return;
                    }
                    lastTapTime = now;

                    if (currentZoom > 1) {
                        isPanning = true;
                        startX = e.touches[0].pageX - panX;
                        startY = e.touches[0].pageY - panY;
                    }
                }
            }, { passive: false });

            zoomModal.addEventListener('touchmove', (e) => {
                e.preventDefault();
                if (e.touches.length === 2) {
                    const currentDistance = Math.hypot(
                        e.touches[0].pageX - e.touches[1].pageX,
                        e.touches[0].pageY - e.touches[1].pageY
                    );
                    
                    const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
                    const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
                    
                    const oldZoom = currentZoom;
                    const zoomAmount = (currentDistance / initialDistance);
                    currentZoom = initialZoom * zoomAmount;
                    if (currentZoom < 0.5) currentZoom = 0.5;
                    if (currentZoom > 10) currentZoom = 10;
                    
                    if (oldZoom !== currentZoom) {
                        const dx = cx - window.innerWidth / 2;
                        const dy = cy - window.innerHeight / 2;
                        panX = dx - (dx - panX) * (currentZoom / oldZoom);
                        panY = dy - (dy - panY) * (currentZoom / oldZoom);
                    }
                    
                    panX += cx - lastPinchCenter.x;
                    panY += cy - lastPinchCenter.y;
                    
                    lastPinchCenter = { x: cx, y: cy };
                    
                    updateTransform();
                } else if (e.touches.length === 1 && isPanning) {
                    panX = e.touches[0].pageX - startX;
                    panY = e.touches[0].pageY - startY;
                    updateTransform();
                    startX = e.touches[0].pageX - panX;
                    startY = e.touches[0].pageY - panY;
                }
            }, { passive: false });

            zoomModal.addEventListener('touchend', (e) => {
                if (e.touches.length < 2) {
                    initialDistance = 0;
                }
                if (e.touches.length === 1 && currentZoom > 1) {
                    isPanning = true;
                    startX = e.touches[0].pageX - panX;
                    startY = e.touches[0].pageY - panY;
                }
                if (e.touches.length === 0) {
                    isPanning = false;
                }
            });

            zoomImg.addEventListener('mousedown', (e) => {
                if (currentZoom > 1) {
                    e.preventDefault();
                    zoomImg.classList.remove('modal-content-enter');
                    isPanning = true;
                    startX = e.pageX - panX;
                    startY = e.pageY - panY;
                    zoomImg.style.transition = 'none';
                }
            });

            zoomImg.addEventListener('dblclick', (e) => {
                e.preventDefault();
                resetZoom();
            });

            window.addEventListener('mousemove', (e) => {
                if (isPanning) {
                    panX = e.pageX - startX;
                    panY = e.pageY - startY;
                    updateTransform();
                    startX = e.pageX - panX;
                    startY = e.pageY - panY;
                }
            });

            window.addEventListener('mouseup', () => {
                isPanning = false;
            });

            // Override app.admin functions to hook zoom reset
            if (app && app.admin) {
                const originalCloseZoom = app.admin.closeZoom;
                app.admin.closeZoom = () => {
                    originalCloseZoom();
                    setTimeout(resetZoom, 300);
                };
                const originalOpenZoom = app.admin.openZoom;
                app.admin.openZoom = (url, showToolbar = false) => {
                    resetZoom();
                    originalOpenZoom(url, showToolbar);
                };
            }
        });
    