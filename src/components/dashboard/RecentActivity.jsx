

export default function RecentActivity({ activities }) {
  return (
    <div className="bg-surface rounded-xl shadow-sm p-md flex-1 flex flex-col">
      <h3 className="font-title-md text-on-surface m-0 mb-md flex items-center justify-between">
        Audit Trail Activity
        <button className="font-label-md text-primary bg-transparent border-none cursor-pointer hover:underline">View All</button>
      </h3>
      <div className="flex flex-col gap-md relative">
        {/* Timeline line */}
        <div className="absolute left-3 top-2 bottom-2 w-px bg-outline-variant"></div>
        
        {activities.map((activity, index) => {
          const isLast = index === activities.length - 1;
          const bgClass = activity.iconColor === 'secondary' ? 'bg-secondary/20' : 'bg-surface-container-high';
          
          return (
            <div key={activity.id} className="flex gap-md relative z-10">
              <div className={`w-6 h-6 rounded-full ${bgClass} border-2 border-surface flex items-center justify-center shrink-0`}>
                <span className={`material-symbols-outlined text-[14px] text-${activity.iconColor}`}>
                  {activity.icon}
                </span>
              </div>
              <div className={`flex flex-col gap-xs ${!isLast ? 'pb-sm' : ''}`}>
                <span className="font-body-md text-on-surface font-semibold">{activity.title}</span>
                <span className="font-body-md text-on-surface-variant">{activity.description}</span>
                <span className="font-label-md text-on-surface-variant/70 mt-xs font-mono-data">{activity.time}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
