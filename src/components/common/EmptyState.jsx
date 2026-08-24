export default function EmptyState({ 
  icon = 'inbox', 
  title = 'No Data Found', 
  description = 'There is currently no data to display here.',
  action = null 
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 bg-surface-variant rounded-full flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-[32px] text-on-surface-variant">{icon}</span>
      </div>
      <h3 className="font-title-lg text-title-lg text-on-surface mb-2">{title}</h3>
      <p className="font-body-md text-body-md text-on-surface-variant max-w-sm mb-6">
        {description}
      </p>
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  );
}
