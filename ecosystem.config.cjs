module.exports = {
  apps: [
    {
      name: "volsim-api",
      script: "./index.js",
      watch: true,
      env: {
        PORT: process.env.PORT || 8080
      }
    }
  ]
};
