# Server Configuration

## Starting the Server

```ts
import { Sueno } from '@sueno/sdk';

const sueno = new Sueno({
  // Global configuration
  logger: true,
  trustProxy: true,
});

// Start the server
sueno.serve({
  port: 3000,
  hostname: 'localhost',
  development: true,
});
```

## Configuration Options

### SuenoOptions

| Option     | Type              | Default   | Description                             |
| ---------- | ----------------- | --------- | --------------------------------------- |
| logger     | boolean \| Logger | true      | Enable/disable logging or custom logger |
| trustProxy | boolean           | false     | Trust X-Forwarded-\* headers            |
| jsonLimit  | string            | '1mb'     | Request body JSON size limit            |
| cors       | CorsOptions       | undefined | CORS configuration                      |

### ServeOptions

| Option      | Type       | Default   | Description       |
| ----------- | ---------- | --------- | ----------------- |
| port        | number     | 3000      | Server port       |
| hostname    | string     | '0.0.0.0' | Server hostname   |
| development | boolean    | false     | Development mode  |
| ssl         | SSLOptions | undefined | SSL configuration |
