package hoyu.app.vnbusarchive

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.widget.Toast
import androidx.lifecycle.lifecycleScope
import androidx.work.Data
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.json.JSONObject

class AndroidBridge(
    private val activity: MainActivity,
    private val webView: WebView
) {
    private val mainHandler = Handler(Looper.getMainLooper())

    @JavascriptInterface
    fun isNativeApp(): Boolean = true

    @JavascriptInterface
    fun getAppVersion(): String {
        return UpdateManager.getCurrentVersion(activity)
    }

    @JavascriptInterface
    fun showToast(message: String) {
        mainHandler.post {
            Toast.makeText(activity, message, Toast.LENGTH_SHORT).show()
        }
    }

    @JavascriptInterface
    fun downloadImage(url: String, fileName: String) {
        mainHandler.post {
            DownloadHelper.downloadImage(activity, url, fileName)
        }
    }

    /**
     * Bật / tắt vuốt làm mới trang (Dùng khi mở modal để tránh bị refresh khi cuộn nội dung modal)
     */
    @JavascriptInterface
    fun setSwipeRefreshEnabled(enabled: Boolean) {
        mainHandler.post {
            activity.setSwipeRefreshEnabled(enabled)
        }
    }

    /**
     * Mở đường dẫn bằng trình duyệt ngoài của hệ thống (Chrome, Samsung Internet, v.v.)
     */
    @JavascriptInterface
    fun openExternalBrowser(url: String) {
        mainHandler.post {
            try {
                val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                activity.startActivity(intent)
            } catch (e: Exception) {
                Toast.makeText(activity, "Không thể mở trình duyệt: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    /**
     * Kích hoạt chạy ngầm Foreground Service & WorkManager để nén và tải lên hàng loạt ảnh
     */
    @JavascriptInterface
    fun startBackgroundUpload(metadataJson: String, urisJson: String, token: String): String {
        try {
            val inputData = Data.Builder()
                .putString(UploadWorker.KEY_METADATA, metadataJson)
                .putString(UploadWorker.KEY_URIS, urisJson)
                .putString(UploadWorker.KEY_TOKEN, token)
                .build()

            val uploadWorkRequest = OneTimeWorkRequestBuilder<UploadWorker>()
                .setInputData(inputData)
                .build()

            WorkManager.getInstance(activity).enqueue(uploadWorkRequest)

            mainHandler.post {
                Toast.makeText(
                    activity,
                    "Đã bắt đầu tiến trình tải ảnh lên ngầm!",
                    Toast.LENGTH_SHORT
                ).show()
            }
            return uploadWorkRequest.id.toString()
        } catch (e: Exception) {
            e.printStackTrace()
            return ""
        }
    }

    /**
     * Lấy danh sách ảnh được truyền từ ngoài vào qua menu Chia sẻ (Share Intent)
     */
    @JavascriptInterface
    fun getPendingSharedImages(): String {
        return activity.consumePendingSharedImagesJson()
    }

    /**
     * Lấy tab cần mở (ví dụ 'app' khi người dùng bấm vào notification cập nhật)
     */
    @JavascriptInterface
    fun getPendingOpenTab(): String {
        return activity.consumePendingOpenTab()
    }

    /**
     * Mở trực tiếp Photo Picker của Android
     */
    @JavascriptInterface
    fun openPhotoPicker(multiple: Boolean) {
        mainHandler.post {
            activity.launchNativePhotoPicker(multiple)
        }
    }

    /**
     * Lấy cấu hình cập nhật từ SharedPreferences
     */
    @JavascriptInterface
    fun getUpdatePreferences(): String {
        val obj = JSONObject()
        obj.put("includePrerelease", UpdateManager.isIncludePrerelease(activity))
        obj.put("autoCheck", UpdateManager.isAutoCheckEnabled(activity))
        return obj.toString()
    }

    /**
     * Lưu cấu hình cập nhật vào SharedPreferences
     */
    @JavascriptInterface
    fun setUpdatePreferences(includePrerelease: Boolean, autoCheck: Boolean) {
        UpdateManager.setIncludePrerelease(activity, includePrerelease)
        UpdateManager.setAutoCheckEnabled(activity, autoCheck)
    }

    /**
     * Kiểm tra bản cập nhật và gọi lại callback trong JS an toàn qua Base64 (tránh lỗi control characters / newlines)
     */
    @JavascriptInterface
    fun checkUpdate(callbackJsName: String) {
        activity.lifecycleScope.launch(Dispatchers.Main) {
            val result = UpdateManager.checkUpdate(activity)
            val jsonBytes = result.toJson().toByteArray(Charsets.UTF_8)
            val base64 = android.util.Base64.encodeToString(jsonBytes, android.util.Base64.NO_WRAP)
            webView.evaluateJavascript("if (typeof $callbackJsName === 'function') { $callbackJsName('$base64', true); }", null)
        }
    }

    /**
     * Tải file APK mới và mở trình cài đặt
     */
    @JavascriptInterface
    fun startUpdateDownload(downloadUrl: String, progressCallbackJs: String) {
        activity.lifecycleScope.launch(Dispatchers.Main) {
            Toast.makeText(activity, "Bắt đầu tải bản cập nhật...", Toast.LENGTH_SHORT).show()
            UpdateManager.downloadAndInstallApk(activity, downloadUrl) { progress ->
                if (progressCallbackJs.isNotEmpty()) {
                    webView.evaluateJavascript("$progressCallbackJs($progress)", null)
                }
            }
        }
    }
}
