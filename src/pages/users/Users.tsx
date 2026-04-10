import { useEffect, useRef, useState } from "react";
import {
  LoaderCircle,
  MoreHorizontal,
  Search,
  UserPlus,
  Users2,
  Pencil,
  PowerOff,
  Trash2,
} from "lucide-react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { UserFormModal } from "./UserFormModal";
import {
  getUsers,
  toggleUserActive,
  deleteUser,
  SYSTEM_ROLES,
  type User,
} from "@/services/userService";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/roles";

export function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchUsers = async (opts?: {
    page?: number;
    search?: string;
    role?: string;
  }) => {
    setIsLoading(true);
    const result = await getUsers({
      page: opts?.page ?? page,
      limit: 20,
      search: (opts?.search ?? search) || undefined,
      role: (opts?.role ?? roleFilter) || undefined,
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
  const endItem = Math.min(page * limit, total);

  return (
    <DashboardLayout>
      <title>Yorindo EMS - User Management</title>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-dashed border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">
              System Administration
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-[#001a4e]">
              Users
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-500">
              Manage who can access the EMS dashboard and control their
              role-based permissions.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              className="h-11 px-5 bg-[#1a40a8] hover:bg-blue-800 text-white border border-sm border-[#002d7a]"
              onClick={handleOpenCreate}
            >
              <UserPlus className="mr-2 h-4 w-4" aria-hidden="true" />
              Invite User
            </Button>
          </div>
        </div>

        {/* Delete error */}
        {deleteError && (
          <div className="rounded-2xl border border-dashed border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {deleteError}
          </div>
        )}

        {/* Main section card */}
        <section className="rounded-[28px] border border-slate-200 bg-white p-5 sm:p-6">
          {/* Filters bar */}
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
            {/* Role dropdown */}
            <Select
              value={roleFilter || "all"}
              onValueChange={(value) =>
                handleRoleChange(value === "all" ? "" : value)
              }
            >
              <SelectTrigger className="h-11 w-52 bg-white border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-400">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                <SelectItem value="all">All Roles</SelectItem>
                {SYSTEM_ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {ROLE_LABELS[role] ?? role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Search */}
            <div className="relative w-full lg:max-w-sm">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <Input
                type="search"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search name or email…"
                className="h-11 pl-10 bg-background border-slate-200 rounded-xl focus-visible:ring-1 focus-visible:ring-indigo-400 transition-all"
              />
            </div>
          </div>

          {/* Table */}
          <div className="mt-5 overflow-hidden rounded-[24px] border border-slate-300">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="hover:bg-slate-50">
                  <TableHead className="px-6">Name</TableHead>
                  <TableHead className="px-4">Email</TableHead>
                  <TableHead className="px-4">Role</TableHead>
                  <TableHead className="px-4">Status</TableHead>
                  <TableHead className="px-4">Last Login</TableHead>
                  <TableHead className="w-[80px] px-6 text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow className="hover:bg-white">
                    <TableCell colSpan={6} className="h-48 text-center">
                      <div className="flex items-center justify-center gap-3 text-sm text-slate-500">
                        <LoaderCircle
                          className="h-4 w-4 animate-spin"
                          aria-hidden="true"
                        />
                        Loading users…
                      </div>
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow className="hover:bg-white">
                    <TableCell colSpan={6} className="h-48 text-center">
                      <div className="space-y-3 text-sm text-slate-500">
                        <div className="inline-flex items-center gap-2 rounded-full border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                          <Users2 className="h-3.5 w-3.5" aria-hidden="true" />
                          No users found
                        </div>
                        <p>Try adjusting your search or role filter.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user._id} className="align-top">
                      <TableCell className="px-6 font-semibold text-slate-800">
                        {user.name}
                        {user.organizationName && (
                          <span className="block text-xs font-normal text-slate-400">
                            {user.organizationName}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 text-slate-500 text-sm">
                        {user.email}
                      </TableCell>
                      <TableCell className="px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${ROLE_COLORS[user.role] ?? "bg-slate-100 text-slate-600"}`}
                        >
                          {ROLE_LABELS[user.role] ?? user.role}
                        </span>
                      </TableCell>
                      <TableCell className="px-4">
                        <span className="inline-flex items-center gap-1.5 text-sm">
                          <span
                            className={`w-2 h-2 rounded-full ${user.isActive ? "bg-emerald-500" : "bg-slate-300"}`}
                          />
                          <span
                            className={
                              user.isActive
                                ? "text-emerald-700"
                                : "text-slate-400"
                            }
                          >
                            {user.isActive ? "Active" : "Inactive"}
                          </span>
                        </span>
                      </TableCell>
                      <TableCell className="px-4 text-slate-400 text-sm">
                        {user.lastLoginAt ? (
                          new Date(user.lastLoginAt).toLocaleDateString(
                            "en-GB",
                            { day: "numeric", month: "short", year: "numeric" },
                          )
                        ) : (
                          <span className="italic">Never</span>
                        )}
                      </TableCell>
                      <TableCell className="px-6 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-slate-600"
                            >
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="rounded-xl shadow-xl border-slate-100 w-52 p-1.5"
                          >
                            <div className="px-2 py-1 mb-1">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Select Action
                              </p>
                            </div>

                            <DropdownMenuItem
                              className="font-medium cursor-pointer rounded-lg gap-2 text-slate-600"
                              onClick={() => handleOpenEdit(user)}
                            >
                              <Pencil className="w-4 h-4 text-slate-400" />
                              Edit User
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              className="font-medium cursor-pointer rounded-lg gap-2 text-slate-600"
                              disabled={togglingId === user._id}
                              onClick={() => handleToggleActive(user)}
                            >
                              <PowerOff className="w-4 h-4 text-slate-400" />
                              {user.isActive ? "Deactivate" : "Activate"}
                            </DropdownMenuItem>

                            <DropdownMenuSeparator className="my-1.5 bg-slate-100" />

                            <DropdownMenuItem
                              className="font-medium cursor-pointer rounded-lg gap-2 text-red-500 focus:text-red-600 focus:bg-red-50"
                              disabled={deletingId === user._id}
                              onClick={() => handleDelete(user)}
                            >
                              <Trash2 className="w-4 h-4" />
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
          </div>

          {/* Pagination */}
          {!isLoading && total > 0 && (
            <div className="mt-5 flex items-center justify-between text-sm text-slate-500">
              <span>
                Showing {startItem}–{endItem} of {total} users
              </span>
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
        </section>
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
