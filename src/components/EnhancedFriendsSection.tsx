import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { AppleSegmentedControl } from './AppleSegmentedControl';
import { CircleDetailView } from './CircleDetailView';
import { MemberSelector } from './MemberSelector';
import { SwipeableCard } from './SwipeableCard';
import { AvatarStack } from './AvatarStack';
import { CircleColorPicker } from './CircleColorPicker';
import { 
  RefreshCw, 
  Plus, 
  Star, 
  Users, 
  UserCheck, 
  ArrowRight,
  CircleDot
} from 'lucide-react';
import { useFriendsList, type Friend, type FriendCircle } from '@/hooks/useFriendsList';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatPubkey } from '@/lib/nostr';

interface EnhancedFriendsSectionProps {
  userPubkey: string;
}

type ViewState = 'main' | 'circle-detail' | 'member-selector';

type OnlineStatus = 'online' | 'recent' | 'offline';

const getStatus = (lastSeenAt: string | null | undefined): OnlineStatus => {
  if (!lastSeenAt) return 'offline';
  const lastSeenDate = new Date(lastSeenAt);
  const now = new Date();
  const diffMinutes = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60);

  if (diffMinutes < 15) return 'online';
  if (diffMinutes < 24 * 60) return 'recent';
  return 'offline';
};

const OnlineStatusIndicator = ({ status }: { status: OnlineStatus }) => {
  const statusConfig = {
    online: { color: 'text-green-500', label: 'Online' },
    recent: { color: 'text-yellow-500', label: 'Recently Active' },
    offline: { color: 'text-gray-400', label: 'Offline' },
  };

  if (status === 'offline') return null;

  return (
    <div className="flex items-center gap-1.5">
      <CircleDot className={`w-3.5 h-3.5 ${statusConfig[status].color}`} />
      <span className={`text-sm ${statusConfig[status].color}`}>{statusConfig[status].label}</span>
    </div>
  );
};

