-- 安全的生产环境数据库迁移脚本
-- 执行前请先备份数据库！

-- 1. 为 Admin 表添加 permissions 字段（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'admins' AND column_name = 'permissions'
    ) THEN
        ALTER TABLE "admins" ADD COLUMN "permissions" TEXT[] DEFAULT '{}';
        COMMENT ON COLUMN "admins"."permissions" IS '管理员路由权限列表';
    END IF;
END $$;

-- 2. 创建 system_settings 表（如果不存在）
CREATE TABLE IF NOT EXISTS "system_settings" (
    "id" TEXT NOT NULL,
    "siteName" TEXT NOT NULL DEFAULT '指纹检测后台管理系统',
    "siteDescription" TEXT NOT NULL DEFAULT '微信小程序指纹检测后台管理系统',
    "maxUploadSize" INTEGER NOT NULL DEFAULT 10,
    "sessionTimeout" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- 3. 检查并删除 system_settings 表中可能存在的旧字段
DO $$
BEGIN
    -- 删除 enableRegistration 字段
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'system_settings' AND column_name = 'enableRegistration'
    ) THEN
        ALTER TABLE "system_settings" DROP COLUMN "enableRegistration";
    END IF;

    -- 删除 enableEmailNotification 字段
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'system_settings' AND column_name = 'enableEmailNotification'
    ) THEN
        ALTER TABLE "system_settings" DROP COLUMN "enableEmailNotification";
    END IF;

    -- 删除 maintenanceMode 字段
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'system_settings' AND column_name = 'maintenanceMode'
    ) THEN
        ALTER TABLE "system_settings" DROP COLUMN "maintenanceMode";
    END IF;
END $$;

-- 4. 为所有现有的 super_admin 用户设置空的 permissions 数组（他们通过代码逻辑获得所有权限）
UPDATE "admins"
SET "permissions" = '{}'
WHERE "role" = 'super_admin' AND "permissions" IS NULL;

-- 5. 为现有的普通管理员添加所有权限（可选，根据需要调整）
-- 注意：如果你希望手动分配权限，请注释掉下面这段
UPDATE "admins"
SET "permissions" = ARRAY[
    '/dashboard',
    '/banners',
    '/news',
    '/user-ids',
    '/user-management',
    '/archives',
    '/detections',
    '/feedback',
    '/system-replies',
    '/coupons',
    '/analytics',
    '/company',
    '/settings'
]::TEXT[]
WHERE "role" != 'super_admin' AND ("permissions" IS NULL OR "permissions" = '{}');

-- 6. 插入默认系统设置（如果表为空）
INSERT INTO "system_settings" (
    "id",
    "siteName",
    "siteDescription",
    "maxUploadSize",
    "sessionTimeout",
    "createdAt",
    "updatedAt"
)
SELECT
    'default_settings',
    '指纹检测后台管理系统',
    '微信小程序指纹检测后台管理系统',
    10,
    30,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "system_settings");

-- 验证查询
SELECT 'admins 表 permissions 字段' AS check_item, COUNT(*) AS count
FROM information_schema.columns
WHERE table_name = 'admins' AND column_name = 'permissions'
UNION ALL
SELECT 'system_settings 表存在', COUNT(*)
FROM information_schema.tables
WHERE table_name = 'system_settings'
UNION ALL
SELECT '管理员数量', COUNT(*)
FROM "admins"
UNION ALL
SELECT '有权限的管理员', COUNT(*)
FROM "admins"
WHERE "permissions" IS NOT NULL AND array_length("permissions", 1) > 0;
