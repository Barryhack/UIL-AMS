import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import fs from 'fs';

// Configuration
const BAUD_RATE = 115200;
const LOG_FILE = 'esp32-serial-log.txt';

// Get available ports
async function listPorts() {
  try {
    const ports = await SerialPort.list();
    console.log('Available serial ports:');
    ports.forEach(port => {
      console.log(`  ${port.path} - ${port.manufacturer || 'Unknown'} (${port.serialNumber || 'No serial'})`);
    });
    return ports;
  } catch (error) {
    console.error('Error listing ports:', error);
    return [];
  }
}

// Monitor serial port
function monitorPort(portPath) {
  console.log(`\n🔍 Starting serial monitor on ${portPath} at ${BAUD_RATE} baud...`);
  console.log(`📝 Logging to: ${LOG_FILE}`);
  console.log('Press Ctrl+C to stop monitoring\n');
  
  // Clear log file
  fs.writeFileSync(LOG_FILE, `ESP32 Serial Monitor Log - Started at ${new Date().toISOString()}\n`);
  
  const port = new SerialPort({
    path: portPath,
    baudRate: BAUD_RATE,
    autoOpen: false
  });

  const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

  port.open((err) => {
    if (err) {
      console.error('❌ Error opening port:', err.message);
      return;
    }
    console.log('✅ Serial port opened successfully');
  });

  parser.on('data', (data) => {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${data}`;
    
    // Display on console
    console.log(logEntry);
    
    // Save to file
    fs.appendFileSync(LOG_FILE, logEntry + '\n');
    
    // Look for specific WebSocket-related messages
    if (data.includes('[WebSocket]')) {
      console.log('🔍 WebSocket activity detected!');
    }
    if (data.includes('error') || data.includes('Error') || data.includes('ERROR')) {
      console.log('⚠️  Error detected!');
    }
    if (data.includes('timeout') || data.includes('Timeout')) {
      console.log('⏰ Timeout detected!');
    }
  });

  port.on('error', (err) => {
    console.error('❌ Serial port error:', err.message);
  });

  port.on('close', () => {
    console.log('🔌 Serial port closed');
  });

  // Handle Ctrl+C
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping serial monitor...');
    port.close();
    console.log(`📄 Log saved to: ${LOG_FILE}`);
    process.exit(0);
  });
}

// Main execution
async function main() {
  console.log('🔧 ESP32 Serial Monitor Tool');
  console.log('============================\n');
  
  const ports = await listPorts();
  
  if (ports.length === 0) {
    console.log('❌ No serial ports found. Make sure your ESP32 is connected.');
    return;
  }
  
  // Try to find ESP32 port automatically
  const esp32Port = ports.find(port => 
    port.manufacturer?.toLowerCase().includes('silicon labs') ||
    port.manufacturer?.toLowerCase().includes('espressif') ||
    port.manufacturer?.toLowerCase().includes('ch340') ||
    port.manufacturer?.toLowerCase().includes('cp210') ||
    port.path.includes('COM') // Windows
  );
  
  if (esp32Port) {
    console.log(`\n🎯 Auto-detected ESP32 port: ${esp32Port.path}`);
    monitorPort(esp32Port.path);
  } else {
    console.log('\n❓ Could not auto-detect ESP32 port.');
    console.log('Please specify the port manually by editing the script.');
    console.log('Available ports:');
    ports.forEach(port => {
      console.log(`  ${port.path}`);
    });
  }
}

main().catch(console.error); 