'use client';

import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import React from 'react';

interface Props {
  connectionState: RTCPeerConnectionState;
  iceConnectionState: RTCIceConnectionState;
}

export function ConnectionStatus({ connectionState, iceConnectionState }: Props) {
  let icon = XCircle;
  let text = 'Disconnected';
  let color = 'text-red-500';

  if (connectionState === 'connected' && iceConnectionState === 'connected') {
    icon = CheckCircle;
    text = 'Connected';
    color = 'text-green-500';
  } else if (
    connectionState === 'connecting' || 
    iceConnectionState === 'checking' || 
    iceConnectionState === 'new'
  ) {
    icon = Loader2;
    text = 'Connecting...';
    color = 'text-yellow-500';
  }

  return (
    <div className="flex items-center space-x-2">
      {React.createElement(icon, {
        className: `w-4 h-4 ${icon === Loader2 ? 'animate-spin' : ''} ${color}`,
      })}
      <span className={`text-sm ${color}`}>{text}</span>
    </div>
  );
}
