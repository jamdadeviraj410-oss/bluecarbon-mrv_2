/**
 * IoT Sensor Registry & Real-Time Telemetry Service
 * Manages coastal IoT field probes (water level, salinity, soil moisture, pH, temperature)
 * 
 * Includes:
 *  - Sensor Registry CRUD
 *  - Live ESP32 & MQTT Ingestion Adapter
 *  - Simulated Demo Generator (Prominently marked as DEMO SENSOR DATA)
 *  - Supabase Persistence & Real-time Stream Emulation
 */

import { supabase } from '../lib/supabase.js';

// Supported Sensor Modalities & Physical Units
export const SENSOR_TYPES = {
  WATER_LEVEL: { id: 'water_level', name: 'Water Level / Tide Height', unit: 'm', icon: 'waves', min: -0.5, max: 4.5, normalMin: 0.2, normalMax: 3.2 },
  SALINITY: { id: 'salinity', name: 'Water Salinity', unit: 'PSU', icon: 'water', min: 0, max: 45, normalMin: 15, normalMax: 35 },
  SOIL_MOISTURE: { id: 'soil_moisture', name: 'Soil Moisture', unit: '%', icon: 'humidity_mid', min: 0, max: 100, normalMin: 55, normalMax: 95 },
  PH: { id: 'ph', name: 'Sediment / Water pH', unit: 'pH', icon: 'science', min: 4.0, max: 9.5, normalMin: 6.5, normalMax: 8.5 },
  TEMPERATURE: { id: 'temperature', name: 'Ambient & Water Temp', unit: '°C', icon: 'thermostat', min: 10, max: 45, normalMin: 22, normalMax: 34 },
};

// Initial Seed Sensors for BlueCarbon Project PRJ-2023-089 (Maharashtra & Sundarbans)
export const INITIAL_SENSORS = [
  {
    id: 'sens-01',
    sensorId: 'ESP32-MANG-NODE-01',
    projectId: 'PRJ-2023-089',
    name: 'Sector A Tidal Hydrology Probe',
    type: 'water_level',
    latitude: 16.990215,
    longitude: 73.312040,
    status: 'ACTIVE',
    battery: 94.0,
    lastSeen: new Date().toISOString(),
    isSimulated: true,
    metadata: {
      model: 'ESP32-LoRa-HydroV3',
      firmware: 'v2.4.1',
      samplingRateSec: 60,
      depthMeters: 1.8,
      locationName: 'Ratnagiri Sector A Estuary',
    },
  },
  {
    id: 'sens-02',
    sensorId: 'ESP32-MANG-NODE-02',
    projectId: 'PRJ-2023-089',
    name: 'Sector A Salinity & Conductivity Array',
    type: 'salinity',
    latitude: 16.991100,
    longitude: 73.313400,
    status: 'ACTIVE',
    battery: 88.5,
    lastSeen: new Date().toISOString(),
    isSimulated: true,
    metadata: {
      model: 'ESP32-SalinityPro-485',
      firmware: 'v2.1.0',
      samplingRateSec: 60,
      calibrationOffset: 0.04,
      locationName: 'Creek Intertidal Zone',
    },
  },
  {
    id: 'sens-03',
    sensorId: 'ESP32-MANG-NODE-03',
    projectId: 'PRJ-2023-089',
    name: 'Sediment Core Moisture Sensor 03',
    type: 'soil_moisture',
    latitude: 16.989450,
    longitude: 73.311200,
    status: 'ACTIVE',
    battery: 76.0,
    lastSeen: new Date().toISOString(),
    isSimulated: true,
    metadata: {
      model: 'Decagon-5TM-ESP32',
      firmware: 'v1.8.2',
      samplingRateSec: 120,
      depthMeters: 0.3,
      locationName: 'Root-zone Substrate Plot B',
    },
  },
  {
    id: 'sens-04',
    sensorId: 'ESP32-MANG-NODE-04',
    projectId: 'PRJ-2023-089',
    name: 'Rhizosphere pH & Redox Monitor',
    type: 'ph',
    latitude: 16.988800,
    longitude: 73.310500,
    status: 'ACTIVE',
    battery: 82.0,
    lastSeen: new Date().toISOString(),
    isSimulated: true,
    metadata: {
      model: 'AtlasScientific-EZO-pH',
      firmware: 'v3.0.1',
      samplingRateSec: 300,
      locationName: 'Inner Mangrove Buffer',
    },
  },
  {
    id: 'sens-05',
    sensorId: 'ESP32-MANG-NODE-05',
    projectId: 'PRJ-2023-089',
    name: 'Ambient Coastal Weather Station',
    type: 'temperature',
    latitude: 16.992500,
    longitude: 73.314200,
    status: 'WARNING',
    battery: 32.0,
    lastSeen: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    isSimulated: true,
    metadata: {
      model: 'BME280-SolarNode',
      firmware: 'v1.2.0',
      samplingRateSec: 60,
      warningReason: 'Low Solar Battery Voltage',
      locationName: 'Canopy Tower West',
    },
  },
];

