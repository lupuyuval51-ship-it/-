// UNTESTED: written without a Unity Editor. Applies display-only frames from the page (positions + progress flags).
using UnityEngine;

namespace LevelUp
{
    public class FrameDriver : MonoBehaviour
    {
        public Camera cam;
        public Transform playerAvatar;
        SceneBuilder builder;
        Vector3 targetPos; float targetYaw;

        public void Bind(SceneDescription scene, SceneBuilder b)
        {
            builder = b;
            targetPos = Vector3.zero;
        }

        public void Apply(Frame f)
        {
            if (f == null || f.player == null || f.camera == null) return;
            targetPos = new Vector3(f.player.x, f.player.y, f.player.z);
            targetYaw = f.player.yaw * Mathf.Rad2Deg;
            cam.transform.position = new Vector3(f.camera.x, f.camera.y, f.camera.z);
            cam.transform.LookAt(new Vector3(f.camera.lx, f.camera.ly, f.camera.lz));

            if (f.collected != null) foreach (var id in f.collected) if (builder.collectibles.TryGetValue(id, out var go) && go != null) go.SetActive(false);
            if (f.openGates != null) foreach (var id in f.openGates) if (builder.gates.TryGetValue(id, out var g) && g != null) g.SetActive(false);
            if (f.stations != null)
                foreach (var kv in f.stations)
                    if (builder.stations.TryGetValue(kv.Key, out var st))
                        st.GetComponent<Renderer>().material.color = kv.Value == "done" ? Color.green : kv.Value == "locked" ? Color.gray : SceneBuilder.Hex("#ffd166");
        }

        public void Fx(string name) { /* hook particles / post-processing here */ }

        void Update()
        {
            if (playerAvatar == null) return;
            playerAvatar.position = Vector3.Lerp(playerAvatar.position, targetPos, 1 - Mathf.Exp(-Time.deltaTime * 20f));
            playerAvatar.rotation = Quaternion.Euler(0, targetYaw, 0);
        }
    }
}
