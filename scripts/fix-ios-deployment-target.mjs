#!/usr/bin/env node
/**
 * Raise the iOS deployment target of the generated Capacitor project.
 *
 * Capacitor 7's template defaults pods + the app target to iOS 14.0, but
 * recent Xcode (26/27) only supports 15.0+, which produces a wall of
 * "deployment target 14.0 ... supported range is 15.0 to 27.x" warnings.
 *
 * This script is idempotent and safe to run after every `cap add ios` /
 * `cap sync ios`. It does two things:
 *   1. Bumps IPHONEOS_DEPLOYMENT_TARGET in ios/App/App.xcodeproj.
 *   2. Adds (or updates) a Podfile `post_install` hook that forces the same
 *      target onto every CocoaPods dependency, then reinstalls pods.
 *
 * Run automatically via `npm run ios`, or manually: `node scripts/fix-ios-deployment-target.mjs`
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const TARGET = "15.1";
const projectFile = "ios/App/App.xcodeproj/project.pbxproj";
const podfile = "ios/App/Podfile";

if (!existsSync("ios/App")) {
  console.error("✗ ios/App not found. Run `npx cap add ios` first.");
  process.exit(1);
}

// 1) Bump every IPHONEOS_DEPLOYMENT_TARGET in the Xcode project file.
if (existsSync(projectFile)) {
  const original = readFileSync(projectFile, "utf8");
  const patched = original.replace(
    /IPHONEOS_DEPLOYMENT_TARGET = [\d.]+;/g,
    `IPHONEOS_DEPLOYMENT_TARGET = ${TARGET};`,
  );
  if (patched !== original) {
    writeFileSync(projectFile, patched);
    console.log(`✓ Set app deployment target to iOS ${TARGET} in project.pbxproj`);
  } else {
    console.log("• App project already at the target version.");
  }
}

// 2) Ensure the Podfile has a post_install hook pinning pods to the target.
if (existsSync(podfile)) {
  let contents = readFileSync(podfile, "utf8");
  const marker = "# winkpop:deployment-target";

  if (!contents.includes(marker)) {
    const hook = `
post_install do |installer|
  ${marker}
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${TARGET}'
    end
  end
  # Keep Capacitor's own assertions happy if it also defines a hook.
  assertDeploymentTarget(installer) if defined?(assertDeploymentTarget)
end
`;
    // Capacitor's template may already define a post_install block; if so,
    // we leave it and append ours is not valid (only one allowed). Detect it.
    if (/post_install do \|installer\|/.test(contents)) {
      // Inject our per-target loop just inside the existing block.
      contents = contents.replace(
        /post_install do \|installer\|\n/,
        `post_install do |installer|\n  ${marker}\n  installer.pods_project.targets.each do |t|\n    t.build_configurations.each do |c|\n      c.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${TARGET}'\n    end\n  end\n`,
      );
    } else {
      contents = contents.trimEnd() + "\n" + hook;
    }
    writeFileSync(podfile, contents);
    console.log(`✓ Added post_install hook pinning pods to iOS ${TARGET}`);
  } else {
    console.log("• Podfile already patched.");
  }

  // 3) Reinstall pods so the change takes effect.
  try {
    console.log("• Running pod install …");
    execSync("pod install", { cwd: "ios/App", stdio: "inherit" });
  } catch {
    console.warn("⚠ `pod install` failed or CocoaPods not found. Run it manually:");
    console.warn("    cd ios/App && pod install");
  }
}

console.log("✓ iOS deployment target fix complete.");
