import { useState, useEffect } from 'react';
import { 
  dashboardStats as initialStats, 
  recentActivity as initialActivity, 
  verificationQueue as initialQueue 
} from '../../data/dashboard';
import { 
  getDashboardStats, 
  getRecentActivity, 
  getVerificationQueue 
} from '../../services/dashboardService';

import StatCard from '../../components/dashboard/StatCard';
import ProjectMap from '../../components/dashboard/ProjectMap';
import SequestrationTrend from '../../components/dashboard/SequestrationTrend';
import RecentActivity from '../../components/dashboard/RecentActivity';
import VerificationQueueTable from '../../components/dashboard/VerificationQueueTable';

export default function AdminDashboard() {
  const [stats, setStats] = useState(initialStats);
  const [activities, setActivities] = useState(initialActivity);
  const [queue, setQueue] = useState(initialQueue);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      try {
        const [liveStats, liveActivity, liveQueue] = await Promise.all([
          getDashboardStats(),
          getRecentActivity(),
          getVerificationQueue(),
        ]);

        if (isMounted) {
          if (liveStats && liveStats.length > 0) setStats(liveStats);
          if (liveActivity && liveActivity.length > 0) setActivities(liveActivity);
          if (liveQueue && liveQueue.length > 0) setQueue(liveQueue);
        }
      } catch (err) {
        console.error('Failed to load real dashboard data from Supabase:', err);
      }
    }

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="flex flex-col w-full px-xl py-lg gap-lg">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-md">
        <div className="flex flex-col gap-xs">
          <h1 className="font-display-lg text-on-background m-0">Blue Carbon MRV Dashboard</h1>
          <p className="font-body-lg text-on-surface-variant m-0">National coastal restoration monitoring and verification</p>
        </div>
        <div className="flex items-center gap-sm">
          <div className="flex items-center bg-surface-container-low rounded-lg px-md py-sm shadow-sm gap-sm text-on-surface cursor-pointer hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-[20px]">calendar_month</span>
            <span className="font-label-md">Last 12 Months</span>
            <span className="material-symbols-outlined text-[20px]">arrow_drop_down</span>
          </div>
          <button className="bg-primary hover:bg-primary-container text-on-primary font-label-md px-md py-sm rounded-lg flex items-center gap-sm transition-colors shadow-md">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export Report
          </button>
        </div>
      </header>

      {/* KPI Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-md">
        {stats.map((stat) => (
          <StatCard key={stat.id} {...stat} />
        ))}
      </section>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
        {/* Map Visualization */}
        <ProjectMap />
        
        {/* Right Sidebar Analytics & Timeline */}
        <div className="lg:col-span-4 flex flex-col gap-lg">
          <SequestrationTrend />
          <RecentActivity activities={activities} />
        </div>
      </div>

      {/* Verification Queue Table */}
      <VerificationQueueTable queue={queue} />
    </div>
  );
}
