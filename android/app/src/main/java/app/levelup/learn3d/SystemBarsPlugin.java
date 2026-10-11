package app.levelup.learn3d;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.regex.Pattern;

/**
 * The page tells the shell which colour it is showing (it changes with the in-app theme, the system light/dark mode and the
 * always-dark 3D play screen), so the strip behind the transparent system bars matches and the status/navigation bar icons
 * stay readable. Android 15+ only; see MainActivity.setPageColor.
 */
@CapacitorPlugin(name = "LevelUpSystemBars")
public class SystemBarsPlugin extends Plugin {
    private static final Pattern HEX = Pattern.compile("^#[0-9A-Fa-f]{6}$");

    @PluginMethod
    public void setPageColor(PluginCall call) {
        String hex = call.getString("color");
        if (hex == null || !HEX.matcher(hex).matches()) {
            call.reject("color must look like #rrggbb");
            return;
        }
        if (!(getActivity() instanceof MainActivity)) {
            call.resolve();
            return;
        }
        final MainActivity activity = (MainActivity) getActivity();
        final int color = 0xFF000000 | Integer.parseInt(hex.substring(1), 16);
        activity.runOnUiThread(() -> {
            activity.setPageColor(color);
            call.resolve();
        });
    }
}
