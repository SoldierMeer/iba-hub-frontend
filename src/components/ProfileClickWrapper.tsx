'use client';

import React, { useState } from 'react';
import UserProfileModal from '@/components/UserProfileModal';

export default function ProfileClickWrapper({ 
  userId, 
  children, 
  className = '' 
}: { 
  userId: string; 
  children: React.ReactNode; 
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevents <Link> tags from firing
    e.stopPropagation(); // Stops the click from bubbling up
    if (userId) setIsOpen(true);
  };

  return (
    <>
      <div 
        onClick={handleClick} 
        className={`${className} cursor-pointer hover:opacity-80 transition-opacity`}
      >
        {children}
      </div>
      
      {isOpen && (
        <UserProfileModal 
          isOpen={isOpen} 
          onClose={() => setIsOpen(false)} 
          userId={userId} 
        />
      )}
    </>
  );
}