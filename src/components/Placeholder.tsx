const Placeholder = ({ title }: { title: string }) => {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] bg-white rounded-2xl shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-6 bg-slate-50 text-slate-400 rounded-full mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="m10 13 4 4-4 4"/></svg>
      </div>
      <h2 className="text-2xl font-semibold text-primary mb-2">{title}</h2>
      <p className="text-slate-500 text-center max-w-md">
        This module is currently under development. The {title.toLowerCase()} features will be available in the next release.
      </p>
    </div>
  );
};

export default Placeholder;
