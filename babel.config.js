module.exports = {
  presets: ['@react-native/babel-preset'], // ✅ 핵심 수정
  plugins: [
    ['module:react-native-dotenv', {
      moduleName: '@env',
      path: '.env',
    }]
  ]
};
