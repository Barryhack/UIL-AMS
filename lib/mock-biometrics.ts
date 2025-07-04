// Utility functions for generating mock biometric data for testing

// Generate a mock fingerprint ID
export function generateMockFingerprintId(): string {
  return `FP${Math.floor(100000 + Math.random() * 900000)}`
}

// Generate mock fingerprint data (simulating raw data from a sensor)
export function generateMockFingerprintData(): string {
  // In a real system, this would be binary data from a fingerprint sensor
  // For testing, we'll generate a random string
  const mockData = Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, "0"),
  ).join("")

  return mockData
}

// Generate a mock RFID UID
export function generateMockRfidUid(): string {
  return `RFID${Math.floor(10000000000 + Math.random() * 90000000000)}`
}

// Generate mock RFID data (simulating raw data from an RFID reader)
export function generateMockRfidData(): string {
  // In a real system, this would be data from an RFID reader
  // For testing, we'll generate a random hex string
  const mockData = Array.from({ length: 10 }, () =>
    Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, "0"),
  ).join("")

  return mockData
}

// Map to store mock biometric data for testing
export const mockBiometricStore = new Map<
  string,
  {
    userId: string
    fingerprintData?: string
    fingerprintId?: string
    rfidData?: string
    rfidUid?: string
  }
>()

// Add mock biometric data to the store
export function storeMockBiometricData(
  userId: string,
  data: {
    fingerprintData?: string
    fingerprintId?: string
    rfidData?: string
    rfidUid?: string
  },
) {
  mockBiometricStore.set(userId, {
    userId,
    ...data,
  })
}

// Retrieve mock biometric data from the store
export function getMockBiometricData(userId: string) {
  return mockBiometricStore.get(userId)
}

// Find a user by fingerprint data
export function findUserByFingerprintData(fingerprintData: string) {
  const entries = Array.from(mockBiometricStore.entries())
  for (const [id, data] of entries) {
    if (data.fingerprintData === fingerprintData) {
      return { userId: id, fingerprintData: data.fingerprintData, fingerprintId: data.fingerprintId, rfidData: data.rfidData, rfidUid: data.rfidUid }
    }
  }
  return null
}

// Find a user by RFID data
export function findUserByRfidData(rfidData: string) {
  const entries = Array.from(mockBiometricStore.entries())
  for (const [id, data] of entries) {
    if (data.rfidData === rfidData) {
      return { userId: id, fingerprintData: data.fingerprintData, fingerprintId: data.fingerprintId, rfidData: data.rfidData, rfidUid: data.rfidUid }
    }
  }
  return null
}
