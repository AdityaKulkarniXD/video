'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { VideoPlayer } from '@/components/VideoPlayer';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { socketManager } from '@/lib/socket';
import { WebRTCPeer } from '@/lib/webrtc';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Phone, 
  PhoneOff, 
  Copy, 
  Share2, 
  Settings,
  Monitor,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function RoomPage() {
  const { roomId } = useParams();
  const router = useRouter();
  
  // WebRTC and Socket refs
  const webrtcPeer = useRef<WebRTCPeer | null>(null);
  const socket = useRef(socketManager.connect());
  
  // Media streams
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  
  // UI states
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isCallActive, setIsCallActive] = useState(false);
  const [participantCount, setParticipantCount] = useState(1);
  
  // Connection states
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');
  const [iceConnectionState, setIceConnectionState] = useState<RTCIceConnectionState>('new');

  // Initialize WebRTC and Socket connections
  const initializeCall = useCallback(async () => {
    try {
      setIsConnecting(true);
      
      // Create WebRTC peer
      webrtcPeer.current = new WebRTCPeer();
      
      // Set up WebRTC event handlers
      webrtcPeer.current.onIceCandidate = (candidate) => {
        socket.current.emit('ice-candidate', { candidate, roomId });
      };
      
      webrtcPeer.current.onRemoteStream = (stream) => {
        setRemoteStream(stream);
        setIsCallActive(true);
      };
      
      webrtcPeer.current.onConnectionStateChange = (state) => {
        setConnectionState(state);
        if (state === 'connected') {
          setIsConnecting(false);
          toast.success('Connected successfully!');
        } else if (state === 'failed') {
          toast.error('Connection failed. Please try again.');
        }
      };
      
      webrtcPeer.current.onIceConnectionStateChange = (state) => {
        setIceConnectionState(state);
      };

      // Get user media
      const stream = await webrtcPeer.current.getUserMedia();
      setLocalStream(stream);
      
      // Join the room
      socket.current.emit('join-room', roomId);
      
    } catch (error) {
      console.error('Error initializing call:', error);
      toast.error('Failed to access camera or microphone');
      setIsConnecting(false);
    }
  }, [roomId]);

  // Socket event handlers
  useEffect(() => {
    const socketInstance = socket.current;

    socketInstance.on('user-joined', async (userId) => {
      console.log('User joined:', userId);
      setParticipantCount(prev => prev + 1);
      
      if (webrtcPeer.current) {
        try {
          const offer = await webrtcPeer.current.createOffer();
          socketInstance.emit('offer', { offer, roomId });
        } catch (error) {
          console.error('Error creating offer:', error);
        }
      }
    });

    socketInstance.on('offer', async ({ offer, from }) => {
      console.log('Received offer from:', from);
      
      if (webrtcPeer.current) {
        try {
          await webrtcPeer.current.setRemoteDescription(offer);
          const answer = await webrtcPeer.current.createAnswer();
          socketInstance.emit('answer', { answer, roomId });
        } catch (error) {
          console.error('Error handling offer:', error);
        }
      }
    });

    socketInstance.on('answer', async ({ answer, from }) => {
      console.log('Received answer from:', from);
      
      if (webrtcPeer.current) {
        try {
          await webrtcPeer.current.setRemoteDescription(answer);
        } catch (error) {
          console.error('Error handling answer:', error);
        }
      }
    });

    socketInstance.on('ice-candidate', async ({ candidate, from }) => {
      console.log('Received ICE candidate from:', from);
      
      if (webrtcPeer.current) {
        try {
          await webrtcPeer.current.addIceCandidate(candidate);
        } catch (error) {
          console.error('Error adding ICE candidate:', error);
        }
      }
    });

    socketInstance.on('user-left', (userId) => {
      console.log('User left:', userId);
      setParticipantCount(prev => Math.max(1, prev - 1));
      setRemoteStream(null);
      setIsCallActive(false);
      toast.info('The other participant has left the call');
    });

    socketInstance.on('room-participants', (participants) => {
      setParticipantCount(participants.length + 1);
    });

    return () => {
      socketInstance.off('user-joined');
      socketInstance.off('offer');
      socketInstance.off('answer');
      socketInstance.off('ice-candidate');
      socketInstance.off('user-left');
      socketInstance.off('room-participants');
    };
  }, [roomId]);

  // Initialize call on component mount
  useEffect(() => {
    initializeCall();

    return () => {
      // Cleanup
      if (webrtcPeer.current) {
        webrtcPeer.current.close();
      }
      socketManager.disconnect();
    };
  }, [initializeCall]);

  // Media control functions
  const toggleAudio = () => {
    if (webrtcPeer.current) {
      const enabled = webrtcPeer.current.toggleAudio();
      setIsAudioEnabled(enabled);
      socket.current.emit('media-state', { audio: enabled, roomId });
    }
  };

  const toggleVideo = () => {
    if (webrtcPeer.current) {
      const enabled = webrtcPeer.current.toggleVideo();
      setIsVideoEnabled(enabled);
      socket.current.emit('media-state', { video: enabled, roomId });
    }
  };

  const copyRoomLink = async () => {
    const url = `${window.location.origin}/room/${roomId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Room link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const shareRoom = async () => {
    const url = `${window.location.origin}/room/${roomId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my video call',
          text: `Join me for a video call in room ${roomId}`,
          url: url,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      copyRoomLink();
    }
  };

  const leaveCall = () => {
    if (webrtcPeer.current) {
      webrtcPeer.current.close();
    }
    socketManager.disconnect();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Video className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-white font-semibold">Room {roomId}</h1>
                  <div className="flex items-center space-x-2 text-sm text-gray-300">
                    <Users className="w-4 h-4" />
                    <span>{participantCount} participant{participantCount !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <ConnectionStatus 
                connectionState={connectionState}
                iceConnectionState={iceConnectionState}
              />
              
              <Button
                variant="outline"
                size="sm"
                onClick={copyRoomLink}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Link
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={shareRoom}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Video Grid */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Local Video */}
          <Card className="relative overflow-hidden bg-black border-gray-700">
            <div className="aspect-video">
              <VideoPlayer
                stream={localStream}
                muted={true}
                loading={isConnecting && !localStream}
                className="w-full h-full"
              />
            </div>
            <div className="absolute bottom-4 left-4 bg-black/60 text-white px-2 py-1 rounded text-sm">
              You {!isVideoEnabled && '(Video Off)'}
            </div>
            {!isVideoEnabled && (
              <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                  <VideoOff className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-400">Video is off</p>
                </div>
              </div>
            )}
          </Card>

          {/* Remote Video */}
          <Card className="relative overflow-hidden bg-black border-gray-700">
            <div className="aspect-video">
              <VideoPlayer
                stream={remoteStream}
                loading={isConnecting && !remoteStream}
                className="w-full h-full"
              />
            </div>
            {remoteStream && (
              <div className="absolute bottom-4 left-4 bg-black/60 text-white px-2 py-1 rounded text-sm">
                Remote Participant
              </div>
            )}
            {!remoteStream && !isConnecting && (
              <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-400 mb-2">Waiting for others to join</p>
                  <Button
                    variant="outline"
                    onClick={shareRoom}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Invite Others
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Controls */}
        <div className="flex justify-center">
          <Card className="bg-black/40 border-gray-700 backdrop-blur-sm">
            <div className="flex items-center space-x-2 p-4">
              {/* Audio Toggle */}
              <Button
                variant={isAudioEnabled ? "secondary" : "destructive"}
                size="lg"
                onClick={toggleAudio}
                className={cn(
                  "w-14 h-14 rounded-full",
                  isAudioEnabled 
                    ? "bg-gray-700 hover:bg-gray-600 text-white" 
                    : "bg-red-600 hover:bg-red-700 text-white"
                )}
              >
                {isAudioEnabled ? (
                  <Mic className="w-6 h-6" />
                ) : (
                  <MicOff className="w-6 h-6" />
                )}
              </Button>

              {/* Video Toggle */}
              <Button
                variant={isVideoEnabled ? "secondary" : "destructive"}
                size="lg"
                onClick={toggleVideo}
                className={cn(
                  "w-14 h-14 rounded-full",
                  isVideoEnabled 
                    ? "bg-gray-700 hover:bg-gray-600 text-white" 
                    : "bg-red-600 hover:bg-red-700 text-white"
                )}
              >
                {isVideoEnabled ? (
                  <Video className="w-6 h-6" />
                ) : (
                  <VideoOff className="w-6 h-6" />
                )}
              </Button>

              {/* Screen Share (Placeholder) */}
              <Button
                variant="secondary"
                size="lg"
                disabled
                className="w-14 h-14 rounded-full bg-gray-700 hover:bg-gray-600 text-white opacity-50"
              >
                <Monitor className="w-6 h-6" />
              </Button>

              {/* Settings (Placeholder) */}
              <Button
                variant="secondary"
                size="lg"
                disabled
                className="w-14 h-14 rounded-full bg-gray-700 hover:bg-gray-600 text-white opacity-50"
              >
                <Settings className="w-6 h-6" />
              </Button>

              {/* Leave Call */}
              <Button
                variant="destructive"
                size="lg"
                onClick={leaveCall}
                className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white ml-4"
              >
                <PhoneOff className="w-6 h-6" />
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}