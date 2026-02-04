import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { formatNepaliDate, formatNepaliDateLong } from './date';
import type { Customer, CustomerCredit, CustomerPayment } from '../types';
import { getStrings } from '../constants/strings';
import type { Strings } from '../constants/strings';

function currency(n: number, prefix: string) {
  return `${prefix}${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function tableRows(
  items: { date: string; amount: number; note?: string }[],
  strings: Strings,
  prefix: string,
) {
  if (items.length === 0) {
    return `<tr><td colspan=\"3\" class=\"empty\">${strings.noTransactions}</td></tr>`;
  }
  return items
    .map(
      (i) => `
    <tr>
      <td>${formatNepaliDate(i.date)}</td>
      <td>${currency(i.amount, prefix)}</td>
      <td>${i.note ?? ''}</td>
    </tr>`,
    )
    .join('');
}

function creditRows(
  items: { date: string; amount: number; note?: string; expected_payment_date?: string }[],
  strings: Strings,
  prefix: string,
) {
  if (items.length === 0) {
    return `<tr><td colspan=\"4\" class=\"empty\">${strings.noTransactions}</td></tr>`;
  }
  return items
    .map(
      (i) => `
    <tr>
      <td>${formatNepaliDate(i.date)}</td>
      <td>${formatNepaliDate(i.expected_payment_date || '')}</td>
      <td>${currency(i.amount, prefix)}</td>
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
  const match = value.match(/(\.[a-zA-Z0-9]+)$/);
  const ext = match ? match[1] : '';
  const base = match ? value.slice(0, -ext.length) : value;
  const safeBase = base.replace(/[^a-zA-Z0-9\u0900-\u097F_-]+/g, '_');
  return `${safeBase}${ext}`;
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
  const STRINGS = getStrings();
  const prefix = STRINGS.currencyPrefix;
  const { customer, totalCredits, totalPayments, balance, credits, payments } = params;
  const title = STRINGS.customerReportTitle;
  const body = `
    <div class="muted">${formatNepaliDateLong()}</div>
    <div class="summary">
      <div class="summary-row"><span class="summary-label">${STRINGS.customerName}:</span><span class="summary-value">${customer.name}</span></div>
      <div class="summary-row"><span class="summary-label">${STRINGS.mobileNumber}:</span><span class="summary-value">${customer.mobile ?? '-'}</span></div>
      <div class="summary-row"><span class="summary-label">${STRINGS.address}:</span><span class="summary-value">${customer.address ?? '-'}</span></div>
      <div class="summary-row"><span class="summary-label">${STRINGS.totalCredits}:</span><span class="summary-value">${currency(totalCredits, prefix)}</span></div>
      <div class="summary-row"><span class="summary-label">${STRINGS.totalPayments}:</span><span class="summary-value">${currency(totalPayments, prefix)}</span></div>
      <div class="summary-row"><span class="summary-label">${STRINGS.outstandingBalance}:</span><span class="summary-value">${currency(balance, prefix)}</span></div>
    </div>
    <h2>${STRINGS.creditDetailsTitle}</h2>
    <table>
      <thead><tr><th class="col-date">${STRINGS.dateLabel}</th><th class="col-due">${STRINGS.paymentDueDate}</th><th class="col-amount">${STRINGS.amountLabel}</th><th class="col-note">${STRINGS.note}</th></tr></thead>
      <tbody>${creditRows(credits, STRINGS, prefix)}</tbody>
    </table>
    <h2>${STRINGS.paymentDetailsTitle}</h2>
    <table>
      <thead><tr><th class="col-date">${STRINGS.dateLabel}</th><th class="col-amount">${STRINGS.amountLabel}</th><th class="col-note">${STRINGS.note}</th></tr></thead>
      <tbody>${tableRows(payments, STRINGS, prefix)}</tbody>
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
  const STRINGS = getStrings();
  const prefix = STRINGS.currencyPrefix;
  const { title, totalCredits, totalPayments, netBalance, credits, payments, rangeLabel } = params;
  const body = `
    <div class="muted">${formatNepaliDateLong()}</div>
    <div class="summary">
      <div class="summary-row"><span class="summary-label">${STRINGS.totalCredits}:</span><span class="summary-value">${currency(totalCredits, prefix)}</span></div>
      <div class="summary-row"><span class="summary-label">${STRINGS.totalPayments}:</span><span class="summary-value">${currency(totalPayments, prefix)}</span></div>
      <div class="summary-row"><span class="summary-label">${STRINGS.netBalance}:</span><span class="summary-value">${currency(netBalance, prefix)}</span></div>
    </div>
    <h2>${STRINGS.creditTableTitle}</h2>
    <table>
      <thead><tr><th class="col-date">${STRINGS.dateLabel}</th><th class="col-due">${STRINGS.paymentDueDate}</th><th class="col-amount">${STRINGS.amountLabel}</th><th class="col-note">${STRINGS.note}</th></tr></thead>
      <tbody>${creditRows(credits, STRINGS, prefix)}</tbody>
    </table>
    <h2>${STRINGS.paymentTableTitle}</h2>
    <table>
      <thead><tr><th class="col-date">${STRINGS.dateLabel}</th><th class="col-amount">${STRINGS.amountLabel}</th><th class="col-note">${STRINGS.note}</th></tr></thead>
      <tbody>${tableRows(payments, STRINGS, prefix)}</tbody>
    </table>
  `;
  const fileName = rangeLabel
    ? `report-${rangeLabel}.pdf`
    : 'report.pdf';
  return sharePdf(baseHtml(title, body), fileName);
}
