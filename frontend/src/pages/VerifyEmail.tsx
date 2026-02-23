import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Mail, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { API_BASE, api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [resendMessage, setResendMessage] = useState("");

  useEffect(() => {
    if (!token) return;
    setStatus("verifying");
    fetch(`${API_BASE}/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setStatus("success");
          setMessage("Your email is verified. You can now log in.");
        } else {
          setStatus("error");
          setMessage((data as { error?: string }).error ?? "Verification failed.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Verification request failed. Check the link or try again.");
      });
  }, [token]);

  useEffect(() => {
    const qp = searchParams.get("email");
    if (qp) setEmail(qp);
  }, [searchParams]);

  const handleResend = async () => {
    setResendMessage("");
    setResendStatus("sending");
    try {
      const res = await api.resendVerification(email.trim());
      setResendStatus("sent");
      setResendMessage(res.message ?? "Verification email sent.");
    } catch (err: unknown) {
      setResendStatus("error");
      setResendMessage(err instanceof Error ? err.message : "Failed to resend verification email.");
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mx-auto">
          <Mail className="h-7 w-7 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold">Verify your email</h1>
        {!token && (
          <p className="text-muted-foreground">
            Check your inbox for a verification link and click it. If you didn’t receive it, resend below.
          </p>
        )}
        {token && status === "verifying" && <p className="text-muted-foreground">Verifying…</p>}
        {token && status === "success" && <p className="text-muted-foreground">{message}</p>}
        {token && status === "error" && <p className="text-destructive">{message}</p>}

        {!token && (
          <div className="text-left space-y-2">
            <Label htmlFor="resend-email">Email</Label>
            <Input
              id="resend-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {resendMessage && (
              <p className={resendStatus === "sent" ? "text-xs text-muted-foreground" : "text-xs text-destructive"}>
                {resendMessage}
              </p>
            )}
            <Button
              className="w-full"
              onClick={handleResend}
              disabled={resendStatus === "sending" || !email.trim()}
            >
              {resendStatus === "sending" ? "Sending…" : "Resend verification email"}
            </Button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link to="/login">Go to Log in <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/">Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
