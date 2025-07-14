"use client";
import { useEffect } from "react";
import { getHardwareService } from "@/lib/services/hardware-service";

export function HardwareWebSocketInitializer() {
  useEffect(() => {
    const hardwareService = getHardwareService();
    hardwareService.connectWebSocket(() => {});
  }, []);
  return null;
} 