import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Upload, User, FileText, Camera } from "lucide-react";

const steps = [
  { id: 1, label: "Personal Info", icon: User },
  { id: 2, label: "Document Upload", icon: FileText },
  { id: 3, label: "Selfie Verification", icon: Camera },
];

export default function KYC() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <h1 className="text-2xl font-bold mb-1">Identity Verification</h1>
        <p className="text-muted-foreground mb-8">Complete KYC to unlock full trading features</p>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2 flex-1">
              <div className={`flex items-center justify-center h-8 w-8 rounded-full text-sm font-medium shrink-0 ${
                step > s.id ? "bg-buy text-primary-foreground" : step === s.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {step > s.id ? <CheckCircle className="h-4 w-4" /> : s.id}
              </div>
              {i < steps.length - 1 && <div className={`h-px flex-1 ${step > s.id ? "bg-buy" : "bg-border"}`} />}
            </div>
          ))}
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
            <div className="border-2 border-dashed rounded-lg p-10 text-center">
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium mb-1">Upload Document</p>
              <p className="text-sm text-muted-foreground">PNG, JPG or PDF up to 10MB</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" size="lg" onClick={() => setStep(1)}>Back</Button>
              <Button className="flex-1" size="lg" onClick={() => setStep(3)}>Continue</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-10 text-center">
              <Camera className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium mb-1">Take a Selfie</p>
              <p className="text-sm text-muted-foreground">Hold your document next to your face</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" size="lg" onClick={() => setStep(2)}>Back</Button>
              <Button className="flex-1" size="lg" onClick={() => navigate("/dashboard")}>Submit</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
