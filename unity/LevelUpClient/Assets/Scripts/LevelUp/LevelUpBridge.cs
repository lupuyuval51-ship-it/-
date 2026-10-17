// UNTESTED: written without a Unity Editor. Attach to a GameObject named exactly "LevelUpBridge" (the page calls it by name).
using System.Runtime.InteropServices;
using UnityEngine;

namespace LevelUp
{
    public class LevelUpBridge : MonoBehaviour
    {
        const int SchemaVersion = 1;
        [DllImport("__Internal")] static extern void LevelUp_PostMessage(string json);

        public SceneBuilder builder;
        public FrameDriver driver;
        float fpsTimer; int frames;

        void Start() => Post("{\"type\":\"ready\",\"version\":\"1\"}");

        // Called from the page: unityInstance.SendMessage("LevelUpBridge", "LoadScene", json)
        public void LoadScene(string json)
        {
            try
            {
                var scene = Json.Parse<SceneDescription>(json);
                if (scene == null || scene.schema != "levelup.unity-scene" || scene.version != SchemaVersion)
                { Fail("unsupported scene version"); return; }
                builder.Build(scene);
                driver.Bind(scene, builder);
            }
            catch (System.Exception e) { Fail(e.Message); }
        }

        public void OnFrame(string json)
        {
            try { driver.Apply(Json.Parse<Frame>(json)); } catch { /* a bad frame is dropped, never fatal */ }
        }

        public void OnFx(string name) => driver.Fx(name);
        public void SetQuality(string level) { QualitySettings.SetQualityLevel(level == "high" ? 2 : 1, true); }

        void Update()
        {
            frames++; fpsTimer += Time.unscaledDeltaTime;
            if (fpsTimer < 5f) return;
            Post("{\"type\":\"stats\",\"fps\":" + (frames / fpsTimer).ToString("F1", System.Globalization.CultureInfo.InvariantCulture) + "}");
            frames = 0; fpsTimer = 0;
        }

        void Fail(string message)
        {
            var safe = message.Replace("\\", " ").Replace("\"", "'");
            Post("{\"type\":\"error\",\"message\":\"" + (safe.Length > 200 ? safe.Substring(0, 200) : safe) + "\"}");
        }

        static void Post(string json)
        {
#if UNITY_WEBGL && !UNITY_EDITOR
            LevelUp_PostMessage(json);
#else
            Debug.Log("[LevelUp] " + json);
#endif
        }
    }
}
