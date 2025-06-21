export interface MediaStreamConstraints {
  video: boolean | MediaTrackConstraints;
  audio: boolean | MediaTrackConstraints;
}

export interface WebRTCConfig {
  iceServers: RTCIceServer[];
}

export const DEFAULT_WEBRTC_CONFIG: WebRTCConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export const DEFAULT_MEDIA_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 },
    facingMode: 'user',
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
};

export class WebRTCPeer {
  private peerConnection: RTCPeerConnection;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private isClosed: boolean = false;

  constructor(config: WebRTCConfig = DEFAULT_WEBRTC_CONFIG) {
    this.peerConnection = new RTCPeerConnection(config);
    this.setupPeerConnection();
  }

  private setupPeerConnection(): void {
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && !this.isClosed) {
        this.onIceCandidate?.(event.candidate);
      }
    };

    this.peerConnection.ontrack = (event) => {
      if (!this.isClosed) {
        this.remoteStream = event.streams[0];
        this.onRemoteStream?.(this.remoteStream);
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      if (!this.isClosed) {
        this.onConnectionStateChange?.(this.peerConnection.connectionState);
      }
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      if (!this.isClosed) {
        this.onIceConnectionStateChange?.(this.peerConnection.iceConnectionState);
      }
    };
  }

  async getUserMedia(constraints: MediaStreamConstraints = DEFAULT_MEDIA_CONSTRAINTS): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Add tracks to peer connection only if it's not closed
      if (!this.isClosed && this.peerConnection.signalingState !== 'closed') {
        this.localStream.getTracks().forEach(track => {
          if (this.localStream && !this.isClosed && this.peerConnection.signalingState !== 'closed') {
            this.peerConnection.addTrack(track, this.localStream);
          }
        });
      }

      return this.localStream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (this.isClosed || this.peerConnection.signalingState === 'closed') {
      throw new Error('Peer connection is closed');
    }
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    return offer;
  }

  async createAnswer(): Promise<RTCSessionDescriptionInit> {
    if (this.isClosed || this.peerConnection.signalingState === 'closed') {
      throw new Error('Peer connection is closed');
    }
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return answer;
  }

  async setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void> {
    if (this.isClosed || this.peerConnection.signalingState === 'closed') {
      throw new Error('Peer connection is closed');
    }
    await this.peerConnection.setRemoteDescription(description);
  }

  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (this.isClosed || this.peerConnection.signalingState === 'closed') {
      throw new Error('Peer connection is closed');
    }
    await this.peerConnection.addIceCandidate(candidate);
  }

  toggleVideo(): boolean {
    if (this.localStream && !this.isClosed) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return videoTrack.enabled;
      }
    }
    return false;
  }

  toggleAudio(): boolean {
    if (this.localStream && !this.isClosed) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return audioTrack.enabled;
      }
    }
    return false;
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  getConnectionState(): RTCPeerConnectionState {
    return this.peerConnection.connectionState;
  }

  getIceConnectionState(): RTCIceConnectionState {
    return this.peerConnection.iceConnectionState;
  }

  close(): void {
    this.isClosed = true;
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }
    if (this.peerConnection.signalingState !== 'closed') {
      this.peerConnection.close();
    }
  }

  // Event handlers
  onIceCandidate?: (candidate: RTCIceCandidate) => void;
  onRemoteStream?: (stream: MediaStream) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  onIceConnectionStateChange?: (state: RTCIceConnectionState) => void;
}