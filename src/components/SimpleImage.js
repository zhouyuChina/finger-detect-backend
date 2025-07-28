'use client'
import { useState, useEffect } from 'react'

export default function SimpleImage({ src, alt, className, fill = false, ...props }) {
  const [isClient, setIsClient] = useState(false)
  const [imageSrc, setImageSrc] = useState(src)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    setImageSrc(src)
    setHasError(false)
  }, [src])

  // 服务端渲染时不显示图片
  if (!isClient) {
    return (
      <div 
        className={`bg-gray-200 animate-pulse ${className}`}
        style={fill ? { position: 'absolute', inset: 0 } : {}}
      />
    )
  }

  if (hasError) {
    return (
      <div 
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={fill ? { position: 'absolute', inset: 0 } : {}}
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
      onError={(e) => {
        console.error('Image load error:', imageSrc)
        setHasError(true)
      }}
      {...props}
    />
  )
} 