
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { AppleSegmentedControl } from './AppleSegmentedControl';
import { Profile } from './Profile';
import { 
  RefreshCw, 
  Plus, 
  Star, 
  Users, 
  UserCheck, 
  Trash2, 
  Copy,
  Heart,
  MessageCircle,
  MoreHorizontal
} from 'lucide-react';
import { useFriendsList, type Friend, type FriendCircle } from '@/hooks/useFriendsList';
import { toast } from 'sonner';

interface EnhancedFriendsSectionProps {
  userPubkey: string;
}

export function EnhancedFriendsSection({ userPubkey }: EnhancedFriendsSectionProps) {
  const [activeTab, setActiveTab] = useState<'favorites' | 'circles' | 'all'>('favorites');
  const [newFriendInput, setNewFriendInput] = useState('');
  const [newCircleName, setNewCircleName] = useState('');
  const [showCreateCircle, setShowCreateCircle] = useState(false);

  const { 
    friends, 
    circles, 
    circlesImIn, 
    loading, 
    syncing, 
    addFriend, 
    removeFriend, 
    syncFriendsFromNostr,
    toggleFavorite,
    createCircle,
    addFriendToCircle,
    removeFriendFromCircle,
    deleteCircle,
    getFavorites
  } = useFriendsList(userPubkey);

  const favorites = getFavorites();

  const handleAddFriend = async () => {
    if (!newFriendInput.trim()) return;
    await addFriend(newFriendInput.trim());
    setNewFriendInput('');
  };

  const handleCreateCircle = async () => {
    if (!newCircleName.trim()) return;
    await createCircle(newCircleName.trim());
    setNewCircleName('');
    setShowCreateCircle(false);
  };

  const copyNpub = (npub: string) => {
    navigator.clipboard.writeText(npub);
    toast.success('Npub copied to clipboard');
  };

  const tabs = [
    { 
      id: 'favorites', 
      label: 'Favorites', 
      icon: <Star className="w-4 h-4" />, 
      count: favorites.length 
    },
    { 
      id: 'circles', 
      label: 'Circles', 
      icon: <Users className="w-4 h-4" />, 
      count: circles.length + circlesImIn.length 
    },
    { 
      id: 'all', 
      label: 'All Friends', 
      icon: <UserCheck className="w-4 h-4" />, 
      count: friends.length 
    }
  ];

  const renderFavorites = () => (
    <div className="space-y-4">
      {favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Star className="w-12 h-12 text-gray-300 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No favorites yet</h3>
          <p className="text-gray-500 text-center max-w-sm">
            Star your closest friends to keep them easily accessible.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {favorites.map((friend, index) => (
            <div key={friend.id}>
              <div className="flex items-center gap-3 py-3">
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="flex items-center gap-3 flex-1 text-left">
                      <Avatar className="w-10 h-10 ring-1 ring-gray-200">
                        <AvatarImage src={friend.followed_picture || ''} />
                        <AvatarFallback className="bg-gray-50 text-gray-600">
                          {friend.followed_display_name?.[0] || friend.followed_name?.[0] || 'A'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                          {friend.followed_display_name || friend.followed_name || 'Anonymous'}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">
                          {friend.followed_nip05 || `${friend.followed_npub?.slice(0, 20)}...`}
                        </p>
                      </div>
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>Friend Profile</DialogTitle>
                    </DialogHeader>
                    <Profile pubkey={friend.followed_pubkey} onBack={() => {}} />
                  </DialogContent>
                </Dialog>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => toggleFavorite(friend.id)}
                  className="text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50"
                >
                  <Star className="w-4 h-4 fill-current" />
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyNpub(friend.followed_npub || '')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              {index < favorites.length - 1 && <Separator />}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCircles = () => (
    <div className="space-y-6">
      {/* My Circles Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">My Circles</h3>
          <Button
            size="sm"
            onClick={() => setShowCreateCircle(true)}
            className="bg-teal hover:bg-teal/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Circle
          </Button>
        </div>

        {showCreateCircle && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex gap-2">
              <Input
                placeholder="Circle name (e.g., Gaming Squad)"
                value={newCircleName}
                onChange={(e) => setNewCircleName(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleCreateCircle} size="sm">
                Create
              </Button>
              <Button 
                onClick={() => setShowCreateCircle(false)} 
                variant="outline" 
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {circles.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No circles created yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {circles.map((circle) => (
              <div key={circle.id} className="bg-white border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{circle.name}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      {circle.members?.length || 0} members
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteCircle(circle.id)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {circle.members && circle.members.length > 0 && (
                  <div className="flex -space-x-2">
                    {circle.members.slice(0, 5).map((member) => (
                      <Avatar key={member.id} className="w-8 h-8 ring-2 ring-white">
                        <AvatarImage src={member.followed_picture || ''} />
                        <AvatarFallback className="text-xs">
                          {member.followed_display_name?.[0] || member.followed_name?.[0] || 'A'}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {circle.members.length > 5 && (
                      <div className="w-8 h-8 bg-gray-100 ring-2 ring-white rounded-full flex items-center justify-center">
                        <span className="text-xs text-gray-600">+{circle.members.length - 5}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Circles I'm In Section */}
      {circlesImIn.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Circles I'm In</h3>
          <div className="space-y-3">
            {circlesImIn.map((circle) => (
              <div key={circle.id} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">{circle.name}</h4>
                  <span className="text-sm text-blue-600">Member</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderAllFriends = () => (
    <div className="space-y-4">
      {friends.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <UserCheck className="w-12 h-12 text-gray-300 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No friends yet</h3>
          <p className="text-gray-500 text-center max-w-sm">
            Add friends manually or sync from your Nostr follows.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {friends.map((friend, index) => (
            <div key={friend.id}>
              <div className="flex items-center gap-3 py-3">
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="flex items-center gap-3 flex-1 text-left">
                      <Avatar className="w-10 h-10 ring-1 ring-gray-200">
                        <AvatarImage src={friend.followed_picture || ''} />
                        <AvatarFallback className="bg-gray-50 text-gray-600">
                          {friend.followed_display_name?.[0] || friend.followed_name?.[0] || 'A'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                          {friend.followed_display_name || friend.followed_name || 'Anonymous'}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">
                          {friend.followed_nip05 || `${friend.followed_npub?.slice(0, 20)}...`}
                        </p>
                      </div>
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>Friend Profile</DialogTitle>
                    </DialogHeader>
                    <Profile pubkey={friend.followed_pubkey} onBack={() => {}} />
                  </DialogContent>
                </Dialog>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => toggleFavorite(friend.id)}
                  className={friend.is_favorite ? 
                    "text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50" : 
                    "text-gray-400 hover:text-yellow-500 hover:bg-yellow-50"
                  }
                >
                  <Star className={`w-4 h-4 ${friend.is_favorite ? 'fill-current' : ''}`} />
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyNpub(friend.followed_npub || '')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Copy className="w-4 h-4" />
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeFriend(friend.id)}
                  className="text-gray-400 hover:text-red-500 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              {index < friends.length - 1 && <Separator />}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'favorites':
        return renderFavorites();
      case 'circles':
        return renderCircles();
      case 'all':
        return renderAllFriends();
      default:
        return renderFavorites();
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="px-6 py-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-baseline gap-3">
            <h1 className="text-2xl font-semibold text-gray-900">Friends</h1>
            <span className="text-sm text-gray-500 font-medium">
              {friends.length} {friends.length === 1 ? 'friend' : 'friends'}
            </span>
          </div>
          <Button
            onClick={syncFriendsFromNostr}
            disabled={syncing}
            variant="outline"
            size="sm"
            className="border-gray-200 text-gray-600 hover:text-gray-900"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            Sync
          </Button>
        </div>

        {/* Add Friend Section */}
        <div className="flex gap-3 mb-6">
          <Input
            placeholder="Add friend by pubkey or npub..."
            value={newFriendInput}
            onChange={(e) => setNewFriendInput(e.target.value)}
            className="flex-1 border-gray-200 focus:border-teal focus:ring-teal/20"
          />
          <Button 
            onClick={handleAddFriend} 
            disabled={!newFriendInput.trim()}
            className="bg-teal hover:bg-teal/90 px-6"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        </div>

        {/* Apple-style Segmented Control */}
        <AppleSegmentedControl
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(tabId) => setActiveTab(tabId as 'favorites' | 'circles' | 'all')}
        />
      </div>

      {/* Tab Content */}
      <div className="px-6 pb-24">
        {loading ? (
          <div className="space-y-4 mt-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-4">
                <div className="w-10 h-10 bg-gray-100 rounded-full animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-32 animate-pulse"></div>
                  <div className="h-3 bg-gray-100 rounded w-48 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6">
            {renderTabContent()}
          </div>
        )}
      </div>
    </div>
  );
}
