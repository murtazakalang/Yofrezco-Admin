module.exports = {
  apps: [
    {
      name: "6ammart-react",
      script: "yarn",
      args: "start",
      cwd: "/www/wwwroot/yofrezco.com/yofrezco-6ammart-react-user",
      instances: 1,
      exec_mode: "fork",

      // Restart configuration
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      restart_delay: 5000,

      // Process management
      kill_timeout: 5000,
      listen_timeout: 10000,
      shutdown_with_message: false,

      // Error handling
      error_file: "~/.pm2/logs/6ammart-react-error.log",
      out_file: "~/.pm2/logs/6ammart-react-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,

      // Environment
      env: {
        NODE_ENV: "production",
        PORT: 3000
      },

      // Stop exponential backoff on restart
      exp_backoff_restart_delay: 100,
      max_memory_restart: "500M"
    }
  ]
};
