import React from 'react';
import { Image, ImageProps } from 'expo-image';

interface OptimizedImageProps extends Omit<ImageProps, 'source'> {
  source: string | { uri: string };
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  source,
  style,
  ...props
}) => {
  const imageSource =
    typeof source === 'string' ? { uri: source } : source;

  return (
    <Image
      source={imageSource}
      style={style}
      contentFit="cover"
      transition={200}
      cachePolicy="memory-disk"
      {...props}
    />
  );
};
