import { Dashboard } from '@/components/admin/dashboard';
import { RoleGuard } from '@/components/admin/role-guard';

export default function AdminAnalyticsPage() {
  return (
    <RoleGuard allow="admin">
      <Dashboard />
    </RoleGuard>
  );
}
