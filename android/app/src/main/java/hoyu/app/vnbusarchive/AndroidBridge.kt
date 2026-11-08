package hoyu.app.vnbusarchive

import android.content.Context
import android.os.Handler
import android.os.Looper
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.widget.Toast
import androidx.work.Data
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager

class AndroidBridge(
    private val activity: MainActivity,
    private val webView: WebView
) {
    private val mainHandler = Handler(Looper.getMainLooper())

    @JavascriptInterface
    fun isNativeApp(): Boolean = true

    @JavascriptInterface
    fun getAppVersion(): String = "hoyu.app.vnbusarchive"

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
     * Mở trực tiếp Photo Picker của Android
     */
    @JavascriptInterface
    fun openPhotoPicker(multiple: Boolean) {
        mainHandler.post {
            activity.launchNativePhotoPicker(multiple)
        }
    }
}
