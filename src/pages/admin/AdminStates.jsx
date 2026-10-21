
export function LoadingState({ message = 'กำลังโหลดข้อมูล...' }) {
  return (
    <div role="status" className="rounded-lg bg-slate-50 p-5 text-sm text-slate-600">
      {message}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <p>{message || 'เกิดข้อผิดพลาด กรุณาลองใหม่'}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-3 rounded-md border border-red-300 px-3 py-1.5">
          ลองอีกครั้ง
        </button>
      )}
    </div>
  );
}

export function EmptyState({ message = 'ยังไม่มีข้อมูล' }) {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}
