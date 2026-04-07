import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AlertService } from '@c8y/ngx-components';
import { Observable } from 'rxjs';
import { BackendService } from '../../share/backend.service';
import { TedgeStatus } from '../../share/property.model';
import { BsModalService } from 'ngx-bootstrap/modal';
import { UploadCertificateComponent } from './upload-certificate-modal.component';
import { GeneralConfirmModalComponent } from './confirm-modal.component';

const API = '/thin-edge-io/api';

@Component({
  selector: 'tedge-setup',
  templateUrl: './setup.component.html',
  styleUrls: ['./setup.component.scss']
})
export class SetupComponent implements OnInit {
  tedgeConfiguration: any = {};
  tedgeStatus$: Observable<TedgeStatus>;
  readonly: boolean = false;
  TedgeStatus = TedgeStatus;

  activeTab: 'c8y' | 'aws' | 'azure' | 'port' = 'c8y';

  // C8y
  c8yUrl = '';
  deviceId = '';
  savingC8y = false;

  // AWS
  awsUrl = '';
  awsEnabled = false;
  savingAws = false;

  // Azure
  azureUrl = '';
  azureEnabled = false;
  savingAzure = false;

  // MQTT Port
  mqttPort: 8883 | 9883 = 8883;
  savingPort = false;

  constructor(
    public bsModalService: BsModalService,
    private edgeService: BackendService,
    private http: HttpClient,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    this.edgeService.getTedgeConfiguration().subscribe((c) => {
      this.tedgeConfiguration = c;
      this.c8yUrl = c?.c8y?.url ?? '';
      this.deviceId = c?.device?.id ?? '';
      this.awsUrl = c?.aws?.url ?? '';
      this.awsEnabled = c?.aws?.enabled ?? false;
      this.azureUrl = c?.az?.url ?? '';
      this.azureEnabled = c?.az?.enabled ?? false;
      this.readonly = !!(this.c8yUrl && this.deviceId);
    });
    this.tedgeStatus$ = this.edgeService.getTedgeStatus();
  }

  resetLog() {
    this.edgeService.resetLog();
  }

  // ─── C8y ─────────────────────────────────────────────────────────────────────

  async configureEdge() {
    this.edgeService.configureTedge(this.c8yUrl, this.deviceId);
  }

  saveC8y() {
    this.savingC8y = true;
    const url = this.c8yUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
    this.http.post(`${API}/config/c8y`, { 'c8y-url': url, enabled: true }).subscribe({
      next: () => {
        this.alertService.success('Cumulocity-Konfiguration gespeichert.');
        this.savingC8y = false;
      },
      error: (e) => { this.alertService.danger(`Fehler: ${e.message}`); this.savingC8y = false; }
    });
    if (this.deviceId) {
      this.http.post(`${API}/config/device`, { deviceId: this.deviceId }).subscribe();
    }
  }

  // ─── AWS ─────────────────────────────────────────────────────────────────────

  saveAws() {
    this.savingAws = true;
    const url = this.awsUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
    this.http.post(`${API}/config/aws`, { 'aws-url': url, enabled: this.awsEnabled }).subscribe({
      next: () => {
        this.alertService.success('AWS-Konfiguration gespeichert.');
        this.savingAws = false;
      },
      error: (e) => { this.alertService.danger(`Fehler: ${e.message}`); this.savingAws = false; }
    });
  }

  connectAws() {
    this.http.post(`${API}/connect/aws`, {}).subscribe({
      next: () => this.alertService.success('AWS-Verbindung wird hergestellt …'),
      error: (e) => this.alertService.danger(`Verbindungsfehler: ${e.message}`)
    });
  }

  disconnectAws() {
    this.http.post(`${API}/disconnect/aws`, {}).subscribe({
      next: () => this.alertService.success('AWS getrennt.'),
      error: (e) => this.alertService.danger(`Fehler: ${e.message}`)
    });
  }

  // ─── Azure ───────────────────────────────────────────────────────────────────

  saveAzure() {
    this.savingAzure = true;
    const url = this.azureUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
    this.http.post(`${API}/config/az`, { 'azure-url': url, enabled: this.azureEnabled }).subscribe({
      next: () => {
        this.alertService.success('Azure-Konfiguration gespeichert.');
        this.savingAzure = false;
      },
      error: (e) => { this.alertService.danger(`Fehler: ${e.message}`); this.savingAzure = false; }
    });
  }

  connectAzure() {
    this.http.post(`${API}/connect/az`, {}).subscribe({
      next: () => this.alertService.success('Azure-Verbindung wird hergestellt …'),
      error: (e) => this.alertService.danger(`Verbindungsfehler: ${e.message}`)
    });
  }

  disconnectAzure() {
    this.http.post(`${API}/disconnect/az`, {}).subscribe({
      next: () => this.alertService.success('Azure getrennt.'),
      error: (e) => this.alertService.danger(`Fehler: ${e.message}`)
    });
  }

  // ─── MQTT Port ───────────────────────────────────────────────────────────────

  saveMqttPort() {
    this.savingPort = true;
    this.http.post(`${API}/set-mqtt-port`, { port: this.mqttPort }).subscribe({
      next: () => {
        this.alertService.success(`MQTT-Port auf ${this.mqttPort} gesetzt. Dienste werden neu gestartet …`);
        this.savingPort = false;
      },
      error: (e) => { this.alertService.danger(`Fehler: ${e.message}`); this.savingPort = false; }
    });
  }

  // ─── Certificate ─────────────────────────────────────────────────────────────

  async resetEdge() {
    const linkDeviceInDeviceManagement =
      await this.edgeService.getLinkToDeviceInDeviceManagement();
    const initialState = {
      message: `Resetting ThinEdge only deletes the certificate and the registration data locally. To delete resources from the Cloud Tenant open the <a href="${linkDeviceInDeviceManagement}" target="_blank"><strong>Device Management</strong></a> of your cloud tenant and delete the device!`
    };
    const modalRef = this.bsModalService.show(GeneralConfirmModalComponent, { initialState });
    modalRef.content.closeSubject.subscribe((result) => {
      if (result) this.edgeService.resetTedge();
    });
  }

  async downloadCertificate() {
    try {
      const data = await this.edgeService.downloadCertificate('blob');
      const url = window.URL.createObjectURL(data);
      window.open(url);
    } catch (error) {
      this.alertService.danger('Download failed!');
    }
  }

  async uploadCertificate() {
    const modalRef = this.bsModalService.show(UploadCertificateComponent, { initialState: {} });
    modalRef.content.closeSubject.subscribe(async (credentials) => {
      if (credentials) {
        try {
          await this.edgeService.initFetchClient(credentials);
          const res = await this.edgeService.uploadCertificateToTenant();
          if (res.status < 300) {
            this.alertService.success('Uploaded certificate to cloud tenant.');
          } else {
            this.alertService.danger('Failed to upload certificate!');
          }
        } catch (err) {
          this.alertService.danger(`Failed to upload certificate: ${err.message}`);
        }
      }
    });
  }
}