// Generate 24-hour historical seed readings for each sensor
function generateHistoricalSeedReadings() {
  const readings = [];
  const now = Date.now();
  const stepMs = 30 * 60 * 1000; // 30 min intervals
  const totalSteps = 48; // 24 hours

  INITIAL_SENSORS.forEach((sensor) => {
    for (let i = totalSteps; i >= 0; i--) {
      const timestamp = new Date(now - i * stepMs).toISOString();
      const hour = new Date(now - i * stepMs).getHours();

      let val;
      let unit;

      switch (sensor.type) {
        case 'water_level':
          // Semi-diurnal tide simulation (two peaks per 24 hours)
          val = 1.6 + 1.2 * Math.sin((hour / 12) * 2 * Math.PI) + (Math.random() * 0.1 - 0.05);
          unit = 'm';
          break;
        case 'salinity':
          // Salinity drops slightly at low tide / high freshwater runoff
          val = 26.5 + 4.5 * Math.sin(((hour + 2) / 12) * 2 * Math.PI) + (Math.random() * 0.4 - 0.2);
          unit = 'PSU';
          break;
        case 'soil_moisture':
          val = 78.0 + 8.0 * Math.cos((hour / 24) * 2 * Math.PI) + (Math.random() * 1.5 - 0.75);
          unit = '%';
          break;
        case 'ph':
          val = 7.35 + 0.3 * Math.sin((hour / 24) * 2 * Math.PI) + (Math.random() * 0.08 - 0.04);
          unit = 'pH';
          break;
        case 'temperature':
          val = 24.0 + 6.5 * Math.sin(((hour - 9) / 24) * 2 * Math.PI) + (Math.random() * 0.5 - 0.25);
          unit = '°C';
          break;
        default:
          val = 50.0;
          unit = 'units';
      }

      readings.push({
        id: `reading-${sensor.sensorId}-${i}`,
        sensorId: sensor.sensorId,
        projectId: sensor.projectId,
        readingType: sensor.type,
        value: parseFloat(val.toFixed(2)),
        unit,
        qualityScore: 99.5,
        isSimulated: true,
        recordedAt: timestamp,
      });
    }
  });

  return readings;
}

// In-memory telemetry cache
let inMemorySensors = [...INITIAL_SENSORS];
let inMemoryReadings = generateHistoricalSeedReadings();

/**
 * Fetch all registered sensors
 * @param {string} [projectId]
 * @returns {Promise<Array>}
 */
