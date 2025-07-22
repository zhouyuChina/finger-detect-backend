import "./globals.css";

export const metadata = {
  title: "指纹检测后台管理系统",
  description: "微信小程序指纹检测后台管理系统",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
