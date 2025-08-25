import QRCode from 'qrcode';
import { Invoice } from '@/types';
import { supabase } from '@/integrations/supabase/client';

// Swiss QR Bill data structure according to official specification
export interface SwissQRData {
  // Header
  qrType: string;           // 1. QR Type (SPC)
  version: string;          // 2. Version (0200)
  codingType: string;       // 3. Coding Type (1)
  
  // Creditor Information
  account: string;          // 4. Account (IBAN)
  creditorAddressType: string;     // 5. Creditor Address Type (S or K)
  creditorName: string;            // 6. Creditor Name
  creditorStreetOrAddressLine1: string;  // 7. Creditor Street or Address Line 1
  creditorBuildingNumberOrAddressLine2: string; // 8. Creditor Building Number or Address Line 2
  creditorPostalCode: string;      // 9. Creditor Postal Code
  creditorTown: string;            // 10. Creditor Town
  creditorCountry: string;         // 11. Creditor Country
  
  // Ultimate Creditor Information (usually empty)
  ultimateCreditorAddressType: string;     // 12. Ultimate Creditor Address Type
  ultimateCreditorName: string;            // 13. Ultimate Creditor Name
  ultimateCreditorStreetOrAddressLine1: string;  // 14. Ultimate Creditor Street or Address Line 1
  ultimateCreditorBuildingNumberOrAddressLine2: string; // 15. Ultimate Creditor Building Number or Address Line 2
  ultimateCreditorPostalCode: string;      // 16. Ultimate Creditor Postal Code
  ultimateCreditorTown: string;            // 17. Ultimate Creditor Town
  ultimateCreditorCountry: string;         // 18. Ultimate Creditor Country
  
  // Payment Information
  amount: string;           // 19. Amount
  currency: string;         // 20. Currency (CHF or EUR)
  
  // Ultimate Debtor Information
  ultimateDebtorAddressType: string;       // 21. Ultimate Debtor Address Type
  ultimateDebtorName: string;              // 22. Ultimate Debtor Name
  ultimateDebtorStreetOrAddressLine1: string;    // 23. Ultimate Debtor Street or Address Line 1
  ultimateDebtorBuildingNumberOrAddressLine2: string; // 24. Ultimate Debtor Building Number or Address Line 2
  ultimateDebtorPostalCode: string;        // 25. Ultimate Debtor Postal Code
  ultimateDebtorTown: string;              // 26. Ultimate Debtor Town
  ultimateDebtorCountry: string;           // 27. Ultimate Debtor Country
  
  // Payment Reference
  paymentReferenceType: string;    // 28. Payment Reference Type (QRR, SCOR, NON)
  paymentReference: string;        // 29. Payment Reference
  
  // Additional Information
  unstructuredMessage: string;     // 30. Unstructured Message
  billInformation: string;         // 31. Bill Information
  
  // Alternative Schemes (usually empty)
  alternativeScheme1: string;      // 32. Alternative Scheme 1
  alternativeScheme2: string;      // 33. Alternative Scheme 2
}

// Validate Swiss IBAN
function validateSwissIBAN(iban: string): boolean {
  if (!iban) return false;
  
  // Remove spaces and convert to uppercase
  const cleanIban = iban.replace(/\s/g, '').toUpperCase();
  
  // Must be exactly 21 characters and start with CH
  if (cleanIban.length !== 21 || !cleanIban.startsWith('CH')) {
    return false;
  }
  
  // Check format: CH + 2 digits + 5 digits + 12 alphanumeric
  const ibanRegex = /^CH\d{2}\d{5}[A-Z0-9]{12}$/;
  return ibanRegex.test(cleanIban);
}

// Check if IBAN is QR-IBAN (institution ID 30000-31999)
function isQRIBAN(iban: string): boolean {
  if (!iban || iban.length !== 21) return false;
  
  const institutionId = iban.substring(4, 9);
  const id = parseInt(institutionId, 10);
  return id >= 30000 && id <= 31999;
}

// Calculate Mod-10 recursive checksum for QRR references
function calculateMod10RecursiveChecksum(numStr: string): number {
  const table = [
    [0,9,4,6,8,2,7,1,3,5],
    [9,4,6,8,2,7,1,3,5,0],
    [4,6,8,2,7,1,3,5,0,9],
    [6,8,2,7,1,3,5,0,9,4],
    [8,2,7,1,3,5,0,9,4,6],
    [2,7,1,3,5,0,9,4,6,8],
    [7,1,3,5,0,9,4,6,8,2],
    [1,3,5,0,9,4,6,8,2,7],
    [3,5,0,9,4,6,8,2,7,1],
    [5,0,9,4,6,8,2,7,1,3],
  ];
  
  let state = 0;
  for (const digit of numStr) {
    const d = parseInt(digit, 10);
    if (isNaN(d)) continue;
    state = table[state][d];
  }
  return (10 - state) % 10;
}

