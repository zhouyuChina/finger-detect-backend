'use client'
import { useState, useEffect } from 'react'

export default function SimpleImage({ src, alt, className, fill = false, ...props }) {
  const [imageSrc, setImageSrc] = useState(src)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    setImageSrc(src)
    setHasError(false)
  }, [src])

  if (hasError) {
    return (
      <div
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={fill ? { position: 'absolute', inset: 0 } : {}}
        suppressHydrationWarning
      >
        <span className="text-gray-400 text-xs">图片加载失败</span>
      </div>
    )
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      style={fill ? { position: 'absolute', inset: 0, objectFit: 'cover' } : {}}
      onError={() => setHasError(true)}
      suppressHydrationWarning
      {...props}
    />
  )
}