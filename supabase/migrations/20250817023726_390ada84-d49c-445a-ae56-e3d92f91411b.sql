-- Geçici olarak RLS'i kapat
ALTER TABLE public.invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items DISABLE ROW LEVEL SECURITY;

-- Bu şekilde test edelim, eğer çalışırsa RLS problemi var demektir