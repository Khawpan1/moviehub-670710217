
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import {
  createAdminMovie,
  getAdminMovie,
  updateAdminMovie,
} from '../../api/backend';
import { ErrorState, LoadingState } from './AdminStates';

const initialForm = {
  title: '',
  titleTh: '',
  year: '',
  genre: '',
  detail: '',
  poster: '',
};

export default function AdminMovieForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { token } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return undefined;

    let active = true;

    getAdminMovie(id, token)
      .then((data) => {
        if (!active) return;

        const movie = data.movie ?? data;

        setForm({
          title: movie.title ?? movie.name ?? '',
          titleTh: movie.titleTh ?? movie.title_th ?? '',
          year: movie.year ?? movie.release_date?.slice(0, 4) ?? '',
          genre: movie.genre ?? '',
          detail: movie.detail ?? movie.overview ?? '',
          poster: movie.poster ?? movie.posterUrl ?? movie.poster_url ?? '',
        });
      })
      .catch((err) => {
        if (active) setError(err.message || 'โหลดข้อมูลหนังไม่สำเร็จ');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, isEdit, token]);

  function handleChange(e) {
    setForm((current) => ({
      ...current,
      [e.target.name]: e.target.value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.title.trim()) {
      setError('กรุณากรอกชื่อหนัง');
      return;
    }

    if (
      form.year &&
      (!/^\d{4}$/.test(String(form.year)) ||
        Number(form.year) < 1888 ||
        Number(form.year) > 2100)
    ) {
      setError('ปีที่ฉายต้องเป็นตัวเลข 4 หลัก');
      return;
    }

    if (form.poster && !/^https?:\/\//i.test(form.poster)) {
      setError('URL โปสเตอร์ต้องขึ้นต้นด้วย http:// หรือ https://');
      return;
    }

    const payload = {
      title: form.title.trim(),
      titleTh: form.titleTh.trim(),
      year: form.year ? Number(form.year) : null,
      genre: form.genre.trim(),
      detail: form.detail.trim(),
      poster: form.poster.trim(),
    };

    try {
      setSaving(true);

      if (isEdit) {
        await updateAdminMovie(id, payload, token);
      } else {
        await createAdminMovie(payload, token);
      }

      navigate('/admin/movies', {
        state: {
          notice: isEdit
            ? 'แก้ไขข้อมูลหนังเรียบร้อย'
            : 'เพิ่มหนังเรียบร้อย',
        },
      });
    } catch (err) {
      setError(err.message || 'บันทึกข้อมูลไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingState message="กำลังโหลดข้อมูลหนัง..." />;
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">
          {isEdit ? 'แก้ไขข้อมูลหนัง' : 'เพิ่มหนังใหม่'}
        </h2>
        <Link to="/admin/movies" className="text-sm text-emerald-700">
          ← กลับรายการหนัง
        </Link>
      </div>

      {error && (
        <div className="mb-4">
          <ErrorState message={error} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium">
          ชื่อหนัง (English) *
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            maxLength={200}
            className="mt-1 w-full rounded-lg border px-3 py-2 font-normal"
          />
        </label>

        <label className="text-sm font-medium">
          ชื่อหนังภาษาไทย
          <input
            name="titleTh"
            value={form.titleTh}
            onChange={handleChange}
            maxLength={200}
            className="mt-1 w-full rounded-lg border px-3 py-2 font-normal"
          />
        </label>

        <label className="text-sm font-medium">
          ปีที่ฉาย
          <input
            name="year"
            inputMode="numeric"
            value={form.year}
            onChange={handleChange}
            maxLength={4}
            placeholder="2026"
            className="mt-1 w-full rounded-lg border px-3 py-2 font-normal"
          />
        </label>

        <label className="text-sm font-medium">
          แนวหนัง
          <input
            name="genre"
            value={form.genre}
            onChange={handleChange}
            maxLength={100}
            placeholder="Action, Drama..."
            className="mt-1 w-full rounded-lg border px-3 py-2 font-normal"
          />
        </label>

        <label className="text-sm font-medium md:col-span-2">
          URL โปสเตอร์
          <input
            name="poster"
            type="url"
            value={form.poster}
            onChange={handleChange}
            placeholder="https://..."
            className="mt-1 w-full rounded-lg border px-3 py-2 font-normal"
          />
        </label>

        <label className="text-sm font-medium md:col-span-2">
          เรื่องย่อ
          <textarea
            name="detail"
            value={form.detail}
            onChange={handleChange}
            rows={4}
            maxLength={5000}
            className="mt-1 w-full rounded-lg border px-3 py-2 font-normal"
          />
        </label>

        <div className="flex gap-3 md:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-emerald-700 px-5 py-2.5 font-semibold text-white disabled:opacity-50"
          >
            {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
          </button>

          <Link
            to="/admin/movies"
            className="rounded-lg border px-5 py-2.5"
          >
            ยกเลิก
          </Link>
        </div>
      </form>
    </div>
  );
}
