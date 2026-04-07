import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  BasicAuth,
  Client,
  FetchClient,
  IFetchOptions,
  IFetchResponse
} from '@c8y/client';
import { AlertService } from '@c8y/ngx-components';
import { BehaviorSubject, Observable, Subject, interval, of } from 'rxjs';
import { catchError, filter, map, scan, shareReplay, switchMap, tap } from 'rxjs/operators';
import {
  BackendJob,
  BackendJobProgress,
  BackendConfiguration,
  BackendStatusEvent,
  StatusType,
  MeasurementType,
  RawMeasurement,
  TedgeConfiguration,
  TedgeStatus,
  BackendTaskOutput
} from './property.model';
import {
  BACKEND_CONFIGURATION_ENDPOINT,
  BACKEND_DOWNLOAD_CERTIFICATE_ENDPOINT,
  BACKEND_MEASUREMENT_TYPES_ENDPOINT,
  BACKEND_MEASUREMENT_ENDPOINT,
  BACKEND_STORAGE_STATISTIC_ENDPOINT,
  BACKEND_STORAGE_INDEX_ENDPOINT,
  C8Y_CLOUD_ENDPOINT,
  INVENTORY_BRIDGED_ENDPOINT,
  INVENTORY_ENDPOINT,
  LOGIN_ENDPOINT,
  STATUS_LOG_HISTORY,
  TEDGE_GENERIC_REQUEST_ENDPOINT,
  TEDGE_GENERIC_TYPES_ENDPOINT,
  TedgeConfigType,
  TedgeGenericCmdRequest,
  propertiesToJson,
  BACKEND_DEVICE_STATISTIC_ENDPOINT,
  BACKEND_CLIENT_STATUS
} from './utils';

// Rust backend base path (served under /thin-edge-io/)
const RUST_API = '/thin-edge-io/api';

@Injectable({
  providedIn: 'root'
})
export class BackendService {
  private fetchClient: FetchClient;
  private jobProgress$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  private refreshConfigurations$: BehaviorSubject<void> = new BehaviorSubject<void>(undefined);
  private tedgeStatusReplay$: Observable<TedgeStatus>;
  private statusLog$: Subject<BackendStatusEvent> = new Subject<BackendStatusEvent>();
  private statusLogs$: Observable<BackendStatusEvent[]>;
  private _backendConfigurationPromise: Promise<BackendConfiguration>;
  private tedgeConfiguration$: BehaviorSubject<TedgeConfiguration> = new BehaviorSubject<TedgeConfiguration>({});
  private _tedgeConfiguration: TedgeConfiguration;
  private obs: Observable<RawMeasurement>;

  constructor(
    private http: HttpClient,
    private alertService: AlertService
  ) {
    this.initJobProgress();
  }

  getJobProgress(): Observable<number> {
    return this.jobProgress$;
  }

  getTedgeStatus(): Observable<TedgeStatus> {
    return this.tedgeStatusReplay$;
  }

  getBackendStatusEvents(): Observable<BackendStatusEvent[]> {
    return this.statusLogs$;
  }

  resetLog(): void {
    this.statusLog$.next({
      jobName: StatusType.RESET_JOB_LOG,
      statusType: StatusType.RESET_JOB_LOG,
      currentTask: 0,
      date: new Date()
    });
    this.jobProgress$.next(0);
  }

  delayResetProgress(): void {
    setTimeout(() => {
      this.jobProgress$.next(0);
    }, 1500);
  }

