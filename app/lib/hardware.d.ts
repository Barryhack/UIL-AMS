declare class HardwareService {
    connect(serverUrl?: string): Promise<boolean>;
    disconnect(): void;
    scanRFID(): Promise<string>;
    scanFingerprint(userId: number): Promise<string>;
    enrollFingerprint(userId: number): Promise<void>;
    isConnected(): boolean;
}

export const hardwareService: HardwareService; 