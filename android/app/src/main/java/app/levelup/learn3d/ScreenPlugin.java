package app.levelup.learn3d;

import android.app.Activity;
import android.view.WindowManager;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Keeps the screen on while a game is played. The Android WebView has no Screen Wake Lock API (`navigator.wakeLock`), so
 * reading a question or a story card longer than the screen timeout would turn the screen off; the page asks for this
 * instead (mobile/src/native.ts). FLAG_KEEP_SCREEN_ON needs no permission and only holds while the app is in front.
 */
@CapacitorPlugin(name = "LevelUpScreen")
public class ScreenPlugin extends Plugin {
    @PluginMethod
    public void setKeepScreenOn(PluginCall call) {
        final boolean on = Boolean.TRUE.equals(call.getBoolean("on", false));
        final Activity activity = getActivity();
        if (activity == null) {
            call.resolve();
            return;
        }
        activity.runOnUiThread(() -> {
            if (on) activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            else activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            call.resolve();
        });
    }
}
