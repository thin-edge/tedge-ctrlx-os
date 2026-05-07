// disabled since it spawns a second process 
// TODO investiaget why this happens #!/usr/bin/env node
// overwrite logger output to add timestamp
const {
  logger,
  SERVER_PORT,
  getCertificatePath
} = require('./global');
// use Express
const express = require('express');
const http = require('http');
const { makeGetRequest } = require('./utils');

// http-proxy
const { createProxyMiddleware } = require('http-proxy-middleware');
const socketIO = require('socket.io');

// create new instance of the express server
const app = express();
const { TedgeBackend } = require('./tedgeBackend');
const DEMO_TENANT = 'https://demo.cumulocity.com';

const tedgeBackend = new TedgeBackend();
// Call start
(async () => {
  await tedgeBackend.initClients();
})();
const childLogger = logger.child({ service: 'Server' });

function customRouter(req) {
  let url = DEMO_TENANT;
  if (req.query) {
    url = `https://${req.query.proxy}`;
    childLogger.info(`Setting target url to: , ${url}, ${req.path}`);
  }
  return url;
}

const proxyToTargetUrl = createProxyMiddleware({
  target: 'https://demo.cumulocity.com',
  changeOrigin: true,
  secure: true,
  pathRewrite: { '^/c8yCloud': '' },
  router: customRouter,
  logLevel: 'debug'
});

// set up proxy
app.use('/c8yCloud', proxyToTargetUrl);

// define the JSON parser as a default way
// to consume and produce data through the
// exposed APIs
app.use(express.json());

// Allow cross-origin requests (frontend runs on different port during dev)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Tedge-Mode');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// create link to Angular build directory
// the `ng build` command will save the result
// under the `dist` folder.
// test this
var distDir = __dirname + '/../../ui/dist/tedge-mgmt-ui';
app.use(express.static(distDir));

// var distDir = __dirname + '/../../ui/dist/apps/edge';
// app.use(express.static(distDir));

const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});
// The server should start listening
server.listen(SERVER_PORT, function () {
  var port = server.address().port;
  childLogger.info(`II: Server started on port: ${port}`);
});

/*
 * "/api/inventory/managedObjects"
 *   GET: managedObjects from cloud, this call is bridged through the tedge agent
 */
app.get('/api/bridgedInventory/:externalId', function (req, res) {
  const baseUrl = 'http://127.0.0.1:8001/c8y';
  let externalId = req.params.externalId;
  childLogger.info(`Looking up managed object id using the external id: externalId=${externalId}, baseUrl=${baseUrl}`);

  makeGetRequest(
    `${baseUrl}/identity/externalIds/c8y_Serial/${externalId}`
  )
    .then((result) => {
      childLogger.info(`First request data: ${result}`);
      let externalIdObject = JSON.parse(result);
      childLogger.info(`First request data parsed: ${externalIdObject}`);
      let moID = externalIdObject.managedObject.id;
      childLogger.info(`Getting managed object: id=${moID}`);

      const reqOptions = {
        protocol: 'http:',
        hostname: '127.0.0.1',
        port: 8001,
        path: `/c8y/inventory/managedObjects/${moID}`,
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      };
      return makeGetRequest(reqOptions);
    })
    .then((result) => {
      childLogger.info(`Managed object response: ${result}`, {
        data: result,
      });
      res.send(result);
    })
    .catch((error) => {
      childLogger.error(`Error getExternalId: ${error.message}`);
      res.status(500).json({ message: error.message });
    });
});

/*
 * "api/backend/configuration
 *   POST: Change analytics widget configuration
 */
app.post('/api/backend/configuration', function (req, res) {
  tedgeBackend.setBackendConfiguration(req, res);
});

/*
 * "api/backend/configuration"
 *   GET: Get analytics widget configuration
 */
app.get('/api/backend/configuration', function (req, res) {
  tedgeBackend.getBackendConfiguration(req, res);
});

/*
 * "/api/backend/certificate"
 *   GET: certificate
 */
app.get('/api/backend/certificate', function (req, res) {
  const mode = req.query.mode || 'normal';
  let deviceId = req.query.deviceId;
  childLogger.info(`Download certificate for : ${deviceId}, mode: ${mode}`);
  res.status(200).sendFile(getCertificatePath(mode));
});

/*
 * "/api/web-config"
 *   GET:  read tedge-web-config.json
 *   POST: write tedge-web-config.json immediately (called on "Configure Edge" click)
 */
app.get('/api/web-config', function (req, res) {
  tedgeBackend.getWebConfig(req, res);
});

app.post('/api/web-config', function (req, res) {
  tedgeBackend.saveWebConfigHttp(req, res);
});

/*
 * "/api/device/identity"
 *   GET: returns the device name (ctrlx-<serial>) using the same
 *        priority chain as the bridge-service-rust get_device_serial()
 */
