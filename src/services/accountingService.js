import { apiClient } from '../config.js';

// ── Chart of Accounts ─────────────────────────────────────────────────────────

export async function getAccounts() {
  const res = await apiClient.get('/accounting/accounts');
  return res.data;
}

export async function createAccount(data) {
  const res = await apiClient.post('/accounting/accounts', data);
  return res.data;
}

export async function updateAccount(id, data) {
  const res = await apiClient.patch(`/accounting/accounts/${id}`, data);
  return res.data;
}

export async function deleteAccount(id) {
  const res = await apiClient.delete(`/accounting/accounts/${id}`);
  return res.data;
}

// ── Customers ─────────────────────────────────────────────────────────────────

export async function getCustomers() {
  const res = await apiClient.get('/accounting/customers');
  return res.data;
}

export async function createCustomer(data) {
  const res = await apiClient.post('/accounting/customers', data);
  return res.data;
}

export async function updateCustomer(id, data) {
  const res = await apiClient.patch(`/accounting/customers/${id}`, data);
  return res.data;
}

export async function deleteCustomer(id) {
  const res = await apiClient.delete(`/accounting/customers/${id}`);
  return res.data;
}

// ── Journal Entries ───────────────────────────────────────────────────────────

export async function getJournalEntries(page = 1, limit = 50) {
  const res = await apiClient.get('/accounting/journal-entries', { params: { page, limit } });
  return res.data;
}

export async function getJournalEntry(id) {
  const res = await apiClient.get(`/accounting/journal-entries/${id}`);
  return res.data;
}

export async function createJournalEntry(data) {
  const res = await apiClient.post('/accounting/journal-entries', data);
  return res.data;
}

export async function postJournalEntry(id) {
  const res = await apiClient.post(`/accounting/journal-entries/${id}/post`);
  return res.data;
}

export async function reverseJournalEntry(id) {
  const res = await apiClient.post(`/accounting/journal-entries/${id}/reverse`);
  return res.data;
}

// ── Invoices ──────────────────────────────────────────────────────────────────

export async function getInvoices(page = 1, limit = 50, status = '') {
  const res = await apiClient.get('/accounting/invoices', { params: { page, limit, status } });
  return res.data;
}

export async function getInvoice(id) {
  const res = await apiClient.get(`/accounting/invoices/${id}`);
  return res.data;
}

export async function createInvoice(data) {
  const res = await apiClient.post('/accounting/invoices', data);
  return res.data;
}

export async function postInvoice(id) {
  const res = await apiClient.post(`/accounting/invoices/${id}/post`);
  return res.data;
}

export async function cancelInvoice(id) {
  const res = await apiClient.post(`/accounting/invoices/${id}/cancel`);
  return res.data;
}

// ── Payments ──────────────────────────────────────────────────────────────────

export async function getPayments(invoiceId) {
  const res = await apiClient.get('/accounting/payments', {
    params: invoiceId ? { invoice_id: invoiceId } : {},
  });
  return res.data;
}

export async function recordPayment(data) {
  const res = await apiClient.post('/accounting/payments', data);
  return res.data;
}

// ── Reports ───────────────────────────────────────────────────────────────────

export async function getTrialBalance(startDate, endDate) {
  const res = await apiClient.get('/accounting/reports/trial-balance', {
    params: { startDate, endDate },
  });
  return res.data;
}

export async function getArAging() {
  const res = await apiClient.get('/accounting/reports/ar-aging');
  return res.data;
}

export async function getLedger(accountId, startDate, endDate) {
  const res = await apiClient.get(`/accounting/reports/ledger/${accountId}`, {
    params: { startDate, endDate },
  });
  return res.data;
}
