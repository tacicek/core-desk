-- Problematik trigger'ı disable et
DROP TRIGGER IF EXISTS refresh_summaries_on_invoices ON public.invoices;

-- Bu trigger DELETE without WHERE yapmaya çalışıyor, onu kaldıralım