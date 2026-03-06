const fs = require('fs');
const path = require('path');
const { withDangerousMod, withPodfile } = require('@expo/config-plugins');

function withModularHeaders(config) {
  config = withPodfile(config, (config) => {
    const podfile = Array.isArray(config.modResults)
      ? config.modResults
      : config.modResults.split('\n');

    const hasLine = podfile.some((line) => line.trim() === 'use_modular_headers!');
    if (!hasLine) {
      podfile.unshift('use_modular_headers!');
    }

    config.modResults = podfile;
    return config;
  });

  return withDangerousMod(config, [
    'android',
    async (config) => {
      const source = path.join(config.modRequest.projectRoot, 'assets', 'icon.png');
      if (!fs.existsSync(source)) {
        return config;
      }

      const targetDir = path.join(
        config.modRequest.projectRoot,
        'android',
        'app',
        'src',
        'main',
        'res',
        'drawable',
      );
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const target = path.join(targetDir, 'splashscreen_logo.png');
      fs.copyFileSync(source, target);
      return config;
    },
  ]);
}

module.exports = withModularHeaders;
