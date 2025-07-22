import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          指纹检测后台管理系统
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          欢迎使用微信小程序指纹检测后台管理系统
        </p>
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
          <p className="text-gray-700">
            系统正在开发中，请先明确具体需求后再进行开发。
          </p>
        </div>
      </div>
    </div>
  );
}
