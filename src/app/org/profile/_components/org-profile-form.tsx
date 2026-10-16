"use client";

import { useState, useTransition, useRef } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Upload,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Building,
  X,
  Paperclip,
  Trash2,
} from "lucide-react";
import {
  uploadOrgDocumentAction,
  uploadOrgDocumentFileAction,
  deleteOrgDocumentAction,
  updateOrgProfileAction,
} from "@/lib/actions/organizations";

interface OrgProfileFormProps {
  initialOrg: {
    id: string;
    name: string;
    registration_number: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    description: string | null;
    status: string;
  };
  initialDocuments?: Array<{
    id: string;
    file_path: string;
    doc_type: string;
    status: string;
    review_note?: string | null;
    created_at: string;
  }>;
}

const DOC_TYPES = [
  { value: "registration_certificate", label: "CSOA Charity Registration Certificate" },
  { value: "trade_license", label: "Municipal Trade License / Permit" },
  { value: "tin_document", label: "Tax Identification (TIN) Document" },
  { value: "bylaws", label: "Organization Constitution / Bylaws" },
];

export function OrgProfileForm({
  initialOrg,
  initialDocuments = [],
}: OrgProfileFormProps) {
  const [org, setOrg] = useState(initialOrg);
  const [documents, setDocuments] = useState(initialDocuments);
  const [isPending, startTransition] = useTransition();
  const [docPending, startDocTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Profile form state
  const [name, setName] = useState(org.name || "");
  const [regNo, setRegNo] = useState(org.registration_number || "");
  const [phone, setPhone] = useState(org.phone || "");
  const [email, setEmail] = useState(org.email || "");
  const [address, setAddress] = useState(org.address || "");
  const [description, setDescription] = useState(org.description || "");

  // Doc upload state
  const uploadedDocTypes = new Set(documents.map((d) => d.doc_type));
  const defaultAvailableType =
    DOC_TYPES.find((t) => !uploadedDocTypes.has(t.value))?.value ||
    "registration_certificate";

  const [fileName, setFileName] = useState("");
  const [docType, setDocType] = useState(defaultAvailableType);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Feedback states
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [docSuccess, setDocSuccess] = useState<string | null>(null);
  const [docError, setDocError] = useState<string | null>(null);

  const isVerified = org.status === "verified";
  const isRejected = org.status === "rejected";

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess(null);
    setProfileError(null);

    startTransition(async () => {
      const res = await updateOrgProfileAction({
        name,
        registrationNumber: regNo,
        phone,
        email,
        address,
        description,
      });

      if (res.success) {
        setOrg((prev) => ({
          ...prev,
          name,
          registration_number: regNo,
          phone,
          email,
          address,
          description,
        }));
        setProfileSuccess("Organization details updated successfully!");
      } else {
        setProfileError(res.error || "Failed to update profile.");
      }
    });
  };

  const handleDocUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !fileName.trim()) return;

    if (uploadedDocTypes.has(docType)) {
      setDocError("A document for this category has already been uploaded. Duplicate uploads are not allowed.");
      return;
    }

    if (selectedFile && selectedFile.size > 5 * 1024 * 1024) {
      setDocError("File size exceeds 5MB limit. Please choose a file up to 5MB.");
      return;
    }

    setDocSuccess(null);
    setDocError(null);

    startDocTransition(async () => {
      let res: { success: boolean; error?: string; document?: any };

      if (selectedFile) {
        const fd = new FormData();
        fd.append("file", selectedFile);
        fd.append("docType", docType);
        res = await uploadOrgDocumentFileAction(fd);
      } else {
        res = await uploadOrgDocumentAction({
          fileName: fileName.trim(),
          docType,
        });
      }

      if (res.success) {
        const newDoc = res.document || {
          id: `doc-${Date.now()}`,
          file_path: selectedFile ? selectedFile.name : fileName.trim(),
          doc_type: docType,
          status: "pending_review",
          created_at: new Date().toISOString(),
        };
        const updatedDocs = [newDoc, ...documents];
        setDocuments(updatedDocs);
        setFileName("");
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setDocSuccess(
          "Verification document submitted! Platform admins will review within 24–48 hours."
        );
        setOrg((prev) => ({ ...prev, status: "pending" }));

        // Automatically switch docType to next available one
        const updatedUploaded = new Set(updatedDocs.map((d) => d.doc_type));
        const nextAvail = DOC_TYPES.find((t) => !updatedUploaded.has(t.value));
        if (nextAvail) {
          setDocType(nextAvail.value);
        }
      } else {
        setDocError(res.error || "Failed to upload document.");
      }
    });
  };

  const handleDeleteDoc = async (id: string) => {
    if (!confirm("Are you sure you want to remove this verification document?")) return;
    setDeletingId(id);
    setDocError(null);
    setDocSuccess(null);

    const res = await deleteOrgDocumentAction(id);
    setDeletingId(null);

    if (res.success) {
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      setDocSuccess("Document removed. You may now upload a replacement.");
    } else {
      setDocError(res.error || "Failed to remove document.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Verification Status Card */}
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            {isVerified ? (
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600">
                <ShieldCheck className="h-6 w-6" />
              </div>
            ) : isRejected ? (
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                <ShieldAlert className="h-6 w-6" />
              </div>
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
                <Clock className="h-6 w-6" />
              </div>
            )}
            <div>
              <h2 className="font-display text-base font-bold text-foreground">
                Verification Status:{" "}
                {isVerified ? "Verified NGO" : isRejected ? "Action Required (Rejected)" : "Pending Admin Review"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {isVerified
                  ? "Your organization is certified to publish public community needs."
                  : isRejected
                  ? "Your verification request requires correction. Please review feedback and re-upload documents."
                  : "Needs can be created as drafts, but will become publicly active once legal documents are approved."}
              </p>
            </div>
          </div>

          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              isVerified
                ? "bg-teal-500/10 text-teal-700 dark:text-teal-300"
                : isRejected
                ? "bg-destructive/10 text-destructive"
                : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
            }`}
          >
            {org.status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Verification Documents Upload Card */}
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <h2 className="font-display text-base font-bold text-foreground">
            Official Verification Documents
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Submit your Ethiopian Civil Society Organizations Authority (CSOA) certificate, municipal trade license, or tax identification document.
          </p>
        </div>

        {/* Upload form */}
        {DOC_TYPES.every((t) => uploadedDocTypes.has(t.value)) ? (
          <div className="rounded-2xl border border-teal-500/30 bg-teal-500/10 p-4 text-teal-800 dark:text-teal-200 text-xs flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-teal-600 shrink-0" />
            <div>
              <p className="font-bold">All 4 verification document categories uploaded</p>
              <p className="text-muted-foreground">
                You have uploaded all required legal documents. If you need to replace any unapproved document, delete it below and upload a revised version.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleDocUpload} className="rounded-2xl border border-border bg-muted/20 p-5 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-foreground">Document Type</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background p-2.5 outline-none focus:border-primary text-xs"
                >
                  {DOC_TYPES.map((t) => {
                    const alreadyUploaded = uploadedDocTypes.has(t.value);
                    return (
                      <option key={t.value} value={t.value} disabled={alreadyUploaded}>
                        {t.label} {alreadyUploaded ? "(Already Uploaded)" : ""}
                      </option>
                    );
                  })}
                </select>
                {uploadedDocTypes.has(docType) && (
                  <p className="mt-1 text-[11px] text-destructive">
                    A document for this type has already been uploaded.
                  </p>
                )}
              </div>

              <div>
                <label className="block font-semibold mb-1 text-foreground">
                  Official Document File (PDF, PNG, JPG up to 5MB)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/webp"
                  className="hidden"
                  id="org-doc-file-input"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    if (f) {
                      if (f.size > 5 * 1024 * 1024) {
                        setDocError("File size exceeds 5MB limit. Please choose a file up to 5MB.");
                        setSelectedFile(null);
                        setFileName("");
                        if (fileInputRef.current) fileInputRef.current.value = "";
                        return;
                      }
                      setDocError(null);
                      setSelectedFile(f);
                      setFileName(f.name);
                    }
                  }}
                />
                {selectedFile ? (
                  <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 p-2.5 text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <span className="font-semibold text-foreground truncate">
                        {selectedFile.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setFileName("");
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      title="Remove file"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="org-doc-file-input"
                    className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-background p-2.5 text-xs text-muted-foreground hover:border-primary hover:text-foreground transition-colors"
                  >
                    <Upload className="h-4 w-4 text-primary" />
                    <span>Choose file to upload (Max 5MB)</span>
                  </label>
                )}
              </div>
            </div>

            {docSuccess && (
              <div className="rounded-xl bg-teal-500/10 border border-teal-500/20 p-3 text-xs text-teal-700 dark:text-teal-300 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>{docSuccess}</span>
              </div>
            )}

            {docError && (
              <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{docError}</span>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={docPending || (!selectedFile && !fileName.trim()) || uploadedDocTypes.has(docType)}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {docPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                Submit Verification Document
              </button>
            </div>
          </form>
        )}

        {/* Uploaded Documents List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Uploaded Documents ({documents.length})
          </h3>

          {documents.length > 0 ? (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <span className="font-semibold text-foreground">
                        {doc.file_path.includes("/")
                          ? doc.file_path.split("/").pop()?.replace(/^\d+-/, "") || doc.file_path
                          : doc.file_path}
                      </span>
                      <span className="block text-[11px] text-muted-foreground capitalize">
                        {doc.doc_type.replace(/_/g, " ")} • {new Date(doc.created_at).toLocaleDateString("en-ET")}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {doc.status === "approved" ? (
                      <span className="inline-flex items-center gap-1 text-teal-600 font-semibold text-xs">
                        <CheckCircle className="h-4 w-4" />
                        Approved
                      </span>
                    ) : doc.status === "rejected" ? (
                      <span className="inline-flex items-center gap-1 text-destructive font-semibold text-xs">
                        <AlertCircle className="h-4 w-4" />
                        Rejected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-600 font-semibold text-xs">
                        <Clock className="h-4 w-4" />
                        Under Review
                      </span>
                    )}

                    {doc.status !== "approved" && (
                      <button
                        type="button"
                        onClick={() => handleDeleteDoc(doc.id)}
                        disabled={deletingId === doc.id}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ml-1"
                        title="Delete document to re-upload"
                      >
                        {deletingId === doc.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
              No verification documents submitted yet.
            </div>
          )}
        </div>
      </div>

      {/* Organization Information Form */}
      <form
        onSubmit={handleProfileSubmit}
        className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6"
      >
        <h2 className="font-display text-base font-bold text-foreground">
          Public Organization Information
        </h2>

        {profileSuccess && (
          <div className="rounded-xl bg-teal-500/10 border border-teal-500/20 p-3 text-xs text-teal-700 dark:text-teal-300 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>{profileSuccess}</span>
          </div>
        )}

        {profileError && (
          <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{profileError}</span>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 text-xs">
          <div>
            <label className="block font-semibold mb-1">Organization Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-xl border border-input bg-background p-2.5 outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Registration License Number</label>
            <input
              type="text"
              value={regNo}
              onChange={(e) => setRegNo(e.target.value)}
              placeholder="e.g. NGO-AA-19842"
              className="w-full rounded-xl border border-input bg-background p-2.5 outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+251 11 ..."
              className="w-full rounded-xl border border-input bg-background p-2.5 outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Official Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contact@org.et"
              className="w-full rounded-xl border border-input bg-background p-2.5 outline-none focus:border-primary"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold mb-1">Headquarters Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Kirkos Subcity, Addis Ababa"
              className="w-full rounded-xl border border-input bg-background p-2.5 outline-none focus:border-primary"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold mb-1">Organization Mission & Description</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-input bg-background p-2.5 outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-border">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save Profile Changes
          </button>
        </div>
      </form>
    </div>
  );
}
