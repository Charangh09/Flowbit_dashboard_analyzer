import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

type AnyRec = Record<string, any>;

function asDate(v: any): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function asNumber(v: any): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

async function main() {
  const file = path.resolve(process.cwd(), '../../data/Analytics_Test_Data.json');
  const raw = await fs.readFile(file, 'utf8');
  const arr: AnyRec[] = JSON.parse(raw);

  console.log(`📦 Starting seed for ${arr.length} documents...`);

  let count = 0;

  for (const doc of arr) {
    count++;

    const llm = doc.extractedData?.llmData || {};
    const vendorV = llm.vendor?.value || {};
    const customerV = llm.customer?.value || {};
    const invoiceV = llm.invoice?.value || {};
    const summaryV = llm.summary?.value || {};
    const paymentV = llm.payment?.value || {};

    // --- Safely extract items array ---
    let items: any[] = [];
    if (Array.isArray(llm.lineItems?.value?.items?.value)) {
      items = llm.lineItems.value.items.value;
    } else if (Array.isArray(llm.lineItems?.value?.items)) {
      items = llm.lineItems.value.items;
    } else if (Array.isArray(llm.lineItems)) {
      items = llm.lineItems;
    }

    // ----------------- Vendor -----------------
    const vendorName = vendorV.vendorName?.value || vendorV.vendorName || 'Unknown Vendor';
    let vendor = await prisma.vendor.findFirst({ where: { name: vendorName } });

    if (!vendor) {
      vendor = await prisma.vendor.create({
        data: {
          name: vendorName,
          taxId: vendorV.vendorTaxId?.value || vendorV.vendorTaxId || null,
          address: vendorV.vendorAddress?.value || vendorV.vendorAddress || null,
        },
      });
    }

    // ----------------- Customer -----------------
    const customerName = customerV.customerName?.value || customerV.customerName || 'Unknown Customer';
    let customer = await prisma.customer.findFirst({ where: { name: customerName } });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: customerName,
          address: customerV.customerAddress?.value || customerV.customerAddress || null,
        },
      });
    }

    // ----------------- Invoice -----------------
    const documentTypeValue =
      typeof summaryV.documentType === 'object'
        ? summaryV.documentType?.value ?? null
        : summaryV.documentType ?? null;

    const currencyValue =
      typeof summaryV.currencySymbol === 'object'
        ? summaryV.currencySymbol?.value ?? null
        : summaryV.currencySymbol ?? null;

    // Safe invoice number generation
    let invoiceNumber =
      invoiceV.invoiceId?.value ||
      invoiceV.invoiceId ||
      doc._id ||
      crypto.randomUUID();

    // Check for duplicates (same vendorId + number)
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        number: invoiceNumber,
        vendorId: vendor.id,
      },
    });

    if (existingInvoice) {
      // If duplicate, append unique suffix to keep it unique
      invoiceNumber = `${invoiceNumber}-${crypto.randomUUID().slice(0, 6)}`;
    }

    const inv = await prisma.invoice.create({
      data: {
        number: invoiceNumber,
        invoiceDate: asDate(invoiceV.invoiceDate?.value || invoiceV.invoiceDate),
        deliveryDate: asDate(invoiceV.deliveryDate?.value || invoiceV.deliveryDate),
        documentType: documentTypeValue,
        currency: currencyValue,
        subTotal: asNumber(summaryV.subTotal?.value ?? summaryV.subTotal),
        taxTotal: asNumber(summaryV.totalTax?.value ?? summaryV.totalTax),
        total: asNumber(summaryV.invoiceTotal?.value ?? summaryV.invoiceTotal),
        status: documentTypeValue === 'creditNote' ? 'credit' : 'unpaid',
        vendorId: vendor.id,
        customerId: customer.id,
      },
    });

    // ----------------- Payment (optional) -----------------
    await prisma.payment
      .create({
        data: {
          invoiceId: inv.id,
          dueDate: asDate(paymentV.dueDate?.value ?? paymentV.dueDate),
          terms: paymentV.paymentTerms?.value ?? paymentV.paymentTerms ?? null,
          bankAccountNumber:
            paymentV.bankAccountNumber?.value ?? paymentV.bankAccountNumber ?? null,
          bic: paymentV.BIC?.value ?? paymentV.BIC ?? null,
          netDays: asNumber(paymentV.netDays?.value ?? paymentV.netDays) ?? undefined,
          discountPercent: asNumber(
            paymentV.discountPercentage?.value ?? paymentV.discountPercentage
          ),
          discountDays:
            asNumber(paymentV.discountDays?.value ?? paymentV.discountDays) ??
            undefined,
          discountDueDate: asDate(
            paymentV.discountDueDate?.value ?? paymentV.discountDueDate
          ),
          discountedTotal: asNumber(
            paymentV.discountedTotal?.value ?? paymentV.discountedTotal
          ),
        },
      })
      .catch(() => {});

    // ----------------- Line Items -----------------
    for (const it of items) {
      const get = (k: string) => {
        const v = it[k];
        if (v && typeof v === 'object' && 'value' in v) return v.value;
        return v;
      };

      await prisma.lineItem.create({
        data: {
          invoiceId: inv.id,
          srNo: asNumber(get('srNo')) || undefined,
          description: get('description') || null,
          quantity: asNumber(get('quantity')),
          unitPrice: asNumber(get('unitPrice')),
          totalPrice: asNumber(get('totalPrice')),
          sachkonto: String(get('Sachkonto') ?? '') || null,
          buSchluessel: String(get('BUSchluessel') ?? '') || null,
          vatRate: asNumber(get('vatRate')),
          vatAmount: asNumber(get('vatAmount')),
          category: null,
        },
      });
    }

    console.log(`✅ Seeded invoice ${count} of ${arr.length}`);
  }

  console.log('🎉 All data seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
