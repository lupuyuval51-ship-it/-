import java.util.Properties

plugins {
    id("com.android.application")
}

// Values come from ../twa.properties; any of them can be overridden with -Ptwa.<name>=value.
val twa = Properties().apply { rootProject.file("twa.properties").inputStream().use { load(it) } }
fun twaValue(name: String): String = (project.findProperty("twa.$name") as String?) ?: twa.getProperty(name)
    ?: error("twa.properties is missing \"$name\"")

val host = twaValue("host")
val startPath = twaValue("startPath")
require(Regex("^[a-z0-9.-]+$").matches(host)) { "host must be a bare host name like app.example.com (got \"$host\")" }
require(startPath.startsWith("/")) { "startPath must start with /" }
val launchUrl = "https://$host$startPath"
// Digital Asset Links statement: lets Chrome verify this app owns the site (no URL bar in the app).
val assetStatements = """[{ \"relation\": [\"delegate_permission/common.handle_all_urls\"], \"target\": {\"namespace\": \"web\", \"site\": \"https://$host\"}}]"""

android {
    namespace = "com.lupufit.app"
    compileSdk = 36

    defaultConfig {
        applicationId = twaValue("packageId")
        minSdk = 24
        targetSdk = 36
        versionCode = twaValue("versionCode").toInt()
        versionName = twaValue("versionName")

        manifestPlaceholders["hostName"] = host
        resValue("string", "appName", twaValue("appName"))
        resValue("string", "launcherName", twaValue("launcherName"))
        resValue("string", "launchUrl", launchUrl)
        resValue("string", "hostName", host)
        resValue("string", "assetStatements", assetStatements)
        resValue("string", "providerAuthority", "${twaValue("packageId")}.fileprovider")
    }

    // Release signing from environment variables only: the keystore and its passwords never live in the repo.
    val keystorePath = System.getenv("LUPUFIT_KEYSTORE")
    signingConfigs {
        if (keystorePath != null) {
            create("release") {
                storeFile = file(keystorePath)
                storePassword = System.getenv("LUPUFIT_KEYSTORE_PASSWORD")
                keyAlias = System.getenv("LUPUFIT_KEY_ALIAS") ?: "upload"
                keyPassword = System.getenv("LUPUFIT_KEY_PASSWORD") ?: System.getenv("LUPUFIT_KEYSTORE_PASSWORD")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            if (keystorePath != null) signingConfig = signingConfigs.getByName("release")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    buildFeatures {
        resValues = true
    }

    lint {
        abortOnError = false
        // There is no app code to lint (the UI is the website); skipping it keeps release builds fast and offline-friendly.
        checkReleaseBuilds = false
    }
}

dependencies {
    implementation("com.google.androidbrowserhelper:androidbrowserhelper:2.7.4")
}
