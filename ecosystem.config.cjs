module.exports = {
  apps: [
    {
      name: 'power-master',
      script: 'src/index.js',
      env: {
        NODE_MODE: 'master',
        PORT: 3000,
        MODBUS_PORT: 5020
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true
    }
  ]
}
