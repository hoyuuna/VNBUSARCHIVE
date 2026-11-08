# Giữ lại các hàm có @JavascriptInterface để WebView có thể gọi được
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Giữ lại các model/worker
-keep class vn.vnbusarchive.app.** { *; }
