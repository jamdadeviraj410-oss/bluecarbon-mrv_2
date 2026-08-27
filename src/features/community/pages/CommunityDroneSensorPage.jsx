import { useState, useEffect } from 'react';
import PageHeader from '../../../components/common/PageHeader';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import StatusBadge from '../../../components/common/StatusBadge';
import { getDroneSurveys } from '../../../services/droneService';
import { getSensors } from '../../../services/sensorService';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import DroneSurveyMapModal from '../components/DroneSurveyMapModal';

export default function CommunityDroneSensorPage() {
  const [activeTab, setActiveTab] = useState('drones');
  const [surveys, setSurveys] = useState([]);
  const [sensors, setSensors] = useState([]);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const [droneData, sensorData] = await Promise.all([
          getDroneSurveys(),
          getSensors()
        ]);
        setSurveys(droneData);
        setSensors(sensorData);
      } catch (err) {
        setError('Failed to load drone/sensor data. Please try again.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Mock time-series data for the chart, ideally this comes from getSensorReadings
  const chartData = [
    { time: '00:00', value: 1.2 }, { time: '04:00', value: 1.8 },
    { time: '08:00', value: 2.5 }, { time: '12:00', value: 2.1 },
    { time: '16:00', value: 1.4 }, { time: '20:00', value: 1.1 },
    { time: '24:00', value: 1.3 },
  ];

  return (
    <div className="flex flex-col w-full p-4 sm:p-6 lg:p-8 gap-6 max-w-[1600px] mx-auto font-body-md text-on-surface min-h-screen">
      <PageHeader 
        title="Drone & Sensor Telemetry" 
        subtitle="Monitor field equipment, access recent UAV survey orthomosaics, and view live IoT data streams."
      />

      <div className="flex gap-2 border-b border-outline-variant/30 pb-2">
        <button
          onClick={() => setActiveTab('drones')}
          className={`px-4 py-2 font-bold rounded-t-xl transition-colors ${activeTab === 'drones' ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'}`}
        >
          <span className="flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">flight</span> UAV Surveys</span>
        </button>
        <button
          onClick={() => setActiveTab('sensors')}
          className={`px-4 py-2 font-bold rounded-t-xl transition-colors ${activeTab === 'sensors' ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'}`}
        >
          <span className="flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">sensors</span> IoT Sensors</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="p-4 bg-error/10 text-error rounded-xl border border-error/20">
          {error}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {activeTab === 'drones' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {surveys.map((survey, i) => (
                <Card key={survey.id || i} className="flex flex-col gap-4 overflow-hidden p-0">
                  <div className="h-48 w-full bg-surface-container-high relative">
                    <img src={survey.orthomosaic_url || survey.ndvi_map_url || "https://images.unsplash.com/photo-1544644181-1484b3fdfc62"} alt="Drone Map" className="w-full h-full object-cover" />
                    <div className="absolute top-4 right-4">
                      <StatusBadge status={survey.stage || 'Verified'} />
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="bg-surface/90 backdrop-blur-md p-3 rounded-xl border border-outline-variant/30 flex justify-between items-center">
                         <div>
                          <p className="font-bold text-on-surface text-sm">{survey.survey_code}</p>
                          <p className="text-xs text-on-surface-variant font-mono-data">{survey.survey_date}</p>
                         </div>
                         <Button variant="primary" size="sm" onClick={() => setSelectedSurvey(survey)}>View Map</Button>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-[10px] font-semibold text-on-surface-variant uppercase">Area</p>
                      <p className="font-mono-data font-bold text-sm">{survey.survey_area_hectares} ha</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-on-surface-variant uppercase">Canopy Cover</p>
                      <p className="font-mono-data font-bold text-sm text-secondary">{survey.canopy_cover_percent}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-on-surface-variant uppercase">NDVI</p>
                      <p className="font-mono-data font-bold text-sm">{survey.health_ndvi_mean?.toFixed(3) || 'N/A'}</p>
                    </div>
                  </div>
                </Card>
              ))}
              {surveys.length === 0 && (
                <div className="col-span-full py-12 text-center text-on-surface-variant">
                  No drone surveys available.
                </div>
              )}
            </div>
          )}

          {activeTab === 'sensors' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4 flex flex-col gap-4">
                {sensors.map((sensor, i) => (
                  <Card key={sensor.id || i} hover className={`cursor-pointer ${i === 0 ? 'ring-2 ring-primary bg-primary/5' : ''}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">sensors</span>
                        <h3 className="font-bold text-sm">{sensor.name}</h3>
                      </div>
                      <StatusBadge status={sensor.status} />
                    </div>
                    <div className="flex justify-between text-xs text-on-surface-variant mt-3">
                      <span className="font-mono-data">Type: {sensor.type}</span>
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">battery_full</span> {sensor.battery}%</span>
                    </div>
                  </Card>
                ))}
                {sensors.length === 0 && (
                  <div className="py-12 text-center text-on-surface-variant">
                    No sensors registered.
                  </div>
                )}
              </div>
              <div className="lg:col-span-8">
                <Card className="h-full flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="font-headline-md text-lg font-bold text-on-surface">Live Telemetry stream</h3>
                      <p className="text-sm text-on-surface-variant">Real-time readings from selected sensor</p>
                    </div>
                    <span className="flex items-center gap-2 text-xs font-bold text-error bg-error/10 px-3 py-1 rounded-full animate-pulse">
                      <div className="w-2 h-2 rounded-full bg-error"></div> LIVE
                    </span>
                  </div>
                  
                  <div className="flex-1 min-h-[300px] mt-4 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" opacity={0.3} vertical={false} />
                        <XAxis dataKey="time" stroke="var(--color-on-surface-variant)" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="var(--color-on-surface-variant)" fontSize={12} tickLine={false} axisLine={false} />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-outline-variant)' }}
                        />
                        <Area type="monotone" dataKey="value" stroke="var(--color-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Drone Survey Spatial Map Modal */}
      <DroneSurveyMapModal
        survey={selectedSurvey}
        isOpen={Boolean(selectedSurvey)}
        onClose={() => setSelectedSurvey(null)}
      />
    </div>
  );
}