export async function getSensors(projectId) {
  try {
    let query = supabase.from('sensors').select('*').order('created_at', { ascending: false });
    if (projectId) {
      query = query.eq('project_id', projectId);
    }
    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return data.map((s) => ({
        id: s.id,
        sensorId: s.sensor_id,
        projectId: s.project_id,
        name: s.name,
        type: s.type,
        latitude: Number(s.latitude),
        longitude: Number(s.longitude),
        status: s.status,
        battery: Number(s.battery),
        lastSeen: s.last_seen,
        isSimulated: s.is_simulated,
        metadata: s.metadata || {},
      }));
    }
  } catch (err) {
    console.warn('Using local sensor cache:', err);
  }

  if (projectId) {
    return inMemorySensors.filter((s) => s.projectId === projectId);
  }
  return inMemorySensors;
}

/**
 * Get single sensor by ID
 * @param {string} sensorId
 * @returns {Object|undefined}
 */
export function getSensorById(sensorId) {
  return inMemorySensors.find((s) => s.sensorId === sensorId || s.id === sensorId);
}

/**
 * Register a new sensor in the fleet
 * @param {Object} sensorData
 * @returns {Promise<Object>}
 */
export async function registerSensor(sensorData) {
  const newSensor = {
    id: `sens-${Date.now()}`,
    sensorId: sensorData.sensorId || `ESP32-NODE-${Math.floor(1000 + Math.random() * 9000)}`,
    projectId: sensorData.projectId || 'PRJ-2023-089',
    name: sensorData.name || 'New IoT Probe',
    type: sensorData.type || 'water_level',
    latitude: Number(sensorData.latitude) || 16.990000,
    longitude: Number(sensorData.longitude) || 73.312000,
    status: 'ACTIVE',
    battery: 100.0,
    lastSeen: new Date().toISOString(),
    isSimulated: sensorData.isSimulated !== undefined ? sensorData.isSimulated : true,
    metadata: sensorData.metadata || {
      model: 'ESP32-Standard',
      samplingRateSec: 60,
    },
  };

  try {
    const { data, error } = await supabase
      .from('sensors')
      .insert({
        sensor_id: newSensor.sensorId,
        project_id: newSensor.projectId,
        name: newSensor.name,
        type: newSensor.type,
        latitude: newSensor.latitude,
        longitude: newSensor.longitude,
        status: newSensor.status,
        battery: newSensor.battery,
        is_simulated: newSensor.isSimulated,
        metadata: newSensor.metadata,
      })
      .select()
      .single();

    if (!error && data) {
      newSensor.id = data.id;
    }
  } catch (err) {
    console.warn('Supabase sensor insert notice:', err);
  }

  inMemorySensors.unshift(newSensor);
  return newSensor;
}

/**
 * Fetch telemetry time series readings
 * @param {{ sensorId?: string, projectId?: string, limit?: number, readingType?: string }} options
 * @returns {Promise<Array>}
 */
export async function getSensorReadings(options = {}) {
  const { sensorId, projectId, limit = 100, readingType } = options;

  try {
    let query = supabase.from('sensor_readings').select('*').order('recorded_at', { ascending: false }).limit(limit);
    if (sensorId) query = query.eq('sensor_id', sensorId);
    if (projectId) query = query.eq('project_id', projectId);
    if (readingType) query = query.eq('reading_type', readingType);

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return data.map((r) => ({
        id: r.id,
        sensorId: r.sensor_id,
        projectId: r.project_id,
        readingType: r.reading_type,
        value: Number(r.value),
        unit: r.unit,
        qualityScore: Number(r.quality_score),
        isSimulated: r.is_simulated,
        recordedAt: r.recorded_at,
      })).reverse();
    }
  } catch (err) {
    console.warn('Using local sensor readings cache:', err);
  }

  let list = [...inMemoryReadings];
  if (sensorId) list = list.filter((r) => r.sensorId === sensorId);
  if (projectId) list = list.filter((r) => r.projectId === projectId);
  if (readingType) list = list.filter((r) => r.readingType === readingType);

  return list.slice(-limit);
}

