window.app = window.app || {};

window.app.photo = {
                downloadImage: async (e) => {
                    if (!app.currentPhoto) return;

                    const btn = e.currentTarget;
                    const origHtml = btn.innerHTML;
                    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Đang tải...';

                    try {
                        const plateName = app.utils.displayPlate(app.currentPhoto.license_plate) || 'VNBUSARCHIVE';
                        let proxyUrl = app.utils.getProxiedUrl(app.currentPhoto.url, `${plateName}.jpg`);

                        // Bỏ proxy wsrv.nl

                        const response = await fetch(proxyUrl);
                        const blob = await response.blob();
                        const blobUrl = window.URL.createObjectURL(blob);

                        const a = document.createElement('a');
                        a.href = blobUrl;
                        a.download = plateName + '.jpg'; // Đặt tên file khi lưu

                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        window.URL.revokeObjectURL(blobUrl);
                    } catch (err) {
                        app.ui.showAlert('Lỗi: Không thể tải hình ảnh từ máy chủ!');
                    } finally {
                        btn.innerHTML = origHtml;
                    }
                },
                requestDelete: async () => {
                    if (!app.user || !app.currentPhoto) return;
                    const p = app.currentPhoto;
                    const isPendingOrDenied = (p.status === 'pending' || p.status === 'denied');

                    if (isPendingOrDenied) {
                        app.ui.showAlert(
                            "Bạn có chắc chắn muốn xóa ảnh này? Ảnh sẽ bị xóa vĩnh viễn khỏi hệ thống.",
                            async () => {
                                try {
                                    try { await app.captcha.request(); } catch (err) { if (err.message !== "CAPTCHA_CANCELLED") app.ui.showAlert("Lỗi xác thực Captcha."); return; }
                                    // 1. Gọi API Xóa ảnh từ ImageKit trước
                                    const { data: { session } } = await window.sb.auth.getSession();
                                    const token = session?.access_token;
                                    
                                    if (session && p.url) {
                                        await fetch('/api/delete-image', {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'Authorization': `Bearer ${session.access_token}`
                                            },
                                            body: JSON.stringify({ imageUrl: p.url })
                                        });
                                    }

                                    // 2. Xóa khỏi Supabase Database qua API
                                    const response = await fetch('/api/photos', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            action: 'delete_pending',
                                            payload: { photoId: p.id, license_plate: p.license_plate },
                                            token
                                        })
                                    });
                                    const data = await response.json();
                                    if (!data.success) throw new Error(data.error);

                                    await app.vehicle.cleanupVehicle(p.license_plate);

                                    app.toast.show('success', 'Thành công', 'Ảnh đã được xóa vĩnh viễn khỏi hệ thống.');
                                    app.views.loadHome();
                                } catch (err) { app.ui.showAlert("Lỗi khi xóa ảnh: " + err.message); }
                            },
                            () => { console.log("Hủy xóa"); },
                            { countdown: true, btnOkText: "Xóa ảnh", btnCancelText: "Hủy bỏ", title: "Xác nhận xóa" }
                        );
                    } else {
                        app.ui.showPrompt("Vui lòng nhập lý do xóa ảnh này (Bắt buộc):", "", async (reason) => {
                            try {
                                try { await app.captcha.request(); } catch (err) { if (err.message !== "CAPTCHA_CANCELLED") app.ui.showAlert("Lỗi xác thực Captcha."); return; }
                                const { data: { session } } = await window.sb.auth.getSession();
                                const token = session?.access_token;
                                
                                const response = await fetch('/api/photos', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        action: 'request_delete',
                                        payload: { photoId: p.id, license_plate: p.license_plate, reason },
                                        token
                                    })
                                });
                                const data = await response.json();
                                if (!data.success) throw new Error(data.error);

                                app.ui.showAlert("Yêu cầu xóa ảnh đã được gửi và đang chờ Admin duyệt.");
                            } catch (err) { app.ui.showAlert("Lỗi: " + err.message); }
                        });
                    }
                }
            },




