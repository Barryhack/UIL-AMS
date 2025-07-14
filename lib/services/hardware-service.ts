import { EventEmitter } from 'events';
import { toast } from '@/hooks/use-toast';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://unilorin-ams-ws-server.onrender.com';

export interface DeviceCommand {
  deviceId: string;
  type: string;
  data?: any;
}

export interface AttendanceRecord {
  deviceId: string;
  type: 'fingerprint' | 'rfid';
  identifier: string;
  success: boolean;
  timestamp: number;
}

class HardwareService extends EventEmitter {
  public isConnected: boolean = false;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;

  // HTTP-based device commands
  async sendDeviceCommand(command: DeviceCommand): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/api/admin/device-command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('[Hardware Service] Command sent successfully:', result);
      
      toast({
        title: "Command Sent",
        description: `Command ${command.type} sent to device ${command.deviceId}`,
      });

      return true;
    } catch (error) {
      console.error('[Hardware Service] Failed to send command:', error);
      toast({
        title: "Command Failed",
        description: `Failed to send command to device: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
      return false;
    }
  }

  // Send attendance record from device
  async sendAttendanceRecord(record: AttendanceRecord): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/api/device/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(record),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('[Hardware Service] Attendance record sent:', result);
      return true;
    } catch (error) {
      console.error('[Hardware Service] Failed to send attendance record:', error);
      return false;
    }
  }

  // Get device commands
  async getDeviceCommands(deviceId: string): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE}/api/admin/device-command?deviceId=${encodeURIComponent(deviceId)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.commands || [];
    } catch (error) {
      console.error('[Hardware Service] Failed to get device commands:', error);
      return [];
    }
  }

  // WebSocket for real-time updates (frontend only)
  connectWebSocket(onMessage: (data: any) => void): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('[Hardware Service] WebSocket already connected');
      return;
    }

    const wsUrl = `${API_BASE.replace('https://', 'wss://').replace('http://', 'ws://')}/api/ws`;
    console.log('[Hardware Service] Connecting to WebSocket:', wsUrl);

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.isConnected = true;
      console.log('[Hardware Service] WebSocket connected');
      this.reconnectAttempts = 0;
      // Send client type
      this.ws?.send(JSON.stringify({
        type: 'client_connect',
        clientType: 'web'
      }));
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[Hardware Service] WebSocket message received:', data);
        onMessage(data);
      } catch (error) {
        console.error('[Hardware Service] Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      this.isConnected = false;
      console.log('[Hardware Service] WebSocket disconnected');
      this.scheduleReconnect(onMessage);
    };

    this.ws.onerror = (error) => {
      console.error('[Hardware Service] WebSocket error:', error);
    };
  }

  private scheduleReconnect(onMessage: (data: any) => void): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`[Hardware Service] Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      
      setTimeout(() => {
        this.connectWebSocket(onMessage);
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('[Hardware Service] Max reconnection attempts reached');
    }
  }

  disconnectWebSocket(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // Convenience methods for common commands
  async triggerFingerprintScan(deviceId: string): Promise<boolean> {
    return this.sendDeviceCommand({
      deviceId,
      type: 'fingerprint_scan'
    });
  }

  async triggerRFIDScan(deviceId: string): Promise<boolean> {
    return this.sendDeviceCommand({
      deviceId,
      type: 'rfid_scan'
    });
  }

  async startAttendanceSession(deviceId: string, sessionId: string, courseId: string, lecturerId: string, duration: number = 7200000): Promise<boolean> {
    return this.sendDeviceCommand({
      deviceId,
      type: 'start_session',
      data: {
        sessionId,
        courseId,
        lecturerId,
        duration
      }
    });
  }

  async endAttendanceSession(deviceId: string): Promise<boolean> {
    return this.sendDeviceCommand({
      deviceId,
      type: 'end_session'
    });
  }

  async enrollFingerprint(deviceId: string, userId: string): Promise<boolean> {
    return this.sendDeviceCommand({
      deviceId,
      type: 'fingerprint_enroll',
      data: { userId }
    });
  }

  // Add a testConnection method for compatibility with HardwareScanner
  testConnection(): Promise<boolean> {
    // For now, just resolve true. You can expand this to actually test the connection if needed.
    return Promise.resolve(true);
  }
}

export const hardwareService = new HardwareService(); 

// Export a function to get the hardware service instance
export const getHardwareService = () => hardwareService; 