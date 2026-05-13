-- Thêm cấu hình giới hạn upload quota
INSERT INTO public.system_settings (id, is_active, reason) 
VALUES ('upload_quota', true, '') 
ON CONFLICT (id) DO NOTHING;
