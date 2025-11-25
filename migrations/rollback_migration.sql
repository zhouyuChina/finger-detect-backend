-- 回滚脚本 - 如果迁移出现问题，使用此脚本恢复
-- 警告：这会删除新添加的功能，但不会影响现有数据

-- 1. 从 admins 表删除 permissions 字段（可选）
-- 注意：如果你想保留权限数据，请注释掉这段
-- ALTER TABLE "admins" DROP COLUMN IF EXISTS "permissions";

-- 2. 删除 system_settings 表（可选）
-- 注意：这会删除所有系统设置数据
-- DROP TABLE IF EXISTS "system_settings";

-- 3. 仅清空管理员权限数据（保留字段结构）
UPDATE "admins" SET "permissions" = '{}' WHERE "permissions" IS NOT NULL;

-- 4. 清空系统设置数据（保留表结构）
DELETE FROM "system_settings";

-- 验证
SELECT 'admins 表记录数' AS check_item, COUNT(*) AS count FROM "admins"
UNION ALL
SELECT 'system_settings 表记录数', COUNT(*) FROM "system_settings";
