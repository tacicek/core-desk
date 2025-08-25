import jsPDF from 'jspdf';
import { Offer, OfferItem } from '@/types/offer';
import { Customer } from '@/types';

interface OfferCustomer {
  id: string;
  name: string;
  email?: string;
  address?: string;
}

interface GenerateOfferPDFParams {
  offer: Offer;
  customer: OfferCustomer;
  items: OfferItem[];
  companyInfo?: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
}

export const generateOfferPDF = ({ offer, customer, items, companyInfo }: GenerateOfferPDFParams) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // === MODERN SWISS DESIGN COLORS ===
  const brandColor: [number, number, number] = [41, 128, 185];
  const lightGray: [number, number, number] = [248, 249, 250];
  const darkGray: [number, number, number] = [52, 58, 64];
  const mediumGray: [number, number, number] = [108, 117, 125];
  
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let yPosition = margin;
  
  // === HEADER SECTION ===
  
  // Company name with modern typography
  if (companyInfo) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...brandColor);
    doc.text(companyInfo.name, margin, yPosition);
  }
  
  // Offer title and number (right side)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(...darkGray);
  doc.text('ANGEBOT', pageWidth - margin, yPosition, { align: 'right' });
  
  yPosition += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(...mediumGray);
  doc.text(`Nr. ${offer.offer_no}`, pageWidth - margin, yPosition, { align: 'right' });
  
  yPosition += 15;
  
  // === COMPANY DETAILS AND OFFER INFO ===
  
  // Left column - Company details
  let leftY = yPosition;
  if (companyInfo) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...mediumGray);
    
    if (companyInfo.address) {
      const addressLines = companyInfo.address.split('\n');
      addressLines.forEach((line) => {
        doc.text(line, margin, leftY);
        leftY += 4;
      });
    }
    
    if (companyInfo.phone) {
      leftY += 2;
      doc.text(`Telefon: ${companyInfo.phone}`, margin, leftY);
      leftY += 4;
    }
    
    if (companyInfo.email) {
      doc.text(`E-Mail: ${companyInfo.email}`, margin, leftY);
      leftY += 4;
    }
  }
  
  // Right column - Offer details in styled box
  const rightColumnWidth = contentWidth * 0.45;
  const rightColumnX = pageWidth - margin - rightColumnWidth;
  let rightY = yPosition;
  
  // Offer details box background
  doc.setFillColor(...lightGray);
  doc.roundedRect(rightColumnX - 5, rightY - 5, rightColumnWidth + 10, 30, 3, 3, 'F');
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  // Offer details
  const offerDetails = [
    ['Angebotsdatum:', new Date(offer.issue_date).toLocaleDateString('de-CH')],
    ['Gültig bis:', offer.valid_until ? new Date(offer.valid_until).toLocaleDateString('de-CH') : 'Unbegrenzt']
  ];
  
  offerDetails.forEach(([label, value]) => {
    doc.setTextColor(...mediumGray);
    doc.text(label, rightColumnX, rightY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkGray);
    doc.text(value, rightColumnX + 40, rightY);
    doc.setFont('helvetica', 'normal');
    rightY += 6;
  });
  
  yPosition = Math.max(leftY, rightY) + 20;
  doc.text(`Datum: ${new Date(offer.issue_date).toLocaleDateString('de-DE')}`, pageWidth - 20, yPosition, { align: 'right' });
  
  if (offer.valid_until) {
    yPosition += 8;
    doc.text(`Gültig bis: ${new Date(offer.valid_until).toLocaleDateString('de-DE')}`, pageWidth - 20, yPosition, { align: 'right' });
  }
  
  // Customer information
  yPosition += 40;
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('Kunde:', 20, yPosition);
  
  yPosition += 8;
  doc.setFont(undefined, 'normal');
  doc.text(customer.name, 20, yPosition);
  
  if (customer.address) {
    yPosition += 6;
    const addressLines = customer.address.split('\n');
    addressLines.forEach(line => {
      doc.text(line, 20, yPosition);
      yPosition += 6;
    });
  }
  
  // Items table
  yPosition += 20;
  const tableTop = yPosition;
  
  // Table headers
  doc.setFont(undefined, 'bold');
  doc.text('Beschreibung', 20, tableTop);
  doc.text('Menge', pageWidth - 120, tableTop, { align: 'right' });
  doc.text('Einzelpreis', pageWidth - 80, tableTop, { align: 'right' });
  doc.text('MwSt.', pageWidth - 50, tableTop, { align: 'right' });
  doc.text('Betrag', pageWidth - 20, tableTop, { align: 'right' });
  
  // Table line
  yPosition = tableTop + 5;
  doc.line(20, yPosition, pageWidth - 20, yPosition);
  
  // Table content
  yPosition += 10;
  doc.setFont(undefined, 'normal');
  
  items.forEach((item) => {
    // Check if we need a new page
    if (yPosition > pageHeight - 50) {
      doc.addPage();
      yPosition = 30;
    }
    
    const subtotal = Number(item.qty) * Number(item.unit_price);
    
    doc.text(item.description, 20, yPosition);
    doc.text(item.qty.toString(), pageWidth - 120, yPosition, { align: 'right' });
    doc.text(`CHF ${Number(item.unit_price).toFixed(2)}`, pageWidth - 80, yPosition, { align: 'right' });
    doc.text(`${Number(item.tax_rate).toFixed(1)}%`, pageWidth - 50, yPosition, { align: 'right' });
    doc.text(`CHF ${item.line_total.toFixed(2)}`, pageWidth - 20, yPosition, { align: 'right' });
    
    yPosition += 8;
  });
  
  // Totals
  yPosition += 10;
  doc.line(pageWidth - 120, yPosition, pageWidth - 20, yPosition);
  
  yPosition += 10;
  doc.text('Zwischensumme:', pageWidth - 80, yPosition, { align: 'right' });
  doc.text(`CHF ${offer.subtotal.toFixed(2)}`, pageWidth - 20, yPosition, { align: 'right' });
  
  yPosition += 8;
  doc.text('MwSt.:', pageWidth - 80, yPosition, { align: 'right' });
  doc.text(`CHF ${offer.tax_total.toFixed(2)}`, pageWidth - 20, yPosition, { align: 'right' });
  
  yPosition += 8;
  doc.setFont(undefined, 'bold');
  doc.text('Gesamtsumme:', pageWidth - 80, yPosition, { align: 'right' });
  doc.text(`CHF ${offer.total.toFixed(2)}`, pageWidth - 20, yPosition, { align: 'right' });
  
  // Notes
  if (offer.notes) {
    yPosition += 20;
    doc.setFont(undefined, 'bold');
    doc.text('Anmerkungen:', 20, yPosition);
    yPosition += 8;
    doc.setFont(undefined, 'normal');
    const noteLines = doc.splitTextToSize(offer.notes, pageWidth - 40);
    doc.text(noteLines, 20, yPosition);
  }
  
  // Footer
  const footerY = pageHeight - 30;
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text('Dieses Angebot ist unverbindlich und wurde maschinell erstellt.', pageWidth / 2, footerY, { align: 'center' });
  
  // Save the PDF
  doc.save(`Angebot_${offer.offer_no}.pdf`);
};