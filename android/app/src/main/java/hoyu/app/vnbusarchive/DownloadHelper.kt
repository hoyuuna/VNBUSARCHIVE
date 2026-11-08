package hoyu.app.vnbusarchive

import android.app.DownloadManager
import android.content.Context
import android.net.Uri
import android.os.Environment
import android.widget.Toast

object DownloadHelper {
    fun downloadImage(context: Context, url: String, fileName: String) {
        try {
            val validFileName = if (fileName.contains(".")) fileName else "$fileName.jpg"
            val request = DownloadManager.Request(Uri.parse(url)).apply {
                setTitle("VNBUSARCHIVE: $validFileName")
                setDescription("Đang tải ảnh về máy...")
                setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                setDestinationInExternalPublicDir(Environment.DIRECTORY_PICTURES, "VNBUSARCHIVE/$validFileName")
                setAllowedOverMetered(true)
                setAllowedOverRoaming(true)
            }

            val downloadManager = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
            downloadManager.enqueue(request)
            Toast.makeText(context, "Bắt đầu tải ảnh: $validFileName", Toast.LENGTH_SHORT).show()
        } catch (e: Exception) {
            Toast.makeText(context, "Lỗi khi tải ảnh: ${e.message}", Toast.LENGTH_LONG).show()
        }
    }
}