/**
 * Ingest raw sensor telemetry payload (HTTP / ESP32 POST / MQTT Bridge)
 * @param {Object} payload { sensorId, readingType, value, unit, isSimulated, metadata }
 * @returns {Promise<Object>}
 */
export async function ingestSensorPayload(payload) {
  const sensor = inMemorySensors.find((s) => s.sensorId === payload.sensorId);
  const now = new Date().toISOString();

  const newReading = {
    id: `reading-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    sensorId: payload.sensorId,
    projectId: payload.projectId || (sensor ? sensor.projectId : 'PRJ-2023-089'),
    readingType: payload.readingType || (sensor ? sensor.type : 'water_level'),
    value: Number(payload.value),
    unit: payload.unit || (SENSOR_TYPES[payload.readingType?.toUpperCase()]?.unit || 'units'),
    qualityScore: payload.qualityScore || 99.0,
    isSimulated: payload.isSimulated !== undefined ? payload.isSimulated : true,
    recordedAt: payload.timestamp || now,
  };

  // Update sensor last seen and battery
  if (sensor) {
    sensor.lastSeen = now;
    if (payload.battery !== undefined) {
      sensor.battery = Number(payload.battery);
    }
  }

  inMemoryReadings.push(newReading);
  // Keep memory footprint reasonable
  if (inMemoryReadings.length > 500) {
    inMemoryReadings = inMemoryReadings.slice(-300);
  }

  try {
    await supabase.from('sensor_readings').insert({
      sensor_id: newReading.sensorId,
      project_id: newReading.projectId,
      reading_type: newReading.readingType,
      value: newReading.value,
      unit: newReading.unit,
      quality_score: newReading.qualityScore,
      is_simulated: newReading.isSimulated,
      recorded_at: newReading.recordedAt,
      raw_payload: payload,
    });
  } catch (err) {
    console.warn('Telemetry insertion notice:', err);
  }

  return newReading;
}

/**
 * Demo Generator: Generate dynamic live sensor reading tick
 * Clearly flags all data as DEMO SENSOR DATA
 * @returns {Object}
 */
export function generateDemoSensorTick() {
  const randomSensor = inMemorySensors[Math.floor(Math.random() * inMemorySensors.length)];
  const now = new Date().toISOString();
  const hour = new Date().getHours();

  let val;
  let unit;

  switch (randomSensor.type) {
    case 'water_level':
      val = 1.6 + 1.2 * Math.sin((hour / 12) * 2 * Math.PI) + (Math.random() * 0.15 - 0.075);
      unit = 'm';
      break;
    case 'salinity':
      val = 26.5 + 4.5 * Math.sin(((hour + 2) / 12) * 2 * Math.PI) + (Math.random() * 0.5 - 0.25);
      unit = 'PSU';
      break;
    case 'soil_moisture':
      val = 78.0 + 8.0 * Math.cos((hour / 24) * 2 * Math.PI) + (Math.random() * 1.8 - 0.9);
      unit = '%';
      break;
    case 'ph':
      val = 7.35 + 0.3 * Math.sin((hour / 24) * 2 * Math.PI) + (Math.random() * 0.1 - 0.05);
      unit = 'pH';
      break;
    case 'temperature':
      val = 24.0 + 6.5 * Math.sin(((hour - 9) / 24) * 2 * Math.PI) + (Math.random() * 0.6 - 0.3);
      unit = '°C';
      break;
    default:
      val = 50.0;
      unit = 'units';
  }

  const reading = {
    id: `demo-${Date.now()}`,
    sensorId: randomSensor.sensorId,
    projectId: randomSensor.projectId,
    readingType: randomSensor.type,
    value: parseFloat(val.toFixed(2)),
    unit,
    qualityScore: 99.2,
    isSimulated: true, // MANDATORY DEMO FLAG
    recordedAt: now,
  };

  randomSensor.lastSeen = now;
  inMemoryReadings.push(reading);

  return reading;
}
