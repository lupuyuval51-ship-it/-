package app.lupufit

import android.app.ActivityManager
import android.content.ComponentCallbacks2
import android.content.Context
import android.content.res.Configuration
import android.net.ConnectivityManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Log
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.google.ai.edge.litertlm.Backend
import com.google.ai.edge.litertlm.Content
import com.google.ai.edge.litertlm.Contents
import com.google.ai.edge.litertlm.Conversation
import com.google.ai.edge.litertlm.ConversationConfig
import com.google.ai.edge.litertlm.Engine
import com.google.ai.edge.litertlm.EngineConfig
import com.google.ai.edge.litertlm.Message
import com.google.ai.edge.litertlm.MessageCallback
import com.google.ai.edge.litertlm.SamplerConfig
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL
import java.security.MessageDigest
import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicReference

/**
 * Optional on-device LLM (Gemma 4 via LiteRT-LM). Nothing here runs unless the user explicitly downloads the model in Profile > AI.
 * The model is NEVER bundled in the AAB: it is downloaded into app-private storage (filesDir/localai), verified with SHA-256
 * and only then marked installed. All inference runs on a single background thread; the engine is created lazily and released
 * on low memory or after an idle period. Logcat tags: LocalAi (plugin), see docs/ANDROID.md.
 */
@CapacitorPlugin(name = "LocalAi")
class LocalAiPlugin : Plugin() {
    private val tag = "LocalAi"
    private val dl = Executors.newSingleThreadExecutor()
    private val gen = Executors.newSingleThreadExecutor()
    private val main = Handler(Looper.getMainLooper())
    private val stopDownload = AtomicBoolean(false)
    private val downloading = AtomicBoolean(false)
    private val generating = AtomicBoolean(false)
    private val abortGen = AtomicBoolean(false)
    private val activeConversation = AtomicReference<Conversation?>(null)
    private val engineLock = Any()
    @Volatile private var engine: Engine? = null
    @Volatile private var releaseWhenIdle = false
    @Volatile private var engineError: String? = null

    private val dir: File get() = File(context.filesDir, "localai").also { it.mkdirs() }
    private val modelFile: File get() = File(dir, "model.litertlm")
    private val partFile: File get() = File(dir, "model.litertlm.part")
    private val metaFile: File get() = File(dir, "model.json")
    private val cacheDirPath: String get() = File(context.cacheDir, "localai").also { it.mkdirs() }.absolutePath

    private val idleRelease = Runnable { releaseEngineIfIdle("idle") }
    private val callbacks = object : ComponentCallbacks2 {
        override fun onTrimMemory(level: Int) { if (level >= ComponentCallbacks2.TRIM_MEMORY_RUNNING_LOW) releaseEngineIfIdle("trim_$level") }
        override fun onConfigurationChanged(newConfig: Configuration) {}
        @Deprecated("Deprecated in Java") override fun onLowMemory() { releaseEngineIfIdle("low_memory") }
    }

    override fun load() { context.registerComponentCallbacks(callbacks) }
    override fun handleOnDestroy() {
        context.unregisterComponentCallbacks(callbacks)
        stopDownload.set(true); abortGen.set(true); activeConversation.get()?.let { runCatching { it.cancelProcess() } }
        closeEngine("destroy")
    }

    // ---- device checks ---------------------------------------------------------------------------------------------
    private fun totalRamBytes(): Long {
        val am = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        return ActivityManager.MemoryInfo().also { am.getMemoryInfo(it) }.totalMem
    }
    /** Returns null when this device can run the model, else a short human-readable reason (shown in Profile > AI). */
    private fun unsupportedReason(): String? {
        if (!Build.SUPPORTED_64_BIT_ABIS.contains("arm64-v8a")) return "This phone is not a 64-bit ARM device (arm64-v8a)."
        val ram = totalRamBytes()
        if (ram < MIN_RAM_BYTES) return "Not enough memory: ${"%.1f".format(ram / GIB)} GB found, about 6 GB needed."
        engineError?.let { return it }
        return null
    }

