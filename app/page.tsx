'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, Users, Share2, ArrowRight, Sparkles } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [roomId, setRoomId] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const createRoom = async () => {
    setIsCreating(true);
    // Generate a short, memorable room ID
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 800));
    
    router.push(`/room/${newRoomId}`);
  };

  const joinRoom = () => {
    if (roomId.trim()) {
      router.push(`/room/${roomId.trim().toUpperCase()}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      joinRoom();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
              <Video className="w-12 h-12 text-white" />
            </div>
          </div>
          
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Connect Face-to-Face
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Instantly
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-12">
            High-quality video calls with zero setup. Create a room, share the link, 
            and start connecting with anyone, anywhere.
          </p>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Account Required</h3>
              <p className="text-gray-600">Jump into conversations instantly without any registration</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                <Share2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Easy Sharing</h3>
              <p className="text-gray-600">Share room links via any messaging platform or social media</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">HD Quality</h3>
              <p className="text-gray-600">Crystal clear video and audio for the best calling experience</p>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Create Room Card */}
          <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-white to-blue-50">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full -translate-y-16 translate-x-16" />
            <CardHeader className="relative">
              <CardTitle className="flex items-center space-x-3 text-2xl">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                  <Video className="w-6 h-6 text-white" />
                </div>
                <span>Start New Call</span>
              </CardTitle>
              <CardDescription className="text-lg">
                Create a new room and invite others to join your video call
              </CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <Button 
                onClick={createRoom}
                disabled={isCreating}
                size="lg"
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                {isCreating ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating Room...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>Create Room</span>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Join Room Card */}
          <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-white to-green-50">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-full -translate-y-16 translate-x-16" />
            <CardHeader className="relative">
              <CardTitle className="flex items-center space-x-3 text-2xl">
                <div className="p-2 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <span>Join Existing Call</span>
              </CardTitle>
              <CardDescription className="text-lg">
                Enter a room ID to join an ongoing video call
              </CardDescription>
            </CardHeader>
            <CardContent className="relative space-y-4">
              <Input
                placeholder="Enter Room ID (e.g., ABC123)"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                className="h-12 text-lg font-mono tracking-wider text-center border-2 focus:border-green-500 transition-colors"
                maxLength={10}
              />
              <Button 
                onClick={joinRoom}
                disabled={!roomId.trim()}
                size="lg"
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <div className="flex items-center space-x-2">
                  <span>Join Room</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-gray-500">
          <p>Secure, private, and completely free video calling</p>
        </div>
      </div>
    </div>
  );
}