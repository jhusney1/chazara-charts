const app = require('./app');

// Port configuration
// In production: uses port 3000 (single server for API + built client)
// In development: uses port 3001, leaving 3000 for the React dev server
const PORT = process.env.PORT || (process.env.NODE_ENV === 'production' ? 3000 : 3001);

// A failure that escapes the request lifecycle should be logged loudly, not
// silently terminate the process mid-download.
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`API available at http://localhost:${PORT}/api`);
    console.log('React dev server should be running separately on port 3000');
  }
});

const shutdown = (signal) => () => {
  console.log(`${signal} received, shutting down`);
  server.close(() => process.exit(0));
};

process.on('SIGTERM', shutdown('SIGTERM'));
process.on('SIGINT', shutdown('SIGINT'));

module.exports = server;