// Generate QRR reference (27 digits) for QR-IBAN
function generateQRRReference(invoiceNumber: string): string {
  // Extract only digits from invoice number
  const invoiceDigits = invoiceNumber.replace(/\D/g, '');
  
  // Create a base reference with invoice number and current date
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  
  // Combine: invoice digits + year + month + day, then pad to 26 digits
  const baseRef = (invoiceDigits + year + month + day).padStart(26, '0').slice(0, 26);
  
  // Calculate check digit
  const checkDigit = calculateMod10RecursiveChecksum(baseRef);
  
  return baseRef + checkDigit.toString();
}

// Calculate Mod-97 checksum for SCOR references
function calculateMod97(numericStr: string): number {
  let remainder = 0;
  for (const digit of numericStr) {
    remainder = (remainder * 10 + parseInt(digit, 10)) % 97;
  }
  return remainder;
}

// Convert alphanumeric to numeric for mod97 calculation
function toNumeric(s: string): string {
  let result = '';
  for (const char of s) {
    if (char >= '0' && char <= '9') {
      result += char;
    } else if (char >= 'A' && char <= 'Z') {
      result += (char.charCodeAt(0) - 55).toString(); // A=10, B=11, ..., Z=35
    }
  }
  return result;
}

// Generate SCOR reference for regular IBAN
function generateSCORReference(invoiceNumber: string): string {
  // Clean invoice number (only alphanumeric)
  const cleanInvoice = invoiceNumber.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 21);
  
  if (cleanInvoice.length === 0) {
    throw new Error('Invalid invoice number for SCOR reference');
  }
  
  // Calculate checksum: cleanInvoice + "RF00" -> mod97 -> 98-remainder
  const numericString = toNumeric(cleanInvoice + 'RF00');
  const remainder = calculateMod97(numericString);
  const checksum = (98 - remainder).toString().padStart(2, '0');
  
  return `RF${checksum}${cleanInvoice}`;
}

// Truncate string to maximum length and ensure it's not empty when required
function truncateString(str: string, maxLength: number, required: boolean = false): string {
  const truncated = (str || '').substring(0, maxLength);
  if (required && truncated.length === 0) {
    throw new Error(`Required field cannot be empty (max length: ${maxLength})`);
  }
  return truncated;
}

// Parse address into structured format
function parseAddress(address: string): { street: string; number: string; postalCode: string; city: string } {
  if (!address) {
    return { street: '', number: '', postalCode: '', city: '' };
  }
  
  const lines = address.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  let street = '';
  let number = '';
  let postalCode = '';
  let city = '';
  
  if (lines.length >= 1) {
    // Try to parse first line as "Street Number"
    const streetMatch = lines[0].match(/^(.+?)\s+(\d+[a-zA-Z]*)$/);
    if (streetMatch) {
      street = streetMatch[1].trim();
      number = streetMatch[2].trim();
    } else {
      street = lines[0];
    }
  }
  
  if (lines.length >= 2) {
    // Try to parse last line as "PostalCode City"
    const lastLine = lines[lines.length - 1];
    const postalMatch = lastLine.match(/^(\d{4})\s+(.+)$/);
    if (postalMatch) {
      postalCode = postalMatch[1];
      city = postalMatch[2];
    } else {
      city = lastLine;
    }
  }
  
  return { street, number, postalCode, city };
}

// Get company settings from Supabase
async function getCompanySettings() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    console.log('🔍 Swiss QR - User found:', user.id);

    // Get user's vendor ID first
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('vendor_id')
      .eq('user_id', user.id)
      .single();
    
    console.log('🔍 Swiss QR - Profile:', profile);

    if (!profile?.vendor_id) {
      throw new Error('No vendor found for current user');
    }

    // Get company settings using vendor_id
    const { data, error } = await supabase
      .from('company_settings')
      .select('*')
      .eq('vendor_id', profile.vendor_id)
      .single();

    console.log('🔍 Swiss QR - Company Settings Query Result:', {
      data: data,
      error: error,
      vendor_id: profile.vendor_id
    });

    if (error) {
      console.error('Error fetching company settings:', error);
      throw new Error('Failed to load company settings');
    }

    if (!data) {
      throw new Error('No company settings found');
    }

    const settings = {
      name: data.name || '',
      address: data.address || '',
      phone: data.phone || '',
      email: data.email || '',
      taxNumber: data.tax_number || '',
      qrIban: data.qr_iban || '',
      bankName: data.bank_name || '',
      logo: data.logo || '',
      invoiceNumberFormat: data.invoice_number_format || 'F-{YYYY}-{MM}-{###}',
      defaultDueDays: data.default_due_days || 30,
      defaultTaxRate: data.default_tax_rate || 8.1,
      senderEmail: data.sender_email || '',
      senderName: data.sender_name || '',
      emailSubjectTemplate: data.email_subject_template || '',
      emailBodyTemplate: data.email_body_template || ''
    };
    
    console.log('🔍 Swiss QR - Final Settings:', {
      name: settings.name,
      address: settings.address,
      addressLength: settings.address?.length || 0,
      hasAddress: !!settings.address
    });
    
    return settings;
  } catch (error) {
    console.error('Error getting company settings:', error);
    throw error;
  }
}