  private initJobProgress() {
    // Periodically fetch tedge configuration (replaces WebSocket-based approach)
    interval(5000).pipe(
      switchMap(() => this.http.get<any>(`${RUST_API}/config`).pipe(catchError(() => of(null)))),
      filter(v => !!v)
    ).subscribe((config) => {
      this._tedgeConfiguration = config;
      this.tedgeConfiguration$.next(config);
    });

    // Initial fetch
    this.http.get<any>(`${RUST_API}/config`).pipe(catchError(() => of(null))).subscribe((config) => {
      if (config) {
        this._tedgeConfiguration = config;
        this.tedgeConfiguration$.next(config);
      }
    });

    this.statusLogs$ = this.statusLog$.pipe(
      scan((acc, val) => {
        if (val.statusType == StatusType.RESET_JOB_LOG) {
          return [];
        }
        return [val].concat(acc).slice(0, STATUS_LOG_HISTORY - 1);
      }, [] as BackendStatusEvent[]),
      shareReplay(STATUS_LOG_HISTORY)
    );

    // TedgeStatus from periodic polling of /api/status
    this.tedgeStatusReplay$ = this.refreshConfigurations$.pipe(
      tap(() => { this._backendConfigurationPromise = undefined; }),
      switchMap(() => this.getBackendConfiguration()),
      map((conf) => conf.status),
      shareReplay(1)
    );
  }

  // Submit a job via REST post → Rust API (connect/disconnect/restart)
  startBackendJob(cmd: BackendJob) {
    const jobName = cmd.jobName;
    this.statusLog$.next({
      jobName,
      currentTask: 0,
      date: new Date(),
      message: `Starting job ${jobName}`,
      statusType: StatusType.START_JOB
    });
    this.jobProgress$.next(10);

    let request$: Observable<any> = of(null);
    if (jobName === 'configureTedge') {
      const payload = cmd as any;
      request$ = this.http.post(`${RUST_API}/config/c8y`, { 'c8y-url': payload.c8yUrl, enabled: true }).pipe(
        tap(() => {
          this.http.post(`${RUST_API}/connect/c8y`, {}).subscribe();
        })
      );
    } else if (jobName === 'startTedge') {
      request$ = this.http.post(`${RUST_API}/restart`, {});
    } else if (jobName === 'stopTedge') {
      request$ = this.http.post(`${RUST_API}/restart`, {});
    } else if (jobName === 'resetTedge') {
      request$ = this.http.post(`${RUST_API}/device-id/recreate`, {});
    }

    request$.pipe(catchError((err) => {
      this.statusLog$.next({ jobName, currentTask: 0, date: new Date(), message: `Error: ${err.message}`, statusType: StatusType.ERROR });
      this.delayResetProgress();
      return of(null);
    })).subscribe(() => {
      this.jobProgress$.next(100);
      this.statusLog$.next({ jobName, currentTask: 1, date: new Date(), message: `Completed ${jobName}`, statusType: StatusType.END_JOB });
      this.refreshConfigurations$.next();
      this.delayResetProgress();
    });
  }

  // WebSocket stubs — replaced by REST; kept as no-ops for compatibility
  getJobProgressEvents(): Observable<BackendJobProgress> {
    return new Observable<BackendJobProgress>();
  }

  getTaskOutput(): Observable<BackendTaskOutput> {
    return new Observable<BackendTaskOutput>();
  }

  responseTedgeServiceStatus(): Observable<BackendTaskOutput> {
    return new Observable<BackendTaskOutput>();
  }

  responseTedgeConfiguration(): Observable<BackendTaskOutput> {
    return new Observable<BackendTaskOutput>();
  }

  getTedgeCmdOutput(): Observable<any> {
    return new Observable<any>();
  }

  getTedgeLogUploadResponse(): Observable<any> {
    return new Observable<any>();
  }

  getTedgeConfigSnapshotResponse(): Observable<any> {
    return new Observable<any>();
  }

  getTedgeConfigUpdateResponse(): Observable<any> {
    return new Observable<any>();
  }

  // Measurements — not available without MongoDB, return empty
  getLastMeasurements(_displaySpan: number): Promise<RawMeasurement[]> {
    return Promise.resolve([]);
  }

  getMeasurements(_dateFrom: Date, _dateTo: Date): Promise<RawMeasurement[]> {
    return Promise.resolve([]);
  }

