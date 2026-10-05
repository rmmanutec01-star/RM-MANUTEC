import { ServiceRequest, UserProfile, AdminClientInteractionThread, SelfieVaultRecord } from '../types';

export type RealtimeConnectionStatus = 'connected' | 'connecting' | 'disconnected';

export interface RealtimeMutationEvent {
  action: 'SAVE_REQUEST' | 'UPDATE_STATUS' | 'DELETE_REQUEST' | 'SAVE_USER' | 'DELETE_USER' | 'SAVE_THREAD' | 'SAVE_SELFIE' | 'SYNC_SEED' | string;
  payload: any;
  senderId?: string;
  timestamp?: number;
  version?: string;
}

export interface RealtimeInitStatePayload {
  requests: ServiceRequest[];
  users: UserProfile[];
  interactionThreads: AdminClientInteractionThread[];
  selfiesVault: SelfieVaultRecord[];
  connectedClients: number;
  version: string;
  timestamp: number;
}

export interface RealtimeSyncCallbacks {
  onInitState?: (data: RealtimeInitStatePayload) => void;
  onMutation?: (event: RealtimeMutationEvent) => void;
  onDeviceCountChange?: (count: number) => void;
  onForceRefresh?: (reason: string) => void;
  onStatusChange?: (status: RealtimeConnectionStatus) => void;
}

