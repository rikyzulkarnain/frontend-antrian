import { Reports } from '@/components/admin/reports';
import { RoleGuard } from '@/components/admin/role-guard';

export default function AdminReportsPage() {
  return (
    <RoleGuard allow="admin">
      <Reports />
    </RoleGuard>
  );
}
