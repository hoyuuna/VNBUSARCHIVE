export async function onRequestPost(context) {
    try {
        const body = await context.request.json();
        const bioText = body.text;

        if (!bioText || bioText.trim() === '') {
            return Response.json({ is_safe: true, reason: "" });
        }

        const systemPrompt = `Bạn là AI kiểm duyệt nội dung. Đánh giá tiểu sử (bio) này và phát hiện vi phạm.
Tiêu chí cấm: Tục tĩu, thù ghét, đe dọa, quảng cáo/spam, dẫn dụ người dùng sang mạng xã hội/nền tảng/app khác, 18+, hoặc có chứa Link.

TRẢ VỀ DUY NHẤT MỘT ĐỐI TƯỢNG JSON, KHÔNG CÓ MARKDOWN (\`\`\`json).
Cấu trúc:
{
  "is_safe": true/false,
  "reason": "Lý do ngắn gọn bằng tiếng Việt nếu is_safe là false."
}`;

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${context.env.GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Bio: "${bioText}"` }
                ],
                temperature: 0.1,
                response_format: { type: "json_object" }
            })
        });

        const result = await response.json();
        return Response.json(JSON.parse(result.choices[0].message.content));

    } catch (error) {
        // Trả về lỗi server 500 để Frontend bắt catch(e) và cấm người dùng lưu
        return new Response(JSON.stringify({ error: "Lỗi Backend AI" }), { status: 500 });
    }
}
