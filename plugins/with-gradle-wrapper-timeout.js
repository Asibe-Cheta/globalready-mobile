const fs = require("fs");
const path = require("path");
const { withDangerousMod } = require("@expo/config-plugins");

module.exports = function withGradleWrapperTimeout(config) {
  return withDangerousMod(config, [
    "android",
    async (modConfig) => {
      const wrapperPath = path.join(
        modConfig.modRequest.platformProjectRoot,
        "gradle",
        "wrapper",
        "gradle-wrapper.properties"
      );

      if (!fs.existsSync(wrapperPath)) {
        return modConfig;
      }

      const content = fs.readFileSync(wrapperPath, "utf8");
      let updated = content;

      if (updated.includes("networkTimeout=")) {
        updated = updated.replace(/networkTimeout=\d+/g, "networkTimeout=120000");
      } else {
        updated += "\nnetworkTimeout=120000\n";
      }

      if (updated !== content) {
        fs.writeFileSync(wrapperPath, updated);
      }

      return modConfig;
    },
  ]);
};
