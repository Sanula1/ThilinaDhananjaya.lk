import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';

export default function ClassDashboardPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cls, setCls] = useState<any>(null);
  const [months, setMonths] = useState<any[]>([]);
  const [recentRecs, setRecentRecs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get(`/classes/${id}`),
      api.get(`/classes/${id}/months`),
    ])
      .then(async ([clsRes, monthsRes]) => {
        setCls(clsRes.data);
        const visible = (monthsRes.data || []).filter(
          (m: any) => m.status !== 'INACTIVE' && m.status !== 'PRIVATE',
        );
        setMonths(visible);
        // Fetch recordings for the most recent month
        if (visible.length > 0) {
          try {
            const recRes = await api.get(`/recordings/by-month/${visible[0].id}`);
            setRecentRecs((recRes.data || []).slice(0, 4));
          } catch { /* ignore */ }
        }
      })
      .catch(e => setError(e.response?.data?.message || 'Failed to load class'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-[3px] border-blue-600 border-t-transparent animate-spin" />
    </div>
  );

  if (error) return (
    <div className="max-w-lg mx-auto mt-16 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-12 shadow-sm">
      <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
        <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      </div>
      <p className="text-slate-600 dark:text-slate-300 text-sm font-medium">{error}</p>
      <Link to="/classes" className="mt-4 inline-flex items-center gap-1.5 text-sm text-blue-600 font-semibold hover:text-blue-700">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        Back to classes
      </Link>
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Back */}
      <Link to="/classes" className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 transition font-medium">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        All Classes
      </Link>

      {/* Class hero card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        {cls?.thumbnail ? (
          <div className="relative h-44 sm:h-52">
            <img src={cls.thumbnail} alt={cls.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-4 left-6 right-6">
              <h1 className="text-2xl font-bold text-white drop-shadow-lg">{cls?.name}</h1>
              {cls?.subject && <p className="text-white/80 text-sm mt-0.5">{cls.subject}</p>}
            </div>
          </div>
        ) : (
          <div className="p-6 pb-0 flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/25">
              <span className="text-white text-xl font-bold">{cls?.name?.[0]?.toUpperCase()}</span>
            </div>
            <div className="flex-1 pt-1">
              <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">{cls?.name}</h1>
              {cls?.subject && <p className="text-slate-500 dark:text-slate-400 text-sm">{cls.subject}</p>}
            </div>
          </div>
        )}

        <div className="p-6">
          {cls?.description && (
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-4">{cls.description}</p>
          )}

          {/* Stats row */}
          <div className="flex flex-wrap gap-2">
            {cls?.monthlyFee != null && (
              <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-100 dark:border-blue-800">
                Rs. {Number(cls.monthlyFee).toLocaleString()} / month
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 text-xs font-semibold border border-slate-100 dark:border-slate-600">
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              {months.length} Month{months.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Vision / Mission */}
          {(cls?.vision || cls?.mission) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
              {cls.vision && (
                <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
                  <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">Vision</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{cls.vision}</p>
                </div>
              )}
              {cls.mission && (
                <div className="p-3 rounded-xl bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30">
                  <p className="text-[10px] font-bold text-purple-500 uppercase tracking-wider mb-1">Mission</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{cls.mission}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick-action cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Class Recordings */}
        <button
          onClick={() => navigate(`/classes/${id}/dashboard/class-recordings`)}
          className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:border-blue-200 dark:hover:border-blue-700 hover:shadow-md transition-all p-5 text-left"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.361a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            </div>
            <div className="flex-1">
              <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">Class Recordings</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Browse all video lessons</p>
            </div>
            <svg className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">{months.length} month{months.length !== 1 ? 's' : ''} available</span>
          </div>
        </button>


      </div>

      {/* Recent recordings from latest month */}
      {recentRecs.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
            <h2 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Recent Recordings
            </h2>
            <Link
              to={`/classes/${id}/dashboard/class-recordings`}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition"
            >
              View all →
            </Link>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {recentRecs.map((rec: any) => (
              <Link
                key={rec.id}
                to={`/recording/${rec.id}`}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition group"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {rec.thumbnail
                    ? <img src={rec.thumbnail} alt={rec.title} className="w-full h-full object-cover" />
                    : <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.361a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100 group-hover:text-blue-600 truncate transition">{rec.title}</p>
                  {rec.topic && <p className="text-xs text-blue-500 dark:text-blue-400 truncate">{rec.topic}</p>}
                </div>
                <svg className="w-4 h-4 text-slate-300 group-hover:text-blue-500 flex-shrink-0 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
