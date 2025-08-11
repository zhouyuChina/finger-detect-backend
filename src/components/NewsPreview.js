'use client'
import { useState } from 'react'
import RichTextContent from './RichTextContent'

export default function NewsPreview({ isOpen, onClose, newsData }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* 预览头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">手机端预览</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 手机模拟器 */}
        <div className="p-4">
          <div className="bg-gray-100 rounded-3xl p-2 mx-auto max-w-sm">
            <div className="bg-white rounded-2xl overflow-hidden shadow-lg">
              {/* 手机状态栏 */}
              <div className="bg-black text-white text-xs px-4 py-1 flex justify-between items-center">
                <span>9:41</span>
                <div className="flex items-center space-x-1">
                  <div className="w-4 h-2 bg-white rounded-sm"></div>
                  <div className="w-1 h-1 bg-white rounded-full"></div>
                </div>
              </div>

              {/* 新闻内容 */}
              <div className="p-4 space-y-4">
                {/* 标题 */}
                <h1 className="text-xl font-bold text-gray-900 leading-tight">
                  {newsData?.title || '新闻标题'}
                </h1>

                {/* 元信息 */}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <span>{newsData?.author || '作者'}</span>
                    <span>•</span>
                    <span>{newsData?.category || '分类'}</span>
                  </div>
                  <span>{new Date().toLocaleDateString('zh-CN')}</span>
                </div>

                {/* 置顶标记 */}
                {newsData?.isTop && (
                  <div className="bg-red-500 text-white text-xs px-2 py-1 rounded inline-block">
                    置顶
                  </div>
                )}

                {/* 封面图片 */}
                {newsData?.coverImage && (
                  <div className="w-full h-48 bg-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={newsData.coverImage}
                      alt={newsData.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* 摘要 */}
                {newsData?.summary && (
                  <div className="text-gray-600 text-sm leading-relaxed bg-gray-50 p-3 rounded-lg">
                    {newsData.summary}
                  </div>
                )}

                {/* 正文内容 */}
                <div className="text-gray-800 text-sm leading-relaxed">
                  <RichTextContent content={newsData?.content || '<p>新闻内容将在这里显示...</p>'} />
                </div>

                {/* 底部信息 */}
                <div className="border-t border-gray-200 pt-4 mt-6">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>阅读量: 0</span>
                    <span>分享</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            关闭预览
          </button>
        </div>
      </div>
    </div>
  )
}
