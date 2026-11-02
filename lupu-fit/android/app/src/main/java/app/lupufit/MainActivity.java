package app.lupufit;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    // Local plugins must be registered BEFORE super.onCreate (Capacitor reads the list while loading the bridge).
    registerPlugin(LocalAiPlugin.class);
    super.onCreate(savedInstanceState);
  }
}
