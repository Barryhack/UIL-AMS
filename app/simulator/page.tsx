'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { HardwareSimulator } from './hardware-simulator';

export default function SimulatorPage() {
  const [simulator] = useState(() => new HardwareSimulator());
  const [isRunning, setIsRunning] = useState(false);
  const [fingerprintId, setFingerprintId] = useState('');
  const [rfidUid, setRfidUid] = useState('');
  const [devices, setDevices] = useState<any[]>([]);
  const [lastEvent, setLastEvent] = useState<string>('');

  useEffect(() => {
    // Update devices list when simulator state changes
    const updateDevices = () => {
      setDevices(simulator.getAllDevices());
    };

    simulator.on('deviceConnected', (device) => {
      setLastEvent(`Device connected: ${device.id}`);
      updateDevices();
    });

    simulator.on('deviceDisconnected', (device) => {
      setLastEvent(`Device disconnected: ${device.id}`);
      updateDevices();
    });

    simulator.on('fingerprintScanned', (data) => {
      setLastEvent(`Fingerprint scanned: ${data.fingerprintId}`);
    });

    simulator.on('rfidScanned', (data) => {
      setLastEvent(`RFID scanned: ${data.rfidUid}`);
    });

    return () => {
      simulator.stop();
    };
  }, [simulator]);

  const toggleSimulator = () => {
    if (isRunning) {
      simulator.stop();
      setIsRunning(false);
    } else {
      simulator.start();
      setIsRunning(true);
    }
  };

  const handleFingerprintScan = async () => {
    try {
      await simulator.simulateFingerprintScan(fingerprintId);
    } catch (error: any) {
      setLastEvent(`Error: ${error?.message || 'Unknown error'}`);
    }
  };

  const handleRfidScan = async () => {
    try {
      await simulator.simulateRfidScan(rfidUid);
    } catch (error: any) {
      setLastEvent(`Error: ${error?.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Hardware Simulator</h1>
        <Button onClick={toggleSimulator} variant={isRunning ? "destructive" : "default"}>
          {isRunning ? 'Stop Simulator' : 'Start Simulator'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Devices */}
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4">Connected Devices</h2>
          <div className="space-y-2">
            {devices.map((device) => (
              <div
                key={device.id}
                className="flex items-center justify-between p-2 border rounded"
              >
                <div>
                  <p className="font-medium">{device.id}</p>
                  <p className="text-sm text-muted-foreground">{device.type}</p>
                </div>
                <span className={`px-2 py-1 rounded text-sm ${
                  device.status === 'connected' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {device.status}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Controls */}
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4">Simulator Controls</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Fingerprint ID</label>
              <div className="flex space-x-2">
                <Input
                  value={fingerprintId}
                  onChange={(e) => setFingerprintId(e.target.value)}
                  placeholder="Enter fingerprint ID"
                />
                <Button onClick={handleFingerprintScan} disabled={!isRunning}>
                  Scan
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">RFID UID</label>
              <div className="flex space-x-2">
                <Input
                  value={rfidUid}
                  onChange={(e) => setRfidUid(e.target.value)}
                  placeholder="Enter RFID UID"
                />
                <Button onClick={handleRfidScan} disabled={!isRunning}>
                  Scan
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Event Log */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-2">Last Event</h2>
        <p className="text-sm font-mono bg-muted p-2 rounded">
          {lastEvent || 'No events yet'}
        </p>
      </Card>
    </div>
  );
} 