window.app.edit = {
                isEditing: false,
                toggleInlineEdit: () => {
                    if (!app.user) return app.auth.check();
                    const formInputs = document.querySelectorAll('#inline-edit-form .info-input');
                    const actions = document.getElementById('edit-actions');
                    const triggerContainer = document.getElementById('edit-trigger-container');
                    const notice = document.getElementById('edit-mode-notice');
                    const noticeText = document.getElementById('edit-notice-text');
                    const btnSave = document.getElementById('btn-save-inline');

                    app.edit.isEditing = !app.edit.isEditing;

                    if (app.edit.isEditing) {
                        formInputs.forEach(input => {
                            if (input.tagName === 'SELECT') { input.disabled = false; } 
                            else { if (input.id !== 'info-plate') input.readOnly = false; }
                        });

                        actions.classList.remove('hidden');
                        actions.classList.add('flex');
                        if (triggerContainer) triggerContainer.classList.add('hidden');
                        notice.classList.remove('hidden');

                        if (app.role === 'admin' || app.role === 'manager') {
                            noticeText.innerText = "ADMIN MODE: Bạn đang sửa trực tiếp vào cơ sở dữ liệu.";
                            btnSave.innerText = "Lưu ngay lập tức";
                            document.getElementById('info-plate').readOnly = false;
                        } else {
                            noticeText.innerText = "Bạn đang ở chế độ chỉnh sửa. Thay đổi sẽ được gửi yêu cầu duyệt (Trừ ngày chụp).";
                            btnSave.innerText = "Gửi yêu cầu";
                        }
                    } else {
                        app.edit.cancel();
                    }
                },
                cancel: () => {
                    const formInputs = document.querySelectorAll('#inline-edit-form .info-input');
                    formInputs.forEach(input => {
                        if (input.tagName === 'SELECT') input.disabled = true;
                        else input.readOnly = true;
                    });

                    const triggerContainer = document.getElementById('edit-trigger-container');
                    if (triggerContainer) triggerContainer.classList.remove('hidden');

                    document.getElementById('edit-actions').classList.add('hidden');
                    document.getElementById('edit-actions').classList.remove('flex');
                    document.getElementById('edit-mode-notice').classList.add('hidden');
                    app.edit.isEditing = false;
                },
                submitInline: async (e) => {
                    e.preventDefault();
                    if (!app.user) return;

                    const btn = document.getElementById('btn-save-inline');
                    const originalText = btn.innerText;
                    btn.innerText = "Đang xử lý..."; btn.disabled = true;

                    const payload = {
                        license_plate: document.getElementById('info-plate').value.replace(/[^A-Z0-9-]/gi, '').toUpperCase(),
                        operator: document.getElementById('info-operator').value,
                        type: document.getElementById('info-type').value,
                        route: document.getElementById('info-route').value,
                        model: document.getElementById('info-model').value,
                        location: document.getElementById('info-location').value,
                        note: document.getElementById('info-note').value,
                        taken_at: document.getElementById('info-date').value
                    };

                    let missingFields = [];
                    if (!payload.type) missingFields.push("Loại xe");
                    if (!payload.license_plate) missingFields.push("Biển kiểm soát");
                    if (!payload.taken_at) missingFields.push("Ngày chụp");
                    if (!payload.route) missingFields.push("Mã số tuyến / Lộ trình");
                    if (!payload.operator) missingFields.push("Đơn vị vận hành");
                    if (!payload.model) missingFields.push("Dòng xe (Model)");
                    if (!payload.location) missingFields.push("Vị trí chụp");

                    if (missingFields.length > 0) {
                        let msg = `Vui lòng điền đủ các trường bắt buộc: <b>${missingFields.join(', ')}</b>.`;
                        btn.innerText = originalText; btn.disabled = false;
                        return app.ui.showAlert(msg, null, null, { title: "Thiếu thông tin" });
                    }

                    if (app.role !== 'admin' && app.role !== 'manager') {
                        try { await app.captcha.request(); } catch (err) {
                            if (err.message !== "CAPTCHA_CANCELLED") app.ui.showAlert("Lỗi xác thực Captcha.");
                            btn.innerText = originalText; btn.disabled = false;
                            return;
                        }
                    }

                    try {
                        const { data: { session } } = await window.sb.auth.getSession();
                        const token = session?.access_token;

                        const photoInfo = {
                            id: app.currentPhoto.id,
                            uploader_id: app.currentPhoto.uploader_id,
                            taken_at: app.currentPhoto.taken_at,
                            license_plate: app.currentPhoto.license_plate
                        };

                        const beforeSnapshot = {
                            photo_id: app.currentPhoto.id,
                            taken_at: app.currentPhoto.taken_at,
                            license_plate: app.currentPhoto.license_plate,
                            location: app.currentPhoto.location,
                            note: app.currentPhoto.note,
                            operator: app.currentPhoto.operator || app.currentVehicle?.operator,
                            type: app.currentPhoto.type || app.currentVehicle?.type,
                            route_no: app.currentPhoto.route_no || app.currentVehicle?.route_no,
                            model: app.currentPhoto.model || app.currentVehicle?.model
                        };

                        const response = await fetch('/api/photos', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                action: 'submit_inline',
                                payload: { photoInfo, payload },
                                token
                            })
                        });
                        const data = await response.json();

                        if (!data.success) {
                            app.ui.showAlert(data.error);
                            btn.innerText = originalText; btn.disabled = false;
                            return;
                        }

                        if (data.mode === 'direct') {
                            const takenAtChanged = !!(payload.taken_at && payload.taken_at !== beforeSnapshot.taken_at);
                            
                            app.currentPhoto.taken_at = takenAtChanged ? payload.taken_at : beforeSnapshot.taken_at;

                            const afterSnapshot = {
                                photo_id: app.currentPhoto.id,
                                taken_at: app.currentPhoto.taken_at,
                                license_plate: payload.license_plate,
                                location: payload.location,
                                note: payload.note,
                                operator: payload.operator,
                                type: payload.type,
                                route_no: payload.route,
                                model: payload.model
                            };

                            if (app.admin?.logAction) {
                                app.admin.logAction(
                                    'update_photo_info_direct',
                                    app.currentPhoto.id,
                                    { taken_at_changed: takenAtChanged, before: beforeSnapshot, after: afterSnapshot }
                                );
                            }

                            if (takenAtChanged || beforeSnapshot.operator !== payload.operator || beforeSnapshot.route_no !== payload.route) {
                                await app.vehicle.syncHistoryOnPhotoEdit(
                                    payload.license_plate,
                                    app.currentPhoto.taken_at,
                                    { operator: beforeSnapshot.operator, route_no: beforeSnapshot.route_no },
                                    { operator: payload.operator, route_no: payload.route }
                                );
                            }

                            app.toast.show('success', 'Lưu thành công', 'Dữ liệu của ảnh này đã được cập nhật.');

                            if (beforeSnapshot.license_plate !== payload.license_plate) {
                                await app.vehicle.cleanupVehicle(beforeSnapshot.license_plate);
                            }

                            app.currentPhoto.license_plate = payload.license_plate;
                            app.currentPhoto.location = payload.location;
                            app.currentPhoto.note = payload.note;
                            app.currentPhoto.operator = payload.operator;
                            app.currentPhoto.type = payload.type;
                            app.currentPhoto.route_no = payload.route;

                            if (app.currentVehicle) {
                                app.currentVehicle.model = payload.model;
                            }

                            document.getElementById('detail-title').innerText = `${payload.license_plate} - ${payload.operator}`;
                            document.getElementById('crumb-model').innerText = payload.license_plate;
                            document.getElementById('info-plate').value = payload.license_plate;

                            app.edit.cancel();
                        } else {
                            if (data.takenAtChanged) {
                                app.currentPhoto.taken_at = payload.taken_at;
                            }
                            app.ui.showAlert("Yêu cầu chỉnh sửa đã được gửi và đang chờ Admin duyệt (Ngày chụp đã được cập nhật ngay nếu bạn là người đăng).");
                            app.edit.cancel();
                        }

                    } catch (err) {
                        app.ui.showAlert("Lỗi: " + err.message);
                        console.error(err);
                    } finally {
                        btn.innerText = originalText; btn.disabled = false;
                    }
                }
            },


