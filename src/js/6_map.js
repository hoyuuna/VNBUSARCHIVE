window.app = window.app || {};

app.map = {
    instance: null,
    drawnItems: null,
    zones: [],
    isAdmin: false,
    userDrawing: false,
    userDrawHandler: null,
    
    // Draft cho việc thêm mới
    currentDraftShapes: [],
    draftLayerGroup: null,

    async init() {
        if (!this.instance) {
            this.initMap();
        } else {
            this.instance.invalidateSize();
        }
        await this.checkPermission();
        await this.loadZones();
        this.updateTheme();
        
        const observer = new MutationObserver(() => this.updateTheme());
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    },

    initMap() {
        const mapContainer = document.getElementById('leaflet-map');
        if (!mapContainer) return;

        this.instance = L.map(mapContainer, {
            center: [16.047079, 108.206230],
            zoom: 6,
            zoomControl: false
        });

        L.control.zoom({ position: 'bottomright' }).addTo(this.instance);

        this.tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 20
        }).addTo(this.instance);

        this.drawnItems = new L.FeatureGroup();
        this.instance.addLayer(this.drawnItems);
        
        this.draftLayerGroup = new L.FeatureGroup();
        this.instance.addLayer(this.draftLayerGroup);

        this.instance.on(L.Draw.Event.CREATED, (event) => {
            const layer = event.layer;
            if (this.userDrawing) {
                // Thêm vào draft
                this.addDraftShape(layer);
                
                // Tắt chế độ vẽ
                this.userDrawing = false;
                if (this.userDrawHandler) {
                    this.userDrawHandler.disable();
                }
            }
        });
        
        const svgPattern = '<svg width="10" height="10" xmlns="http://www.w3.org/2000/svg"><path d="M-1,1 l2,-2 M0,10 l10,-10 M9,11 l2,-2" stroke="rgba(239, 68, 68, 0.4)" stroke-width="2"/></svg>';
        const encodedPattern = btoa(svgPattern);
        const style = document.createElement('style');
        style.innerHTML = '.leaflet-interactive.no-photo-zone { fill: url("data:image/svg+xml;base64,' + encodedPattern + '") !important; fill-opacity: 1 !important; }';
        document.head.appendChild(style);

        this.setupPanelEvents();
    },
    
    setupPanelEvents() {
        const openBtn = document.getElementById('map-open-panel-btn');
        const openContainer = document.getElementById('map-open-panel-btn');
        const closeBtn = document.getElementById('map-close-panel-btn');
        const panel = document.getElementById('map-zone-panel');
        const addShapeBtn = document.getElementById('map-panel-add-shape');
        const saveBtn = document.getElementById('map-panel-save-btn');
        
        if (openBtn) {
            openBtn.addEventListener('click', () => {
                if (!app.user) {
                    app.ui.showAlert('Vui lòng đăng nhập để bổ sung vùng cấm.', () => {
                        app.utils.navigate('/auth');
                    });
                    return;
                }
                
                document.getElementById('map-panel-title').innerText = this.isAdmin ? 'Thêm Vùng Cấm (Admin)' : 'Gửi Yêu Cầu Bổ Sung';
                saveBtn.innerText = this.isAdmin ? 'Lưu Trực Tiếp' : 'Gửi Yêu Cầu';
                
                openBtn.classList.add('hidden');
                panel.classList.remove('hidden');
                setTimeout(() => {
                    panel.classList.remove('scale-95', 'opacity-0');
                    panel.classList.add('scale-100', 'opacity-100');
                }, 10);
            });
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                panel.classList.remove('scale-100', 'opacity-100');
                panel.classList.add('scale-95', 'opacity-0');
                setTimeout(() => {
                    panel.classList.add('hidden');
                    openBtn.classList.remove('hidden');
                }, 300);
                this.clearDrafts();
            });
        }
        
        if (addShapeBtn) {
            addShapeBtn.addEventListener('click', () => {
                const bounds = this.instance.getBounds();
                const center = bounds.getCenter();
                // create a small rectangle in the center (about 20% of map width/height)
                const latDiff = (bounds.getNorth() - bounds.getSouth()) * 0.2;
                const lngDiff = (bounds.getEast() - bounds.getWest()) * 0.2;
                
                const rectBounds = [
                    [center.lat - latDiff/2, center.lng - lngDiff/2],
                    [center.lat + latDiff/2, center.lng + lngDiff/2]
                ];
                
                const rect = L.rectangle(rectBounds, {
                    color: '#ef4444',
                    weight: 2,
                    className: 'no-photo-zone'
                });
                
                this.addDraftShape(rect);
                
                if (rect.editing) {
                    rect.editing.enable();
                }
                
                app.ui.toast('Đã thêm vùng chọn. Kéo và thay đổi kích thước theo ý muốn.', 'info');
            });
        }
        
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveDrafts());
        }
    },
    
    addDraftShape(layer) {
        const id = 'shape_' + Date.now();
        layer.draftId = id;
        this.draftLayerGroup.addLayer(layer);
        
        this.currentDraftShapes.push({
            id,
            layer
        });
        
        this.renderDraftList();
    },
    
    removeDraftShape(id) {
        const idx = this.currentDraftShapes.findIndex(s => s.id === id);
        if (idx !== -1) {
            const shape = this.currentDraftShapes[idx];
            if (shape.layer.editing) shape.layer.editing.disable();
            this.draftLayerGroup.removeLayer(shape.layer);
            this.currentDraftShapes.splice(idx, 1);
            this.renderDraftList();
        }
    },
    
    clearDrafts() {
        this.currentDraftShapes.forEach(shape => {
            if (shape.layer.editing) shape.layer.editing.disable();
        });
        this.draftLayerGroup.clearLayers();
        this.currentDraftShapes = [];
        this.renderDraftList();
        document.getElementById('map-panel-name').value = '';
        document.getElementById('map-panel-desc').value = '';
    },
    
    renderDraftList() {
        const listEl = document.getElementById('map-panel-shapes-list');
        if (!listEl) return;
        
        listEl.innerHTML = '';
        if (this.currentDraftShapes.length === 0) {
            listEl.innerHTML = '<p class="text-[10px] text-gray-400 italic">Chưa có vùng nào được thêm.</p>';
            return;
        }
        
        this.currentDraftShapes.forEach((shape, index) => {
            const div = document.createElement('div');
            div.className = 'flex items-center justify-between bg-gray-50 dark:bg-[#27272a] border border-gray-200 dark:border-gray-700 p-2 rounded-md';
            
            const span = document.createElement('span');
            span.className = 'text-xs font-bold dark:text-white';
            span.innerText = 'Vùng ' + (index + 1);
            
            const btn = document.createElement('button');
            btn.className = 'text-red-500 hover:text-red-700';
            btn.innerHTML = '<i class="fa-solid fa-trash text-xs"></i>';
            btn.onclick = () => this.removeDraftShape(shape.id);
            
            div.appendChild(span);
            div.appendChild(btn);
            listEl.appendChild(div);
        });
    },

    updateTheme() {
        if (!this.instance || !this.tileLayer) return;
        
        let isDark = false;
        const cur = (app.preference && app.preference.theme) ? app.preference.theme : (localStorage.getItem('vnbus_theme') || 'system');
        
        if (cur === 'dark') {
            isDark = true;
        } else if (cur === 'system') {
            isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        
        const url = isDark 
            ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
            : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
            
        this.tileLayer.setUrl(url);
    },

    async checkPermission() {
        this.isAdmin = false;
        if (app.user) {
            const { data } = await window.sb.from('profiles').select('role').eq('id', app.user.id).single();
            if (data && (data.role === 'admin' || data.role === 'manager')) {
                this.isAdmin = true;
            }
        }
    },

    async loadZones() {
        const { data, error } = await window.sb.from('no_photo_zones').select('*');
        if (error) {
            console.error('Lỗi tải vùng cấm:', error);
            return;
        }

        this.drawnItems.clearLayers();
        this.zones = data || [];

        this.zones.forEach(zone => {
            const bounds = zone.bounds;
            if (Array.isArray(bounds) && bounds.length > 0) {
                // Kiểm tra xem bounds là MultiPolygon (mảng của các polygon) hay chỉ là 1 polygon/rectangle cũ
                let polygons = [];
                // Nếu điểm đầu tiên là mảng và chứa số, đó là 1 polygon cũ
                if (Array.isArray(bounds[0]) && typeof bounds[0][0] === 'number') {
                    // Legacy rectangle: convert to polygon
                    if (bounds.length === 2) { // Southwest, Northeast
                        polygons = [[
                            [bounds[0][0], bounds[0][1]],
                            [bounds[1][0], bounds[0][1]],
                            [bounds[1][0], bounds[1][1]],
                            [bounds[0][0], bounds[1][1]]
                        ]];
                    } else {
                        polygons = [bounds];
                    }
                } else if (Array.isArray(bounds[0]) && Array.isArray(bounds[0][0])) {
                    // Đã là mảng các polygon (mới)
                    polygons = bounds;
                }
                
                polygons.forEach(polyPoints => {
                    const poly = L.polygon(polyPoints, {
                        color: '#ef4444',
                        weight: 2,
                        className: 'no-photo-zone'
                    });
                    
                    poly.zoneData = zone;
                    poly.bindPopup(this.createPopupContent(zone));
                    this.drawnItems.addLayer(poly);
                });
            }
        });
    },
    
    createPopupContent(zone) {
        const container = document.createElement('div');
        container.className = 'p-1 min-w-[150px]';
        
        const title = document.createElement('h3');
        title.className = 'font-bold text-sm mb-1 text-black';
        title.innerText = zone.name;
        container.appendChild(title);
        
        if (zone.description) {
            const desc = document.createElement('p');
            desc.className = 'text-xs text-gray-600 mb-2';
            desc.innerText = zone.description;
            container.appendChild(desc);
        }
        
        if (this.isAdmin) {
            const btn = document.createElement('button');
            btn.className = 'bg-red-500 text-white text-[10px] font-bold py-1.5 px-2 rounded-md hover:bg-red-600 w-full mt-2 border border-black';
            btn.innerText = 'Xóa toàn bộ vùng này';
            btn.onclick = () => this.deleteZone(zone.id);
            container.appendChild(btn);
        }
        
        return container;
    },
    
    async saveDrafts() {
        if (!app.user) return;
        
        const name = document.getElementById('map-panel-name').value.trim();
        const desc = document.getElementById('map-panel-desc').value.trim();
        
        if (!name) {
            app.ui.toast('Vui lòng nhập tên khu vực', 'error');
            return;
        }
        
        if (this.currentDraftShapes.length === 0) {
            app.ui.toast('Vui lòng thêm ít nhất một vùng chọn trên bản đồ', 'error');
            return;
        }
        
        // Gộp tất cả các vùng chọn thành mảng polygons
        const allPolygons = this.currentDraftShapes.map(s => {
            const raw = s.layer.getLatLngs()[0];
            return raw.map(ll => [ll.lat, ll.lng]);
        });
        
        app.loadingBar.start();
        
        if (this.isAdmin) {
            const { error } = await window.sb.from('no_photo_zones').insert({
                name: name,
                description: desc,
                bounds: allPolygons, // Lưu dạng mảng các polygon
                created_by: app.user.id
            });
            
            app.loadingBar.finish();
            
            if (error) {
                console.error(error);
                app.ui.showAlert('Lỗi khi lưu vùng cấm.');
            } else {
                app.ui.toast('Đã thêm vùng cấm thành công', 'success');
                this.clearDrafts();
                document.getElementById('map-close-panel-btn').click();
                this.loadZones();
            }
        } else {
            const { error } = await window.sb.from('zone_edit_requests').insert({
                requester_id: app.user.id,
                type: 'add',
                new_data: { name, description: desc, bounds: allPolygons }
            });
            
            app.loadingBar.finish();
            
            if (error) {
                console.error(error);
                app.ui.showAlert('Lỗi khi gửi yêu cầu.');
            } else {
                app.ui.showAlert('Đã gửi yêu cầu thêm vùng cấm. Quản trị viên sẽ xem xét và phê duyệt.');
                this.clearDrafts();
                document.getElementById('map-close-panel-btn').click();
            }
        }
    },
    
    async deleteZone(id) {
        app.ui.showAlert('Bạn có chắc chắn muốn xóa toàn bộ các khu vực thuộc vùng cấm này?', async () => {
            app.loadingBar.start();
            const { error } = await window.sb.from('no_photo_zones').delete().eq('id', id);
            app.loadingBar.finish();
            
            if (error) {
                app.ui.showAlert('Lỗi khi xóa vùng cấm.');
            } else {
                app.ui.toast('Đã xóa vùng cấm', 'success');
                this.loadZones();
            }
        }, () => {});
    }
};
