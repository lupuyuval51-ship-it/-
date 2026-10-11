package app.levelup.learn3d;

import android.content.res.Configuration;
import android.graphics.drawable.ColorDrawable;
import android.os.Build;
import android.os.Bundle;
import android.view.ViewGroup;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

/**
 * Native shell of the offline app. Everything the user sees is the web bundle in the WebView; this class only
 * (1) switches off WebView capabilities the app never uses and (2) fits the page between the system bars.
 *
 * Why (2): the app targets API 36. From Android 15 the system draws every app edge-to-edge (behind the status bar,
 * the gesture/navigation bar and the camera cut-out) and Android 16 removes the opt-out. Capacitor 7 does not inset
 * the WebView by default and the Android WebView does not reliably report env(safe-area-inset-*), so without this
 * the app header would sit under the status bar and the bottom controls under the gesture bar. The keyboard is
 * handled the same way, because an edge-to-edge window is no longer resized by `adjustResize`.
 * Android 14 and older keep the classic opaque system bars, so nothing is changed there.
 */
public class MainActivity extends BridgeActivity {
    /** Page background of the web app (`--color-ink-950` in src/app/globals.css): dark by default, light follows the system. */
    private static final int PAGE_DARK = 0xFF060914;
    private static final int PAGE_LIGHT = 0xFFF5F7FC;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // No WebView on the device: Capacitor has already shown its own message.
        if (getBridge() == null) return;
        WebView webView = getBridge().getWebView();
        hardenWebView(webView);
        applyPageColors(webView, isNight(getResources().getConfiguration()));
        fitSystemBars(webView);
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        // `uiMode` is handled by the activity (no restart), so follow the system light/dark switch here.
        if (getBridge() != null) applyPageColors(getBridge().getWebView(), isNight(newConfig));
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
     * Colours behind the WebView, so there is no white flash before the page paints and the strip behind the
     * transparent system bars matches the page. Light/dark icons follow the same switch (Android 15+ only: older
     * versions keep the system's own opaque bar colours, where light icons on the default bar are the readable choice).
     */
    private void applyPageColors(WebView webView, boolean night) {
        int page = night ? PAGE_DARK : PAGE_LIGHT;
        webView.setBackgroundColor(page);
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.VANILLA_ICE_CREAM) return;
        getWindow().setBackgroundDrawable(new ColorDrawable(page));
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        controller.setAppearanceLightStatusBars(!night);
        controller.setAppearanceLightNavigationBars(!night);
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
