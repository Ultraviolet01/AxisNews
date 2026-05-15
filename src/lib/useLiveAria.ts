'use client';

import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents,
  TaskType,
  TaskMode,
} from '@heygen/streaming-avatar';
import { useRef, useState, useCallback, useEffect } from 'react';

export type LiveAriaStatus = 'idle' | 'connecting' | 'connected' | 'speaking' | 'error';

export function useLiveAria(videoRef: React.RefObject<HTMLVideoElement | null>, initialScript?: string) {
  const avatarRef = useRef<StreamingAvatar | null>(null);
  const [status, setStatus] = useState<LiveAriaStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      avatarRef.current?.stopAvatar().catch(() => {});
    };
  }, []);

  const startSession = useCallback(async () => {
    setStatus('connecting');
    setError(null);
    try {
      // 1. Get a short-lived session token from our API route (keeps API key server-side)
      const res = await fetch('/api/heygen-token', { method: 'POST' });
      if (!res.ok) throw new Error('Could not obtain HeyGen session token');
      const { token } = await res.json();

      // 2. Instantiate the streaming avatar client
      avatarRef.current = new StreamingAvatar({ token });

      // 3. Wire the video stream
      avatarRef.current.on(StreamingEvents.STREAM_READY, (e: any) => {
        if (videoRef.current) {
          videoRef.current.srcObject = e.detail;
          videoRef.current.play().catch(() => {});
        }
        setStatus('connected');
        
        // Auto-speak initial script if provided
        if (initialScript) {
          setTimeout(() => {
            avatarRef.current?.speak({
              text: initialScript,
              taskType: TaskType.TALK,
              taskMode: TaskMode.SYNC,
            }).catch(err => console.error('[LiveARIA] Auto-speak error:', err));
          }, 1000);
        }
      });

      avatarRef.current.on(StreamingEvents.STREAM_DISCONNECTED, () => {
        setStatus('idle');
      });

      avatarRef.current.on(StreamingEvents.AVATAR_START_TALKING, () => {
        setStatus('speaking');
      });

      avatarRef.current.on(StreamingEvents.AVATAR_STOP_TALKING, () => {
        setStatus('connected');
      });

      // 4. Start the avatar session
      await avatarRef.current.createStartAvatar({
        quality: AvatarQuality.High,
        avatarName: process.env.NEXT_PUBLIC_HEYGEN_AVATAR_ID || 'Aria_in_a_suit_front',
        knowledgeBase: `You are ARIA, the AI news anchor for AXIS News. 
          Answer viewer questions about today's top stories concisely and authoritatively.
          Be sharp, engaging, and always stay in character as a professional broadcast journalist.
          Keep answers under 60 seconds. Lead with the most important fact.`,
      });
    } catch (err: any) {
      console.error('[LiveARIA] Session error:', err);
      setError(err.message ?? 'Failed to connect');
      setStatus('error');
    }
  }, [videoRef]);

  const stopSession = useCallback(async () => {
    try {
      await avatarRef.current?.stopAvatar();
    } catch {}
    avatarRef.current = null;
    setStatus('idle');
    if (videoRef.current) videoRef.current.srcObject = null;
  }, [videoRef]);

  const askQuestion = useCallback(async (text: string) => {
    if (!avatarRef.current || status === 'idle') return;
    try {
      setStatus('speaking');
      await avatarRef.current.speak({
        text,
        taskType: TaskType.TALK,
        taskMode: TaskMode.SYNC,
      });
    } catch (err: any) {
      console.error('[LiveARIA] Speak error:', err);
      setStatus('connected');
    }
  }, [status]);

  const interrupt = useCallback(async () => {
    try {
      await avatarRef.current?.interrupt();
    } catch {}
  }, []);

  return { status, error, startSession, stopSession, askQuestion, interrupt };
}
