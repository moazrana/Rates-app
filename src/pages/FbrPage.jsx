import { useState, useEffect, useRef } from 'react';
import { useApi } from '../hooks/useApi';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Upload, Download, FileText, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';

const formatTime = (ms) => {
  if (!ms) return '0s';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
};

const STATUS_CONFIG = {
  completed: { label: 'Completed', classes: 'bg-green-100 text-green-700 border-green-200', Icon: CheckCircle2, dot: 'bg-green-500' },
  failed:    { label: 'Failed',    classes: 'bg-red-100 text-red-700 border-red-200',       Icon: XCircle,     dot: 'bg-red-500' },
  active:    { label: 'Processing',classes: 'bg-blue-100 text-blue-700 border-blue-200',    Icon: null,        dot: 'bg-blue-500 animate-pulse' },
  queued:    { label: 'Queued',    classes: 'bg-amber-100 text-amber-700 border-amber-200', Icon: Clock,       dot: 'bg-amber-500' },
  waiting:   { label: 'Waiting',  classes: 'bg-amber-100 text-amber-700 border-amber-200', Icon: Clock,       dot: 'bg-amber-500' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, classes: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.classes}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

export default function FbrPage() {
  const { loading, uploadInvoice, downloadFbrInvoiceTemplate, getFbrInvoiceJobStatus } = useApi();

  const [invoiceDescription, setInvoiceDescription] = useState('');
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [invoiceFileKey, setInvoiceFileKey] = useState(0);
  const [invoiceStatuses, setInvoiceStatuses] = useState([]);
  const [validationResponse, setValidationResponse] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [retryTimer, setRetryTimer] = useState(null);
  const [fbrResponse, setFbrResponse] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const jobPollRef = useRef(null);

  useEffect(() => {
    if (!jobStatus?.jobId) return;
    const poll = async () => {
      try {
        const status = await getFbrInvoiceJobStatus(jobStatus.jobId);
        setJobStatus(status);
        if (status.retryDelay) setRetryTimer(status.retryDelay);
        if (status.status === 'completed' && status.returnvalue) {
          setFbrResponse(status.returnvalue.fbrResponse);
          setInvoiceStatuses(status.returnvalue.fbrResponse?.data?.validationResponse?.invoiceStatuses || []);
          setValidationResponse(status.returnvalue.fbrResponse?.data?.validationResponse || null);
          clearInterval(jobPollRef.current);
        } else if (status.status === 'failed') {
          clearInterval(jobPollRef.current);
        }
      } catch (err) {
        console.error('FBR poll error:', err);
      }
    };
    jobPollRef.current = setInterval(poll, 2000);
    poll();
    return () => clearInterval(jobPollRef.current);
  }, [jobStatus?.jobId, getFbrInvoiceJobStatus]);

  useEffect(() => {
    if (!retryTimer || retryTimer <= 0) return;
    const t = setInterval(() => setRetryTimer(p => p <= 1000 ? null : p - 1000), 1000);
    return () => clearInterval(t);
  }, [retryTimer]);

  const handleUpload = async () => {
    if (!invoiceFile) { alert('Please select an invoice file.'); return; }
    try {
      setJobStatus(null); setRetryTimer(null); setFbrResponse(null);
      setInvoiceStatuses([]); setValidationResponse(null);
      const res = await uploadInvoice(invoiceFile, invoiceDescription);
      if (res.jobId) {
        setJobStatus({ jobId: res.jobId, status: 'queued', attemptsMade: 0, maxAttempts: 3 });
        setSuccessMessage('Invoice uploaded — FBR submission queued.');
      } else {
        setSuccessMessage('Invoice uploaded successfully!');
      }
      setTimeout(() => setSuccessMessage(''), 4000);
      setInvoiceDescription(''); setInvoiceFile(null); setInvoiceFileKey(k => k + 1);
    } catch (err) {
      console.error('Upload error:', err);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await downloadFbrInvoiceTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'fbr-invoice-template.xlsx';
      document.body.appendChild(a); a.click();
      setTimeout(() => { window.URL.revokeObjectURL(url); document.body.removeChild(a); }, 100);
    } catch (err) {
      alert(`Failed: ${err.message}`);
    }
  };

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">FBR Invoice Submission</h1>
        <p className="text-sm text-slate-500 mt-0.5">Upload and submit invoices to Pakistan's Federal Board of Revenue</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Upload Card */}
        <Card>
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
            <Upload size={15} className="text-blue-500" />
            <h2 className="text-sm font-semibold text-slate-700">Upload Invoice</h2>
          </div>
          <CardContent>
            {successMessage && (
              <div className="flex items-center gap-2 mb-4 px-3 py-2.5 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                <CheckCircle2 size={14} />
                {successMessage}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Description <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={invoiceDescription}
                  onChange={e => setInvoiceDescription(e.target.value)}
                  placeholder="Enter invoice description"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Invoice File</label>
                <input
                  key={invoiceFileKey}
                  className="ui-input-file"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
                  onChange={e => setInvoiceFile(e.target.files?.[0] || null)}
                />
              </div>
              <div className="flex gap-2 pt-1">
                <Button onClick={handleUpload} disabled={loading} className="flex-1">
                  <Upload size={14} /> {loading ? 'Uploading…' : 'Upload Invoice'}
                </Button>
                <Button variant="secondary" onClick={handleDownloadTemplate} disabled={loading}>
                  <Download size={14} /> Template
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Card */}
        {jobStatus && (
          <Card>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText size={15} className="text-blue-500" />
                <h2 className="text-sm font-semibold text-slate-700">Submission Status</h2>
              </div>
              <StatusBadge status={jobStatus.status} />
            </div>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {jobStatus.attemptsMade > 0 && (
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="text-xs text-slate-500 mb-0.5">Attempts</div>
                    <div className="text-sm font-semibold text-slate-800">{jobStatus.attemptsMade} / {jobStatus.maxAttempts}</div>
                  </div>
                )}
                {jobStatus.retryCurrent > 0 && (
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="text-xs text-slate-500 mb-0.5">Retries</div>
                    <div className="text-sm font-semibold text-slate-800">{jobStatus.retryCurrent} / {jobStatus.retryMax}</div>
                  </div>
                )}
                {retryTimer > 0 && (
                  <div className="bg-amber-50 rounded-lg p-3">
                    <div className="text-xs text-amber-600 mb-0.5">Next retry in</div>
                    <div className="text-sm font-semibold text-amber-700">{formatTime(retryTimer)}</div>
                  </div>
                )}
              </div>
              {jobStatus.failedReason && (
                <div className="mt-3 flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                  {jobStatus.failedReason}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* FBR Response */}
      {fbrResponse && (
        <Card className="mt-5">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FileText size={15} className="text-blue-500" />
              <h2 className="text-sm font-semibold text-slate-700">FBR Response</h2>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${fbrResponse.ok ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
              {fbrResponse.ok ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
              {fbrResponse.ok ? 'Success' : 'Failed'}
            </span>
          </div>
          <CardContent>
            {validationResponse?.error && (
              <div className="flex items-start gap-2 mb-4 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                {validationResponse.error}
              </div>
            )}
            {invoiceStatuses.length > 0 && (
              <div className="table-wrap">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-200">Item #</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-200">Status</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-200">Error</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-200">Code</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceStatuses.map((s, i) => (
                      <tr key={s.id || i} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-2.5 text-slate-700">{s.itemSNo}</td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.status === 'Valid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-600 text-xs">{s.error}</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{s.errorCode}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {fbrResponse.data && (
              <details className="raw-json mt-4">
                <summary>Raw response</summary>
                <pre>{JSON.stringify(fbrResponse.data, null, 2)}</pre>
              </details>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
