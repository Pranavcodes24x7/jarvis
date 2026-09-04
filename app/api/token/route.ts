import { NextResponse } from 'next/server';
import { AccessToken, type AccessTokenOptions, type VideoGrant } from 'livekit-server-sdk';
import { RoomConfiguration } from '@livekit/protocol';

type ConnectionDetails = {
  serverUrl: string;
  roomName: string;
  participantName: string;
  participantToken: string;
};

// don't cache the results
export const revalidate = 0;

export async function POST(req: Request) {
  const requestHost = new URL(req.url).hostname;
  const isLocalRequest = requestHost === 'localhost' || requestHost === '127.0.0.1';

  // Keep this starter route unavailable to non-local production deployments.
  if (
    !isLocalRequest &&
    process.env.NODE_ENV !== 'development' &&
    process.env.IS_VERCEL_PREVIEW !== 'true'
  ) {
    throw new Error(
      'THIS API ROUTE IS INSECURE. DO NOT USE THIS ROUTE IN PRODUCTION WITHOUT AN AUTHENTICATION LAYER.'
    );
  }

  try {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.LIVEKIT_URL;

    const missingVariables = [
      ['LIVEKIT_URL', livekitUrl],
      ['LIVEKIT_API_KEY', apiKey],
      ['LIVEKIT_API_SECRET', apiSecret],
    ]
      .filter(([, value]) => !value)
      .map(([name]) => name);

    if (missingVariables.length > 0) {
      return NextResponse.json(
        {
          error: `Missing LiveKit configuration: ${missingVariables.join(', ')}. Add these values to .env.local and restart pnpm dev.`,
        },
        { status: 503 }
      );
    }

    const invalidVariables = [
      ['LIVEKIT_URL', livekitUrl?.startsWith('wss://') ?? false],
      ['LIVEKIT_API_KEY', apiKey ? /^[\x20-\x7e]+$/.test(apiKey) : false],
      ['LIVEKIT_API_SECRET', apiSecret ? /^[\x20-\x7e]+$/.test(apiSecret) : false],
    ]
      .filter(([, isValid]) => !isValid)
      .map(([name]) => name);

    if (invalidVariables.length > 0) {
      return NextResponse.json(
        {
          error: `Invalid LiveKit configuration: ${invalidVariables.join(', ')}. Use the unmasked values from your LiveKit project and restart pnpm dev.`,
        },
        { status: 503 }
      );
    }

    const configuredApiKey = apiKey!;
    const configuredApiSecret = apiSecret!;
    const configuredLivekitUrl = livekitUrl!;

    // Parse room config from request body.
    const body = await req.json();
    const roomConfig = body?.room_config
      ? RoomConfiguration.fromJson(body.room_config, { ignoreUnknownFields: true })
      : new RoomConfiguration();

    // Generate participant token
    const participantName = 'user';
    const participantIdentity = `voice_assistant_user_${Math.floor(Math.random() * 10_000)}`;
    const roomName = `voice_assistant_room_${Math.floor(Math.random() * 10_000)}`;

    const participantToken = await createParticipantToken(
      { identity: participantIdentity, name: participantName },
      roomName,
      roomConfig,
      configuredApiKey,
      configuredApiSecret
    );

    // Return connection details
    const data: ConnectionDetails = {
      serverUrl: configuredLivekitUrl,
      roomName,
      participantName,
      participantToken,
    };
    const headers = new Headers({
      'Cache-Control': 'no-store',
    });
    return NextResponse.json(data, { headers });
  } catch (error) {
    if (error instanceof Error) {
      console.error(error);
      return new NextResponse(error.message, { status: 500 });
    }
  }
}

function createParticipantToken(
  userInfo: AccessTokenOptions,
  roomName: string,
  roomConfig: RoomConfiguration | undefined,
  apiKey: string,
  apiSecret: string
): Promise<string> {
  const at = new AccessToken(apiKey, apiSecret, {
    ...userInfo,
    ttl: '15m',
  });
  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
  };
  at.addGrant(grant);

  if (roomConfig) {
    at.roomConfig = roomConfig;
  }

  return at.toJwt();
}
