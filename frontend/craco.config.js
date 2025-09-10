const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Deshabilitar source maps para paquetes de node_modules problemáticos
      webpackConfig.module.rules.push({
        test: /\.js$/,
        enforce: 'pre',
        use: ['source-map-loader'],
        exclude: [
          // Excluir paquetes de Supabase que causan problemas
          /node_modules\/@supabase/,
        ],
      });

      // Configuración adicional para ignorar source maps problemáticos
      webpackConfig.ignoreWarnings = [
        /Failed to parse source map/,
        /ENOENT: no such file or directory/,
        /Unexpected end of JSON input/,
      ];

      return webpackConfig;
    },
  },
};
