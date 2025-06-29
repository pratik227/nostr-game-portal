import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { AvatarStack } from './AvatarStack';
import { 
  ArrowLeft, 
  Search, 
  UserPlus,
  Check,
  Eye
} from 'lucide-react';
import { type Friend, type FriendCircle } from '@/hooks/useFriendsList';

interface MemberSelectorProps {
  circle: FriendCircle;
  friends: Friend[];
  onBack: () => void;
  onAddMembers: (memberPubkeys: string[]) => void;
  onAddNewFriend: (pubkeyOrNpub: string) => Promise<void>;
}

export function MemberSelector({
  circle,
  friends,
  onBack,
  onAddMembers,
  onAddNewFriend
}: MemberSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [newFriendInput, setNewFriendInput] = useState('');
  const [showAddNew, setShowAddNew] = useState(false);
  const [addingMembers, setAddingMembers] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Get pubkeys of people already in this circle
  const existingMemberPubkeys = useMemo(
    () =>
      new Set<string>(
        (circle.members || []).map(m => m.followed_pubkey)
      ),
    [circle.members]
  );

  // Filter to friends not already in this circle
  const availableFriends = useMemo(
    () => friends.filter(friend => !existingMemberPubkeys.has(friend.followed_pubkey)),
    [friends, existingMemberPubkeys]
  );

  // Filtered by search query
  const filteredFriends = useMemo(() => {
    if (!searchQuery) return availableFriends;
    const query = searchQuery.toLowerCase();
    return availableFriends.filter(friend =>
      friend.followed_display_name?.toLowerCase().includes(query) ||
      friend.followed_name?.toLowerCase().includes(query) ||
      friend.followed_nip05?.toLowerCase().includes(query) ||
      friend.followed_npub?.toLowerCase().includes(query)
    );
  }, [availableFriends, searchQuery]);

  // Selected for preview
  const selectedFriends = friends.filter(friend =>
    selectedMembers.has(friend.followed_pubkey)
  );
  const previewMembers = [
    ...(circle.members || []),
    ...selectedFriends
  ];

  const handleToggleMember = (pubkey: string) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(pubkey)) {
      newSelected.delete(pubkey);
    } else {
      newSelected.add(pubkey);
    }
    setSelectedMembers(newSelected);
  };

  // Handle add selected, with loading/error state
  const handleAddSelected = async () => {
    setAddingMembers(true);
    setAddError(null);
    try {
      await onAddMembers(Array.from(selectedMembers));
      setSelectedMembers(new Set());
      onBack();
    } catch (e: any) {
      setAddError(
        e?.message || 'Error adding members. Please try again.'
      );
    } finally {
      setAddingMembers(false);
    }
  };

  const handleAddNewFriend = async () => {
    if (!newFriendInput.trim()) return;
    try {
      await onAddNewFriend(newFriendInput.trim());
      setNewFriendInput('');
      setShowAddNew(false);
    } catch (error: any) {
      setAddError(error?.message || 'Could not add/follow this pubkey.');
    }
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <div 
        className="sticky top-0 bg-white border-b border-gray-100 px-4 py-4 z-10"
        style={{
          borderTopWidth: '4px',
          borderTopColor: circle.color || '#14b8a6'
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: circle.color || '#14b8a6' }}
              />
              <h1 className="text-xl font-semibold text-gray-900">Add Members</h1>
            </div>
            <p className="text-sm text-gray-500">to {circle.name}</p>
          </div>
        </div>
        {selectedMembers.size > 0 && (
          <div className="bg-teal/5 border border-teal/20 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-3">
              <Eye className="w-4 h-4 text-teal-600" />
              <span className="text-sm font-medium text-teal-800">Preview with {selectedMembers.size} new members</span>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <AvatarStack
                members={previewMembers}
                size="md"
                maxDisplay={8}
              />
              <span className="text-sm text-gray-600">
                {previewMembers.length} total members
              </span>
            </div>
          </div>
        )}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-gray-200 focus:border-teal focus:ring-teal/20"
          />
        </div>
        {addError && <div className="text-red-600 mt-2 text-sm">{addError}</div>}
      </div>
      {/* Add New Friend Section */}
      <div className="px-4 py-4 border-b border-gray-100">
        {!showAddNew ? (
          <Button
            variant="outline"
            onClick={() => setShowAddNew(true)}
            className="w-full h-12 border-2 border-dashed border-gray-300 hover:border-teal hover:bg-teal/5"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Add New Friend
          </Button>
        ) : (
          <div className="space-y-3">
            <Input
              placeholder="Enter pubkey or npub..."
              value={newFriendInput}
              onChange={(e) => setNewFriendInput(e.target.value)}
              className="flex-1 border-gray-200 focus:border-teal focus:ring-teal/20"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleAddNewFriend}
                disabled={!newFriendInput.trim()}
                className="flex-1 bg-teal hover:bg-teal/90"
              >
                Follow & Add
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddNew(false);
                  setNewFriendInput('');
                  setAddError(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
      {/* Friends List */}
      <div className="px-4 flex-1 overflow-y-auto">
        {filteredFriends.length === 0 ? (
          <div className="text-center py-12">
            <UserPlus className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {availableFriends.length === 0 ? 'All friends are already in this circle' : 'No friends found'}
            </h3>
            <p className="text-gray-500 text-center max-w-sm mx-auto">
              {availableFriends.length === 0
                ? 'Add more friends to your list to add them to circles.'
                : 'Try adjusting your search or add a new friend.'
              }
            </p>
          </div>
        ) : (
          <div className="py-4 space-y-1">
            {filteredFriends.map((friend) => (
              <div
                key={friend.id}
                className={`flex items-center gap-3 py-3 px-3 rounded-xl border-2 transition-all duration-200 ${
                  selectedMembers.has(friend.followed_pubkey)
                    ? 'border-teal bg-teal/5'
                    : 'border-transparent hover:bg-gray-50'
                }`}
              >
                <Checkbox
                  checked={selectedMembers.has(friend.followed_pubkey)}
                  onCheckedChange={() => handleToggleMember(friend.followed_pubkey)}
                  className="data-[state=checked]:bg-teal data-[state=checked]:border-teal"
                />
                <Avatar className="w-10 h-10 ring-2 ring-gray-100 shadow-sm">
                  <AvatarImage src={friend.followed_picture || ''} />
                  <AvatarFallback className="bg-gradient-to-br from-teal-50 to-blue-50 text-teal-700 font-medium">
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
              </div>
            ))}
          </div>
        )}
      </div>
      {selectedMembers.size > 0 && (
        <div className="sticky bottom-24 left-0 right-0 p-4 bg-white border-t border-gray-100">
          <Button
            onClick={handleAddSelected}
            disabled={addingMembers}
            className="w-full h-12 shadow-lg text-white"
            style={{
              backgroundColor: circle.color || '#14b8a6'
            }}
          >
            <Check className="w-5 h-5 mr-2" />
            {addingMembers ? 'Adding...' : 
              `Add ${selectedMembers.size} ${selectedMembers.size === 1 ? 'Friend' : 'Friends'}`}
          </Button>
        </div>
      )}
    </div>
  );
}
