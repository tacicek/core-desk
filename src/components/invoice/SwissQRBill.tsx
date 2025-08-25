import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Invoice } from '@/types';
import { generateSwissQRCode, generateSwissQRData } from '@/lib/swissQR';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface SwissQRBillProps {
  invoice: Invoice;
}

export function SwissQRBill({ invoice }: SwissQRBillProps) {
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [qrData, setQrData] = useState<any>(null);
  const [customerAddress, setCustomerAddress] = useState<string>('');

  useEffect(() => {
    console.log('🟢 SwissQRBill component mounted');
    console.log('🟢 Invoice prop:', invoice);
    
    const loadQRData = async () => {
      try {
        setLoading(true);
        
        // Fetch customer address
        if (invoice.customerName) {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              const { data: profile } = await supabase
                .from('user_profiles')
                .select('vendor_id')
                .eq('user_id', user.id)
                .single();

              if (profile?.vendor_id) {
                const { data: customer } = await supabase
                  .from('customers')
                  .select('address')
                  .eq('vendor_id', profile.vendor_id)
                  .eq('name', invoice.customerName)
                  .single();

                if (customer && customer.address) {
                  setCustomerAddress(customer.address);
                  console.log('🟢 Customer address found:', customer.address);
                } else {
                  console.log('🟡 No customer address found for:', invoice.customerName);
                }
              }
            }
          } catch (error) {
            console.error('🔴 Error fetching customer address:', error);
          }
        }
        
        console.log('🟢 About to call generateSwissQRData');
        const data = await generateSwissQRData(invoice);
        console.log('🟢 QR data received:', data);
        setQrData(data);
        
        console.log('🟢 Starting QR generation for invoice:', invoice.number);
        const qrCode = await generateSwissQRCode(invoice);
        console.log('🟢 QR Code generated successfully');
        setQrCodeDataURL(qrCode);
        
        console.warn('🎯 DASHBOARD QR BAŞARIYLA OLUŞTURULDU!');
        console.log('QR Code length:', qrCode.length);
      } catch (error) {
        console.error('🔴 Error loading QR data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadQRData();
  }, [invoice]);

  if (!qrData) {
    console.log('🔴 QR Data yok, loading state gösteriliyor');
    return <div>QR-Daten werden geladen...</div>;
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Swiss QR Bill Container with proper frame */}
      <div className="bg-white border border-gray-800 md:border-2 shadow-lg overflow-hidden">
        <div className="flex flex-col lg:flex-row h-auto min-h-[400px]">
          {/* Left Side - Empfangsschein (Receipt) */}
          <div className="w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r-2 border-gray-800 p-4 md:p-6 flex flex-col">
            <h2 className="text-base md:text-lg font-bold mb-4 md:mb-6 text-gray-900">Empfangsschein</h2>
            
            {/* Konto / Zahlbar an */}
            <div className="mb-3 md:mb-4">
              <h4 className="text-xs font-bold mb-1 md:mb-2 text-gray-900">Konto / Zahlbar an</h4>
              <div className="text-xs text-gray-900 leading-tight">
                <div className="font-mono">{qrData.account}</div>
                <div className="font-semibold mt-1">{qrData.creditorName}</div>
                <div>{qrData.creditorStreetOrAddressLine1}</div>
                {qrData.creditorBuildingNumberOrAddressLine2 && (
                  <div>{qrData.creditorBuildingNumberOrAddressLine2}</div>
                )}
                <div>{qrData.creditorPostalCode} {qrData.creditorTown}</div>
              </div>
            </div>

            {/* Zahlbar durch */}
            {invoice.customerName && (
              <div className="mb-3 md:mb-4">
                <h4 className="text-xs font-bold mb-1 md:mb-2 text-gray-900">Zahlbar durch</h4>
                <div className="text-xs text-gray-900 leading-tight">
                  <div className="font-semibold">{invoice.customerName}</div>
                  {customerAddress ? (
                    customerAddress.split('\n').map((line, index) => (
                      <div key={index}>{line}</div>
                    ))
                  ) : (
                    <div className="text-gray-500 italic">Adresse nicht verfügbar</div>
                  )}
                </div>
              </div>
            )}

            {/* Währung / Betrag */}
            <div className="mb-4 md:mb-6">
              <h4 className="text-xs font-bold mb-1 md:mb-2 text-gray-900">Währung / Betrag</h4>
              <div className="flex items-baseline space-x-2">
                <span className="text-xs text-gray-900">CHF</span>
                <span className="text-lg md:text-xl font-bold text-gray-900">
                  {invoice.total.toLocaleString('de-CH', { 
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2 
                  })}
                </span>
              </div>
            </div>

            {/* Annahmestelle */}
            <div className="mt-auto hidden lg:block">
              <h4 className="text-xs font-bold mb-1 md:mb-2 text-gray-900">Annahmestelle</h4>
              <div className="h-8 md:h-12 border-b border-gray-400"></div>
            </div>
          </div>

          {/* Right Side - Zahlteil (Payment Part) */}
          <div className="flex-1 p-4 md:p-6">
            <h2 className="text-base md:text-lg font-bold mb-4 md:mb-6 text-gray-900">Zahlteil</h2>
            
            <div className="flex flex-col md:flex-row gap-4 md:gap-8">
              {/* QR Code Section */}
              <div className="flex-shrink-0 flex justify-start md:justify-center md:block">
                {loading ? (
                  <div className="w-32 h-32 md:w-48 md:h-48 bg-gray-100 border border-gray-300 flex items-center justify-center">
                    <span className="text-sm text-gray-500">QR-Code wird geladen...</span>
                  </div>
                ) : (
                  <div className="relative w-32 h-32 md:w-48 md:h-48 border border-gray-300">
                    <img 
                      src={qrCodeDataURL} 
                      alt="Swiss QR Code" 
                      className="w-full h-full object-contain"
                    />
                    {/* Swiss Cross in center */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-5 h-5 md:w-7 md:h-7 bg-white border border-gray-400 flex items-center justify-center">
                        <span className="text-red-600 font-bold text-sm md:text-lg">+</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Information */}
              <div className="flex-1 space-y-3 md:space-y-5">
                {/* Währung / Betrag */}
                <div>
                  <h4 className="text-xs md:text-sm font-bold mb-1 md:mb-2 text-gray-900">Währung / Betrag</h4>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-xs md:text-sm text-gray-900">CHF</span>
                    <span className="text-xl md:text-3xl font-bold text-gray-900">
                      {invoice.total.toLocaleString('de-CH', { 
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2 
                      })}
                    </span>
                  </div>
                </div>

                {/* Konto / Zahlbar an */}
                <div>
                  <h4 className="text-xs md:text-sm font-bold mb-1 md:mb-2 text-gray-900">Konto / Zahlbar an</h4>
                  <div className="text-xs md:text-sm text-gray-900 leading-relaxed">
                    <div className="font-mono">{qrData.account}</div>
                    <div className="font-semibold mt-1">{qrData.creditorName}</div>
                    <div>{qrData.creditorStreetOrAddressLine1}</div>
                    {qrData.creditorBuildingNumberOrAddressLine2 && (
                      <div>{qrData.creditorBuildingNumberOrAddressLine2}</div>
                    )}
                    <div>{qrData.creditorPostalCode} {qrData.creditorTown}</div>
                  </div>
                </div>

                {/* Zahlbar durch */}
                {invoice.customerName && (
                  <div>
                    <h4 className="text-xs md:text-sm font-bold mb-1 md:mb-2 text-gray-900">Zahlbar durch</h4>
                    <div className="text-xs md:text-sm text-gray-900 leading-relaxed">
                      <div className="font-semibold">{invoice.customerName}</div>
                      {customerAddress ? (
                        customerAddress.split('\n').map((line, index) => (
                          <div key={index}>{line}</div>
                        ))
                      ) : (
                        <div className="text-gray-500 italic">Adresse nicht verfügbar</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Zusätzliche Informationen */}
                <div>
                  <h4 className="text-xs md:text-sm font-bold mb-1 md:mb-2 text-gray-900">Zusätzliche Informationen</h4>
                  <div className="text-xs md:text-sm text-gray-900 leading-relaxed">
                    <div>Rechnung {invoice.number}</div>
                    <div>Fälligkeitsdatum: {format(new Date(invoice.dueDate), 'dd.MM.yyyy', { locale: de })}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Perforated separation line */}
        <div className="border-t border-dashed md:border-t-2 border-gray-400"></div>
      </div>
    </div>
  );
}