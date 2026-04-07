import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AlertService } from '@c8y/ngx-components';

const API = '/thin-edge-io/api/datalayer';

export interface DatalayerConfig {
  enabled: boolean;
  baseUrl: string;
  pollIntervalMs: number;
  username?: string;
  password?: string;
  token?: string;
  acceptInvalidCerts: boolean;
  mappings: DatalayerMapping[];
}

export interface DatalayerMapping {
  id: string;
  path: string;
  topic: string;
  direction: 'dl_to_tedge' | 'tedge_to_dl';
  transform: 'Raw' | 'Measurement' | 'Event' | 'Alarm';
  field_name?: string;
  unit?: string;
  enabled: boolean;
}

export interface BrowseNode {
  name: string;
  path: string;
  type?: string;
  children?: BrowseNode[];
  expanded?: boolean;
  loading?: boolean;
  loaded?: boolean;
  value?: any;
}

@Component({
  selector: 'tedge-datalayer',
  templateUrl: './datalayer.component.html',
  styleUrls: ['./datalayer.component.scss']
})
export class DatalayerComponent implements OnInit, OnDestroy {

  activeTab: 'settings' | 'mappings' | 'browse' = 'settings';

  // --- Connection settings ---
  config: DatalayerConfig = {
    enabled: false,
    baseUrl: 'https://localhost',
    pollIntervalMs: 5000,
    username: '',
    password: '',
    token: '',
    acceptInvalidCerts: true,
    mappings: []
  };
  status: any = null;
  savingConfig = false;
  loadingStatus = false;

  // --- Mappings ---
  mappings: DatalayerMapping[] = [];
  editingMapping: DatalayerMapping | null = null;
  isNewMapping = false;
  newMapping: Partial<DatalayerMapping> = this.emptyMapping();

  readonly directions = [
    { value: 'dl_to_tedge', label: 'Datalayer → thin-edge (read)' },
    { value: 'tedge_to_dl', label: 'thin-edge → Datalayer (write)' }
  ];
  readonly transforms = ['Raw', 'Measurement', 'Event', 'Alarm'];

  // --- Browse ---
  browseRoot: BrowseNode[] = [];
  browseLoading = false;
  selectedBrowsePath = '';
  browseNodeValue: any = null;
  browseNodeLoading = false;

  private refreshInterval: any;

  constructor(private http: HttpClient, private alertService: AlertService) {}

  ngOnInit() {
    this.loadConfig();
    this.loadStatus();
    this.refreshInterval = setInterval(() => this.loadStatus(), 10000);
  }

