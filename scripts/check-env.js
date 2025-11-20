#!/usr/bin/env node

/**
 * 环境变量检查脚本
 * 用于在部署前验证环境变量配置是否正确
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 检查环境变量配置...\n');

// 检查 .env.local 文件是否存在
const envLocalPath = path.join(process.cwd(), '.env.local');
const envExamplePath = path.join(process.cwd(), '.env.example');

if (!fs.existsSync(envLocalPath)) {
  console.log('⚠️  未找到 .env.local 文件');
  console.log('💡 提示：运行以下命令创建配置文件：');
  console.log('   cp .env.example .env.local\n');
} else {
  console.log('✅ 找到 .env.local 文件\n');
}

// 检查必需的环境变量
const requiredVars = ['OPENAI_API_KEY'];
const optionalVars = ['OPENAI_BASE_URL', 'OPENAI_MODEL'];

console.log('📋 环境变量检查结果：\n');

let hasError = false;

// 检查必需变量
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`❌ ${varName}: 未设置（必填）`);
    hasError = true;
  } else {
    const maskedValue = value.substring(0, 8) + '***';
    console.log(`✅ ${varName}: ${maskedValue}`);
  }
});

// 检查可选变量
optionalVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`⚪ ${varName}: 未设置（可选）`);
  } else {
    console.log(`✅ ${varName}: ${value}`);
  }
});

console.log('\n' + '='.repeat(50));

if (hasError) {
  console.log('\n❌ 配置不完整，请设置必需的环境变量');
  console.log('\n📖 详细说明请查看：DEPLOY_ZH.md');
  process.exit(1);
} else {
  console.log('\n✅ 环境变量配置正确！');
  console.log('\n🚀 可以开始部署了！');
  console.log('\n📖 部署指南：DEPLOY_ZH.md');
  process.exit(0);
}
