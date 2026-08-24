import { DEFAULT_ANOMALY_ZONES } from '../../shared/constants.js';

let zones = JSON.parse(JSON.stringify(DEFAULT_ANOMALY_ZONES || []));

export function getZones() {
  return zones;
}

export function setZones(newZones) {
  zones = newZones;
}

export function resetZones() {
  zones = JSON.parse(JSON.stringify(DEFAULT_ANOMALY_ZONES || []));
}
