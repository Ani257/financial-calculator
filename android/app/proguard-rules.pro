# FinCalc — ProGuard / R8 rules
# These rules apply on top of proguard-android-optimize.txt.
# R8 in full-mode is safe here: the app logic runs entirely in the WebView (JS),
# so the Java/Kotlin surface that R8 touches is thin (Capacitor bridge only).

# ── Capacitor bridge ──────────────────────────────────────────────────────────
# Keep all public Capacitor plugin classes and their @PluginMethod annotated
# methods so the JS→Java bridge calls are not stripped or renamed.
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keepclassmembers class * {
    @com.getcapacitor.annotation.PluginMethod <methods>;
}

# ── Capacitor plugins bundled in this project ─────────────────────────────────
-keep class com.capacitorjs.plugins.** { *; }

# ── AndroidX / support library ────────────────────────────────────────────────
-keep class androidx.core.app.** { *; }
-keep class androidx.core.content.** { *; }

# ── WebView JavaScript interface ──────────────────────────────────────────────
# Capacitor bridges JS calls via @JavascriptInterface. Keep those methods.
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# ── Serialisation safety ──────────────────────────────────────────────────────
# Parcelable and Serializable classes must keep their field names.
-keepclassmembers class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator *;
}
-keepclassmembers class * implements java.io.Serializable {
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# ── R8 / Kotlin metadata ──────────────────────────────────────────────────────
# Keep Kotlin metadata so reflection-based libraries work correctly.
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes EnclosingMethod
-keepattributes InnerClasses

# ── Crash reporting (optional — uncomment if you add Firebase Crashlytics) ────
# -keepattributes SourceFile,LineNumberTable
# -renamesourcefileattribute SourceFile

# ── Suppress notes about reflection in the Capacitor bridge ──────────────────
-dontnote com.getcapacitor.**
-dontnote kotlin.**
-dontnote kotlinx.**