export function EnhancedFriendsSection({ userPubkey }: EnhancedFriendsSectionProps) {
  const [activeTab, setActiveTab] = useState<'favorites' | 'active' | 'circles' | 'all'>('favorites');
  const [newFriendInput, setNewFriendInput] = useState('');
  const [newCircleName, setNewCircleName] = useState('');
  const [newCircleColor, setNewCircleColor] = useState('#14b8a6'); // Default teal
  const [showCreateCircle, setShowCreateCircle] = useState(false);
  
  // Navigation state
  const [viewState, setViewState] = useState<ViewState>('main');
  const [selectedCircle, setSelectedCircle] = useState<FriendCircle | null>(null);

  const { 
    friends, 
    circles, 
    circlesImIn, 
    loading, 
    syncing,
    operationLoading,
    addFriend, 
    removeFriend, 
    syncFriendsFromNostr,
    toggleFavorite,
    createCircle,
    updateCircle,
    addFriendToCircle,
    removeFriendFromCircle,
    deleteCircle,
    getFavorites,
    refreshCircles
  } = useFriendsList(userPubkey);

  const favorites = getFavorites();

  const activeFriends = useMemo(() => {
    return friends
      .map(friend => ({ ...friend, status: getStatus(friend.last_seen_at) }))
      .filter(friend => friend.status !== 'offline')
      .sort((a, b) => {
        if (a.status === 'online' && b.status !== 'online') return -1;
        if (a.status !== 'online' && b.status === 'online') return 1;
        // Both recent, sort by last_seen_at
        return new Date(b.last_seen_at!).getTime() - new Date(a.last_seen_at!).getTime();
      });
  }, [friends]);

  const handleAddFriend = async () => {
    if (!newFriendInput.trim()) return;
    await addFriend(newFriendInput.trim());
    setNewFriendInput('');
  };

  const handleCreateCircle = async () => {
    if (!newCircleName.trim()) return;
    await createCircle(newCircleName.trim(), newCircleColor);
    setNewCircleName('');
    setNewCircleColor('#14b8a6');
    setShowCreateCircle(false);
  };

  const handleCircleClick = (circle: FriendCircle) => {
    setSelectedCircle(circle);
    setViewState('circle-detail');
  };

  const handleAddMembersClick = () => {
    setViewState('member-selector');
  };

  const handleAddMembersToCircle = async (memberPubkeys: string[]) => {
    if (!selectedCircle) return;

    for (const pubkey of memberPubkeys) {
      await addFriendToCircle(pubkey, selectedCircle.id);
      // Each call of addFriendToCircle handles its own user feedback via toast
    }

    // Refresh circles and update selected circle
    await refreshCircles();
    const updatedCircle = circles.find(c => c.id === selectedCircle.id);
    if (updatedCircle) {
      setSelectedCircle(updatedCircle);
    }
  };

  const handleRemoveMemberFromCircle = async (memberPubkey: string) => {
    if (!selectedCircle) return;
    await removeFriendFromCircle(memberPubkey, selectedCircle.id);
    
    // Refresh circles and update selected circle
    await refreshCircles();
    const updatedCircle = circles.find(c => c.id === selectedCircle.id);
    if (updatedCircle) {
      setSelectedCircle(updatedCircle);
    }
  };

  const handleUpdateCircle = async (circleId: string, name: string) => {
    await updateCircle(circleId, name);
    
    // Update selected circle after refresh
    const updatedCircle = circles.find(c => c.id === circleId);
    if (updatedCircle) {
      setSelectedCircle(updatedCircle);
    }
  };

  const handleBackToMain = () => {
    setViewState('main');
    setSelectedCircle(null);
  };

  const handleBackToCircleDetail = () => {
    setViewState('circle-detail');
  };

  // Render different views based on state
  if (viewState === 'circle-detail' && selectedCircle) {
    return (
      <CircleDetailView
        circle={selectedCircle}
        friends={friends}
        onBack={handleBackToMain}
        onAddMembers={handleAddMembersClick}
        onRemoveMember={handleRemoveMemberFromCircle}
        onDeleteCircle={deleteCircle}
        onUpdateCircle={handleUpdateCircle}
      />
    );
  }

  if (viewState === 'member-selector' && selectedCircle) {
    return (
      <MemberSelector
        circle={selectedCircle}
        friends={friends}
        onBack={handleBackToCircleDetail}
        onAddMembers={handleAddMembersToCircle}
        onAddNewFriend={addFriend}
      />
    );
  }

  // Main view
  const tabs = [
    { 
      id: 'favorites', 
      label: 'Favorites', 
      icon: <Star className="w-4 h-4" />, 
      count: favorites.length 
    },
    { 
      id: 'active', 
      label: 'Active', 
      icon: <CircleDot className="w-4 h-4" />,
      count: activeFriends.length 
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
        <div className="space-y-1">
          {favorites.map((friend, index) => (
            <div key={friend.id}>
              <SwipeableCard
                friend={friend}
                circles={circles}
                onToggleFavorite={toggleFavorite}
                onRemoveFriend={removeFriend}
                onAddToCircle={addFriendToCircle}
              />
              {index < favorites.length - 1 && <Separator />}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderActive = () => (
    <div className="space-y-4">
      {activeFriends.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <CircleDot className="w-12 h-12 text-gray-300 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No active friends</h3>
          <p className="text-gray-500 text-center max-w-sm">
            Friends who are online or recently active will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {activeFriends.map((friend, index) => (
            <div key={friend.id}>
              <div className="w-full bg-white p-4 text-left transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10 border">
                      <AvatarImage src={friend.followed_picture} alt={friend.followed_name} />
                      <AvatarFallback>{friend.followed_name?.charAt(0) || '?'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 truncate">{friend.followed_display_name || friend.followed_name}</div>
                      <div className="text-sm text-gray-500 truncate">{formatPubkey(friend.followed_pubkey)}</div>
                    </div>
                  </div>
                  <OnlineStatusIndicator status={friend.status as OnlineStatus} />
                </div>
              </div>
              {index < activeFriends.length - 1 && <Separator />}
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
          <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-100">
            <div className="space-y-4">
              <Input
                placeholder="Circle name (e.g., Gaming Squad)"
                value={newCircleName}
                onChange={(e) => setNewCircleName(e.target.value)}
                className="border-gray-200 focus:border-teal focus:ring-teal/20"
              />
              <CircleColorPicker
                selectedColor={newCircleColor}
                onColorSelect={setNewCircleColor}
              />
              <div className="flex gap-2">
                <Button 
                  onClick={handleCreateCircle} 
                  size="sm" 
                  className="bg-teal hover:bg-teal/90"
                  disabled={!newCircleName.trim()}
                >
                  Create
                </Button>
                <Button 
                  onClick={() => {
                    setShowCreateCircle(false);
                    setNewCircleName('');
                    setNewCircleColor('#14b8a6');
                  }} 
                  variant="outline" 
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {circles.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-100">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No circles created yet</h3>
            <p className="text-gray-500">Create your first circle to organize your friends</p>
          </div>
        ) : (
          <div className="space-y-3">
            {circles.map((circle) => (
              <button
                key={circle.id}
                onClick={() => handleCircleClick(circle)}
                className="w-full bg-white border border-gray-200 rounded-xl p-4 text-left hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm transition-all duration-200"
                style={{
                  borderLeftWidth: '4px',
                  borderLeftColor: circle.color || '#14b8a6'
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: circle.color || '#14b8a6' }}
                      />
                      <h4 className="font-semibold text-gray-900 truncate">{circle.name}</h4>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Users className="w-4 h-4" />
                        <span>{circle.members?.length || 0} members</span>
                      </div>
                      
                      {/* Enhanced Avatar Stack */}
                      {circle.members && circle.members.length > 0 && (
                        <AvatarStack 
                          members={circle.members} 
                          size="sm" 
                          maxDisplay={4}
                        />
                      )}
                    </div>
                  </div>
                  
                  <ArrowRight className="w-5 h-5 text-gray-400 ml-3 flex-shrink-0" />
                </div>
              </button>
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
              <div key={circle.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">{circle.name}</h4>
                    <span className="text-sm text-blue-600 font-medium">Member</span>
                  </div>
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
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
              <SwipeableCard
                friend={friend}
                circles={circles}
                onToggleFavorite={toggleFavorite}
                onRemoveFriend={removeFriend}
                onAddToCircle={addFriendToCircle}
              />
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
      case 'active':
        return renderActive();
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
            disabled={syncing || operationLoading}
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
            disabled={operationLoading}
          />
          <Button 
            onClick={handleAddFriend} 
            disabled={!newFriendInput.trim() || operationLoading}
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
          onTabChange={(tabId) => setActiveTab(tabId as 'favorites' | 'active' | 'circles' | 'all')}
        />
      </div>

      {/* Tab Content */}
      <div className="px-6 pb-24 overflow-y-auto">
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
