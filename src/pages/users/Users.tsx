import { useEffect, useRef, useState } from "react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserFormModal } from "./UserFormModal";
import {
  getUsers,
  toggleUserActive,
  deleteUser,
  type User,
} from "@/services/userService";
import { MoreHorizontal, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ROLE_LABELS: Record<string, string> = {
  super_admin:            "Super Admin",
  event_operator:         "Event Operator",
  communication_operator: "Communication Operator",
  survey_analyst:         "Survey Analyst",
};

const ROLE_COLORS: Record<string, string> = {
  super_admin:            "bg-violet-100 text-violet-700",
  event_operator:         "bg-blue-100 text-blue-700",
  communication_operator: "bg-amber-100 text-amber-700",
  survey_analyst:         "bg-emerald-100 text-emerald-700",
};

export function Users() {
  const [users, setUsers]               = useState<User[]>([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [search, setSearch]             = useState("");
  const [roleFilter, setRoleFilter]     = useState("");
  const [page, setPage]                 = useState(1);
  const [totalPages, setTotalPages]     = useState(1);
  const [total, setTotal]               = useState(0);
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [editingUser, setEditingUser]   = useState<User | undefined>(undefined);
  const [togglingId, setTogglingId]     = useState<string | null>(null);
  const [deletingId, setDeletingId]     = useState<string | null>(null);
  const [deleteError, setDeleteError]   = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchUsers = async (opts?: { page?: number; search?: string; role?: string }) => {
    setIsLoading(true);
    const result = await getUsers({
      page:   opts?.page   ?? page,
      limit:  20,
      search: (opts?.search ?? search) || undefined,
      role:   (opts?.role   ?? roleFilter) || undefined,
    });
    if (result.data) {
      setUsers(result.data.items);
      setTotalPages(result.data.pagination.totalPages);
      setTotal(result.data.pagination.total);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    void fetchUsers({ page: 1 });
  }, []);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void fetchUsers({ page: 1, search: value, role: roleFilter });
    }, 400);
  };

  const handleRoleChange = (value: string) => {
    setRoleFilter(value);
    setPage(1);
    void fetchUsers({ page: 1, search, role: value });
  };

  const handlePageChange = (next: number) => {
    setPage(next);
    void fetchUsers({ page: next });
  };

  const handleToggleActive = async (user: User) => {
    setTogglingId(user._id);
    await toggleUserActive(user._id);
    setTogglingId(null);
    void fetchUsers();
  };

  const handleDelete = async (user: User) => {
    if (!window.confirm(`Delete ${user.name}? This cannot be undone.`)) return;
    setDeletingId(user._id);
    setDeleteError(null);
    const result = await deleteUser(user._id);
    setDeletingId(null);
    if (result.error) {
      setDeleteError(result.error);
      return;
    }
    void fetchUsers();
  };

  const handleOpenCreate = () => {
    setEditingUser(undefined);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleModalSuccess = () => {
    setIsModalOpen(false);
    void fetchUsers();
  };

  const limit = 20;
  const startItem = (page - 1) * limit + 1;
  const endItem   = Math.min(page * limit, total);

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex justify-between items-start pb-2 border-b border-dashed border-slate-200">
          <div>
            <h1 className="text-3xl font-bold">Users</h1>
            <p className="text-gray-500">Manage who can access the EMS dashboard.</p>
          </div>
          <Button
            className="bg-[#1a40a8] hover:bg-blue-800"
            onClick={handleOpenCreate}
          >
            + Invite User
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <span className="absolute left-3 top-1/5 text-slate-400 pointer-events-none">
              <Search className="h-4 w-4" />
            </span>
            <Input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search name or email..."
              className="w-full pl-10 bg-background border-slate-200 rounded-xl focus-visible:ring-1 focus-visible:ring-indigo-400 transition-all"
            />
          </div>

          <Select
            value={roleFilter || "all"} // Select usually expects a string, so we map "" to "all"
            onValueChange={(value) => handleRoleChange(value === "all" ? "" : value)}
          >
            <SelectTrigger className="h-10 w-[200px] rounded-lg border-slate-200 bg-slate-50 text-slate-700 focus:ring-2 focus:ring-slate-100 transition">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
              <SelectItem value="event_operator">Event Operator</SelectItem>
              <SelectItem value="communication_operator">Communication Operator</SelectItem>
              <SelectItem value="survey_analyst">Survey Analyst</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Delete error */}
        {deleteError && (
          <div className="rounded-lg border border-dashed border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {deleteError}
          </div>
        )}

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-center">Role</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Last Login</TableHead>
                <TableHead className="w-[80px] text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <TableCell key={j}>
                        <div className="h-4 bg-slate-100 rounded animate-pulse" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-slate-400 font-mono text-sm">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell className="pl-6 font-semibold text-slate-800 w-[250px]">
                      {user.name}
                      {user.organizationName && (
                        <span className="block text-xs font-normal text-slate-400">
                          {user.organizationName}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm w-[120px]">{user.email}</TableCell>
                    <TableCell className="text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${ROLE_COLORS[user.role] ?? "bg-slate-100 text-slate-600"}`}>
                        {ROLE_LABELS[user.role] ?? user.role}
                      </span>
                    </TableCell>
                    <TableCell className="text-center w-[120px]">
                      <span className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border 
                        ${user.isActive ? "bg-emerald-50 border-emerald-200" 
                        : "bg-slate-50 border-slate-200"}
                      `}>
                        <span className={`w-1 h-1 rounded-full ${user.isActive ? "bg-emerald-500" : "bg-slate-300"}`} />
                        <span className={user.isActive ? "text-emerald-700" : "text-slate-400"}>
                          {user.isActive ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-400 text-sm text-center">
                      {user.lastLoginAt
                        ? new Date(user.lastLoginAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                        : <span className="italic">Never</span>}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-slate-600">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => handleOpenEdit(user)}
                          >
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer"
                            disabled={togglingId === user._id}
                            onClick={() => handleToggleActive(user)}
                          >
                            {user.isActive ? "Deactivate" : "Activate"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer text-rose-600 focus:text-rose-600"
                            disabled={deletingId === user._id}
                            onClick={() => handleDelete(user)}
                          >
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {!isLoading && total > 0 && (
            <div className="px-6 py-4 flex flex-col md:flex-row items-center justify-between flex items-center gap-4 bg-slate-50/30 border-t border-slate-100">
              <div className="text-[13px] font-medium text-slate-400">
                Showing <span className="text-[#001a4e] font-bold">{startItem}</span>–<span className="text-[#001a4e] font-bold">{endItem}</span> of <span className="text-[#001a4e] font-bold">{total}</span> users
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  className="h-8 rounded-lg text-[11px] font-bold border-slate-200 text-[#001a4e] hover:bg-[#e8e7ef]"
                >
                  PREVIOUS
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                  className="h-8 rounded-lg text-[11px] font-bold border-slate-200 text-[#001a4e] hover:bg-[#e8e7ef]"
                >
                  NEXT
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <UserFormModal
        mode={editingUser ? "edit" : "create"}
        user={editingUser}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </DashboardLayout>
  );
}
