import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { deleteUser, listUsers, type UserRecord } from "@/lib/users-api";
import { useAuth } from "@/lib/auth-context";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { toast } from "sonner";

export default function AdminUsers() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [rows, setRows] = useState<UserRecord[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<UserRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(
    async (silent = false) => {
      if (!token) return;
      if (!silent) {
        setIsLoading(true);
      }
      setError(null);
      try {
        const data = await listUsers(token);
        setRows(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load users");
      } finally {
        if (!silent) {
          setIsLoading(false);
        }
      }
    },
    [token],
  );

  const columns: Column<UserRecord>[] = [
    {
      key: "email",
      header: "User",
      render: (u) => (
        <div>
          <p className="font-medium text-foreground">{u.email}</p>
          <p className="text-xs text-muted-foreground">{u.id}</p>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (u) => (
        <Badge variant={u.role === "ADMIN" ? "default" : "secondary"} className="text-xs">
          {u.role === "ADMIN" ? "Admin" : "Partner"}
        </Badge>
      ),
    },
    { key: "partner", header: "Partner", render: (u) => <span className="text-sm">{u.partnerName || "—"}</span> },
    {
      key: "lastLogin",
      header: "Last Login",
      render: (u) => (
        <span className="text-xs text-muted-foreground">
          {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "Never"}
        </span>
      ),
    },
    { key: "status", header: "Status", render: (u) => <StatusBadge status={u.status} /> },
    {
      key: "date",
      header: "Created",
      render: (u) => <span className="text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</span>,
    },
    {
      key: "actions",
      header: "",
      className: "w-16",
      render: (user) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={(event) => {
              event.stopPropagation();
              setDeleteTarget(user);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (!token) return;

    const interval = window.setInterval(() => {
      void loadUsers(true);
    }, 15000);

    const onFocus = () => {
      void loadUsers(true);
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [loadUsers, token]);

  const confirmDelete = async () => {
    if (!token || !deleteTarget) return;

    setIsDeleting(true);
    try {
      await deleteUser(token, deleteTarget.id);
      setRows((current) => current.filter((row) => row.id !== deleteTarget.id));
      toast.success("User deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "User could not be deleted. You can deactivate this user instead.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        subtitle="Manage platform users and access"
        action={{ label: "Add User", onClick: () => navigate("/app/admin/users/new"), icon: <Plus className="h-4 w-4" /> }}
      />

      {isLoading ? <LoadingState /> : null}
      {error ? <ErrorState description={error} onRetry={() => window.location.reload()} /> : null}

      {!isLoading && !error ? (
        <DataTable
          data={rows}
          columns={columns}
          searchPlaceholder="Search users..."
          searchKey={(u) => `${u.email} ${u.partnerName || ""}`}
          showCountLabel
          countLabel="user"
          onRowClick={(u) => navigate(`/app/admin/users/${u.id}`)}
        />
      ) : null}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title="Delete User"
        description={`Delete "${deleteTarget?.email}"? This is a soft delete and will hide the user from lists. If related leads, deals, or documents exist, deletion will be blocked.`}
        confirmLabel={isDeleting ? "Deleting..." : "Delete"}
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
