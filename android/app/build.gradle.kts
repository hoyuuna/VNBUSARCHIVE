plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

val appVersionName: String = providers.gradleProperty("versionName").orNull
    ?: rootProject.findProperty("versionName")?.toString()
    ?: project.findProperty("versionName")?.toString()
    ?: "0.1.0"

val appVersionCode: Int = (providers.gradleProperty("versionCode").orNull
    ?: rootProject.findProperty("versionCode")?.toString()
    ?: project.findProperty("versionCode")?.toString())?.toIntOrNull()
    ?: 1

android {
    namespace = "hoyu.app.vnbusarchive"
    compileSdk = 34

    defaultConfig {
        applicationId = "hoyu.app.vnbusarchive"
        minSdk = 26
        targetSdk = 34
        versionCode = appVersionCode
        versionName = appVersionName

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildFeatures {
        buildConfig = true
    }

    signingConfigs {
        create("release") {
            storeFile = file("release.jks")
            storePassword = "vnbusarchive2026"
            keyAlias = "vnbusarchive"
            keyPassword = "vnbusarchive2026"
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("release")
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
        debug {
            signingConfig = signingConfigs.getByName("release")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
    implementation("androidx.swiperefreshlayout:swiperefreshlayout:1.1.0")
    implementation("androidx.activity:activity-ktx:1.9.0")

    // WorkManager cho background upload
    implementation("androidx.work:work-runtime-ktx:2.9.0")

    // ExifInterface để đọc metadata và định hướng xoay ảnh
    implementation("androidx.exifinterface:exifinterface:1.3.7")

    // OkHttp xử lý upload file và kiểm tra update
    implementation("com.squareup.okhttp3:okhttp:4.12.0")

    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")
}
