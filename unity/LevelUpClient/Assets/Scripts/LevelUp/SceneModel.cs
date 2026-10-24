// UNTESTED: written without a Unity Editor. Mirrors src/lib/game/unity/scene.ts and bridge.ts (schema version 1).
using System.Collections.Generic;
using Newtonsoft.Json;

namespace LevelUp
{
    public class Box
    {
        public string id, kind, style; public float x0, x1, y0, y1, z0, z1; public bool visible, solid, walkable; public string gateId;
    }
    public class Decor { public string kind; public float x, y, z, scale, rot, rank; public bool solid; public int tint; }
    public class Station { public string stationId, kind, label; public float x, y, z, facing; }
    public class Npc { public string npcId, name, color, shape; public float x, y, z, facing; }
    public class Collectible { public string itemId, kind; public float x, y, z; }
    public class Gate { public string id; }
    public class Theme
    {
        public string skyTop, skyBottom, fog, ground, groundAlt, wall, platform, accent, accent2, sun;
        public float sunIntensity, ambient; public bool stars, clouds;
    }
    public class Prop { public string prefab; public float x, y, z, rot, scale; public string stationId; }
    public class Sign { public string stationId, text, motif; }
    public class Mood { public float bloom, vignette, fogDensity; public string colorGrade; }
    public class Director { public List<string> motifs; public Mood mood; public List<Sign> signs; public List<Prop> props; }

    public class SceneDescription
    {
        public string schema; public int version; public string title, areaId, layout, environment, timeOfDay; public bool rtl;
        public Theme theme; public List<Box> boxes; public List<Decor> decor; public List<Station> stations;
        public List<Npc> npcs; public List<Collectible> collectibles; public List<Gate> gates; public Director director;
    }

    public class PlayerFrame { public float x, y, z, yaw, speed; public bool grounded; }
    public class CameraFrame { public float x, y, z, lx, ly, lz; }
    public class NearbyRef { public string kind, id; }
    public class Frame
    {
        public float t; public PlayerFrame player; public CameraFrame camera; public NearbyRef nearby;
        public List<string> collected; public Dictionary<string, string> stations; public List<string> openGates;
    }

    public static class Json
    {
        public static T Parse<T>(string s) => JsonConvert.DeserializeObject<T>(s);
    }
}