    private fun readMeta(): JSObject? = runCatching { if (metaFile.isFile) JSObject(metaFile.readText()) else null }.getOrNull()
    private fun isInstalled(): Boolean {
        val m = readMeta() ?: return false
        return modelFile.isFile && modelFile.length() == m.optLong("sizeBytes", -1) && m.optBoolean("verified", false)
    }

    private fun statusObject(): JSObject {
        val reason = unsupportedReason()
        val meta = readMeta()
        return JSObject().apply {
            put("installed", isInstalled())
            put("sizeBytes", if (isInstalled()) modelFile.length() else 0L)
            put("partialBytes", if (partFile.isFile) partFile.length() else 0L)
            put("modelId", meta?.optString("modelId", "") ?: "")
            put("backend", "cpu")
            put("supported", reason == null)
            put("reason", reason ?: "")
            put("freeBytes", dir.usableSpace)
            put("totalRamBytes", totalRamBytes())
            put("downloading", downloading.get())
            put("loaded", engine != null)
        }
    }

    @PluginMethod fun status(call: PluginCall) { call.resolve(statusObject()) }

    // ---- download ----------------------------------------------------------------------------------------------------
    private fun emitProgress(phase: String, received: Long, total: Long, error: String? = null) {
        notifyListeners("downloadProgress", JSObject().apply { put("phase", phase); put("receivedBytes", received); put("totalBytes", total); if (error != null) put("error", error) })
    }

    private fun onUnmetered(): Boolean {
        val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        return cm.activeNetwork != null && !cm.isActiveNetworkMetered
    }

    @PluginMethod
    fun download(call: PluginCall) {
        val url = call.getString("url") ?: return call.reject("url required", "bad_request")
        val sha = (call.getString("sha256") ?: "").lowercase()
        val size = call.getLong("sizeBytes", 0L) ?: 0L
        val wifiOnly = call.getBoolean("wifiOnly", true) ?: true
        val modelId = call.getString("modelId") ?: "gemma-4-E2B-it"
        if (!url.startsWith("https://")) return call.reject("Only https downloads are allowed", "bad_request")
        if (!Regex("^[0-9a-f]{64}$").matches(sha)) return call.reject("sha256 (64 hex chars) is required", "bad_request")
        if (size < 1_000_000L) return call.reject("sizeBytes is required", "bad_request")
        unsupportedReason()?.let { return call.reject(it, "unsupported") }
        if (isInstalled()) return call.resolve(statusObject())
        if (!downloading.compareAndSet(false, true)) return call.reject("Download already running", "busy")
        stopDownload.set(false)
        dl.execute {
            try {
                runDownload(url, sha, size, wifiOnly, modelId)
                call.resolve(statusObject())
            } catch (e: DownloadError) {
                Log.w(tag, "download stopped: ${e.code}")
                emitProgress(if (e.code == "cancelled") "cancelled" else "error", if (partFile.isFile) partFile.length() else 0L, size, e.code)
                call.reject(e.message ?: e.code, e.code)
            } catch (e: Exception) {
                Log.w(tag, "download failed: ${e.javaClass.simpleName}")
                emitProgress("error", if (partFile.isFile) partFile.length() else 0L, size, "network")
                call.reject("Download failed", "network")
            } finally { downloading.set(false) }
        }
    }

    private class DownloadError(val code: String, msg: String) : Exception(msg)

