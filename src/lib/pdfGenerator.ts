import jsPDF from 'jspdf';
import { Invoice } from '@/types';
import { generateSwissQRCode } from './swissQR';
// import { settingsStorage } from './storage-simple'; // DISABLED
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export async function generateInvoicePDF(invoice: Invoice): Promise<void> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  // Load settings from Supabase
  const { supabase } = await import('@/integrations/supabase/client');
  
  let settings = {
    name: 'Meine Firma',
    address: '',
    phone: '',
    email: '',
    taxNumber: '',
    qrIban: '',
    bankName: '',
    logo: '',
    invoiceNumberFormat: 'F-{YYYY}-{MM}-{###}',
    defaultDueDays: 30,
    defaultTaxRate: 8.1,
    contactPerson: '',
    contactPosition: ''
  };

  try {
    // Get user's vendor ID first
    const { data: { user } } = await supabase.auth.getUser();
    console.log('🔍 PDF Generator - User found:', user?.id);
    
    if (user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('vendor_id')
        .eq('user_id', user.id)
        .single();
      
      console.log('🔍 PDF Generator - Profile data:', profile);

      if (profile?.vendor_id) {
        // Get company settings for this vendor
        const { data: companySettings, error: settingsError } = await supabase
          .from('company_settings')
          .select('*')
          .eq('vendor_id', profile.vendor_id)
          .single();
        
        console.log('🔍 PDF Generator - Company Settings Query Result:', {
          data: companySettings,
          error: settingsError,
          vendor_id: profile.vendor_id
        });

        if (companySettings) {
          settings = {
            name: companySettings.name || 'Meine Firma',
            address: companySettings.address || '',
            phone: companySettings.phone || '',
            email: companySettings.email || '',
            taxNumber: companySettings.tax_number || '',
            qrIban: companySettings.qr_iban || '',
            bankName: companySettings.bank_name || '',
            logo: companySettings.logo || '',
            invoiceNumberFormat: companySettings.invoice_number_format || 'F-{YYYY}-{MM}-{###}',
            defaultDueDays: companySettings.default_due_days || 30,
            defaultTaxRate: companySettings.default_tax_rate || 8.1,
            contactPerson: '',
            contactPosition: ''
          };
          
          console.log('🔍 PDF Generator - Final Settings:', {
            name: settings.name,
            address: settings.address,
            addressLength: settings.address?.length || 0,
            hasAddress: !!settings.address
          });
        } else {
          console.warn('🟡 PDF Generator - No company settings found for vendor:', profile.vendor_id);
        }
      } else {
        console.warn('🟡 PDF Generator - No vendor_id found in profile');
      }
    } else {
      console.warn('🟡 PDF Generator - No user authenticated');
    }
  } catch (error) {
    console.error('🔴 Error loading company settings from Supabase:', error);
    // Will use default settings if database query fails
  }
  
  console.log('PDF Generator - Loaded settings:', settings);
  
  // === MODERN SWISS INVOICE DESIGN ===
  
  // Define colors for the modern design (as tuples for TypeScript)
  const brandColor: [number, number, number] = [41, 128, 185]; // Professional blue
  const lightGray: [number, number, number] = [248, 249, 250];
  const darkGray: [number, number, number] = [52, 58, 64];
  const mediumGray: [number, number, number] = [108, 117, 125];
  
  // Page dimensions
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  
  let yPosition = margin;
  
  // === HEADER SECTION ===
  
  // Company logo and name (left side)
  if (settings.logo) {
    try {
      pdf.addImage(settings.logo, 'JPEG', margin, yPosition, 30, 20);
      yPosition += 25;
    } catch (error) {
      console.error('Error loading logo:', error);
    }
  }
  
  // Company name with modern typography
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.setTextColor(...brandColor);
  pdf.text(settings.name || 'Ihr Unternehmen', margin, yPosition);
  
  // Invoice title and number (right side)
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(24);
  pdf.setTextColor(...darkGray);
  pdf.text('RECHNUNG', pageWidth - margin, yPosition, { align: 'right' });
  
  yPosition += 8;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(12);
  pdf.setTextColor(...mediumGray);
  pdf.text(`Nr. ${invoice.number}`, pageWidth - margin, yPosition, { align: 'right' });
  
  yPosition += 15;
  
  // === COMPANY DETAILS AND INVOICE INFO ===
  
  // Split into two columns
  const leftColumnWidth = contentWidth * 0.45;
  const rightColumnWidth = contentWidth * 0.45;
  const columnGap = contentWidth * 0.1;
  
  // Left column - Company details
  let leftY = yPosition;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(...mediumGray);
  
  if (settings.address) {
    const addressLines = settings.address.split('\n');
    addressLines.forEach((line) => {
      pdf.text(line, margin, leftY);
      leftY += 4;
    });
  }
  
  if (settings.phone) {
    leftY += 2;
    pdf.text(`Telefon: ${settings.phone}`, margin, leftY);
    leftY += 4;
  }
  
  if (settings.email) {
    pdf.text(`E-Mail: ${settings.email}`, margin, leftY);
    leftY += 4;
  }
  
  if (settings.taxNumber) {
    leftY += 2;
    pdf.text(`UID: ${settings.taxNumber}`, margin, leftY);
    leftY += 4;
  }
  
  // Right column - Invoice details in a styled box
  const rightColumnX = pageWidth - margin - rightColumnWidth;
  let rightY = yPosition;
  
  // Invoice details box background
  pdf.setFillColor(...lightGray);
  pdf.roundedRect(rightColumnX - 5, rightY - 5, rightColumnWidth + 10, 35, 3, 3, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(...darkGray);
  
  // Invoice details
  const invoiceDetails = [
    ['Rechnungsdatum:', format(new Date(invoice.date), 'dd.MM.yyyy', { locale: de })],
    ['Fälligkeitsdatum:', format(new Date(invoice.dueDate), 'dd.MM.yyyy', { locale: de })],
    ['Zahlungsziel:', `${Math.ceil((new Date(invoice.dueDate).getTime() - new Date(invoice.date).getTime()) / (1000 * 60 * 60 * 24))} Tage`]
  ];
  
  invoiceDetails.forEach(([label, value]) => {
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...mediumGray);
    pdf.text(label, rightColumnX, rightY);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...darkGray);
    pdf.text(value, rightColumnX + 40, rightY);
    rightY += 6;
  });
  
  yPosition = Math.max(leftY, rightY) + 20;
  
  // === CUSTOMER ADDRESS SECTION ===
  
  // Fetch and display customer details
  let customerAddress = '';
  let customerData: any = null;
  
  try {
    if (invoice.customerName) {
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
            .select('*')
            .eq('vendor_id', profile.vendor_id)
            .eq('name', invoice.customerName)
            .single();

          if (customer) {
            customerData = customer;
            customerAddress = customer.address || '';
          }
        }
      }
    }
  } catch (error) {
    console.log('Could not fetch customer address:', error);
  }
  
  // Customer address box
  if (invoice.customerName) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(...darkGray);
    pdf.text('Rechnungsadresse', margin, yPosition);
    yPosition += 8;
    
    // Address box with border
    const addressBoxHeight = 25;
    pdf.setDrawColor(...brandColor);
    pdf.setLineWidth(0.5);
    pdf.rect(margin, yPosition, leftColumnWidth, addressBoxHeight);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(...darkGray);
    pdf.text(invoice.customerName, margin + 3, yPosition + 6);
    
    if (customerAddress) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(...mediumGray);
      const addressLines = customerAddress.split('\n');
      let addressY = yPosition + 12;
      addressLines.forEach((line) => {
        if (line.trim()) {
          pdf.text(line.trim(), margin + 3, addressY);
          addressY += 4;
        }
      });
    }
    
    yPosition += addressBoxHeight + 20;
  }
  
  // === PERSONALIZED GREETING ===
  
  let greeting = 'Sehr geehrte Damen und Herren';
  
  if (customerData?.contact_person && customerData.contact_person.trim()) {
    const contactPerson = customerData.contact_person.trim();
    if (customerData.contact_gender === 'male') {
      greeting = `Sehr geehrter Herr ${contactPerson}`;
    } else if (customerData.contact_gender === 'female') {
      greeting = `Sehr geehrte Frau ${contactPerson}`;
    } else {
      greeting = `Sehr geehrte/r ${contactPerson}`;
    }
  }
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  pdf.setTextColor(...darkGray);
  pdf.text(greeting, margin, yPosition);
  yPosition += 8;
  
  pdf.text('Für die erbrachten Leistungen stellen wir Ihnen folgende Positionen in Rechnung:', margin, yPosition);
  yPosition += 15;
  
  // === MODERN ITEMS TABLE ===
  
  // Table header with background
  const tableStartY = yPosition;
  const headerHeight = 10;
  const rowHeight = 8;
  
  // Calculate table width to ensure it fits within page margins
  const tableWidth = Math.min(contentWidth, 170); // Limit table width to prevent overflow
  console.log('🔍 Table dimensions:', {
    contentWidth,
    tableWidth,
    pageWidth,
    margin
  });
  
  // Header background
  pdf.setFillColor(...brandColor);
  pdf.rect(margin, yPosition, tableWidth, headerHeight, 'F');
  
  // Header text
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(255, 255, 255);
  
  const columns = [
    { text: 'Pos.', x: margin + 3, width: 15 },
    { text: 'Beschreibung', x: margin + 20, width: 90 },
    { text: 'Menge', x: margin + 115, width: 20 },
    { text: 'Einzelpreis', x: margin + 140, width: 25 },
    { text: 'Betrag', x: margin + 170, width: 25 }
  ];
  
  columns.forEach(col => {
    pdf.text(col.text, col.x, yPosition + 7);
  });
  
  yPosition += headerHeight;
  
  // Table rows
  invoice.items.forEach((item, index) => {
    // Alternating row colors
    if (index % 2 === 0) {
      pdf.setFillColor(...lightGray);
      pdf.rect(margin, yPosition, tableWidth, rowHeight, 'F');
    }
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(...darkGray);
    
    // Position number
    pdf.text((index + 1).toString(), margin + 3, yPosition + 6);
    
    // Description (with text wrapping if needed)
    const maxDescWidth = 85;
    const descLines = pdf.splitTextToSize(item.description, maxDescWidth);
    pdf.text(descLines[0], margin + 20, yPosition + 6);
    
    // Quantity
    pdf.text(item.quantity.toString(), margin + 115, yPosition + 6);
    
    // Unit price
    pdf.text(`CHF ${item.unitPrice.toFixed(2)}`, margin + 140, yPosition + 6);
    
    // Total
    pdf.setFont('helvetica', 'bold');
    pdf.text(`CHF ${item.total.toFixed(2)}`, margin + 170, yPosition + 6);
    
    yPosition += rowHeight;
  });
  
  // Table border
  pdf.setDrawColor(...mediumGray);
  pdf.setLineWidth(0.3);
  pdf.rect(margin, tableStartY, tableWidth, yPosition - tableStartY);
  
  yPosition += 10;
  
  // === TOTALS SECTION ===
  
  const totalsX = pageWidth - margin - 80;
  
  // Subtotal
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(...mediumGray);
  pdf.text('Zwischensumme:', totalsX, yPosition);
  pdf.setTextColor(...darkGray);
  pdf.text(`CHF ${invoice.subtotal.toFixed(2)}`, pageWidth - margin, yPosition, { align: 'right' });
  yPosition += 6;
  
  // Tax
  if (invoice.taxTotal > 0) {
    pdf.setTextColor(...mediumGray);
    pdf.text('MwSt.:', totalsX, yPosition);
    pdf.setTextColor(...darkGray);
    pdf.text(`CHF ${invoice.taxTotal.toFixed(2)}`, pageWidth - margin, yPosition, { align: 'right' });
    yPosition += 6;
  }
  
  // Total with emphasis
  pdf.setDrawColor(...brandColor);
  pdf.setLineWidth(1);
  pdf.line(totalsX, yPosition, pageWidth - margin, yPosition);
  yPosition += 5;
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.setTextColor(...brandColor);
  pdf.text('Gesamtbetrag:', totalsX, yPosition);
  pdf.text(`CHF ${invoice.total.toFixed(2)}`, pageWidth - margin, yPosition, { align: 'right' });
  
  yPosition += 20;
  
  // === CLOSING SECTION ===
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(...darkGray);
  
  const dueDays = Math.ceil((new Date(invoice.dueDate).getTime() - new Date(invoice.date).getTime()) / (1000 * 60 * 60 * 24));
  pdf.text(`Zahlbar innerhalb ${dueDays} Tagen ohne Abzug.`, margin, yPosition);
  yPosition += 6;
  pdf.text('Vielen Dank für Ihr Vertrauen und Ihren Auftrag.', margin, yPosition);
  yPosition += 12;
  
  pdf.text('Freundliche Grüsse', margin, yPosition);
  yPosition += 8;
  
  pdf.setFont('helvetica', 'bold');
  if (settings.contactPerson && settings.contactPerson.trim()) {
    pdf.text(settings.contactPerson, margin, yPosition);
    if (settings.contactPosition && settings.contactPosition.trim()) {
      yPosition += 4;
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...mediumGray);
      pdf.text(settings.contactPosition, margin, yPosition);
    }
  } else {
    pdf.text(settings.name || 'Ihr Unternehmen', margin, yPosition);
  }
  
  yPosition += 15;
  
  // Notes section
  if (invoice.notes) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(...darkGray);
    pdf.text('Bemerkungen:', margin, yPosition);
    yPosition += 6;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...mediumGray);
    const noteLines = pdf.splitTextToSize(invoice.notes, contentWidth);
    pdf.text(noteLines, margin, yPosition);
    yPosition += noteLines.length * 4 + 10;
  }
  
  // === MODERN SWISS QR PAYMENT SECTION ===
  // Check if we need a new page for QR section
  if (yPosition > pageHeight - 120) {
    pdf.addPage();
    yPosition = margin;
  } else {
    yPosition += 20;
  }
  
  // QR Section Header with icon
  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  
  // Draw QR icon (Swiss style)
  pdf.setFillColor(0, 0, 0);
  pdf.rect(margin, yPosition - 3, 6, 6, 'F');
  pdf.setFillColor(255, 255, 255);
  pdf.rect(margin + 1.5, yPosition - 1.5, 3, 3, 'F');
  
  pdf.text('Zahlteil (Swiss QR)', margin + 10, yPosition + 2);
  yPosition += 12;
  
  try {
    console.warn('🔄 PDF OLUŞTURULUYOR - QR KODUNA BAŞLIYORUZ');
    console.log('=== PDF QR Generation Debug ===');
    console.log('Invoice for QR:', {
      number: invoice.number,
      total: invoice.total,
      customerName: invoice.customerName,
      dueDate: invoice.dueDate
    });
    
    const qrCodeDataURL = await generateSwissQRCode(invoice);
    console.warn('✅ QR CODE BAŞARIYLA OLUŞTURULDU!');
    console.log('QR Code Data URL generated successfully, length:', qrCodeDataURL.length);
    console.log('=== End PDF QR Debug ===');
    
    // Swiss QR Bill with full page width
    const qrBillHeight = 105;
    const qrBillPadding = 4;
    const qrBillWidth = contentWidth; // Use full content width
    const qrBillX = margin;
    
    // Main QR Bill frame
    pdf.setDrawColor(180, 180, 180);
    pdf.setLineWidth(0.3);
    pdf.rect(qrBillX, yPosition, qrBillWidth, qrBillHeight, 'S');
    
    // Grid system: left 62mm, right remaining area
    const leftSectionWidth = 62;
    const rightSectionWidth = qrBillWidth - leftSectionWidth;
    const exactMiddle = qrBillX + leftSectionWidth;
    
    // === LEFT SIDE: EMPFANGSSCHEIN (RECEIPT) ===
    const receiptX = qrBillX + qrBillPadding;
    const maxReceiptWidth = leftSectionWidth - (qrBillPadding * 2);
    let receiptY = yPosition + qrBillPadding;
    
    // Receipt title
    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Empfangsschein', receiptX, receiptY);
    receiptY += 12;
    
    // Konto / Zahlbar an
    pdf.setFontSize(6);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Konto / Zahlbar an', receiptX, receiptY);
    receiptY += 5;
    pdf.setFontSize(8);
    const iban = settings.qrIban || 'CH4431999123000889012';
    pdf.text(iban, receiptX, receiptY);
    receiptY += 4;
    
    // Split long text to fit in receipt area
    console.log('🔍 PDF Generator - Company settings:', {
      name: settings.name,
      address: settings.address,
      hasAddress: !!settings.address
    });
    
    const companyNameLines = pdf.splitTextToSize(settings.name || 'Ihr Unternehmen', maxReceiptWidth);
    pdf.text(companyNameLines, receiptX, receiptY);
    receiptY += companyNameLines.length * 4;
    
    if (settings.address) {
      console.log('🔍 Processing company address for Empfangsschein:', settings.address);
      const addressLines = settings.address.split('\n').slice(0, 2);
      console.log('🔍 Address lines:', addressLines);
      addressLines.forEach((line) => {
        if (line && line.trim()) {
          const splitLines = pdf.splitTextToSize(line.trim(), maxReceiptWidth);
          pdf.text(splitLines, receiptX, receiptY);
          receiptY += splitLines.length * 4;
        }
      });
    } else {
      console.warn('🟡 No company address found in settings!');
      // Fallback: Add placeholder text to indicate missing address
      pdf.setFontSize(7);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Adresse nicht konfiguriert', receiptX, receiptY);
      pdf.setFontSize(8);
      pdf.setTextColor(0, 0, 0);
      receiptY += 4;
    }
    receiptY += 6;
    
    // Zahlbar durch
    if (invoice.customerName) {
      pdf.setFontSize(6);
      pdf.text('Zahlbar durch', receiptX, receiptY);
      receiptY += 5;
      pdf.setFontSize(8);
      
      console.log('🔍 Empfangsschein - Customer data:', {
        name: invoice.customerName,
        address: customerAddress,
        hasAddress: !!customerAddress
      });
      
      const customerNameLines = pdf.splitTextToSize(invoice.customerName, maxReceiptWidth);
      pdf.text(customerNameLines, receiptX, receiptY);
      receiptY += customerNameLines.length * 4;
      
      // Add customer address if available
      if (customerAddress && customerAddress.trim()) {
        const addressLines = customerAddress.split('\n');
        addressLines.forEach((line) => {
          if (line && line.trim()) {
            const splitLines = pdf.splitTextToSize(line.trim(), maxReceiptWidth);
            pdf.text(splitLines, receiptX, receiptY);
            receiptY += splitLines.length * 4;
          }
        });
      } else {
        // Show placeholder if no address available
        pdf.setFontSize(7);
        pdf.setTextColor(100, 100, 100);
        pdf.text('Adresse nicht verfügbar', receiptX, receiptY);
        pdf.setFontSize(8);
        pdf.setTextColor(0, 0, 0);
        receiptY += 4;
      }
      
      receiptY += 6;
    }
    
    // Währung / Betrag
    pdf.setFontSize(6);
    pdf.text('Währung / Betrag', receiptX, receiptY);
    receiptY += 5;
    pdf.setFontSize(8);
    pdf.text(`CHF ${invoice.total.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, receiptX, receiptY);
    receiptY += 12;
    
    // Annahmestelle
    pdf.setFontSize(6);
    pdf.text('Annahmestelle', receiptX, receiptY);
    
    // Vertical separator line at exactly 62mm
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.2);
    pdf.line(exactMiddle, yPosition, exactMiddle, yPosition + qrBillHeight);
    
    // === RIGHT SIDE: ZAHLTEIL (PAYMENT PART) ===
    const paymentX = exactMiddle + qrBillPadding;
    let paymentY = yPosition + qrBillPadding;
    
    // Payment title
    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Zahlteil', paymentX, paymentY);
    paymentY += 15;
    
    // Right side grid: QR code area and details area
    const qrAreaWidth = 50;
    const detailsAreaWidth = rightSectionWidth - qrAreaWidth - (qrBillPadding * 2);
    
    // QR Code
    const qrSize = 46;
    const qrCodeX = paymentX;
    const qrCodeY = paymentY;
    
    const qrCodeBase64 = qrCodeDataURL.split(',')[1];
    pdf.addImage(qrCodeBase64, 'PNG', qrCodeX, qrCodeY, qrSize, qrSize);
    
    // Payment details (right of QR code)
    const detailsX = paymentX + qrAreaWidth + 6;
    const maxDetailsWidth = detailsAreaWidth - 8;
    let detailsY = qrCodeY;
    
    // Währung / Betrag
    pdf.setFontSize(6);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Währung / Betrag', detailsX, detailsY);
    detailsY += 5;
    pdf.setFontSize(11);
    pdf.text(`CHF ${invoice.total.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, detailsX, detailsY);
    detailsY += 10;
    
    // Konto / Zahlbar an
    pdf.setFontSize(6);
    pdf.text('Konto / Zahlbar an', detailsX, detailsY);
    detailsY += 5;
    pdf.setFontSize(8);
    pdf.text(iban, detailsX, detailsY);
    detailsY += 4;
    
    const detailsCompanyLines = pdf.splitTextToSize(settings.name || 'Ihr Unternehmen', maxDetailsWidth);
    pdf.text(detailsCompanyLines, detailsX, detailsY);
    detailsY += detailsCompanyLines.length * 4;
    
    if (settings.address) {
      console.log('🔍 Processing company address for Zahlteil:', settings.address);
      const addressLines = settings.address.split('\n').slice(0, 2);
      addressLines.forEach((line) => {
        if (line && line.trim()) {
          const splitLines = pdf.splitTextToSize(line.trim(), maxDetailsWidth);
          pdf.text(splitLines, detailsX, detailsY);
          detailsY += splitLines.length * 4;
        }
      });
    } else {
      console.warn('🟡 No company address found for Zahlteil!');
      // Fallback: Add placeholder text to indicate missing address
      pdf.setFontSize(7);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Adresse nicht konfiguriert', detailsX, detailsY);
      pdf.setFontSize(8);
      pdf.setTextColor(0, 0, 0);
      detailsY += 4;
    }
    detailsY += 4;
    
    // Zahlbar durch
    if (invoice.customerName) {
      pdf.setFontSize(6);
      pdf.text('Zahlbar durch', detailsX, detailsY);
      detailsY += 5;
      pdf.setFontSize(8);
      
      console.log('🔍 Zahlteil - Customer data:', {
        name: invoice.customerName,
        address: customerAddress,
        hasAddress: !!customerAddress
      });
      
      const detailsCustomerLines = pdf.splitTextToSize(invoice.customerName, maxDetailsWidth);
      pdf.text(detailsCustomerLines, detailsX, detailsY);
      detailsY += detailsCustomerLines.length * 4;
      
      // Add customer address if available
      if (customerAddress && customerAddress.trim()) {
        const addressLines = customerAddress.split('\n');
        addressLines.forEach((line) => {
          if (line && line.trim()) {
            const splitLines = pdf.splitTextToSize(line.trim(), maxDetailsWidth);
            pdf.text(splitLines, detailsX, detailsY);
            detailsY += splitLines.length * 4;
          }
        });
      } else {
        // Show placeholder if no address available
        pdf.setFontSize(7);
        pdf.setTextColor(100, 100, 100);
        pdf.text('Adresse nicht verfügbar', detailsX, detailsY);
        pdf.setFontSize(8);
        pdf.setTextColor(0, 0, 0);
        detailsY += 4;
      }
    }
    
    // Additional information (below QR code)
    const additionalInfoY = qrCodeY + qrSize + 6;
    pdf.setFontSize(6);
    pdf.text('Zusätzliche Informationen', paymentX, additionalInfoY);
    pdf.setFontSize(8);
    pdf.text(`Rechnung ${invoice.number}`, paymentX, additionalInfoY + 4);
    pdf.text(`Fälligkeitsdatum: ${format(new Date(invoice.dueDate), 'dd.MM.yyyy')}`, paymentX, additionalInfoY + 8);
    
  } catch (error) {
    console.error('QR Code generation failed:', error);
    pdf.setFontSize(10);
    pdf.setTextColor(255, 0, 0);
    pdf.text('QR-Code konnte nicht generiert werden', margin, yPosition + 30);
  }
  
  // Footer notice - safe positioning
  const footerY = Math.max(yPosition + 75, pageHeight - 30);
  pdf.setFontSize(7);
  pdf.setTextColor(120, 120, 120);
  pdf.text('Dies ist eine automatisch generierte Rechnung. Ersetzen Sie die Platzhalter-IBAN mit Ihrer produktiven IBAN.', margin, footerY);
  
  // Save the PDF
  const fileName = `Rechnung_${invoice.number}_${invoice.customerName?.replace(/[^a-zA-Z0-9]/g, '_') || 'Kunde'}.pdf`;
  pdf.save(fileName);
}
