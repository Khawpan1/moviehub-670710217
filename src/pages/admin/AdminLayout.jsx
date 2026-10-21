
import { NavLink, Outlet, Link } from 'react-router-dom';

const links = [
  { to: '/admin', label: 'ภาพรวม', end: true },
  { to: '/admin/movies', label: 'จัดการหนัง' },
  { to: '/admin/movies/new', label: 'เพิ่มหนัง' },
  { to: '/admin/members', label: 'จัดการสมาชิก' },
];

export default function AdminLayout() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-emerald-700">MOVIEHUB</p>
          <h1 className="text-2xl font-bold">Admin Backoffice</h1>
          <p className="mt-1 text-sm text-slate-500">
            จัดการข้อมูลเว็บไซต์
          </p>
        </div>
        <Link to="/" className="rounded-lg border px-4 py-2 text-sm">
          กลับหน้าหลัก
        </Link>
      </header>

      <div className="grid gap-6 md:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="h-fit rounded-xl border bg-white p-3">
          <nav className="flex gap-2 overflow-x-auto md:flex-col">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-lg px-3 py-2 text-sm ${
                    isActive
                      ? 'bg-emerald-50 font-semibold text-emerald-800'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 rounded-xl border bg-white p-4 md:p-6">
          <Outlet />
        </div>
      </div>
    </section>
  );
}