// Generate Swiss QR data according to official specification
export async function generateSwissQRData(invoice: Invoice): Promise<SwissQRData> {
  console.log('🔵 Generating Swiss QR data for invoice:', invoice.number);
  
  const settings = await getCompanySettings();
  
  // Validate required settings
  if (!settings.name) {
    throw new Error('Company name is required in settings');
  }
  
  if (!settings.address) {
    throw new Error('Company address is required in settings');
  }
  
  if (!settings.qrIban) {
    throw new Error('QR-IBAN is required in settings');
  }
  
  // Clean and validate IBAN
  const cleanIban = settings.qrIban.replace(/\s/g, '').toUpperCase();
  if (!validateSwissIBAN(cleanIban)) {
    throw new Error('Invalid Swiss IBAN format. Must be 21 characters starting with CH.');
  }
  
  // Parse company address
  const companyAddress = parseAddress(settings.address);
  
  // Get customer address if customer exists
  let customerAddress = { street: '', number: '', postalCode: '', city: '' };
  if (invoice.customerName) {
    try {
      console.log('🔍 Fetching customer address for:', invoice.customerName);
      const { data: customers } = await supabase
        .from('customers')
        .select('address')
        .eq('name', invoice.customerName)
        .limit(1);
      
      console.log('🔍 Customer query result:', customers);
      
      if (customers && customers.length > 0 && customers[0].address) {
        customerAddress = parseAddress(customers[0].address);
        console.log('✅ Customer address found and parsed:', customerAddress);
      } else {
        console.warn('⚠️ No customer address found for:', invoice.customerName);
      }
    } catch (error) {
      console.error('❌ Could not fetch customer address:', error);
      // Use default empty address if customer data not available
    }
  }
  
  // Determine payment reference type and generate reference
  let paymentReferenceType = 'NON';
  let paymentReference = '';
  
  if (isQRIBAN(cleanIban)) {
    // QR-IBAN requires QRR reference
    paymentReferenceType = 'QRR';
    paymentReference = generateQRRReference(invoice.number);
  } else {
    // Regular IBAN can use SCOR or NON
    try {
      paymentReference = generateSCORReference(invoice.number);
      paymentReferenceType = 'SCOR';
    } catch (error) {
      // If SCOR generation fails, use NON
      paymentReferenceType = 'NON';
      paymentReference = '';
    }
  }
  
  // Format amount (empty string if 0, otherwise with exactly 2 decimal places)
  const formattedAmount = invoice.total > 0 ? invoice.total.toFixed(2) : '';
  
  // Create QR data structure
  const qrData: SwissQRData = {
    // Header
    qrType: 'SPC',
    version: '0200',
    codingType: '1',
    
    // Creditor Information (Company)
    account: cleanIban,
    creditorAddressType: 'S', // Structured address
    creditorName: truncateString(settings.name, 70, true),
    creditorStreetOrAddressLine1: truncateString(companyAddress.street, 70),
    creditorBuildingNumberOrAddressLine2: truncateString(companyAddress.number, 16),
    creditorPostalCode: truncateString(companyAddress.postalCode, 16),
    creditorTown: truncateString(companyAddress.city, 35),
    creditorCountry: 'CH',
    
    // Ultimate Creditor Information (empty for standard use)
    ultimateCreditorAddressType: '',
    ultimateCreditorName: '',
    ultimateCreditorStreetOrAddressLine1: '',
    ultimateCreditorBuildingNumberOrAddressLine2: '',
    ultimateCreditorPostalCode: '',
    ultimateCreditorTown: '',
    ultimateCreditorCountry: '',
    
    // Payment Information
    amount: formattedAmount,
    currency: 'CHF',
    
    // Ultimate Debtor Information (Customer)
    ultimateDebtorAddressType: invoice.customerName && (customerAddress.postalCode || customerAddress.city) ? 'S' : '',
    ultimateDebtorName: truncateString(invoice.customerName || '', 70),
    ultimateDebtorStreetOrAddressLine1: truncateString(customerAddress.street, 70),
    ultimateDebtorBuildingNumberOrAddressLine2: truncateString(customerAddress.number, 16),
    ultimateDebtorPostalCode: truncateString(customerAddress.postalCode, 16),
    ultimateDebtorTown: truncateString(customerAddress.city, 35),
    ultimateDebtorCountry: invoice.customerName ? 'CH' : '',
    
    // Payment Reference
    paymentReferenceType: paymentReferenceType,
    paymentReference: paymentReference,
    
    // Additional Information
    unstructuredMessage: truncateString(`Rechnung ${invoice.number}`, 140),
    billInformation: '',
    
    // Alternative Schemes (empty)
    alternativeScheme1: '',
    alternativeScheme2: ''
  };
  
  console.log('✅ Swiss QR data generated:', qrData);
  return qrData;
}

