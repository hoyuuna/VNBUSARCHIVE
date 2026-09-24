const fs = require('fs');
let c = fs.readFileSync('_core.html', 'utf8');
const replacement = `<div id="reset-password-view" class="view-section fixed inset-0 z-[1450] h-[100dvh] w-screen overflow-y-auto overflow-x-hidden bg-[#f4f4f5] hidden" style="z-index: 1600 !important;">
    <div class="min-h-[100dvh] flex flex-col items-center justify-center px-4 py-8">
        <div class="w-full max-w-md bg-white border border-[#18181b] rounded-2xl p-6 md:p-8">
            <div class="text-center mb-6">
                <h2 class="text-2xl font-black text-black tracking-tight">Đặt lại mật khẩu</h2>
                <p class="text-sm text-gray-500 font-medium mt-1">Vui lòng nhập mật khẩu mới</p>
            </div>
            <form id="reset-password-form" class="space-y-4">
                <div class="space-y-1.5">
                    <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider">Mật khẩu mới</label>
                    <input type="password" id="reset-password-new" class="w-full bg-white border border-[#18181b] text-gray-900 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black transition-all" required>
                </div>
                <div class="space-y-1.5">
                    <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider">Xác nhận mật khẩu</label>
                    <input type="password" id="reset-password-confirm" class="w-full bg-white border border-[#18181b] text-gray-900 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black transition-all" required>
                </div>
                <button type="submit" id="reset-password-submit" class="w-full bg-[#18181b] hover:bg-[#27272a] text-white font-bold py-3 px-4 rounded-xl transition-all h-[46px] flex items-center justify-center gap-2 mt-4">Xác nhận</button>
            </form>
        </div>
        <div class="mt-6 text-center">
            <a href="/" onclick="event.preventDefault(); app.utils.navigate('/')" class="text-sm font-bold text-gray-500 hover:text-black transition-colors">Quay lại trang chủ</a>
        </div>
    </div>
</div>

        <!-- MAIN AUTH UI`;
c = c.replace('<!-- MAIN AUTH UI', replacement);
fs.writeFileSync('_core.html', c);
console.log("Injected");
