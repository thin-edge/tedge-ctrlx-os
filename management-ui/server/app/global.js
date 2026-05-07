// const logger = require('console-stamp')(console, {
//     format: ":date(isoDateTime) :label(7)",
// //    format: ":date(yyyy-mm-dd HH:MM:ss.lp) :label(7)",
//     level: 'info'
//   });

const { createLogger, format, transports } = require('winston');
const { combine, timestamp, errors, label, prettyPrint, printf } = format;
const customFormat = printf(({ level, service, message, timestamp, stack }) => {
  return `${timestamp} ${level}: ${service}: ${message} ${level == 'error' ? stack : ''}`;
});

const BACKEND_CONFIGURATION_FILE = '/etc/tedge-mgmt-server/backendConfig.json';
const MEASUREMENT_TYPE_FILE = '/etc/tedge-mgmt-server/measurementTypes.json';
const INTERVAL_AUTO_SAVE_SERIES = 30000;

// ctrlX snap name (used when mode=ctrlx)
const CTRLX_SNAP_NAME = process.env.CTRLX_SNAP_NAME || 'ctrlx-cumulocity-thin-edge-io';

// Snap data dir: /var/snap/<snap>/current  (snapd sets SNAP_DATA at runtime)
const SNAP_DATA_DIR = process.env.SNAP_DATA || `/var/snap/${CTRLX_SNAP_NAME}/current`;

// tedge-web-config.json: stored in snap data dir at runtime, fallback for dev
const TEDGE_WEB_CONFIG_FILE = process.env.SNAP_DATA
  ? `${SNAP_DATA_DIR}/tedge-web-config.json`
  : '/etc/tedge-mgmt-server/tedge-web-config.json';

/**
 * Returns the tedge config directory for the given mode.
 * mode=ctrlx  →  $SNAP_DATA/tedge  (snap isolation)
 * mode=normal →  /etc/tedge
 */
function getTedgeConfigDir(mode) {
  if (mode === 'ctrlx') {
    return `${SNAP_DATA_DIR}/tedge`;
  }
  return '/etc/tedge';
}

/**
 * Returns the device certificate path for the given mode.
 */
function getCertificatePath(mode) {
  return `${getTedgeConfigDir(mode)}/device-certs/tedge-certificate.pem`;
}

/**
 * Returns the tedge binary to use based on the request mode header.
 * mode=ctrlx  →  sudo snap run <snap>.tedge
 * mode=normal →  sudo tedge  (default)
 */
function getTedgeBin(mode) {
  if (mode === 'ctrlx') {
    return { cmd: 'sudo', prefix: ['snap', 'run', `${CTRLX_SNAP_NAME}.tedge`] };
  }
  return { cmd: 'sudo', prefix: ['tedge'] };
}

function getTedgectlBin(mode) {
  if (mode === 'ctrlx') {
    return { cmd: 'sudo', prefix: ['snap', 'run', `${CTRLX_SNAP_NAME}.tedgectl`] };
  }
  return { cmd: 'sudo', prefix: ['tedgectl'] };
}

const logger = createLogger({
  level: 'info',
  //   defaultMeta: {
  //     service: 'Server'
  //   },
  format: combine(timestamp(), customFormat, errors({ stack: true })),
  transports: [new transports.Console()]
});
module.exports = {
  SERVER_PORT: process.env.SERVER_PORT || 9080,
  MQTT_HOST: process.env.MQTT_HOST || 'localhost',
  MQTT_PORT: process.env.MQTT_PORT || 1883,
  MONGO_HOST: process.env.MONGO_HOST,
  MONGO_PORT: process.env.MONGO_PORT,
  STORAGE_ENABLED: process.env.STORAGE_ENABLED == 'true' || false,
  ANALYTICS_FLOW_ENABLED: process.env.ANALYTICS_FLOW_ENABLED == 'true' || false,
  DATE_FORMAT: 'isoDateTime',
  logger,
  BACKEND_CONFIGURATION_FILE,
  MEASUREMENT_TYPE_FILE,
  TEDGE_WEB_CONFIG_FILE,
  INTERVAL_AUTO_SAVE_SERIES,
  CTRLX_SNAP_NAME,
  SNAP_DATA_DIR,
  getTedgeConfigDir,
  getCertificatePath,
  getTedgeBin,
  getTedgectlBin
};
