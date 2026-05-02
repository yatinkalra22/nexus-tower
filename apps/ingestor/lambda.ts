import WebSocket from 'ws';
import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const AIS_WS_URL = 'wss://stream.aisstream.io/v0/stream';

const databaseUrl = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
const apiKey = process.env.AISSTREAM_API_KEY;

if (!databaseUrl || !authToken || !apiKey) {
  throw new Error('Missing TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, or AISSTREAM_API_KEY');
}

const client = createClient({
  url: databaseUrl,
  authToken,
});

async function getTrackedMmsis() {
  const result = await client.execute('SELECT mmsi FROM vessels');

  return result.rows
    .map((row) => row.mmsi)
    .filter((mmsi): mmsi is string => typeof mmsi === 'string' && mmsi.length > 0);
}

async function runSubscriptionWindow(windowMs = 45_000) {
  const trackedMmsis = await getTrackedMmsis();
  const ws = new WebSocket(AIS_WS_URL);

  return await new Promise<{ ok: boolean; trackedMmsis: number }>((resolve, reject) => {
    const timeout = setTimeout(() => {
      ws.close();
      resolve({ ok: true, trackedMmsis: trackedMmsis.length });
    }, windowMs);

    ws.once('open', () => {
      ws.send(
        JSON.stringify({
          APIKey: apiKey,
          BoundingBoxes: [
            [
              [-90, -180],
              [90, 180],
            ],
          ],
          FiltersShipMMSI: trackedMmsis,
          FilterMessageTypes: ['PositionReport'],
        }),
      );
    });

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.MessageType !== 'PositionReport') {
          return;
        }

        const report = message.Message?.PositionReport;
        const mmsi = String(message.MetaData?.MMSI ?? '');

        if (!report || !mmsi) {
          return;
        }

        await client.execute({
          sql: 'INSERT INTO vessel_positions (mmsi, latitude, longitude, speed, heading, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
          args: [mmsi, report.Latitude, report.Longitude, report.Sog, report.Cog, Date.now()],
        });
      } catch (error) {
        console.error('Lambda ingestor message handling error:', error);
      }
    });

    ws.once('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    ws.once('close', () => {
      clearTimeout(timeout);
      resolve({ ok: true, trackedMmsis: trackedMmsis.length });
    });
  });
}

export const handler = async () => {
  const result = await runSubscriptionWindow();

  return {
    statusCode: 200,
    body: JSON.stringify(result),
  };
};

if (import.meta.url === `file://${process.argv[1]}`) {
  handler()
    .then((result) => {
      console.log(JSON.stringify(result));
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