    private fun runDownload(url: String, sha: String, size: Long, wifiOnly: Boolean, modelId: String) {
        val have0 = if (partFile.isFile) partFile.length() else 0L
        if (have0 > size) partFile.delete()
        val need = ((size - (if (partFile.isFile) partFile.length() else 0L)) * 1.2).toLong().coerceAtLeast(0L)
        if (dir.usableSpace < need) throw DownloadError("no_space", "Not enough free storage: ${"%.1f".format(need / GIB)} GB needed.")
        var attempts = 0
        while (true) {
            if (partFile.length() >= size && partFile.isFile) break
            try {
                fetchRange(url, size, wifiOnly)
                break
            } catch (e: IOException) {
                if (stopDownload.get()) throw DownloadError("cancelled", "Cancelled")
                attempts++
                Log.w(tag, "network error, attempt $attempts: ${e.javaClass.simpleName}")
                if (attempts >= 3) throw DownloadError("network", "Network error; progress is kept, tap download again to resume.")
                Thread.sleep(1500L * attempts)
            }
        }
        if (stopDownload.get()) throw DownloadError("cancelled", "Cancelled")
        if (partFile.length() != size) { partFile.delete(); throw DownloadError("size_mismatch", "Downloaded size does not match; please try again.") }
        // Verify BEFORE marking installed.
        val md = MessageDigest.getInstance("SHA-256")
        var done = 0L; var last = 0L
        partFile.inputStream().use { ins ->
            val buf = ByteArray(1 shl 20)
            while (true) {
                if (stopDownload.get()) throw DownloadError("cancelled", "Cancelled")
                val n = ins.read(buf); if (n < 0) break
                md.update(buf, 0, n); done += n
                val now = System.currentTimeMillis()
                if (now - last > 400) { last = now; emitProgress("verifying", done, size) }
            }
        }
        val actual = md.digest().joinToString("") { "%02x".format(it) }
        if (actual != sha) { partFile.delete(); throw DownloadError("sha_mismatch", "The file did not match the expected checksum and was removed.") }
        modelFile.delete()
        if (!partFile.renameTo(modelFile)) throw DownloadError("io", "Could not store the model.")
        metaFile.writeText(JSObject().apply { put("modelId", modelId); put("sizeBytes", size); put("sha256", sha); put("verified", true); put("host", runCatching { URL(url).host }.getOrDefault("")) }.toString())
        emitProgress("done", size, size)
        Log.i(tag, "model installed (${size} bytes, sha256 verified)")
    }

    /** One resumable HTTP pass: Range from the current partial length; follows up to 5 redirects manually (https only). */
    private fun fetchRange(startUrl: String, size: Long, wifiOnly: Boolean) {
        var existing = if (partFile.isFile) partFile.length() else 0L
        var u = startUrl
        var conn: HttpURLConnection? = null
        try {
            for (hop in 0..5) {
                if (!u.startsWith("https://")) throw IOException("redirect to non-https")
                val c = URL(u).openConnection() as HttpURLConnection
                c.instanceFollowRedirects = false; c.connectTimeout = 20_000; c.readTimeout = 30_000
                c.setRequestProperty("User-Agent", "LUPU-FIT-Android"); c.setRequestProperty("Accept-Encoding", "identity")
                if (existing > 0) c.setRequestProperty("Range", "bytes=$existing-")
                val code = c.responseCode
                if (code in 301..308 && code != 304) { val loc = c.getHeaderField("Location") ?: throw IOException("redirect without location"); c.disconnect(); u = URL(URL(u), loc).toString(); continue }
                conn = c; break
            }
            val c = conn ?: throw IOException("too many redirects")
            when (c.responseCode) {
                200 -> { if (existing > 0) { partFile.delete(); existing = 0 } } // server ignored Range: restart cleanly
                206 -> {
                    val cr = c.getHeaderField("Content-Range") ?: ""
                    if (!cr.startsWith("bytes $existing-")) { partFile.delete(); throw IOException("unexpected Content-Range") }
                }
                416 -> { partFile.delete(); throw IOException("range not satisfiable") }
                else -> throw IOException("http ${c.responseCode}")
            }
            val len = c.contentLengthLong
            if (len > 0 && existing + len != size) { partFile.delete(); throw DownloadError("size_mismatch", "Server file size differs from the expected size (${existing + len} vs $size).") }
            var received = existing; var last = 0L; var lastNet = 0L
            FileOutputStream(partFile, existing > 0).use { out ->
                c.inputStream.use { ins ->
                    val buf = ByteArray(256 * 1024)
                    while (true) {
                        if (stopDownload.get()) throw DownloadError("cancelled", "Cancelled")
                        val now = System.currentTimeMillis()
                        if (wifiOnly && now - lastNet > 2000) { lastNet = now; if (!onUnmetered()) throw DownloadError("wifi_required", "Paused: waiting for Wi-Fi.") }
                        val n = ins.read(buf); if (n < 0) break
                        out.write(buf, 0, n); received += n
                        if (now - last > 400) { last = now; emitProgress("downloading", received, size) }
                    }
                }
            }
            emitProgress("downloading", received, size)
        } finally { conn?.disconnect() }
    }

