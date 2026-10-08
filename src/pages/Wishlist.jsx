import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import MovieGrid from '../components/MovieGrid';
import { getWishlist, getMovieById, removeFromWishlist } from '../api/backend';

function Wishlist() {
  const { isLoggedIn, token } = useAuth();

  const [movies, setMovies] = useState([]);
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!isLoggedIn) return;

    let ignore = false; // กันคำตอบเก่ามาทับคำตอบใหม่

    async function load() {
      setStatus('loading');
      try {
        const data = await getWishlist(token); // ได้ { items }
        let list = data.items || [];

        // ถ้า items เป็นแค่ id (ตัวเลข/ข้อความ) ให้ไปดึงรายละเอียดหนังเพิ่ม
        if (list.length > 0 && typeof list[0] !== 'object') {
          list = await Promise.all(list.map((id) => getMovieById(id)));
        }

        if (!ignore) {
          setMovies(list);
          setError(null);
          setStatus('success');
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'ไม่สามารถโหลดรายการที่อยากดูได้');
          setStatus('error');
        }
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [isLoggedIn, token, reloadKey]);

  async function handleRemove(movieId) {
    try {
      await removeFromWishlist(movieId, token);
      setMovies((prev) => prev.filter((m) => m.id !== movieId));
    } catch (err) {
      setError(err.message || 'ไม่สามารถลบออกจากรายการได้');
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="text-2xl font-semibold text-slate-900">
          รายการที่อยากดู
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          <Link to="/login" className="text-emerald-600 hover:underline">
            เข้าสู่ระบบ
          </Link>{' '}
          เพื่อดูรายการที่อยากดูของคุณ
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">
        รายการที่อยากดู
      </h1>

      {status === 'loading' && (
        <p className="mt-4 text-sm text-slate-500">กำลังโหลด...</p>
      )}

      {status === 'error' && (
        <div className="mt-4">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={() => setReloadKey((k) => k + 1)}
            className="mt-2 rounded-lg border border-emerald-200 bg-white px-4 py-2 text-sm text-slate-600 hover:bg-emerald-50"
          >
            ลองใหม่
          </button>
        </div>
      )}

      {status === 'success' && movies.length === 0 && (
        <p className="mt-4 text-sm text-slate-500">
          ยังไม่มีหนังในรายการ ลองไปเลือกหนังที่{' '}
          <Link to="/movies" className="text-emerald-600 hover:underline">
            หน้าหนัง
          </Link>{' '}
          แล้วกด "เพิ่มเข้ารายการที่อยากดู"
        </p>
      )}

      {status === 'success' && movies.length > 0 && (
        <>
          <MovieGrid movies={movies} />

          <ul className="mt-6 space-y-2">
            {movies.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between rounded-lg border border-emerald-100 bg-white px-4 py-2 text-sm"
              >
                <Link
                  to={`/movies/${m.id}`}
                  className="text-slate-700 hover:underline"
                >
                  {m.title}
                </Link>
                <button
                  onClick={() => handleRemove(m.id)}
                  className="text-red-500 hover:underline"
                >
                  ลบ
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default Wishlist;