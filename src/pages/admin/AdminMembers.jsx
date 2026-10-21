
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import {
  getAdminMembers,
  updateMemberRole,
} from '../../api/backend';
import { EmptyState, ErrorState, LoadingState } from './AdminStates';

export default function AdminMembers() {
  const { token, member: currentMember } = useAuth();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState(null);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      setMembers(await getAdminMembers(token));
    } catch (err) {
      setError(err.message || 'โหลดสมาชิกไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  async function changeRole(target, role) {
    if (Number(target.id) === Number(currentMember?.id)) {
      setError('ไม่สามารถเปลี่ยนสิทธิ์บัญชีตัวเองได้');
      return;
    }

    if (!window.confirm(`ยืนยันเปลี่ยนสิทธิ์เป็น ${role} ใช่หรือไม่?`)) {
      return;
    }

    setBusyId(target.id);
    setError('');
    setNotice('');

    try {
      const result = await updateMemberRole(target.id, role, token);

      setMembers((current) =>
        current.map((member) =>
          member.id === target.id
            ? { ...member, ...(result.member || result), role }
            : member
        )
      );

      setNotice('อัปเดตสิทธิ์สมาชิกเรียบร้อย');
    } catch (err) {
      setError(err.message || 'เปลี่ยนสิทธิ์ไม่สำเร็จ');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold">จัดการสมาชิก</h2>
      <p className="mb-5 mt-1 text-sm text-slate-500">
        ตรวจสอบสมาชิกและกำหนดบทบาท
      </p>

      {notice && (
        <p role="status" className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
          {notice}
        </p>
      )}

      {error && (
        <div className="mb-4">
          <ErrorState message={error} onRetry={loadMembers} />
        </div>
      )}

      {loading ? (
        <LoadingState message="กำลังโหลดสมาชิก..." />
      ) : members.length === 0 ? (
        <EmptyState message="ไม่พบข้อมูลสมาชิก" />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3">ชื่อ</th>
                <th className="p-3">อีเมล</th>
                <th className="p-3">สิทธิ์</th>
                <th className="p-3">เปลี่ยนสิทธิ์</th>
              </tr>
            </thead>

            <tbody>
              {members.map((member) => {
                const isSelf =
                  Number(member.id) === Number(currentMember?.id);
                const role = member.role || 'member';

                return (
                  <tr key={member.id} className="border-t">
                    <td className="p-3">
                      {member.displayName ||
                        member.display_name ||
                        member.name ||
                        '—'}
                      {isSelf && (
                        <span className="ml-1 text-xs text-slate-500">
                          (คุณ)
                        </span>
                      )}
                    </td>

                    <td className="p-3">{member.email || '—'}</td>

                    <td className="p-3">
                      <span className="rounded-full bg-slate-100 px-2 py-1">
                        {role}
                      </span>
                    </td>

                    <td className="p-3">
                      <select
                        aria-label={`เปลี่ยนสิทธิ์ ${member.email || member.id}`}
                        value={role}
                        disabled={isSelf || busyId === member.id}
                        onChange={(e) => changeRole(member, e.target.value)}
                        className="rounded-md border bg-white px-2 py-1.5 disabled:bg-slate-100"
                      >
                        <option value="member">member</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
