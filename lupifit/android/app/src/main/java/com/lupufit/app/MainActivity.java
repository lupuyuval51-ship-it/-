package com.lupufit.app;

import android.graphics.Color;
import android.os.Bundle;
import androidx.activity.EdgeToEdge;
import androidx.activity.SystemBarStyle;
import androidx.core.splashscreen.SplashScreen;
import com.getcapacitor.BridgeActivity;

/**
 * The whole app is the web bundle in assets/public (dist/device): Capacitor's BridgeActivity hosts it in a
 * WebView. This class only adds the launch screen and the edge-to-edge window.
 */
public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // The logo on black until the WebView draws its first frame (Android 12+ system splash, compat below).
        SplashScreen.installSplashScreen(this);
        // Draw behind transparent status and navigation bars on every Android version (Android 15+ always
        // does). The page keeps its content clear of them with env(safe-area-inset-*) (Capacitor's
        // SystemBars plugin); light bar icons to start with, the page switches them with its theme.
        EdgeToEdge.enable(this, SystemBarStyle.dark(Color.TRANSPARENT), SystemBarStyle.dark(Color.TRANSPARENT));
        super.onCreate(savedInstanceState);
    }
}
