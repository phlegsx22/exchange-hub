import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getStoredAuth, setStoredAuth } from "@/lib/api";
import {
  User,
  Shield,
  Mail,
  Lock,
  Phone,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Camera,
  Globe,
  Bell,
  Smartphone,
  Key,
  Eye,
  EyeOff,
} from "lucide-react";

type TabKey = "general" | "security" | "notifications";

export default function Profile() {
  const location = useLocation();
  const { toast } = useToast();

  const auth = useMemo(() => getStoredAuth(), []);
  const user = auth?.user;

  const defaultTab: TabKey = location.pathname === "/security" ? "security" : "general";

  const [displayName, setDisplayName] = useState(user?.name ?? "");
  const [email] = useState(user?.email ?? "");
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneCountryCode, setPhoneCountryCode] = useState("+1");
  const [twoFaEnabled] = useState(false);
  const [antiPhishingCode, setAntiPhishingCode] = useState("");
  const [withdrawalWhitelist, setWithdrawalWhitelist] = useState(false);
  const [loginNotifications, setLoginNotifications] = useState(true);
  const [withdrawalNotifications, setWithdrawalNotifications] = useState(true);
  const [tradeNotifications, setTradeNotifications] = useState(false);
  const [copied, setCopied] = useState(false);

  const uid = user?.id ?? "—";
  const kycStatus = user?.kycStatus ?? "none";
  const initials = (user?.name ?? "U").slice(0, 2).toUpperCase();

  function copyUid() {
    if (!uid || uid === "—") return;
    navigator.clipboard.writeText(uid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "UID copied to clipboard" });
  }

  function handleSaveName() {
    const current = getStoredAuth();
    if (!current) return;
    setStoredAuth({
      ...current,
      user: {
        ...current.user,
        name: displayName.trim() || current.user.name,
      },
    });
    toast({ title: "Display name updated", description: `Name set to "${displayName.trim() || current.user.name}"` });
  }

  function handleChangeEmail() {
    if (!newEmail) return;
    toast({ title: "Verification email sent", description: `Check ${newEmail} to confirm the change.` });
    setNewEmail("");
  }

  function handleChangePassword() {
    if (!currentPassword || !newPassword) return;
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    toast({ title: "Password updated successfully" });
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  function handleBindPhone() {
    if (!phoneNumber) return;
    toast({ title: "Verification code sent", description: `SMS sent to ${phoneCountryCode}${phoneNumber}` });
  }

  function handleEnable2fa() {
    toast({ title: "2FA Setup", description: "Scan the QR code with your authenticator app." });
  }

  return (
    <div className="container max-w-4xl py-6 sm:py-10 space-y-6">
      {/* Profile header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative group">
          <Avatar className="h-20 w-20 border-2 border-border">
            <AvatarImage src="" />
            <AvatarFallback className="text-xl font-bold bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <button
            type="button"
            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => toast({ title: "Coming soon", description: "Avatar uploads will be added next." })}
            aria-label="Change avatar"
          >
            <Camera className="h-5 w-5 text-white" />
          </button>
        </div>
        <div className="flex-1 space-y-1">
          <h1 className="text-2xl font-bold">{user?.name ?? "User"}</h1>
          <p className="text-muted-foreground text-sm">{email}</p>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <Badge variant={kycStatus === "approved" ? "default" : "secondary"} className="text-xs">
              {kycStatus === "approved" ? (
                <>
                  <CheckCircle2 className="h-3 w-3 mr-1" /> KYC Verified
                </>
              ) : (
                <>
                  <AlertTriangle className="h-3 w-3 mr-1" /> KYC: {kycStatus}
                </>
              )}
            </Badge>
            <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
              UID: {uid === "—" ? "—" : `${uid.slice(0, 8)}…`}
              <button onClick={copyUid} className="hover:text-foreground transition-colors" type="button">
                {copied ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
              </button>
            </span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Settings tabs */}
      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted p-1">
          <TabsTrigger value="general" className="gap-1.5 text-xs sm:text-sm">
            <User className="h-3.5 w-3.5" /> General
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-1.5 text-xs sm:text-sm">
            <Shield className="h-3.5 w-3.5" /> Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5 text-xs sm:text-sm">
            <Bell className="h-3.5 w-3.5" /> Notifications
          </TabsTrigger>
        </TabsList>

        {/* ─── General ─── */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-4 w-4" /> Display Name
              </CardTitle>
              <CardDescription>This name is visible to other users during P2P trades.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter display name"
                  className="flex-1"
                />
                <Button onClick={handleSaveName} className="sm:w-auto w-full">Save</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Key className="h-4 w-4" /> Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">User ID (UID)</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-sm font-mono bg-muted px-2 py-1 rounded flex-1 truncate">{uid}</code>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={copyUid} type="button">
                      {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Account Type</Label>
                  <p className="text-sm mt-1 font-medium">Personal</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">KYC Status</Label>
                  <p className="text-sm mt-1 capitalize font-medium">{kycStatus}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Email Verified</Label>
                  <p className="text-sm mt-1 font-medium">{user?.emailVerified ? "Yes" : "No"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="h-4 w-4" /> Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Language</Label>
                <Select defaultValue="en">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="zh">中文</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="ar">العربية</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Currency Display</Label>
                <Select defaultValue="usd">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usd">USD ($)</SelectItem>
                    <SelectItem value="eur">EUR (€)</SelectItem>
                    <SelectItem value="gbp">GBP (£)</SelectItem>
                    <SelectItem value="jpy">JPY (¥)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Security ─── */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="h-4 w-4" /> Email Address
              </CardTitle>
              <CardDescription>
                Current: <span className="font-medium text-foreground">{email}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="New email address"
                  className="flex-1"
                />
                <Button onClick={handleChangeEmail} variant="outline" className="sm:w-auto w-full">
                  Change Email
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lock className="h-4 w-4" /> Password
              </CardTitle>
              <CardDescription>Use a strong, unique password you don't use elsewhere.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Current Password</Label>
                <div className="relative">
                  <Input
                    type={showCurrentPw ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                  >
                    {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>New Password</Label>
                <div className="relative">
                  <Input
                    type={showNewPw ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowNewPw(!showNewPw)}
                  >
                    {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>
              <Button onClick={handleChangePassword} className="w-full sm:w-auto">Update Password</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Phone className="h-4 w-4" /> Phone Number
              </CardTitle>
              <CardDescription>Used for SMS verification and account recovery.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={phoneCountryCode} onValueChange={setPhoneCountryCode}>
                  <SelectTrigger className="w-full sm:w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="+1">+1</SelectItem>
                    <SelectItem value="+44">+44</SelectItem>
                    <SelectItem value="+86">+86</SelectItem>
                    <SelectItem value="+91">+91</SelectItem>
                    <SelectItem value="+81">+81</SelectItem>
                    <SelectItem value="+971">+971</SelectItem>
                    <SelectItem value="+234">+234</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Phone number"
                  className="flex-1"
                />
                <Button onClick={handleBindPhone} variant="outline" className="sm:w-auto w-full">
                  Bind Phone
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Smartphone className="h-4 w-4" /> Two-Factor Authentication (2FA)
              </CardTitle>
              <CardDescription>Add an extra layer of security using an authenticator app.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{twoFaEnabled ? "2FA is enabled" : "2FA is not enabled"}</p>
                  <p className="text-xs text-muted-foreground">
                    {twoFaEnabled
                      ? "Your account is protected with TOTP authentication."
                      : "Enable 2FA to secure your account against unauthorized access."}
                  </p>
                </div>
                <Badge variant={twoFaEnabled ? "default" : "secondary"}>{twoFaEnabled ? "Active" : "Inactive"}</Badge>
              </div>
              <Button
                onClick={handleEnable2fa}
                variant={twoFaEnabled ? "destructive" : "default"}
                className="w-full sm:w-auto"
              >
                {twoFaEnabled ? "Disable 2FA" : "Enable 2FA"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-4 w-4" /> Anti-Phishing Code
              </CardTitle>
              <CardDescription>
                Set a code that will appear in all official Annex-Ebank emails so you can verify authenticity.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  value={antiPhishingCode}
                  onChange={(e) => setAntiPhishingCode(e.target.value)}
                  placeholder="Enter anti-phishing code"
                  maxLength={20}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  className="sm:w-auto w-full"
                  onClick={() => toast({ title: "Anti-phishing code saved" })}
                  type="button"
                >
                  Save Code
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center justify-between py-6">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Withdrawal Address Whitelist</p>
                <p className="text-xs text-muted-foreground">Only allow withdrawals to pre-approved addresses.</p>
              </div>
              <Switch checked={withdrawalWhitelist} onCheckedChange={setWithdrawalWhitelist} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Notifications ─── */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-4 w-4" /> Email Notifications
              </CardTitle>
              <CardDescription>Choose which notifications you want to receive.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  label: "Login Notifications",
                  desc: "Receive an email when a new device logs into your account.",
                  checked: loginNotifications,
                  onChange: setLoginNotifications,
                },
                {
                  label: "Withdrawal Notifications",
                  desc: "Get notified when a withdrawal is initiated or completed.",
                  checked: withdrawalNotifications,
                  onChange: setWithdrawalNotifications,
                },
                {
                  label: "Trade Notifications",
                  desc: "Receive updates on your open orders and trade executions.",
                  checked: tradeNotifications,
                  onChange: setTradeNotifications,
                },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch checked={item.checked} onCheckedChange={item.onChange} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

