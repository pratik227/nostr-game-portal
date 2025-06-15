
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AvatarStack } from './AvatarStack';
import { CircleColorPicker } from './CircleColorPicker';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Users,
  Edit3,
  Check,
  X
} from 'lucide-react';
import { Profile } from './Profile';
import { type Friend, type FriendCircle } from '@/hooks/useFriendsList';
import { toast } from 'sonner';

interface CircleDetailViewProps {
  circle: FriendCircle;
  friends: Friend[];
  onBack: () => void;
  onAddMembers: () => void;
  onRemoveMember: (memberPubkey: string) => void;
  onDeleteCircle: (circleId: string) => void;
  onUpdateCircle: (circleId: string, name: string, color?: string) => void;
}

export function CircleDetailView({
  circle,
  friends,
  onBack,
  onAddMembers,
  onRemoveMember,
  onDeleteCircle,
  onUpdateCircle
}: CircleDetailViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(circle.name);
  const [editColor, setEditColor] = useState(circle.color || '#14b8a6');
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);

  const handleSave = () => {
    if (editName.trim() && (editName !== circle.name || editColor !== circle.color)) {
      onUpdateCircle(circle.id, editName.trim(), editColor);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditName(circle.name);
    setEditColor(circle.color || '#14b8a6');
    setIsEditing(false);
  };

  const handleDeleteCircle = () => {
    if (window.confirm('Are you sure you want to delete this circle?')) {
      onDeleteCircle(circle.id);
      onBack();
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
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          {isEditing ? (
            <div className="flex-1 space-y-4">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="flex-1"
                placeholder="Circle name"
                autoFocus
              />
              <CircleColorPicker
                selectedColor={editColor}
                onColorSelect={setEditColor}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave}>
                  <Check className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: circle.color || '#14b8a6' }}
                />
                <h1 className="text-xl font-semibold text-gray-900 truncate">
                  {circle.name}
                </h1>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="p-1"
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteCircle}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 p-2"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
        
        {!isEditing && (
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Users className="w-4 h-4" />
              <span>{circle.members?.length || 0} members</span>
            </div>
            
            {/* Avatar Stack Preview */}
            {circle.members && circle.members.length > 0 && (
              <AvatarStack 
                members={circle.members} 
                size="md" 
                maxDisplay={5}
                className="ml-auto"
              />
            )}
          </div>
        )}
      </div>

      {/* Add Members Button */}
      <div className="px-4 py-4">
        <Button
          onClick={onAddMembers}
          className="w-full h-12"
          style={{
            backgroundColor: circle.color || '#14b8a6',
            color: 'white'
          }}
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Members
        </Button>
      </div>

      {/* Members List */}
      <div className="px-4 pb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Members</h3>
        
        {!circle.members || circle.members.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No members yet</p>
            <p className="text-sm text-gray-400 mt-1">Add friends to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {circle.members.map((member) => (
              <div key={member.id} className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-gray-50 transition-colors">
                <button
                  onClick={() => setSelectedProfile(member.followed_pubkey)}
                  className="flex items-center gap-3 flex-1 text-left"
                >
                  <Avatar className="w-12 h-12 ring-2 ring-gray-100 shadow-sm hover:ring-teal/20 hover:shadow-md transition-all duration-200">
                    <AvatarImage src={member.followed_picture || ''} />
                    <AvatarFallback className="bg-gradient-to-br from-teal-50 to-blue-50 text-teal-700 font-medium">
                      {member.followed_display_name?.[0] || member.followed_name?.[0] || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">
                      {member.followed_display_name || member.followed_name || 'Anonymous'}
                    </h4>
                    <p className="text-sm text-gray-500 truncate">
                      {member.followed_nip05 || `${member.followed_npub?.slice(0, 20)}...`}
                    </p>
                  </div>
                </button>
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (window.confirm('Remove this friend from the circle?')) {
                      onRemoveMember(member.followed_pubkey);
                    }
                  }}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 p-2 rounded-full"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Profile Dialog */}
      {selectedProfile && (
        <Dialog open={!!selectedProfile} onOpenChange={() => setSelectedProfile(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Friend Profile</DialogTitle>
            </DialogHeader>
            <Profile pubkey={selectedProfile} onBack={() => setSelectedProfile(null)} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
