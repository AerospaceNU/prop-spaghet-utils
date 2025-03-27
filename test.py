import asyncio
import websockets

# websocketaddress = "ecs-pi.local:9002"
websocketaddress = "169.254.90.98:9002" # for actual pi runs

async def listen():
    uri = "ws://" + websocketaddress  # Change to your WebSocket address
    print("Connecting to: ", uri)
    async with websockets.connect(uri) as websocket:
        while True:
            message = await websocket.recv()
            print(f"Received: {message}")

# Run the async function
asyncio.run(listen())