export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const { record } = req.body;
    if (!record) return res.status(400).send('No record data');

    const newData = record.new_data;
    let typeLabel = 'Yêu cầu không xác định';
    let details = [];

    if (record.new_data.request_type === 'update_vehicle_info') {
        typeLabel = 'Sửa thông tin xe';
        details = [
            { name: "BKS", value: newData.license_plate || 'N/A', inline: true },
            { name: "Đơn vị", value: newData.operator || 'N/A', inline: true },
            { name: "Note", value: newData.note || 'Không có' }
        ];
    } else if (record.new_data.request_type === 'update_history') {
        typeLabel = 'Cập nhật lịch sử hoạt động';
        const itemCount = newData.history_items ? newData.history_items.length : 0;
        details = [
            { name: "BKS", value: record.license_plate || 'N/A', inline: true },
            { name: "Số lượng mục", value: `${itemCount} dòng lịch sử`, inline: true },
            { name: "Ghi chú", value: "Xem chi tiết trên trang Admin" }
        ];
    }

    if (process.env.DISCORD_PRIVATE_WEBHOOK_URL) {
        await fetch(process.env.DISCORD_PRIVATE_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: "VBS Logger",
                embeds: [{
                    title: `📝 YÊU CẦU CHỈNH SỬA #${record.id}`,
                    color: 3447003, // Blue
                    description: `**Loại yêu cầu:** ${typeLabel}`,
                    fields: details,
                    footer: { text: "Vui lòng duyệt trên trang quản trị." },
                    timestamp: new Date().toISOString()
                }]
            })
        });
    }

    return res.status(200).json({ success: true });
}
