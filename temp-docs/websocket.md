# WebSocket

## Basic WebSocket Server

```ts
sueno.ws('/chat', {
  message(ws, message) {
    // Handle incoming messages
    ws.send(`Received: ${message}`);
  },
  open(ws) {
    console.log('Client connected');
  },
  close(ws) {
    console.log('Client disconnected');
  },
  error(ws, error) {
    console.error('WebSocket error:', error);
  },
});
```

## Broadcast Messages

```ts
const connections = new Set<WebSocket>();

sueno.ws('/broadcast', {
  message(ws, message) {
    // Broadcast to all clients
    for (const client of connections) {
      client.send(message);
    }
  },
  open(ws) {
    connections.add(ws);
  },
  close(ws) {
    connections.delete(ws);
  },
});
```

## WebSocket with Authentication

```ts
sueno.ws('/secure-chat', {
  open(ws, req) {
    const token = req.headers.get('authorization');
    if (!validateToken(token)) {
      ws.close(1008, 'Unauthorized');
      return;
    }
    // Continue with authenticated connection
  },
});
```
