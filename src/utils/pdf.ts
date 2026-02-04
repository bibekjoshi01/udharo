import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
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

function creditRows(items: { date: string; amount: number; note?: string; expected_payment_date?: string }[]) {
  if (items.length === 0) {
    return `<tr><td colspan="4" class="empty">कुनै लेनदेन छैन</td></tr>`;
  }
  return items
    .map(
      (i) => `
    <tr>
      <td>${formatNepaliDate(i.date)}</td>
      <td>${formatNepaliDate(i.expected_payment_date || '')}</td>
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
        .summary-row { display: flex; align-items: baseline; gap: 6px; margin-bottom: 8px; font-size: 12px; }
        .summary-label { color: #475569; min-width: 90px; }
        .summary-value { font-weight: 700; }
        table { width: 100%; border-collapse: collapse; margin-top: 6px; }
        th, td { border: 1px solid #e2e8f0; padding: 6px; font-size: 12px; text-align: left; vertical-align: top; word-break: break-word; }
        th { background: #f8fafc; }
        .empty { text-align: center; color: #64748b; }
        .col-date { width: 20%; }
        .col-due { width: 22%; }
        .col-amount { width: 18%; }
        .col-note { width: 40%; }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      ${body}
    </body>
  </html>`;
}

function safeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9\u0900-\u097F_-]+/g, '_');
}

async function sharePdf(html: string, fileName: string) {
  const file = await Print.printToFileAsync({ html });
  const cleanName = safeFileName(fileName);
  const dest = `${FileSystem.documentDirectory}${cleanName}`;
  try {
    await FileSystem.copyAsync({ from: file.uri, to: dest });
  } catch {
    // fallback to original file uri
  }
  const shareUri = (await FileSystem.getInfoAsync(dest)).exists ? dest : file.uri;
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(shareUri, {
      mimeType: 'application/pdf',
      dialogTitle: cleanName,
    });
  }
  return shareUri;
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
      <div class="summary-row"><span class="summary-label">नाम:</span><span class="summary-value">${customer.name}</span></div>
      <div class="summary-row"><span class="summary-label">मोबाइल:</span><span class="summary-value">${customer.mobile ?? '-'}</span></div>
      <div class="summary-row"><span class="summary-label">ठेगाना:</span><span class="summary-value">${customer.address ?? '-'}</span></div>
      <div class="summary-row"><span class="summary-label">कुल उधारो:</span><span class="summary-value">${currency(totalCredits)}</span></div>
      <div class="summary-row"><span class="summary-label">कुल भुक्तानी:</span><span class="summary-value">${currency(totalPayments)}</span></div>
      <div class="summary-row"><span class="summary-label">बाँकी:</span><span class="summary-value">${currency(balance)}</span></div>
    </div>
    <h2>उधारो विवरण</h2>
    <table>
      <thead><tr><th class="col-date">मिति</th><th class="col-due">भुक्तानी गर्ने मिति</th><th class="col-amount">रकम</th><th class="col-note">टिप्पणी</th></tr></thead>
      <tbody>${creditRows(credits)}</tbody>
    </table>
    <h2>भुक्तानी विवरण</h2>
    <table>
      <thead><tr><th class="col-date">मिति</th><th class="col-amount">रकम</th><th class="col-note">टिप्पणी</th></tr></thead>
      <tbody>${tableRows(payments)}</tbody>
    </table>
  `;
  const fileName = `${params.customer.name}-report.pdf`;
  return sharePdf(baseHtml(title, body), fileName);
}

export async function exportReportPdf(params: {
  title: string;
  totalCredits: number;
  totalPayments: number;
  netBalance: number;
  credits: CustomerCredit[];
  payments: CustomerPayment[];
  rangeLabel?: string;
}) {
  const { title, totalCredits, totalPayments, netBalance, credits, payments, rangeLabel } = params;
  const body = `
    <div class="muted">${formatNepaliDateLong()}</div>
    <div class="summary">
      <div class="summary-row"><span class="summary-label">कुल उधारो:</span><span class="summary-value">${currency(totalCredits)}</span></div>
      <div class="summary-row"><span class="summary-label">कुल भुक्तानी:</span><span class="summary-value">${currency(totalPayments)}</span></div>
      <div class="summary-row"><span class="summary-label">शेष रकम:</span><span class="summary-value">${currency(netBalance)}</span></div>
    </div>
    <h2>उधारो तालिका</h2>
    <table>
      <thead><tr><th class="col-date">मिति</th><th class="col-due">भुक्तानी गर्ने मिति</th><th class="col-amount">रकम</th><th class="col-note">टिप्पणी</th></tr></thead>
      <tbody>${creditRows(credits)}</tbody>
    </table>
    <h2>भुक्तानी तालिका</h2>
    <table>
      <thead><tr><th class="col-date">मिति</th><th class="col-amount">रकम</th><th class="col-note">टिप्पणी</th></tr></thead>
      <tbody>${tableRows(payments)}</tbody>
    </table>
  `;
  const fileName = rangeLabel
    ? `report-${rangeLabel}.pdf`
    : 'report.pdf';
  return sharePdf(baseHtml(title, body), fileName);
}
