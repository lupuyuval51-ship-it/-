// UNTESTED: written without a Unity Editor. Builds the world from a scene description. Colliders are NOT created:
// movement and collisions are simulated in the browser; Unity only draws.
using System.Collections.Generic;
using UnityEngine;

namespace LevelUp
{
    public class SceneBuilder : MonoBehaviour
    {
        /// Optional prefabs by name (e.g. "Prop_Flask"). Missing names fall back to a primitive.
        public List<GameObject> propPrefabs = new List<GameObject>();
        public Material litMaterial;

        public Transform player;
        public readonly Dictionary<string, GameObject> stations = new Dictionary<string, GameObject>();
        public readonly Dictionary<string, GameObject> collectibles = new Dictionary<string, GameObject>();
        public readonly Dictionary<string, GameObject> gates = new Dictionary<string, GameObject>();
        Transform root;

        public static Color Hex(string s) => ColorUtility.TryParseHtmlString(s, out var c) ? c : Color.magenta;

        public void Build(SceneDescription s)
        {
            if (root != null) Destroy(root.gameObject);
            root = new GameObject("World_" + s.areaId).transform;
            stations.Clear(); collectibles.Clear(); gates.Clear();

            RenderSettings.ambientLight = Color.Lerp(Hex(s.theme.skyBottom), Color.white, s.theme.ambient * 0.5f);
            RenderSettings.fog = true;
            RenderSettings.fogColor = Hex(s.theme.fog);
            RenderSettings.fogDensity = s.director.mood.fogDensity;
            var sun = new GameObject("Sun").AddComponent<Light>();
            sun.type = LightType.Directional; sun.color = Hex(s.theme.sun); sun.intensity = s.theme.sunIntensity;
            sun.transform.SetParent(root); sun.transform.rotation = Quaternion.Euler(50, -30, 0);

            foreach (var b in s.boxes)
            {
                if (!b.visible) continue;
                var go = GameObject.CreatePrimitive(PrimitiveType.Cube);
                Destroy(go.GetComponent<Collider>());
                go.name = b.id; go.transform.SetParent(root);
                go.transform.position = new Vector3((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, (b.z0 + b.z1) / 2);
                go.transform.localScale = new Vector3(b.x1 - b.x0, b.y1 - b.y0, b.z1 - b.z0);
                Tint(go, b.kind == "floor" ? s.theme.ground : b.kind == "wall" ? s.theme.wall : s.theme.platform);
                if (b.gateId != null) gates[b.gateId] = go;
            }
            foreach (var st in s.stations)
            {
                var go = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
                Destroy(go.GetComponent<Collider>());
                go.name = "Station_" + st.stationId; go.transform.SetParent(root);
                go.transform.position = new Vector3(st.x, st.y + 0.5f, st.z); go.transform.localScale = new Vector3(0.9f, 0.5f, 0.9f);
                Tint(go, s.theme.accent); stations[st.stationId] = go;
            }
            foreach (var n in s.npcs) Marker(n.name, new Vector3(n.x, n.y + 0.9f, n.z), Hex(n.color), PrimitiveType.Capsule);
            foreach (var c in s.collectibles) collectibles[c.itemId] = Marker(c.itemId, new Vector3(c.x, c.y + 0.6f, c.z), Hex(s.theme.accent2), PrimitiveType.Sphere, 0.4f);

            // Director props: scenery built from the learner's material. Render-only.
            foreach (var p in s.director.props)
            {
                var prefab = propPrefabs.Find(x => x != null && x.name == p.prefab);
                var go = prefab != null ? Instantiate(prefab) : GameObject.CreatePrimitive(PrimitiveType.Cube);
                var col = go.GetComponent<Collider>(); if (col != null) Destroy(col);
                go.name = p.prefab; go.transform.SetParent(root);
                go.transform.position = new Vector3(p.x, p.y + 0.5f * p.scale, p.z);
                go.transform.rotation = Quaternion.Euler(0, p.rot * Mathf.Rad2Deg, 0);
                go.transform.localScale = Vector3.one * p.scale;
                if (prefab == null) Tint(go, s.theme.accent2);
            }
        }

        GameObject Marker(string name, Vector3 pos, Color c, PrimitiveType t, float size = 1f)
        {
            var go = GameObject.CreatePrimitive(t);
            Destroy(go.GetComponent<Collider>());
            go.name = name; go.transform.SetParent(root); go.transform.position = pos; go.transform.localScale = Vector3.one * size;
            go.GetComponent<Renderer>().material.color = c;
            return go;
        }

        void Tint(GameObject go, string hex)
        {
            var r = go.GetComponent<Renderer>();
            if (litMaterial != null) r.sharedMaterial = litMaterial;
            r.material.color = Hex(hex);
        }
    }
}
