-- ============================================================
-- VNBUSARCHIVE - Custom Toasts (Manager)
-- Bảng lưu các toast tùy biến do Manager/Admin tạo.
-- Chạy script này trong Supabase SQL Editor.
-- ============================================================

create extension if not exists "pgcrypto";

create table if not exists public.custom_toasts (
    id            uuid primary key default gen_random_uuid(),
    title         text        not null,
    message       text,
    icon          text        not null default 'fa-bell',
    color         text        not null default '#18181b',
    link_url      text,
    link_label    text,
    is_active     boolean     not null default true,
    sort_order    integer     not null default 0,
    created_by    uuid        references auth.users(id) on delete set null,
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now()
);

create index if not exists custom_toasts_active_idx
    on public.custom_toasts (is_active, sort_order);

-- Cập nhật updated_at tự động
create or replace function public.touch_custom_toasts_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists trg_custom_toasts_updated_at on public.custom_toasts;
create trigger trg_custom_toasts_updated_at
    before update on public.custom_toasts
    for each row execute function public.touch_custom_toasts_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.custom_toasts enable row level security;

-- Helper: kiểm tra người dùng hiện tại có phải Manager/Admin
create or replace function public.is_manager_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1 from public.profiles
        where id = auth.uid() and role in ('manager', 'admin')
    );
$$;

-- Đọc: mọi người thấy toast đang bật; Manager/Admin thấy tất cả (kể cả đang tắt)
drop policy if exists "custom_toasts_select" on public.custom_toasts;
create policy "custom_toasts_select"
    on public.custom_toasts
    for select
    using (is_active = true or public.is_manager_or_admin());

-- Thêm: chỉ Manager/Admin
drop policy if exists "custom_toasts_insert" on public.custom_toasts;
create policy "custom_toasts_insert"
    on public.custom_toasts
    for insert
    to authenticated
    with check (public.is_manager_or_admin());

-- Sửa: chỉ Manager/Admin
drop policy if exists "custom_toasts_update" on public.custom_toasts;
create policy "custom_toasts_update"
    on public.custom_toasts
    for update
    to authenticated
    using (public.is_manager_or_admin())
    with check (public.is_manager_or_admin());

-- Xóa: chỉ Manager/Admin
drop policy if exists "custom_toasts_delete" on public.custom_toasts;
create policy "custom_toasts_delete"
    on public.custom_toasts
    for delete
    to authenticated
    using (public.is_manager_or_admin());

-- ============================================================
-- DỮ LIỆU MẪU (tùy chọn - có thể xóa)
-- ============================================================
insert into public.custom_toasts (title, message, icon, color, is_active, sort_order)
values ('Chào mừng đến VNBUSARCHIVE', 'Cảm ơn bạn đã ghé thăm kho dữ liệu xe buýt Việt Nam!', 'fa-bus', '#18181b', false, 0)
on conflict do nothing;