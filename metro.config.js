// metro.config.js
// zustand v5의 ESM 빌드(esm/middleware.mjs)는 import.meta를 사용하여
// Metro 웹 번들러와 호환되지 않습니다.
// resolveRequest로 zustand 패키지를 CJS 빌드로 강제 지정합니다.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // zustand 서브패스를 CJS 버전으로 강제 지정 (import.meta 없는 버전)
  if (moduleName === 'zustand/middleware') {
    return {
      filePath: path.resolve(__dirname, 'node_modules/zustand/middleware.js'),
      type: 'sourceFile',
    };
  }
  if (moduleName === 'zustand/shallow') {
    return {
      filePath: path.resolve(__dirname, 'node_modules/zustand/shallow.js'),
      type: 'sourceFile',
    };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
