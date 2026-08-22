
const fs = require('fs');
let content = fs.readFileSync('src/js/3_views.js', 'utf8');

// Replace routeInfoQuery logic
content = content.replace(
\                    try {
                        let routeInfoQuery = window.sb.from('route_info').select('logo_url, description').eq('route_no', decodedRoute);
                        if (decodedProvince) {
                            routeInfoQuery = routeInfoQuery.eq('province', decodedProvince);
                        } else {
                            routeInfoQuery = routeInfoQuery.is('province', null);
                        }
                        const { data: exactInfo } = await routeInfoQuery.maybeSingle();\,
\                    try {
                        const routeName = decodedProvince ? \\\\ - \\\\ : decodedRoute;
                        const { data: exactInfo } = await window.sb.from('route_info').select('logo_url, description').eq('route_name', routeName).maybeSingle();\
);

content = content.replace(
\                    try {
                        let routeInfoQuery = window.sb.from('route_info').select('logo_url, description').eq('route_no', app.route.currentRoute);
                        if (app.route.currentProvince) {
                            routeInfoQuery = routeInfoQuery.eq('province', app.route.currentProvince);
                        } else {
                            routeInfoQuery = routeInfoQuery.is('province', null);
                        }
                        const { data: exactInfo } = await routeInfoQuery.maybeSingle();\,
\                    try {
                        const routeName = app.route.currentProvince ? \\\\ - \\\\ : app.route.currentRoute;
                        const { data: exactInfo } = await window.sb.from('route_info').select('logo_url, description').eq('route_name', routeName).maybeSingle();\
);

// Replace save logic
content = content.replace(
\                                if (!logo && !desc) {
                                    let delQuery = window.sb.from('route_info').delete().eq('route_no', app.route.currentRoute);
                                    if (app.route.currentProvince) {
                                        delQuery = delQuery.eq('province', app.route.currentProvince);
                                    } else {
                                        delQuery = delQuery.is('province', null);
                                    }
                                    const { error: delErr } = await delQuery;
                                    if (delErr) throw delErr;
                                } else {
                                    let existQuery = window.sb.from('route_info').select('id').eq('route_no', app.route.currentRoute);
                                    if (app.route.currentProvince) existQuery = existQuery.eq('province', app.route.currentProvince);
                                    else existQuery = existQuery.is('province', null);
                                    
                                    const { data: existingData } = await existQuery.maybeSingle();
                                    
                                    if (existingData) {
                                        const { error: updateErr } = await window.sb.from('route_info').update({
                                            logo_url: logo || null,
                                            description: desc || null
                                        }).eq('id', existingData.id);
                                        if (updateErr) throw updateErr;
                                    } else {
                                        const { error: insertErr } = await window.sb.from('route_info').insert({
                                            route_no: app.route.currentRoute,
                                            province: app.route.currentProvince || null,
                                            logo_url: logo || null,
                                            description: desc || null
                                        });
                                        if (insertErr) throw insertErr;
                                    }
                                }\,
\                                const routeName = app.route.currentProvince ? \\\\ - \\\\ : app.route.currentRoute;
                                if (!logo && !desc) {
                                    const { error: delErr } = await window.sb.from('route_info').delete().eq('route_name', routeName);
                                    if (delErr) throw delErr;
                                } else {
                                    const { error: upsertErr } = await window.sb.from('route_info').upsert({
                                        route_name: routeName,
                                        logo_url: logo || null,
                                        description: desc || null
                                    });
                                    if (upsertErr) throw upsertErr;
                                }\
);

content = content.replace(
\                                let checkQuery = window.sb.from('edit_requests').select('*', { count: 'estimated', head: true }).eq('status', 'pending');
                                const { count, error: checkErr } = await checkQuery.contains('new_data', { request_type: 'update_route_info', route_no: app.route.currentRoute, province: app.route.currentProvince || null });\,
\                                const routeName = app.route.currentProvince ? \\\\ - \\\\ : app.route.currentRoute;
                                let checkQuery = window.sb.from('edit_requests').select('*', { count: 'estimated', head: true }).eq('status', 'pending');
                                const { count, error: checkErr } = await checkQuery.contains('new_data', { request_type: 'update_route_info', route_name: routeName });\
);

content = content.replace(
\                                    new_data: {
                                        request_type: 'update_route_info',
                                        route_no: app.route.currentRoute,
                                        province: app.route.currentProvince || null,
                                        description: desc,
                                        logo_url: logo
                                    },\,
\                                    new_data: {
                                        request_type: 'update_route_info',
                                        route_name: routeName,
                                        description: desc,
                                        logo_url: logo
                                    },\
);

fs.writeFileSync('src/js/3_views.js', content);

