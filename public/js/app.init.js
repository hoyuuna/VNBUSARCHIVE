window.app = window.app || {};


        // Bắt sự kiện phím tắt Ctrl + K (hoặc Cmd + K trên Mac)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault(); // Ngăn trình duyệt tự mở chức năng tìm kiếm mặc định
                const pageInput = document.getElementById('page-search-input');
                const headerInput = document.getElementById('search-input');
                const searchView = document.getElementById('search');
                const headerBox = document.getElementById('header-search-box');

                // Nếu đang ở màn hình Tìm kiếm mở rộng, ưu tiên focus ô ở giữa màn hình
                if (searchView && searchView.classList.contains('active') && pageInput) {
                    pageInput.focus();
                }
                // Ngược lại focus ô Header (nếu nó không bị ẩn)
                else if (headerInput && headerBox && !headerBox.classList.contains('hidden')) {
                    headerInput.focus();
                    window.scrollTo({ top: 0, behavior: 'smooth' }); // Tự động cuộn lên đầu trang
                }
            }
        });

        marked.use({ breaks: true, gfm: true });

        document.addEventListener('keydown', (e) => {
            if (!['ArrowDown', 'ArrowUp', 'Enter'].includes(e.key)) return;
            const activeEl = document.activeElement;
            if (!activeEl || activeEl.tagName !== 'INPUT') return;
            
            let sugBoxId = null;
            if (activeEl.id === 'search-input') sugBoxId = 'main-search-suggestions';
            else if (activeEl.id === 'page-search-input') sugBoxId = 'page-search-suggestions';
            else if (activeEl.id.includes('route')) sugBoxId = activeEl.id + '-suggestions';
            else if (activeEl.id.includes('operator')) sugBoxId = activeEl.id + '-suggestions';
            else if (activeEl.id.includes('model')) sugBoxId = activeEl.id + '-suggestions';
            
            if (!sugBoxId) return;
            const box = document.getElementById(sugBoxId);
            if (!box || !box.classList.contains('active')) return;

            const items = Array.from(box.querySelectorAll('.suggestion-item, [onclick]'));
            if (items.length === 0) return;

            let currentIndex = items.findIndex(item => item.classList.contains('bg-gray-100'));

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (currentIndex >= 0) items[currentIndex].classList.remove('bg-gray-100');
                currentIndex = (currentIndex + 1) % items.length;
                items[currentIndex].classList.add('bg-gray-100');
                items[currentIndex].scrollIntoView({ block: 'nearest' });
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (currentIndex >= 0) items[currentIndex].classList.remove('bg-gray-100');
                currentIndex = (currentIndex - 1 + items.length) % items.length;
                items[currentIndex].classList.add('bg-gray-100');
                items[currentIndex].scrollIntoView({ block: 'nearest' });
            } else if (e.key === 'Enter') {
                if (currentIndex >= 0) {
                    e.preventDefault();
                    if (items[currentIndex].onclick) items[currentIndex].click();
                    else {
                        const evt = new MouseEvent('mousedown', { bubbles: true });
                        items[currentIndex].dispatchEvent(evt);
                    }
                }
            }
        });

        document.addEventListener('DOMContentLoaded', async () => {
            try {
                // 1. Gọi API để lấy key cấu hình
                const response = await fetch('/api/system');
                if (!response.ok) throw new Error('Không thể tải cấu hình máy chủ');

                const config = await response.json();

                // 2. Khởi tạo Supabase client với key lấy từ API
                window.sb = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_KEY);

                // 3. Bắt đầu khởi động ứng dụng
                app.init();
            } catch (error) {
                console.error("Lỗi khởi tạo hệ thống:", error);
                document.getElementById('loading-screen').innerHTML = '<p style="color:red; text-align:center; padding: 20px;">Lỗi kết nối máy chủ. Vui lòng tải lại trang.</p>';
            }
        });
    