app.get('/api/device/identity', function (req, res) {
  const fs = require('fs');
  const paths = [
    '/sys/class/dmi/id/product_serial',
    '/sys/class/dmi/id/board_serial',
    '/sys/class/dmi/id/chassis_serial',
    '/sys/class/dmi/id/product_uuid'
  ];
  let deviceName = '';
  for (const p of paths) {
    try {
      const val = fs.readFileSync(p, 'utf8').trim().replace(/\0/g, '');
      if (val && val !== '0' && val !== 'None') {
        deviceName = `ctrlx-${val}`;
        break;
      }
    } catch (_) {}
  }
  if (!deviceName) {
    try {
      const val = fs.readFileSync('/etc/machine-id', 'utf8').trim();
      if (val) deviceName = `ctrlx-${val}`;
    } catch (_) {}
  }
  childLogger.info(`Device identity: ${deviceName}`);
  res.status(200).json({ deviceName });
});

/*
 * "/api/backend/status"
 *   GET: status
 */
app.get('/api/backend/clientStatus', function (req, res) {
    childLogger.info(`Get client status`);
    tedgeBackend.getClientStatus(req, res);

  });

/*
 * "/api/backend/getLastMeasurements"
 *   GET: getLastMeasurements
 */
app.get('/api/backend/analytics/measurement', function (req, res) {
  tedgeBackend.getMeasurements(req, res);
});

/*
 *  "/api/backend/analytics/types"
 *   GET: series
 */
app.get('/api/backend/analytics/types', function (req, res) {
  tedgeBackend.getMeasurementTypes(req, res);
});

/*
 * "/api/storage/statistic"
 *   GET: statistic
 */
app.get('/api/backend/storage/statistic', function (req, res) {
  tedgeBackend.getStorageStatistic(req, res);
});

/*
 * "/api/storage/ttl"
 *   GET: ttl
 */
app.get('/api/backend/storage/index', function (req, res) {
  tedgeBackend.getStorageIndex(req, res);
});

/*
 * "/api/storage/ttl"
 *   POST: ttl
 */
app.post('/api/backend/storage/ttl', function (req, res) {
  tedgeBackend.updateStorageTTL(req, res);
});

/*
 *  "/api/backend/device/statistic"
 *   GET: series
 */
app.get('/api/backend/device/statistic', function (req, res) {
    tedgeBackend.getDeviceStatistic(req, res);
  });

/*
 * "api/tedge/cmd"
 *   POST: Create request log_upload, config_snapshot, config_update ...
 */
app.post('/api/tedge/cmd', function (req, res) {
  tedgeBackend.sendTedgeGenericCmdRequest(req, res);
});

/*
 * "api/tedge/cmd"
 *   GET: Get response for log_upload, config_snapshot, ...
 */
app.get('/api/tedge/cmd', function (req, res) {
  tedgeBackend.getTedgeGenericCmdResponse(req, res);
});

/*
 * "/api/tedge/type/:type"
 *   GET: Get response for log_upload, config_snapshot, ...
 */
app.get('/api/tedge/type/:type', function (req, res) {
  tedgeBackend.getTedgeGenericConfigType(req, res);
});

/*
 *   Empty dummy responses to avoid errors in the browser logger
 */
app.get('/apps/*', function (req, res) {
  childLogger.info('Ignore request on /apps !');
  res.status(200).json({ result: 'OK' });
});
app.get('/tenant/loginOptions', function (req, res) {
  childLogger.info('Ignore request on /tenant/loginOptions!');
  res.status(200).json({ result: 'OK' });
});

/*
 * open socket to receive command from web-ui and send back streamed measurements
 */
io.on('connection', function (socket) {
  childLogger.info(`Open new socket: ${socket.id}`);
  tedgeBackend.socketOpened(socket);
  socket.on('channel-job-submit', function (job) {

    childLogger.info(
      `New cmd submitted: ${JSON.stringify(job)} ${job.jobName}`
    );

    if (job.jobName == 'startTedge') {
      tedgeBackend.startTedge(job);
    } else if (job.jobName == 'stopTedge') {
      tedgeBackend.stopTedge(job);
    } else if (job.jobName == 'configureTedge') {
      tedgeBackend.configureTedge(job);
    } else if (job.jobName == 'resetTedge') {
      tedgeBackend.resetTedge(job);
    } else if (job.jobName == 'uploadCertificate') {
      tedgeBackend.uploadCertificate(job);
    } else if (job.jobName == 'serviceStatus') {
      tedgeBackend.requestTedgeServiceStatus(job);
    } else if (job.jobName == 'tedgeConfiguration') {
      tedgeBackend.requestTedgeConfiguration(job);
    } else if (job.jobName == 'custom') {
      tedgeBackend.customCommand(job);
    } else {
      socket.emit('channel-job-progress', {
        status: 'ignore',
        progress: 0,
        total: 0
      });
    }

  });
});

io.on('close', function (socket) {
  childLogger.info(`Closing connection from web ui: ${socket.id}`);
});
