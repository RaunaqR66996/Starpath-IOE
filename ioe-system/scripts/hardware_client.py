import requests
import time
import json
import random

# CONFIG
API_URL = "http://localhost:3000/api/ingest/v1/telemetry"
DEVICE_ID = "FL-01"

def generate_frame(sequence_id):
    """Generates a valid SensorFusionFrame JSON packet."""
    return {
        "deviceId": DEVICE_ID,
        "timestamp": int(time.time() * 1000),
        "sequenceId": sequence_id,
        "pose": {
            "position": {"x": 12.5, "y": 0, "z": 8.0}, # Fixed location
            "orientation": {"x": 0, "y": 0, "z": 0, "w": 1},
            "velocity": {"linear": 0, "angular": 0}
        },
        "objects": [
            {
                "id": "obj-test-01",
                "classId": "pallet",
                "confidence": 0.98,
                "boundingBox": {
                    "center": {"x": 1.5, "y": 0, "z": 0.5},
                    "dimensions": {"l": 1.2, "w": 1.0, "h": 1.5}
                }
            }
        ],
        "voxels": [
            {
                "id": "v-001",
                "center": {"x": 13.0, "y": 0.2, "z": 8.5},
                "occupancyProbability": 0.85
            }
        ],
        "status": {
            "cpuLoad": 15.0,
            "memoryUsage": 1024,
            "gpuLoad": 45.0,
            "fusionLatencyMs": 12.4
        }
    }

def send_update():
    """Sends frames in a loop to simulate active hardware."""
    print(f"📡 Connecting to {API_URL}...")
    
    for i in range(20):
        # Move the object constantly to prove it's live
        frame = generate_frame(i)
        frame["pose"]["position"]["x"] = 10 + (i * 0.2) 
        
        try:
            response = requests.post(API_URL, json=frame)
            if response.status_code == 200:
                print(f"[{i+1}/20] ✅ Packet Sent. Server Ack: {response.json().get('status')}")
            else:
                print(f"[{i+1}/20] ❌ Rejected: {response.status_code}")
        except Exception as e:
            print(f"[{i+1}/20] ❌ Connection Failed: {e}")
            
        time.sleep(0.5)
    
    print("End of Stream Test.")

if __name__ == "__main__":
    send_update()
