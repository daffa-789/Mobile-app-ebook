const isDevelopmentBuild =
  process.env.APP_VARIANT === 'development' ||
  (process.env.APP_VARIANT === undefined && process.env.NODE_ENV === 'development');

export default ({ config }) => ({
  ...config,
  plugins: (config.plugins || []).map((plugin) => {
    if (!Array.isArray(plugin) || plugin[0] !== 'expo-build-properties') return plugin;

    const [name, options = {}] = plugin;
    return [
      name,
      {
        ...options,
        android: {
          ...options.android,
          usesCleartextTraffic: isDevelopmentBuild,
        },
      },
    ];
  }),
});
