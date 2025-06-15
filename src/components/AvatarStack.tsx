
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { type Friend } from '@/hooks/useFriendsList';

interface AvatarStackProps {
  members: Friend[];
  size?: 'sm' | 'md' | 'lg';
  maxDisplay?: number;
  className?: string;
}

const sizeClasses = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm', 
  lg: 'w-12 h-12 text-base'
};

const spacingClasses = {
  sm: '-space-x-1',
  md: '-space-x-2',
  lg: '-space-x-3'
};

export function AvatarStack({ 
  members, 
  size = 'md', 
  maxDisplay = 4, 
  className = '' 
}: AvatarStackProps) {
  if (!members || members.length === 0) {
    return null;
  }

  const displayMembers = members.slice(0, maxDisplay);
  const remainingCount = Math.max(0, members.length - maxDisplay);

  const getInitials = (member: Friend) => {
    const name = member.followed_display_name || member.followed_name || 'A';
    return name.charAt(0).toUpperCase();
  };

  const getColorFromName = (name: string) => {
    const colors = [
      'bg-red-100 text-red-600',
      'bg-blue-100 text-blue-600', 
      'bg-green-100 text-green-600',
      'bg-yellow-100 text-yellow-600',
      'bg-purple-100 text-purple-600',
      'bg-pink-100 text-pink-600',
      'bg-indigo-100 text-indigo-600',
      'bg-orange-100 text-orange-600'
    ];
    
    const hash = name.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className={`flex ${spacingClasses[size]} ${className}`}>
      {displayMembers.map((member, index) => (
        <Avatar 
          key={member.id} 
          className={`${sizeClasses[size]} ring-2 ring-white shadow-sm hover:scale-110 transition-transform duration-200 relative`}
          style={{ zIndex: displayMembers.length - index }}
        >
          <AvatarImage 
            src={member.followed_picture || ''} 
            alt={member.followed_display_name || member.followed_name || 'Member'}
          />
          <AvatarFallback 
            className={`${getColorFromName(member.followed_display_name || member.followed_name || 'A')} font-medium`}
          >
            {getInitials(member)}
          </AvatarFallback>
        </Avatar>
      ))}
      
      {remainingCount > 0 && (
        <div 
          className={`${sizeClasses[size]} bg-gray-100 text-gray-600 ring-2 ring-white shadow-sm rounded-full flex items-center justify-center font-medium relative`}
          style={{ zIndex: 0 }}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}
