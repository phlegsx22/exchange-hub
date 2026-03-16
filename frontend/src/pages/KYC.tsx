import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import {
  CheckCircle, Upload, User, FileText, Camera, Shield, ShieldCheck,
  Clock, Lock, Zap, BadgeCheck, Globe
} from "lucide-react";

const steps = [
  { id: 1, label: "Personal Info", icon: User, desc: "Basic details" },
  { id: 2, label: "Document Upload", icon: FileText, desc: "ID verification" },
  { id: 3, label: "Selfie Verification", icon: Camera, desc: "Face match" },
];

export default function KYC() {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(1);

  const [loadingStatus, setLoadingStatus] = useState(true);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<string>("none");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [countryOfResidence, setCountryOfResidence] = useState<string>("");
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");

  const [documentType, setDocumentType] = useState<"passport" | "national_id" | "drivers_license" | "">("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentBackFile, setDocumentBackFile] = useState<File | null>(null);
  const [proofOfAddressFile, setProofOfAddressFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);

  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [documentBackUrl, setDocumentBackUrl] = useState<string | null>(null);
  const [proofOfAddressUrl, setProofOfAddressUrl] = useState<string | null>(null);
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);

  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadingSelfie, setUploadingSelfie] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const redirectReason =
    typeof (location.state as { reason?: unknown } | null)?.reason === "string"
      ? ((location.state as { reason?: string }).reason ?? null)
      : null;

  const docInputRef = useRef<HTMLInputElement | null>(null);
  const docBackInputRef = useRef<HTMLInputElement | null>(null);
  const proofInputRef = useRef<HTMLInputElement | null>(null);
  const selfieInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingStatus(true);
    setStatusError(null);
    api
      .kycStatus()
      .then((s) => {
        if (cancelled) return;
        setCurrentStatus(s.kycStatus ?? "none");
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setStatusError(e instanceof Error ? e.message : "Failed to load KYC status");
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingStatus(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const canContinueStep1 = useMemo(() => {
    return (
      firstName.trim().length > 0 &&
      lastName.trim().length > 0 &&
      dateOfBirth.trim().length > 0 &&
      countryOfResidence.trim().length === 2 &&
      address.trim().length > 0 &&
      phoneNumber.trim().length >= 6 &&
      emergencyContactName.trim().length > 0 &&
      emergencyContactPhone.trim().length >= 6
    );
  }, [firstName, lastName, dateOfBirth, countryOfResidence, address, phoneNumber, emergencyContactName, emergencyContactPhone]);

  async function uploadIfNeeded(
    kind: "document" | "selfie" | "document_back" | "proof_of_address",
    file: File | null
  ): Promise<string | null> {
    if (!file) return null;
    const result = await api.uploadKycMedia(file, kind);
    return result.url;
  }

  async function handleContinueFromStep2(): Promise<void> {
    setFormError(null);
    if (!documentType) {
      setFormError("Please select a document type.");
      return;
    }
    if (!documentNumber.trim()) {
      setFormError("Please provide your document number.");
      return;
    }
    if (!documentFile) {
      setFormError("Please upload a document image or PDF.");
      return;
    }

    setUploadingDoc(true);
    try {
      const url = await uploadIfNeeded("document", documentFile);
      const backUrl = await uploadIfNeeded("document_back", documentBackFile);
      const proofUrl = await uploadIfNeeded("proof_of_address", proofOfAddressFile);
      setDocumentUrl(url);
      setDocumentBackUrl(backUrl);
      setProofOfAddressUrl(proofUrl);
      setStep(3);
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Failed to upload document");
    } finally {
      setUploadingDoc(false);
    }
  }

  async function handleSubmit(): Promise<void> {
    setFormError(null);
    if (!documentType) {
      setFormError("Please select a document type.");
      return;
    }
    if (!documentUrl) {
      setFormError("Document upload missing. Please go back and upload your document.");
      return;
    }
    if (!selfieFile) {
      setFormError("Please upload a selfie.");
      return;
    }

    setSubmitting(true);
    try {
      setUploadingSelfie(true);
      const sUrl = selfieUrl ?? (await uploadIfNeeded("selfie", selfieFile));
      setSelfieUrl(sUrl);
      setUploadingSelfie(false);

      await api.kycSubmit({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth,
        countryOfResidence: countryOfResidence.toLowerCase(),
        address: address.trim(),
        phoneNumber: phoneNumber.trim(),
        emergencyContactName: emergencyContactName.trim(),
        emergencyContactPhone: emergencyContactPhone.trim(),
        documentType: documentType as "passport" | "national_id" | "drivers_license",
        documentNumber: documentNumber.trim(),
        documentUrl: documentUrl ?? undefined,
        documentBackUrl: documentBackUrl ?? undefined,
        proofOfAddressUrl: proofOfAddressUrl ?? undefined,
        selfieUrl: sUrl ?? undefined,
      });

      navigate("/dashboard");
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "KYC submission failed");
    } finally {
      setUploadingSelfie(false);
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* Left sidebar - progress */}
      <div className="hidden lg:flex flex-col w-80 border-r bg-card p-8">
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-1">Identity Verification</h2>
          <p className="text-sm text-muted-foreground">Complete KYC to unlock full features</p>
        </div>

        <div className="space-y-6 flex-1">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className={`flex items-center justify-center h-10 w-10 rounded-full text-sm font-medium transition-all ${
                  step > s.id ? "bg-buy text-primary-foreground" : step === s.id ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
                }`}>
                  {step > s.id ? <CheckCircle className="h-5 w-5" /> : <s.icon className="h-5 w-5" />}
                </div>
                {i < steps.length - 1 && (
                  <div className={`w-0.5 h-12 mt-2 rounded-full ${step > s.id ? "bg-buy" : "bg-border"}`} />
                )}
              </div>
              <div className="pt-2">
                <p className={`font-medium text-sm ${step === s.id ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</p>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="space-y-3 pt-6 border-t">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>Your data is encrypted end-to-end</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Manual review typically takes 5-30 minutes</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Zap className="h-4 w-4" />
            <span>Free-stack OCR + liveness assistive checks</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-4 w-4" />
            <span>GDPR & SOC 2 compliant</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          {/* Mobile progress */}
          <div className="lg:hidden mb-8">
            <div className="flex items-center gap-2 mb-4">
              {steps.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2 flex-1">
                  <div className={`flex items-center justify-center h-8 w-8 rounded-full text-sm font-medium shrink-0 ${
                    step > s.id ? "bg-buy text-primary-foreground" : step === s.id ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
                  }`}>
                    {step > s.id ? <CheckCircle className="h-4 w-4" /> : s.id}
                  </div>
                  {i < steps.length - 1 && <div className={`h-px flex-1 ${step > s.id ? "bg-buy" : "bg-border"}`} />}
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground mb-3">
              Step {step} of 3
            </div>
            <h1 className="text-2xl font-bold">{steps[step - 1].label}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {step === 1 && "Please provide your basic personal information."}
              {step === 2 && "Upload a valid government-issued ID document."}
              {step === 3 && "Take a selfie holding your ID for face matching."}
            </p>
          </div>

          {(redirectReason || loadingStatus || statusError || currentStatus !== "none") && (
            <div className="mb-4 rounded-lg border p-3 text-sm">
              {redirectReason ? (
                <p className="text-muted-foreground">{redirectReason}</p>
              ) : loadingStatus ? (
                <p className="text-muted-foreground">Loading your KYC status…</p>
              ) : statusError ? (
                <p className="text-destructive">{statusError}</p>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <p className="text-muted-foreground">Current status</p>
                  <span className="font-medium">{currentStatus.replace("_", " ")}</span>
                </div>
              )}
            </div>
          )}

          {formError && (
            <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {formError}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input placeholder="John" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input placeholder="Doe" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Country of Residence</Label>
                <Select value={countryOfResidence} onValueChange={setCountryOfResidence}>
                  <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="us">United States</SelectItem>
                    <SelectItem value="uk">United Kingdom</SelectItem>
                    <SelectItem value="de">Germany</SelectItem>
                    <SelectItem value="jp">Japan</SelectItem>
                    <SelectItem value="sg">Singapore</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input placeholder="123 Main Street" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input placeholder="+1 555 123 4567" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Emergency Contact Name</Label>
                  <Input placeholder="Jane Doe" value={emergencyContactName} onChange={(e) => setEmergencyContactName(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Emergency Contact Phone</Label>
                <Input placeholder="+1 555 111 2222" value={emergencyContactPhone} onChange={(e) => setEmergencyContactPhone(e.target.value)} />
              </div>
              <Button className="w-full" size="lg" onClick={() => setStep(2)} disabled={!canContinueStep1}>
                Continue
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Document Type</Label>
                <Select value={documentType} onValueChange={(v) => setDocumentType(v as typeof documentType)}>
                  <SelectTrigger><SelectValue placeholder="Select document" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="passport">Passport</SelectItem>
                    <SelectItem value="national_id">National ID</SelectItem>
                    <SelectItem value="drivers_license">Driver's License</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Document Number</Label>
                <Input
                  placeholder="Enter your passport/ID number"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                />
              </div>
              <input
                ref={docInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setDocumentFile(f);
                  setDocumentUrl(null);
                }}
              />
              <div
                className="border-2 border-dashed rounded-lg p-10 text-center hover:border-foreground/30 hover:bg-muted/30 transition-all cursor-pointer group"
                onClick={() => docInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") docInputRef.current?.click();
                }}
              >
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3 group-hover:bg-foreground group-hover:text-background transition-colors">
                  <Upload className="h-6 w-6" />
                </div>
                <p className="font-medium mb-1">Upload Document</p>
                <p className="text-sm text-muted-foreground">PNG, JPG or PDF up to 10MB</p>
                <p className="text-xs text-muted-foreground mt-2">Click or drag and drop</p>
                {documentFile && (
                  <p className="text-xs text-muted-foreground mt-3">
                    Selected: <span className="font-medium text-foreground">{documentFile.name}</span>
                  </p>
                )}
              </div>
              <input
                ref={docBackInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setDocumentBackFile(f);
                  setDocumentBackUrl(null);
                }}
              />
              <Button variant="outline" size="sm" type="button" onClick={() => docBackInputRef.current?.click()}>
                Upload back of ID (optional)
              </Button>
              {documentBackFile && (
                <p className="text-xs text-muted-foreground -mt-2">
                  Back side: <span className="font-medium text-foreground">{documentBackFile.name}</span>
                </p>
              )}
              <input
                ref={proofInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setProofOfAddressFile(f);
                  setProofOfAddressUrl(null);
                }}
              />
              <Button variant="outline" size="sm" type="button" onClick={() => proofInputRef.current?.click()}>
                Upload proof of address (optional)
              </Button>
              {proofOfAddressFile && (
                <p className="text-xs text-muted-foreground -mt-2">
                  Proof of address: <span className="font-medium text-foreground">{proofOfAddressFile.name}</span>
                </p>
              )}
              <div className="rounded-lg bg-muted/50 p-3 flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-buy mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">Your documents are encrypted and processed by our AI verification system. They are never shared with third parties.</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" size="lg" onClick={() => setStep(1)}>Back</Button>
                <Button className="flex-1" size="lg" onClick={handleContinueFromStep2} disabled={uploadingDoc}>
                  {uploadingDoc ? "Uploading…" : "Continue"}
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <input
                ref={selfieInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setSelfieFile(f);
                  setSelfieUrl(null);
                }}
              />
              <div
                className="border-2 border-dashed rounded-lg p-10 text-center hover:border-foreground/30 hover:bg-muted/30 transition-all cursor-pointer group"
                onClick={() => selfieInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") selfieInputRef.current?.click();
                }}
              >
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3 group-hover:bg-foreground group-hover:text-background transition-colors">
                  <Camera className="h-6 w-6" />
                </div>
                <p className="font-medium mb-1">Take a Selfie</p>
                <p className="text-sm text-muted-foreground">Hold your document next to your face</p>
                <p className="text-xs text-muted-foreground mt-2">Make sure lighting is good and face is clearly visible</p>
                {selfieFile && (
                  <p className="text-xs text-muted-foreground mt-3">
                    Selected: <span className="font-medium text-foreground">{selfieFile.name}</span>
                  </p>
                )}
              </div>
              <div className="rounded-lg border p-4 space-y-2">
                <p className="text-xs font-semibold flex items-center gap-1.5"><BadgeCheck className="h-3.5 w-3.5 text-buy" /> Tips for approval</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Ensure your full face is visible and well-lit</li>
                  <li>• Hold your ID document beside your face</li>
                  <li>• Remove glasses, hats, or face coverings</li>
                  <li>• Use a plain background if possible</li>
                </ul>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" size="lg" onClick={() => setStep(2)}>Back</Button>
                <Button
                  className="flex-1"
                  size="lg"
                  onClick={handleSubmit}
                  disabled={submitting || uploadingSelfie}
                >
                  {submitting || uploadingSelfie ? "Submitting…" : "Submit for Review"}
                </Button>
              </div>
            </div>
          )}

          {/* Bottom trust */}
          <div className="flex items-center justify-center gap-4 mt-8 pt-6 border-t">
            {[
              { icon: Shield, label: "256-bit encryption" },
              { icon: Globe, label: "180+ countries" },
              { icon: Zap, label: "Instant verification" },
            ].map((b, i) => (
              <div key={i} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <b.icon className="h-3 w-3" /> {b.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
