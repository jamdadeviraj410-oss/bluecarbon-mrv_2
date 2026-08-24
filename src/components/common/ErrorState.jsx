export default function ErrorState({ 
  title = 'Something went wrong', 
  message = 'An unexpected error occurred while loading this content.',
  onRetry = null 
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center border border-error-container rounded-xl bg-error-container/10">
      <span className="material-symbols-outlined text-[48px] text-error mb-4">error</span>
      <h3 className="font-title-lg text-title-lg text-on-surface mb-2">{title}</h3>
      <p className="font-body-md text-body-md text-error max-w-md mb-6">
        {message}
      </p>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="px-4 py-2 bg-error text-on-error rounded-lg font-title-md hover:bg-error/90 transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[20px]">refresh</span>
          Try Again
        </button>
      )}
    </div>
  );
}
