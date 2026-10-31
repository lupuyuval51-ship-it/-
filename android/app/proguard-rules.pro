# R8 rules for the release build (minifyEnabled + shrinkResources in app/build.gradle). AGP adds its own defaults
# (proguard-android-optimize.txt: @JavascriptInterface methods, enums, Parcelables, ...), the keep rules generated from the
# manifest (MainActivity, FileProvider, ...) and each library's consumer rules.
#
# Capacitor finds plugins by name (assets/capacitor.plugins.json -> Class.forName) and calls their @PluginMethod methods by
# reflection. capacitor-android ships consumer rules for plugin classes (@CapacitorPlugin / extends Plugin); the rules below
# are a safety net around everything Capacitor reflects on, so a plugin added later (npm install @capacitor/...) cannot
# break only in the release build.

# Annotations, generics and inner-class info are read at runtime by the plugin loader.
-keepattributes *Annotation*, Signature, InnerClasses, EnclosingMethod

# Capacitor core and the official plugins (@capacitor/app, @capacitor/haptics, ...). Small; keeping them whole costs a few
# hundred KB and removes a class of "works in debug, crashes in release" bugs.
-keep class com.getcapacitor.** { *; }
-keep class com.capacitorjs.plugins.** { *; }

# Cordova bridge classes that Capacitor still carries (no Cordova plugins are installed).
-keep class org.apache.cordova.** { *; }

# Readable Play Console crash reports: keep file names and line numbers; the AAB carries the mapping file.
-keepattributes SourceFile, LineNumberTable
-renamesourcefileattribute SourceFile
