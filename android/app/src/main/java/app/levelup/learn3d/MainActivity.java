package app.levelup.learn3d;

import android.content.res.Configuration;
import android.graphics.drawable.ColorDrawable;
import android.os.Build;
import android.os.Bundle;
import android.os.SystemClock;
import android.view.ViewGroup;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.core.graphics.ColorUtils;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;

/**
 * Native shell of the offline app. Everything the user sees is the web bundle in the WebView; this class only
 * (1) switches off WebView capabilities the app never uses, (2) fits the page between the system bars and
 * (3) survives the WebView's render process being killed (out of memory on a weak phone) instead of crashing the app.
 *
 * Why (2): the app targets API 36. From Android 15 the system draws every app edge-to-edge (behind the status bar,
 * the gesture/navigation bar and the camera cut-out) and Android 16 removes the opt-out. Capacitor 7 does not inset
 * the WebView by default and the Android WebView does not reliably report env(safe-area-inset-*), so without this
 * the app header would sit under the status bar and the bottom controls under the gesture bar. The keyboard is
 * handled the same way, because an edge-to-edge window is no longer resized by `adjustResize`.
 * Android 14 and older keep the classic opaque system bars, so nothing is changed there.
 */
public class MainActivity extends BridgeActivity {
    /**
     * Page backgrounds of the web app (`--color-ink-950` in src/app/globals.css, dark and light theme). The page refines the
     * choice at run time (mobile/src/system-bars.ts); these are the start-up colours that follow the system light/dark mode.
     * tests/unit/android-shell.test.ts checks that they still match the CSS.
     */
    private static final int PAGE_DARK = 0xFF0E1B17;
    private static final int PAGE_LIGHT = 0xFFF6F1E7;

    /** Render-process recoveries allowed per window; more than that is a crash loop and is left to the system. */
    private static final int MAX_RENDERER_RECOVERIES = 2;
    private static final long RECOVERY_WINDOW_MS = 60_000;
    private static int rendererRecoveries = 0;
    private static long recoveryWindowStart = 0;

    /** The colour the page last asked for (null until it does): it wins over the system light/dark mode. */
    private Integer pageColor = null;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(FilesPlugin.class); // before super.onCreate, which builds the bridge
        registerPlugin(SystemBarsPlugin.class);
        super.onCreate(savedInstanceState);
        // No WebView on the device: Capacitor has already shown its own message.
        if (getBridge() == null) return;
        WebView webView = getBridge().getWebView();
        hardenWebView(webView);
        recoverFromRendererLoss();
        applyPageColor(webView, isNight(getResources().getConfiguration()) ? PAGE_DARK : PAGE_LIGHT);
        fitSystemBars(webView);
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        // `uiMode` is handled by the activity (no restart): follow the system light/dark switch until the page has said what it shows.
        if (getBridge() != null && pageColor == null) applyPageColor(getBridge().getWebView(), isNight(newConfig) ? PAGE_DARK : PAGE_LIGHT);
    }

    /**
     * The WebView's render process can be killed by the system to reclaim memory (a 3D game on a weak phone, or the app in the
     * background) or can crash. Capacitor does not handle that, and an unhandled loss terminates the whole app. A WebView whose
     * renderer is gone cannot be reused, so start a fresh activity with a fresh WebView: games and progress are in local storage,
     * the user lands on the library.
     * https://developer.android.com/develop/ui/views/layout/webapps/managing-webview (Termination Handling API)
     * A renderer that keeps dying right after a restart is not retried (that would loop): it falls back to the system behaviour.
     */
    private void recoverFromRendererLoss() {
        getBridge().addWebViewListener(new WebViewListener() {
            @Override
            public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
                long now = SystemClock.elapsedRealtime();
                if (now - recoveryWindowStart > RECOVERY_WINDOW_MS) {
                    recoveryWindowStart = now;
                    rendererRecoveries = 0;
                }
                if (++rendererRecoveries > MAX_RENDERER_RECOVERIES) return false;
                runOnUiThread(MainActivity.this::recreate);
                return true;
            }
        });
    }

    /** Called (on the UI thread) by SystemBarsPlugin with the colour the page is currently showing. */
    void setPageColor(int color) {
        pageColor = color;
        if (getBridge() != null) applyPageColor(getBridge().getWebView(), color);
    }

    private static boolean isNight(Configuration configuration) {
        return (configuration.uiMode & Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES;
    }

    /** Capabilities the app never uses stay off, even if a default changes in a later WebView or Capacitor release. */
    private static void hardenWebView(WebView webView) {
        WebSettings settings = webView.getSettings();
        // The web bundle is served by Capacitor from https://localhost; nothing is ever loaded from file:// URLs.
        settings.setAllowFileAccess(false);
        // Capacitor switches this on; the app never asks for a location and holds no location permission.
        settings.setGeolocationEnabled(false);
    }

    /**
     * Colour behind the WebView, so there is no white flash before the page paints, and the strip behind the transparent
     * system bars matches the page. Light/dark icons follow the colour (Android 15+ only: older versions keep the system's
     * own opaque bar colours, where the default light icons are the readable choice).
     */
    private void applyPageColor(WebView webView, int color) {
        webView.setBackgroundColor(color);
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.VANILLA_ICE_CREAM) return;
        getWindow().setBackgroundDrawable(new ColorDrawable(color));
        boolean lightPage = ColorUtils.calculateLuminance(color) > 0.5;
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        controller.setAppearanceLightStatusBars(lightPage);
        controller.setAppearanceLightNavigationBars(lightPage);
    }

    /** Android 15+: keep the WebView out of the system bars, the cut-out and the on-screen keyboard. */
    private static void fitSystemBars(WebView webView) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.VANILLA_ICE_CREAM) return;
        ViewCompat.setOnApplyWindowInsetsListener(webView, (view, windowInsets) -> {
            Insets insets = windowInsets.getInsets(
                WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout() | WindowInsetsCompat.Type.ime()
            );
            ViewGroup.MarginLayoutParams margins = (ViewGroup.MarginLayoutParams) view.getLayoutParams();
            if (margins.leftMargin != insets.left || margins.topMargin != insets.top || margins.rightMargin != insets.right || margins.bottomMargin != insets.bottom) {
                margins.setMargins(insets.left, insets.top, insets.right, insets.bottom);
                view.setLayoutParams(margins);
            }
            // The WebView is inside the bars now; do not pass the insets on (the page must not add them a second time).
            return WindowInsetsCompat.CONSUMED;
        });
        ViewCompat.requestApplyInsets(webView);
    }
}
