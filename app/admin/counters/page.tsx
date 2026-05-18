import { CountersManager } from '@/components/admin/counters-manager';
import { RoleGuard } from '@/components/admin/role-guard';

export default function AdminCountersPage() {
  return (
    <RoleGuard allow="admin">
      <CountersManager />
    </RoleGuard>
  );
}
