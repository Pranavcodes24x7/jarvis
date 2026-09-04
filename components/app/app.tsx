'use client';

import { useMemo } from 'react';
import { TokenSource } from 'livekit-client';
import { useSession } from '@livekit/components-react';
import { WarningIcon } from '@phosphor-icons/react/dist/ssr';
import type { AppConfig } from '@/app-config';
import { AgentSessionProvider } from '@/components/agents-ui/agent-session-provider';
import { StartAudioButton } from '@/components/agents-ui/start-audio-button';
import { ViewController } from '@/components/app/view-controller';
import { Toaster } from '@/components/ui/sonner';
import { useAgentErrors } from '@/hooks/useAgentErrors';
import { useDebugMode } from '@/hooks/useDebug';
import { getSandboxTokenSource } from '@/lib/utils';

const IN_DEVELOPMENT = process.env.NODE_ENV !== 'production';

function AppSetup() {
  useDebugMode({ enabled: IN_DEVELOPMENT });
  useAgentErrors();

  return null;
}

interface AppProps {
  appConfig: AppConfig;
}

export function App({ appConfig }: AppProps) {
  const tokenSource = useMemo(() => {
    return typeof process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT === 'string'
      ? getSandboxTokenSource(appConfig)
      : TokenSource.endpoint('/api/token');
  }, [appConfig]);

  const session = useSession(
    tokenSource,
    appConfig.agentName ? { agentName: appConfig.agentName } : undefined
  );

  return (
    <AgentSessionProvider session={session}>
      <AppSetup />

      <main className="relative h-svh w-full overflow-hidden">
        <div
          className="absolute inset-[-5%] bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/background.png')",
            animation: 'jarvisBackground 20s ease-in-out infinite',
          }}
        />

        <div className="absolute inset-0 bg-black/30" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,180,255,0.12),transparent_65%)]" />

        <div className="relative z-10 grid h-full w-full grid-cols-1 place-items-center">
          <ViewController appConfig={appConfig} />
        </div>
      </main>

      <StartAudioButton label="Start Audio" />

      <Toaster
        icons={{
          warning: <WarningIcon weight="bold" />,
        }}
        position="top-center"
        className="toaster group"
        style={
          {
            '--normal-bg': 'var(--popover)',
            '--normal-text': 'var(--popover-foreground)',
            '--normal-border': 'var(--border)',
          } as React.CSSProperties
        }
      />

      <style jsx>{`
        @keyframes jarvisBackground {
          0% {
            transform: scale(1);
            background-position: 50% 50%;
          }

          50% {
            transform: scale(1.05);
            background-position: 52% 48%;
          }

          100% {
            transform: scale(1);
            background-position: 50% 50%;
          }
        }
      `}</style>
    </AgentSessionProvider>
  );
}