function getOrCreateDeviceId(): string {
  try {
    const stored = localStorage.getItem('rm_manutec_device_id_v1');
    if (stored) return stored;
    const generated = `dev-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('rm_manutec_device_id_v1', generated);
    return generated;
  } catch {
    return `dev-${Date.now()}`;
  }
}

class RealtimeSyncManager {
  private socket: WebSocket | null = null;
  private deviceId: string = getOrCreateDeviceId();
  private callbacks: RealtimeSyncCallbacks = {};
  private status: RealtimeConnectionStatus = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimer: any = null;
  private pingInterval: any = null;
  private isDestroyed = false;
  private connectedDeviceCount = 1;
  private crossTabChannel: BroadcastChannel | null = null;

  constructor() {
    this.initCrossTabChannel();
  }

  private initCrossTabChannel() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.crossTabChannel = new BroadcastChannel('rm_manutec_multi_device_sync_v1');
        this.crossTabChannel.onmessage = (event) => {
          if (!event.data) return;
          const { type, data } = event.data;
          if (type === 'CROSS_TAB_MUTATION') {
            if (data.senderId !== this.deviceId) {
              this.callbacks.onMutation?.(data);
            }
          } else if (type === 'CROSS_TAB_FORCE_REFRESH') {
            this.callbacks.onForceRefresh?.(data.reason || 'Sincronização em tempo real');
          }
        };
      } catch (err) {
        console.warn('[Sync] BroadcastChannel não disponível:', err);
      }
    }
  }

  public init(callbacks: RealtimeSyncCallbacks) {
    this.callbacks = callbacks;
    this.connect();

    // Reconnect on network recovery or window focus/visibility change
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('[Sync] Dispositivo voltou a ficar online. Reconectando...');
        this.reconnect();
      });

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.status !== 'connected') {
          console.log('[Sync] Janela reativada. Verificando conexão...');
          this.reconnect();
        }
      });
    }
  }

  private setStatus(newStatus: RealtimeConnectionStatus) {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.callbacks.onStatusChange?.(newStatus);
    }
  }

  private connect() {
    if (this.isDestroyed || typeof window === 'undefined') return;

    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.setStatus('connecting');

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws-sync`;

      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.setStatus('connected');
        this.reconnectAttempts = 0;
        console.log('[Sync] Conectado ao servidor WebSocket da RM Manutec.');

        // Start ping heartbeat
        clearInterval(this.pingInterval);
        this.pingInterval = setInterval(() => {
          if (this.socket?.readyState === WebSocket.OPEN) {
            try {
              this.socket.send(JSON.stringify({ type: 'PING' }));
            } catch {}
          }
        }, 20000);
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'INIT_STATE') {
            if (data.payload?.connectedClients) {
              this.connectedDeviceCount = data.payload.connectedClients;
              this.callbacks.onDeviceCountChange?.(this.connectedDeviceCount);
            }
            this.callbacks.onInitState?.(data.payload);
          } else if (data.type === 'DEVICE_COUNT') {
            this.connectedDeviceCount = data.count || 1;
            this.callbacks.onDeviceCountChange?.(this.connectedDeviceCount);
          } else if (data.type === 'MUTATION_BROADCAST') {
            // Only handle if not originating from this exact device tab
            if (data.senderId !== this.deviceId) {
              this.callbacks.onMutation?.({
                action: data.action,
                payload: data.payload,
                senderId: data.senderId,
                timestamp: data.timestamp,
                version: data.version
              });
            }
          } else if (data.type === 'FORCE_REFRESH_ALL') {
            this.callbacks.onForceRefresh?.(data.reason || 'Atualização em tempo real');
          }
        } catch (parseError) {
          console.error('[Sync] Erro ao decodificar mensagem do servidor:', parseError);
        }
      };

      this.socket.onclose = () => {
        this.setStatus('disconnected');
        clearInterval(this.pingInterval);
        this.scheduleReconnect();
      };

      this.socket.onerror = (err) => {
        console.warn('[Sync] Erro no canal de sincronização:', err);
        this.setStatus('disconnected');
      };
    } catch (err) {
      console.error('[Sync] Falha ao iniciar WebSocket:', err);
      this.setStatus('disconnected');
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.isDestroyed) return;
    clearTimeout(this.reconnectTimer);
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 8000);
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  public reconnect() {
    if (this.socket) {
      try {
        this.socket.close();
      } catch {}
      this.socket = null;
    }
    this.connect();
  }

  /**
   * Dispara uma mutação para todos os aparelhos conectados (via WebSocket, HTTP Fallback e BroadcastChannel)
   */
  public broadcastMutation(action: string, payload: any) {
    const eventPayload: RealtimeMutationEvent = {
      action,
      payload,
      senderId: this.deviceId,
      timestamp: Date.now()
    };

    // 1. Broadcast via WebSocket
    let wsDispatched = false;
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify({
          type: 'MUTATION',
          action,
          payload,
          senderId: this.deviceId
        }));
        wsDispatched = true;
      } catch (err) {
        console.warn('[Sync] Falha ao emitir via WebSocket:', err);
      }
    }

    // 2. Fallback via HTTP REST se WebSocket não estava pronto
    if (!wsDispatched) {
      fetch('/api/sync/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventPayload)
      }).catch(err => {
        console.warn('[Sync] Fallback HTTP broadcast falhou:', err);
      });
    }

    // 3. Local cross-tab broadcast (mesmo aparelho, outras abas)
    if (this.crossTabChannel) {
      try {
        this.crossTabChannel.postMessage({
          type: 'CROSS_TAB_MUTATION',
          data: eventPayload
        });
      } catch {}
    }
  }

  /**
   * Força sincronização inicial no servidor caso o servidor tenha reiniciado
   */
  public seedServerIfEmpty(data: { requests?: ServiceRequest[]; users?: UserProfile[]; interactionThreads?: AdminClientInteractionThread[]; selfiesVault?: SelfieVaultRecord[] }) {
    this.broadcastMutation('SYNC_SEED', data);
  }

  public broadcastRequestSave(req: ServiceRequest) {
    this.broadcastMutation('SAVE_REQUEST', req);
  }

  public broadcastRequestUpdateStatus(data: {
    requestId: string;
    status: string;
    statusHistory?: any[];
    assignedTechnician?: string;
    assignedTechnicianName?: string;
    budgetProposal?: any;
    paymentStatus?: string;
    paymentMethod?: string;
  }) {
    this.broadcastMutation('UPDATE_STATUS', data);
  }

  public broadcastRequestDelete(requestId: string) {
    this.broadcastMutation('DELETE_REQUEST', { requestId });
  }

  public broadcastUserSave(user: UserProfile) {
    this.broadcastMutation('SAVE_USER', user);
  }

  public broadcastUserDelete(userId: string) {
    this.broadcastMutation('DELETE_USER', { userId });
  }

  public broadcastThreadSave(thread: AdminClientInteractionThread) {
    this.broadcastMutation('SAVE_THREAD', thread);
  }

  public broadcastSelfieSave(selfie: SelfieVaultRecord) {
    this.broadcastMutation('SAVE_SELFIE', selfie);
  }

  public broadcastForceRefreshAll(reason?: string) {
    const payload = { reason: reason || 'Atualização forçada pela Central RM Manutec' };
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'FORCE_REFRESH_ALL',
        reason: payload.reason
      }));
    } else {
      fetch('/api/sync/force-refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => {});
    }

    if (this.crossTabChannel) {
      this.crossTabChannel.postMessage({
        type: 'CROSS_TAB_FORCE_REFRESH',
        data: payload
      });
    }
  }

  public getConnectedDevicesCount(): number {
    return this.connectedDeviceCount;
  }

  public getConnectionStatus(): RealtimeConnectionStatus {
    return this.status;
  }

  public getDeviceId(): string {
    return this.deviceId;
  }

  public destroy() {
    this.isDestroyed = true;
    clearInterval(this.pingInterval);
    clearTimeout(this.reconnectTimer);
    if (this.socket) {
      try {
        this.socket.close();
      } catch {}
      this.socket = null;
    }
    if (this.crossTabChannel) {
      try {
        this.crossTabChannel.close();
      } catch {}
      this.crossTabChannel = null;
    }
  }
}

export const realtimeSync = new RealtimeSyncManager();
