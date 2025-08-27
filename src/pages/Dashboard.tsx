import { useEffect, useState, useCallback } from "react";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { QuickActionGrid } from "@/components/dashboard/QuickActionGrid";
import { RecentInvoices } from "@/components/dashboard/RecentInvoices";
import { InvoiceStatusCards } from "@/components/dashboard/InvoiceStatusCards";
import { VendorOverview } from "@/components/dashboard/VendorOverview";
import { VendorStats } from "@/components/dashboard/VendorStats";
import { Invoice } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useVendor } from "@/contexts/VendorContext";
import { NotificationCenter } from "@/components/ui/notification-center";

interface SupabaseInvoice {
  id: string;
  invoice_no: string;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_total: number;
  total: number;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export default function Dashboard() {
  const { vendor, userProfile, loading: vendorLoading } = useVendor();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [companyName, setCompanyName] = useState<string>("Mein Unternehmen");
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!vendor?.id) {
      console.log('No vendor available yet');
      return;
    }

    try {
      console.log('Loading dashboard data from Supabase...');
      setLoading(true);
      
      // Load company settings from Supabase
      const { data: settingsData } = await supabase
        .from('company_settings')
        .select('*')
        .eq('vendor_id', vendor.id)
        .single();
      
      if (settingsData?.name) {
        setCompanyName(settingsData.name);
      } else if (vendor?.name) {
        setCompanyName(vendor.name);
      }
      
      // Load invoices from Supabase and transform them to match our Invoice type
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false });

      if (invoiceError) {
        console.error('Error loading invoices:', invoiceError);
      } else {
        console.log('Loaded invoices from Supabase:', invoiceData);
        // Transform Supabase invoice data to match our Invoice interface
        const transformedInvoices = invoiceData?.map((invoice: SupabaseInvoice) => ({
          id: invoice.id,
          number: invoice.invoice_no,
          invoiceNumber: invoice.invoice_no,
          customerName: 'Customer', // Default customer name since we don't have customers table loaded
          customerEmail: undefined,
          date: invoice.issue_date,
          dueDate: invoice.due_date,
          items: [], // Items would need to be loaded separately
          subtotal: invoice.subtotal,
          taxTotal: invoice.tax_total,
          total: invoice.total,
          status: invoice.status as 'draft' | 'sent' | 'paid' | 'overdue',
          notes: invoice.notes,
          createdAt: invoice.created_at,
          updatedAt: invoice.updated_at
        })) || [];
        
        setInvoices(transformedInvoices);
      }
      
      console.log('Dashboard loaded successfully');
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [vendor?.id]);

  useEffect(() => {
    if (vendor?.id && !vendorLoading) {
      loadData();
    }
  }, [vendor?.id, vendorLoading, loadData]);

  // Show loading state while vendor data is being loaded
  if (vendorLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Dashboard Stats */}
      <DashboardStats 
        invoices={invoices}
        companyName={companyName}
      />

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-clamp-lg font-semibold">Schnelle Aktionen</h2>
        <QuickActionGrid />
      </div>

      {/* Recent Invoices */}
      <RecentInvoices invoices={invoices} />

      {/* Notifications */}
      <div className="space-y-4">
        <h2 className="text-clamp-lg font-semibold">Benachrichtigungen</h2>
        <NotificationCenter />
      </div>
    </div>
  );
}