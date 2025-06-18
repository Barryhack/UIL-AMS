import { EventEmitter } from 'events';

interface SimulatedDevice {
  id: string;
  type: 'fingerprint' | 'rfid';
  status: 'connected' | 'disconnected';
  lastScan?: {
    timestamp: Date;
    value: string;
  };
}

export class HardwareSimulator extends EventEmitter {
  private devices: Map<string, SimulatedDevice>;
  private isRunning: boolean;

  constructor() {
    super();
    this.devices = new Map();
    this.isRunning = false;

    // Initialize default devices
    this.devices.set('fp_001', {
      id: 'fp_001',
      type: 'fingerprint',
      status: 'disconnected'
    });

    this.devices.set('rfid_001', {
      id: 'rfid_001',
      type: 'rfid',
      status: 'disconnected'
    });
  }

  // Start the simulator
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('Hardware simulator started');
    
    // Simulate device connections
    this.devices.forEach((device) => {
      device.status = 'connected';
      this.emit('deviceConnected', device);
    });
  }

  // Stop the simulator
  stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
    console.log('Hardware simulator stopped');

    // Simulate device disconnections
    this.devices.forEach((device) => {
      device.status = 'disconnected';
      this.emit('deviceDisconnected', device);
    });
  }

  // Simulate a fingerprint scan
  async simulateFingerprintScan(fingerprintId: string): Promise<boolean> {
    if (!this.isRunning) throw new Error('Simulator not running');

    const device = this.devices.get('fp_001');
    if (device?.status !== 'connected') {
      throw new Error('Fingerprint device not connected');
    }

    // Simulate scan delay (500-1500ms)
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    device.lastScan = {
      timestamp: new Date(),
      value: fingerprintId
    };

    this.emit('fingerprintScanned', {
      deviceId: device.id,
      fingerprintId,
      timestamp: device.lastScan.timestamp
    });

    return true;
  }

  // Simulate an RFID card scan
  async simulateRfidScan(rfidUid: string): Promise<boolean> {
    if (!this.isRunning) throw new Error('Simulator not running');

    const device = this.devices.get('rfid_001');
    if (device?.status !== 'connected') {
      throw new Error('RFID device not connected');
    }

    // Simulate scan delay (100-300ms)
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

    device.lastScan = {
      timestamp: new Date(),
      value: rfidUid
    };

    this.emit('rfidScanned', {
      deviceId: device.id,
      rfidUid,
      timestamp: device.lastScan.timestamp
    });

    return true;
  }

  // Get device status
  getDeviceStatus(deviceId: string): SimulatedDevice | undefined {
    return this.devices.get(deviceId);
  }

  // Get all devices
  getAllDevices(): SimulatedDevice[] {
    return Array.from(this.devices.values());
  }
} 