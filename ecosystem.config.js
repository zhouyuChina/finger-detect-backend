module.exports = {
  apps: [
    {
      name: 'finger-detect-backend',
      script: 'npm',
      args: 'start',
      cwd: '/www/wwwroot/finger-detect-backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    }
  ]
}; 