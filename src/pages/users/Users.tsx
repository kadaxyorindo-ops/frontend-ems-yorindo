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
  type User,
} from "@/services/userService";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin:       "Admin",
  staff:       "Staff",
  scanner:     "Scanner",
};

const ROLE_COLORS: Record<string, string> = {
  super_admin: "bg-violet-100 text-violet-700",
  admin:       "bg-blue-100 text-blue-700",
  staff:       "bg-amber-100 text-amber-700",
  scanner:     "bg-slate-100 text-slate-600",
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
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search name or email..."
              className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => handleRoleChange(e.target.value)}
            className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          >
            <option value="">All Roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
            <option value="scanner">Scanner</option>
          </select>
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="w-[80px] text-right">Actions</TableHead>
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
                    <TableCell className="font-semibold text-slate-800">
                      {user.name}
                      {user.organizationName && (
                        <span className="block text-xs font-normal text-slate-400">
                          {user.organizationName}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">{user.email}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${ROLE_COLORS[user.role] ?? "bg-slate-100 text-slate-600"}`}>
                        {ROLE_LABELS[user.role] ?? user.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-sm">
                        <span className={`w-2 h-2 rounded-full ${user.isActive ? "bg-emerald-500" : "bg-slate-300"}`} />
                        <span className={user.isActive ? "text-emerald-700" : "text-slate-400"}>
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-400 text-sm">
                      {user.lastLoginAt
                        ? new Date(user.lastLoginAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                        : <span className="italic">Never</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <span className="text-xl font-bold pb-2">...</span>
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
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {!isLoading && total > 0 && (
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>Showing {startItem}–{endItem} of {total} users</span>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                className="h-8 px-3 border border-dashed border-slate-300"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
              >
                ← Prev
              </Button>
              <Button
                variant="ghost"
                className="h-8 px-3 border border-dashed border-slate-300"
                disabled={page >= totalPages}
                onClick={() => handlePageChange(page + 1)}
              >
                Next →
              </Button>
            </div>
          </div>
        )}
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