// Format Swiss QR string according to official specification
export function formatSwissQRString(data: SwissQRData): string {
  // All 33 fields in exact order as per Swiss QR specification
  const fields = [
    data.qrType,                                    // 1
    data.version,                                   // 2
    data.codingType,                               // 3
    data.account,                                  // 4
    data.creditorAddressType,                      // 5
    data.creditorName,                             // 6
    data.creditorStreetOrAddressLine1,             // 7
    data.creditorBuildingNumberOrAddressLine2,     // 8
    data.creditorPostalCode,                       // 9
    data.creditorTown,                             // 10
    data.creditorCountry,                          // 11
    data.ultimateCreditorAddressType,              // 12
    data.ultimateCreditorName,                     // 13
    data.ultimateCreditorStreetOrAddressLine1,     // 14
    data.ultimateCreditorBuildingNumberOrAddressLine2, // 15
    data.ultimateCreditorPostalCode,               // 16
    data.ultimateCreditorTown,                     // 17
    data.ultimateCreditorCountry,                  // 18
    data.amount,                                   // 19
    data.currency,                                 // 20
    data.ultimateDebtorAddressType,                // 21
    data.ultimateDebtorName,                       // 22
    data.ultimateDebtorStreetOrAddressLine1,       // 23
    data.ultimateDebtorBuildingNumberOrAddressLine2, // 24
    data.ultimateDebtorPostalCode,                 // 25
    data.ultimateDebtorTown,                       // 26
    data.ultimateDebtorCountry,                    // 27
    data.paymentReferenceType,                     // 28
    data.paymentReference,                         // 29
    data.unstructuredMessage,                      // 30
    data.billInformation,                          // 31
    data.alternativeScheme1,                       // 32
    data.alternativeScheme2                        // 33
  ];
  
  // Join with LF (Line Feed) only - no carriage return
  return fields.join('\n');
}

// Generate Swiss QR Code
export async function generateSwissQRCode(invoice: Invoice): Promise<string> {
  console.log('🚀 Starting Swiss QR Code generation for invoice:', invoice.number);
  
  try {
    // Generate QR data
    const qrData = await generateSwissQRData(invoice);
    
    // Format as QR string
    const qrString = formatSwissQRString(qrData);
    
    // Validate QR string
    const lines = qrString.split('\n');
    if (lines.length !== 33) {
      throw new Error(`Invalid QR string: expected 33 lines, got ${lines.length}`);
    }
    
    // Validate critical fields
    if (lines[0] !== 'SPC') throw new Error('Invalid QR Type');
    if (lines[1] !== '0200') throw new Error('Invalid Version');
    if (lines[2] !== '1') throw new Error('Invalid Coding Type');
    if (lines[19] !== 'CHF') throw new Error('Invalid Currency');
    
    console.log('✅ QR string validation passed');
    console.log('📊 QR Data Summary:');
    console.log('- IBAN:', qrData.account);
    console.log('- Amount:', qrData.amount);
    console.log('- Reference Type:', qrData.paymentReferenceType);
    console.log('- Reference:', qrData.paymentReference);
    console.log('- String Length:', qrString.length);
    console.log('- Lines Count:', lines.length);
    
    // Generate QR code with optimal settings for Swiss QR
    const qrCodeDataURL = await QRCode.toDataURL(qrString, {
      errorCorrectionLevel: 'M',  // Medium error correction (Swiss standard)
      margin: 1,                  // Minimal margin
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 300,                 // Larger size for better scanning
      scale: 10                   // High scale for crisp rendering
    });
    
    console.log('✅ Swiss QR Code generated successfully');
    return qrCodeDataURL;
    
  } catch (error) {
    console.error('❌ Swiss QR Code generation failed:', error);
    throw error;
  }
}