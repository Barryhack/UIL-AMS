import { HardwareSimulator } from '../app/simulator/hardware-simulator';

describe('HardwareSimulator', () => {
  let simulator: HardwareSimulator;

  beforeEach(() => {
    simulator = new HardwareSimulator();
  });

  afterEach(() => {
    simulator.stop();
  });

  test('should start and connect devices', () => {
    const connectedDevices: string[] = [];
    
    simulator.on('deviceConnected', (device) => {
      connectedDevices.push(device.id);
    });

    simulator.start();
    
    expect(connectedDevices).toHaveLength(2);
    expect(connectedDevices).toContain('fp_001');
    expect(connectedDevices).toContain('rfid_001');
  });

  test('should simulate fingerprint scan', async () => {
    let scannedData: any = null;
    
    simulator.on('fingerprintScanned', (data) => {
      scannedData = data;
    });

    simulator.start();
    await simulator.simulateFingerprintScan('test_fp_123');
    
    expect(scannedData).toBeTruthy();
    expect(scannedData.deviceId).toBe('fp_001');
    expect(scannedData.fingerprintId).toBe('test_fp_123');
    expect(scannedData.timestamp).toBeInstanceOf(Date);
  });

  test('should simulate RFID scan', async () => {
    let scannedData: any = null;
    
    simulator.on('rfidScanned', (data) => {
      scannedData = data;
    });

    simulator.start();
    await simulator.simulateRfidScan('test_rfid_456');
    
    expect(scannedData).toBeTruthy();
    expect(scannedData.deviceId).toBe('rfid_001');
    expect(scannedData.rfidUid).toBe('test_rfid_456');
    expect(scannedData.timestamp).toBeInstanceOf(Date);
  });

  test('should throw error when scanning with stopped simulator', async () => {
    await expect(simulator.simulateFingerprintScan('test_fp_123'))
      .rejects
      .toThrow('Simulator not running');

    await expect(simulator.simulateRfidScan('test_rfid_456'))
      .rejects
      .toThrow('Simulator not running');
  });

  test('should disconnect devices on stop', () => {
    const disconnectedDevices: string[] = [];
    
    simulator.on('deviceDisconnected', (device) => {
      disconnectedDevices.push(device.id);
    });

    simulator.start();
    simulator.stop();
    
    expect(disconnectedDevices).toHaveLength(2);
    expect(disconnectedDevices).toContain('fp_001');
    expect(disconnectedDevices).toContain('rfid_001');
  });
}); 