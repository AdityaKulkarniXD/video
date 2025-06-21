'use client';

import { cn } from '@/lib/utils';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

interface ConnectionStatusProps {
  connectionState: RTCPeerConnectionState;
  iceConnectionState: RTCIceConnectionState;
  className?: string;
}

export function ConnectionStatus({ 
  connectionState, 
  iceConnectionState, 
  className 
}: ConnectionStatusProps) {
  const getStatusInfo = () => {
    if (connectionState === 'connected' && iceConnectionState === 'connected') {
      return {
        icon: Wifi,
        text: 'Connected',
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
      };
    }
    
    if (connectionState === 'connecting' || iceConnectionState === 'connecting') {
      return {
        icon: Loader2,
        text: 'Connecting...',
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-500/10',
        animate: true,
      };
    }
    
    if (connectionState === 'disconnected' || iceConnectionState === 'disconnected') {
      return {
        icon: WifiOff,
        text: 'Disconnected',
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
      };
    }
    
    if (connectionState === 'failed' || iceConnectionState === 'failed') {
      return {
        icon: WifiOff,
        text: 'Connection Failed',
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
      };
    }
    
    return {
      icon: Loader2,
      text: 'Initializing...',
      color: 'text-gray-500',
      bgColor: 'bg-gray-500/10',
      animate: true,
    };
  };

  const { icon: Icon, text, color, bgColor, animate } = getStatusInfo();

  return (
    <div className={cn(
      "flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-medium",
      bgColor,
      className
    )}>
      <Icon className={cn("w-4 h-4", color, animate && "animate-spin")} />
      <span className={color}>{text}</span>
    </div>
  );
}