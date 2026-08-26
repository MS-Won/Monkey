const path = require('path');
const fs = require('fs');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const exclusionList = require('metro-config/src/defaults/exclusionList');

const defaultConfig = getDefaultConfig(__dirname);

// git worktree(.claude/worktrees/*)에서 돌릴 때는 node_modules가 없다.
// 원본 체크아웃의 node_modules를 빌려 쓴다. 평소(원본에서 실행)엔 아무 영향이 없다.
const SHARED_MODULES = path.resolve(__dirname, '../../../node_modules');
const extraModulePaths =
  !fs.existsSync(path.join(__dirname, 'node_modules')) && fs.existsSync(SHARED_MODULES)
    ? [SHARED_MODULES]
    : [];

module.exports = mergeConfig(defaultConfig, {
  watchFolders: extraModulePaths,

  resolver: {
    nodeModulesPaths: [path.join(__dirname, 'node_modules'), ...extraModulePaths],
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
