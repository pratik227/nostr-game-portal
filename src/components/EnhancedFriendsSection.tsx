
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { AppleSegmentedControl } from './AppleSegmentedControl';
import { CircleDetailView } from './CircleDetailView';
import { MemberSelector } from './MemberSelector';
import { SwipeableCard } from './SwipeableCard';
import { 
  RefreshCw, 
  Plus, 
  Star, 
  Users, 
  UserCheck, 
  ArrowRight
} from 'lucide-react';
import { useFriendsList, type Friend, type FriendCircle } from '@/hooks/useFriendsList';
import { toast } from 'sonner';

interface EnhancedFriendsSectionProps {
  userPubkey: string;
}

type ViewState = 'main' | 'circle-detail' | 'member-selector';

export function EnhancedFriendsSection({ userPubkey }: EnhancedFriendsSectionProps) {
  const [activeTab, setActiveTab] = useState<'favorites' | 'circles' | 'all'>('favorites');
  const [newFriendInput, setNewFriendInput] = useState('');
  const [newCircleName, setNewCircleName] = useState('');
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
              <button
                key={circle.id}
                onClick={() => handleCircleClick(circle)}
                className="w-full bg-white border rounded-lg p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">{circle.name}</h4>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Users className="w-4 h-4" />
                      <span>{circle.members?.length || 0} members</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {circle.members && circle.members.length > 0 && (
                      <div className="flex -space-x-2">
                        {circle.members.slice(0, 3).map((member) => (
                          <div key={member.id} className="w-6 h-6 bg-gray-200 rounded-full ring-2 ring-white flex items-center justify-center text-xs text-gray-600">
                            {member.followed_display_name?.[0] || member.followed_name?.[0] || 'A'}
                          </div>
                        ))}
                        {circle.members.length > 3 && (
                          <div className="w-6 h-6 bg-gray-100 ring-2 ring-white rounded-full flex items-center justify-center text-xs text-gray-500">
                            +{circle.members.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
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
          tabs={[
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
          ]}
          activeTab={activeTab}
          onTabChange={(tabId) => setActiveTab(tabId as 'favorites' | 'circles' | 'all')}
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
            {activeTab === 'favorites' && (
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
            )}

            {activeTab === 'circles' && (
              <div className="space-y-6">
                {/* My Circles Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">My Circles</h3>
                    <Button
                      size="sm"
                      onClick={() => setShowCreateCircle(true)}
                      disabled={operationLoading}
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
                          disabled={operationLoading}
                        />
                        <Button 
                          onClick={handleCreateCircle} 
                          size="sm"
                          disabled={operationLoading}
                        >
                          Create
                        </Button>
                        <Button 
                          onClick={() => setShowCreateCircle(false)} 
                          variant="outline" 
                          size="sm"
                          disabled={operationLoading}
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
                        <button
                          key={circle.id}
                          onClick={() => handleCircleClick(circle)}
                          disabled={operationLoading}
                          className="w-full bg-white border rounded-lg p-4 text-left hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 mb-1">{circle.name}</h4>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Users className="w-4 h-4" />
                                <span>{circle.members?.length || 0} members</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              {circle.members && circle.members.length > 0 && (
                                <div className="flex -space-x-2">
                                  {circle.members.slice(0, 3).map((member) => (
                                    <div key={member.id} className="w-6 h-6 bg-gray-200 rounded-full ring-2 ring-white flex items-center justify-center text-xs text-gray-600">
                                      {member.followed_display_name?.[0] || member.followed_name?.[0] || 'A'}
                                    </div>
                                  ))}
                                  {circle.members.length > 3 && (
                                    <div className="w-6 h-6 bg-gray-100 ring-2 ring-white rounded-full flex items-center justify-center text-xs text-gray-500">
                                      +{circle.members.length - 3}
                                    </div>
                                  )}
                                </div>
                              )}
                              <ArrowRight className="w-4 h-4 text-gray-400" />
                            </div>
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
            )}

            {activeTab === 'all' && (
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}
