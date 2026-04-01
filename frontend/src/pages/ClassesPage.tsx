import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

export default function ClassesPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/classes').then(r => {
      // Filter out INACTIVE and PRIVATE classes for students
      const visible = (r.data || []).filter((c: any) => !['INACTIVE', 'PRIVATE'].includes(c.status));
      setClasses(visible);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = classes.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="w-full space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Classes</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{classes.length} classes available</p>
        </div>
        <div className="relative w-full sm:w-72">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search classes..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 shadow-sm transition-all" />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 h-64 skeleton" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-16 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-300 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">No classes found</p>
          {search && <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Try a different search term</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((cls: any) => (
            <div key={cls.id}
              className="relative flex w-full flex-col rounded-xl border border-blue-300 dark:border-blue-500 bg-white bg-clip-border text-slate-700 shadow-md transition-all hover:-translate-y-1 hover:shadow-xl">
              <div className="relative mx-4 -mt-6 h-40 overflow-hidden rounded-xl bg-blue-500 bg-clip-border text-white shadow-lg shadow-blue-500/40 bg-gradient-to-r from-blue-500 to-blue-600">
                {cls.thumbnail ? (
                  <img src={cls.thumbnail} alt={cls.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-white text-5xl font-black opacity-80">{cls.name?.[0]?.toUpperCase() || 'C'}</span>
                  </div>
                )}
              </div>
              <div className="p-6">
                <h5 className="mb-2 block text-xl font-semibold leading-snug tracking-normal text-slate-900 truncate">
                  {cls.name}
                </h5>
                <p className="block text-sm font-light leading-relaxed text-slate-600 line-clamp-2">
                  {cls.description || 'No description available'}
                </p>
                {cls.subject && (
                  <p className="mt-2 text-xs font-semibold text-blue-600 uppercase tracking-wide">{cls.subject}</p>
                )}
              </div>
              <div className="p-6 pt-0">
                <div className="mb-3 min-h-6">
                  {cls.monthlyFee != null && (
                    <span className="text-sm font-bold text-blue-600">Rs. {Number(cls.monthlyFee).toLocaleString()}</span>
                  )}
                </div>
                <Link to={`/classes/${cls.id}`}
                  className="w-full block select-none rounded-lg bg-blue-500 py-3 px-6 text-center align-middle text-xs font-bold uppercase text-white shadow-md shadow-blue-500/20 transition-all hover:shadow-lg hover:shadow-blue-500/40">
                  Select Class
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
