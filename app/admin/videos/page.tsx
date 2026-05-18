import { VideoManager } from '@/components/admin/video-manager';
import { RoleGuard } from '@/components/admin/role-guard';

export default function AdminVideosPage() {
  return (
    <RoleGuard allow="admin">
      <VideoManager />
    </RoleGuard>
  );
}
