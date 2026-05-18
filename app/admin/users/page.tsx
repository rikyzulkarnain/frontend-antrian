import { UsersManager } from '@/components/admin/users-manager';
import { RoleGuard } from '@/components/admin/role-guard';

export default function AdminUsersPage() {
  return (
    <RoleGuard allow="admin">
      <UsersManager />
    </RoleGuard>
  );
}