    @PluginMethod fun cancelDownload(call: PluginCall) { stopDownload.set(true); call.resolve() }

    @PluginMethod
    fun delete(call: PluginCall) {
        stopDownload.set(true); abortGen.set(true); activeConversation.get()?.let { runCatching { it.cancelProcess() } }
        gen.execute {
            closeEngine("delete")
            dl.execute { // wait behind a running download so we never delete a file it is still writing
                modelFile.delete(); partFile.delete(); metaFile.delete()
                File(context.cacheDir, "localai").deleteRecursively()
                call.resolve(statusObject())
            }
        }
    }

    // ---- engine lifecycle ----------------------------------------------------------------------------------------------
    private fun closeEngine(why: String) {
        synchronized(engineLock) { engine?.let { runCatching { it.close() }; Log.i(tag, "engine released ($why)") }; engine = null }
    }
    private fun releaseEngineIfIdle(why: String) {
        if (generating.get()) { releaseWhenIdle = true; return }
        gen.execute { if (!generating.get()) closeEngine(why) }
    }
    private fun getEngine(): Engine {
        synchronized(engineLock) {
            engine?.let { return it }
            if (!isInstalled()) throw IllegalStateException("not_installed")
            val t0 = System.currentTimeMillis()
            try {
                val e = Engine(EngineConfig(modelPath = modelFile.absolutePath, backend = Backend.CPU(), maxNumTokens = MAX_CONTEXT_TOKENS, cacheDir = cacheDirPath))
                e.initialize()
                engine = e
                Log.i(tag, "engine ready in ${System.currentTimeMillis() - t0} ms (cpu)")
                return e
            } catch (t: Throwable) { // includes UnsatisfiedLinkError / LiteRtLmJniException / OOM
                Log.e(tag, "engine init failed: ${t.javaClass.simpleName}")
                if (t is UnsatisfiedLinkError || t is NoClassDefFoundError) engineError = "The on-device AI runtime cannot load on this phone."
                throw IllegalStateException("engine_init_failed")
            }
        }
    }

    // ---- generation ----------------------------------------------------------------------------------------------------
    private fun textOf(m: Message): String = m.contents.contents.filterIsInstance<Content.Text>().joinToString("") { it.text }

