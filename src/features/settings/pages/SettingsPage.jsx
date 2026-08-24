import { useState } from 'react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="flex-1 bg-background flex flex-col min-h-screen">
      {/* Header Area */}
      <div className="px-6 md:px-8 py-6">
        <h1 className="font-display-lg text-4xl font-bold text-on-background">Settings</h1>
        <p className="font-body-lg text-on-surface-variant mt-2">
          Manage your account, organization details, and system preferences.
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="px-6 md:px-8 pb-8 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 md:gap-8 flex-1">
        {/* Sidebar Navigation (Desktop) */}
        <nav className="hidden lg:flex flex-col gap-2 sticky top-[100px] self-start">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-4 px-4 py-3 rounded-lg font-title-md transition-colors text-left w-full ${
              activeTab === 'profile'
                ? 'bg-primary-container text-on-primary-container shadow-sm'
                : 'text-on-surface hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined">person</span>
            Profile
          </button>
          <button
            onClick={() => setActiveTab('organization')}
            className={`flex items-center gap-4 px-4 py-3 rounded-lg font-title-md transition-colors text-left w-full ${
              activeTab === 'organization'
                ? 'bg-primary-container text-on-primary-container shadow-sm'
                : 'text-on-surface hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined">corporate_fare</span>
            Organization
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-4 px-4 py-3 rounded-lg font-title-md transition-colors text-left w-full ${
              activeTab === 'notifications'
                ? 'bg-primary-container text-on-primary-container shadow-sm'
                : 'text-on-surface hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined">notifications</span>
            Notifications
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-4 px-4 py-3 rounded-lg font-title-md transition-colors text-left w-full ${
              activeTab === 'security'
                ? 'bg-primary-container text-on-primary-container shadow-sm'
                : 'text-on-surface hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined">security</span>
            Security
          </button>
          <button
            onClick={() => setActiveTab('integration')}
            className={`flex items-center gap-4 px-4 py-3 rounded-lg font-title-md transition-colors text-left w-full ${
              activeTab === 'integration'
                ? 'bg-primary-container text-on-primary-container shadow-sm'
                : 'text-on-surface hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined">api</span>
            API / Integration
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`flex items-center gap-4 px-4 py-3 rounded-lg font-title-md transition-colors text-left w-full ${
              activeTab === 'preferences'
                ? 'bg-primary-container text-on-primary-container shadow-sm'
                : 'text-on-surface hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined">tune</span>
            Preferences
          </button>
        </nav>

        {/* Mobile Tab Select */}
        <div className="lg:hidden mb-4 relative">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            className="w-full bg-white font-body-md text-on-surface px-4 py-3 rounded-lg appearance-none shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer border border-gray-200"
          >
            <option value="profile">Profile</option>
            <option value="organization">Organization</option>
            <option value="notifications">Notifications</option>
            <option value="security">Security</option>
            <option value="integration">API / Integration</option>
            <option value="preferences">Preferences</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-on-surface-variant">
            <span className="material-symbols-outlined text-[20px]">expand_more</span>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex flex-col gap-6 w-full max-w-full">
          
          {/* Section: Profile */}
          {activeTab === 'profile' && (
            <div className="flex flex-col gap-6 animate-[fadeIn_0.3s_ease-in-out]">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h2 className="text-xl font-bold text-on-surface mb-6">Profile Information</h2>
                <div className="flex flex-col sm:flex-row gap-6 items-start mb-8 border-b border-gray-100 pb-8">
                  <div className="relative group w-24 h-24 rounded-full overflow-hidden shadow-sm flex-shrink-0 cursor-pointer bg-gray-100">
                    <img
                      alt="Profile headshot"
                      className="w-full h-full object-cover"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAp5cv2qX_nDQiEHTU6EnnyZFEjNjUDbai3xFSRlBmazxAzU9lOJW0kCgyMy3a82L6_Pg25WZ9l0-GHN_n7RkeqC3uJPpoCFc-qFkF56t8xfJXjETW8LxyGE6mdebQkqsVm57Y9NnBjJaAYqV93CWkzhVkhaiSg-PDFRA0PgvIumFhmJIcTnrxsWecVANdWef-qVvxlzy2Wpfe03tMfnm1sD0tasddWQT3qtcMgbT3QK-tW4Nv2rCm63w"
                    />
                    <div className="absolute inset-0 bg-primary/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="material-symbols-outlined text-white">photo_camera</span>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col justify-center min-h-[6rem]">
                    <h3 className="font-title-lg font-bold text-on-surface">Admin User</h3>
                    <p className="font-body-md text-gray-500 mb-2">JPG, GIF or PNG. Max size of 800K</p>
                    <div className="flex gap-2">
                      <button className="px-4 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors">
                        Change
                      </button>
                      <button className="px-4 py-1.5 text-red-600 text-sm font-semibold hover:bg-red-50 rounded-lg transition-colors">
                        Remove
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2 min-w-0">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Full Name</label>
                    <input
                      type="text"
                      defaultValue="Admin User"
                      className="bg-white px-4 py-2.5 rounded-lg shadow-sm border border-gray-200 font-body-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all w-full"
                    />
                  </div>
                  <div className="flex flex-col gap-2 min-w-0">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email Address</label>
                    <input
                      type="email"
                      defaultValue="admin@marineledger.org"
                      className="bg-white px-4 py-2.5 rounded-lg shadow-sm border border-gray-200 font-body-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all w-full"
                    />
                  </div>
                  <div className="flex flex-col gap-2 min-w-0">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone Number</label>
                    <input
                      type="tel"
                      defaultValue="+1 (555) 123-4567"
                      className="bg-white px-4 py-2.5 rounded-lg shadow-sm border border-gray-200 font-body-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all w-full"
                    />
                  </div>
                  <div className="flex flex-col gap-2 min-w-0">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</label>
                    <input
                      type="text"
                      defaultValue="NCCR Admin"
                      disabled
                      className="bg-gray-50 px-4 py-2.5 rounded-lg shadow-sm border border-gray-200 font-body-md text-gray-500 cursor-not-allowed w-full"
                    />
                  </div>
                  <div className="flex flex-col gap-2 min-w-0 md:col-span-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Organization</label>
                    <input
                      type="text"
                      defaultValue="Registrar Office"
                      disabled
                      className="bg-gray-50 px-4 py-2.5 rounded-lg shadow-sm border border-gray-200 font-body-md text-gray-500 cursor-not-allowed w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section: Organization */}
          {activeTab === 'organization' && (
            <div className="flex flex-col gap-6 animate-[fadeIn_0.3s_ease-in-out]">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h2 className="text-xl font-bold text-on-surface mb-6">Organization Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2 min-w-0 md:col-span-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Organization Name</label>
                    <input
                      type="text"
                      defaultValue="BlueCarbon MRV Registry Authority"
                      className="bg-white px-4 py-2.5 rounded-lg shadow-sm border border-gray-200 font-body-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all w-full"
                    />
                  </div>
                  <div className="flex flex-col gap-2 min-w-0">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Registration ID</label>
                    <input
                      type="text"
                      defaultValue="BC-AUTH-99201"
                      className="bg-white px-4 py-2.5 rounded-lg shadow-sm border border-gray-200 font-body-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all w-full"
                    />
                  </div>
                  <div className="flex flex-col gap-2 min-w-0">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact Person</label>
                    <input
                      type="text"
                      defaultValue="Sarah Jenkins, Director"
                      className="bg-white px-4 py-2.5 rounded-lg shadow-sm border border-gray-200 font-body-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all w-full"
                    />
                  </div>
                  <div className="flex flex-col gap-2 min-w-0 md:col-span-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Address</label>
                    <input
                      type="text"
                      defaultValue="100 Ocean Avenue, Suite 400"
                      className="bg-white px-4 py-2.5 rounded-lg shadow-sm border border-gray-200 font-body-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all w-full"
                    />
                  </div>
                  <div className="flex flex-col gap-2 min-w-0">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">District</label>
                    <input
                      type="text"
                      defaultValue="Coastal Zone A"
                      className="bg-white px-4 py-2.5 rounded-lg shadow-sm border border-gray-200 font-body-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all w-full"
                    />
                  </div>
                  <div className="flex flex-col gap-2 min-w-0">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">State</label>
                    <input
                      type="text"
                      defaultValue="California"
                      className="bg-white px-4 py-2.5 rounded-lg shadow-sm border border-gray-200 font-body-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section: Notifications */}
          {activeTab === 'notifications' && (
            <div className="flex flex-col gap-6 animate-[fadeIn_0.3s_ease-in-out]">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h2 className="text-xl font-bold text-on-surface mb-2">Notification Preferences</h2>
                <p className="text-sm text-gray-500 mb-6 border-b border-gray-100 pb-4">
                  Choose what events you want to be notified about across the platform.
                </p>
                <div className="flex flex-col gap-4">
                  {[
                    { title: 'Email Notifications', desc: 'Receive summary emails for all active alerts.' },
                    { title: 'MRV Updates', desc: 'Alerts when new drone or sensor data is uploaded.' },
                    { title: 'Verification Requests', desc: 'Notify when a project requires manual verification.' },
                    { title: 'System Alerts', desc: 'Critical notifications regarding API connectivity or registry sync.' }
                  ].map((notif, idx) => (
                    <label key={idx} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-gray-100">
                      <div className="flex flex-col min-w-0 pr-4">
                        <span className="font-semibold text-gray-900 truncate">{notif.title}</span>
                        <span className="text-sm text-gray-500 truncate">{notif.desc}</span>
                      </div>
                      <div className="relative inline-block w-12 flex-shrink-0 align-middle select-none">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border border-gray-300 shadow-sm appearance-none cursor-pointer transition-transform duration-200 ease-in-out transform translate-x-6 checked:border-primary checked:bg-white"
                        />
                        <div className="toggle-label block overflow-hidden h-6 rounded-full bg-primary cursor-pointer border border-primary"></div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Placeholder for unimplemented tabs */}
          {['security', 'integration', 'preferences'].includes(activeTab) && (
            <div className="flex flex-col gap-6 animate-[fadeIn_0.3s_ease-in-out]">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center justify-center min-h-[300px]">
                <div className="text-center">
                  <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">construction</span>
                  <h2 className="text-lg font-bold text-gray-500">Under Construction</h2>
                  <p className="text-sm text-gray-400">This section is not fully defined in the current design.</p>
                </div>
              </div>
            </div>
          )}

          {/* Persistent Actions */}
          <div className="sticky bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md p-4 mt-auto flex flex-col sm:flex-row justify-end gap-3 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] rounded-xl z-10 border border-gray-100">
            <button className="px-6 py-2.5 font-semibold text-gray-700 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors w-full sm:w-auto">
              Cancel
            </button>
            <button className="px-6 py-2.5 font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors w-full sm:w-auto">
              Save Changes
            </button>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .toggle-checkbox:checked {
          right: 0;
          border-color: transparent;
        }
        .toggle-checkbox:not(:checked) {
          transform: translateX(0);
        }
        .toggle-checkbox:not(:checked) + .toggle-label {
          background-color: #e5e7eb;
          border-color: #d1d5db;
        }
      `}} />
    </div>
  );
}
