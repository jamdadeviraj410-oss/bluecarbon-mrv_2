import { useState, useEffect } from 'react';
import PageHeader from '../../../components/common/PageHeader';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import { getCommunityProfile } from '../../../services/communityService';
import { useAuth } from '../../../contexts/AuthContext';

export default function CommunitySettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    role: '',
    phone: '',
    walletAddress: '',
  });

  useEffect(() => {
    async function loadProfile() {
      setIsLoading(true);
      try {
        const data = await getCommunityProfile(user?.id);
        if (data) {
          setProfile({
            name: data.community_name || user?.user_metadata?.full_name || '',
            email: user?.email || '',
            role: data.role || user?.user_metadata?.role || 'Community Member',
            phone: data.phone || '',
            walletAddress: data.wallet_address || '',
          });
        } else if (user) {
          setProfile({
            name: user.user_metadata?.full_name || '',
            email: user.email || '',
            role: user.user_metadata?.role || 'Community Member',
            phone: '',
            walletAddress: '',
          });
        }
      } catch (err) {
        console.error('Failed to load community profile:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, [user]);

  const handleSave = () => {
    setIsSaving(true);
    // In a real implementation, we would call an update function here.
    setTimeout(() => {
      setIsSaving(false);
      alert('Settings saved successfully!');
    }, 1500);
  };

  return (
    <div className="flex flex-col w-full p-4 sm:p-6 lg:p-8 gap-6 max-w-[1600px] mx-auto font-body-md text-on-surface min-h-screen">
      <PageHeader 
        title="Settings & Profile" 
        subtitle="Manage your community portal preferences, web3 wallet, and personal details."
      />

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          <Card className="w-full lg:w-1/4 h-fit p-0 overflow-hidden flex flex-col">
            <button 
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-3 p-4 text-left transition-colors border-l-4 ${activeTab === 'profile' ? 'border-primary bg-primary/5 font-bold text-primary' : 'border-transparent text-on-surface hover:bg-surface-container'}`}
            >
              <span className="material-symbols-outlined">person</span>
              Profile Details
            </button>
            <button 
              onClick={() => setActiveTab('web3')}
              className={`flex items-center gap-3 p-4 text-left transition-colors border-l-4 ${activeTab === 'web3' ? 'border-primary bg-primary/5 font-bold text-primary' : 'border-transparent text-on-surface hover:bg-surface-container'}`}
            >
              <span className="material-symbols-outlined">account_balance_wallet</span>
              Web3 Wallet
            </button>
            <button 
              onClick={() => setActiveTab('notifications')}
              className={`flex items-center gap-3 p-4 text-left transition-colors border-l-4 ${activeTab === 'notifications' ? 'border-primary bg-primary/5 font-bold text-primary' : 'border-transparent text-on-surface hover:bg-surface-container'}`}
            >
              <span className="material-symbols-outlined">notifications</span>
              Notifications
            </button>
          </Card>

          <Card className="flex-1">
            {activeTab === 'profile' && (
              <div className="flex flex-col gap-6">
                <h2 className="font-headline-md text-xl font-bold border-b border-outline-variant/30 pb-4 m-0">Profile Details</h2>
                
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  <div className="w-24 h-24 rounded-full bg-surface-container-high border-4 border-surface flex items-center justify-center text-4xl font-bold text-primary shrink-0 uppercase shadow-sm">
                    {profile.name.substring(0, 1) || 'U'}
                  </div>
                  <div className="flex flex-col gap-4 flex-1 w-full">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-on-surface-variant uppercase">Full Name</label>
                        <input 
                          type="text" 
                          className="bg-surface border border-outline-variant rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:outline-none w-full"
                          value={profile.name}
                          onChange={(e) => setProfile({...profile, name: e.target.value})}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-on-surface-variant uppercase">Email Address</label>
                        <input 
                          type="email" 
                          disabled
                          className="bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2 w-full text-on-surface-variant cursor-not-allowed opacity-70"
                          value={profile.email}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-on-surface-variant uppercase">Role</label>
                        <input 
                          type="text" 
                          disabled
                          className="bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2 w-full text-on-surface-variant cursor-not-allowed opacity-70"
                          value={profile.role}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-on-surface-variant uppercase">Phone Number</label>
                        <input 
                          type="text" 
                          className="bg-surface border border-outline-variant rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:outline-none w-full"
                          value={profile.phone}
                          onChange={(e) => setProfile({...profile, phone: e.target.value})}
                          placeholder="+1 234 567 8900"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'web3' && (
              <div className="flex flex-col gap-6">
                <h2 className="font-headline-md text-xl font-bold border-b border-outline-variant/30 pb-4 m-0">Web3 Wallet Configuration</h2>
                <div className="flex flex-col gap-4">
                  <p className="text-sm text-on-surface-variant">Connect your Web3 wallet to receive carbon credit issuance directly to your address on the Polygon network.</p>
                  
                  <div className="flex flex-col gap-1.5 max-w-xl">
                    <label className="text-xs font-semibold text-on-surface-variant uppercase">Wallet Address (Polygon / ETH)</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        className="bg-surface border border-outline-variant rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:outline-none w-full font-mono-data text-sm"
                        value={profile.walletAddress}
                        onChange={(e) => setProfile({...profile, walletAddress: e.target.value})}
                        placeholder="0x..."
                      />
                      <Button variant="outline" onClick={() => alert('Metamask integration would trigger here')}>Connect</Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="flex flex-col gap-6">
                <h2 className="font-headline-md text-xl font-bold border-b border-outline-variant/30 pb-4 m-0">Notification Preferences</h2>
                <div className="flex flex-col gap-4">
                  {[
                    { title: 'Email Alerts', desc: 'Receive MRV verification updates via email.' },
                    { title: 'Credit Issuance', desc: 'Notify me when new carbon credits are minted.' },
                    { title: 'Project Milestones', desc: 'Updates on community project funding and milestones.' }
                  ].map((pref, i) => (
                    <label key={i} className="flex items-center justify-between p-4 bg-surface-container-lowest border border-outline-variant/30 rounded-xl cursor-pointer">
                      <div>
                        <p className="font-bold text-on-surface">{pref.title}</p>
                        <p className="text-xs text-on-surface-variant mt-0.5">{pref.desc}</p>
                      </div>
                      <div className="relative inline-block w-10 h-6">
                        <input type="checkbox" className="peer sr-only" defaultChecked />
                        <div className="w-10 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary transition-colors"></div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-outline-variant/30 flex justify-end">
              <Button variant="primary" isLoading={isSaving} onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
