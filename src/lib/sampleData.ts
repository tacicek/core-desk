import { Customer, Invoice, Product } from '@/types';
const generateId = () => crypto.randomUUID();

// Sample customers
export const sampleCustomers: Customer[] = [
  {
    id: generateId(),
    name: 'Musterfirma GmbH',
    email: 'info@musterfirma.ch',
    phone: '+41 44 123 45 67',
    address: 'Bahnhofstrasse 123\n8001 Zürich',
    street: 'Bahnhofstrasse',
    houseNumber: '123',
    postalCode: '8001',
    city: 'Zürich',
    taxNumber: '1234567890',
    createdAt: new Date('2024-01-15').toISOString()
  },
  {
    id: generateId(),
    name: 'ABC Solutions AG',
    email: 'buchhaltung@abc-solutions.ch',
    phone: '+41 31 987 65 43',
    address: 'Bundesplatz 15\n3011 Bern',
    street: 'Bundesplatz',
    houseNumber: '15',
    postalCode: '3011',
    city: 'Bern',
    taxNumber: '9876543210',
    createdAt: new Date('2024-02-01').toISOString()
  },
  {
    id: generateId(),
    name: 'Max Müller',
    email: 'max.mueller@example.ch',
    phone: '+41 79 123 45 67',
    address: 'Seestrasse 42\n8002 Zürich',
    street: 'Seestrasse',
    houseNumber: '42',
    postalCode: '8002',
    city: 'Zürich',
    createdAt: new Date('2024-02-15').toISOString()
  }
];

// Sample products
export const sampleProducts: Product[] = [
  {
    id: generateId(),
    name: 'Webdesign Service',
    description: 'Professionelle Website-Design und Entwicklung',
    price: 5000,
    taxRate: 7.7
  },
  {
    id: generateId(),
    name: 'SEO Beratung',
    description: 'Monatliche SEO-Optimierung und Berichterstattung',
    price: 1500,
    taxRate: 7.7
  },
  {
    id: generateId(),
    name: 'Logo Design',
    description: 'Corporate Identity und Logo-Design Service',
    price: 2000,
    taxRate: 7.7
  },
  {
    id: generateId(),
    name: 'Mobile App Entwicklung',
    description: 'iOS und Android App-Entwicklung',
    price: 15000,
    taxRate: 7.7
  }
];

// Sample invoices
export const createSampleInvoices = (customers: Customer[]): Invoice[] => {
  if (customers.length === 0) return [];

  return [
    {
      id: generateId(),
      number: 'F-2024-12-001',
      invoiceNumber: 'F-2024-12-001',
      customerName: customers[0].name,
      date: new Date('2024-12-01').toISOString(),
      dueDate: new Date('2024-12-31').toISOString(),
      items: [
        {
          id: generateId(),
          description: 'Webdesign Service',
          quantity: 1,
          unitPrice: 5000,
          taxRate: 7.7,
          total: 5000
        }
      ],
      subtotal: 5000,
      taxTotal: 385,
      total: 5385,
      status: 'paid',
      notes: 'Website wurde erfolgreich geliefert.',
      createdAt: new Date('2024-12-01').toISOString(),
      updatedAt: new Date('2024-12-01').toISOString()
    },
    {
      id: generateId(),
      number: 'F-2024-12-002',
      invoiceNumber: 'F-2024-12-002',
      customerName: customers[1].name,
      date: new Date('2024-12-05').toISOString(),
      dueDate: new Date('2025-01-04').toISOString(),
      items: [
        {
          id: generateId(),
          description: 'SEO Beratung',
          quantity: 1,
          unitPrice: 1500,
          taxRate: 7.7,
          total: 1500
        },
        {
          id: generateId(),
          description: 'Logo Design',
          quantity: 1,
          unitPrice: 2000,
          taxRate: 7.7,
          total: 2000
        }
      ],
      subtotal: 3500,
      taxTotal: 269.5,
      total: 3769.5,
      status: 'sent',
      notes: 'Logo-Überarbeitungsprozess läuft.',
      createdAt: new Date('2024-12-05').toISOString(),
      updatedAt: new Date('2024-12-05').toISOString()
    },
    {
      id: generateId(),
      number: 'F-2024-12-003',
      invoiceNumber: 'F-2024-12-003',
      customerName: customers[2].name,
      date: new Date('2024-12-10').toISOString(),
      dueDate: new Date('2025-01-09').toISOString(),
      items: [
        {
          id: generateId(),
          description: 'Mobile App Entwicklung',
          quantity: 1,
          unitPrice: 15000,
          taxRate: 7.7,
          total: 15000
        }
      ],
      subtotal: 15000,
      taxTotal: 1155,
      total: 16155,
      status: 'draft',
      notes: 'Projekt in Entwicklungsphase.',
      createdAt: new Date('2024-12-10').toISOString(),
      updatedAt: new Date('2024-12-10').toISOString()
    }
  ];
};

// Initialize sample data
export const initializeSampleData = () => {
  try {
    let existingCustomers = [];
    let existingInvoices = [];
    let existingProducts = [];

    // Safely parse existing data
    try {
      const customersData = localStorage.getItem('invoice-app-customers');
      existingCustomers = customersData ? JSON.parse(customersData) : [];
      if (!Array.isArray(existingCustomers)) existingCustomers = [];
    } catch (error) {
      console.error('Error parsing customers data:', error);
      existingCustomers = [];
    }

    try {
      const invoicesData = localStorage.getItem('invoice-app-invoices');
      existingInvoices = invoicesData ? JSON.parse(invoicesData) : [];
      if (!Array.isArray(existingInvoices)) existingInvoices = [];
    } catch (error) {
      console.error('Error parsing invoices data:', error);
      existingInvoices = [];
    }

    try {
      const productsData = localStorage.getItem('invoice-app-products');
      existingProducts = productsData ? JSON.parse(productsData) : [];
      if (!Array.isArray(existingProducts)) existingProducts = [];
    } catch (error) {
      console.error('Error parsing products data:', error);
      existingProducts = [];
    }

    // Initialize sample data if needed
    if (existingCustomers.length === 0) {
      try {
        localStorage.setItem('invoice-app-customers', JSON.stringify(sampleCustomers));
      } catch (error) {
        console.error('Error saving sample customers:', error);
      }
    }

    if (existingProducts.length === 0) {
      try {
        localStorage.setItem('invoice-app-products', JSON.stringify(sampleProducts));
      } catch (error) {
        console.error('Error saving sample products:', error);
      }
    }

    if (existingInvoices.length === 0) {
      try {
        const customers = JSON.parse(localStorage.getItem('invoice-app-customers') || '[]');
        const sampleInvoices = createSampleInvoices(customers);
        localStorage.setItem('invoice-app-invoices', JSON.stringify(sampleInvoices));
      } catch (error) {
        console.error('Error saving sample invoices:', error);
      }
    }

    // Set invoice counter if not set
    if (!localStorage.getItem('invoice-app-counter')) {
      try {
        localStorage.setItem('invoice-app-counter', '3');
      } catch (error) {
        console.error('Error setting invoice counter:', error);
      }
    }
  } catch (error) {
    console.error('Error initializing sample data:', error);
  }
};