window.app.crop = {
                cropper: null,
                mode: 'main',
                originalFile: null,
                isMandatory: false, // Thêm cờ đánh dấu bắt buộc cắt

                open: (mode, file = null, isMandatory = false) => {
                    app.crop.mode = mode;
                    app.crop.originalFile = file || app.rawFile;
                    app.crop.isMandatory = isMandatory;

                    if (!app.crop.originalFile) return;

                    const url = URL.createObjectURL(app.crop.originalFile);
                    const img = document.getElementById('crop-image');

                    const modal = document.getElementById('crop-modal');
                    const ratioContainer = document.getElementById('crop-ratios');

                    modal.classList.remove('hidden');
                    app.ui.lockScroll();

                    img.onload = () => {
                        if (app.crop.cropper) {
                            app.crop.cropper.destroy();
                        }

                        if (mode === 'main') {
                            // Hiện lại thanh chọn tỉ lệ (16:9, 3:2, 4:3)
                            if(ratioContainer) ratioContainer.classList.remove('hidden');

                            app.crop.cropper = new Cropper(img, {
                                aspectRatio: 4/3, // Tỉ lệ mặc định ban đầu là 4:3, nhưng được phép chọn cái khác
                                viewMode: 1,
                                autoCropArea: 1,
                            });

                            // Highlight đúng nút 4:3 lúc mới mở
                            app.crop.updateRatioButtons(4/3);
                        } else if (mode === 'avatar') {
                            if(ratioContainer) ratioContainer.classList.add('hidden');
                            app.crop.cropper = new Cropper(img, {
                                aspectRatio: 1,
                                viewMode: 1,
                                autoCropArea: 1,
                            });
                        }
                    };
                    img.src = url;
                },

                setRatio: (ratio) => {
                    if (app.crop.cropper) {
                        app.crop.cropper.setAspectRatio(ratio);
                        app.crop.updateRatioButtons(ratio);
                    }
                },

                updateRatioButtons: (activeRatio) => {
                    document.querySelectorAll('.crop-ratio-btn').forEach(btn => {
                        const r = parseFloat(btn.dataset.ratio);
                        if (Math.abs(r - activeRatio) < 0.01) {
                            btn.classList.add('bg-black', 'text-white', 'border-black');
                            btn.classList.remove('bg-white', 'text-gray-700', 'border-gray-300', 'hover:bg-gray-100');
                        } else {
                            btn.classList.remove('bg-black', 'text-white', 'border-black');
                            btn.classList.add('bg-white', 'text-gray-700', 'border-gray-300', 'hover:bg-gray-100');
                        }
                    });
                },

                close: () => {
                    document.getElementById('crop-modal').classList.add('hidden');
                    if (app.crop.cropper) {
                        app.crop.cropper.destroy();
                        app.crop.cropper = null;
                    }
                    app.ui.unlockScroll();

                    // Nếu là lần cắt bắt buộc mà user bấm Hủy -> Xóa trắng để chọn ảnh khác
                    if (app.crop.isMandatory) {
                        app.upload.removeImage();
                        app.crop.isMandatory = false;
                    }
                },

                apply: () => {
                    if (!app.crop.cropper) return;

                    const btn = document.querySelector('#crop-modal button:last-child');
                    const originalText = btn.innerHTML;
                    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang cắt...';
                    btn.disabled = true;

                    setTimeout(() => {
                        const canvas = app.crop.cropper.getCroppedCanvas({
                            imageSmoothingEnabled: true,
                            imageSmoothingQuality: 'high',
                        });

                        if (app.crop.mode === 'main') {
                            const h = canvas.height;
                            const w = canvas.width;

                            if (h < 1080) {
                                app.ui.showAlert(`Ảnh sau khi cắt có độ phân giải quá thấp (${w}x${h}). Yêu cầu chiều cao tối thiểu 1080px.`);
                                btn.innerHTML = originalText;
                                btn.disabled = false;
                                return;
                            }

                            canvas.toBlob((blob) => {
                                if (app.crop.originalFile && app.crop.originalFile.name) {
                                    blob.name = app.crop.originalFile.name;
                                } else {
                                    blob.name = 'cropped_image.jpg';
                                }

                                const wasMandatory = app.crop.isMandatory;
                                app.crop.isMandatory = false; // Tắt cờ để hàm close() không xóa ảnh
                                app.crop.close();

                                if (wasMandatory) {
                                    // Nếu là bước cắt đầu tiên bắt buộc -> thiết lập preview hoàn chỉnh
                                    app.upload.setupPreview(blob);
                                } else {
                                    // Nếu là cắt thủ công lại sau này -> chỉ thay thế ảnh hiện tại
                                    app.rawFile = blob;
                                    const url = URL.createObjectURL(blob);
                                    const previewImg = document.getElementById('preview-img');
                                    previewImg.src = url;

                                    document.querySelectorAll('.blur-panel').forEach(p => p.remove());
                                    if (app.upload.updateBlurBtn) app.upload.updateBlurBtn();

                                    app.wmState = { x: 0.5, y: 0.5, color: 'white' };
                    if(app.upload.resetFilters) app.upload.resetFilters();
                                    const chkWmBlack = document.getElementById('chk-wm-black');
                                    if (chkWmBlack) chkWmBlack.checked = false;
                                    if (app.upload.toggleColor) app.upload.toggleColor(false);

                                    const wmDrag = document.getElementById('draggable-watermark');
                                    if (wmDrag) {
                                        wmDrag.style.top = '50%';
                                        wmDrag.style.left = '50%';
                                        wmDrag.style.transform = 'translate(-50%, -50%)';
                                    }
                                }

                                btn.innerHTML = originalText;
                                btn.disabled = false;
                            }, app.utils.getTargetMimeType(), 0.85);

                        } else if (app.crop.mode === 'avatar') {
                            canvas.toBlob(async (blob) => {
                                if (blob.size > 3 * 1024 * 1024) {
                                    app.ui.showAlert('Ảnh sau khi cắt vẫn quá lớn (>3MB)! Vui lòng chọn ảnh/vùng nhỏ hơn.');
                                    btn.innerHTML = originalText;
                                    btn.disabled = false;
                                    return;
                                }

                                app.crop.close();
                                btn.innerHTML = originalText;
                                btn.disabled = false;

                                app.auth.uploadAvatarBlob(blob);
                            }, app.utils.getTargetMimeType(), 0.8);
                        }
                    }, 50);
                }
            };

