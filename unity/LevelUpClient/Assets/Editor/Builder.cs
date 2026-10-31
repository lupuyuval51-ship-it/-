// UNTESTED: written without a Unity Editor. Called by `unity build ... --execute-method LevelUp.Builder.BuildWebGL`.
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEngine;

namespace LevelUp
{
    public static class Builder
    {
        public static void BuildWebGL()
        {
            var scenes = new System.Collections.Generic.List<string>();
            foreach (var s in EditorBuildSettings.scenes) if (s.enabled) scenes.Add(s.path);
            if (scenes.Count == 0) { Debug.LogError("No enabled scene in Build Settings. Add the scene with the LevelUpBridge object."); EditorApplication.Exit(2); return; }
            PlayerSettings.WebGL.compressionFormat = WebGLCompressionFormat.Disabled; // simplest to serve from Next.js
            PlayerSettings.WebGL.decompressionFallback = false;
            var opts = new BuildPlayerOptions { scenes = scenes.ToArray(), locationPathName = "Builds/levelup", target = BuildTarget.WebGL, options = BuildOptions.None };
            var report = BuildPipeline.BuildPlayer(opts);
            Debug.Log("LevelUp WebGL build: " + report.summary.result);
            EditorApplication.Exit(report.summary.result == BuildResult.Succeeded ? 0 : 1);
        }
    }
}
