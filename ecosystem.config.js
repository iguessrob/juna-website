module.exports = {
  apps: [
    {
      name: "juna-website",
      // If using Next.js standalone build:
      script: ".next/standalone/server.js",
      // If using standard next start:
      // script: "node_modules/next/dist/bin/next",
      // args: "start -p 80",
      instances: "max", // or 1 for t2.micro/t3.micro
      exec_mode: "cluster",
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 80, // Binds port 80 directly (requires setcap or authbind on Linux)
      },
      env_development: {
        NODE_ENV: "development",
        PORT: 3000,
      },
    },
  ],
};
