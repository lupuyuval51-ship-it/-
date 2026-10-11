package app.levelup.learn3d;

import android.content.Intent;
import android.net.Uri;
import androidx.core.content.FileProvider;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * Lets the page hand a small text file (the backup JSON) to the user.
 *
 * Why it exists: Android's WebView has no Web Share API and ignores `<a download href="blob:...">`, so the page's
 * "Save backup file" button would silently do nothing. The page (mobile/src/native.ts) sends the text here; it is written to
 * the app's private cache and offered through Android's share sheet ("Save to Drive / Files", e-mail, messaging...). The
 * share sheet needs no storage permission, and nothing leaves the phone unless the user picks a target.
 */
@CapacitorPlugin(name = "LevelUpFiles")
public class FilesPlugin extends Plugin {
    /** A backup of many games is a few MB at most; refuse anything absurd rather than run out of memory. */
    private static final int MAX_CHARS = 20_000_000;
    private static final String DIR = "exports";

    @PluginMethod
    public void share(PluginCall call) {
        String text = call.getString("text");
        if (text == null || text.length() > MAX_CHARS) {
            call.reject("text is required (at most " + MAX_CHARS + " characters)");
            return;
        }
        String name = safeName(call.getString("name"));
        String mime = call.getString("mime", "text/plain");
        if (mime == null || !(mime.equals("application/json") || mime.startsWith("text/"))) mime = "text/plain";
        try {
            File dir = new File(getContext().getCacheDir(), DIR);
            if (!dir.isDirectory() && !dir.mkdirs()) throw new IOException("cannot create " + dir);
            // Only the latest export is kept in the cache.
            File[] old = dir.listFiles();
            if (old != null) for (File f : old) if (!f.delete()) f.deleteOnExit();
            File file = new File(dir, name);
            try (FileOutputStream out = new FileOutputStream(file)) {
                out.write(text.getBytes(StandardCharsets.UTF_8));
            }
            Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", file);
            Intent send = new Intent(Intent.ACTION_SEND);
            send.setType(mime);
            send.putExtra(Intent.EXTRA_STREAM, uri);
            send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            getActivity().startActivity(Intent.createChooser(send, null));
            call.resolve();
        } catch (IOException | RuntimeException e) {
            call.reject("could not share the file: " + e.getMessage());
        }
    }

    /** File name only: letters, digits, dot, dash, underscore; never a path, never hidden, never empty. */
    static String safeName(String requested) {
        String name = requested == null ? "" : requested.replaceAll("[^A-Za-z0-9._-]", "_");
        if (name.length() > 80) name = name.substring(0, 80);
        while (name.startsWith(".")) name = name.substring(1);
        return name.isEmpty() ? "levelup-export.txt" : name;
    }
}
