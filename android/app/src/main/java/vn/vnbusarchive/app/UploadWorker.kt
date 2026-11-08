package vn.vnbusarchive.app

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.pm.ServiceInfo
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.exifinterface.media.ExifInterface
import androidx.work.CoroutineWorker
import androidx.work.ForegroundInfo
import androidx.work.WorkerParameters
import androidx.work.workDataOf
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.asRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream
import java.util.concurrent.TimeUnit

class UploadWorker(
    private val context: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(context, workerParams) {

    private val notificationManager =
        context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

    private val okHttpClient = OkHttpClient.Builder()
        .connectTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(120, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .build()

    companion object {
        const val CHANNEL_ID = "vnbusarchive_upload_channel"
        const val NOTIFICATION_ID = 1001
        const val KEY_METADATA = "key_metadata"
        const val KEY_URIS = "key_uris"
        const val KEY_TOKEN = "key_token"
    }

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        createNotificationChannel()

        val metadataJson = inputData.getString(KEY_METADATA) ?: return@withContext Result.failure()
        val urisJson = inputData.getString(KEY_URIS) ?: return@withContext Result.failure()
        val token = inputData.getString(KEY_TOKEN) ?: ""

        val metadata = JSONObject(metadataJson)
        val uris = JSONArray(urisJson)
        val total = uris.length()

        if (total == 0) return@withContext Result.success()

        // Bật Foreground notification
        setForeground(createForegroundInfo(0, total, "Bắt đầu tải lên..."))

        var successCount = 0
        var failCount = 0

        for (i in 0 until total) {
            val uriString = uris.getString(i)
            val uri = Uri.parse(uriString)

            updateProgress(i + 1, total, "Đang xử lý ảnh ${i + 1}/$total...")

            try {
                // 1. Tận dụng phần cứng máy: nén & xoay ảnh trực tiếp bằng luồng native
                val compressedFile = processAndCompressImage(uri, i)

                // 2. Tải lên API backend /api/upload
                val uploadSuccess = uploadSingleImage(compressedFile, metadata, token)
                if (uploadSuccess) {
                    successCount++
                } else {
                    failCount++
                }

                // Xóa file tạm
                compressedFile.delete()
            } catch (e: Exception) {
                e.printStackTrace()
                failCount++
            }
        }

        // Thông báo kết quả cuối cùng
        val finalTitle = if (failCount == 0) "Tải lên hoàn tất!" else "Tải lên xong (có lỗi)"
        val finalDesc = "Đã tải thành công $successCount/$total ảnh."
        showFinalNotification(finalTitle, finalDesc)

        return@withContext if (successCount > 0) {
            Result.success(workDataOf("successCount" to successCount, "failCount" to failCount))
        } else {
            Result.failure()
        }
    }

    private fun createForegroundInfo(current: Int, total: Int, statusText: String): ForegroundInfo {
        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setContentTitle("VNBUSARCHIVE: Đang tải ảnh lên")
            .setContentText(statusText)
            .setSmallIcon(android.R.drawable.stat_sys_upload)
            .setProgress(total, current, false)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()

        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            ForegroundInfo(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC)
        } else {
            ForegroundInfo(NOTIFICATION_ID, notification)
        }
    }

    private fun updateProgress(current: Int, total: Int, statusText: String) {
        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setContentTitle("VNBUSARCHIVE: Đang tải ảnh lên ($current/$total)")
            .setContentText(statusText)
            .setSmallIcon(android.R.drawable.stat_sys_upload)
            .setProgress(total, current, false)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()

        notificationManager.notify(NOTIFICATION_ID, notification)
    }

    private fun showFinalNotification(title: String, content: String) {
        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(content)
            .setSmallIcon(android.R.drawable.stat_sys_upload_done)
            .setOngoing(false)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .build()

        notificationManager.notify(NOTIFICATION_ID, notification)
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Tiến độ tải ảnh lên",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Hiển thị tiến độ nén và tải ảnh lên của VNBUSARCHIVE"
            }
            notificationManager.createNotificationChannel(channel)
        }
    }

    /**
     * Tận dụng tối đa phần cứng: Đọc file theo stream, tự động xoay theo EXIF, resize và nén JPEG 92%
     */
    private fun processAndCompressImage(uri: Uri, index: Int): File {
        var inputStream: InputStream? = context.contentResolver.openInputStream(uri)
        val exif = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N && inputStream != null) {
            ExifInterface(inputStream).also { inputStream.close() }
        } else null

        val orientation = exif?.getAttributeInt(
            ExifInterface.TAG_ORIENTATION,
            ExifInterface.ORIENTATION_NORMAL
        ) ?: ExifInterface.ORIENTATION_NORMAL

        // Đọc kích thước ảnh trước (inJustDecodeBounds) để tránh OOM
        val options = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        context.contentResolver.openInputStream(uri)?.use {
            BitmapFactory.decodeStream(it, null, options)
        }

        val maxDim = 3840 // Max 4K resolution
        var inSampleSize = 1
        while (options.outWidth / inSampleSize > maxDim || options.outHeight / inSampleSize > maxDim) {
            inSampleSize *= 2
        }

        val decodeOptions = BitmapFactory.Options().apply {
            this.inSampleSize = inSampleSize
            inPreferredConfig = Bitmap.Config.ARGB_8888
        }

        var bitmap: Bitmap? = context.contentResolver.openInputStream(uri)?.use {
            BitmapFactory.decodeStream(it, null, decodeOptions)
        } ?: throw IllegalStateException("Không thể đọc ảnh từ Uri")

        // Xoay ảnh theo EXIF nếu cần
        val matrix = Matrix()
        when (orientation) {
            ExifInterface.ORIENTATION_ROTATE_90 -> matrix.postRotate(90f)
            ExifInterface.ORIENTATION_ROTATE_180 -> matrix.postRotate(180f)
            ExifInterface.ORIENTATION_ROTATE_270 -> matrix.postRotate(270f)
        }

        if (!matrix.isIdentity) {
            val rotated = Bitmap.createBitmap(bitmap!!, 0, 0, bitmap.width, bitmap.height, matrix, true)
            if (rotated != bitmap) {
                bitmap.recycle()
                bitmap = rotated
            }
        }

        val tempFile = File(context.cacheDir, "upload_temp_${System.currentTimeMillis()}_$index.jpg")
        FileOutputStream(tempFile).use { outStream ->
            bitmap!!.compress(Bitmap.CompressFormat.JPEG, 92, outStream)
        }
        bitmap!!.recycle()

        return tempFile
    }

    private fun uploadSingleImage(file: File, metadata: JSONObject, token: String): Boolean {
        val formBodyBuilder = MultipartBody.Builder().setType(MultipartBody.FORM)

        // Metadata fields tương thích với functions/api/upload.js
        val keys = metadata.keys()
        while (keys.hasNext()) {
            val key = keys.next()
            formBodyBuilder.addFormDataPart(key, metadata.optString(key, ""))
        }

        // File đính kèm
        val fileBody = file.asRequestBody("image/jpeg".toMediaTypeOrNull())
        formBodyBuilder.addFormDataPart("file", file.name, fileBody)
        formBodyBuilder.addFormDataPart("fileExtension", "jpg")

        val requestBuilder = Request.Builder()
            .url("https://vnbusarchive.io.vn/api/upload")
            .post(formBodyBuilder.build())
            // Tuân thủ quy định bảo mật Origin/Referer của VNBUSARCHIVE backend
            .header("Origin", "https://vnbusarchive.io.vn")
            .header("Referer", "https://vnbusarchive.io.vn/upload")

        if (token.isNotEmpty()) {
            requestBuilder.header("Authorization", if (token.startsWith("Bearer ")) token else "Bearer $token")
        }

        return try {
            val response = okHttpClient.newCall(requestBuilder.build()).execute()
            val isSuccessful = response.isSuccessful
            response.close()
            isSuccessful
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }
}
