const fs = require('fs');
let code = fs.readFileSync('src/js/page_map.js', 'utf8');

// 1. Rewrite loadZones
const loadRegex = /const\s*\{\s*data\s*,\s*error\s*\}\s*=\s*await\s*window\.sb\.from\('no_photo_zones'\)\.select\('\*'\);/g;
code = code.replace(loadRegex, "const { data, error } = await app.api.get('/api/map/zones').then(res => ({ data: res.data, error: null })).catch(error => ({ data: null, error }));");

// 2. Rewrite update
const updateRegex = /const res = await window\.sb\.from\('no_photo_zones'\)\.update\(\{\s*name:\s*name,\s*description:\s*desc,\s*bounds:\s*allPolygons\s*\}\)\.eq\('id',\s*this\.editingZoneId\);/g;
code = code.replace(updateRegex, `const res = await app.api.put('/api/map/zones/' + this.editingZoneId, {
    name: name,
    description: desc,
    bounds: allPolygons
}).then(data => ({ error: null })).catch(error => ({ error }));`);

// 3. Rewrite insert
const insertRegex = /const res = await window\.sb\.from\('no_photo_zones'\)\.insert\(\{\s*name:\s*name,\s*description:\s*desc,\s*bounds:\s*allPolygons,\s*created_by:\s*app\.user\.id\s*\}\);/g;
code = code.replace(insertRegex, `const res = await app.api.post('/api/map/zones', {
    name: name,
    description: desc,
    bounds: allPolygons
}).then(data => ({ error: null })).catch(error => ({ error }));`);

// 4. Rewrite zone_edit_requests
const requestRegex = /const\s*\{\s*error\s*\}\s*=\s*await\s*window\.sb\.from\('zone_edit_requests'\)\.insert\(\{\s*requester_id:\s*app\.user\.id,\s*type:\s*this\.editingZoneId\s*\?\s*'update'\s*:\s*'add',\s*target_zone_id:\s*this\.editingZoneId\s*\|\|\s*null,\s*new_data:\s*\{\s*name,\s*description:\s*desc,\s*bounds:\s*allPolygons\s*\}\s*\}\);/g;
code = code.replace(requestRegex, `const { error } = await app.api.post('/api/map/zone-requests', {
    type: this.editingZoneId ? 'update' : 'add',
    zone_id: this.editingZoneId || null,
    new_data: { name, description: desc, bounds: allPolygons }
}).then(data => ({ error: null })).catch(error => ({ error }));`);

// 5. Rewrite delete
const deleteRegex = /const\s*\{\s*error\s*\}\s*=\s*await\s*window\.sb\.from\('no_photo_zones'\)\.delete\(\)\.eq\('id',\s*id\);/g;
code = code.replace(deleteRegex, "const { error } = await app.api.del('/api/map/zones/' + id).then(data => ({ error: null })).catch(error => ({ error }));");

fs.writeFileSync('src/js/page_map.js', code);
console.log('Updated page_map.js');
