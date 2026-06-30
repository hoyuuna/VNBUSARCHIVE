export async function onRequestPost(context) {
    try {
        const body = await context.request.json();
        const bioText = body.text;

        if (!bioText || bioText.trim() === '') {
            return Response.json({ is_safe: true, reason: "" });
        }

        // PROMPT ĐÃ ĐƯỢC TỐI ƯU HÓA LẠI
        const systemPrompt = `Bạn là một AI kiểm duyệt nội dung (Content Moderator) nghiêm ngặt và khách quan.
Nhiệm vụ của bạn là đánh giá mô tả hồ sơ (bio) của người dùng và phát hiện vi phạm.

[TIÊU CHÍ VI PHẠM]
1. Ngôn từ tục tĩu, chửi thề, xúc phạm (chỉ khi quá nghiêm trọng).
2. Nội dung thù ghét, phân biệt đối xử (vùng miền, tôn giáo, giới tính...).
3. Quấy rối, đe dọa, hoặc bạo lực.
4. Spam, quảng cáo, cờ bạc, lừa đảo (scam).
5. Kéo kéo, dẫn dụ người dùng sang mạng xã hội, ứng dụng hoặc nền tảng khác (VD: kêu gọi qua Discord, Facebook, Zalo...).
6. Nội dung người lớn (18+), khiêu dâm.
7. Gắn link (URL) bất kỳ.

[ĐỊNH DẠNG ĐẦU RA BẮT BUỘC]
Bạn CHỈ ĐƯỢC PHÉP trả về duy nhất một đối tượng JSON hợp lệ. KHÔNG dùng markdown (như \`\`\`json), KHÔNG thêm lời chào.
Cấu trúc JSON:
{
  "is_safe": true/false,
  "reason": "Giải thích ngắn gọn bằng tiếng Việt lý do vi phạm nếu is_safe = false. Nếu is_safe = true, hãy để chuỗi rỗng."
}`;

        // Gọi thẳng API Groq bằng Fetch (Chuẩn Serverless Cloudflare)
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${context.env.GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile", // Model cực nhanh và thông minh của Groq
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Hãy kiểm duyệt bio này: "${bioText}"` }
                ],
                temperature: 0.1, // Cực kỳ nguyên tắc, không bay bổng
                response_format: { type: "json_object" } // Ép AI trả về JSON chuẩn 100%
            })
        });

        const result = await response.json();
        
        // Bóc tách JSON từ AI
        const aiResponseText = result.choices[0].message.content;
        const aiAssessment = JSON.parse(aiResponseText);

        return Response.json(aiAssessment);

    } catch (error) {
        console.error("AI Moderation Error:", error);
        // Fallback: Nếu AI lỗi mạng, tạm cho qua để không kẹt UX, hoặc bạn có thể đổi thành false
        return Response.json({ is_safe: true, reason: "" }); 
    }
}
