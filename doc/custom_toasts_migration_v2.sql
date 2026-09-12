-- ============================================================
-- VNBUSARCHIVE - Custom Toasts: BỔ SUNG v2 (KHÔNG XÓA BẢNG)
-- Thêm 2 cột điều khiển thời điểm & thời gian hiển thị toast.
-- Chạy file này trong Supabase SQL Editor (sau custom_toasts.sql).
-- An toàn để chạy lại nhiều lần (idempotent).
-- ============================================================

alter table public.custom_toasts
    add column if not exists show_mode text not null default 'always',
    add column if not exists duration  integer not null default 12;

-- Ràng buộc giá trị hợp lệ (bỏ qua nếu đã tồn tại)
do $$
begin
    if not exists (
        select 1 from pg_constraint where conname = 'custom_toasts_show_mode_check'
    ) then
        alter table public.custom_toasts
            add constraint custom_toasts_show_mode_check
            check (show_mode in ('always', 'once'));
    end if;

    if not exists (
        select 1 from pg_constraint where conname = 'custom_toasts_duration_check'
    ) then
        alter table public.custom_toasts
            add constraint custom_toasts_duration_check
            check (duration >= 0);
    end if;
end;
$$;

-- Ghi chú giá trị:
--   show_mode = 'always' -> hiện mỗi lần vào trang (mặc định)
--   show_mode = 'once'   -> chỉ hiện 1 lần duy nhất cho mỗi người dùng (lưu ở localStorage)
--   duration  = số giây tự tắt; 0 = không tự tắt (phải vuốt/gạt để đóng)
-- ============================================================