    @PluginMethod
    fun generate(call: PluginCall) {
        val system = call.getString("system") ?: ""
        val msgs = call.getArray("messages") ?: JSArray()
        val maxTokens = (call.getInt("maxTokens", 320) ?: 320).coerceIn(16, 1024)
        val json = call.getBoolean("json", false) ?: false
        val stream = call.getBoolean("stream", false) ?: false
        val reqId = call.getString("requestId") ?: ""
        unsupportedReason()?.let { return call.reject(it, "unsupported") }
        if (!isInstalled()) return call.reject("Model not installed", "not_installed")
        if (!generating.compareAndSet(false, true)) return call.reject("Another generation is running", "busy")
        abortGen.set(false)
        // Merge consecutive same-role turns and drop leading assistant turns (Gemma templates expect alternating roles).
        val turns = ArrayList<Pair<String, String>>()
        for (i in 0 until msgs.length()) {
            val o = msgs.getJSONObject(i); val role = if (o.optString("role") == "assistant") "model" else "user"; val text = o.optString("content")
            if (turns.isEmpty() && role == "model") continue
            if (turns.isNotEmpty() && turns.last().first == role) turns[turns.size - 1] = role to (turns.last().second + "\n" + text) else turns.add(role to text)
        }
        if (turns.isEmpty() || turns.last().first != "user") { generating.set(false); return call.reject("Last message must come from the user", "bad_request") }
        gen.execute {
            var conv: Conversation? = null
            try {
                val t0 = System.currentTimeMillis()
                val eng = getEngine()
                main.removeCallbacks(idleRelease)
                val sys = if (json) "$system\n\nRespond with a single valid JSON value only, no markdown fences, no commentary." else system
                val initial = turns.dropLast(1).map { if (it.first == "user") Message.user(it.second) else Message.model(it.second) }
                val cfg = ConversationConfig(
                    systemInstruction = Contents.of(sys), initialMessages = initial,
                    samplerConfig = SamplerConfig(topK = 40, topP = 0.95, temperature = if (json) 0.2 else 0.6, seed = 0),
                    maxOutputToken = maxTokens,
                )
                conv = eng.createConversation(cfg); activeConversation.set(conv)
                if (abortGen.get()) throw IllegalStateException("aborted")
                val sb = StringBuilder(); val latch = CountDownLatch(1); val err = AtomicReference<Throwable?>(null)
                var first = 0L; var chunks = 0; val charCap = maxTokens * 6
                conv.sendMessageAsync(turns.last().second, object : MessageCallback {
                    override fun onMessage(message: Message) {
                        val piece = textOf(message); if (piece.isEmpty()) return
                        if (first == 0L) first = System.currentTimeMillis() - t0
                        sb.append(piece); chunks++
                        if (stream) notifyListeners("token", JSObject().apply { put("requestId", reqId); put("text", piece) })
                        if (chunks >= maxTokens || sb.length >= charCap) runCatching { activeConversation.get()?.cancelProcess() } // hard cap
                    }
                    override fun onDone() { latch.countDown() }
                    override fun onError(throwable: Throwable) { err.set(throwable); latch.countDown() }
                })
                if (!latch.await(GEN_TIMEOUT_S, TimeUnit.SECONDS)) { runCatching { conv.cancelProcess() }; throw IllegalStateException("timeout") }
                if (abortGen.get()) throw IllegalStateException("aborted")
                val capped = chunks >= maxTokens || sb.length >= charCap
                val e = err.get(); if (e != null && !capped) throw IllegalStateException("generation_failed")
                Log.i(tag, "generated ${sb.length} chars, first token ${first} ms, total ${System.currentTimeMillis() - t0} ms")
                call.resolve(JSObject().apply { put("text", sb.toString().trim()); put("backend", "cpu"); put("firstTokenMs", first); put("truncated", capped) })
            } catch (t: Throwable) {
                val code = when ((t as? IllegalStateException)?.message) { "aborted" -> "aborted"; "timeout" -> "timeout"; "not_installed" -> "not_installed"; "engine_init_failed" -> "engine_init_failed"; else -> "generation_failed" }
                Log.w(tag, "generate failed: $code (${t.javaClass.simpleName})")
                if (t is OutOfMemoryError) closeEngine("oom")
                call.reject(code, code)
            } finally {
                activeConversation.set(null); runCatching { conv?.close() }
                generating.set(false)
                if (releaseWhenIdle) { releaseWhenIdle = false; closeEngine("deferred_release") }
                else main.postDelayed(idleRelease, IDLE_RELEASE_MS)
            }
        }
    }

    @PluginMethod
    fun abort(call: PluginCall) {
        abortGen.set(true)
        activeConversation.get()?.let { runCatching { it.cancelProcess() } }
        call.resolve()
    }

    companion object {
        private const val GIB = 1024.0 * 1024.0 * 1024.0
        /** ActivityManager reports slightly less than the marketing size: a "6 GB" phone shows ~5.4-5.7 GiB. */
        private const val MIN_RAM_BYTES = 5L * 1024 * 1024 * 1024 + 512L * 1024 * 1024
        private const val MAX_CONTEXT_TOKENS = 4096
        private const val GEN_TIMEOUT_S = 180L
        private const val IDLE_RELEASE_MS = 3 * 60 * 1000L
    }
}
