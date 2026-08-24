import { useState, useEffect, useRef } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  SENSOR_TYPES,
  INITIAL_SENSORS,
  getSensors,
  getSensorReadings,
  registerSensor,
  generateDemoSensorTick,
} from '../../services/sensorService';

export default function SensorRegistryView({ projectId = 'PRJ-2023-089' }) {
  const [sensors, setSensors] = useState(INITIAL_SENSORS);
  const [selectedSensor, setSelectedSensor] = useState(INITIAL_SENSORS[0]);
  const [readings, setReadings] = useState([]);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [isLiveStreaming, setIsLiveStreaming] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // New Sensor Form state
  const [newSensorName, setNewSensorName] = useState('');
  const [newSensorType, setNewSensorType] = useState('water_level');
  const [newSensorLat, setNewSensorLat] = useState('16.990500');
  const [newSensorLng, setNewSensorLng] = useState('73.312200');
  const [newSensorModel, setNewSensorModel] = useState('ESP32-LoRa-Custom');

  const streamIntervalRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const sensorList = await getSensors(projectId);
        if (isMounted && sensorList.length > 0) {
          setSensors(sensorList);
          setSelectedSensor(sensorList[0]);
          const initialReadings = await getSensorReadings({
            sensorId: sensorList[0].sensorId,
            limit: 40,
          });
          setReadings(initialReadings);
        }
      } catch (err) {
        console.error('Error loading sensor data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [projectId]);

  // Load readings when selected sensor changes
  useEffect(() => {
    if (!selectedSensor) return;
    async function loadSensorReadings() {
      const data = await getSensorReadings({
        sensorId: selectedSensor.sensorId,
        limit: 40,
      });
      setReadings(data);
    }
    loadSensorReadings();
  }, [selectedSensor]);

  // Live Simulated Telemetry Streamer (ESP32 Tick Generator)
  useEffect(() => {
    if (isLiveStreaming) {
      streamIntervalRef.current = setInterval(() => {
        const tick = generateDemoSensorTick();
        if (selectedSensor && tick.sensorId === selectedSensor.sensorId) {
          setReadings((prev) => [...prev.slice(-39), tick]);
        }
        // Update sensor last seen
        setSensors((prev) =>
          prev.map((s) => (s.sensorId === tick.sensorId ? { ...s, lastSeen: tick.recordedAt } : s))
        );
      }, 2500);
    } else {
      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current);
      }
    }
    return () => {
      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current);
      }
    };
  }, [isLiveStreaming, selectedSensor]);

  const handleRegisterSensor = async (e) => {
    e.preventDefault();
    try {
      const registered = await registerSensor({
        projectId,
        name: newSensorName || 'Custom IoT Node',
        type: newSensorType,
        latitude: parseFloat(newSensorLat) || 16.9902,
        longitude: parseFloat(newSensorLng) || 73.3120,
        isSimulated: true,
        metadata: {
          model: newSensorModel,
          samplingRateSec: 60,
        },
      });

      setSensors((prev) => [registered, ...prev]);
      setSelectedSensor(registered);
      setIsModalOpen(false);
      setNotification({
        type: 'success',
        message: `Registered new sensor "${registered.name}" (${registered.sensorId}).`,
      });
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error('Sensor registration error:', err);
    }
  };

  const filteredSensors = activeFilter === 'ALL'
    ? sensors
    : sensors.filter((s) => s.type === activeFilter);

  const activeSensorTypeMeta = selectedSensor ? SENSOR_TYPES[selectedSensor.type?.toUpperCase()] || { unit: 'units', normalMin: 0, normalMax: 100 } : {};

  if (loading) {
    return (
      <div className="p-12 text-center text-on-surface-variant flex flex-col items-center gap-3">
        <span className="material-symbols-outlined text-[36px] animate-spin text-primary">autorenew</span>
        <span className="text-sm font-medium">Loading IoT Sensor Fleet & Telemetry...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Prominent Demo Sensor Data Disclaimer Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-blue-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-blue-300 text-[24px]">sensors</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-sm tracking-wide">IoT Telemetry & Ingestion Pipeline</h3>
              <span className="bg-amber-400 text-gray-950 text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-sm tracking-wider">
                DEMO SENSOR DATA
              </span>
            </div>
            <p className="text-xs text-blue-200 mt-0.5">
              Simulated ESP32 nodes stream realistic tidal curves, salinity gradients, sediment moisture, and pH cycles.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={() => setIsLiveStreaming((prev) => !prev)}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm ${
              isLiveStreaming
                ? 'bg-amber-400 text-gray-950 hover:bg-amber-300 animate-pulse'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {isLiveStreaming ? 'pause_circle' : 'play_arrow'}
            </span>
            {isLiveStreaming ? 'Streaming ESP32 Live' : 'Start Live Telemetry Tick'}
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            Add Probe
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-4 rounded-xl text-sm flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 shadow-sm">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {/* Fleet Overview Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-sm">
          <div className="flex items-center justify-between text-on-surface-variant text-xs">
            <span>Active Probes</span>
            <span className="material-symbols-outlined text-emerald-600 text-[18px]">wifi</span>
          </div>
          <div className="text-2xl font-bold text-on-surface mt-2 font-mono">
            {sensors.filter((s) => s.status === 'ACTIVE').length} / {sensors.length}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            99.2% Fleet Uptime
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-sm">
          <div className="flex items-center justify-between text-on-surface-variant text-xs">
            <span>Avg Battery</span>
            <span className="material-symbols-outlined text-blue-600 text-[18px]">battery_charging_full</span>
          </div>
          <div className="text-2xl font-bold text-on-surface mt-2 font-mono">
            {Math.round(sensors.reduce((sum, s) => sum + (s.battery || 100), 0) / (sensors.length || 1))}%
          </div>
          <div className="text-[11px] text-on-surface-variant mt-1">Solar LiFePO4 Array</div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-sm">
          <div className="flex items-center justify-between text-on-surface-variant text-xs">
            <span>Sampling Interval</span>
            <span className="material-symbols-outlined text-indigo-600 text-[18px]">timer</span>
          </div>
          <div className="text-2xl font-bold text-on-surface mt-2 font-mono">60s</div>
          <div className="text-[11px] text-indigo-700 font-medium mt-1">LoRaWAN + ESP32 HTTP</div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-sm">
          <div className="flex items-center justify-between text-on-surface-variant text-xs">
            <span>Active Warnings</span>
            <span className="material-symbols-outlined text-amber-600 text-[18px]">warning</span>
          </div>
          <div className="text-2xl font-bold text-on-surface mt-2 font-mono">
            {sensors.filter((s) => s.status === 'WARNING').length}
          </div>
          <div className="text-[11px] text-amber-800 font-medium mt-1">1 Low Battery Flag</div>
        </div>
      </div>

      {/* Main Content: Sensor Fleet & Telemetry Chart */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Filter & Sensor List */}
        <div className="xl:col-span-5 space-y-4">
          {/* Modality Filter Pills */}
          <div className="flex flex-wrap gap-1.5 bg-surface-container-low p-1.5 rounded-xl border border-outline-variant">
            {['ALL', 'water_level', 'salinity', 'soil_moisture', 'ph', 'temperature'].map((typeKey) => {
              const label = typeKey === 'ALL' ? 'All Probes' : SENSOR_TYPES[typeKey.toUpperCase()]?.name.split('/')[0].trim() || typeKey;
              const isActive = activeFilter === typeKey;
              return (
                <button
                  key={typeKey}
                  onClick={() => setActiveFilter(typeKey)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Sensor Cards List */}
          <div className="space-y-3">
            {filteredSensors.map((sensor) => {
              const isSelected = selectedSensor?.id === sensor.id;
              const typeMeta = SENSOR_TYPES[sensor.type?.toUpperCase()] || { name: sensor.type, unit: '', icon: 'sensors' };
              return (
                <div
                  key={sensor.id}
                  onClick={() => setSelectedSensor(sensor)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-primary bg-primary-fixed/20 shadow-md ring-2 ring-primary/20'
                      : 'border-outline-variant bg-surface-container-lowest hover:border-outline-variant/80 hover:bg-surface-container-low'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-xl ${
                        isSelected ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'
                      }`}>
                        <span className="material-symbols-outlined text-[22px]">{typeMeta.icon}</span>
                      </div>
                      <div>
                        <div className="font-bold text-xs text-on-surface flex items-center gap-2">
                          <span>{sensor.name}</span>
                          {sensor.isSimulated && (
                            <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-bold px-1.5 py-0.2 rounded uppercase">
                              Demo
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-on-surface-variant mt-0.5">
                          {sensor.sensorId} • {typeMeta.name}
                        </div>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      sensor.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : sensor.status === 'WARNING'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {sensor.status}
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-outline-variant/40 flex items-center justify-between text-[11px] text-on-surface-variant">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px]">battery_std</span>
                      <span className="font-mono font-bold text-on-surface">{sensor.battery}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">pin_drop</span>
                      <span className="font-mono">{sensor.latitude?.toFixed(4)}, {sensor.longitude?.toFixed(4)}</span>
                    </div>
                    <div>
                      <span>Seen: {new Date(sensor.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Time Series Telemetry Dashboard */}
        <div className="xl:col-span-7 space-y-4">
          <div className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant shadow-sm space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-outline-variant/40">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-title-md text-title-md font-bold text-on-surface">
                    {selectedSensor?.name}
                  </h3>
                  <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded">
                    DEMO SENSOR DATA
                  </span>
                </div>
                <div className="text-xs text-on-surface-variant mt-0.5">
                  Real-time telemetry stream with threshold boundary monitoring
                </div>
              </div>

              {readings.length > 0 && (
                <div className="text-right">
                  <div className="text-xs text-on-surface-variant">Current Reading:</div>
                  <div className="text-xl font-bold font-mono text-primary">
                    {readings[readings.length - 1]?.value} {readings[readings.length - 1]?.unit}
                  </div>
                </div>
              )}
            </div>

            {/* Recharts Live Chart */}
            <div className="h-[280px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={readings}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" opacity={0.6} />
                  <XAxis
                    dataKey="recordedAt"
                    tickFormatter={(timeStr) => {
                      try {
                        const date = new Date(timeStr);
                        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      } catch {
                        return '';
                      }
                    }}
                    stroke="#737780"
                    fontSize={11}
                  />
                  <YAxis
                    stroke="#737780"
                    fontSize={11}
                    unit={` ${activeSensorTypeMeta.unit || ''}`}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#001e40',
                      color: '#ffffff',
                      borderRadius: '8px',
                      fontSize: '12px',
                      border: 'none',
                    }}
                    labelFormatter={(label) => `Timestamp: ${new Date(label).toLocaleString()}`}
                    formatter={(val) => [`${val} ${activeSensorTypeMeta.unit || ''}`, 'Measurement']}
                  />
                  {activeSensorTypeMeta.normalMax && (
                    <ReferenceLine
                      y={activeSensorTypeMeta.normalMax}
                      label={{ value: 'Upper Normal Bound', fill: '#ba1a1a', fontSize: 10 }}
                      stroke="#ba1a1a"
                      strokeDasharray="4 4"
                    />
                  )}
                  {activeSensorTypeMeta.normalMin && (
                    <ReferenceLine
                      y={activeSensorTypeMeta.normalMin}
                      label={{ value: 'Lower Normal Bound', fill: '#ba1a1a', fontSize: 10 }}
                      stroke="#ba1a1a"
                      strokeDasharray="4 4"
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#003366"
                    strokeWidth={2.5}
                    dot={{ r: 2.5, fill: '#001e40' }}
                    activeDot={{ r: 6, fill: '#1b6d24' }}
                    isAnimationActive={!isLiveStreaming}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Sensor Technical Metadata Footer */}
            {selectedSensor && (
              <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/60 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-on-surface-variant block">Hardware Node:</span>
                  <span className="font-mono font-bold text-on-surface">
                    {selectedSensor.metadata?.model || 'ESP32-Std'}
                  </span>
                </div>
                <div>
                  <span className="text-on-surface-variant block">Firmware:</span>
                  <span className="font-mono font-bold text-on-surface">
                    {selectedSensor.metadata?.firmware || 'v2.4.1'}
                  </span>
                </div>
                <div>
                  <span className="text-on-surface-variant block">Depth / Placement:</span>
                  <span className="font-bold text-on-surface">
                    {selectedSensor.metadata?.depthMeters ? `${selectedSensor.metadata.depthMeters}m depth` : 'Surface / Canopy'}
                  </span>
                </div>
                <div>
                  <span className="text-on-surface-variant block">Ingestion Protocol:</span>
                  <span className="font-bold text-emerald-800 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                    HTTPS REST / MQTT
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sensor Registration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl p-6 max-w-md w-full border border-outline-variant shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
              <h3 className="font-title-md text-title-md font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">add_location_alt</span>
                Register Field Probe
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterSensor} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-on-surface-variant mb-1">Probe Name</label>
                <input
                  type="text"
                  required
                  value={newSensorName}
                  onChange={(e) => setNewSensorName(e.target.value)}
                  placeholder="e.g. Sector B Estuary Hydrology Sensor"
                  className="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-on-surface-variant mb-1">Sensor Modality</label>
                <select
                  value={newSensorType}
                  onChange={(e) => setNewSensorType(e.target.value)}
                  className="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option value="water_level">Water Level / Tide Height (m)</option>
                  <option value="salinity">Water Salinity (PSU)</option>
                  <option value="soil_moisture">Soil Moisture (%)</option>
                  <option value="ph">Sediment / Water pH</option>
                  <option value="temperature">Temperature (°C)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-on-surface-variant mb-1">Latitude</label>
                  <input
                    type="text"
                    required
                    value={newSensorLat}
                    onChange={(e) => setNewSensorLat(e.target.value)}
                    className="w-full font-mono p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-on-surface-variant mb-1">Longitude</label>
                  <input
                    type="text"
                    required
                    value={newSensorLng}
                    onChange={(e) => setNewSensorLng(e.target.value)}
                    className="w-full font-mono p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-on-surface-variant mb-1">Hardware / Microcontroller Model</label>
                <input
                  type="text"
                  value={newSensorModel}
                  onChange={(e) => setNewSensorModel(e.target.value)}
                  placeholder="e.g. ESP32-WROOM-32D / LoRa SX1276"
                  className="w-full font-mono p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-[11px] text-amber-900">
                <strong>Simulated Node Note:</strong> New sensors are automatically tagged with the <code>DEMO SENSOR DATA</code> badge.
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold border border-outline-variant text-on-surface-variant hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-bold bg-primary text-on-primary hover:bg-primary-container shadow-sm"
                >
                  Register Node
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
