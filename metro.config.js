const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const exclusionList = require('metro-config/src/defaults/exclusionList');

const defaultConfig = getDefaultConfig(__dirname);

module.exports = mergeConfig(defaultConfig, {
  resolver: {
    // ✅ 빌드 산출물(android/build, node_modules/**/android/build)을 Metro 감시/번들 대상에서 제외
    blockList: exclusionList([
      /.*\/android\/build\/.*/,
      /.*\/android\/app\/build\/.*/,
      /.*\/node_modules\/.*\/android\/build\/.*/,
      /.*\/node_modules\/react-native-gesture-handler\/android\/build\/.*/,
      /.*\/node_modules\/react-native-safe-area-context\/android\/build\/.*/,
      /.*\/node_modules\/react-native-reanimated\/android\/build\/.*/,
    ]),
  },

  watcher: {
    // ✅ Windows에서 fs.watch 불안정할 때 폴링이 안정적
    usePolling: true,
    interval: 1000,
  },
});
