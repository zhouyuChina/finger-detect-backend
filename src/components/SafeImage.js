'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'

export default function SafeImage({ src, alt, className, fill = false, ...props }) {
  const [isClient, setIsClient] = useState(false)
  const [imageSrc, setImageSrc] = useState(src)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    setImageSrc(src)
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

  return (
    <Image
      src={imageSrc}
      alt={alt}
      className={className}
      fill={fill}
      unoptimized
      onError={(e) => {
        e.target.style.display = 'none'
      }}
      {...props}
    />
  )
} 