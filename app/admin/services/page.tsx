import { ServicesManager } from '@/components/admin/services-manager';
import { RoleGuard } from '@/components/admin/role-guard';

export default function AdminServicesPage() {
  return (
    <RoleGuard allow="admin">
      <ServicesManager />
    </RoleGuard>
  );
}