  getTedgeGenericConfigType(configType: TedgeConfigType): Promise<string[]> {
    return this.http
      .get<string[]>(`${RUST_API}/tedge-type/${configType}`)
      .toPromise()
      .then((res) => res ?? [])
      .catch(() => []);
  }

  sendTedgeGenericCmdRequest(genericCmdRequest: TedgeGenericCmdRequest): Promise<any> {
    // Map log_upload → our logs API
    if (genericCmdRequest.cmdType === 'log_upload') {
      const params = new HttpParams({ fromObject: { lines: '200' } });
      return this.http.get(`${RUST_API}/logs`, { params, responseType: 'text' }).toPromise();
    }
    return Promise.resolve(null);
  }

  getTedgeGenericCmdResponse(tedgeUrl: string): Promise<any> {
    const params = new HttpParams({ fromObject: { tedgeUrl } });
    return this.http
      .get(`${RUST_API}/logs`, { params, responseType: 'text' })
      .toPromise()
      .catch(() => '');
  }

  getRealtimeMeasurements(): Observable<RawMeasurement> {
    // No WebSocket available — return empty observable
    return new Observable<RawMeasurement>();
  }

  stopMeasurements(): void {
    // No-op without WebSocket
  }

  getTedgeConfiguration(): Observable<TedgeConfiguration> {
    return this.tedgeConfiguration$.pipe(shareReplay(1));
  }

  getMeasurementTypes(): Promise<any[]> {
    return Promise.resolve([]);
  }

  getClientStatus(): Observable<any> {
    return this.http.get<any>(`${RUST_API}/status`).pipe(
      map((status) => ({
        isMQTTConnected: status?.tedge_status === 'connected',
        isStorageConnected: false,
        isStreaming: false
      })),
      catchError(() => of({ isMQTTConnected: false, isStorageConnected: false, isStreaming: false }))
    );
  }

  async getBackendConfiguration(): Promise<BackendConfiguration> {
    let result = this._backendConfigurationPromise;
    if (!result) {
      result = this.http
        .get<any>(`${RUST_API}/status`)
        .toPromise()
        .then((status) => {
          // Map Rust status to BackendConfiguration shape
          const isConnected = status?.tedge_status === 'connected';
          return {
            status: isConnected ? TedgeStatus.REGISTERED : TedgeStatus.INITIALIZED,
            storageEnabled: false,
            analyticsFlowEnabled: false
          } as BackendConfiguration;
        })
        .catch(() => {
          console.log('Cannot reach backend!');
          return {
            status: TedgeStatus.UNKNOWN as TedgeStatus,
            storageEnabled: false,
            analyticsFlowEnabled: false
          } as BackendConfiguration;
        });
      this._backendConfigurationPromise = result;
    }
    return result;
  }

  setBackendConfiguration(config: BackendConfiguration): Promise<BackendConfiguration> {
    return this.http
      .post<any>(`${RUST_API}/snapconfig`, config)
      .toPromise()
      .then(() => config);
  }

  getDetailsCloudDeviceFromTedge(externalId: string): Promise<any> {
    return this.http
      .get<any>(`${INVENTORY_BRIDGED_ENDPOINT}/${externalId}`)
      .toPromise()
      .catch(() => {
        this.alertService.warning('Cannot reach backend!');
        return null;
      });
  }

  async getDetailsCloudDevice(externalId: string): Promise<any> {
    const options: IFetchOptions = {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    };
    const externalIdType = 'c8y_Serial';
    const url_id = `/identity/externalIds/${externalIdType}/${externalId}?proxy=${this._tedgeConfiguration?.c8y?.url}`;

    return this.fetchClient
      .fetch(url_id, options)
      .then((r) => r.json())
      .then((json) => {
        const deviceId = json.managedObject.id;
        const proxiedUrl = `${INVENTORY_ENDPOINT}/${deviceId}?proxy=${this._tedgeConfiguration?.c8y?.url}`;
        return this.fetchClient.fetch(proxiedUrl, options);
      })
      .then((r) => r.json())
      .catch((err) => { console.log(`Could not login: ${err.message}`); return err; });
  }

