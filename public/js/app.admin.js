window.app = window.app || {};
window.app.admin = {
    api: async (action, payload = {}) => {
        const { data: { session } } = await window.sb.auth.getSession();
        const token = session?.access_token;
        const res = await fetch('/api/admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, payload, token })
        });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || 'API Error');
        return data;
    },
    
  adminInterval: null,
  commentsData: {
    data: [],
    page: 1
  },
  originalData: {},
  checkPlateAdmin: async (inputEl, id, type) => {
    const val = inputEl.value.trim().replace(/[^A-Z0-9-]/gi, '').toUpperCase();
    inputEl.value = val;
    const origKey = type + '_' + id;
    const orig = app.admin.originalData[origKey];
    if (!orig) return;
    const pre = type === 'photo' ? 'adm-p-' : 'req-';
    const elOp = document.getElementById(pre + 'op-' + id);
    const elType = document.getElementById(pre + 'type-' + id);
    const elRoute = document.getElementById(pre + 'route-' + id);
    const elModel = document.getElementById(pre + 'model-' + id);

    // Trả lại thông tin gốc nếu nhập lại biển số cũ
    if (val === orig.plate) {
      if (elOp) elOp.value = orig.operator || '';
      if (elType) elType.value = orig.type || 'bus';
      if (elRoute) elRoute.value = orig.route || '';
      if (elModel) elModel.value = orig.model || '';

      // Thêm hiệu ứng chớp xanh để báo đã khôi phục
      inputEl.classList.add('ring-2', 'ring-green-500');
      setTimeout(() => inputEl.classList.remove('ring-2', 'ring-green-500'), 500);
      return;
    }

    // Lấy dữ liệu biển số mới từ DB
    try {
      const {
        data: vData
      } = await app.admin.api("q1", {
        val
      });
      if (vData) {
        if (elModel) elModel.value = vData.model || '';
        const {
          data: pDataArray
        } = await app.admin.api("q2", {
          val
        });
        if (pDataArray && pDataArray.length > 0) {
          let validPhoto = pDataArray.find(p => p.route_no !== 'Ngoài giờ hoạt động');
          if (!validPhoto) {
            validPhoto = {
              operator: pDataArray[0].operator,
              route_no: '',
              type: pDataArray[0].type
            };
          }
          if (elOp) elOp.value = validPhoto.operator || '';
          if (elRoute) elRoute.value = validPhoto.route_no || '';
          if (elType) elType.value = validPhoto.type || 'bus';
        }

        // Thêm hiệu ứng chớp vàng để báo đã load dữ liệu có sẵn
        inputEl.classList.add('ring-2', 'ring-amber-500');
        setTimeout(() => inputEl.classList.remove('ring-2', 'ring-amber-500'), 500);
      }
    } catch (e) {
      console.error("Lỗi tự điền BKS Admin:", e);
    }
  },
  // --- THÊM STATE CHO TAB MANAGER ---
  manager: {
    activeTab: 'denied',
    denied: {
      data: [],
      filtered: [],
      page: 1,
      denierMap: {}
    },
    logs: {
      data: [],
      filtered: [],
      page: 1
    },
    bans: {
      data: [],
      filtered: [],
      page: 1
    }
  },
  // ----------------------------------

  logAction: async (actionType, targetId, details) => {
    if (!app.user) return;
    try {
      await app.admin.api("q3", {
        app,
        actionType,
        targetId,
        details
      });
    } catch (e) {
      console.error("Lỗi ghi log:", e);
    }
  },
  checkNotification: async () => {
    if (app.role !== 'admin' && app.role !== 'manager') return;
    const total = await app.admin.refreshCounts();
    const iconEl = document.getElementById('nav-admin-icon');
    if (app.admin.adminInterval) clearInterval(app.admin.adminInterval);
    iconEl.className = "fa-solid fa-shield-halved md:mr-1";
    if (total > 0) {
      let showNumber = false;
      app.admin.adminInterval = setInterval(() => {
        showNumber = !showNumber;
        if (showNumber) {
          const num = total > 9 ? 9 : total;
          iconEl.className = `fa-solid fa-${num} md:mr-1`;
        } else {
          iconEl.className = "fa-solid fa-shield-halved md:mr-1";
        }
      }, 3000);
    }
  },
  refreshCounts: async () => {
    try {
      const {
        count: pCount
      } = await app.admin.api("q4", {});
      const {
        data: reqs
      } = await app.admin.api("q5", {});
      let editCount = 0;
      let delCount = 0;
      if (reqs) {
        reqs.forEach(r => {
          if (r.new_data.request_type === 'delete_photo') delCount++;else editCount++;
        });
      }
      document.getElementById('count-photos').innerText = pCount || 0;
      document.getElementById('count-requests').innerText = editCount;
      document.getElementById('count-delete').innerText = delCount;
      return (pCount || 0) + editCount + delCount;
    } catch (err) {
      console.error("Lỗi đếm:", err);
      return 0;
    }
  },
  openZoom: (url, showToolbar = false) => {
    const modal = document.getElementById('admin-zoom-modal');
    const img = document.getElementById('admin-zoom-img');
    img.src = url;
    img.classList.remove('zoom-img-active');
    modal.classList.remove('hidden');
    app.ui.lockScroll();
    img.classList.remove('modal-content-leave');
    img.classList.add('modal-content-enter');

    // Logic hiển thị Toolbar với Animation Trượt
    const toolbar = document.getElementById('zoom-toolbar');
    const hint = document.getElementById('zoom-hint');
    if (toolbar && hint) {
      if (showToolbar && app.currentPhoto) {
        toolbar.classList.remove('opacity-0', 'translate-y-8', 'pointer-events-none');
        toolbar.classList.add('opacity-100', 'translate-y-0', 'pointer-events-auto');
        hint.classList.add('opacity-0');

        // Đổ dữ liệu
        const uploaderName = app.utils.cleanText(app.currentPhoto.profiles?.username || 'Ẩn danh');
        const uploaderAvatar = app.currentPhoto.profiles?.avatar_url ? app.utils.getProxiedUrl(app.currentPhoto.profiles.avatar_url.replace(/"/g, ''), 'avatar.jpg', 'avatar') : 'https://files.catbox.moe/zzh1q1.png';
        document.getElementById('zoom-uploader-name').innerText = uploaderName;
        document.getElementById('zoom-uploader-avatar').src = uploaderAvatar;

        // Check trạng thái
        const mainLikeBtn = document.getElementById('btn-like');
        const zBtn = document.getElementById('zoom-btn-like');
        const isLiked = mainLikeBtn && mainLikeBtn.classList.contains('bg-gray-400');
        const isDenied = app.currentPhoto.status === 'denied';
        if (isLiked || isDenied) {
          zBtn.className = "flex items-center justify-center gap-1.5 bg-black text-white px-3 py-2 md:px-4 md:py-2.5 rounded-lg font-bold text-[11px] md:text-sm transition-colors whitespace-nowrap";
          zBtn.innerHTML = isDenied ? '<i class="fa-solid fa-ban text-sm md:text-base"></i> <span class="hidden md:inline">Từ chối</span>' : '<i class="fa-solid fa-check text-sm md:text-base"></i> <span class="hidden md:inline">Đã thích</span>';
          zBtn.disabled = isDenied;
        } else {
          zBtn.className = "flex items-center justify-center gap-1.5 text-gray-800 bg-transparent hover:bg-black hover:text-white px-3 py-2 md:px-4 md:py-2.5 rounded-lg font-bold text-[11px] md:text-sm transition-colors whitespace-nowrap";
          zBtn.innerHTML = '<i class="fa-regular fa-thumbs-up text-sm md:text-base"></i> <span class="hidden md:inline">Thích</span>';
          zBtn.disabled = false;
        }
      } else {
        toolbar.classList.add('opacity-0', 'translate-y-8', 'pointer-events-none');
        toolbar.classList.remove('opacity-100', 'translate-y-0', 'pointer-events-auto');
        hint.classList.remove('opacity-0');
      }
    }
  },
  closeZoom: () => {
    const modal = document.getElementById('admin-zoom-modal');
    const img = document.getElementById('admin-zoom-img');
    const toolbar = document.getElementById('zoom-toolbar');
    img.classList.remove('modal-content-enter');
    img.classList.add('modal-content-leave');
    if (toolbar) {
      toolbar.classList.add('opacity-0', 'translate-y-8', 'pointer-events-none');
      toolbar.classList.remove('opacity-100', 'translate-y-0', 'pointer-events-auto');
    }
    setTimeout(() => {
      modal.classList.add('hidden');
      img.src = "";
      img.classList.remove('modal-content-leave');
      app.ui.unlockScroll();
    }, 200);
  },
  loadTab: async tab => {
    app.adminTab = tab;
    app.admin.refreshCounts().then(total => app.admin.checkNotification());
    const content = document.getElementById('admin-content');
    content.innerHTML = '<p class="text-gray-500 italic p-4">Đang tải...</p>';

    // Update UI Buttons
    ['photos', 'requests', 'delete', 'manager', 'comments'].forEach(t => {
      const btn = document.getElementById(`adm-tab-${t}`);
      if (!btn) return;
      if (t === tab) {
        btn.className = "px-5 py-2 bg-black text-white font-bold rounded-md text-sm shadow-sm transition whitespace-nowrap";
      } else {
        btn.className = "px-5 py-2 bg-white border border-gray-300 text-gray-600 font-bold rounded-md text-sm hover:bg-gray-50 transition whitespace-nowrap";
      }
    });
    try {
      if (tab === 'photos') {
        const {
          data: rawPhotos,
          error
        } = await app.admin.api("q6", {});
        if (error) throw error;
        if (!rawPhotos || rawPhotos.length === 0) {
          content.innerHTML = '<p class="p-4">Không có ảnh nào chờ duyệt.</p>';
          return;
        }
        const pendingPlates = [...new Set(rawPhotos.map(p => p.license_plate).filter(Boolean))];
        const pendingOps = [...new Set(rawPhotos.map(p => app.utils.cleanText(p.operator || '')).filter(Boolean))];
        const pendingRoutes = [...new Set(rawPhotos.map(p => app.utils.cleanText(p.route_no || '')).filter(Boolean))];
        const pendingModels = [...new Set(rawPhotos.map(p => app.utils.cleanText(p.vehicles?.model || '')).filter(Boolean))];
        let approvedPlateSet = new Set();
        let approvedOpSet = new Set();
        let approvedRouteSet = new Set();
        let approvedModelSet = new Set();
        if (pendingPlates.length > 0) {
          const {
            data: approvedPlates
          } = await app.admin.api("q7", {
            pendingPlates
          });
          approvedPlateSet = new Set((approvedPlates || []).map(p => (p.license_plate || '').toUpperCase()));
        }
        if (pendingOps.length > 0) {
          const {
            data: approvedOps
          } = await app.admin.api("q8", {
            pendingOps
          });
          approvedOpSet = new Set((approvedOps || []).map(p => app.utils.cleanText(p.operator || '')));
        }
        if (pendingRoutes.length > 0) {
          const {
            data: approvedRoutes
          } = await app.admin.api("q9", {
            pendingRoutes
          });
          approvedRouteSet = new Set((approvedRoutes || []).map(p => app.utils.cleanText(p.route_no || '')));
        }
        if (pendingModels.length > 0) {
          const {
            data: approvedModels
          } = await app.admin.api("q10", {
            pendingModels
          });
          approvedModelSet = new Set((approvedModels || []).map(p => app.utils.cleanText(p.vehicles?.model || '')));
        }

        // THÊM: Sắp xếp ưu tiên (Admin/Manager lên đầu, theo thứ tự up trước xếp trước)
        const photos = rawPhotos.sort((a, b) => {
          const roleA = a.profiles?.role || 'user';
          const roleB = b.profiles?.role || 'user';
          const isPrivilegedA = roleA === 'admin' || roleA === 'manager' ? 1 : 0;
          const isPrivilegedB = roleB === 'admin' || roleB === 'manager' ? 1 : 0;
          if (isPrivilegedA !== isPrivilegedB) {
            return isPrivilegedB - isPrivilegedA;
          }
          return a.id - b.id;
        });
        content.innerHTML = photos.map(p => {
          const op = app.utils.cleanText(p.operator || '');
          const type = p.type || 'bus';
          const route = app.utils.cleanText(p.route_no || '');
          const model = app.utils.cleanText(p.vehicles?.model || '');
          const location = app.utils.cleanText(p.location);
          const note = app.utils.cleanText(p.note);
          const safeUsername = app.utils.cleanText(p.profiles?.username || 'Ẩn danh');
          const safePlate = app.utils.cleanText(p.license_plate);
          if (!app.admin.originalData) app.admin.originalData = {};
          app.admin.originalData['photo_' + p.id] = {
            plate: safePlate,
            operator: op,
            type: type,
            route: route,
            model: model
          };
          const tagNew = '<span class="bg-black text-white px-1.5 py-0.5 rounded text-[9px] font-bold ml-1 tracking-wider">MỚI</span>';
          const isNewOp = op && !approvedOpSet.has(op);
          const isNewRoute = route && !approvedRouteSet.has(route);
          const isNewModel = model && !approvedModelSet.has(model);
          return `
                                <div class="admin-card overflow-visible">
                                    <div class="admin-card-header">
                                        <div class="flex items-center gap-2">
                                            <span class="font-bold text-sm">${safePlate}</span>
                                            ${!approvedPlateSet.has(safePlate.toUpperCase()) ? '<span class="badge-xe-moi"><i class="fa-solid fa-sparkles"></i> XE MỚI</span>' : ''}
                                        </div>
                                        <span class="text-xs text-gray-500">${safeUsername}</span>
                                    </div>
                                    <div class="relative w-full bg-gray-200 border-y border-gray-200">
                                        <img loading="lazy" src="${app.utils.getProxiedUrl(p.url)}" class="w-full h-auto object-contain">
                                        <button onclick="app.admin.openZoom('${app.utils.getProxiedUrl(p.url)}')" class="absolute top-2 right-2 bg-black/50 text-white w-8 h-8 rounded hover:bg-black flex items-center justify-center transition" title="Soi ảnh"><i class="fa-solid fa-expand"></i></button>
                                    </div>
                                    <div class="admin-card-body">
                                        <p class="text-[10px] text-gray-500 mb-2"><b>Ngày chụp:</b> ${p.taken_at ? p.taken_at.split('T')[0] : 'Không rõ'} | <b>Camera:</b> ${p.camera_model}</p>
                                        <div class="grid grid-cols-2 gap-2 mb-2">
                                            <div><span class="admin-label">Biển số</span><input type="text" id="adm-p-plate-${p.id}" value="${safePlate}" class="admin-input transition-all" oninput="app.utils.formatPlateInput(this)" onchange="app.admin.checkPlateAdmin(this, '${p.id}', 'photo')"></div>
                                            <div>
                                                <span class="admin-label">Đơn vị${isNewOp ? tagNew : ''}</span>
                                                <div class="relative">
                                                    <input type="text" id="adm-p-op-${p.id}" value="${op}" class="admin-input" autocomplete="off" oninput="app.utils.formatNoPunctuation(this); app.utils.triggerSuggestion('adm-p-op-${p.id}', 'adm-sug-op-${p.id}', this.value, 'operator')">
                                                    <div id="adm-sug-op-${p.id}" class="suggestion-box"></div>
                                                </div>
                                            </div>
                                            <div><span class="admin-label">Loại xe</span><select id="adm-p-type-${p.id}" class="admin-input"><option value="bus" ${type === 'bus' ? 'selected' : ''}>Xe buýt</option><option value="coach" ${type === 'coach' ? 'selected' : ''}>Xe khách</option></select></div>
                                            <div>
                                                <span class="admin-label">Tuyến${isNewRoute ? tagNew : ''}</span>
                                                <div class="relative">
                                                    <input type="text" id="adm-p-route-${p.id}" value="${route}" class="admin-input" autocomplete="off" onfocus="app.utils.triggerRouteSuggestion('adm-p-route-${p.id}', 'adm-sug-route-${p.id}', '')" oninput="app.utils.triggerRouteSuggestion('adm-p-route-${p.id}', 'adm-sug-route-${p.id}', this.value)">
                                                    <div id="adm-sug-route-${p.id}" class="suggestion-box"></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="grid grid-cols-2 gap-2 mb-2">
                                            <div>
                                                <span class="admin-label">Dòng xe${isNewModel ? tagNew : ''}</span>
                                                <div class="relative">
                                                    <input type="text" id="adm-p-model-${p.id}" value="${model}" class="admin-input" autocomplete="off" oninput="app.utils.triggerSuggestion('adm-p-model-${p.id}', 'adm-sug-model-${p.id}', this.value, 'model')">
                                                    <div id="adm-sug-model-${p.id}" class="suggestion-box"></div>
                                                </div>
                                            </div>
                                            <div><span class="admin-label">Vị trí</span><input type="text" id="adm-p-location-${p.id}" value="${location}" class="admin-input"></div>
                                        </div>
                                        <div><span class="admin-label">Ghi chú</span><textarea id="adm-p-note-${p.id}" rows="2" class="admin-input">${note}</textarea></div>
                                        ${(() => {
            const isOwnPhoto = p.uploader_id === app.user.id;
            const canApprove = !isOwnPhoto || app.role === 'manager';
            const canDeny = !isOwnPhoto || app.role === 'manager';
            let actionButtons = '<div class="flex gap-2 mt-2">';
            if (canApprove) {
              actionButtons += `<button onclick="app.admin.approvePhoto('${p.id}', '${p.uploader_id}', this)" class="flex-1 bg-green-600 text-white py-1.5 text-xs font-bold rounded hover:bg-green-700">DUYỆT</button>`;
            } else {
              actionButtons += `<div class="flex-1 bg-gray-100 text-gray-400 py-1.5 text-xs font-bold rounded text-center border border-gray-200 cursor-not-allowed">
                                                <i class="fa-solid fa-lock mr-1"></i> Không thể tự duyệt
                                            </div>`;
            }
            if (canDeny) {
              actionButtons += `<button onclick="app.admin.denyPhoto('${p.id}', '${p.uploader_id}', this)" class="flex-1 bg-red-600 text-white py-1.5 text-xs font-bold rounded hover:bg-red-700">TỪ CHỐI</button>`;
            }
            actionButtons += '</div>';
            return actionButtons;
          })()}
                                    </div>
                                </div>`;
        }).join('');
      } else if (tab === 'delete') {
        let html = '';
        if (app.role === 'manager') {
          html += `
                                <div class="col-span-full mb-6 p-5 bg-red-50 border border-red-200 rounded-lg shadow-sm">
                                    <h3 class="font-bold text-sm mb-3 text-red-700 uppercase"><i class="fa-solid fa-triangle-exclamation"></i> Manager Xóa ảnh trực tiếp</h3>
                                    <div class="flex flex-col md:flex-row gap-3">
                                        <input type="text" id="adm-direct-delete-id" placeholder="ID ảnh hoặc Link ảnh..." class="flex-1 border border-red-200 p-2.5 text-sm rounded-md outline-none focus:ring-2 focus:ring-red-500">
                                        <input type="text" id="adm-direct-delete-reason" placeholder="Lý do xóa..." class="flex-1 border border-red-200 p-2.5 text-sm rounded-md outline-none focus:ring-2 focus:ring-red-500">
                                        <button onclick="app.admin.directDeleteInput(this)" class="bg-red-600 text-white px-6 py-2.5 font-bold rounded-md hover:bg-red-700 transition whitespace-nowrap">Xóa Ngay</button>
                                    </div>
                                </div>
                                `;
        }
        html += '<div class="col-span-full"><h3 class="font-bold text-sm mb-3 uppercase border-b pb-2">Danh sách user yêu cầu xóa</h3></div>';
        let {
          data: reqs,
          error
        } = await app.admin.api("q11", {});
        if (error) throw error;
        const deleteReqs = reqs ? reqs.filter(r => r.new_data.request_type === 'delete_photo') : [];
        if (!deleteReqs || deleteReqs.length === 0) {
          content.innerHTML = html + '<p class="col-span-full p-4">Không có yêu cầu xóa nào.</p>';
          return;
        }
        const photoIds = deleteReqs.map(r => r.new_data.photo_id);
        const {
          data: photos
        } = await app.admin.api("q12", {
          photoIds
        });
        const photoMap = {};
        if (photos) photos.forEach(p => photoMap[p.id] = p);
        const userIds = [...new Set(deleteReqs.map(r => r.requester_id))];
        const {
          data: users
        } = await app.admin.api("q13", {
          userIds
        });
        const userMap = {};
        if (users) users.forEach(u => userMap[u.id] = u.username);
        html += deleteReqs.map(req => {
          const photo = photoMap[req.new_data.photo_id];
          const username = app.utils.cleanText(userMap[req.requester_id] || 'Ẩn danh');
          const userReason = app.utils.cleanText(req.new_data.reason || 'Không có lý do');
          return `
                                <div class="admin-card overflow-visible">
                                    <div class="admin-card-header bg-red-50">
                                        <span class="font-bold text-xs uppercase text-red-600">YÊU CẦU XÓA</span>
                                        <span class="text-xs text-gray-500">${username}</span>
                                    </div>
                                    <div class="relative w-full bg-gray-200 border-y border-gray-200">
                                        <img loading="lazy" src="${app.utils.getProxiedUrl(photo?.url)}" class="w-full h-auto object-contain">
                                        <button onclick="app.admin.openZoom('${app.utils.getProxiedUrl(photo?.url)}')" class="absolute top-2 right-2 bg-black/50 text-white w-8 h-8 rounded hover:bg-black flex items-center justify-center transition" title="Soi ảnh"><i class="fa-solid fa-expand"></i></button>
                                    </div>
                                    <div class="admin-card-body text-xs">
                                        <p class="font-bold text-sm mb-1">${photo?.license_plate || 'Đã mất dữ liệu'}</p>
                                        <div class="mb-3 mt-2"><span class="admin-label">Lý do user nhập:</span><p class="bg-gray-50 p-2 border rounded text-red-700 italic">"${userReason}"</p></div>
                                        <div class="flex gap-2 mt-3">
                                            <button onclick="app.admin.approveDeleteReq('${req.id}', '${req.new_data.photo_id}', '${req.requester_id}', '${userReason}', this)" class="flex-1 bg-red-600 text-white py-1.5 font-bold rounded hover:bg-red-700">DUYỆT XÓA</button>
                                            <button onclick="app.admin.denyReq('${req.id}', this)" class="flex-1 bg-gray-600 text-white py-1.5 font-bold rounded hover:bg-gray-700">TỪ CHỐI</button>
                                        </div>
                                    </div>
                                </div>`;
        }).join('');
        content.innerHTML = html;
      } else if (tab === 'requests') {
        let {
          data: reqs,
          error
        } = await app.admin.api("q14", {});
        if (error) throw error;
        if (!reqs || reqs.length === 0) {
          content.innerHTML = '<p class="p-4">Không có yêu cầu nào.</p>';
          return;
        }
        const userIds = [...new Set(reqs.map(r => r.requester_id))];
        const {
          data: users
        } = await app.admin.api("q15", {
          userIds
        });
        const userMap = {};
        if (users) users.forEach(u => userMap[u.id] = u.username);
        const plates = reqs.map(r => r.license_plate);
        const {
          data: curVehicles
        } = await app.admin.api("q16", {
          plates
        });
        const vMap = {};
        if (curVehicles) curVehicles.forEach(v => vMap[v.license_plate] = v);
        const photoIdsReq = reqs.map(r => r.new_data.photo_id).filter(Boolean);
        const {
          data: curPhotos
        } = await app.admin.api("q17", {
          photoIdsReq
        });
        const pMap = {};
        if (curPhotos) curPhotos.forEach(p => pMap[p.id] = p);
        content.innerHTML = reqs.map(r => {
          const d = r.new_data;
          const type = d.request_type || 'Unknown';
          const username = userMap[r.requester_id] || 'Ẩn danh';
          const curV = vMap[r.license_plate] || {};
          const curP = pMap[d.photo_id] || {};
          if (type === 'update_vehicle_info') {
            const tagNew = '<span class="text-red-500 font-bold ml-1 text-[9px]">[MỚI]</span>';
            if (!app.admin.originalData) app.admin.originalData = {};
            app.admin.originalData['req_' + r.id] = {
              plate: d.license_plate,
              operator: d.operator,
              type: d.type,
              route: d.route,
              model: d.model
            };
            return `
                                    <div class="admin-card overflow-visible">
                                        <div class="admin-card-header"><span class="font-bold text-xs uppercase text-blue-600">SỬA THÔNG TIN</span><span class="text-xs text-gray-500">${app.utils.cleanText(username)}</span></div>
                                        <div class="admin-card-body text-xs">
                                            <div class="grid grid-cols-2 gap-2 mb-2">
                                                <div><span class="admin-label">BKS ${d.license_plate !== curV.license_plate ? tagNew : ''}</span><input type="text" id="req-plate-${r.id}" value="${app.utils.escapeAttr(d.license_plate)}" class="admin-input font-bold transition-all" oninput="app.utils.formatPlateInput(this)" onchange="app.admin.checkPlateAdmin(this, '${r.id}', 'req')"></div>
                                                <div>
                                                    <span class="admin-label">Đơn vị ${d.operator !== curP.operator ? tagNew : ''}</span>
                                                    <div class="relative">
                                                        <input type="text" id="req-op-${r.id}" value="${app.utils.escapeAttr(d.operator)}" class="admin-input" oninput="app.utils.formatNoPunctuation(this); app.utils.triggerSuggestion('req-op-${r.id}', 'req-sug-op-${r.id}', this.value, 'operator')">
                                                        <div id="req-sug-op-${r.id}" class="suggestion-box"></div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <span class="admin-label">Dòng xe ${d.model !== curV.model ? tagNew : ''}</span>
                                                    <div class="relative">
                                                        <input type="text" id="req-model-${r.id}" value="${app.utils.escapeAttr(d.model || '')}" class="admin-input" oninput="app.utils.triggerSuggestion('req-model-${r.id}', 'req-sug-model-${r.id}', this.value, 'model')">
                                                        <div id="req-sug-model-${r.id}" class="suggestion-box"></div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <span class="admin-label">Tuyến ${d.route !== curP.route_no ? tagNew : ''}</span>
                                                    <div class="relative">
                                                        <input type="text" id="req-route-${r.id}" value="${app.utils.escapeAttr(d.route || '')}" class="admin-input" autocomplete="off" onfocus="app.utils.triggerRouteSuggestion('req-route-${r.id}', 'req-sug-route-${r.id}', '')" oninput="app.utils.triggerRouteSuggestion('req-route-${r.id}', 'req-sug-route-${r.id}', this.value)">
                                                        <div id="req-sug-route-${r.id}" class="suggestion-box"></div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="mb-2"><span class="admin-label">Loại xe ${d.type !== curP.type ? tagNew : ''}</span><select id="req-type-${r.id}" class="admin-input"><option value="bus" ${d.type === 'bus' ? 'selected' : ''}>Xe buýt</option><option value="coach" ${d.type === 'coach' ? 'selected' : ''}>Xe khách</option></select></div>
                                            <div class="mb-2"><span class="admin-label">Vị trí (Chỉ cập nhật ảnh này)</span><input type="text" id="req-loc-${r.id}" value="${app.utils.escapeAttr(d.location || '')}" class="admin-input"></div>
                                            <div class="mb-2"><span class="admin-label">Ghi chú (Chỉ cập nhật ảnh này)</span><textarea id="req-note-${r.id}" class="admin-input">${app.utils.cleanText(d.note || '')}</textarea></div>

                                            <div class="flex gap-2 mt-3">
                                                <button onclick="app.admin.approveReq('${r.id}', this, 'info')" class="flex-1 bg-green-600 text-white py-1.5 font-bold rounded hover:bg-green-700">DUYỆT</button>
                                                <button onclick="app.admin.denyReq('${r.id}', this)" class="flex-1 bg-red-600 text-white py-1.5 font-bold rounded hover:bg-red-700">HỦY</button>
                                            </div>
                                        </div>
                                    </div>`;
          } else if (type === 'update_history') {
            let details = `<p class="mb-2 font-bold text-red-500">[MỚI] Cập nhật ${d.history_items.length} mục lịch sử:</p>`;
            d.history_items.forEach(h => {
              details += `<p class="pl-2 border-l-2 border-gray-300 mb-1">- ${h.operator} (${h.route})</p>`;
            });
            return `
                                    <div class="admin-card">
                                        <div class="admin-card-header"><span class="font-bold text-xs uppercase text-amber-600">SỬA LỊCH SỬ XE: ${r.license_plate}</span><span class="text-xs text-gray-500">${username}</span></div>
                                        <div class="admin-card-body text-xs">
                                            <div class="mb-3 scroll-y max-h-40 overflow-auto">${details}</div>
                                            <div class="flex gap-2">
                                                <button onclick="app.admin.approveReq('${r.id}', this, 'history')" class="flex-1 bg-green-600 text-white py-1.5 font-bold rounded hover:bg-green-700">DUYỆT</button>
                                                <button onclick="app.admin.denyReq('${r.id}', this)" class="flex-1 bg-red-600 text-white py-1.5 font-bold rounded hover:bg-red-700">HỦY</button>
                                            </div>
                                        </div>
                                    </div>`;
          } else if (type === 'update_vehicle_details') {
            const tagNew = '<span class="text-red-500 font-bold ml-1 text-[9px]">[MỚI]</span>';
            if (!app.admin.originalData) app.admin.originalData = {};
            app.admin.originalData['req_' + r.id] = {
              plate: d.license_plate,
              operator: d.operator,
              type: d.type,
              route: d.route,
              model: d.model
            };
            return `
                                    <div class="admin-card overflow-visible">
                                        <div class="admin-card-header"><span class="font-bold text-xs uppercase text-purple-600">SỬA HỒ SƠ XE: ${r.license_plate}</span><span class="text-xs text-gray-500">${username}</span></div>
                                        <div class="admin-card-body text-xs">
                                            <div class="mb-2">
                                                <span class="admin-label">Dòng xe ${d.model !== curV.model ? tagNew : ''}</span>
                                                <div class="relative">
                                                    <input type="text" id="req-v-model-${r.id}" value="${app.utils.escapeAttr(d.model || '')}" class="admin-input" oninput="app.utils.triggerSuggestion('req-v-model-${r.id}', 'req-v-sug-model-${r.id}', this.value, 'model')">
                                                    <div id="req-v-sug-model-${r.id}" class="suggestion-box"></div>
                                                </div>
                                            </div>
                                            <div class="mb-2">
                                                <span class="admin-label">Ghi chú chung về xe ${d.note !== curV.note ? tagNew : ''}</span>
                                                <textarea id="req-v-note-${r.id}" class="admin-input" rows="3">${app.utils.escapeAttr(d.note || '')}</textarea>
                                            </div>
                                            <div class="flex gap-2 mt-3">
                                                <button onclick="app.admin.approveReq('${r.id}', this, 'vehicle_details')" class="flex-1 bg-green-600 text-white py-1.5 font-bold rounded hover:bg-green-700">DUYỆT</button>
                                                <button onclick="app.admin.denyReq('${r.id}', this)" class="flex-1 bg-red-600 text-white py-1.5 font-bold rounded hover:bg-red-700">HỦY</button>
                                            </div>
                                        </div>
                                    </div>`;
          } else if (type === 'update_operator_info') {
            return `
                                    <div class="admin-card overflow-visible">
                                        <div class="admin-card-header bg-orange-50"><span class="font-bold text-xs uppercase text-orange-600">CẬP NHẬT NHÀ XE</span><span class="text-xs text-gray-500">${username}</span></div>
                                        <div class="admin-card-body text-xs">
                                            <p class="font-bold text-sm mb-3 text-black"><i class="fa-solid fa-building mr-1 text-gray-400"></i> ${app.utils.escapeAttr(d.operator_name)}</p>
                                            <div class="mb-2">
                                                <span class="admin-label">Logo URL</span>
                                                <input type="text" id="req-op-logo-${r.id}" value="${app.utils.escapeAttr(d.logo_url || '')}" class="admin-input">
                                                ${d.logo_url ? `<img src="${app.utils.escapeAttr(d.logo_url)}" class="mt-1 h-8 w-8 object-cover rounded border border-gray-200">` : ''}
                                            </div>
                                            <div class="mb-2">
                                                <span class="admin-label">Mô tả</span>
                                                <textarea id="req-op-desc-${r.id}" class="admin-input" rows="4">${app.utils.escapeAttr(d.description || '')}</textarea>
                                            </div>
                                            <div class="flex gap-2 mt-3">
                                                <button onclick="app.admin.approveReq('${r.id}', this, 'operator_info')" class="flex-1 bg-green-600 text-white py-1.5 font-bold rounded hover:bg-green-700">DUYỆT</button>
                                                <button onclick="app.admin.denyReq('${r.id}', this)" class="flex-1 bg-red-600 text-white py-1.5 font-bold rounded hover:bg-red-700">TỪ CHỐI</button>
                                            </div>
                                        </div>
                                    </div>`;
          } else if (type === 'update_model_info') {
            return `
                                    <div class="admin-card overflow-visible">
                                        <div class="admin-card-header bg-purple-50"><span class="font-bold text-xs uppercase text-purple-600">CẬP NHẬT DÒNG XE</span><span class="text-xs text-gray-500">${username}</span></div>
                                        <div class="admin-card-body text-xs">
                                            <p class="font-bold text-sm mb-3 text-black"><i class="fa-solid fa-layer-group mr-1 text-gray-400"></i> ${app.utils.escapeAttr(d.model_name)}</p>
                                            <div class="mb-2">
                                                <span class="admin-label">Logo Hãng (Tự động đồng bộ hãng)</span>
                                                <input type="text" id="req-mdl-logo-${r.id}" value="${app.utils.escapeAttr(d.logo_url || '')}" class="admin-input">
                                                ${d.logo_url ? `<img src="${app.utils.escapeAttr(d.logo_url)}" class="mt-1 h-8 w-auto max-w-[80px] object-contain rounded border border-gray-200">` : ''}
                                            </div>
                                            <div class="mb-2">
                                                <span class="admin-label">Mô tả chi tiết Model</span>
                                                <textarea id="req-mdl-desc-${r.id}" class="admin-input" rows="4">${app.utils.escapeAttr(d.description || '')}</textarea>
                                            </div>
                                            <div class="flex gap-2 mt-3">
                                                <button onclick="app.admin.approveReq('${r.id}', this, 'model_info')" class="flex-1 bg-green-600 text-white py-1.5 font-bold rounded hover:bg-green-700">DUYỆT</button>
                                                <button onclick="app.admin.denyReq('${r.id}', this)" class="flex-1 bg-red-600 text-white py-1.5 font-bold rounded hover:bg-red-700">TỪ CHỐI</button>
                                            </div>
                                        </div>
                                    </div>`;
          }
        }).join('');
      } else if (tab === 'comments') {
        const {
          data
        } = await app.admin.api("q18", {});
        app.admin.commentsData.data = data || [];
        app.admin.commentsData.page = 1;
        content.innerHTML = `
                            <div class="col-span-full">
                                <h3 class="font-bold mb-4 uppercase tracking-widest text-sm text-gray-500">Quản lý bình luận toàn hệ thống</h3>
                                <div class="overflow-x-auto border border-gray-200 rounded-md">
                                    <table class="w-full text-left text-sm whitespace-nowrap">
                                        <thead class="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-[11px] tracking-wider">
                                            <tr>
                                                <th class="p-3">Thời gian</th>
                                                <th class="p-3">Người đăng</th>
                                                <th class="p-3">Xe</th>
                                                <th class="p-3 w-full">Nội dung</th>
                                                <th class="p-3 text-center">Hành động</th>
                                            </tr>
                                        </thead>
                                        <tbody id="adm-comments-content" class="divide-y divide-gray-200">
                                            <tr><td colspan="5" class="p-4 text-center text-gray-500"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải...</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div id="adm-comments-pager" class="mt-6 w-full flex justify-center"></div>
                            </div>`;

        // Gọi hàm render chi tiết
        app.admin.renderCommentsData();
      } else if (tab === 'manager') {
        if (app.role !== 'manager') {
          content.innerHTML = '<p class="p-4 text-red-500 font-bold">Bạn không có quyền truy cập khu vực này.</p>';
          return;
        }
        content.className = "col-span-full";
        content.innerHTML = `
                                <div class="bg-white border border-gray-200 rounded-lg shadow-sm p-4 md:p-6 mb-6">
                                    <div class="flex gap-2 mb-6 border-b border-gray-200 pb-3 overflow-x-auto">
                                        <button onclick="app.admin.switchManagerTab('denied')" id="mgr-tab-denied" class="font-bold text-sm px-4 py-2 bg-black text-white rounded transition whitespace-nowrap">Ảnh bị từ chối</button>
                                         <button onclick="app.admin.switchManagerTab('logs')" id="mgr-tab-logs" class="font-bold text-sm px-4 py-2 bg-white text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition whitespace-nowrap">Nhật ký hoạt động</button>
                                        <button onclick="app.admin.switchManagerTab('bans')" id="mgr-tab-bans" class="font-bold text-sm px-4 py-2 bg-white text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition whitespace-nowrap"><i class="fa-solid fa-users mr-1"></i> Quản lý người dùng</button>
                                        <button onclick="app.admin.switchManagerTab('email')" id="mgr-tab-email" class="font-bold text-sm px-4 py-2 bg-white text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition whitespace-nowrap"><i class="fa-solid fa-envelope mr-1"></i> Gửi Email</button>
                                        <button onclick="app.admin.switchManagerTab('settings')" id="mgr-tab-settings" class="font-bold text-sm px-4 py-2 bg-white text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition whitespace-nowrap"><i class="fa-solid fa-sliders mr-1"></i> Cài đặt</button>
                                    </div>

                                    <!-- TAB: ẢNH BỊ TỪ CHỐI -->
                                    <div id="mgr-sec-denied" class="block">
                                        <div class="flex items-center gap-2 mb-4 bg-gray-50 border border-gray-200 rounded-md px-3">
                                            <i class="fa-solid fa-magnifying-glass text-gray-400"></i>
                                            <input type="text" placeholder="Tìm kiếm BKS, Lý do, Username..." class="w-full py-2.5 bg-transparent outline-none text-sm" oninput="app.admin.filterManagerData('denied', this.value)">
                                        </div>
                                        <div id="mgr-denied-content" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <p class="text-gray-500 italic text-sm py-4"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải dữ liệu...</p>
                                        </div>
                                        <div id="mgr-denied-pager" class="mt-6 w-full flex justify-center"></div>
                                    </div>

                                    <!-- TAB: NHẬT KÝ HOẠT ĐỘNG -->
                                    <div id="mgr-sec-logs" class="hidden">
                                        <div class="flex items-center gap-2 mb-4 bg-gray-50 border border-gray-200 rounded-md px-3">
                                            <i class="fa-solid fa-magnifying-glass text-gray-400"></i>
                                            <input type="text" placeholder="Tìm kiếm hành động, Admin, chi tiết..." class="w-full py-2.5 bg-transparent outline-none text-sm" oninput="app.admin.filterManagerData('logs', this.value)">
                                        </div>
                                        <div class="overflow-x-auto border border-gray-200 rounded-md">
                                            <table class="w-full text-left text-sm whitespace-nowrap">
                                                <thead class="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-[11px] tracking-wider">
                                                    <tr>
                                                        <th class="p-3">Thời gian</th>
                                                        <th class="p-3">Admin</th>
                                                        <th class="p-3">Hành động</th>
                                                        <th class="p-3">Mục tiêu (ID)</th>
                                                        <th class="p-3 w-full">Chi tiết</th>
                                                    </tr>
                                                </thead>
                                                <tbody id="mgr-logs-content" class="divide-y divide-gray-200">
                                                    <tr><td colspan="5" class="p-4 text-center text-gray-500"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải...</td></tr>
                                                </tbody>
                                            </table>
                                        </div>
                                         <div id="mgr-logs-pager" class="mt-6 w-full flex justify-center"></div>
                                     </div>

                                    <!-- TAB: GỬI EMAIL -->
                                    <div id="mgr-sec-email" class="hidden">
                                        <div class="max-w-3xl border border-gray-200 rounded-lg p-5 bg-white shadow-sm">
                                            <h3 class="font-bold text-lg mb-4 text-black border-b border-gray-100 pb-3"><i class="fa-solid fa-paper-plane mr-2 text-blue-600"></i>Soạn Email Mới</h3>

                                            <form id="admin-email-form" onsubmit="app.admin.submitEmail(event)">
                                                <div class="mb-4">
                                                    <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Gửi tới <span class="text-red-500">*</span></label>
                                                    <div class="flex gap-2">
                                                        <select id="email-target-user" class="w-full border border-gray-300 p-2.5 text-sm rounded-md focus:ring-2 focus:ring-black outline-none" onchange="app.admin.toggleEmailCustom()">
                                                            <option value="">-- Chọn thành viên trong hệ thống --</option>
                                                            <option value="custom">Gửi tới một Email tùy chỉnh khác...</option>
                                                        </select>
                                                    </div>
                                                    <input type="email" id="email-custom-address" placeholder="Nhập địa chỉ email..." class="hidden w-full border border-gray-300 p-2.5 text-sm rounded-md focus:ring-2 focus:ring-black outline-none mt-2">
                                                </div>

                                                <div class="mb-4">
                                                    <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Tiêu đề (Subject) <span class="text-red-500">*</span></label>
                                                    <input type="text" id="email-subject" placeholder="VD: Thông báo cập nhật quy định..." required class="w-full border border-gray-300 p-2.5 text-sm rounded-md focus:ring-2 focus:ring-black outline-none">
                                                </div>

                                                <div class="mb-4">
                                                    <div class="flex justify-between items-center mb-1">
                                                        <label class="block text-xs font-bold text-gray-700 uppercase">Nội dung (Hỗ trợ Markdown) <span class="text-red-500">*</span></label>
                                                        <button type="button" onclick="app.admin.previewEmailMd()" class="text-[11px] bg-gray-100 border border-gray-300 px-2 py-1 rounded text-gray-700 font-bold hover:bg-gray-200 transition"><i class="fa-brands fa-markdown mr-1"></i> Xem trước</button>
                                                    </div>
                                                    <textarea id="email-content" rows="8" required placeholder="Nhập nội dung email tại đây..." class="w-full border border-gray-300 p-2.5 text-sm rounded-md focus:ring-2 focus:ring-black outline-none font-mono"></textarea>
                                                    <div id="email-md-preview" class="hidden markdown-body w-full border border-blue-200 bg-blue-50 p-4 mt-2 rounded-md text-sm min-h-[100px]"></div>
                                                </div>

                                                <div class="mb-6 flex items-center gap-2 bg-gray-50 border border-gray-200 p-3 rounded-md">
                                                    <input type="checkbox" id="email-is-anonymous" class="w-4 h-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer">
                                                    <label for="email-is-anonymous" class="text-sm font-bold text-gray-800 cursor-pointer select-none">Gửi ẩn danh (Người gửi sẽ hiển thị là "Quản trị VNBUSARCHIVE")</label>
                                                </div>

                                                <div class="text-right border-t border-gray-100 pt-4">
                                                    <button type="submit" id="btn-send-email" class="bg-blue-600 text-white px-6 py-2.5 font-bold rounded-md hover:bg-blue-700 transition shadow-sm flex items-center gap-2 ml-auto">
                                                        <i class="fa-solid fa-paper-plane"></i> Gửi Email
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>

                                    <!-- TAB: CÀI ĐẶT HỆ THỐNG (MANAGER) -->
                                    <div id="mgr-sec-settings" class="hidden">
                                        <div class="mb-4 bg-blue-50 border border-blue-200 p-4 rounded-md">
                                            <p class="text-xs text-blue-800 font-medium"><i class="fa-solid fa-circle-info mr-1"></i> <b>Lưu ý:</b> Các công tắc dưới đây ảnh hưởng trực tiếp đến người dùng. Nếu "Hẹn giờ tự động" kết thúc, hệ thống sẽ tự mở lại mà không cần bạn bật thủ công.</p>
                                        </div>
                                        <div id="mgr-settings-content" class="grid grid-cols-1 gap-6">
                                            <p class="text-gray-500 italic"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải cấu hình...</p>
                                        </div>
                                    </div>

                                     <!-- TAB: QUẢN LÝ BAN -->
                                     <div id="mgr-sec-bans" class="hidden">
                                         <div class="flex flex-col gap-3 mb-4">
                                             <div class="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-md px-3">
                                                 <i class="fa-solid fa-magnifying-glass text-gray-400"></i>
                                                 <input type="text" id="mgr-ban-search" placeholder="Tìm kiếm Username, UUID..." class="w-full py-2.5 bg-transparent outline-none text-sm" oninput="app.admin.filterManagerData('bans', this.value)">
                                             </div>
                                             <div class="flex flex-wrap gap-2">
                                                 <button id="ban-flt-all" onclick="app.admin.setBanFilter('all')" class="ban-flt-btn font-bold text-xs px-3 py-1.5 bg-black text-white rounded-md transition">Tất cả</button>
                                                 <button id="ban-flt-active" onclick="app.admin.setBanFilter('active')" class="ban-flt-btn font-bold text-xs px-3 py-1.5 bg-white text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition">Hoạt động</button>
                                                 <button id="ban-flt-warning" onclick="app.admin.setBanFilter('warning')" class="ban-flt-btn font-bold text-xs px-3 py-1.5 bg-white text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition">Cần lưu ý</button>
                                                 <button id="ban-flt-banned" onclick="app.admin.setBanFilter('banned')" class="ban-flt-btn font-bold text-xs px-3 py-1.5 bg-white text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition">Bị cấm</button>
                                             </div>
                                         </div>
                                         <div class="overflow-x-auto border border-gray-200 rounded-md">
                                             <table class="w-full text-left text-sm whitespace-nowrap">
                                                 <thead class="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-[11px] tracking-wider">
                                                     <tr>
                                                         <th class="p-3">Người dùng</th>
                                                         <th class="p-3 text-center">Số ảnh</th>
                                                         <th class="p-3">Thời gian</th>
                                                         <th class="p-3">Trạng thái</th>
                                                         <th class="p-3 text-right">Hành động</th>
                                                     </tr>
                                                 </thead>
                                                 <tbody id="mgr-bans-content" class="divide-y divide-gray-200">
                                                     <tr><td colspan="4" class="p-4 text-center text-gray-500"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải...</td></tr>
                                                 </tbody>
                                             </table>
                                         </div>
                                          <div id="mgr-bans-pager" class="mt-6 w-full flex justify-center"></div>
                                     </div>

                                 </div>
                             `;
        app.admin.fetchManagerData('denied');
        app.admin.fetchManagerData('logs');
        app.admin.fetchManagerData('bans');
        app.admin.fetchUsersForEmail();
      }
    } catch (err) {
      content.innerHTML = `<p class="p-4 text-red-500 font-bold">Không thể tải dữ liệu: ${err.message}</p>`;
    }
  },
  // --- PHẦN QUẢN LÝ TAB MANAGER ---
  switchManagerTab: subTab => {
    app.admin.manager.activeTab = subTab;
    ['denied', 'logs', 'email', 'settings', 'bans'].forEach(t => {
      const btn = document.getElementById('mgr-tab-' + t);
      const sec = document.getElementById('mgr-sec-' + t);
      if (btn && sec) {
        if (t === subTab) {
          btn.className = "font-bold text-sm px-4 py-2 bg-black text-white rounded transition whitespace-nowrap";
          sec.className = "block";
        } else {
          btn.className = "font-bold text-sm px-4 py-2 bg-white text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition whitespace-nowrap";
          sec.className = "hidden";
        }
      }
    });
    if (subTab === 'settings') {
      app.admin.renderManagerSettings();
    }
  },
  fetchManagerData: async type => {
    try {
      if (type === 'denied') {
        const {
          data: photos
        } = await app.admin.api("q19", {});
        const {
          data: logs
        } = await app.admin.api("q20", {});
        const denierMap = {};
        if (logs) logs.forEach(l => {
          denierMap[l.target_id] = l.profiles?.username || 'Admin';
        });
        app.admin.manager.denied.data = photos || [];
        app.admin.manager.denied.denierMap = denierMap;
        app.admin.filterManagerData('denied', '');
      } else if (type === 'logs') {
        const {
          data: logs
        } = await app.admin.api("q21", {});
        app.admin.manager.logs.data = logs || [];
        app.admin.filterManagerData('logs', '');
      } else if (type === 'bans') {
        const {
          data: {
            session
          }
        } = await window.sb.auth.getSession();
        const response = await fetch('/api/manager', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'get_users',
            token: session.access_token
          })
        });
        const result = await response.json();
        if (!result.success) throw new Error(result.error);
        app.admin.manager.bans.data = result.users || [];
        app.admin.filterManagerData('bans', '', 'all');
      }
    } catch (e) {
      console.error("Lỗi fetch data manager:", e);
    }
  },
  filterManagerData: (type, query, statusArg) => {
    const q = (query || '').toLowerCase().trim();
    const state = app.admin.manager[type];
    if (!q && (!statusArg || statusArg === 'all') && type !== 'bans') {
      state.filtered = [...state.data];
    } else {
      if (type === 'denied') {
        state.filtered = state.data.filter(p => `${p.license_plate} ${p.denial_reason} ${p.profiles?.username}`.toLowerCase().includes(q));
      } else if (type === 'bans') {
        const status = statusArg || app.admin.manager.bans.currentFilter || 'all';
        state.filtered = state.data.filter(u => {
          const matchText = `${u.username} ${u.id}`.toLowerCase().includes(q);
          const threeMonthsAgo = new Date();
          threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
          const lastSignIn = new Date(u.last_sign_in_at);
          const isWarning = lastSignIn < threeMonthsAgo;
          let banInfo = {
            banned: false
          };
          try {
            banInfo = typeof u.ban_status === 'string' ? JSON.parse(u.ban_status) : u.ban_status || banInfo;
          } catch (e) {}
          let matchStatus = true;
          if (status === 'active') matchStatus = !banInfo.banned && !isWarning;
          if (status === 'warning') matchStatus = !banInfo.banned && isWarning;
          if (status === 'banned') matchStatus = banInfo.banned;
          return matchText && matchStatus;
        });
      } else {
        state.filtered = state.data.filter(l => `${l.action_type} ${l.target_id} ${l.profiles?.username} ${JSON.stringify(l.details)}`.toLowerCase().includes(q));
      }
    }
    state.page = 1;
    app.admin.renderManagerData(type);
  },
  setBanFilter: status => {
    document.querySelectorAll('.ban-flt-btn').forEach(btn => {
      btn.className = "ban-flt-btn font-bold text-xs px-3 py-1.5 bg-white text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition";
    });
    const activeBtn = document.getElementById('ban-flt-' + status);
    if (activeBtn) activeBtn.className = "ban-flt-btn font-bold text-xs px-3 py-1.5 bg-black text-white rounded-md transition";
    app.admin.manager.bans.currentFilter = status;
    app.admin.filterManagerData('bans', document.getElementById('mgr-ban-search').value, status);
  },
  // --- Hàm Render cho Tab Quản lý Bình luận (Admin) ---
  renderCommentsData: () => {
    const state = app.admin.commentsData;
    const perPage = 15;
    const totalPages = Math.ceil(state.data.length / perPage) || 1;
    const slice = state.data.slice((state.page - 1) * perPage, state.page * perPage);
    const contentEl = document.getElementById('adm-comments-content');
    const pagerElId = 'adm-comments-pager';
    if (slice.length === 0) {
      contentEl.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-gray-500 text-sm">Không có bình luận nào trong hệ thống.</td></tr>';
      document.getElementById(pagerElId).innerHTML = '';
      return;
    }
    contentEl.innerHTML = slice.map(c => `
                        <tr class="hover:bg-gray-50 transition">
                            <td class="p-3 text-[11px] text-gray-500">${new Date(c.created_at).toLocaleString('vi-VN')}</td>
                            <td class="p-3 font-bold text-black text-[12px]">${c.profiles?.username || 'Ẩn danh'}</td>
                            <td class="p-3 text-blue-600 font-black cursor-pointer" onclick="app.views.loadDetail(${c.photo_id})">${c.photos?.license_plate || 'N/A'}</td>
                            <td class="p-3 text-[12px] text-gray-700 whitespace-normal min-w-[200px] break-words">${app.utils.cleanText(c.content)}</td>
                            <td class="p-3 text-center">
                                <button onclick="app.comments.delete('${c.id}')" class="text-red-600 hover:scale-110 transition p-1"><i class="fa-solid fa-trash-can"></i></button>
                            </td>
                        </tr>
                    `).join('');
    app.utils.renderPagination(pagerElId, state.page, totalPages, newPage => {
      app.admin.commentsData.page = newPage;
      app.admin.renderCommentsData();
    });
  },
  renderManagerData: type => {
    const state = app.admin.manager[type];
    const perPage = 12;
    const totalPages = Math.ceil(state.filtered.length / perPage) || 1;
    const slice = state.filtered.slice((state.page - 1) * perPage, state.page * perPage);
    const contentEl = document.getElementById(`mgr-${type}-content`);
    const pagerElId = `mgr-${type}-pager`;
    if (slice.length === 0) {
      contentEl.innerHTML = `<p class="text-gray-500 col-span-full py-4 text-sm px-4">Không tìm thấy dữ liệu.</p>`;
      document.getElementById(pagerElId).innerHTML = '';
      return;
    }
    if (type === 'denied') {
      contentEl.innerHTML = slice.map(p => {
        const proxyUrl = app.utils.getProxiedUrl(p.url, 'thumb.jpg', 'thumb');
        const uploader = app.utils.cleanText(p.profiles?.username || 'Ẩn danh');
        const denier = app.utils.cleanText(state.denierMap[p.id] || 'Admin');
        const time = new Date(p.created_at).toLocaleDateString('vi-VN');
        return `<div class="flex gap-4 p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md cursor-pointer transition items-start" onclick="app.views.loadDetail('${p.id}')">
                                <img src="${proxyUrl}" class="w-24 h-24 object-cover rounded bg-gray-100 shrink-0 border border-gray-200">
                                <div class="flex flex-col h-24 justify-between overflow-hidden w-full">
                                    <div><h4 class="font-bold text-sm text-black truncate uppercase">${p.license_plate}</h4><p class="text-xs text-red-600 font-medium line-clamp-2 mt-1"><i class="fa-solid fa-triangle-exclamation mr-1"></i> ${p.denial_reason}</p></div>
                                    <div class="text-[10px] text-gray-500 truncate bg-gray-50 p-1.5 rounded">Đăng: <b class="text-gray-700">${uploader}</b> | Khóa: <b class="text-red-700">${denier}</b> | ${time}</div>
                                </div>
                            </div>`;
      }).join('');
    } else if (type === 'bans') {
      contentEl.innerHTML = slice.map(u => {
        let banInfo = {
          banned: false,
          reason: ''
        };
        try {
          banInfo = typeof u.ban_status === 'string' ? JSON.parse(u.ban_status) : u.ban_status || banInfo;
        } catch (e) {}
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        const lastSignIn = new Date(u.last_sign_in_at);
        const isWarning = lastSignIn < threeMonthsAgo;
        let statusBadge = '';
        if (banInfo.banned) {
          statusBadge = `<span class="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold inline-block"><i class="fa-solid fa-ban"></i> Bị cấm</span>
                                               <div class="text-[10px] text-red-600 mt-1 max-w-[150px] truncate" title="${app.utils.cleanText(banInfo.reason || '')}">${app.utils.cleanText(banInfo.reason || '')}</div>`;
        } else if (isWarning) {
          statusBadge = `<span class="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold inline-block" title="Offline quá 3 tháng"><i class="fa-solid fa-triangle-exclamation"></i> Cần lưu ý</span>`;
        } else {
          statusBadge = `<span class="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold inline-block"><i class="fa-solid fa-circle-check"></i> Hoạt động</span>`;
        }
        const actionBtn = banInfo.banned ? `<button onclick="app.admin.managerUnbanUser('${u.id}')" class="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-xs hover:bg-gray-50 text-black font-bold shadow-sm transition">Gỡ cấm</button>` : `<button onclick="app.admin.managerBanUser('${u.id}')" class="px-3 py-1.5 bg-red-600 text-white rounded-md text-xs hover:bg-red-700 font-bold shadow-sm transition">Cấm</button>`;
        const delBtn = `<button onclick="app.admin.managerDeleteUser('${u.id}')" class="px-3 py-1.5 bg-gray-200 text-gray-800 rounded-md text-xs hover:bg-gray-300 font-bold shadow-sm transition ml-1"><i class="fa-solid fa-trash-can"></i> Xóa</button>`;
        return `<tr class="hover:bg-gray-50 transition border-b border-gray-100">
                                <td class="p-3">
                                    <div class="font-bold text-black text-[12px]">${app.utils.cleanText(u.username || 'Unknown')}</div>
                                    <div class="text-[10px] text-gray-500 font-mono" title="Click để copy UUID" style="cursor:pointer;" onclick="navigator.clipboard.writeText('${u.id}'); app.ui.showAlert('Đã copy UUID: ' + '${u.id}')">${u.id}</div>
                                </td>
                                <td class="p-3 text-center">
                                    <span class="font-bold text-black bg-gray-100 px-2 py-1 rounded-md text-xs">${u.photo_count}</span>
                                </td>
                                <td class="p-3">
                                    <div class="text-[11px] text-gray-700"><i class="fa-solid fa-calendar-plus text-gray-400 w-4"></i> ${new Date(u.created_at).toLocaleDateString('vi-VN')}</div>
                                    <div class="text-[11px] text-gray-700 mt-1" title="Đăng nhập lần cuối lúc ${new Date(u.last_sign_in_at).toLocaleString('vi-VN')}"><i class="fa-solid fa-right-to-bracket text-gray-400 w-4"></i> ${new Date(u.last_sign_in_at).toLocaleDateString('vi-VN')}</div>
                                </td>
                                <td class="p-3">${statusBadge}</td>
                                <td class="p-3 text-right align-middle whitespace-nowrap">${actionBtn}${delBtn}</td>
                            </tr>`;
      }).join('');
    } else {
      contentEl.innerHTML = slice.map(log => {
        const time = new Date(log.created_at).toLocaleString('vi-VN');
        return `<tr class="hover:bg-gray-50 transition"><td class="p-3 text-[11px] text-gray-500">${time}</td><td class="p-3 font-bold text-black text-[12px]">${log.profiles?.username || 'Unknown'}</td><td class="p-3">${log.action_type}</td><td class="p-3 text-[10px] font-mono">${log.target_id || '-'}</td><td class="p-3 text-[11px]">${JSON.stringify(log.details)}</td></tr>`;
      }).join('');
    }
    app.utils.renderPagination(pagerElId, state.page, totalPages, newPage => {
      app.admin.manager[type].page = newPage;
      app.admin.renderManagerData(type);
    });
  },
  toggleBanSection: section => {
    app.admin.activeBanSection = section;
    const quickSection = document.getElementById('ban-section-quick');
    const customSection = document.getElementById('ban-section-custom');
    const btnQuick = document.getElementById('btn-ban-quick');
    const btnCustom = document.getElementById('btn-ban-custom');
    if (section === 'quick') {
      quickSection.classList.remove('hidden');
      customSection.classList.add('hidden');
      btnQuick.className = "w-full bg-black text-white p-3 text-center font-bold text-sm rounded-lg shadow-sm transition border border-black";
      btnCustom.className = "w-full bg-white text-gray-700 p-3 text-center font-bold text-sm rounded-lg shadow-sm transition border border-gray-300 hover:bg-gray-50 hover:text-black";
    } else {
      quickSection.classList.add('hidden');
      customSection.classList.remove('hidden');
      btnCustom.className = "w-full bg-black text-white p-3 text-center font-bold text-sm rounded-lg shadow-sm transition border border-black";
      btnQuick.className = "w-full bg-white text-gray-700 p-3 text-center font-bold text-sm rounded-lg shadow-sm transition border border-gray-300 hover:bg-gray-50 hover:text-black";
    }
  },
  managerBanUser: userId => {
    if (app.role !== 'manager') return app.ui.showAlert("Chỉ Manager mới có quyền này.");
    document.getElementById('ban-target-id').value = userId;
    app.admin.toggleBanSection('quick');
    document.querySelectorAll('.ban-quick-cb').forEach(cb => cb.checked = false);
    document.getElementById('ban-custom-input').value = '';
    const modal = document.getElementById('ban-prompt-modal');
    modal.classList.remove('hidden');
    setTimeout(() => {
      document.getElementById('ban-prompt-content').classList.remove('opacity-0', 'scale-95');
    }, 10);
  },
  closeBanModal: () => {
    const content = document.getElementById('ban-prompt-content');
    content.classList.add('opacity-0', 'scale-95');
    setTimeout(() => {
      document.getElementById('ban-prompt-modal').classList.add('hidden');
    }, 300);
  },
  submitBanUser: async () => {
    if (app.role !== 'manager') return app.ui.showAlert("Chỉ Manager mới có quyền này.");
    const userId = document.getElementById('ban-target-id').value;
    let reason = '';
    if (app.admin.activeBanSection === 'custom') {
      reason = document.getElementById('ban-custom-input').value.trim();
    } else {
      const selectedChecks = Array.from(document.querySelectorAll('.ban-quick-cb:checked')).map(cb => cb.value);
      reason = selectedChecks.join(' + ');
    }
    if (!reason) return app.ui.showAlert("Vui lòng chọn hoặc nhập lý do cấm!");
    document.getElementById('btn-submit-ban').innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Đang xử lý...';
    document.getElementById('btn-submit-ban').disabled = true;
    try {
      const {
        data: {
          session
        }
      } = await window.sb.auth.getSession();
      const response = await fetch('/api/manager', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'ban',
          targetUserId: userId,
          reason: reason,
          token: session.access_token
        })
      });
      const data = await response.json();
      if (data.success) {
        app.admin.closeBanModal();
        app.admin.fetchManagerData('bans');
      } else throw new Error(data.error);
    } catch (e) {
      app.ui.showAlert("Lỗi: " + e.message);
    } finally {
      document.getElementById('btn-submit-ban').innerHTML = 'Xác nhận cấm';
      document.getElementById('btn-submit-ban').disabled = false;
    }
  },
  managerUnbanUser: async userId => {
    if (app.role !== 'manager') return app.ui.showAlert("Chỉ Manager mới có quyền này.");
    app.ui.showAlert("Bạn có chắc muốn gỡ cấm tài khoản này không?", async () => {
      try {
        const {
          data: {
            session
          }
        } = await window.sb.auth.getSession();
        const response = await fetch('/api/manager', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'unban',
            targetUserId: userId,
            token: session.access_token
          })
        });
        const data = await response.json();
        if (data.success) {
          app.ui.showAlert(data.message, null, null, {
            title: "Thành công",
            hideButtons: false
          });
          app.admin.fetchManagerData('bans');
        } else throw new Error(data.error);
      } catch (e) {
        app.ui.showAlert("Lỗi: " + e.message, null, null, {
          title: "Lỗi"
        });
      }
    }, () => {}, {
      title: "Xác nhận gỡ cấm",
      btnOkText: "Gỡ cấm",
      btnCancelText: "Hủy"
    });
  },
  managerDeleteUser: async userId => {
    if (app.role !== 'manager') return app.ui.showAlert("Chỉ Manager mới có quyền này.");
    app.ui.showAlert("LƯU Ý: Hành động này sẽ XÓA VĨNH VIỄN tài khoản người dùng và không thể khôi phục. Bạn có chắc chắn muốn xóa không?", async () => {
      try {
        const {
          data: {
            session
          }
        } = await window.sb.auth.getSession();
        const response = await fetch('/api/manager', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'delete_user',
            targetUserId: userId,
            token: session.access_token
          })
        });
        const data = await response.json();
        if (data.success) {
          app.ui.showAlert(data.message, null, null, {
            title: "Đã xóa",
            hideButtons: false
          });
          app.admin.fetchManagerData('bans');
        } else throw new Error(data.error);
      } catch (e) {
        app.ui.showAlert("Lỗi: " + e.message, null, null, {
          title: "Lỗi"
        });
      }
    }, () => {}, {
      title: "Xác nhận xóa tài khoản",
      btnOkText: "Xóa tài khoản",
      btnCancelText: "Hủy",
      countdown: true
    });
  },
  // --- CÁC HÀM MỚI CHO TÍNH NĂNG GỬI EMAIL ---
  fetchUsersForEmail: async () => {
    try {
      const {
        data: users
      } = await app.admin.api("q22", {});
      const select = document.getElementById('email-target-user');
      if (users && select) {
        users.forEach(u => {
          const opt = document.createElement('option');
          opt.value = u.id;
          opt.innerText = u.username;
          select.appendChild(opt);
        });
      }
    } catch (e) {
      console.error("Lỗi lấy danh sách user:", e);
    }
  },
  toggleEmailCustom: () => {
    const select = document.getElementById('email-target-user');
    const customInput = document.getElementById('email-custom-address');
    if (select.value === 'custom') {
      customInput.classList.remove('hidden');
      customInput.required = true;
    } else {
      customInput.classList.add('hidden');
      customInput.required = false;
      customInput.value = '';
    }
  },
  previewEmailMd: () => {
    const content = document.getElementById('email-content').value;
    const previewBox = document.getElementById('email-md-preview');
    if (previewBox.classList.contains('hidden')) {
      previewBox.classList.remove('hidden');
      previewBox.innerHTML = DOMPurify.sanitize(marked.parse(content || '*Chưa có nội dung*'));
    } else {
      previewBox.classList.add('hidden');
    }
  },
  submitEmail: async e => {
    e.preventDefault();
    if (app.role !== 'manager') return app.ui.showAlert("Chỉ Manager mới có thể sử dụng chức năng này.");
    const selectVal = document.getElementById('email-target-user').value;
    const customEmail = document.getElementById('email-custom-address').value.trim();
    const subject = document.getElementById('email-subject').value.trim();
    const content = document.getElementById('email-content').value.trim();
    const isAnonymous = document.getElementById('email-is-anonymous').checked;
    if (!selectVal) return app.ui.showAlert("Vui lòng chọn người nhận!");
    if (selectVal === 'custom' && !customEmail) return app.ui.showAlert("Vui lòng nhập Email tùy chỉnh!");
    if (!subject || !content) return app.ui.showAlert("Vui lòng nhập Tiêu đề và Nội dung!");
    const btn = document.getElementById('btn-send-email');
    const origHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang gửi...';
    btn.disabled = true;
    try {
      const {
        data: {
          session
        }
      } = await window.sb.auth.getSession();
      const payload = {
        action: 'email',
        targetUserId: selectVal !== 'custom' ? selectVal : null,
        customEmail: selectVal === 'custom' ? customEmail : null,
        subject: subject,
        markdownContent: content,
        isAnonymous: isAnonymous
      };
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi không xác định từ Server');
      app.ui.showAlert("Đã gửi Email thành công!");
      document.getElementById('admin-email-form').reset();
      document.getElementById('email-md-preview').classList.add('hidden');
      app.admin.toggleEmailCustom();
      app.admin.logAction('send_email', selectVal === 'custom' ? customEmail : selectVal, {
        subject: subject,
        isAnonymous: isAnonymous
      });
    } catch (err) {
      app.ui.showAlert("Gửi Email thất bại: " + err.message);
    } finally {
      btn.innerHTML = origHTML;
      btn.disabled = false;
    }
  },
  // --- ĐÂY LÀ 2 HÀM BẠN ĐANG THIẾU DẪN ĐẾN LỖI ---
  renderManagerSettings: async () => {
    const container = document.getElementById('mgr-settings-content');
    container.innerHTML = '<p class="text-gray-500 italic"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải dữ liệu...</p>';
    await app.maintenance.fetch();
    const configs = [{
      id: 'global',
      title: 'Cầu chì Tổng (Toàn hệ thống)',
      icon: 'fa-globe',
      color: 'red'
    }, {
      id: 'auth',
      title: 'Hệ thống Đăng nhập / Đăng ký',
      icon: 'fa-user-lock',
      color: 'blue'
    }, {
      id: 'upload',
      title: 'Hệ thống Upload Ảnh',
      icon: 'fa-cloud-arrow-up',
      color: 'green'
    }];
    let html = '';
    configs.forEach(cfg => {
      const data = app.maintenance.settings[cfg.id] || {
        is_active: true,
        reason: '',
        auto_reactivate_at: null
      };
      const hasTime = !!data.auto_reactivate_at;
      let timeVal = '';
      if (hasTime) {
        const d = new Date(data.auto_reactivate_at);
        const tzOffset = d.getTimezoneOffset() * 60000;
        timeVal = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
      }
      html += `<div class="border border-gray-200 rounded-lg p-5 bg-white mb-4">
                            <div class="flex justify-between items-center mb-4 border-b pb-3">
                                <h3 class="font-bold text-${cfg.color}-600 uppercase text-sm"><i class="fa-solid ${cfg.icon} mr-2"></i>${cfg.title}</h3>
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" id="mt-active-${cfg.id}" class="sr-only peer" ${data.is_active ? 'checked' : ''}>
                                    <div class="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-${cfg.color}-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                                </label>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label class="text-xs text-gray-500 font-bold block mb-1">Lý do bảo trì</label><input type="text" id="mt-reason-${cfg.id}" value="${app.utils.escapeAttr(data.reason)}" class="w-full border p-2.5 text-sm rounded"></div>
                                <div>
                                    <label class="text-xs text-gray-500 font-bold flex justify-between mb-1"><span>Hẹn giờ tự mở lại</span> <input type="checkbox" id="mt-has-time-${cfg.id}" ${hasTime ? 'checked' : ''} onchange="document.getElementById('mt-time-${cfg.id}').disabled = !this.checked"></label>
                                    <input type="datetime-local" id="mt-time-${cfg.id}" value="${timeVal}" ${!hasTime ? 'disabled' : ''} class="w-full border p-2.5 text-sm rounded disabled:bg-gray-100">
                                </div>
                            </div>
                            <div class="mt-4 text-right"><button onclick="app.admin.saveManagerSetting('${cfg.id}', this)" class="bg-black text-white px-5 py-2 text-xs font-bold rounded shadow-sm">Lưu thiết lập</button></div>
                        </div>`;
    });
    const quotaData = app.maintenance.settings['upload_quota'] || {
      reason: ''
    };
    html += `
                    <div class="border border-blue-200 rounded-lg p-5 bg-blue-50/50 mt-6 relative shadow-sm">
                        <div class="flex items-center gap-2 mb-3 border-b border-blue-200 pb-3">
                            <i class="fa-solid fa-cloud-arrow-up text-blue-600 text-lg"></i>
                            <h3 class="font-bold text-blue-800 uppercase text-sm">Giới hạn Upload hàng ngày (Quota)</h3>
                        </div>
                        <p class="text-xs text-blue-700 mb-4 leading-relaxed">Giới hạn TỔNG số lượng ảnh <b>toàn hệ thống</b> được phép tiếp nhận trong vòng 24h. Tự động làm mới vào <b>7:00 Sáng giờ Việt Nam</b>.</p>

                        <div class="flex items-end gap-3">
                            <div class="flex-1">
                                <label class="text-xs font-bold text-blue-900 block mb-1">Số lượng ảnh (Để trống = Không giới hạn, 0 = Tạm dừng nhận)</label>
                                <input type="number" min="0" id="mt-quota-value" value="${quotaData.reason}" placeholder="Trống = Không giới hạn" class="w-full border border-blue-300 p-2.5 text-sm rounded outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                            </div>
                            <button onclick="app.admin.saveQuotaSetting(this)" class="bg-blue-600 text-white px-6 py-2.5 text-xs font-bold rounded hover:bg-blue-700 transition shadow-sm h-[42px] whitespace-nowrap"><i class="fa-solid fa-floppy-disk mr-1"></i> Lưu cấu hình</button>
                        </div>
                    </div>
                    `;
    container.innerHTML = html;
  },
  saveManagerSetting: async (sysId, btn) => {
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    btn.disabled = true;
    const isActive = document.getElementById(`mt-active-${sysId}`).checked;
    const reason = document.getElementById(`mt-reason-${sysId}`).value.trim();
    const hasTime = document.getElementById(`mt-has-time-${sysId}`).checked;
    const timeVal = document.getElementById(`mt-time-${sysId}`).value;
    let autoReactivate = isActive || !hasTime ? null : new Date(timeVal).toISOString();
    try {
      const {
        error
      } = await app.admin.api("q23", {
        isActive,
        reason,
        autoReactivate,
        app,
        sysId
      });
      if (error) throw error;
      await app.maintenance.fetch();
      app.ui.showAlert(`Đã lưu thiết lập cho ${sysId.toUpperCase()}`);
    } catch (e) {
      app.ui.showAlert("Lỗi: " + e.message);
    } finally {
      btn.innerHTML = originalHTML;
      btn.disabled = false;
    }
  },
  saveQuotaSetting: async btn => {
    if (app.role !== 'manager') return;
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...';
    btn.disabled = true;
    const val = document.getElementById('mt-quota-value').value.trim();
    try {
      const {
        error
      } = await app.admin.api("q24", {
        val,
        app,
        Date
      });
      if (error) throw error;
      await app.maintenance.fetch();
      app.admin.logAction('update_upload_quota', 'upload_quota', {
        new_limit: val || 'Không giới hạn'
      });
      app.ui.showAlert(`Đã cập nhật Giới hạn Upload thành: ${val === '' ? 'Không giới hạn' : val + ' ảnh/ngày'}!`);
    } catch (e) {
      app.ui.showAlert("Lỗi: " + e.message);
    } finally {
      btn.innerHTML = originalHTML;
      btn.disabled = false;
    }
  },
  // ------------------------------------------

  approvePhoto: async (id, uploaderId, btn) => {
    if (app.user.id === uploaderId && app.role !== 'manager') {
      return app.ui.showAlert("Bạn không thể tự duyệt ảnh của mình!");
    }
    btn.innerText = "Đang xử lý...";
    btn.disabled = true;
    btn.classList.add('btn-loading');
    try {
      const plate = document.getElementById(`adm-p-plate-${id}`).value.trim();
      const op = document.getElementById(`adm-p-op-${id}`).value.trim();
      const type = document.getElementById(`adm-p-type-${id}`).value;
      const route = document.getElementById(`adm-p-route-${id}`).value.trim();
      const model = document.getElementById(`adm-p-model-${id}`).value.trim();
      const location = document.getElementById(`adm-p-location-${id}`).value.trim();
      const note = document.getElementById(`adm-p-note-${id}`).value.trim();
      const {
        error: vError
      } = await app.admin.api("q25", {
        plate,
        model
      });
      if (vError) throw vError;
      await app.admin.api("q26", {
        plate,
        note,
        location,
        op,
        type,
        route,
        id
      });
      const {
        data: photoData
      } = await app.admin.api("q27", {
        id
      });
      const photo = photoData || {};
      const specialRoutes = ['Ngoài giờ hoạt động', 'Chưa hoạt động'];
      const isSpecialRoute = specialRoutes.includes(route);
      if (!isSpecialRoute) {
        const {
          data: currentHistory
        } = await app.admin.api("q28", {
          plate
        });
        const latestHist = currentHistory && currentHistory.length > 0 ? currentHistory[0] : null;
        const takenDateObj = photo.taken_at ? new Date(photo.taken_at) : new Date();
        const takenDateString = takenDateObj.toISOString().split('T')[0];
        if (!latestHist || latestHist.operator !== op || latestHist.route !== route) {
          const {
            count
          } = await app.admin.api("q29", {
            plate
          });
          await app.admin.api("q30", {
            plate,
            op,
            route,
            count,
            takenDateString
          });
        } else {
          const oldDateObj = latestHist.effective_date ? new Date(latestHist.effective_date) : new Date();
          if (takenDateObj < oldDateObj || !latestHist.effective_date) {
            await app.admin.api("q31", {
              takenDateString,
              latestHist
            });
          }
        }
      }
      app.admin.logAction('approve_photo', id, {
        plate: plate,
        operator: op
      });
      app.admin.loadTab('photos');
    } catch (err) {
      app.ui.showAlert("Lỗi: " + err.message);
    } finally {
      btn.innerText = "DUYỆT";
      btn.disabled = false;
      btn.classList.remove('btn-loading');
    }
  },
  denyPhoto: async (id, uploaderId, btn) => {
    if (app.role !== 'manager' && app.role !== 'admin') {
      return app.ui.showAlert("Chỉ Admin/Manager mới có quyền từ chối ảnh!");
    }
    if (app.user.id === uploaderId && app.role !== 'manager') {
      return app.ui.showAlert("Bạn không thể tự từ chối ảnh của chính mình!");
    }
    app.ui.showDenyPrompt("Từ chối ảnh", reason => {
      if (!reason.trim()) {
        app.ui.showAlert("Bắt buộc phải nhập lý do!");
        return;
      }
      btn.innerText = "Đang xử lý...";
      btn.disabled = true;
      btn.classList.add('btn-loading');
      (async () => {
        try {
          await app.admin.api("q32", {
            reason,
            id
          });
          const plate = document.getElementById(`adm-p-plate-${id}`).value.trim();
          await app.vehicle.cleanupVehicle(plate);
          app.admin.logAction('deny_photo', id, {
            plate: plate,
            reason: reason
          });
          app.admin.loadTab('photos');
        } catch (err) {
          app.ui.showAlert("Lỗi: " + err.message);
        } finally {
          btn.innerText = "TỪ CHỐI";
          btn.disabled = false;
          btn.classList.remove('btn-loading');
        }
      })();
    });
  },
  approveReq: async (id, btn, reqType = 'info') => {
    btn.innerText = "Đang xử lý...";
    btn.disabled = true;
    btn.classList.add('btn-loading');
    try {
      const {
        data: req
      } = await app.admin.api("q33", {
        id
      });
      if (reqType === 'info') {
        const plate = document.getElementById(`req-plate-${id}`).value;
        const op = document.getElementById(`req-op-${id}`).value;
        const type = document.getElementById(`req-type-${id}`).value;
        const route = document.getElementById(`req-route-${id}`).value;
        const model = document.getElementById(`req-model-${id}`).value;
        const loc = document.getElementById(`req-loc-${id}`).value;
        const note = document.getElementById(`req-note-${id}`).value;
        const {
          error: vError
        } = await app.admin.api("q34", {
          plate,
          model
        });
        if (vError) throw vError;
        if (req.new_data.photo_id) {
          const {
            data: oldP
          } = await app.admin.api("q35", {
            req
          });
          const {
            error: pError
          } = await app.admin.api("q36", {
            plate,
            note,
            loc,
            op,
            type,
            route,
            req
          });
          if (pError) throw pError;
          if (oldP && oldP.taken_at) {
            await app.vehicle.syncHistoryOnPhotoEdit(plate, oldP.taken_at, {
              operator: oldP.operator,
              route_no: oldP.route_no
            }, {
              operator: op,
              route_no: route
            });
          }
        }
        if (req.license_plate !== plate) {
          await app.vehicle.cleanupVehicle(req.license_plate);
        }
      } else if (reqType === 'vehicle_details' || req.new_data.request_type === 'update_vehicle_details') {
        const inputModel = document.getElementById(`req-v-model-${id}`);
        const inputNote = document.getElementById(`req-v-note-${id}`);
        const finalModel = inputModel ? inputModel.value : req.new_data.model;
        const finalNote = inputNote ? inputNote.value : req.new_data.note;
        const {
          error
        } = await app.admin.api("q37", {
          finalModel,
          finalNote,
          req
        });
        if (error) throw error;
      } else if (reqType === 'operator_info' || req.new_data.request_type === 'update_operator_info') {
        const logo = document.getElementById(`req-op-logo-${id}`).value.trim();
        const desc = document.getElementById(`req-op-desc-${id}`).value.trim();
        const {
          error
        } = await app.admin.api("q38", {
          req,
          logo,
          desc
        });
        if (error) throw error;
      } else if (reqType === 'model_info' || req.new_data.request_type === 'update_model_info') {
        const logo = document.getElementById(`req-mdl-logo-${id}`).value.trim();
        const desc = document.getElementById(`req-mdl-desc-${id}`).value.trim();
        const brandName = req.new_data.model_name.split(' ')[0];

        // 1. Lưu thông tin cho dòng xe cụ thể
        const {
          error: upsertErr
        } = await app.admin.api("q39", {
          req,
          logo,
          desc
        });
        if (upsertErr) throw upsertErr;

        // 2. Tự động đồng bộ Logo cho toàn bộ hãng
        await app.admin.api("q40", {
          logo,
          brandName
        });
      } else {
        const d = req.new_data;
        await app.admin.api("q41", {
          req
        });
        if (d.history_items && d.history_items.length > 0) {
          const newItems = d.history_items.map((item, index) => ({
            license_plate: req.license_plate,
            operator: item.operator,
            route: item.route,
            note: item.note,
            effective_date: item.effective_date || null,
            display_order: index
          }));
          await app.admin.api("q42", {
            newItems
          });
        }
      }
      await app.admin.api("q43", {
        id
      });
      app.admin.logAction('approve_edit_req', id, {
        req_type: reqType,
        plate: req.license_plate
      });
      app.admin.loadTab('requests');
    } catch (err) {
      app.ui.showAlert("Lỗi: " + err.message);
    } finally {
      btn.innerText = "DUYỆT";
      btn.disabled = false;
      btn.classList.remove('btn-loading');
    }
  },
  directDeleteInput: async btn => {
    if (app.role !== 'manager') return app.ui.showAlert("Chỉ Manager mới có quyền sử dụng tính năng này!");
    const input = document.getElementById('adm-direct-delete-id').value.trim();
    const reason = document.getElementById('adm-direct-delete-reason').value.trim();
    if (!input || !reason) return app.ui.showAlert("Vui lòng nhập đủ ID (hoặc Link) ảnh và Lý do xóa!");
    let photoId = input;
    if (input.includes('/photo/')) {
      try {
        photoId = input.split('/photo/')[1].split('?')[0].split('/')[0];
      } catch (e) {
        return app.ui.showAlert("Link không hợp lệ!");
      }
    }
    const originalText = btn.innerText;
    btn.innerText = "Đang xóa...";
    btn.disabled = true;
    try {
      const {
        data: p,
        error: errFetch
      } = await app.admin.api("q44", {
        photoId
      });
      if (errFetch || !p) return app.ui.showAlert("Không tìm thấy ảnh với ID này trong hệ thống!");
      await app.admin.api("q45", {
        reason,
        p
      });
      await app.vehicle.cleanupVehicle(p.license_plate);
      app.admin.logAction('direct_delete', photoId, {
        plate: p.license_plate,
        reason: reason
      });
      app.toast.show('success', 'Thành công', 'Đã xóa ảnh thành công!');
      document.getElementById('adm-direct-delete-id').value = '';
      document.getElementById('adm-direct-delete-reason').value = '';
    } catch (e) {
      app.ui.showAlert("Lỗi: " + e.message);
    } finally {
      btn.innerText = originalText;
      btn.disabled = false;
    }
  },
  approveDeleteReq: async (reqId, photoId, requesterId, userReason, btn) => {
    if (app.role !== 'manager') {
      return app.ui.showAlert("Chỉ Manager mới có quyền duyệt lệnh xóa ảnh khỏi hệ thống!");
    }
    btn.innerText = "Đang xử lý...";
    btn.disabled = true;
    btn.classList.add('btn-loading');
    try {
      // CẬP NHẬT TRUY VẤN: Lấy thêm cột 'url' để truyền qua API
      const {
        data: photo
      } = await app.admin.api("q46", {
        photoId
      });
      const plate = photo ? photo.license_plate : 'đã chọn';
      const imgUrl = photo ? photo.url : null;

      // 1. Gọi API Xóa ảnh khỏi ImageKit
      if (imgUrl) {
        const {
          data: {
            session
          }
        } = await window.sb.auth.getSession();
        await fetch('/api/delete-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({
            imageUrl: imgUrl
          })
        });
      }

      // 2. Xóa dữ liệu Database
      const {
        error: delError
      } = await app.admin.api("q47", {
        photoId
      });
      if (delError) throw delError;
      await app.vehicle.cleanupVehicle(plate);
      await app.admin.api("q48", {
        reqId
      });
      app.toast.show('success', 'Thành công', 'Đã duyệt yêu cầu và xóa ảnh vĩnh viễn thành công!');
      app.admin.logAction('approve_delete_req', photoId, {
        plate: plate
      });
      app.admin.loadTab('delete');
    } catch (err) {
      app.ui.showAlert("Lỗi khi duyệt xóa: " + err.message);
      btn.innerText = "DUYỆT XÓA";
      btn.disabled = false;
      btn.classList.remove('btn-loading');
    }
  },
  denyReq: async (reqId, btn) => {
    app.ui.showPrompt("Nhập lý do từ chối yêu cầu này (Tùy chọn):", "", async reason => {
      btn.innerText = "Đang xử lý...";
      btn.disabled = true;
      btn.classList.add('btn-loading');
      try {
        const {
          data: req
        } = await app.admin.api("q49", {
          reqId
        });
        await app.admin.api("q50", {
          reqId
        });
        let actionName = req.new_data.request_type === 'delete_photo' ? 'xóa ảnh' : 'chỉnh sửa';
        let reasonMsg = reason ? ` Lý do: ${reason}` : '';
        if (req.new_data.request_type === 'delete_photo') app.admin.loadTab('delete');else app.admin.loadTab('requests');
      } catch (err) {
        app.ui.showAlert("Lỗi: " + err.message);
        btn.innerText = "TỪ CHỐI";
        btn.disabled = false;
        btn.classList.remove('btn-loading');
      }
    });
  }
};
window.app.upload = {
  currentQuota: {
    limit: null,
    count: 0
  },
  routeOpTimeout: null,
  // [MỚI] TRẠNG THÁI HÀNG ĐỢI
  uploadQueue: [],
  isQueueProcessing: false,
  activeProgressToast: null,
  saveDraft: () => {
    const plate = document.getElementById('up-plate')?.value || '';
    const operator = document.getElementById('up-operator')?.value || '';
    const route = document.getElementById('up-route')?.value || '';
    const model = document.getElementById('up-model')?.value || '';
    const note = document.getElementById('up-note')?.value || '';
    if (!plate && !operator && !route && !model && !note) {
      localStorage.removeItem('vnbus_upload_draft');
      return;
    }
    const draft = {
      plate: plate,
      type: document.getElementById('up-type')?.value || '',
      route: route,
      operator: operator,
      model: model,
      location: document.getElementById('up-location')?.value || '',
      date: document.getElementById('up-date')?.value || '',
      note: note
    };
    localStorage.setItem('vnbus_upload_draft', JSON.stringify(draft));
  },
  checkAndPromptDraft: () => {
    const saved = localStorage.getItem('vnbus_upload_draft');
    if (saved) {
      try {
        const draft = JSON.parse(saved);
        if (draft.plate || draft.operator || draft.route) {
          const plateText = draft.plate ? `xe <b>${draft.plate}</b>` : "một xe chưa rõ BKS";
          app.ui.showAlert(`Bạn có bản nháp cho ${plateText}. Bạn có muốn tiếp tục không?<br><br><span class="text-[11px] text-gray-500 italic"><i class="fa-solid fa-circle-info mr-1"></i>Lưu ý: Do chính sách bảo mật của trình duyệt, bạn vẫn cần phải tự chọn lại file ảnh.</span>`, () => {
            app.upload.loadDraft(draft);
          }, () => {
            app.upload.clearDraft();
          }, {
            title: "Khôi phục bản nháp",
            btnOkText: "Tiếp tục",
            btnCancelText: "Bỏ qua"
          });
        }
      } catch (e) {
        app.upload.clearDraft();
      }
    }
  },
  loadDraft: draft => {
    try {
      if (draft.plate) document.getElementById('up-plate').value = draft.plate;
      if (draft.type) {
        document.getElementById('up-type').value = draft.type;
        app.upload.applyPreferenceUI();
      }
      if (draft.route) document.getElementById('up-route').value = draft.route;
      if (draft.operator) document.getElementById('up-operator').value = draft.operator;
      if (draft.model) document.getElementById('up-model').value = draft.model;
      if (draft.location) document.getElementById('up-location').value = draft.location;
      if (draft.date) document.getElementById('up-date').value = draft.date;
      if (draft.note) document.getElementById('up-note').value = draft.note;
      if (draft.plate) app.upload.checkPlate(draft.plate);
    } catch (e) {
      console.warn("Lỗi load draft", e);
    }
  },
  clearDraft: () => {
    localStorage.removeItem('vnbus_upload_draft');
  },
  autoFillOperatorByRoute: async () => {
    if (app.vehicleLocked) return;
    const plateInput = document.getElementById('up-plate');
    const routeInput = document.getElementById('up-route');
    const opInput = document.getElementById('up-operator');
    const modelInput = document.getElementById('up-model');
    if (!plateInput || !routeInput || !opInput) return;
    const plate = plateInput.value.replace(/[^A-Z0-9-]/gi, '').toUpperCase();
    const route = routeInput.value.trim();
    if (!app.upload.autoFilledData) app.upload.autoFilledData = {
      operator: '',
      model: ''
    };
    const canOverwriteOp = !opInput.value || opInput.value === app.upload.autoFilledData.operator;
    const canOverwriteModel = !modelInput || !modelInput.value || modelInput.value === app.upload.autoFilledData.model;
    const specialRoutes = ['Dừng hoạt động', 'Ngoài giờ hoạt động', 'Chưa hoạt động', 'Xe hợp đồng / Đưa đón', 'Hợp đồng / Đưa đón'];
    if (!plate || plate.length < 2 || !route || specialRoutes.includes(route)) {
      if (canOverwriteOp) {
        opInput.value = '';
        app.upload.autoFilledData.operator = '';
      }
      if (canOverwriteModel) {
        modelInput.value = '';
        app.upload.autoFilledData.model = '';
      }
      return;
    }
    const prefix = plate.substring(0, 2);
    if (isNaN(prefix)) return;
    const relatedPrefixes = app.utils.getRelatedPrefixes(prefix);
    if (!relatedPrefixes || relatedPrefixes.length === 0) return;
    const dateInput = document.getElementById('up-date');
    const uploadDate = dateInput && dateInput.value ? new Date(dateInput.value).getTime() : Date.now();
    try {
      const prefixOrCond = relatedPrefixes.map(p => `license_plate.ilike.${p}%`).join(',');
      const {
        data
      } = await app.admin.api("q51", {
        route,
        prefixOrCond
      });
      if (data && data.length > 0) {
        data.sort((a, b) => {
          const timeA = a.taken_at ? new Date(a.taken_at).getTime() : new Date(a.created_at).getTime();
          const timeB = b.taken_at ? new Date(b.taken_at).getTime() : new Date(b.created_at).getTime();
          return Math.abs(timeA - uploadDate) - Math.abs(timeB - uploadDate);
        });
        const closest = data[0];
        if (closest.operator && canOverwriteOp) {
          opInput.value = closest.operator;
          app.upload.autoFilledData.operator = closest.operator;
        }
        if (modelInput && closest.vehicles && closest.vehicles.model && canOverwriteModel) {
          modelInput.value = closest.vehicles.model;
          app.upload.autoFilledData.model = closest.vehicles.model;
        }
        if (closest.type === 'bus') app.upload.selectType('bus');
      } else {
        if (canOverwriteOp) {
          opInput.value = '';
          app.upload.autoFilledData.operator = '';
        }
        if (canOverwriteModel) {
          modelInput.value = '';
          app.upload.autoFilledData.model = '';
        }
      }
    } catch (e) {
      console.error("Lỗi Auto-fill đơn vị vận hành:", e);
    }
  },
  applyPreferenceUI: () => {
    const warningEl = document.getElementById('upload-pref-warning');
    const typeText = document.getElementById('pref-warning-type');
    const btnBus = document.getElementById('btn-type-bus');
    const btnCoach = document.getElementById('btn-type-coach');
    const pref = app.preference.current;
    if (btnBus) btnBus.classList.remove('opacity-50', 'pointer-events-none');
    if (btnCoach) btnCoach.classList.remove('opacity-50', 'pointer-events-none');
    if (pref === 'both' || !pref) {
      if (warningEl) warningEl.classList.add('hidden');
      document.getElementById('up-type').value = '';
      [btnBus, btnCoach].forEach(btn => {
        if (btn) {
          btn.className = "cursor-pointer border border-gray-300 bg-white text-gray-800 rounded-xl p-4 shadow-sm hover:border-gray-400 hover:shadow-md transition-all duration-200 group relative";
          const iconBg = btn.querySelector('.icon-bg');
          if (iconBg) {
            iconBg.classList.remove('bg-white/20', 'border-white/30');
            iconBg.classList.add('bg-gray-100', 'border-transparent');
          }
          const p = btn.querySelector('p');
          if (p) {
            p.classList.remove('text-gray-300');
            p.classList.add('text-gray-500');
          }
        }
      });
    } else {
      if (warningEl) warningEl.classList.remove('hidden');
      if (typeText) typeText.innerText = pref === 'bus' ? 'Xe Buýt' : 'Xe Khách';
      app.upload.performSelectType(pref);
      if (pref === 'bus' && btnCoach) {
        btnCoach.classList.add('opacity-50', 'pointer-events-none');
      } else if (pref === 'coach' && btnBus) {
        btnBus.classList.add('opacity-50', 'pointer-events-none');
      }
    }
  },
  fetchRequirements: async () => {
    const container = document.getElementById('upload-rules-content');
    if (!container || container.dataset.loaded === 'true') return;
    try {
      const res = await fetch('https://raw.githubusercontent.com/hoyuuna/VNBUSARCHIVE/refs/heads/main/Requirements.md');
      if (!res.ok) throw new Error('Network error');
      const text = await res.text();
      const html = DOMPurify.sanitize(marked.parse(text));
      container.innerHTML = html;
      container.dataset.loaded = 'true';
    } catch (e) {
      container.innerHTML = '<p class="text-red-500 font-bold py-4 text-center"><i class="fa-solid fa-triangle-exclamation"></i> Không thể tải nội dung tự động. Vui lòng nhấn "Xem chi tiết trên GitHub" bên dưới.</p>';
    }
  },
  existingVehiclesList: [],
  checkModelWarning: () => {
    const warningEl = document.getElementById('model-warning-msg');
    const plateInput = document.getElementById('up-plate');
    const modelInput = document.getElementById('up-model');
    if (!warningEl || !plateInput || !modelInput) return;
    const rawPlate = plateInput.value.replace(/[^A-Z0-9-]/gi, '').toUpperCase();
    const currentModel = modelInput.value.trim().toLowerCase();
    if (!rawPlate || !currentModel) {
      warningEl.classList.add('hidden');
      return;
    }
    const parts = rawPlate.split('-');
    if (parts.length < 2) {
      warningEl.classList.add('hidden');
      return;
    }
    const basePlate = parts[0];
    const existingVehicles = app.upload.existingVehiclesList || [];
    const exactVehicle = existingVehicles.find(v => v.license_plate === rawPlate);
    if (exactVehicle) {
      warningEl.classList.add('hidden');
      return;
    }
    const baseVehicle = existingVehicles.find(v => v.license_plate === basePlate);
    if (baseVehicle && baseVehicle.model) {
      const baseModelLower = baseVehicle.model.toLowerCase();
      if (baseModelLower === currentModel || baseModelLower.includes(currentModel) || currentModel.includes(baseModelLower)) {
        warningEl.classList.remove('hidden');
        return;
      }
    }
    warningEl.classList.add('hidden');
  },
  checkDuplicateRealtime: async () => {
    if (!app.user) return;
    const plateInput = document.getElementById('up-plate');
    const dateInput = document.getElementById('up-date');
    const btnSubmit = document.getElementById('btn-submit');
    if (!plateInput || !dateInput || !btnSubmit) return;
    const valPlate = plateInput.value.trim();
    const valDate = dateInput.value;
    const oldWarning = document.getElementById('duplicate-warning-msg');
    if (oldWarning) oldWarning.remove();
    if (!document.getElementById('upload-quota-text')?.classList.contains('text-red-600')) {
      btnSubmit.disabled = false;
    }
    if (!valPlate || !valDate) return;
    const cleanPlate = valPlate.replace(/[^A-Z0-9-]/gi, '').toUpperCase();
    try {
      const {
        data: existingPhotos,
        error: checkErr
      } = await app.admin.api("q52", {
        app,
        cleanPlate
      });
      if (!checkErr && existingPhotos && existingPhotos.length > 0) {
        const isDuplicateDate = existingPhotos.some(p => {
          if (!p.taken_at) return false;
          return p.taken_at.split('T')[0] === valDate;
        });
        if (isDuplicateDate) {
          btnSubmit.disabled = true;
          const displayDate = valDate.split('-').reverse().join('/');
          const warningEl = document.createElement('div');
          warningEl.id = 'duplicate-warning-msg';
          warningEl.className = 'mt-3 p-3 bg-red-50 border border-red-200 rounded-lg shadow-sm flex items-start gap-2.5 fade-zoom-in';
          warningEl.innerHTML = `
                                    <i class="fa-solid fa-triangle-exclamation text-red-500 mt-0.5 text-sm"></i>
                                    <p class="text-[11px] font-bold text-red-700 leading-snug m-0">
                                        Bạn đã có ảnh với BKS tương tự được chụp ngày ${displayDate}. Bạn không thể đăng 2 ảnh của cùng 1 xe được chụp cùng ngày.
                                    </p>
                                `;
          const plateContainer = plateInput.closest('div[x-data]') || plateInput.parentElement;
          plateContainer.appendChild(warningEl);
        }
      }
    } catch (err) {
      console.error("Lỗi realtime trùng ngày:", err);
    }
  },
  initMap: () => {
    app.uploadMap = L.map('upload-map').setView([10.762622, 106.660172], 13);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(app.uploadMap);
    app.uploadMap.on('click', async e => {
      const {
        lat,
        lng
      } = e.latlng;
      if (app.uploadMarker) app.uploadMap.removeLayer(app.uploadMarker);
      app.uploadMarker = L.marker([lat, lng]).addTo(app.uploadMap);
      const address = await app.utils.reverseGeocode(lat, lng);
      document.getElementById('up-location').value = address;
    });
  },
  addBlurPanel: () => {
    const currentCount = document.querySelectorAll('.blur-panel').length;
    if (currentCount >= 5) {
      return app.ui.showAlert("Bạn chỉ được thêm tối đa 5 vùng làm mờ cho mỗi ảnh.");
    }
    app.upload.performAddBlurPanel();
  },
  performAddBlurPanel: () => {
    const container = document.getElementById('preview-container');
    const id = 'blur-' + Date.now();
    const panel = document.createElement('div');
    panel.className = 'blur-panel';
    panel.id = id;
    panel.style.left = '40%';
    panel.style.top = '40%';
    panel.style.width = '80px';
    panel.style.height = '50px';
    panel.innerHTML = `
                        <button type="button" class="delete-blur" onclick="app.upload.removeBlurPanel('${id}')" title="Xóa vùng này"><i class="fa-solid fa-xmark"></i></button>
                        <div class="resize-handle" style="position: absolute; bottom: 0; right: 0; width: 20px; height: 20px; cursor: nwse-resize; z-index: 10;"></div>
                    `;
    let isDragging = false;
    let dragStartX, dragStartY, initialLeft, initialTop;
    const startDrag = e => {
      if (e.target.closest('.delete-blur') || e.target.closest('.resize-handle')) return;
      e.stopPropagation();
      if (e.type === 'touchstart') e.preventDefault();
      isDragging = true;
      dragStartX = e.clientX || e.touches[0].clientX;
      dragStartY = e.clientY || e.touches[0].clientY;
      initialLeft = panel.offsetLeft;
      initialTop = panel.offsetTop;
    };
    panel.addEventListener('mousedown', startDrag);
    panel.addEventListener('touchstart', startDrag, {
      passive: false
    });
    let isResizing = false;
    let resizeStartX, resizeStartY, initialWidth, initialHeight;
    const resizeHandle = panel.querySelector('.resize-handle');
    const startResize = e => {
      e.stopPropagation();
      if (e.type === 'touchstart') e.preventDefault();
      isResizing = true;
      resizeStartX = e.clientX || e.touches[0].clientX;
      resizeStartY = e.clientY || e.touches[0].clientY;
      initialWidth = panel.offsetWidth;
      initialHeight = panel.offsetHeight;
    };
    resizeHandle.addEventListener('mousedown', startResize);
    resizeHandle.addEventListener('touchstart', startResize, {
      passive: false
    });
    const onMove = (clientX, clientY) => {
      if (isDragging) {
        const dx = clientX - dragStartX;
        const dy = clientY - dragStartY;
        let newLeft = initialLeft + dx;
        let newTop = initialTop + dy;
        const minLeft = 0;
        const minTop = 0;
        const maxLeft = container.offsetWidth - panel.offsetWidth;
        const maxTop = container.offsetHeight - panel.offsetHeight;
        panel.style.left = Math.max(minLeft, Math.min(newLeft, maxLeft)) + 'px';
        panel.style.top = Math.max(minTop, Math.min(newTop, maxTop)) + 'px';
      } else if (isResizing) {
        const dx = clientX - resizeStartX;
        const dy = clientY - resizeStartY;
        let newWidth = initialWidth + dx;
        let newHeight = initialHeight + dy;
        newWidth = Math.max(30, Math.min(newWidth, container.offsetWidth - panel.offsetLeft));
        newHeight = Math.max(30, Math.min(newHeight, container.offsetHeight - panel.offsetTop));
        panel.style.width = newWidth + 'px';
        panel.style.height = newHeight + 'px';
      }
    };
    const handleMouseMove = e => {
      if (isDragging || isResizing) {
        e.preventDefault();
        onMove(e.clientX, e.clientY);
      }
    };
    const handleTouchMove = e => {
      if (isDragging || isResizing) {
        e.preventDefault();
        onMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const endAction = () => {
      isDragging = false;
      isResizing = false;
      const deleteBtn = panel.querySelector('.delete-blur');
      if (panel.offsetLeft < 28) deleteBtn.classList.add('right');else deleteBtn.classList.remove('right');
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('touchmove', handleTouchMove, {
      passive: false
    });
    document.addEventListener('mouseup', endAction);
    document.addEventListener('touchend', endAction);
    container.appendChild(panel);
    app.upload.updateBlurBtn();
  },
  removeBlurPanel: id => {
    const panel = document.getElementById(id);
    if (panel) panel.remove();
    app.upload.updateBlurBtn();
  },
  updateBlurBtn: () => {
    const count = document.querySelectorAll('.blur-panel').length;
    const btn = document.getElementById('btn-add-blur');
    if (btn) btn.innerHTML = `<i class="fa-solid fa-droplet-slash"></i> Làm mờ (${count}/5)`;
    let warningBox = document.getElementById('blur-warning-box');
    if (!warningBox) {
      warningBox = document.createElement('div');
      warningBox.id = 'blur-warning-box';
      warningBox.className = 'mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl shadow-sm flex items-start gap-2 hidden';
      warningBox.innerHTML = '<i class="fa-solid fa-triangle-exclamation text-amber-500 mt-0.5 text-xs"></i><p class="text-[11px] text-amber-800 font-bold leading-relaxed m-0">Không lạm dụng công cụ làm mờ. Vùng làm mờ/che vật thể tuyệt đối không được đè lên bất kỳ bộ phận nào của xe (thân xe, bánh xe, kính, đèn...), tránh làm ảnh hưởng đến tính toàn vẹn và chi tiết của chủ thể.</p>';
      const toolbar = document.getElementById('vnbus-editor-toolbar');
      if (toolbar) toolbar.appendChild(warningBox);
    }
    if (count > 0) warningBox.classList.remove('hidden');else warningBox.classList.add('hidden');
  },
  checkPlate: async val => {
    const rawPlate = val.replace(/[^A-Z0-9-]/gi, '').toUpperCase();
    const msg = document.getElementById('plate-msg');
    const btnSubmit = document.getElementById('btn-submit');
    const unlockUI = () => {
      app.vehicleLocked = false;
      app.currentVehicle = null;
      ['up-operator', 'up-model', 'up-route'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.readOnly = false;
          el.classList.remove('bg-gray-100');
        }
      });
      document.getElementById('locked-msg')?.classList.add('hidden');
      if (app.upload.applyPreferenceUI) app.upload.applyPreferenceUI();
      const btnBus = document.getElementById('btn-type-bus');
      const btnCoach = document.getElementById('btn-type-coach');
      if (btnBus) btnBus.classList.remove('opacity-60', 'opacity-80', 'cursor-not-allowed');
      if (btnCoach) btnCoach.classList.remove('opacity-60', 'opacity-80', 'cursor-not-allowed');
      if (btnSubmit && !document.getElementById('upload-quota-text')?.classList.contains('text-red-600')) btnSubmit.disabled = false;
    };
    if (rawPlate.startsWith('80')) {
      unlockUI();
      if (btnSubmit) btnSubmit.disabled = true;
      msg.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Tuyệt đối nghiêm cấm đăng tải ảnh xe của các cơ quan nhà nước/chính phủ!';
      msg.className = "text-xs mt-1 text-red-600 font-bold";
      return;
    }
    const regex = /^([0-9]{2}[A-Z]{1,2}[0-9]{4,5}|[0-9]{2}LD[0-9]{4,5}|T[0-9]{7}|[A-Z]{3}[0-9]{4,7})(-[0-9]+)?$/i;
    if (!regex.test(rawPlate)) {
      unlockUI();
      msg.innerText = "Định dạng BKS không hợp lệ (VD: 29A12345, T1234567, HAN1234567)";
      msg.className = "text-xs mt-1 text-red-600 font-bold";
      return;
    }
    const airportMatch = rawPlate.match(/^([A-Z]{3})\d{4,7}/);
    if (airportMatch) {
      const routeInput = document.getElementById('up-route');
      if (routeInput && (!routeInput.value || /^[A-Z]{3}$/.test(routeInput.value))) {
        routeInput.value = airportMatch[1];
      }
    }
    msg.innerText = "Đang kiểm tra dữ liệu biển định danh...";
    msg.className = "text-xs mt-1 text-gray-500";
    const parts = rawPlate.split('-');
    const basePlate = parts[0];
    const currentSuffix = parts[1] ? parseInt(parts[1]) : 0;
    try {
      const {
        data: existingVehicles
      } = await app.utils.promiseWithTimeout(app.admin.api("q53", {
        basePlate
      }), 5000);
      app.upload.existingVehiclesList = existingVehicles || [];
      app.upload.checkModelWarning && app.upload.checkModelWarning();
      let existingSuffixes = [];
      if (existingVehicles) {
        existingVehicles.forEach(v => {
          if (v.license_plate === basePlate) existingSuffixes.push(0);else {
            const p = v.license_plate.split('-');
            if (p.length === 2 && p[0] === basePlate && !isNaN(p[1])) {
              existingSuffixes.push(parseInt(p[1]));
            }
          }
        });
      }
      const maxExisting = existingSuffixes.length > 0 ? Math.max(...existingSuffixes) : -1;
      if (!existingSuffixes.includes(currentSuffix)) {
        const expectedNext = maxExisting + 1;
        if (currentSuffix !== expectedNext) {
          if (expectedNext === 0) {
            msg.innerText = `Biển gốc chưa tồn tại. Vui lòng nhập ${basePlate} trước.`;
          } else {
            msg.innerText = `Sai thứ tự định danh! Vui lòng nhập đúng tuần tự: ${basePlate}-${expectedNext} trước.`;
          }
          msg.className = "text-xs mt-1 text-red-600 font-bold";
          unlockUI();
          return;
        }
      }
      const exactVehicle = existingVehicles?.find(v => v.license_plate === rawPlate);
      let hasApproved = false;
      let recentPhotos = [];
      if (exactVehicle) {
        const {
          data
        } = await app.admin.api("q54", {
          rawPlate
        });
        recentPhotos = data || [];
        hasApproved = recentPhotos.length > 0;
      }
      if (exactVehicle && hasApproved) {
        app.vehicleLocked = true;
        app.currentVehicle = exactVehicle;
        document.getElementById('up-model').value = exactVehicle.model || '';
        if (recentPhotos && recentPhotos.length > 0) {
          const dateInput = document.getElementById('up-date');
          const uploadDate = dateInput && dateInput.value ? new Date(dateInput.value).getTime() : Date.now();
          recentPhotos.sort((a, b) => {
            const timeA = a.taken_at ? new Date(a.taken_at).getTime() : new Date(a.created_at).getTime();
            const timeB = b.taken_at ? new Date(b.taken_at).getTime() : new Date(b.created_at).getTime();
            return Math.abs(timeA - uploadDate) - Math.abs(timeB - uploadDate);
          });
          let validPhoto = recentPhotos.find(p => p.route_no !== 'Ngoài giờ hoạt động');
          if (!validPhoto) validPhoto = {
            operator: recentPhotos[0].operator,
            route_no: '',
            type: recentPhotos[0].type
          };
          document.getElementById('up-operator').value = validPhoto.operator || '';
          document.getElementById('up-route').value = validPhoto.route_no || '';
          const dbType = validPhoto.type || 'bus';
          const prefType = app.preference.current;
          if (prefType !== 'both' && dbType !== prefType) {
            app.ui.showAlert(`Hệ thống nhận diện xe này là <b>${dbType === 'bus' ? 'Xe Buýt' : 'Xe Khách'}</b>, khác với tùy chọn Cá nhân hóa của bạn.<br><br>Bạn có muốn tạm thời mở khóa loại xe để tiếp tục đăng ảnh xe này không?`, () => {
              const btnBus = document.getElementById('btn-type-bus');
              const btnCoach = document.getElementById('btn-type-coach');
              if (btnBus) btnBus.classList.remove('opacity-50', 'pointer-events-none');
              if (btnCoach) btnCoach.classList.remove('opacity-50', 'pointer-events-none');
              app.upload.selectType(dbType, true);
              const submitBtn = document.getElementById('btn-submit');
              if (submitBtn && !document.getElementById('upload-quota-text')?.classList.contains('text-red-600')) submitBtn.disabled = false;
            }, () => {
              const submitBtn = document.getElementById('btn-submit');
              if (submitBtn) submitBtn.disabled = true;
              msg.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Đã hủy chuyển đổi loại xe. Không thể tiếp tục đăng tải xe này.';
              msg.className = "text-xs mt-1 text-red-600 font-bold";
            }, {
              title: "Xác nhận chuyển đổi loại xe",
              btnOkText: "Chuyển đổi",
              btnCancelText: "Hủy"
            });
          } else {
            app.upload.selectType(dbType, true);
          }
        }
        ['up-operator', 'up-route'].forEach(id => {
          document.getElementById(id).readOnly = false;
          document.getElementById(id).classList.remove('bg-gray-100');
        });
        ['up-model'].forEach(id => {
          document.getElementById(id).readOnly = true;
          document.getElementById(id).classList.add('bg-gray-100');
        });
        document.getElementById('locked-msg').classList.remove('hidden');
        const {
          data: shootersData
        } = await app.admin.api("q55", {
          rawPlate
        });
        let shootersText = "";
        if (shootersData && shootersData.length > 0) {
          const uniqueUsers = [...new Set(shootersData.map(p => p.profiles?.username).filter(Boolean))];
          if (uniqueUsers.length === 1) shootersText = `Xe này cũng đã được chụp bởi <b>${uniqueUsers[0]}</b>.`;else if (uniqueUsers.length === 2) shootersText = `Xe này cũng đã được chụp bởi <b>${uniqueUsers[0]}</b> và <b>${uniqueUsers[1]}</b>.`;else if (uniqueUsers.length > 2) shootersText = `Xe này cũng đã được chụp bởi <b>${uniqueUsers[0]}</b>, <b>${uniqueUsers[1]}</b> và <b>${uniqueUsers.length - 2} người khác</b>.`;
        }
        let suggestionHtml = '';
        const otherGens = existingVehicles.filter(v => v.license_plate !== rawPlate);
        if (otherGens.length > 0) {
          const links = otherGens.map(v => `<a href="javascript:void(0)" onclick="document.getElementById('up-plate').value='${v.license_plate}'; app.upload.checkPlate('${v.license_plate}')" class="text-blue-600 hover:underline font-bold">${v.license_plate}</a>`).join(' hoặc ');
          suggestionHtml = `<span class="text-gray-500 font-normal">Không phải xe này? Thử: ${links}</span>`;
        }
        const finalText = [shootersText, suggestionHtml].filter(Boolean).join('<br>');
        msg.innerHTML = finalText;
        msg.className = "text-xs mt-1 text-black";
      } else {
        unlockUI();
        if (exactVehicle) {
          document.getElementById('up-model').value = exactVehicle.model || '';
        }
        msg.innerText = "";
        msg.className = "hidden";
        app.upload.autoFillOperatorByRoute();
      }
      app.upload.checkDuplicateRealtime();
    } catch (err) {
      unlockUI();
      msg.innerText = "Mất kết nối server, vui lòng nhập lại BKS.";
      msg.className = "text-xs mt-1 text-amber-600";
    }
  },
  toggleRoute: val => {
    const lbl = document.getElementById('lbl-route');
    if (val === 'bus') lbl.innerHTML = 'Mã số tuyến <span class="text-red-500">*</span>';else lbl.innerHTML = 'Lộ trình <span class="text-red-500">*</span>';
  },
  selectType: (type, isLocked = false) => {
    const currentType = document.getElementById('up-type').value;
    if (app.vehicleLocked && !isLocked && currentType && currentType !== type) {
      const typeName = type === 'bus' ? 'Xe Buýt' : 'Xe Khách';
      app.ui.showAlert(`Bạn có chắc phương tiện này đã được chuyển đổi công năng thành <b>${typeName}</b>?`, () => {
        app.upload.performSelectType(type);
      }, () => {}, {
        countdown: true,
        btnOkText: "Tôi chắc chắn",
        btnCancelText: "Hủy",
        title: "Xác nhận chuyển đổi"
      });
      return;
    }
    app.upload.performSelectType(type);
  },
  performSelectType: type => {
    document.getElementById('up-type').value = type;
    document.getElementById('type-msg').classList.add('hidden');
    const btnBus = document.getElementById('btn-type-bus');
    const btnCoach = document.getElementById('btn-type-coach');
    [btnBus, btnCoach].forEach(btn => {
      btn.className = "cursor-pointer border border-gray-300 bg-white text-gray-800 rounded-xl p-4 shadow-sm hover:border-gray-400 hover:shadow-md transition-all duration-200 group relative" + (app.vehicleLocked ? " opacity-60 cursor-not-allowed" : "");
      const iconBg = btn.querySelector('.icon-bg');
      iconBg.classList.remove('bg-white/20');
      iconBg.classList.add('bg-gray-100');
      iconBg.classList.remove('border-white/30');
      iconBg.classList.add('border-transparent');
      const p = btn.querySelector('p');
      p.classList.remove('text-gray-300');
      p.classList.add('text-gray-500');
    });
    const activeBtn = type === 'bus' ? btnBus : btnCoach;
    activeBtn.className = "cursor-pointer border border-black bg-black text-white rounded-xl p-4 shadow-md transition-all duration-200 scale-[1.02]" + (app.vehicleLocked ? " opacity-80 cursor-not-allowed scale-100" : "");
    const iconActiveBg = activeBtn.querySelector('.icon-bg');
    iconActiveBg.classList.remove('bg-gray-100');
    iconActiveBg.classList.add('bg-white/20');
    iconActiveBg.classList.remove('border-transparent');
    iconActiveBg.classList.add('border-white/30');
    activeBtn.querySelector('p').classList.remove('text-gray-500');
    activeBtn.querySelector('p').classList.add('text-gray-300');
    app.upload.toggleRoute(type);
  },
  toggleColor: isBlack => {
    app.wmState.color = isBlack ? 'black' : 'white';
    const el = document.getElementById('draggable-watermark');
    if (isBlack) el.classList.add('wm-black');else el.classList.remove('wm-black');
    const lbl = document.getElementById('btn-lbl-wm-black');
    if (lbl) {
      if (isBlack) {
        lbl.classList.add('bg-gray-200', 'border-gray-400', 'text-black');
        lbl.classList.remove('bg-white');
      } else {
        lbl.classList.remove('bg-gray-200', 'border-gray-400', 'text-black');
        lbl.classList.add('bg-white');
      }
    }
    if (app.upload.schedulePrepareBlob) app.upload.schedulePrepareBlob();
  },
  currentFilters: 'none',
  readyBlob: null,
  isPreparingBlob: false,
  prepareTimeout: null,
  schedulePrepareBlob: () => {
    if (app.upload.prepareTimeout) clearTimeout(app.upload.prepareTimeout);
    app.upload.prepareTimeout = setTimeout(app.upload.prepareFinalBlob, 500);
  },
  prepareFinalBlob: async () => {
    if (!app.rawFile || !app.user) return;
    try {
      app.upload.isPreparingBlob = true;
      const username = app.username || "Guest";
      const finalBlob = await app.utils.watermark(app.rawFile, username, app.wmState, app.upload.currentFilters || 'none');
      const targetMime = app.utils.getTargetMimeType();
      const compressOptions = {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: targetMime,
        initialQuality: 0.85
      };
      const compressedFile = await imageCompression(finalBlob, compressOptions);
      if (compressedFile.size <= 1.5 * 1024 * 1024) {
        app.upload.readyBlob = compressedFile;
      } else {
        app.upload.readyBlob = null;
      }
    } catch (err) {
      console.error("Lỗi prepareFinalBlob:", err);
      app.upload.readyBlob = null;
    } finally {
      app.upload.isPreparingBlob = false;
    }
  },
  toggleColorPanel: () => {
    const panel = document.getElementById('color-adjust-panel');
    if (panel) panel.classList.toggle('hidden');
  },
  updateFilters: () => {
    const b = document.getElementById('adj-brightness')?.value || 100;
    const c = document.getElementById('adj-contrast')?.value || 100;
    const s = document.getElementById('adj-saturation')?.value || 100;
    const vb = document.getElementById('val-brightness');
    const vc = document.getElementById('val-contrast');
    const vs = document.getElementById('val-saturation');
    if (vb) vb.innerText = b + '%';
    if (vc) vc.innerText = c + '%';
    if (vs) vs.innerText = s + '%';
    const filterString = `brightness(${b}%) contrast(${c}%) saturate(${s}%)`;
    const previewImg = document.getElementById('preview-img');
    if (previewImg) previewImg.style.filter = filterString;
    app.upload.currentFilters = filterString;
    if (app.upload.schedulePrepareBlob) app.upload.schedulePrepareBlob();
  },
  resetFilters: () => {
    const b = document.getElementById('adj-brightness');
    const c = document.getElementById('adj-contrast');
    const s = document.getElementById('adj-saturation');
    if (b) b.value = 100;
    if (c) c.value = 100;
    if (s) s.value = 100;
    app.upload.updateFilters();
  },
  removeImage: () => {
    const upFile = document.getElementById('up-file');
    if (upFile) upFile.value = '';
    const previewBox = document.getElementById('preview-box');
    if (previewBox) previewBox.classList.add('hidden');
    const dropZone = document.getElementById('drop-zone');
    const connectedZone = document.getElementById('webrtc-connected-zone');
    if (app.webrtc && app.webrtc.conn && app.webrtc.conn.open) {
      if (connectedZone) {
        connectedZone.classList.remove('hidden');
        connectedZone.classList.add('flex');
      }
      if (dropZone) dropZone.classList.add('hidden');
    } else {
      if (dropZone) dropZone.classList.remove('hidden');
      if (connectedZone) {
        connectedZone.classList.remove('flex');
        connectedZone.classList.add('hidden');
      }
    }
    if (app.upload.restoreDropZone) app.upload.restoreDropZone();
    const previewImg = document.getElementById('preview-img');
    if (previewImg) previewImg.src = '';
    if (app.webrtc && app.webrtc.resetMobile) app.webrtc.resetMobile();
    app.rawFile = null;
    app.currentExif = {
      camera: 'N/A',
      params: 'N/A'
    };
    const upCamera = document.getElementById('up-camera');
    if (upCamera) upCamera.value = 'N/A';
    const upExif = document.getElementById('up-exif-params');
    if (upExif) upExif.value = 'N/A';
    const upDate = document.getElementById('up-date');
    if (upDate) upDate.value = '';
    if (app.upload.resetFilters) app.upload.resetFilters();
    document.querySelectorAll('.blur-panel').forEach(p => p.remove());
    if (app.upload.updateBlurBtn) app.upload.updateBlurBtn();
  },
  handleFileSelect: async e => {
    const file = e.target.files[0];
    if (!file) return;
    const dropZone = document.getElementById('drop-zone');
    const visualEl = dropZone ? dropZone.querySelector('.pointer-events-none') : null;
    const connectedZone = document.getElementById('webrtc-connected-zone');
    const isWebrtcActive = app.webrtc && app.webrtc.conn && connectedZone && !connectedZone.classList.contains('hidden');
    if (isWebrtcActive) {
      const cIcon = document.getElementById('webrtc-connected-icon');
      const cTitle = document.getElementById('webrtc-connected-title');
      const cSub = document.getElementById('webrtc-connected-sub');
      if (cIcon) cIcon.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin text-2xl text-blue-600"></i>';
      if (cTitle) cTitle.innerText = 'Đang xử lý ảnh...';
      if (cSub) cSub.innerText = 'Vui lòng đợi trong giây lát';
    } else if (dropZone && visualEl) {
      if (!visualEl.dataset.originalHtml) {
        visualEl.dataset.originalHtml = visualEl.innerHTML;
      }
      const qrWrapper = document.getElementById('qr-btn-wrapper');
      dropZone.style.pointerEvents = 'none';
      visualEl.innerHTML = '<div class="flex flex-col items-center gap-3 py-4"><i class="fa-solid fa-circle-notch fa-spin text-4xl text-gray-400"></i><p class="text-sm font-bold text-gray-600 mt-3">Đang xử lý ảnh, vui lòng đợi...</p></div>';
      if (qrWrapper) qrWrapper.classList.add('hidden');
    }
    app.upload.restoreDropZone = () => {
      const dz = document.getElementById('drop-zone');
      const vis = dz ? dz.querySelector('.pointer-events-none') : null;
      const qrWrap = document.getElementById('qr-btn-wrapper');
      if (dz && vis && vis.dataset.originalHtml) {
        vis.innerHTML = vis.dataset.originalHtml;
        dz.style.pointerEvents = 'auto';
        if (qrWrap) qrWrap.classList.remove('hidden');
      }
      const cIcon = document.getElementById('webrtc-connected-icon');
      const cTitle = document.getElementById('webrtc-connected-title');
      const cSub = document.getElementById('webrtc-connected-sub');
      if (cIcon) cIcon.innerHTML = '<i class="fa-solid fa-mobile-screen-button text-2xl animate-pulse"></i>';
      if (cTitle) cTitle.innerText = 'Thiết bị đã được kết nối!';
      if (cSub) cSub.innerText = 'Vui lòng chọn ảnh trên thiết bị còn lại';
    };
    if (file.size > 20 * 1024 * 1024) {
      app.ui.showAlert("File quá lớn (>20MB). Vui lòng chọn ảnh nhỏ hơn.");
      const fileInput = document.getElementById('up-file');
      if (fileInput) fileInput.value = '';
      if (app.upload.restoreDropZone) app.upload.restoreDropZone();
      if (app.webrtc && app.webrtc.resetMobile) app.webrtc.resetMobile();
      return;
    }
    const checkExif = new Promise((resolve, reject) => {
      EXIF.getData(file, function () {
        const model = EXIF.getTag(this, "Model");
        const fNumber = EXIF.getTag(this, "FNumber");
        const exposureTime = EXIF.getTag(this, "ExposureTime");
        const iso = EXIF.getTag(this, "ISOSpeedRatings");
        const dateTimeOriginal = EXIF.getTag(this, "DateTimeOriginal");
        const lat = EXIF.getTag(this, "GPSLatitude");
        const latRef = EXIF.getTag(this, "GPSLatitudeRef");
        const lon = EXIF.getTag(this, "GPSLongitude");
        const lonRef = EXIF.getTag(this, "GPSLongitudeRef");
        const helpLinkHTML = `<br><br><a href="javascript:void(0)" onclick="app.ui.closeAlert(true); setTimeout(() => app.utils.navigate('/help/1516371307481272330'), 300)" class="text-black font-bold hover:text-gray-700 hover:underline transition-colors inline-flex items-center gap-1.5"><i class="fa-solid fa-circle-info"></i> Tìm hiểu thêm & hướng dẫn khắc phục</a>`;
        if (!model) {
          reject("Ảnh không chứa thông tin EXIF thiết bị (Model máy ảnh). Vui lòng chọn ảnh gốc chưa qua chỉnh sửa." + helpLinkHTML);
          return;
        }
        if (!dateTimeOriginal) {
          reject("Ảnh không chứa thông tin ngày chụp (EXIF Date). Việc có ngày chụp gốc là bắt buộc. Vui lòng chọn file ảnh nguyên bản." + helpLinkHTML);
          return;
        }
        if (!fNumber || !exposureTime || !iso) {
          reject("Ảnh bị thiếu thông số kỹ thuật máy ảnh (Khẩu độ, Tốc độ, ISO). Hệ thống bắt buộc yêu cầu các thông số này để xác thực ảnh gốc." + helpLinkHTML);
          return;
        }
        let shutter = exposureTime;
        if (exposureTime && exposureTime < 1) shutter = `1/${Math.round(1 / exposureTime)}`;
        resolve({
          camera: model,
          params: `f/${fNumber} | ${shutter}s | ISO ${iso}`,
          date: dateTimeOriginal.split(' ')[0].replace(/:/g, '-'),
          gps: {
            lat,
            latRef,
            lon,
            lonRef
          }
        });
      });
    });
    try {
      const exifData = await checkExif;
      app.currentExif = {
        camera: exifData.camera,
        params: exifData.params
      };
      document.getElementById('up-camera').value = app.currentExif.camera;
      document.getElementById('up-exif-params').value = app.currentExif.params;
      document.getElementById('up-date').value = exifData.date;
      app.upload.checkDuplicateRealtime();
      if (exifData.gps.lat && exifData.gps.lon && exifData.gps.latRef && exifData.gps.lonRef) {
        const toDecimal = (gps, ref) => {
          let dec = gps[0] + gps[1] / 60 + gps[2] / 3600;
          if (ref === "S" || ref === "W") dec = dec * -1;
          return dec;
        };
        const latDec = toDecimal(exifData.gps.lat, exifData.gps.latRef);
        const lonDec = toDecimal(exifData.gps.lon, exifData.gps.lonRef);
        const address = await app.utils.reverseGeocode(latDec, lonDec);
        if (address && address !== "Vị trí không xác định") {
          document.getElementById('up-location').value = address;
          app.utils.geocodeAddress(address);
        }
      }
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const w = img.width;
        const h = img.height;
        if (h < 1080 && w < 1080) {
          app.ui.showAlert(`Độ phân giải ảnh quá thấp (${w}x${h}). Yêu cầu chiều cao tối thiểu 1080px.`);
          e.target.value = '';
          URL.revokeObjectURL(url);
          if (app.upload.restoreDropZone) app.upload.restoreDropZone();
          if (app.webrtc && app.webrtc.resetMobile) app.webrtc.resetMobile();
          return;
        }
        const ratio = w / h;
        const is4by3 = Math.abs(ratio - 4 / 3) < 0.05;
        const is3by2 = Math.abs(ratio - 3 / 2) < 0.05;
        const is16by9 = Math.abs(ratio - 16 / 9) < 0.05;
        if (!is4by3 && !is3by2 && !is16by9) {
          app.crop.open('main', file, true);
        } else {
          app.upload.setupPreview(file);
        }
        URL.revokeObjectURL(url);
      };
      img.onerror = () => {
        app.ui.showAlert("Định dạng ảnh không được hỗ trợ hoặc file bị hỏng.");
        e.target.value = '';
        URL.revokeObjectURL(url);
        if (app.upload.restoreDropZone) app.upload.restoreDropZone();
        if (app.webrtc && app.webrtc.resetMobile) app.webrtc.resetMobile();
      };
      img.src = url;
    } catch (errorMsg) {
      app.ui.showAlert(errorMsg);
      const fileInput = document.getElementById('up-file');
      if (fileInput) fileInput.value = '';
      if (app.upload.restoreDropZone) app.upload.restoreDropZone();
      if (app.webrtc && app.webrtc.resetMobile) app.webrtc.resetMobile();
      return;
    }
  },
  setupPreview: file => {
    app.rawFile = file;
    const url = URL.createObjectURL(file);
    const previewImg = document.getElementById('preview-img');
    previewImg.src = url;
    document.getElementById('preview-box').classList.remove('hidden');
    document.getElementById('drop-zone').classList.add('hidden');
    if (app.upload.restoreDropZone) app.upload.restoreDropZone();
    const name = app.username || "Guest";
    const wmName = document.getElementById('wm-username');
    wmName.innerText = name;
    document.getElementById('preview-footer-copy').innerText = `Bản quyền bởi ${name}`;
    const container = document.getElementById('preview-container');
    const footerBar = document.getElementById('preview-footer-bar');
    const wmDrag = document.getElementById('draggable-watermark');
    footerBar.style.height = '8%';
    wmDrag.classList.remove('hidden');
    wmDrag.style.top = '50%';
    wmDrag.style.left = '50%';
    wmDrag.style.transform = 'translate(-50%, -50%)';
    wmDrag.classList.remove('wm-active');
    document.getElementById('chk-wm-black').checked = false;
    app.upload.toggleColor(false);
    app.wmState = {
      x: 0.5,
      y: 0.5,
      color: 'white'
    };
    if (app.upload.resetFilters) app.upload.resetFilters();
  },
  initDraggable: () => {
    if (app.draggableInitialized) return;
    app.draggableInitialized = true;
    const el = document.getElementById('draggable-watermark');
    const container = document.getElementById('preview-container');
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;
    document.addEventListener('mousedown', e => {
      if (!el.contains(e.target)) el.classList.remove('wm-active');
    });
    document.addEventListener('touchstart', e => {
      if (!el.contains(e.target)) el.classList.remove('wm-active');
    });
    el.addEventListener('mousedown', e => {
      e.stopPropagation();
      el.classList.add('wm-active');
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      initialLeft = el.offsetLeft;
      initialTop = el.offsetTop;
      el.style.transform = 'none';
    });
    el.addEventListener('touchstart', e => {
      e.stopPropagation();
      el.classList.add('wm-active');
      isDragging = true;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      initialLeft = el.offsetLeft;
      initialTop = el.offsetTop;
      el.style.transform = 'none';
    });
    const onMove = (clientX, clientY) => {
      if (!isDragging) return;
      const dx = clientX - startX;
      const dy = clientY - startY;
      let newLeft = initialLeft + dx;
      let newTop = initialTop + dy;
      const maxLeft = Math.max(0, container.offsetWidth - el.offsetWidth);
      const maxTop = Math.max(0, container.offsetHeight - el.offsetHeight - container.offsetHeight * 0.08);
      newLeft = Math.max(0, Math.min(newLeft, maxLeft));
      newTop = Math.max(0, Math.min(newTop, maxTop));
      el.style.left = newLeft + 'px';
      el.style.top = newTop + 'px';
      const centerX = newLeft + el.offsetWidth / 2;
      const centerY = newTop + el.offsetHeight / 2;
      app.wmState.x = centerX / container.offsetWidth;
      app.wmState.y = centerY / container.offsetHeight;
    };
    document.addEventListener('mousemove', e => {
      if (isDragging) {
        e.preventDefault();
        onMove(e.clientX, e.clientY);
      }
    });
    document.addEventListener('touchmove', e => {
      if (isDragging) {
        e.preventDefault();
        onMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, {
      passive: false
    });
    const onEnd = () => {
      isDragging = false;
      if (app.upload.schedulePrepareBlob) app.upload.schedulePrepareBlob();
    };
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchend', onEnd);
  },
  // [MỚI] TÁCH LOGIC SUBMIT SANG HÀNG ĐỢI
  submit: async e => {
    e.preventDefault();
    if (!app.user) return app.auth.check();
    if (!app.rawFile) return app.ui.showAlert("Vui lòng chọn ảnh!");
    const q = app.upload.currentQuota;
    if (q.limit !== null && q.count >= q.limit) {
      return app.ui.showAlert(`Hệ thống đã đạt giới hạn nhận ${q.limit} ảnh của ngày hôm nay. Vui lòng quay lại sau 7:00 sáng mai!`);
    }
    const valPlate = document.getElementById('up-plate').value.trim();
    const valOp = document.getElementById('up-operator').value.trim();
    const valType = document.getElementById('up-type').value;
    const valRoute = document.getElementById('up-route').value.trim();
    const valModel = document.getElementById('up-model').value.trim();
    const valLoc = document.getElementById('up-location').value.trim();
    const valDate = document.getElementById('up-date').value;
    let missingFields = [];
    if (!valType) missingFields.push("Loại xe (Xe Buýt/Khách)");
    if (!valPlate) missingFields.push("Biển kiểm soát");
    if (!valDate) missingFields.push("Ngày chụp");
    if (!valRoute) missingFields.push("Mã số tuyến / Lộ trình");
    if (!valOp) missingFields.push("Đơn vị vận hành");
    if (!valModel) missingFields.push("Dòng xe (Model)");
    if (!valLoc) missingFields.push("Vị trí chụp");
    if (missingFields.length > 0) {
      app.upload.triggerEmptyWarnings();
      let msg = `Vui lòng điền đủ các trường bắt buộc: <b>${missingFields.join(', ')}</b>.`;
      return app.ui.showAlert(msg, null, null, {
        title: "Thiếu thông tin"
      });
    }
    let captchaResponse;
    try {
      captchaResponse = await app.captcha.request();
    } catch (err) {
      if (err.message === "CAPTCHA_CANCELLED") return;
      return app.ui.showAlert("Lỗi xác thực Captcha.");
    }
    const btn = document.getElementById('btn-submit');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Đang nén ảnh...`;

    // Giao tiếp qua Toast
    if (!app.upload.activeProgressToast) {
      app.upload.activeProgressToast = app.toast.createProgress('Đang chuẩn bị ảnh...');
    }
    app.upload.activeProgressToast.update(20, 'Đang chuẩn bị ảnh...', 'Áp dụng Watermark & Nén (Không chuyển trang)...');
    try {
      let originalSizeKB = (app.rawFile.size / 1024).toFixed(2);
      const username = app.username || "Guest";
      let compressedFile = app.upload.readyBlob;
      const targetMime = app.utils.getTargetMimeType();
      if (!compressedFile) {
        const finalBlob = await app.utils.watermark(app.rawFile, username, app.wmState, app.upload.currentFilters || 'none');
        const compressOptions = {
          maxSizeMB: 0.8,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          fileType: targetMime,
          initialQuality: 0.85
        };
        try {
          compressedFile = await imageCompression(finalBlob, compressOptions);
        } catch (compressErr) {
          throw new Error("Lỗi nén ảnh (Image Compression): " + compressErr.message);
        }
      }
      let compressedSizeKB = (compressedFile.size / 1024).toFixed(2);
      if (compressedFile.type !== targetMime) {
        throw new Error(`Trình duyệt của bạn không hỗ trợ định dạng ${targetMime}.`);
      }
      if (compressedFile.size > 1.5 * 1024 * 1024) {
        throw new Error("Ảnh quá phức tạp, không thể nén xuống mức an toàn (< 1.5MB). Vui lòng chọn ảnh khác hoặc crop nhỏ lại!");
      }

      // Gom dữ liệu để đẩy vào Hàng đợi (Queue)
      const uploadData = new FormData();
      uploadData.append('file', compressedFile);
      uploadData.append('userId', app.user.id);
      uploadData.append('captchaToken', captchaResponse);
      uploadData.append('fileExtension', app.utils.getTargetExtension());
      uploadData.append('meta_plate', valPlate.replace(/[^A-Z0-9-]/gi, '').toUpperCase());
      uploadData.append('meta_operator', app.utils.fixUnicode(valOp));
      uploadData.append('meta_type', valType);
      uploadData.append('meta_route', app.utils.fixUnicode(valRoute));
      uploadData.append('meta_model', app.utils.fixUnicode(valModel));
      uploadData.append('meta_location', app.utils.fixUnicode(valLoc));
      uploadData.append('meta_note', app.utils.fixUnicode(document.getElementById('up-note').value));
      uploadData.append('meta_taken_at', valDate);
      uploadData.append('meta_username', username);
      uploadData.append('meta_camera_model', app.currentExif.camera);
      uploadData.append('meta_exif_params', app.currentExif.params);
      app.upload.uploadQueue.push({
        formData: uploadData,
        plate: valPlate.replace(/[^A-Z0-9-]/gi, '').toUpperCase(),
        originalSizeKB: originalSizeKB,
        compressedSizeKB: compressedSizeKB,
        fileName: app.rawFile ? app.rawFile.name : 'N/A',
        fileType: app.rawFile ? app.rawFile.type : 'N/A'
      });

      // Ảo hóa Quota để chặn upload nếu đang trong hàng chờ
      if (app.upload.currentQuota.limit !== null) app.upload.currentQuota.count++;

      // Xóa sạch form ngay lập tức cho người dùng thao tác tiếp
      app.utils.cleanupState();
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      app.upload.processQueue();
    } catch (err) {
      if (app.upload.activeProgressToast) {
        app.upload.activeProgressToast.remove();
        app.upload.activeProgressToast = null;
      }
      app.ui.showUploadProgress();
      app.ui.updateUploadError(err.message);
    } finally {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  },
  triggerEmptyWarnings: () => {
    const fields = [{
      id: 'up-plate',
      errId: 'plate-msg',
      name: 'Biển kiểm soát'
    }, {
      id: 'up-route',
      errId: 'err-up-route',
      name: 'Mã số tuyến'
    }, {
      id: 'up-operator',
      errId: 'err-up-operator',
      name: 'Đơn vị vận hành'
    }, {
      id: 'up-model',
      errId: 'err-up-model',
      name: 'Dòng xe'
    }, {
      id: 'up-location',
      errId: 'err-up-location',
      name: 'Vị trí chụp'
    }];
    fields.forEach(f => {
      const el = document.getElementById(f.id);
      const errEl = document.getElementById(f.errId);
      if (el && errEl && !el.readOnly) {
        if (!el.value.trim()) {
          if (f.id === 'up-plate') {
            if (!errEl.innerText.includes("Định dạng")) {
              errEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Vui lòng nhập ${f.name}`;
              errEl.className = "text-xs mt-1 text-red-600 font-bold";
            }
          } else {
            errEl.classList.remove('hidden');
          }
          el.classList.remove('border-gray-300', 'focus:ring-black');
          el.classList.add('border-red-500', 'focus:ring-red-500');
        } else {
          if (f.id !== 'up-plate') errEl.classList.add('hidden');else if (errEl.innerText.includes("Vui lòng nhập")) errEl.innerText = "";
          el.classList.remove('border-red-500', 'focus:ring-red-500');
          el.classList.add('border-gray-300', 'focus:ring-black');
        }
      }
    });
    const typeMsg = document.getElementById('type-msg');
    if (typeMsg) {
      if (!document.getElementById('up-type').value) {
        typeMsg.classList.remove('hidden');
      } else {
        typeMsg.classList.add('hidden');
      }
    }
  },
  initValidation: () => {
    const fields = [{
      id: 'up-plate',
      errId: 'plate-msg',
      name: 'Biển kiểm soát'
    }, {
      id: 'up-route',
      errId: 'err-up-route',
      name: 'Mã số tuyến'
    }, {
      id: 'up-operator',
      errId: 'err-up-operator',
      name: 'Đơn vị vận hành'
    }, {
      id: 'up-model',
      errId: 'err-up-model',
      name: 'Dòng xe'
    }, {
      id: 'up-location',
      errId: 'err-up-location',
      name: 'Vị trí chụp'
    }];
    fields.forEach(f => {
      const el = document.getElementById(f.id);
      const errEl = document.getElementById(f.errId);
      if (el && errEl) {
        const clearError = () => {
          if (f.id !== 'up-plate') {
            errEl.classList.add('hidden');
          } else if (errEl.innerText.includes("Vui lòng nhập")) {
            errEl.innerText = "";
          }
          el.classList.remove('border-red-500', 'focus:ring-red-500');
          el.classList.add('border-gray-300', 'focus:ring-black');
        };
        el.addEventListener('blur', () => {
          if (!el.value.trim() && !el.readOnly) {
            if (f.id === 'up-plate') {
              if (!errEl.innerText.includes("Định dạng")) {
                errEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Vui lòng nhập ${f.name}`;
                errEl.className = "text-xs mt-1 text-red-600 font-bold";
              }
            } else {
              errEl.classList.remove('hidden');
            }
            el.classList.remove('border-gray-300', 'focus:ring-black');
            el.classList.add('border-red-500', 'focus:ring-red-500');
          } else {
            clearError();
          }
        });
        el.addEventListener('input', clearError);
        el.addEventListener('change', clearError);
      }
    });
  },
  checkQuota: async () => {
    if (!app.user) return;
    const pill = document.getElementById('upload-quota-pill');
    const textEl = document.getElementById('upload-quota-text');
    const fileInput = document.getElementById('up-file');
    const btnSubmit = document.getElementById('btn-submit');
    if (!pill) return;
    pill.classList.remove('hidden');
    textEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-gray-400"></i>';
    try {
      const limitSetting = app.maintenance.settings['upload_quota']?.reason;
      const hasLimit = limitSetting && limitSetting.trim() !== '';
      const limitNum = hasLimit ? parseInt(limitSetting) : null;
      const last7AM = app.utils.getLast7AM_UTC7();
      const {
        count
      } = await app.admin.api("q56", {
        last7AM
      });
      app.upload.currentQuota = {
        limit: limitNum,
        count: count || 0
      };
      textEl.classList.remove('text-black', 'text-amber-500', 'text-red-600');

      // Cộng dồn ảo hóa trong UI Queue
      const totalQueueAssumed = app.upload.uploadQueue.length;
      const realCount = (count || 0) + totalQueueAssumed;
      if (!hasLimit) {
        textEl.innerText = `${realCount} lượt (Không giới hạn)`;
        textEl.classList.add('text-black');
        fileInput.disabled = false;
        fileInput.classList.remove('opacity-50', 'cursor-not-allowed');
      } else {
        textEl.innerText = `${realCount}/${limitNum} lượt hôm nay`;
        const remaining = limitNum - realCount;
        if (limitNum === 0 || remaining <= 0) {
          textEl.classList.add('text-red-600');
          fileInput.disabled = true;
          btnSubmit.disabled = true;
          fileInput.classList.add('opacity-50', 'cursor-not-allowed');
          textEl.innerText = limitNum === 0 ? `Hệ thống tạm đóng upload` : `Hết slot hôm nay (${realCount}/${limitNum})`;
        } else if (remaining <= 3) {
          textEl.classList.add('text-amber-500');
          fileInput.disabled = false;
          fileInput.classList.remove('opacity-50', 'cursor-not-allowed');
        } else {
          textEl.classList.add('text-black');
          fileInput.disabled = false;
          fileInput.classList.remove('opacity-50', 'cursor-not-allowed');
        }
      }
    } catch (e) {
      textEl.innerText = "Lỗi kiểm tra giới hạn";
      textEl.classList.add('text-red-500');
    }
  },
  // [MỚI] HÀM TIẾN TRÌNH XỬ LÝ HÀNG ĐỢI
  processQueue: async () => {
    if (app.upload.isQueueProcessing || app.upload.uploadQueue.length === 0) return;
    app.upload.isQueueProcessing = true;
    while (app.upload.uploadQueue.length > 0) {
      const item = app.upload.uploadQueue[0];
      const remaining = app.upload.uploadQueue.length;
      if (!app.upload.activeProgressToast) {
        app.upload.activeProgressToast = app.toast.createProgress('Đang tải lên...');
      }
      const titleText = remaining > 1 ? `Đang xử lý tiếp (${remaining} ảnh xếp hàng)...` : `Đang tải lên máy chủ...`;
      app.upload.activeProgressToast.update(50, titleText, `BKS: ${item.plate}`);
      let token;
      try {
        const {
          data: {
            session
          }
        } = await window.sb.auth.getSession();
        token = session?.access_token;
      } catch (e) {}
      let result = null;
      let uploadAttempts = 0;
      const maxUploadAttempts = 3;
      let lastUploadErr = null;
      while (uploadAttempts < maxUploadAttempts) {
        uploadAttempts++;
        try {
          const response = await fetch('/api/upload', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: item.formData
          });
          result = await response.json();
          if (response.status === 401 || result && result.error && result.error.message && result.error.message.includes('JWT')) {
            app.upload.activeProgressToast.update(60, 'Phiên hết hạn, đang kết nối lại...', `Thử lại lần ${uploadAttempts}`);
            const {
              data: {
                session: newSession
              }
            } = await window.sb.auth.refreshSession();
            if (newSession && newSession.access_token) {
              token = newSession.access_token;
              uploadAttempts--;
              continue;
            } else {
              throw new Error('Phiên đã hết hạn. Vui lòng tải lại trang và đăng nhập lại.');
            }
          }
          if (!result.success) {
            let errorDetail = result.error;
            if (typeof errorDetail === 'object' && errorDetail !== null) {
              errorDetail = errorDetail.message || JSON.stringify(errorDetail);
            }
            throw new Error(errorDetail || 'Máy chủ từ chối yêu cầu Upload.');
          }
          break;
        } catch (err) {
          lastUploadErr = err;
          if (uploadAttempts < maxUploadAttempts) {
            app.upload.activeProgressToast.update(50, `Lỗi mạng. Đang thử lại ${uploadAttempts}/${maxUploadAttempts}...`, `BKS: ${item.plate}`);
            await new Promise(r => setTimeout(r, 2500));
          }
        }
      }
      if (!result || !result.success) {
        // FALLBACK XOÁ ẢNH KHI LỖI DB
        if (result && result.url) {
          try {
            await fetch('/api/delete-image', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                imageUrl: result.url
              })
            });
          } catch (delErr) {}
        }
        if (app.upload.activeProgressToast) {
          app.upload.activeProgressToast.remove();
          app.upload.activeProgressToast = null;
        }

        // Xóa ảnh lỗi khỏi queue
        app.upload.uploadQueue.shift();
        app.upload.isQueueProcessing = false;
        let displayError = lastUploadErr ? lastUploadErr.message : "Upload thất bại";
        if (displayError === '[object Object]') displayError = JSON.stringify(lastUploadErr);
        const localErrors = ["Trình duyệt của bạn không hỗ trợ", "Ảnh quá phức tạp", "Lỗi nén ảnh"];
        const shouldReport = !localErrors.some(eStr => displayError.includes(eStr));
        let actuallyReported = false;
        if (shouldReport) {
          try {
            const reportRes = await fetch('/api/notify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                action: 'bug',
                errorMessage: displayError,
                fileInfo: {
                  name: item.fileName,
                  type: item.fileType,
                  originalSize: item.originalSizeKB,
                  compressedSize: item.compressedSizeKB
                },
                consoleLogs: window._consoleErrors || [],
                user: app.user ? {
                  username: app.username,
                  id: app.user.id
                } : null,
                userAgent: navigator.userAgent
              })
            });
            if (reportRes.ok) {
              const rData = await reportRes.json();
              if (rData && rData.success) actuallyReported = true;
            }
          } catch (e) {}
        }
        const uiErrorMsg = actuallyReported ? displayError : `[NO_REPORT] ${displayError}`;
        app.ui.showUploadProgress();
        app.ui.updateUploadError(uiErrorMsg);
        break; // NGẮT TIẾN TRÌNH KHÔNG CHẠY CÁC ẢNH SAU CHO TỚI KHI USER THAO TÁC LẠI
      }

      // --- THÀNH CÔNG ---
      app.upload.activeProgressToast.update(100, `Hoàn thành ${item.plate}!`, 'Đang đồng bộ dữ liệu...');
      app.upload.uploadQueue.shift();
      let queueCount = '?';
      let newPhotoId = null;
      try {
        const {
          data: pendingData
        } = await app.admin.api("q57", {});
        if (pendingData) {
          let ahead = 0;
          const isMePrivileged = app.role === 'admin' || app.role === 'manager';
          const myPhotos = pendingData.filter(p => p.uploader_id === app.user.id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          if (myPhotos.length > 0) {
            const myPhoto = myPhotos[0];
            newPhotoId = myPhoto.id;
            const myTime = new Date(myPhoto.created_at).getTime();
            pendingData.forEach(p => {
              if (p.id === myPhoto.id) return;
              const pRole = p.profiles?.role || 'user';
              const pPrivileged = pRole === 'admin' || pRole === 'manager';
              const pTime = new Date(p.created_at).getTime();
              if (isMePrivileged) {
                if (pPrivileged && pTime < myTime) ahead++;
              } else {
                if (pPrivileged) ahead++;else if (pTime < myTime) ahead++;
              }
            });
            queueCount = ahead;
          } else {
            queueCount = Math.max(0, pendingData.length - 1);
          }
        }
      } catch (e) {}
      app.toast.show('success', `Đã tải lên xe ${item.plate}!`, `Chờ duyệt trước bạn: <b>${queueCount} ảnh</b>. Nhấn để xem chi tiết.`, 7000, newPhotoId ? () => {
        app.utils.navigate(`/photo/${newPhotoId}`);
      } : null);
    }
    if (app.upload.uploadQueue.length === 0) {
      if (app.upload.activeProgressToast) {
        app.upload.activeProgressToast.remove();
        app.upload.activeProgressToast = null;
      }
      app.upload.isQueueProcessing = false;
      app.upload.checkQuota(); // Check quota thực tế lại khi vừa up xong
    }
  }
}, window.app.maintenance = {
  settings: {},
  timer: null,
  isBypassed: false,
  fetch: async () => {
    try {
      const {
        data,
        error
      } = await app.admin.api("q58", {});
      if (data) {
        data.forEach(item => {
          app.maintenance.settings[item.id] = item;
        });
      }
    } catch (e) {
      console.error("Lỗi lấy thông tin bảo trì", e);
    }
  },
  check: sysId => {
    if (app.maintenance.isBypassed) return false; // Manager bypass

    // Kiểm tra cầu chì tổng trước, sau đó mới đến module cụ thể
    const target = app.maintenance.settings['global']?.is_active === false ? app.maintenance.settings['global'] : app.maintenance.settings[sysId];
    if (!target) return false;

    // Nếu is_active = false, kiểm tra xem đã qua giờ tự mở chưa
    if (target.is_active === false) {
      if (target.auto_reactivate_at) {
        const autoTime = new Date(target.auto_reactivate_at).getTime();
        if (Date.now() >= autoTime) {
          return false; // Đã quá giờ -> Cho phép qua
        }
      }
      return target; // Trả về thông tin bảo trì để show màn hình
    }
    return false;
  },
  showScreen: targetData => {
    const screen = document.getElementById('maintenance-screen');

    // Ẩn triệt để giao diện nền phía sau để không bị hở khi cuộn trên Mobile
    document.querySelectorAll('header, main, footer, #header-spacer').forEach(el => el.style.display = 'none');
    document.body.style.backgroundColor = '#ffffff';

    // Cập nhật text lý do
    document.getElementById('mt-reason').innerText = targetData.reason || "Hệ thống đang được bảo trì, vui lòng quay lại sau.";

    // Hiện nút cho Manager
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
          window.location.reload();
          return;
        }
        const d = Math.floor(distance / (1000 * 60 * 60 * 24));
        const h = Math.floor(distance % (1000 * 60 * 60 * 24) / (1000 * 60 * 60));
        const m = Math.floor(distance % (1000 * 60 * 60) / (1000 * 60));
        const s = Math.floor(distance % (1000 * 60) / 1000);
        let timeStr = "";
        if (d > 0) timeStr += `${d}d `;
        timeStr += `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        countdownEl.innerText = timeStr;
      }, 1000);
    } else {
      countdownEl.innerText = "Cập nhật sau";
      countdownEl.className = "text-xl font-bold tracking-normal text-gray-400"; // Đổi style nếu không có giờ
    }
    screen.classList.remove('hidden');
    app.ui.lockScroll(); // Khóa cuộn trang
  },
  hideScreen: () => {
    document.getElementById('maintenance-screen').classList.add('hidden');

    // Trả lại giao diện nền khi tắt bảo trì
    document.querySelectorAll('header, main, footer, #header-spacer').forEach(el => el.style.display = '');
    document.body.style.backgroundColor = '';
    if (app.maintenance.timer) clearInterval(app.maintenance.timer);
  },
  bypass: () => {
    app.maintenance.isBypassed = true;
    app.maintenance.hideScreen();
    app.handleRoute(); // Khởi động lại route
  }
}, window.app.onboarding = {
  currentStep: 1,
  isOpen: false,
  check: () => {
    const isHome = window.location.pathname === '/' || window.location.pathname === '';
    const onboarded = localStorage.getItem('vnbus_onboarded');
    if (!onboarded && isHome) {
      setTimeout(() => {
        app.onboarding.open();
      }, 800);
    }
  },
  open: () => {
    if (app.onboarding.isOpen) return;
    app.onboarding.isOpen = true;
    app.onboarding.currentStep = 1;
    app.preference.tempSelection = app.preference.current || 'both';
    app.onboarding.updatePrefUI();
    if (app.user) {
      document.getElementById('onb-auth-guest').classList.add('hidden');
      document.getElementById('onb-auth-logged').classList.remove('hidden');
      document.getElementById('onb-user-name').innerText = app.username || 'Bạn';
      const avatarEl = document.getElementById('onb-user-avatar');
      try {
        app.admin.api("q59", {
          app,
          data,
          avatarEl
        });
      } catch (e) {}
    } else {
      document.getElementById('onb-auth-guest').classList.remove('hidden');
      document.getElementById('onb-auth-logged').classList.add('hidden');
    }
    app.onboarding.renderStep(1, false);
    const modal = document.getElementById('onboarding-modal');
    const content = document.getElementById('onboarding-content');
    modal.classList.remove('hidden');
    app.ui.lockScroll();
    setTimeout(() => {
      content.classList.remove('opacity-0', 'scale-95');
      content.classList.add('opacity-100', 'scale-100');
    }, 10);
  },
  next: () => {
    if (app.onboarding.currentStep < 4) {
      app.onboarding.currentStep++;
      app.onboarding.renderStep(app.onboarding.currentStep, false);
    } else {
      app.onboarding.complete(true);
    }
  },
  prev: () => {
    if (app.onboarding.currentStep > 1) {
      app.onboarding.currentStep--;
      app.onboarding.renderStep(app.onboarding.currentStep, true);
    }
  },
  renderStep: (step, isBackwards) => {
    const segments = document.querySelectorAll('.onb-segment');
    segments.forEach((seg, idx) => {
      if (idx < step) seg.classList.add('active');else seg.classList.remove('active');
    });
    document.querySelectorAll('.onb-slide').forEach(slide => {
      slide.classList.remove('active', 'slide-left');
    });
    const activeSlide = document.getElementById('onb-step-' + step);
    if (isBackwards) activeSlide.classList.add('slide-left', 'active');else activeSlide.classList.add('active');
    const btnPrev = document.getElementById('onb-btn-prev');
    const btnNext = document.getElementById('onb-btn-next');
    if (step === 1) {
      btnPrev.style.visibility = 'hidden';
      btnNext.innerHTML = 'Tiếp tục <i class="fa-solid fa-arrow-right"></i>';
      btnNext.style.visibility = 'visible';
    } else if (step === 4) {
      btnPrev.style.visibility = 'visible';
      btnNext.innerHTML = 'Hoàn thành <i class="fa-solid fa-check"></i>';
      btnNext.style.visibility = 'visible';
    } else if (step === 3 && !app.user) {
      btnPrev.style.visibility = 'visible';
      btnNext.style.visibility = 'hidden';
    } else {
      btnPrev.style.visibility = 'visible';
      btnNext.innerHTML = 'Tiếp tục <i class="fa-solid fa-arrow-right"></i>';
      btnNext.style.visibility = 'visible';
    }
  },
  updatePrefUI: () => {
    ['bus', 'coach', 'both'].forEach(type => {
      const btn = document.getElementById(`onb-pref-${type}`);
      if (!btn) return;
      if (app.preference.tempSelection === type) {
        btn.className = "pref-option cursor-pointer border border-black bg-black text-white rounded-xl p-3.5 shadow-md transition-all flex items-center gap-4 scale-[1.02]";
        btn.querySelector('.rounded-full').className = "w-10 h-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center shrink-0 transition-colors";
        btn.querySelector('p').className = "text-[11px] font-medium text-gray-300 mt-0.5";
      } else {
        btn.className = "pref-option cursor-pointer border border-gray-300 bg-white/70 backdrop-blur-md rounded-xl p-3.5 shadow-sm hover:shadow-md hover:border-black transition-all flex items-center gap-4 scale-100";
        btn.querySelector('.rounded-full').className = "w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0 transition-colors";
        btn.querySelector('p').className = "text-[11px] font-medium text-gray-500 mt-0.5";
      }
    });
  },
  complete: (savePreferences = true, redirectUrl = null) => {
    localStorage.setItem('vnbus_onboarded', 'true');
    localStorage.setItem('vnbus_news_last_seen', new Date().toDateString());
    if (savePreferences) {
      app.preference.current = app.preference.tempSelection || 'both';
      localStorage.setItem('vnbus_preference', app.preference.current);
      if (app.user) {
        app.admin.api("q60", {
          app
        });
      }
    }
    const modal = document.getElementById('onboarding-modal');
    const content = document.getElementById('onboarding-content');
    content.classList.remove('opacity-100', 'scale-100');
    content.classList.add('opacity-0', 'scale-95');
    setTimeout(() => {
      modal.classList.add('hidden');
      app.ui.unlockScroll();
      app.onboarding.isOpen = false;
      if (redirectUrl) {
        app.utils.navigate(redirectUrl);
      } else {
        app.views.loadHome(true);
      }
    }, 200);
  }
}, window.app.help = {
  data: [],
  loadList: async () => {
    app.views.switch('help-list', false);
    document.title = 'Trung tâm hỗ trợ | VNBUSARCHIVE';
    const container = document.getElementById('help-grid');
    if (app.help.data.length === 0) {
      container.innerHTML = '<div class="col-span-full text-center py-20 text-gray-500"><i class="fa-solid fa-circle-notch fa-spin text-2xl mb-2 text-black"></i><p>Đang tải dữ liệu...</p></div>';
      try {
        const res = await fetch('/api/discord?type=help');
        if (!res.ok) throw new Error("Lỗi fetch API");
        const data = await res.json();
        app.help.data = data;
      } catch (e) {
        container.innerHTML = `<div class="col-span-full text-center py-10 text-red-500 font-bold"><i class="fa-solid fa-triangle-exclamation mr-1"></i> Không thể tải dữ liệu: ${e.message}</div>`;
        app.loadingBar.finish();
        return;
      }
    }
    if (app.help.data.length === 0) {
      container.innerHTML = '<div class="col-span-full text-center py-10 text-gray-500 font-medium">Chưa có bài viết hướng dẫn nào.</div>';
    } else {
      container.innerHTML = app.help.data.map(item => `
                            <div onclick="app.utils.navigate('/help/${item.id}')" class="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-black transition-all cursor-pointer flex flex-col h-full group">
                                <h3 class="font-bold text-base text-black mb-2 line-clamp-2 transition-colors">${item.title}</h3>
                                <p class="text-xs text-gray-600 line-clamp-3 mb-5 flex-1 leading-relaxed">${app.utils.stripMarkdown(item.summary)}</p>
                                <div class="flex items-center gap-2 mt-auto pt-2">
                                    <div class="w-7 h-7 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-[10px] shrink-0 group-hover:bg-black group-hover:text-white transition-colors">
                                        <i class="fa-solid fa-file-lines"></i>
                                    </div>
                                    <span class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">${item.date}</span>
                                </div>
                            </div>
                        `).join('');
    }
    app.loadingBar.finish();
  },
  // Hàm cuộn mượt mà có bù trừ chiều cao Header
  scrollToHeading: id => {
    const el = document.getElementById(id);
    if (el) {
      const headerOffset = 110; // Khoảng cách chừa ra ở trên đỉnh
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  },
  loadDetail: async id => {
    app.views.switch('help-detail', false);
    const container = document.getElementById('help-detail-container');
    const loading = document.getElementById('help-detail-loading');
    const tocBox = document.getElementById('help-toc-box');
    const tocList = document.getElementById('help-toc-list');
    container.classList.add('hidden');
    tocBox.classList.add('hidden');
    loading.classList.remove('hidden');
    document.getElementById('help-breadcrumb-title').innerText = "Đang tải...";
    try {
      let item = app.help.data.find(h => h.id === id);
      if (!item) {
        const res = await fetch(`/api/discord?type=help&id=${id}`);
        if (!res.ok) throw new Error("Bài viết không tồn tại hoặc có lỗi xảy ra");
        item = await res.json();
      }
      document.title = `${item.title} | VNBUSARCHIVE`;
      document.getElementById('help-breadcrumb-title').innerText = item.title;
      document.getElementById('help-detail-title').innerText = item.title;
      document.getElementById('help-detail-author').innerText = item.authorName;
      document.getElementById('help-detail-date').innerText = item.date;
      const avatarEl = document.getElementById('help-detail-avatar');
      avatarEl.src = item.authorAvatar;
      const contentHtml = marked.parse(item.content || '');
      const articleBody = document.getElementById('help-detail-body');
      articleBody.innerHTML = DOMPurify.sanitize(contentHtml);

      // XÓA TIÊU ĐỀ TRÙNG LẶP DƯ THỪA TỪ MARKDOWN
      const firstH1 = articleBody.querySelector('h1');
      if (firstH1) firstH1.remove();

      // --- LOGIC TẠO MỤC LỤC TỰ ĐỘNG ---
      // Bỏ qua H1 (tiêu đề chính), chỉ quét H2, H3, H4
      const headings = articleBody.querySelectorAll('h2, h3, h4');
      tocList.innerHTML = '';
      tocBox.classList.remove('hidden'); // Luôn hiện Box

      if (headings.length === 0) {
        tocList.innerHTML = '<li class="text-gray-400 italic text-[13px] font-medium">Không có phân mục nội dung cụ thể.</li>';
      } else {
        headings.forEach((heading, index) => {
          // Gán ID độc nhất cho mỗi thẻ H2, H3 để cuộn tới
          const targetId = `help-heading-${index}`;
          heading.id = targetId;
          const li = document.createElement('li');

          // Thụt lề theo cấp bậc (H3 lùi 1 tí, H4 lùi nhiều tí)
          const level = parseInt(heading.tagName.substring(1));
          if (level === 3) li.classList.add('pl-4', 'text-[13px]', 'text-gray-600');else if (level === 4) li.classList.add('pl-8', 'text-[12px]', 'text-gray-500');

          // Link bấm gọi hàm scrollToHeading
          li.innerHTML = `<a href="javascript:void(0)" onclick="app.help.scrollToHeading('${targetId}')" class="hover:text-black hover:underline transition-all flex items-start gap-2 leading-snug">
                                    <span class="text-black opacity-40 mt-[3px] shrink-0"><i class="fa-solid fa-angle-right text-[10px]"></i></span> 
                                    <span>${heading.innerText}</span>
                                </a>`;
          tocList.appendChild(li);
        });
      }
      // ---------------------------------

      loading.classList.add('hidden');
      container.classList.remove('hidden');
    } catch (e) {
      loading.innerHTML = `<div class="text-red-500 font-bold"><i class="fa-solid fa-triangle-exclamation text-3xl mb-3"></i><p>${e.message}</p></div>`;
    }
    app.loadingBar.finish();
  }
}, window.app.preference = {
  current: 'both',
  tempSelection: 'both',
  showRecommendations: true,
  tempShowRec: true,
  load: () => {
    const savedRec = localStorage.getItem('vnbus_show_rec');
    if (savedRec !== null) app.preference.showRecommendations = savedRec === 'true';
    const saved = localStorage.getItem('vnbus_preference');
    if (saved) {
      app.preference.current = saved;
      return saved;
    }
    return null;
  },
  open: (isOnboarding = false) => {
    app.preference.tempSelection = app.preference.current || 'both';
    app.preference.tempShowRec = app.preference.showRecommendations;
    app.settings.open();
    app.settings.switchTab('preference');
    app.preference.updateUI();
  },
  select: val => {
    app.preference.tempSelection = val;
    app.preference.updateUI();
    if (app.onboarding && app.onboarding.isOpen) {
      app.onboarding.updatePrefUI();
    }
  },
  toggleRec: val => {
    app.preference.tempShowRec = val;
  },
  updateUI: () => {
    const toggleRec = document.getElementById('set-pref-toggle-rec');
    if (toggleRec) {
      toggleRec.checked = app.preference.tempShowRec;
    }
    ['bus', 'coach', 'both'].forEach(type => {
      ['pref-btn-', 'set-pref-btn-'].forEach(prefix => {
        const btn = document.getElementById(`${prefix}${type}`);
        if (!btn) return;
        const iconBg = btn.querySelector('.pref-icon');
        const p = btn.querySelector('.pref-desc');
        if (app.preference.tempSelection === type) {
          btn.className = `pref-option cursor-pointer border border-black bg-black text-white rounded-xl p-4 shadow-md transition-all duration-200 flex items-start gap-3 scale-[1.02]`;
          iconBg.classList.replace('bg-gray-100', 'bg-white/20');
          iconBg.classList.replace('border-transparent', 'border-white/30');
          if (p) p.classList.replace('text-gray-500', 'text-gray-300');
        } else {
          btn.className = `pref-option cursor-pointer border border-gray-300 bg-white text-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-gray-400 transition-all duration-200 flex items-start gap-3 scale-100`;
          iconBg.classList.replace('bg-white/20', 'bg-gray-100');
          iconBg.classList.replace('border-white/30', 'border-transparent');
          if (p) p.classList.replace('text-gray-300', 'text-gray-500');
        }
      });
    });
  },
  save: () => {
    const isChanged = app.preference.current !== app.preference.tempSelection;
    const isRecChanged = app.preference.showRecommendations !== app.preference.tempShowRec;
    app.preference.current = app.preference.tempSelection;
    app.preference.showRecommendations = app.preference.tempShowRec;
    localStorage.setItem('vnbus_preference', app.preference.current);
    localStorage.setItem('vnbus_show_rec', app.preference.showRecommendations);
    if (app.user) {
      app.admin.api("q61", {
        app
      });
    }
    app.ui.showAlert("Đã lưu thiết lập Cá nhân hóa thành công!");
    if (isChanged || isRecChanged) {
      const path = window.location.pathname;
      if (path === '/') {
        app.views.loadHome(true);
      } else if (path.startsWith('/profile') || path.startsWith('/user/')) {
        app.views.loadAccount(null, true);
      } else if (path.startsWith('/vehicle/')) {
        app.views.loadVehiclePage(app.currentPlate);
      } else if (path.startsWith('/photo/')) {
        app.views.loadDetail(app.currentPhoto.id);
      }
    }
  },
  close: () => {
    const modal = document.getElementById('preference-modal');
    const content = document.getElementById('preference-content');
    if (!modal || !content) return;
    content.classList.remove('opacity-100', 'scale-100');
    content.classList.add('opacity-0', 'scale-95');
    setTimeout(() => {
      modal.classList.add('hidden');
      app.ui.unlockScroll();
    }, 200);
  },
  applyFilter: (query, tableName = 'photos') => {
    if (app.preference.current === 'both') return query;
    if (tableName === 'photos') {
      return query.eq('type', app.preference.current);
    } else if (tableName === 'vehicles') {
      return query.eq('photos.type', app.preference.current);
    }
    return query;
  }
}, window.app.qrLogin = {
  peer: null,
  conn: null,
  timer: null,
  timeLeft: 180,
  // --- HOST: Máy PC (Mở Modal, Tạo QR, Chờ kết nối) ---
  startHost: () => {
    const modal = document.getElementById('qr-login-host-modal');
    const loading = document.getElementById('qr-login-loading');
    const qrContainer = document.getElementById('qr-login-qrcode-container');
    const countdownEl = document.getElementById('qr-login-countdown');
    const statusText = document.getElementById('qr-login-status-text');
    modal.classList.remove('hidden');
    qrContainer.innerHTML = '';
    loading.classList.remove('hidden');
    statusText.innerText = "Đang tạo mã QR...";
    countdownEl.innerText = "03:00";
    app.ui.lockScroll();
    if (app.qrLogin.peer) app.qrLogin.peer.destroy();
    app.qrLogin.peer = new Peer();
    app.qrLogin.peer.on('open', id => {
      loading.classList.add('hidden');
      const loginUrl = window.location.origin + '/login?qr=' + id;
      new QRCode(qrContainer, {
        text: loginUrl,
        width: 224,
        height: 224,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
      });
      app.qrLogin.startCountdown();
    });
    app.qrLogin.peer.on('connection', conn => {
      app.qrLogin.conn = conn;
      conn.on('open', () => {
        loading.classList.remove('hidden');
        statusText.innerText = "Vui lòng xác nhận trên thiết bị quét...";
        if (app.qrLogin.timer) clearInterval(app.qrLogin.timer);
        countdownEl.innerText = "Đang chờ...";

        // GỬI RAW USER-AGENT TỪ MÁY TÍNH QUA ĐIỆN THOẠI
        conn.send({
          type: 'host_info',
          userAgent: navigator.userAgent
        });
      });
      conn.on('data', async data => {
        if (data.type === 'login_link') {
          statusText.innerText = "Đang chuyển hướng đăng nhập...";
          conn.send({
            type: 'success'
          });

          // CHUẨN CHUYÊN NGHIỆP: ĐIỀU HƯỚNG PC ĐẾN MAGIC LINK DO BACKEND TẠO RA
          window.location.href = data.url;
        } else if (data.type === 'cancel') {
          app.ui.showAlert("Đăng nhập bị từ chối từ thiết bị quét.");
          app.qrLogin.cancelHost();
        }
      });
      conn.on('close', () => {
        app.qrLogin.cancelHost();
      });
    });
  },
  startCountdown: () => {
    app.qrLogin.timeLeft = 180;
    const timerEl = document.getElementById('qr-login-countdown');
    if (app.qrLogin.timer) clearInterval(app.qrLogin.timer);
    app.qrLogin.timer = setInterval(() => {
      app.qrLogin.timeLeft--;
      const m = Math.floor(app.qrLogin.timeLeft / 60).toString().padStart(2, '0');
      const s = (app.qrLogin.timeLeft % 60).toString().padStart(2, '0');
      timerEl.innerText = `${m}:${s}`;
      if (app.qrLogin.timeLeft <= 0) {
        app.ui.showAlert("Mã QR đã hết hạn (3 phút). Vui lòng tạo lại.");
        app.qrLogin.cancelHost();
      }
    }, 1000);
  },
  cancelHost: () => {
    if (app.qrLogin.timer) clearInterval(app.qrLogin.timer);
    if (app.qrLogin.conn) app.qrLogin.conn.close();
    if (app.qrLogin.peer) app.qrLogin.peer.destroy();
    document.getElementById('qr-login-host-modal').classList.add('hidden');
    app.ui.unlockScroll();
  },
  // --- CLIENT: Điện thoại quét mã ---
  initClient: async hostId => {
    if (!app.user) {
      app.ui.showAlert("Bạn chưa đăng nhập! Vui lòng đăng nhập trên điện thoại này trước khi quét mã QR.", () => {
        app.utils.navigate('/auth');
      });
      return;
    }
    const modal = document.getElementById('qr-login-confirm-modal');
    const btnConfirm = document.getElementById('qr-confirm-btn');
    const avatarImg = document.getElementById('qr-confirm-avatar');
    const deviceText = document.getElementById('qr-confirm-device');
    btnConfirm.disabled = true;
    btnConfirm.classList.add('opacity-50', 'cursor-not-allowed');
    let timeLeft = 10;
    btnConfirm.innerText = `Đăng nhập (${timeLeft})`;
    document.getElementById('qr-confirm-name').innerText = app.username;
    try {
      const {
        data: profile
      } = await app.admin.api("q62", {
        app
      });
      if (profile && profile.avatar_url) {
        avatarImg.src = app.utils.getProxiedUrl(profile.avatar_url.replace(/"/g, ''), 'avatar.jpg', 'avatar');
      } else if (app.user.user_metadata?.avatar_url) {
        avatarImg.src = app.utils.getProxiedUrl(app.user.user_metadata.avatar_url, 'avatar.jpg', 'avatar');
      } else {
        avatarImg.src = 'https://files.catbox.moe/zzh1q1.png';
      }
    } catch (e) {
      avatarImg.src = 'https://files.catbox.moe/zzh1q1.png';
    }
    deviceText.innerText = "Đang kết nối để lấy thông tin thiết bị...";
    app.qrLogin.getIP();
    modal.classList.remove('hidden');
    app.ui.lockScroll();
    const cTimer = setInterval(() => {
      timeLeft--;
      if (timeLeft <= 0) {
        clearInterval(cTimer);
        btnConfirm.disabled = false;
        btnConfirm.classList.remove('opacity-50', 'cursor-not-allowed');
        btnConfirm.innerText = "Đăng nhập";
      } else {
        btnConfirm.innerText = `Đăng nhập (${timeLeft})`;
      }
    }, 1000);
    if (app.qrLogin.peer) app.qrLogin.peer.destroy();
    app.qrLogin.peer = new Peer();
    app.qrLogin.peer.on('open', () => {
      app.qrLogin.conn = app.qrLogin.peer.connect(hostId, {
        reliable: true
      });
      app.qrLogin.conn.on('data', data => {
        if (data.type === 'host_info') {
          deviceText.innerText = data.userAgent || 'Trình duyệt không xác định';
          deviceText.className = "text-[10px] font-mono text-gray-800 break-words leading-tight mt-0.5";
        } else if (data.type === 'success') {
          app.ui.showAlert(`<div class="text-left">
                                    <p class="text-sm font-bold text-green-600 mb-2"><i class="fa-solid fa-check-circle mr-1"></i> Đăng nhập thành công!</p>
                                    <p class="text-xs text-gray-700 mb-2">Thiết bị yêu cầu đã được cấp quyền truy cập hệ thống.</p>
                                    <div class="bg-gray-50 border border-gray-200 p-3 rounded-md mt-3 shadow-sm">
                                        <p class="text-[10.5px] text-gray-600 font-medium leading-relaxed m-0">
                                            <i class="fa-solid fa-triangle-exclamation text-amber-500 mr-1"></i>
                                            Nếu bạn lỡ tay hoặc nghi ngờ rủi ro, hãy vào <a href="javascript:void(0)" onclick="app.ui.closeAlert(true); setTimeout(() => { app.settings.open(); app.settings.switchTab('security'); }, 300);" class="font-bold text-red-600 hover:text-red-800 transition underline">Cài đặt > Bảo mật > Đăng xuất tất cả</a> để vô hiệu hóa quyền truy cập ngay lập tức.
                                        </p>
                                    </div>
                                </div>`, () => {
            app.utils.navigate('/');
          }, null, {
            title: "Xác thực QR hoàn tất",
            btnOkText: "Đã hiểu"
          });
          app.qrLogin.closeClient();
        }
      });
      app.qrLogin.conn.on('close', () => {
        app.ui.showAlert("Mất kết nối với thiết bị chờ đăng nhập. Vui lòng quét lại.");
        app.utils.navigate('/');
        app.qrLogin.closeClient();
      });
    });
  },
  getIP: async () => {
    try {
      const res = await fetch('https://api.ipify.org?format=json');
      const data = await res.json();
      document.getElementById('qr-confirm-ip').innerText = data.ip || 'Không thể lấy IP';
    } catch (e) {
      document.getElementById('qr-confirm-ip').innerText = 'Không thể lấy IP';
    }
  },
  confirmClient: async () => {
    const btn = document.getElementById('qr-confirm-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...';
    try {
      const {
        data,
        error
      } = await window.sb.auth.getSession();
      if (error || !data.session) throw new Error("Lấy Token thất bại. Vui lòng tải lại trang.");
      if (!app.qrLogin.conn || !app.qrLogin.conn.open) {
        throw new Error("Không thể kết nối với máy chủ chờ. Vui lòng quét lại mã QR.");
      }

      // --- CHUẨN CHUYÊN NGHIỆP: GỌI API BACKEND ĐỂ TẠO MAGIC LINK ---
      const res = await fetch('/api/system', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.session.access_token}`
        },
        body: JSON.stringify({
          action: 'qr-login'
        })
      });
      const apiData = await res.json();
      if (!res.ok) throw new Error(apiData.error || "Không thể tạo token đăng nhập mới từ máy chủ.");

      // Bắn Magic Link qua cho PC
      app.qrLogin.conn.send({
        type: 'login_link',
        url: apiData.url
      });
    } catch (e) {
      app.ui.showAlert(e.message);
      btn.disabled = false;
      btn.innerText = "Thử lại";
    }
  },
  cancelClient: () => {
    if (app.qrLogin.conn && app.qrLogin.conn.open) {
      app.qrLogin.conn.send({
        type: 'cancel'
      });
    }
    app.ui.showAlert("Đã hủy quá trình đăng nhập qua QR.", () => {
      app.utils.navigate('/');
    });
    app.qrLogin.closeClient();
  },
  closeClient: () => {
    if (app.qrLogin.conn) app.qrLogin.conn.close();
    if (app.qrLogin.peer) app.qrLogin.peer.destroy();
    document.getElementById('qr-login-confirm-modal').classList.add('hidden');
    app.ui.unlockScroll();
  }
}, window.app.reinitializeComponents = async () => {
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
};