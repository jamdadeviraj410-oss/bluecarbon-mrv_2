import Topbar from '../components/layout/Topbar';

export default function Placeholder({ title = 'Coming Soon' }) {
  return (
    <div className="flex flex-col h-full">
      <Topbar title={title} />
      <div className="flex-1 p-xl flex items-center justify-center">
        <div className="text-center flex flex-col items-center gap-md max-w-sm">
          <span className="material-symbols-outlined text-[64px] text-outline-variant">construction</span>
          <h2 className="font-headline-md text-headline-md text-on-surface">{title}</h2>
          <p className="font-body-md text-body-lg text-on-surface-variant">
            This page is currently under construction. Please check back later.
          </p>
        </div>
      </div>
    </div>
  );
}
