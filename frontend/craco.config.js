module.exports = {
  devServer: (devServerConfig) => {
    delete devServerConfig.onBeforeSetupMiddleware;
    delete devServerConfig.onAfterSetupMiddleware;

    devServerConfig.setupMiddlewares = (middlewares, devServer) => {
      const evalSourceMapMiddleware = require('react-dev-utils/evalSourceMapMiddleware');
      devServer.app.use(evalSourceMapMiddleware(devServer));

      const fs = require('fs');
      const paths = require('react-scripts/config/paths');
      if (fs.existsSync(paths.proxySetup)) {
        require(paths.proxySetup)(devServer.app);
      }

      const redirectServedPath = require('react-dev-utils/redirectServedPathMiddleware');
      const noopServiceWorkerMiddleware = require('react-dev-utils/noopServiceWorkerMiddleware');
      middlewares.push(redirectServedPath(paths.publicUrlOrPath));
      middlewares.push(noopServiceWorkerMiddleware(paths.publicUrlOrPath));

      return middlewares;
    };

    return devServerConfig;
  },
};
