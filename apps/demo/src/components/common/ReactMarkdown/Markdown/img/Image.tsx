import React, { useState } from 'react';
import i18n from '@/i18n';

const MdImage = ({
  src,
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement>) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [renderSrc, setRenderSrc] = useState(src);

  if (src?.includes('base64') && !src.startsWith('data:image')) {
    return <span>Invalid base64 image</span>;
  }

  if (props.alt?.startsWith('OFFIACCOUNT_MEDIA')) {
    return <span>{i18n.t('components:markdown.wechatImage')}</span>;
  }

  return (
    <span
      className={`block relative min-w-[120px] min-h-[120px] my-1 mx-auto max-h-[500px] rounded-md overflow-hidden ${!isLoaded ? 'bg-gray-200 animate-pulse' : ''}`}
    >
      <img
        className={`w-full h-full object-contain ${!isLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        src={renderSrc}
        alt={props.alt || ''}
        loading="lazy"
        referrerPolicy="no-referrer"
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          setRenderSrc('/imgs/errImg.png');
          setIsLoaded(true);
        }}
        draggable={false}
        {...props}
      />
    </span>
  );
};

export default MdImage;
