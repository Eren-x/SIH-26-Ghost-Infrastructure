import { SENSOR_DEFAULTS, GPS_ORIGIN, METERS_PER_UNIT } from '../../shared/constants.js';

function gaussianNoise(stddev) {
  let u = 1 - Math.random();
  let v = Math.random();
  return stddev * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

export function generateSensorReadings(roverState, zones, noiseScale = 1.0) {
  let vibration = SENSOR_DEFAULTS.vibration.base + gaussianNoise(SENSOR_DEFAULTS.vibration.noise * noiseScale);
  let acoustic = SENSOR_DEFAULTS.acoustic.base + gaussianNoise(SENSOR_DEFAULTS.acoustic.noise * noiseScale);
  let temperature = SENSOR_DEFAULTS.temperature.base + gaussianNoise(SENSOR_DEFAULTS.temperature.noise * noiseScale);
  let humidity = SENSOR_DEFAULTS.humidity.base + gaussianNoise(SENSOR_DEFAULTS.humidity.noise * noiseScale);

  const { x, z } = roverState;

  zones.forEach(zone => {
    const dx = x - zone.x;
    const dz = z - zone.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance < zone.radius) {
      const influence = zone.severity * Math.exp(-2 * Math.pow(distance / zone.radius, 2));
      
      if (zone.type === 'cavity') {
        vibration += influence * 2.0;
        acoustic -= influence * 25;
      } else if (zone.type === 'leak') {
        humidity += influence * 45;
        temperature -= influence * 5;
        acoustic += influence * 8 * Math.sin(Date.now() / 200);
      }
    }
  });

  const terrainRoughness = Math.sin(x * 0.3) * Math.sin(z * 0.3) * 0.05;
  vibration += terrainRoughness;

  vibration = Math.max(0, Math.min(5, vibration));
  acoustic = Math.max(0, Math.min(90, acoustic));
  temperature = Math.max(10, Math.min(50, temperature));
  humidity = Math.max(0, Math.min(100, humidity));

  const latOffset = (z * METERS_PER_UNIT) / 111111;
  const lngOffset = (x * METERS_PER_UNIT) / (111111 * Math.cos(GPS_ORIGIN.lat * Math.PI / 180));

  const gps = {
    lat: GPS_ORIGIN.lat + latOffset,
    lng: GPS_ORIGIN.lng + lngOffset
  };

  return { vibration, acoustic, temperature, humidity, gps };
}
