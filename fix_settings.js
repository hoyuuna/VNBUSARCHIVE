const fs = require('fs');

// 1. Update 00_core.js
let coreJs = fs.readFileSync('src/js/00_core.js', 'utf8');

const fetchRegex = /fetch:\s*async\s*\(\)\s*=>\s*\{[\s\S]*?\}\s*catch\s*\(e\)\s*\{\s*console\.error\(".*?bảo trì",\s*e\);\s*\}\s*\}/i;
const newFetch = `fetch: async () => {
    try {
        const data = await app.api.get('/api/system/settings');
        if (data && data.data && Array.isArray(data.data)) {
            data.data.forEach(item => { app.maintenance.settings[item.id] = item; });
        } else if (data && Array.isArray(data)) {
            data.forEach(item => { app.maintenance.settings[item.id] = item; });
        }
    } catch (e) { console.error("Lỗi lấy thông tin bảo trì", e); }
}`;

coreJs = coreJs.replace(fetchRegex, newFetch);
fs.writeFileSync('src/js/00_core.js', coreJs);
console.log('Updated 00_core.js');

// 2. Update page_admin.js
let adminJs = fs.readFileSync('src/js/page_admin.js', 'utf8');

const saveManagerRegex = /saveManagerSetting:\s*async\s*\(sysId,\s*btn\)\s*=>\s*\{[\s\S]*?finally\s*\{\s*btn\.innerHTML\s*=\s*originalHTML;\s*btn\.disabled\s*=\s*false;\s*\}\s*\}/;
const newSaveManager = `saveManagerSetting: async (sysId, btn) => {
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; btn.disabled = true;
    const isActive = document.getElementById(\`mt-active-\${sysId}\`).checked;
    const reason = document.getElementById(\`mt-reason-\${sysId}\`).value.trim();
    const hasTime = document.getElementById(\`mt-has-time-\${sysId}\`).checked;
    const timeVal = document.getElementById(\`mt-time-\${sysId}\`).value;
    let autoReactivate = (isActive || !hasTime) ? null : new Date(timeVal).toISOString();
    try {
        await app.api.put('/api/admin/system-settings', {
            id: sysId,
            is_active: isActive,
            reason: reason,
            auto_reactivate_at: autoReactivate,
            updated_by: app.user?.id || '',
            updated_at: new Date().toISOString()
        });
        await app.maintenance.fetch();
        app.ui.showAlert(\`Đã lưu thông tin cho \${sysId.toUpperCase()}\`);
    } catch (e) { app.ui.showAlert("Lỗi: " + e.message); }
    finally { btn.innerHTML = originalHTML; btn.disabled = false; }
}`;
adminJs = adminJs.replace(saveManagerRegex, newSaveManager);

const saveQuotaRegex = /saveQuotaSetting:\s*async\s*\(btn\)\s*=>\s*\{[\s\S]*?finally\s*\{\s*btn\.innerHTML\s*=\s*originalHTML;\s*btn\.disabled\s*=\s*false;\s*\}\s*\}/;
const newSaveQuota = `saveQuotaSetting: async (btn) => {
    if (app.role !== 'manager') return;
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; btn.disabled = true;
    const val = document.getElementById('mt-quota-value').value;
    try {
        await app.api.put('/api/admin/system-settings', {
            id: 'upload_quota',
            reason: val,
            updated_by: app.user?.id || '',
            updated_at: new Date().toISOString()
        });
        await app.maintenance.fetch();
        app.ui.showAlert("Đã lưu thông tin Quota.");
    } catch (e) { app.ui.showAlert("Lỗi: " + e.message); }
    finally { btn.innerHTML = originalHTML; btn.disabled = false; }
}`;
adminJs = adminJs.replace(saveQuotaRegex, newSaveQuota);

fs.writeFileSync('src/js/page_admin.js', adminJs);
console.log('Updated page_admin.js');

// 3. Update admin.ts
let adminTs = fs.readFileSync('temp/middle/src/routes/admin.ts', 'utf8');
const adminUpdateRegex = /await db\.updateOne\('system_settings',\s*\{\s*id:\s*id\s*\},/g;
adminTs = adminTs.replace(adminUpdateRegex, "await db.updateOne('system_settings', { _id: id },");
fs.writeFileSync('temp/middle/src/routes/admin.ts', adminTs);
console.log('Updated admin.ts');

// 4. Update system.ts
let systemTs = fs.readFileSync('temp/middle/src/routes/system.ts', 'utf8');
const systemGetRegex = /const results = await db\.find\('system_settings', \{\}, \{ limit: 50 \}\)[\s\S]*?return c\.json\(\{ data: results \}\)/;
const newSystemGet = `const results = await db.find('system_settings', {}, { limit: 50 })
  const mapped = results.map((r: any) => ({ ...r, id: r._id || r.id }))
  c.header('Cache-Control', 'public, max-age=60')
  return c.json({ data: mapped })`;
systemTs = systemTs.replace(systemGetRegex, newSystemGet);

// Also need to fix system.get('/status') which uses { id: "SYSTEM_MAIN" } instead of _id
const systemStatusRegex = /db\.find\('system_settings',\s*\{\s*id:\s*"SYSTEM_MAIN"\s*\}\)/;
systemTs = systemTs.replace(systemStatusRegex, "db.find('system_settings', { _id: \"SYSTEM_MAIN\" })");

fs.writeFileSync('temp/middle/src/routes/system.ts', systemTs);
console.log('Updated system.ts');
