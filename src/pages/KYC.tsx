import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [step, setStep] = useState(1);

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
            <span>Verification takes ~5 minutes</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Zap className="h-4 w-4" />
            <span>AI-powered instant approval</span>
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

          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input placeholder="John" />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input placeholder="Doe" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <Label>Country of Residence</Label>
                <Select>
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
                <Input placeholder="123 Main Street" />
              </div>
              <Button className="w-full" size="lg" onClick={() => setStep(2)}>Continue</Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Document Type</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select document" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="passport">Passport</SelectItem>
                    <SelectItem value="id">National ID</SelectItem>
                    <SelectItem value="license">Driver's License</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="border-2 border-dashed rounded-lg p-10 text-center hover:border-foreground/30 hover:bg-muted/30 transition-all cursor-pointer group">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3 group-hover:bg-foreground group-hover:text-background transition-colors">
                  <Upload className="h-6 w-6" />
                </div>
                <p className="font-medium mb-1">Upload Document</p>
                <p className="text-sm text-muted-foreground">PNG, JPG or PDF up to 10MB</p>
                <p className="text-xs text-muted-foreground mt-2">Click or drag and drop</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-buy mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">Your documents are encrypted and processed by our AI verification system. They are never shared with third parties.</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" size="lg" onClick={() => setStep(1)}>Back</Button>
                <Button className="flex-1" size="lg" onClick={() => setStep(3)}>Continue</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-10 text-center hover:border-foreground/30 hover:bg-muted/30 transition-all cursor-pointer group">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3 group-hover:bg-foreground group-hover:text-background transition-colors">
                  <Camera className="h-6 w-6" />
                </div>
                <p className="font-medium mb-1">Take a Selfie</p>
                <p className="text-sm text-muted-foreground">Hold your document next to your face</p>
                <p className="text-xs text-muted-foreground mt-2">Make sure lighting is good and face is clearly visible</p>
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
                <Button className="flex-1" size="lg" onClick={() => navigate("/dashboard")}>Submit for Review</Button>
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
