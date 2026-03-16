module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      "babel-preset-expo",
      "nativewind/babel",
    ],
    plugins: [
      [
        "module-resolver",
        {
          "root": ["./"],
          "alias": {
            "@": "./"
          },
          "extensions": [".js", ".jsx", ".ts", ".tsx", ".json"]
        }
      ],
      "react-native-reanimated/plugin",
      ...(process.env.NODE_ENV === 'production'
        ? [['transform-remove-console', { exclude: ['error', 'warn'] }]]
        : []),
    ],
  };
};