  ngOnDestroy() {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  // ─── Settings ────────────────────────────────────────────────────────────────

  loadConfig() {
    this.http.get<DatalayerConfig>(`${API}/config`).subscribe({
      next: (cfg) => {
        this.config = { ...cfg, password: '', token: '' }; // never show masked values
        this.mappings = cfg.mappings ?? [];
      },
      error: () => this.alertService.danger('Datalayer-Konfiguration konnte nicht geladen werden.')
    });
  }

  loadStatus() {
    this.loadingStatus = true;
    this.http.get<any>(`${API}/status`).subscribe({
      next: (s) => { this.status = s; this.loadingStatus = false; },
      error: () => { this.loadingStatus = false; }
    });
  }

  saveConfig() {
    this.savingConfig = true;
    const body: any = {
      enabled: this.config.enabled,
      base_url: this.config.baseUrl,
      poll_interval_ms: this.config.pollIntervalMs,
      accept_invalid_certs: this.config.acceptInvalidCerts,
      username: this.config.username ?? '',
      password: this.config.password ?? '',
      token: this.config.token ?? ''
    };
    this.http.post(`${API}/config`, body).subscribe({
      next: () => {
        this.alertService.success('Datalayer-Einstellungen gespeichert.');
        this.savingConfig = false;
        this.loadConfig();
        this.loadStatus();
      },
      error: (e) => {
        this.alertService.danger(`Fehler beim Speichern: ${e.message}`);
        this.savingConfig = false;
      }
    });
  }

  // ─── Mappings ────────────────────────────────────────────────────────────────

  emptyMapping(): Partial<DatalayerMapping> {
    return {
      id: '',
      path: '',
      topic: '',
      direction: 'dl_to_tedge',
      transform: 'Measurement',
      field_name: '',
      unit: '',
      enabled: true
    };
  }

  startAddMapping() {
    this.newMapping = this.emptyMapping();
    this.isNewMapping = true;
    this.editingMapping = null;
  }

  cancelAdd() {
    this.isNewMapping = false;
    this.newMapping = this.emptyMapping();
  }

  saveNewMapping() {
    if (!this.newMapping.path || !this.newMapping.topic) {
      this.alertService.warning('Datalayer-Pfad und MQTT-Topic sind Pflichtfelder.');
      return;
    }
    this.http.post<any>(`${API}/mappings/add`, this.newMapping).subscribe({
      next: (res) => {
        if (res.success) {
          this.mappings.push(res.mapping);
          this.isNewMapping = false;
          this.newMapping = this.emptyMapping();
          this.alertService.success('Mapping hinzugefügt.');
        }
      },
      error: (e) => this.alertService.danger(`Fehler: ${e.message}`)
    });
  }

  toggleMapping(m: DatalayerMapping) {
    m.enabled = !m.enabled;
    this.saveMappings();
  }

  deleteMapping(m: DatalayerMapping) {
    this.http.delete(`${API}/mappings/${m.id}`).subscribe({
      next: () => {
        this.mappings = this.mappings.filter(x => x.id !== m.id);
        this.alertService.success('Mapping gelöscht.');
      },
      error: (e) => this.alertService.danger(`Fehler: ${e.message}`)
    });
  }

  saveMappings() {
    this.http.post(`${API}/mappings`, { mappings: this.mappings }).subscribe({
      next: () => this.alertService.success('Mappings gespeichert.'),
      error: (e) => this.alertService.danger(`Fehler: ${e.message}`)
    });
  }

  useBrowsePathForNewMapping(node: BrowseNode) {
    this.newMapping.path = node.path;
    this.activeTab = 'mappings';
    this.isNewMapping = true;
  }

  // ─── Browse ──────────────────────────────────────────────────────────────────

  loadBrowseRoot() {
    this.browseLoading = true;
    this.browseRoot = [];
    this.http.get<any>(`${API}/browse?path=`).subscribe({
      next: (data) => {
        this.browseRoot = this.buildBrowseNodes(data, '');
        this.browseLoading = false;
      },
      error: (e) => {
        this.alertService.danger(`Browse-Fehler: ${e.message}`);
        this.browseLoading = false;
      }
    });
  }

  toggleBrowseNode(node: BrowseNode) {
    if (node.expanded) {
      node.expanded = false;
      return;
    }
    node.expanded = true;
    if (node.loaded) return;
    node.loading = true;
    this.http.get<any>(`${API}/browse?path=${encodeURIComponent(node.path)}`).subscribe({
      next: (data) => {
        node.children = this.buildBrowseNodes(data, node.path);
        node.loaded = true;
        node.loading = false;
      },
      error: () => { node.loading = false; }
    });
  }

  selectBrowseNode(node: BrowseNode) {
    this.selectedBrowsePath = node.path;
    this.browseNodeValue = null;
    this.browseNodeLoading = true;
    this.http.get<any>(`${API}/node?path=${encodeURIComponent(node.path)}`).subscribe({
      next: (v) => { this.browseNodeValue = v; this.browseNodeLoading = false; },
      error: () => { this.browseNodeLoading = false; }
    });
  }

  private buildBrowseNodes(data: any, parentPath: string): BrowseNode[] {
    const items: string[] = data?.value ?? data?.result ?? [];
    if (!Array.isArray(items)) return [];
    return items.map(name => {
      const path = parentPath ? `${parentPath}/${name}` : name;
      return { name, path, children: [], expanded: false, loaded: false, loading: false };
    });
  }
}
