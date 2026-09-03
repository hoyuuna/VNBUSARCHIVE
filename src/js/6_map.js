window.app = window.app || {};

app.map = {
    instance: null,
    drawnItems: null,
    drawControl: null,
    zones: [],
    isAdmin: false,
    userDrawing: false,
    userDrawHandler: null,

    async init() {
        if (!this.instance) {
            this.initMap();
        } else {
            this.instance.invalidateSize();
        }
        await this.checkPermission();
        await this.loadZones();
        this.updateTheme();
        
        // Theo dõi thay đổi theme
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

        this.tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(this.instance);

        this.drawnItems = new L.FeatureGroup();
        this.instance.addLayer(this.drawnItems);

        const locateBtn = document.getElementById('map-locate-btn');
        if (locateBtn) {
            locateBtn.addEventListener('click', () => {
                this.instance.locate({ setView: true, maxZoom: 16 });
            });
        }

        this.instance.on('locationfound', (e) => {
            const radius = e.accuracy / 2;
            if (this.currentLocationMarker) {
                this.instance.removeLayer(this.currentLocationMarker);
            }
            this.currentLocationMarker = L.circle(e.latlng, radius, {
                color: '#3b82f6',
                fillColor: '#3b82f6',
                fillOpacity: 0.2
            }).addTo(this.instance);
        });

        this.instance.on('locationerror', (e) => {
            app.ui.showAlert('Không thể lấy vị trí của bạn.');
        });

        this.instance.on(L.Draw.Event.CREATED, (event) => {
            const layer = event.layer;
            this.promptCreateZone(layer);
        });
        
        const svgPattern = '<svg width="10" height="10" xmlns="http://www.w3.org/2000/svg"><path d="M-1,1 l2,-2 M0,10 l10,-10 M9,11 l2,-2" stroke="rgba(239, 68, 68, 0.4)" stroke-width="2"/></svg>';
        const encodedPattern = btoa(svgPattern);
        const style = document.createElement('style');
        style.innerHTML = '.leaflet-interactive.no-photo-zone { fill: url("data:image/svg+xml;base64,' + encodedPattern + '") !important; fill-opacity: 1 !important; }';
        document.head.appendChild(style);

        const requestBtn = document.getElementById('map-add-request-btn');
        if (requestBtn) {
            requestBtn.addEventListener('click', () => {
                if (!app.user) {
                    app.ui.showAlert('Vui lòng đăng nhập để bổ sung vùng cấm.', () => {
                        app.utils.navigate('/auth');
                    });
                    return;
                }
                
                if (!this.userDrawHandler) {
                    this.userDrawHandler = new L.Draw.Rectangle(this.instance, {
                        shapeOptions: {
                            color: '#ef4444',
                            weight: 2
                        }
                    });
                }
                
                app.ui.toast('Hãy kéo thả trên bản đồ để khoanh vùng chữ nhật', 'info');
                this.userDrawing = true;
                this.userDrawHandler.enable();
            });
        }
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
            : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
            
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

        if (this.isAdmin) {
            if (!this.drawControl) {
                this.drawControl = new L.Control.Draw({
                    edit: {
                        featureGroup: this.drawnItems,
                        remove: false
                    },
                    draw: {
                        polygon: false,
                        polyline: false,
                        circle: false,
                        marker: false,
                        circlemarker: false,
                        rectangle: {
                            shapeOptions: {
                                color: '#ef4444',
                                weight: 2
                            }
                        }
                    }
                });
                this.instance.addControl(this.drawControl);
            }
        } else {
            if (this.drawControl) {
                this.instance.removeControl(this.drawControl);
                this.drawControl = null;
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
            if (bounds && bounds.length === 2) {
                const rect = L.rectangle(bounds, {
                    color: '#ef4444',
                    weight: 2,
                    className: 'no-photo-zone'
                });
                
                rect.zoneData = zone;
                rect.bindPopup(this.createPopupContent(zone));
                this.drawnItems.addLayer(rect);
            }
        });
    },
    
    createPopupContent(zone) {
        const container = document.createElement('div');
        container.className = 'p-1';
        
        const title = document.createElement('h3');
        title.className = 'font-bold text-sm mb-1';
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
            btn.className = 'bg-red-500 text-white text-[10px] font-bold py-1 px-2 rounded-md hover:bg-red-600 w-full mt-2 border border-[#18181b]';
            btn.innerText = 'Xóa vùng này';
            btn.onclick = () => this.deleteZone(zone.id);
            container.appendChild(btn);
        }
        
        return container;
    },

    promptCreateZone(layer) {
        const bounds = layer.getBounds();
        const latlngs = [[bounds.getSouthWest().lat, bounds.getSouthWest().lng], [bounds.getNorthEast().lat, bounds.getNorthEast().lng]];

        if (this.userDrawing) {
            this.userDrawing = false;
            if (this.userDrawHandler) {
                this.userDrawHandler.disable();
            }
        }

        this.showCreateModal(latlngs, layer);
    },
    
    showCreateModal(latlngs, layer) {
        const modalId = 'map-create-zone-modal';
        let modal = document.getElementById(modalId);
        if (!modal) {
            modal = document.createElement('div');
            modal.id = modalId;
            modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center hidden';
            modal.innerHTML = `
                <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" onclick="app.ui.hideModal('${modalId}')"></div>
                <div class="relative bg-white dark:bg-[#18181b] border border-[#18181b] rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
                    <h3 class="text-lg font-bold mb-4 dark:text-white" id="map-modal-title">Tạo Vùng Cấm</h3>
                    <input type="text" id="map-zone-name" class="w-full bg-gray-50 dark:bg-[#27272a] border border-[#18181b] rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-black dark:focus:ring-white mb-3" placeholder="Tên khu vực...">
                    <textarea id="map-zone-desc" class="w-full bg-gray-50 dark:bg-[#27272a] border border-[#18181b] rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-black dark:focus:ring-white h-20 resize-none mb-4" placeholder="Mô tả chi tiết..."></textarea>
                    
                    <div class="flex justify-end gap-2">
                        <button class="px-4 py-2 text-sm font-medium border border-[#18181b] rounded-md hover:bg-gray-50 dark:hover:bg-[#27272a] dark:text-white" onclick="app.ui.hideModal('${modalId}')">Hủy</button>
                        <button id="map-zone-save" class="px-4 py-2 bg-black dark:bg-white text-white dark:text-black text-sm font-bold rounded-md hover:opacity-80 border border-[#18181b]">Lưu</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        
        document.getElementById('map-modal-title').innerText = this.isAdmin ? 'Tạo Vùng Cấm' : 'Gửi Yêu Cầu Thêm Vùng';
        document.getElementById('map-zone-name').value = '';
        document.getElementById('map-zone-desc').value = '';
        
        app.ui.showModal(modalId);
        
        const saveBtn = document.getElementById('map-zone-save');
        saveBtn.onclick = async () => {
            const name = document.getElementById('map-zone-name').value.trim();
            const desc = document.getElementById('map-zone-desc').value.trim();
            
            if (!name) {
                app.ui.toast('Vui lòng nhập tên khu vực', 'error');
                return;
            }
            
            app.ui.hideModal(modalId);
            app.loadingBar.start();
            
            if (this.isAdmin) {
                const { error } = await window.sb.from('no_photo_zones').insert({
                    name: name,
                    description: desc,
                    bounds: latlngs,
                    created_by: app.user.id
                });
                
                app.loadingBar.finish();
                
                if (error) {
                    console.error(error);
                    app.ui.showAlert('Lỗi khi lưu vùng cấm.');
                } else {
                    app.ui.toast('Đã thêm vùng cấm thành công', 'success');
                    this.loadZones();
                }
            } else {
                const { error } = await window.sb.from('zone_edit_requests').insert({
                    requester_id: app.user.id,
                    type: 'add',
                    new_data: { name, description: desc, bounds: latlngs }
                });
                
                app.loadingBar.finish();
                
                if (error) {
                    console.error(error);
                    app.ui.showAlert('Lỗi khi gửi yêu cầu.');
                } else {
                    app.ui.showAlert('Đã gửi yêu cầu thêm vùng cấm. Quản trị viên sẽ xem xét và phê duyệt.');
                    if (this.instance && this.instance.hasLayer(layer)) {
                        this.instance.removeLayer(layer);
                    }
                }
            }
        };
    },
    
    async deleteZone(id) {
        app.ui.showAlert('Bạn có chắc chắn muốn xóa vùng cấm này?', async () => {
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
