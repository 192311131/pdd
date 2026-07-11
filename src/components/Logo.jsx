import React from 'react';

export default function Logo({ size = 32, style = {} }) {
  return (
    <img 
      src="/logo.png" 
      alt="AestheticShade AI Logo" 
      width={size} 
      height={size} 
      style={{ 
        display: 'block', 
        borderRadius: '8px', 
        objectFit: 'contain',
        ...style 
      }} 
    />
  );
}
