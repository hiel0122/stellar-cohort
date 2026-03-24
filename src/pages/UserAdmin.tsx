import { useState, useEffect, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, Users, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { CLEARANCE_LABELS } from "@/lib/auth";
import { UserDetailDrawer } from "@/components/UserDetailDrawer";

interface ProfileRow {
  id: string;
  email: string;
  full_name: string | null;
  department: string | null;
  title: string | null;
  role: string;
  clearance_level: number;
  allow_pages: string[] | null;
  deny_pages: string[] | null;
  created_at: string;
}

const ROLES = ["admin", "education", "marketing", "pending"] as const;

const roleBadgeColor: Record<string, string> = {
  admin: "bg-red-500/15 text-red-600 border-red-500/30 dark:text-red-400",
  education: "bg-blue-500/15 text-blue-600 border-blue-500/30 dark:text-blue-400",
  marketing: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400",
  pending: "bg-muted text-muted-foreground border-border",
};

export default function UserAdmin() {
  const { role: myRole } = useAuth();
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedProfile, setSelectedProfile] = useState<ProfileRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => { fetchProfiles(); }, []);

  async function fetchProfiles() {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, department, title, role, clearance_level, allow_pages, deny_pages, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("사용자 목록을 불러오지 못했습니다.");
      console.error(error);
    } else {
      setProfiles((data as unknown as ProfileRow[]) ?? []);
    }
    setLoading(false);
  }

  const filtered = useMemo(() => {
    let list = profiles;
    // Show pending users first
    list = [...list].sort((a, b) => {
      if (a.role === "pending" && b.role !== "pending") return -1;
      if (a.role !== "pending" && b.role === "pending") return 1;
      return 0;
    });
    if (roleFilter !== "all") {
      list = list.filter((p) => p.role === roleFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          (p.full_name ?? "").toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q)
      );
    }
    return list;
  }, [profiles, search, roleFilter]);

  function handleRowClick(p: ProfileRow) {
    setSelectedProfile(p);
    setDrawerOpen(true);
  }

  if (myRole !== "admin") {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <h2 className="text-lg font-semibold text-foreground">접근 권한이 없습니다</h2>
          <p className="text-sm text-muted-foreground mt-1">관리자만 이 페이지에 접근할 수 있습니다.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">사용자 권한 관리</h1>
          <p className="text-sm text-muted-foreground mt-1">
            사용자별 권한·등급·페이지 접근을 조회하고 변경할 수 있습니다.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="이름 또는 이메일 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-[160px] h-10">
              <SelectValue placeholder="전체 권한" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {ROLES.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px]">이름</TableHead>
                  <TableHead className="min-w-[180px]">이메일</TableHead>
                  <TableHead className="min-w-[80px]">부서</TableHead>
                  <TableHead className="min-w-[60px]">직급</TableHead>
                  <TableHead className="min-w-[80px]">권한</TableHead>
                  <TableHead className="min-w-[60px]">등급</TableHead>
                  <TableHead className="min-w-[80px]">가입일</TableHead>
                  <TableHead className="w-[40px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                      검색 결과가 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((p) => (
                    <TableRow
                      key={p.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleRowClick(p)}
                    >
                      <TableCell className="font-medium">{p.full_name ?? "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.email}</TableCell>
                      <TableCell className="text-sm">{p.department ?? "—"}</TableCell>
                      <TableCell className="text-sm">{p.title ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${roleBadgeColor[p.role] ?? ""}`}>
                          {p.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        Lv.{p.clearance_level ?? 1} {CLEARANCE_LABELS[p.clearance_level ?? 1] ?? ""}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(p.created_at).toLocaleDateString("ko-KR")}
                      </TableCell>
                      <TableCell>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <UserDetailDrawer
        profile={selectedProfile}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onSaved={fetchProfiles}
      />
    </Layout>
  );
}