window.app.currentExif = { camera: 'N/A', params: 'N/A' };

window.app.wmState = { x: 0.5, y: 0.5, color: 'white' };

window.app.captcha = {
                widgetId: null,
                resolvePromise: null,
                rejectPromise: null,
                timeoutTimer: null,
                isOpen: false,

                request: () => {
                    return new Promise((resolve, reject) => {
                        app.captcha.resolvePromise = resolve;
                        app.captcha.rejectPromise = reject;
                        app.captcha.openModal();
                    });
                },

                openModal: () => {
                    if(app.captcha.isOpen) return;
                    app.captcha.isOpen = true;
                    const modal = document.getElementById('captcha-modal');
                    const content = document.getElementById('captcha-content');
                    const container = document.getElementById('captcha-container');
                    const status = document.getElementById('captcha-status');
                    const actions = document.getElementById('captcha-actions');

                    modal.classList.remove('hidden');
                    setTimeout(() => {
                        modal.classList.remove('opacity-0');
                        content.classList.remove('scale-95');
                    }, 10);

                    status.innerText = "Đang kiểm tra...";
                    status.className = "text-xs font-bold text-gray-500 mt-2 h-4 text-center";
                    actions.classList.add('hidden');

                    if (window.turnstile) {
                        if (app.captcha.widgetId !== null) {
                            window.turnstile.reset(app.captcha.widgetId);
                        } else {
                            container.innerHTML = '';
                            app.captcha.widgetId = window.turnstile.render(container, {
                                sitekey: '0x4AAAAAAC0MVeewmy6kwkTF',
                                callback: app.captcha.onSuccess,
                                'error-callback': app.captcha.onError,
                                'timeout-callback': app.captcha.onError
                            });
                        }
                    } else {
                        status.innerText = "Lỗi: Không tải được hệ thống xác thực.";
                        status.className = "text-xs font-bold text-red-500 mt-2 h-4 text-center";
                        actions.classList.remove('hidden');
                    }

                    clearTimeout(app.captcha.timeoutTimer);
                    app.captcha.timeoutTimer = setTimeout(() => {
                        status.innerText = "Kiểm tra quá hạn (12s). Vui lòng thử lại.";
                        status.className = "text-xs font-bold text-amber-600 mt-2 h-4 text-center";
                        actions.classList.remove('hidden');
                    }, 12000);
                },

                onSuccess: (token) => {
                    clearTimeout(app.captcha.timeoutTimer);
                    const status = document.getElementById('captcha-status');
                    status.innerText = "Xác thực thành công!";
                    status.className = "text-xs font-bold text-green-600 mt-2 h-4 text-center";

                    setTimeout(() => {
                        app.captcha.closeModal();
                        if (app.captcha.resolvePromise) {
                            app.captcha.resolvePromise(token);
                            app.captcha.resolvePromise = null;
                            app.captcha.rejectPromise = null;
                        }
                    }, 500);
                },

                onError: () => {
                    clearTimeout(app.captcha.timeoutTimer);
                    const status = document.getElementById('captcha-status');
                    const actions = document.getElementById('captcha-actions');
                    status.innerText = "Xác thực thất bại.";
                    status.className = "text-xs font-bold text-red-600 mt-2 h-4 text-center";
                    actions.classList.remove('hidden');
                },

                retry: () => {
                    const actions = document.getElementById('captcha-actions');
                    const status = document.getElementById('captcha-status');
                    actions.classList.add('hidden');
                    status.innerText = "Đang tải lại...";
                    status.className = "text-xs font-bold text-gray-500 mt-2 h-4 text-center";

                    if (window.turnstile && app.captcha.widgetId !== null) {
                        window.turnstile.reset(app.captcha.widgetId);
                    }

                    clearTimeout(app.captcha.timeoutTimer);
                    app.captcha.timeoutTimer = setTimeout(() => {
                        status.innerText = "Kiểm tra quá hạn (12s). Vui lòng thử lại.";
                        status.className = "text-xs font-bold text-amber-600 mt-2 h-4 text-center";
                        actions.classList.remove('hidden');
                    }, 12000);
                },

                closeModal: () => {
                    app.captcha.isOpen = false;
                    clearTimeout(app.captcha.timeoutTimer);
                    const modal = document.getElementById('captcha-modal');
                    const content = document.getElementById('captcha-content');

                    modal.classList.add('opacity-0');
                    content.classList.add('scale-95');

                    setTimeout(() => {
                        modal.classList.add('hidden');
                    }, 300);
                },

                cancel: () => {
                    app.captcha.closeModal();
                    if (app.captcha.rejectPromise) {
                        app.captcha.rejectPromise(new Error("CAPTCHA_CANCELLED"));
                        app.captcha.resolvePromise = null;
                        app.captcha.rejectPromise = null;
                    }
                }
            };

