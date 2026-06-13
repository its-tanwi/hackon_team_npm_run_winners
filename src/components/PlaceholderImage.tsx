import React from 'react';
import Image from 'next/image';

interface PlaceholderImageProps {
  title: string;
  width?: number;
  height?: number;
  className?: string;
}

const PlaceholderImage: React.FC<PlaceholderImageProps> = ({ 
  title, 
  width = 300, 
  height = 300, 
  className = "" 
}) => {
  // Create a simple SVG placeholder
  const svgContent = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f0f0f0"/>
      <text x="50%" y="40%" dominant-baseline="middle" text-anchor="middle" 
            font-family="Arial, sans-serif" font-size="14" fill="#666666">
        ${title.substring(0, 30)}
      </text>
      <text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" 
            font-family="Arial, sans-serif" font-size="12" fill="#999999">
        Image Not Available
      </text>
    </svg>
  `;

  const svgDataUrl = `data:image/svg+xml;base64,${btoa(svgContent)}`;

  return (
    <Image 
      src={svgDataUrl} 
      alt={`${title} - Image not available`}
      className={className}
      width={width}
      height={height}
    />
  );
};

export default PlaceholderImage;
