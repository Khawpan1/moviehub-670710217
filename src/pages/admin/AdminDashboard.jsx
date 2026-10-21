
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { getAdminStats } from '../../api/backend';
import { ErrorState, LoadingState } from './AdminStates';

export default function AdminDashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      setStats(await getAdminStats(token));
    } catch (err) {
      setError(err.message || 'โหลดข้อมูลไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const data = stats?.stats ?? stats ?? {};

  const cards = [
    { label: 'ภาพยนตร์', value: data.movieCount ?? data.movies ?? 0 },
    { label: 'สมาชิก', value: data.memberCount ?? data.members ?? 0 },
    { label: 'ผู้ดูแลระบบ', value: data.adminCount ?? data.admins ?? 0 },
    { label: 'คะแนนโหวต', value: data.voteCount ?? data.votes ?? 0 },
    { label: 'Wishlist', value: data.wishlistCount ?? data.wishlistItems ?? 0 },
  ];

  if (loading) {
    return <LoadingState message="กำลังโหลด Dashboard..." />;
  }

  return (
    <div>
      <h2 className="text-xl font-bold">ภาพรวมระบบ</h2>
      <p className="mb-5 mt-1 text-sm text-slate-500">
        สรุปข้อมูลหลักของ MovieHub
      </p>

      {error && (
        <div className="mb-4">
          <ErrorState message={error} onRetry={loadStats} />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <article key={card.label} className="rounded-xl border p-5">
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-2 text-3xl font-bold">{card.value}</p>
          </article>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          to="/admin/movies"
          className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white"
        >
          จัดการหนัง
        </Link>

        <Link
          to="/admin/members"
          className="rounded-lg border px-4 py-2 text-sm font-semibold"
        >
          จัดการสมาชิก
        </Link>
      </div>
    </div>
  );
}
