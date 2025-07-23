'use client';

import { useState, useEffect } from 'react';

export default function CompanyPage() {
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  // 初始化默认内容
  useEffect(() => {
    const defaultContent = `# 企业介绍

## 公司简介

我们是一家专注于指纹检测技术的创新企业，致力于为用户提供安全、便捷、准确的指纹识别解决方案。

## 核心业务

### 指纹检测服务
- **高精度检测**：采用先进的AI算法，检测精度达到99.9%
- **多场景应用**：支持手机解锁、门禁系统、支付验证等多种场景
- **实时处理**：毫秒级响应，用户体验流畅

### 技术优势
- **自主研发**：拥有完全自主知识产权的核心技术
- **持续创新**：每年投入大量资金用于技术研发
- **安全可靠**：通过国际安全认证，数据加密传输

## 发展历程

| 年份 | 重要里程碑 |
|------|------------|
| 2020 | 公司成立，开始指纹检测技术研发 |
| 2021 | 完成核心技术开发，获得多项专利 |
| 2022 | 产品正式上线，用户突破10万 |
| 2023 | 技术升级，检测精度提升至99.9% |
| 2024 | 用户规模突破50万，成为行业领先企业 |

## 团队介绍

我们的团队由来自顶尖高校和知名企业的技术专家组成：

- **技术团队**：拥有博士、硕士学历的研发人员占比80%
- **产品团队**：具备丰富的用户体验设计经验
- **运营团队**：深谙市场规律，善于用户运营

## 企业文化

### 使命
让每个人都能享受安全便捷的指纹识别服务

### 愿景
成为全球领先的指纹检测技术提供商

### 价值观
- **创新驱动**：持续技术创新，引领行业发展
- **用户至上**：以用户需求为中心，提供优质服务
- **诚信经营**：诚实守信，赢得用户信赖
- **团队协作**：团结协作，共同成长

---

*感谢您对我们的关注与支持！*`;

    setContent(defaultContent);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('保存中...');
    
    try {
      // 模拟保存操作
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 这里可以添加实际的保存逻辑，比如调用API
      // await fetch('/api/company', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ content })
      // });
      
      setSaveStatus('保存成功！');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      setSaveStatus('保存失败，请重试');
      setTimeout(() => setSaveStatus(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleContentChange = (e) => {
    setContent(e.target.value);
  };

  // 简单的Markdown转HTML函数
  const markdownToHtml = (text) => {
    return text
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-gray-900 mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-gray-900 mt-6 mb-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-gray-900 mt-8 mb-4">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-800 underline" target="_blank">$1</a>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded-lg my-4" />')
      .replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>')
      .replace(/^(\d+)\. (.*$)/gim, '<li class="ml-4">$2</li>')
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/^\|(.*)\|$/gim, '<tr><td class="border border-gray-300 px-4 py-2">$1</td></tr>')
      .replace(/\|/g, '</td><td class="border border-gray-300 px-4 py-2">')
      .replace(/^<tr>/gim, '<table class="border-collapse border border-gray-300 w-full my-4"><tbody>')
      .replace(/<\/tr>$/gim, '</tbody></table>')
      .replace(/^<li>/gim, '<ul class="list-disc list-inside mb-4"><li>')
      .replace(/<\/li>$/gim, '</li></ul>')
      .replace(/^<p>/gim, '<p class="mb-4 leading-relaxed">')
      .replace(/---/g, '<hr class="my-6 border-gray-300">')
      .replace(/^\*([^*]+)\*/gim, '<p class="text-gray-600 italic text-center">$1</p>');
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">企业管理</h1>
          <p className="text-gray-600">编辑企业介绍信息</p>
        </div>
        <div className="flex items-center space-x-3">
          {saveStatus && (
            <span className={`text-sm ${saveStatus.includes('成功') ? 'text-green-600' : saveStatus.includes('失败') ? 'text-red-600' : 'text-blue-600'}`}>
              {saveStatus}
            </span>
          )}
          <button 
            className={`px-6 py-2 rounded-md text-white font-medium ${
              isSaving 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>



      {/* 富文本编辑器 */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">企业介绍内容</h3>
        </div>
        <div className="p-6">
          <textarea
            className="w-full h-96 p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            value={content}
            onChange={handleContentChange}
            placeholder="请输入企业介绍内容，支持 Markdown 格式..."
          />
        </div>
      </div>

      {/* 预览区域 */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">预览效果</h3>
        </div>
        <div className="p-6">
          <div className="prose max-w-none">
            <div 
              className="markdown-preview"
              dangerouslySetInnerHTML={{
                __html: markdownToHtml(content)
              }}
              style={{ 
                lineHeight: '1.6',
                color: '#374151'
              }}
            />
          </div>
        </div>
      </div>

      {/* 底部保存按钮 */}
      <div className="flex justify-end">
        <button 
          className={`px-8 py-3 rounded-md text-white font-medium text-lg ${
            isSaving 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? '保存中...' : '保存企业介绍'}
        </button>
      </div>
    </div>
  );
} 