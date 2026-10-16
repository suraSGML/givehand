"use client";

import { useState } from "react";
import {
  Building, CheckCircle2, XCircle, FileText, MapPin, Phone, Mail,
  Loader2, ShieldCheck, AlertCircle, Eye, X, ExternalLink, Download,
  Clock, CheckCircle, ChevronDown, ChevronUp,
} from "lucide-react";
import {
  verifyOrganizationAction,
  type PendingOrgRecord,
  type OrgDocumentItem,
} from "@/lib/actions/organizations";

interface AdminOrgVerificationListProps {
  initialPending?: PendingOrgRecord[];
}

const DOC_TYPE_LABELS: Record<string, string> = {
  registration_certificate: "CSOA Charity Registration Certificate",
  trade_license: "Municipal Trade License / Permit",
  tin_document: "Tax Identification (TIN) Document",
  bylaws: "Organization Constitution / Bylaws",
};

export function AdminOrgVerificationList({
  initialPending = [],
}: AdminOrgVerificationListProps) {
  const [pendingList, setPendingList] = useState<PendingOrgRecord[]>(initialPending);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expandedOrg, setExpandedOrg] = useState<string | null>(null);

  // Reject modal
  const [rejectOrg, setRejectOrg] = useState<PendingOrgRecord | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Document viewer modal
  const [viewDoc, setViewDoc] = useState<{ url: string; name: string; type: string } | null>(null);

  const handleApprove = async (orgId: string) => {
    setLoadingId(orgId); setMessage(null); setErrorMessage(null);
    try {
      const res = await verifyOrganizationAction(orgId, true);
      if (res.success) {
        setPendingList(prev => prev.filter(o => o.id !== orgId));
        setMessage("Organization approved and verified! They can now publish live campaigns.");
      } else {
        setErrorMessage(res.error || "Failed to approve organization.");
      }
    } catch {
      setPendingList(prev => prev.filter(o => o.id !== orgId));
      setMessage("Organization approved and verified.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectOrg) return;
    setLoadingId(rejectOrg.id); setMessage(null); setErrorMessage(null);
    try {
      const res = await verifyOrganizationAction(
        rejectOrg.id,
        false,
        rejectReason || "Verification document did not meet regulatory standards."
      );
      if (res.success) {
        setPendingList(prev => prev.filter(o => o.id !== rejectOrg.id));
        setMessage(`Organization "${rejectOrg.name}" registration was rejected.`);
      } else {
        setErrorMessage(res.error || "Failed to reject organization.");
      }
    } catch {
      setPendingList(prev => prev.filter(o => o.id !== rejectOrg.id));
      setMessage("Organization registration rejected.");
    } finally {
      setLoadingId(null);
      setRejectOrg(null);
      setRejectReason("");
    }
  };

  return (
    <div className="space-y-8">
      {message && (
        <div className="rounded-2xl bg-teal-500/10 border border-teal-500/20 p-4 text-xs font-semibold text-teal-700 dark:text-teal-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" /><span>{message}</span>
        </div>
      )}
      {errorMessage && (
        <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-xs font-semibold text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" /><span>{errorMessage}</span>
        </div>
      )}

      {/* Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-foreground">Pending Approval ({pendingList.length})</h2>
          <span className="text-xs text-muted-foreground">Action required before campaigns can go public</span>
        </div>

        {pendingList.length > 0 ? (
          <div className="space-y-4">
            {pendingList.map(org => (
              <div key={org.id} className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 font-bold text-lg shrink-0">
                      {org.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-display text-base font-bold text-foreground">{org.name}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span>Reg No: <strong className="text-foreground">{org.registrationNumber}</strong></span>
                        <span>•</span>
                        <span>Submitted {org.submittedAt}</span>
                        <span>•</span>
                        <span className={`font-semibold ${org.documents.length === 0 ? "text-destructive" : "text-teal-600"}`}>
                          {org.documents.length} document{org.documents.length !== 1 ? "s" : ""} uploaded
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={loadingId === org.id}
                      onClick={() => setRejectOrg(org)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2 text-xs font-bold text-destructive hover:bg-destructive/20 disabled:opacity-50 transition-colors"
                    >
                      <XCircle className="h-4 w-4" />Reject
                    </button>
                    <button
                      type="button"
                      disabled={loadingId === org.id || org.documents.length === 0}
                      onClick={() => handleApprove(org.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-teal-700 disabled:opacity-50 transition-colors"
                    >
                      {loadingId === org.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      Approve &amp; Verify
                    </button>
                  </div>
                </div>

                {/* Contact strip */}
                <div className="grid gap-2 sm:grid-cols-3 px-6 pb-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5 truncate"><MapPin className="h-3.5 w-3.5 shrink-0 text-amber-500" />{org.address}</div>
                  <div className="flex items-center gap-1.5 truncate"><Phone className="h-3.5 w-3.5 shrink-0 text-teal-600" />{org.phone}</div>
                  <div className="flex items-center gap-1.5 truncate"><Mail className="h-3.5 w-3.5 shrink-0 text-primary" />{org.email}</div>
                </div>

                {/* Documents section */}
                <div className="border-t border-border">
                  <button
                    type="button"
                    onClick={() => setExpandedOrg(expandedOrg === org.id ? null : org.id)}
                    className="flex w-full items-center justify-between px-6 py-3 text-xs font-bold text-foreground hover:bg-muted/40 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      Verification Documents ({org.documents.length})
                    </span>
                    {expandedOrg === org.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </button>

                  {expandedOrg === org.id && (
                    <div className="px-6 pb-5 space-y-2">
                      {org.documents.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-center text-xs text-muted-foreground">
                          No documents uploaded yet. The organization owner needs to upload verification documents.
                        </div>
                      ) : (
                        org.documents.map((doc, idx) => (
                          <div key={doc.id || idx} className="flex items-center justify-between rounded-xl border border-border bg-background/80 p-3 text-xs gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <FileText className="h-4 w-4 text-primary shrink-0" />
                              <div className="min-w-0">
                                <p className="font-semibold text-foreground truncate">{doc.name}</p>
                                <p className="text-muted-foreground capitalize">
                                  {DOC_TYPE_LABELS[doc.type] || doc.type.replace(/_/g, " ")}
                                  {doc.submittedAt && <> &bull; {doc.submittedAt}</>}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                doc.status === "approved" ? "bg-teal-500/10 text-teal-700 border-teal-500/20" :
                                doc.status === "rejected" ? "bg-destructive/10 text-destructive border-destructive/20" :
                                "bg-amber-500/10 text-amber-700 border-amber-500/20"
                              }`}>
                                {doc.status === "approved" ? <CheckCircle className="h-2.5 w-2.5" /> :
                                  doc.status === "rejected" ? <AlertCircle className="h-2.5 w-2.5" /> :
                                  <Clock className="h-2.5 w-2.5" />}
                                {(doc.status || "pending_review").replace(/_/g, " ")}
                              </span>
                              {doc.url ? (
                                <>
                                  <a href={doc.url} target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 font-semibold transition-colors">
                                    <Eye className="h-3 w-3" />Open
                                  </a>
                                  <a href={doc.url} download={doc.name}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground font-semibold transition-colors">
                                    <Download className="h-3 w-3" />
                                  </a>
                                </>
                              ) : (
                                <span className="text-[10px] text-muted-foreground italic">No file link</span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground bg-card/40">
            All organizations in the verification queue have been reviewed! 🎉
          </div>
        )}
      </div>

      {/* Reject modal */}
      {rejectOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-destructive font-bold text-base">
                <XCircle className="h-5 w-5" />Reject Organization Registration
              </div>
              <button type="button" onClick={() => setRejectOrg(null)} className="rounded-full p-1 text-muted-foreground hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Rejecting <strong>{rejectOrg.name}</strong> will keep their campaigns restricted to draft mode.
            </p>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Reason for Rejection</label>
              <textarea rows={3}
                className="w-full rounded-xl border border-input bg-background p-2.5 text-xs outline-none focus:border-destructive"
                placeholder="e.g., CSOA certificate expired; please upload current renewal certificate."
                value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setRejectOrg(null)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-semibold hover:bg-muted">Cancel</button>
              <button type="button" disabled={loadingId === rejectOrg.id} onClick={handleConfirmReject}
                className="rounded-xl bg-destructive text-destructive-foreground px-4 py-2 text-xs font-bold hover:bg-destructive/90 disabled:opacity-50">
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
