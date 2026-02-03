import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { formatNepaliDate, formatNepaliDateLong } from './date';
import type { Customer, CustomerCredit, CustomerPayment } from '../types';

function currency(n: number) {
  return `रू ${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function tableRows(items: { date: string; amount: number; note?: string }[]) {
  if (items.length === 0) {
    return `<tr><td colspan="3" class="empty">कुनै लेनदेन छैन</td></tr>`;
  }
  return items
    .map(
      (i) => `
    <tr>
      <td>${formatNepaliDate(i.date)}</td>
      <td>${currency(i.amount)}</td>
      <td>${i.note ?? ''}</td>
    </tr>`,
    )
    .join('');
}

function baseHtml(title: string, body: string) {
  return `
  <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: Arial, sans-serif; color: #0f172a; padding: 24px; }
        h1 { font-size: 18px; margin: 0 0 8px 0; }
        h2 { font-size: 14px; margin: 16px 0 8px 0; }
        .muted { color: #64748b; font-size: 12px; }
        .summary { margin: 12px 0 16px 0; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; }
        .summary-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 6px; }
        th, td { border: 1px solid #e2e8f0; padding: 6px; font-size: 12px; text-align: left; }
        th { background: #f8fafc; }
        .empty { text-align: center; color: #64748b; }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      ${body}
    </body>
  </html>`;
}

async function sharePdf(html: string, fileName: string) {
  const file = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/pdf',
      dialogTitle: fileName,
    });
  }
  return file.uri;
}

export async function exportCustomerPdf(params: {
  customer: Customer;
  totalCredits: number;
  totalPayments: number;
  balance: number;
  credits: CustomerCredit[];
  payments: CustomerPayment[];
}) {
  const { customer, totalCredits, totalPayments, balance, credits, payments } = params;
  const title = `ग्राहक विवरण`;
  const body = `
    <div class="muted">${formatNepaliDateLong()}</div>
    <div class="summary">
      <div class="summary-row"><span>नाम</span><strong>${customer.name}</strong></div>
      <div class="summary-row"><span>मोबाइल</span><strong>${customer.mobile ?? '-'}</strong></div>
      <div class="summary-row"><span>ठेगाना</span><strong>${customer.address ?? '-'}</strong></div>
      <div class="summary-row"><span>कुल उधारो</span><strong>${currency(totalCredits)}</strong></div>
      <div class="summary-row"><span>कुल भुक्तानी</span><strong>${currency(totalPayments)}</strong></div>
      <div class="summary-row"><span>बाँकी</span><strong>${currency(balance)}</strong></div>
    </div>
    <h2>उधारो विवरण</h2>
    <table>
      <thead><tr><th>मिति</th><th>रकम</th><th>टिप्पणी</th></tr></thead>
      <tbody>${tableRows(credits)}</tbody>
    </table>
    <h2>भुक्तानी विवरण</h2>
    <table>
      <thead><tr><th>मिति</th><th>रकम</th><th>टिप्पणी</th></tr></thead>
      <tbody>${tableRows(payments)}</tbody>
    </table>
  `;
  return sharePdf(baseHtml(title, body), 'customer-report.pdf');
}

export async function exportReportPdf(params: {
  title: string;
  totalCredits: number;
  totalPayments: number;
  netBalance: number;
  credits: CustomerCredit[];
  payments: CustomerPayment[];
}) {
  const { title, totalCredits, totalPayments, netBalance, credits, payments } = params;
  const body = `
    <div class="muted">${formatNepaliDateLong()}</div>
    <div class="summary">
      <div class="summary-row"><span>कुल उधारो</span><strong>${currency(totalCredits)}</strong></div>
      <div class="summary-row"><span>कुल भुक्तानी</span><strong>${currency(totalPayments)}</strong></div>
      <div class="summary-row"><span>शेष रकम</span><strong>${currency(netBalance)}</strong></div>
    </div>
    <h2>उधारो तालिका</h2>
    <table>
      <thead><tr><th>मिति</th><th>रकम</th><th>टिप्पणी</th></tr></thead>
      <tbody>${tableRows(credits)}</tbody>
    </table>
    <h2>भुक्तानी तालिका</h2>
    <table>
      <thead><tr><th>मिति</th><th>रकम</th><th>टिप्पणी</th></tr></thead>
      <tbody>${tableRows(payments)}</tbody>
    </table>
  `;
  return sharePdf(baseHtml(title, body), 'report.pdf');
}
