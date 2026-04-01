import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../../lib/api';

function fmtTime(sec: number): string {
  if (!sec || sec <= 0) return '�';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function AdminAttendance() {
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [form, setForm] = useState({ classId: '', studentId: '', date: new Date().toISOString().split('T')[0], status: 'MANUAL' });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'sessions' | 'attendance'>('sessions');
  const [records, setRecords] = useState<any[]>([]);
  const [filterRecording, setFilterRecording] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [recClassId, setRecClassId] = useState('');
  const [recRecordingId, setRecRecordingId] = useState('');
  const [recStatus, setRecStatus] = useState('');
  const [recFetching, setRecFetching] = useState(false);
  const [allRecordings, setAllRecordings] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      api.get('/classes').then(r => setClasses(r.data)).catch(() => {}),
      api.get('/users/students').then(r => setStudents(r.data || [])).catch(() => {}),
      api.get('/attendance/watch-sessions').then(r => setSessions(r.data || [])).catch(() => {}),
      api.get('/attendance').then(r => setRecords(r.data || [])).catch(() => {}),
      api.get('/recordings').then(r => setAllRecordings(r.data || [])).catch(() => {}),
    ]).finally(() => setFetching(false));
  }, []);

  useEffect(() => {
    if (!recClassId && !recRecordingId && !recStatus) return;
    setRecFetching(true);
    const params: Record<string, string> = {};
    if (recClassId) params.classId = recClassId;
    if (recRecordingId) params.recordingId = recRecordingId;
    if (recStatus) params.status = recStatus;
    api.get('/attendance', { params }).then(r => setRecords(r.data || [])).catch(() => setRecords([])).finally(() => setRecFetching(false));
  }, [recClassId, recRecordingId, recStatus]);

  const update = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSuccess(''); setLoading(true);
    try {
      await api.post('/attendance/manual', { userId: form.studentId, eventName: `Manual - ${form.date}` });
      setSuccess('Attendance recorded');
      const r = await api.get('/attendance');
      setRecords(r.data || []);
      setShowForm(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) { setError(err.response?.data?.message || 'Failed to save attendance'); }
    finally { setLoading(false); }
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      INCOMPLETE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      MANUAL: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    };
    return map[s] || '';
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Attendance</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{sessions.length} watch sessions � {records.length} attendance records</p>
        </div>
        <button onClick={() => { setShowForm(true); setError(''); setSuccess(''); }}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold hover:from-blue-600 hover:to-blue-700 transition shadow-lg shadow-blue-500/25 flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Mark Attendance
        </button>
      </div>

      {success && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
          <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{success}</span>
        </div>
      )}

      {/* Modal */}
      {showForm && createPortal(
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm overflow-y-auto" onClick={() => setShowForm(false)}>
          <div className="min-h-full flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700 rounded-t-2xl">
              <div>
                <h2 className="font-bold text-slate-800 dark:text-slate-100">Mark Attendance</h2>
                <p className="text-xs text-slate-400 mt-0.5">Record manual attendance for a student</p>
              </div>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              {error && (
                <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Class</label>
                <select value={form.classId} onChange={e => update('classId', e.target.value)} required
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                  <option value="">Select class</option>
                  {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Student</label>
                <select value={form.studentId} onChange={e => update('studentId', e.target.value)} required
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                  <option value="">Select student</option>
                  {students.map((s: any) => <option key={s.id} value={s.id}>{s.profile?.fullName || s.email}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Date</label>
                <input type="date" value={form.date} onChange={e => update('date', e.target.value)} required
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold hover:from-blue-600 hover:to-blue-700 transition shadow-lg shadow-blue-500/25 disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
          </div>
        </div>
      , document.body)}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl p-1 border border-slate-200 dark:border-slate-700 w-fit">
        <button onClick={() => setTab('sessions')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${tab === 'sessions' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
          Watch Sessions
        </button>
        <button onClick={() => setTab('attendance')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${tab === 'attendance' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
          Legacy Attendance
        </button>
      </div>

      {/* Watch Sessions Table */}
      {tab === 'sessions' && (() => {
        const classFilteredSessions = filterClass ? sessions.filter((s: any) => s.recording?.month?.class?.id === filterClass) : sessions;
        const recordingOptions = Array.from(
          new Map(classFilteredSessions.filter((s: any) => s.recording?.id).map((s: any) => [s.recording.id, s.recording.title])).entries()
        );
        const filtered = sessions.filter((s: any) => {
          if (filterRecording && s.recording?.id !== filterRecording) return false;
          if (filterClass && s.recording?.month?.class?.id !== filterClass) return false;
          if (filterStatus && s.status !== filterStatus) return false;
          if (filterDate) {
            const d = s.startedAt ? new Date(s.startedAt).toISOString().split('T')[0] : '';
            if (d !== filterDate) return false;
          }
          return true;
        });
        const hasFilters = filterRecording || filterDate || filterStatus || filterClass;
        return (
        <>
          {/* Filter Bar */}
          <div className="flex flex-wrap gap-2 items-end">
            <div className="flex flex-col gap-1 min-w-[160px]">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Class</label>
              <select value={filterClass} onChange={e => { setFilterClass(e.target.value); setFilterRecording(''); }}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                <option value="">All Classes</option>
                {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1 min-w-[200px]">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Recording</label>
              <select value={filterRecording} onChange={e => setFilterRecording(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                <option value="">All Recordings</option>
                {recordingOptions.map(([id, title]) => <option key={id} value={id}>{title}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Date</label>
              <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
            </div>
            <div className="flex flex-col gap-1 min-w-[140px]">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Status</label>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                <option value="">All Status</option>
                <option value="ENDED">Ended</option>
                <option value="WATCHING">Watching</option>
                <option value="PAUSED">Paused</option>
              </select>
            </div>
            {hasFilters && (
              <button onClick={() => { setFilterRecording(''); setFilterDate(''); setFilterStatus(''); setFilterClass(''); }}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                Clear
              </button>
            )}
            <span className="ml-auto text-xs text-slate-400 self-end pb-2">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          {fetching ? (
            <div className="p-8 text-center text-sm text-slate-400">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">{sessions.length === 0 ? 'No watch sessions yet' : 'No sessions match the selected filters'}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left px-4 py-3 font-medium text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Student</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Recording</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Watched</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filtered.map((s: any) => (
                    <tr key={s.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800 dark:text-slate-100">{s.user?.profile?.fullName || '�'}</p>
                        <p className="text-xs text-slate-400">{s.user?.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-600 dark:text-slate-300">{s.recording?.title || '�'}</p>
                        <p className="text-xs text-slate-400">{s.recording?.month?.class?.name} � {s.recording?.month?.name}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-400 dark:text-slate-500 text-xs">
                        {s.startedAt ? new Date(s.startedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '�'}
                        <br />
                        <span className="text-slate-300 dark:text-slate-600">
                          {s.startedAt ? new Date(s.startedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''}
                          {s.endedAt ? ` � ${new Date(s.endedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` : ''}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200">{fmtTime(s.totalWatchedSec)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          s.status === 'ENDED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          s.status === 'WATCHING' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                          'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>{s.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </>
        );
      })()}

      {/* Legacy Attendance Table */}
      {tab === 'attendance' && (() => {
        const recRecordingOptions = recClassId
          ? allRecordings.filter((r: any) => r.month?.class?.id === recClassId)
          : allRecordings;
        const hasRecFilters = recClassId || recRecordingId || recStatus;
        return (
          <>
            {/* Filter Bar */}
            <div className="flex flex-wrap gap-2 items-end">
              <div className="flex flex-col gap-1 min-w-[160px]">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Class</label>
                <select value={recClassId} onChange={e => { setRecClassId(e.target.value); setRecRecordingId(''); }}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                  <option value="">All Classes</option>
                  {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1 min-w-[200px]">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Recording</label>
                <select value={recRecordingId} onChange={e => setRecRecordingId(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                  <option value="">All Recordings</option>
                  {recRecordingOptions.map((r: any) => <option key={r.id} value={r.id}>{r.title}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1 min-w-[140px]">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Status</label>
                <select value={recStatus} onChange={e => setRecStatus(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                  <option value="">All Status</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="INCOMPLETE">Incomplete</option>
                  <option value="MANUAL">Manual</option>
                </select>
              </div>
              {hasRecFilters && (
                <button onClick={() => { setRecClassId(''); setRecRecordingId(''); setRecStatus(''); }}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  Clear
                </button>
              )}
              <span className="ml-auto text-xs text-slate-400 self-end pb-2">{records.length} result{records.length !== 1 ? 's' : ''}</span>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
              {(fetching || recFetching) ? (
                <div className="p-6 space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 rounded-xl bg-slate-100 dark:bg-slate-700 animate-pulse" />)}</div>
              ) : records.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  </div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No attendance records found</p>
                  <p className="text-xs text-slate-400 mt-1">{hasRecFilters ? 'Try adjusting or clearing the filters' : 'Add manual attendance using the button above'}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
                        <th className="text-left px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Student</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Recording / Class</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Date</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                      {records.map((rec: any) => (
                        <tr key={rec.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition">
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{rec.user?.profile?.fullName || '�'}</p>
                            <p className="text-xs text-slate-400">{rec.user?.email}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-slate-600 dark:text-slate-300 text-sm">{rec.recording?.title || rec.eventName || '�'}</p>
                            <p className="text-xs text-slate-400">{rec.recording?.month?.class?.name}</p>
                          </td>
                          <td className="px-4 py-3 text-slate-400 dark:text-slate-500 text-xs">{rec.createdAt ? new Date(rec.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '�'}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadge(rec.status)}`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />{rec.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        );
      })()}
    </div>
  );
}

