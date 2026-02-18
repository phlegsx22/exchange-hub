import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Ban, ShieldCheck, AlertTriangle } from "lucide-react";
import { mockUsers } from "@/lib/admin-mock-data";

export default function AdminBlacklist() {
  const [users, setUsers] = useState(mockUsers);
  const [search, setSearch] = useState("");

  const blacklisted = users.filter(u => u.status === "blacklisted" && (
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  ));

  const removeFromBlacklist = (id: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: "active" as const } : u));
  };

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Ban className="h-6 w-6 text-sell" /> Blacklisted Users
        </h1>
        <p className="text-sm text-muted-foreground">{blacklisted.length} users currently blacklisted</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search blacklisted users..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {blacklisted.length === 0 ? (
            <div className="p-8 text-center">
              <ShieldCheck className="h-8 w-8 mx-auto text-buy mb-2" />
              <p className="font-medium">No blacklisted users</p>
              <p className="text-sm text-muted-foreground">All users are in good standing</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Risk Score</TableHead>
                  <TableHead className="hidden md:table-cell">Country</TableHead>
                  <TableHead className="hidden md:table-cell">Joined</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blacklisted.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 text-sell" />
                        <span className="font-mono text-sm">{user.riskScore}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{user.country}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{user.joinDate}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => removeFromBlacklist(user.id)}>
                        <ShieldCheck className="h-3.5 w-3.5" /> Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
