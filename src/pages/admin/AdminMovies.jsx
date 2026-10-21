
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { getMovies, deleteAdminMovie } from '../../api/backend';
import { EmptyState, ErrorState, LoadingState } from './AdminStates';

export default function AdminMovies() {
  const { token } = useAuth();
  const location = useLocation();

  const [movies, setMovies] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(location.state?.notice || '');

  const loadMovies = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      setMovies(await getMovies());
    } catch (err) {
      setError(err.message || 'โหลดรายการหนังไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMovies();
  }, [loadMovies]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) return movies;

    return movies.filter((movie) =>
      `${movie.title || ''} ${movie.titleTh || movie.title_th || ''} ${movie.id || ''}`
        .toLowerCase()
        .includes(q)
    );
  }, [movies, query]);

  async function removeMovie(movie) {
    const title = movie.title || movie.titleTh || movie.id;

    if (!window.confirm(`ยืนยันลบ "${title}" ใช่หรือไม่?`)) {
      return;
    }

    setBusyId(movie.id);
    setError('');
    setNotice('');

    try {
      await deleteAdminMovie(movie.id, token);
      setMovies((current) =>
        current.filter((item) => item.id !== movie.id)
      );
      setNotice('ลบข้อมูลหนังเรียบร้อย');
    } catch (err) {
      setError(err.message || 'ลบหนังไม่สำเร็จ');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">จัดการหนัง</h2>
          <p className="mt-1 text-sm text-slate-500">
            ค้นหา เพิ่ม แก้ไข และลบรายการหนัง
          </p>
        </div>

        <Link
          to="/admin/movies/new"
          className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white"
        >
          + เพิ่มหนัง
        </Link>
      </div>

      {notice && (
        <p role="status" className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
          {notice}
        </p>
      )}

      {error && (
        <div className="mb-4">
          <ErrorState message={error} onRetry={loadMovies} />
        </div>
      )}

      <label className="mb-4 block text-sm font-medium">
        ค้นหาชื่อหนังหรือ ID
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="พิมพ์คำค้น..."
          className="mt-1 w-full rounded-lg border px-3 py-2 font-normal"
        />
      </label>

      {loading ? (
        <LoadingState message="กำลังโหลดรายการหนัง..." />
      ) : filtered.length === 0 ? (
        <EmptyState message={query ? 'ไม่พบหนังที่ตรงกับคำค้น' : 'ยังไม่มีรายการหนัง'} />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="p-3">หนัง</th>
                <th className="p-3">ปี</th>
                <th className="p-3">ID</th>
                <th className="p-3">จัดการ</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((movie) => (
                <tr key={movie.id} className="border-t">
                  <td className="p-3">
                    <p className="font-semibold">
                      {movie.title || movie.name || 'ไม่ระบุชื่อ'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {movie.titleTh || movie.title_th || ''}
                    </p>
                  </td>

                  <td className="p-3">
                    {movie.year || movie.release_date?.slice(0, 4) || '—'}
                  </td>

                  <td className="p-3">{movie.id}</td>

                  <td className="p-3">
                    <div className="flex gap-2">
                      <Link
                        to={`/admin/movies/${movie.id}/edit`}
                        className="rounded-md border px-3 py-1.5"
                      >
                        แก้ไข
                      </Link>

                      <button
                        onClick={() => removeMovie(movie)}
                        disabled={busyId === movie.id}
                        className="rounded-md bg-red-600 px-3 py-1.5 text-white disabled:opacity-50"
                      >
                        {busyId === movie.id ? 'กำลังลบ...' : 'ลบ'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
