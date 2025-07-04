import asyncio
import websockets
import json

async def send_command():
    uri = "ws://192.168.60.118:3000/api/ws"
    async with websockets.connect(uri) as websocket:
        print("Connected to WebSocket server.")

        # Send enroll_fingerprint command
        command = {
            "command": "enroll_fingerprint"
        }
        await websocket.send(json.dumps(command))
        print("Sent enroll_fingerprint command.")

        # Wait for any response (optional)
        try:
            while True:
                response = await websocket.recv()
                print("Received:", response)
        except websockets.ConnectionClosed:
            print("Connection closed.")

if __name__ == "__main__":
    asyncio.run(send_command()) 