  initFetchClient(credentials: any) {
    const auth = new BasicAuth({ user: credentials.username, password: credentials.password });
    const client = new Client(auth, C8Y_CLOUD_ENDPOINT);
    this.fetchClient = client.core;
  }

  async login(): Promise<IFetchResponse> {
    const options: IFetchOptions = {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    };
    const proxyUrl = await this.addProxy2Url(LOGIN_ENDPOINT);
    return this.fetchClient.fetch(proxyUrl, options).catch((err) => {
      console.log(`Could not login: ${err.message}`);
      return err;
    });
  }

  async addProxy2Url(url: string): Promise<string> {
    return `${url}?proxy=${this._tedgeConfiguration?.c8y?.url}`;
  }

  async uploadCertificateToTenant(): Promise<any> {
    const res = await this.login();
    const body = await res.json();
    const currentTenant = body.name;
    const certificateUrl = await this.addProxy2Url(`/tenant/tenants/${currentTenant}/trusted-certificates`);
    const cert = await this.downloadCertificate('text');
    const options: IFetchOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        certInPemFormat: cert,
        autoRegistrationEnabled: true,
        status: 'ENABLED',
        name: this._tedgeConfiguration?.device?.id
      })
    };
    const uploadPromise = this.fetchClient.fetch(certificateUrl, options).catch((err) => {
      console.log(`Could not upload certificate: ${err.message}`);
      return err;
    });
    const { ok } = await uploadPromise;
    if (ok) { this.informTedgeUploadCertificate(); }
    return uploadPromise;
  }

  async downloadCertificate(t: string): Promise<any> {
    // Fetch certificate PEM from Rust API
    return this.http
      .get(`${RUST_API}/device-id/cert-info`, { responseType: 'text' })
      .toPromise()
      .then((res) => res ?? '')
      .catch(() => '');
  }

  getDeviceStatistic(): Promise<any> {
    return Promise.resolve(null);
  }

  getStorageStatistic(): Promise<any> {
    return Promise.resolve(null);
  }

  getStorageIndexes(): Promise<any> {
    return Promise.resolve([]);
  }

  updateStorageTTL(_ttl: number): Promise<number | void> {
    return Promise.resolve();
  }

  async startTedge() {
    this.startBackendJob({ jobName: 'startTedge', promptText: 'Starting Tedge ...' });
  }

  async stopTedge() {
    this.startBackendJob({ jobName: 'stopTedge', promptText: 'Stopping Tedge ...' });
  }

  async resetTedge() {
    this.startBackendJob({ jobName: 'resetTedge', promptText: 'Resetting Tedge ...' });
  }

  async requestTedgeServiceStatus() {
    // Handled via polling in initJobProgress
  }

  async requestTedgeConfiguration() {
    // Triggered via polling in initJobProgress
  }

  async informTedgeUploadCertificate() {
    return this.http.post(`${RUST_API}/cert/upload/c8y`, {}).toPromise().catch(() => null);
  }

  async serviceCommand(service: string, command: string) {
    return this.http.post(`${RUST_API}/restart-service`, { service, command }).toPromise().catch(() => null);
  }

  async configureTedge(c8yUrl: string, deviceId: string) {
    const url = c8yUrl.replace('https://', '').replace(/\/$/, '');
    this.startBackendJob({ jobName: 'configureTedge', promptText: 'Configure Tedge ...', deviceId, c8yUrl: url } as any);
  }

  async getLinkToDeviceInDeviceManagement() {
    let link = 'NOT_COMPLETE';
    if (this._tedgeConfiguration?.device?.id) {
      const managedObject = await this.getDetailsCloudDeviceFromTedge(this._tedgeConfiguration.device.id);
      if (managedObject?.id) {
        link = `https://${this._tedgeConfiguration?.c8y?.http}/apps/devicemanagement/index.html#/device/${managedObject.id}`;
      }
    }
    return link;
  }
}
