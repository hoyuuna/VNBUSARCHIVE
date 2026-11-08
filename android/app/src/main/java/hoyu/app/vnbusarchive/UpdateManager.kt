package hoyu.app.vnbusarchive

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.net.Uri
import android.os.Build
import android.widget.Toast
import androidx.core.app.NotificationCompat
import androidx.core.content.FileProvider
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream
import java.util.concurrent.TimeUnit
import java.util.regex.Pattern

object UpdateManager {

    private const val PREFS_NAME = "vnbusarchive_app_prefs"
    private const val KEY_INCLUDE_PRERELEASE = "pref_include_prerelease"
    private const val KEY_AUTO_CHECK = "pref_auto_check"

    private const val GITHUB_API_URL = "https://api.github.com/repos/hoyuuna/VNBUSARCHIVE/releases"
    private const val GITHUB_ATOM_URL = "https://github.com/hoyuuna/VNBUSARCHIVE/releases.atom"

    private const val NOTIFICATION_CHANNEL_ID = "vnbusarchive_update_channel"
    private const val NOTIFICATION_ID = 2002

    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .build()

    fun getCurrentVersion(context: Context): String {
        return try {
            val pInfo = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                context.packageManager.getPackageInfo(context.packageName, android.content.pm.PackageManager.PackageInfoFlags.of(0))
            } else {
                @Suppress("DEPRECATION")
                context.packageManager.getPackageInfo(context.packageName, 0)
            }
            pInfo.versionName ?: BuildConfig.VERSION_NAME
        } catch (e: Exception) {
            BuildConfig.VERSION_NAME
        }
    }

    private fun getPrefs(context: Context): SharedPreferences {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    fun isIncludePrerelease(context: Context): Boolean {
        return getPrefs(context).getBoolean(KEY_INCLUDE_PRERELEASE, false)
    }

    fun setIncludePrerelease(context: Context, value: Boolean) {
        getPrefs(context).edit().putBoolean(KEY_INCLUDE_PRERELEASE, value).apply()
    }

    fun isAutoCheckEnabled(context: Context): Boolean {
        return getPrefs(context).getBoolean(KEY_AUTO_CHECK, true)
    }

    fun setAutoCheckEnabled(context: Context, value: Boolean) {
        getPrefs(context).edit().putBoolean(KEY_AUTO_CHECK, value).apply()
    }

    data class ReleaseInfo(
        val hasUpdate: Boolean,
        val latestVersion: String,
        val downloadUrl: String,
        val notes: String,
        val isPrerelease: Boolean,
        val currentVersion: String
    ) {
        fun toJson(): String {
            val obj = JSONObject()
            obj.put("hasUpdate", hasUpdate)
            obj.put("latestVersion", latestVersion)
            obj.put("downloadUrl", downloadUrl)
            obj.put("notes", notes)
            obj.put("isPrerelease", isPrerelease)
            obj.put("currentVersion", currentVersion)
            return obj.toString()
        }
    }

    fun isNewerVersion(latest: String, current: String): Boolean {
        try {
            val cleanLatest = latest.removePrefix("v").trim()
            val cleanCurrent = current.removePrefix("v").trim()

            val latestParts = cleanLatest.split(".").map { it.filter { c -> c.isDigit() }.toIntOrNull() ?: 0 }
            val currentParts = cleanCurrent.split(".").map { it.filter { c -> c.isDigit() }.toIntOrNull() ?: 0 }

            val maxLen = maxOf(latestParts.size, currentParts.size)
            for (i in 0 until maxLen) {
                val l = if (i < latestParts.size) latestParts[i] else 0
                val c = if (i < currentParts.size) currentParts[i] else 0
                if (l > c) return true
                if (l < c) return false
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return false
    }

    suspend fun checkUpdate(context: Context, includePrerelease: Boolean = isIncludePrerelease(context)): ReleaseInfo =
        withContext(Dispatchers.IO) {
            val currentVersion = getCurrentVersion(context)

            // 1. Thử qua GitHub REST API
            var releasesJson: String? = null
            try {
                val request = Request.Builder()
                    .url(GITHUB_API_URL)
                    .header("User-Agent", "VNBUSARCHIVE-Android-App")
                    .header("Accept", "application/vnd.github.v3+json")
                    .build()

                val response = httpClient.newCall(request).execute()
                if (response.isSuccessful) {
                    releasesJson = response.body?.string()
                }
                response.close()
            } catch (e: Exception) {
                e.printStackTrace()
            }

            if (!releasesJson.isNullOrEmpty()) {
                val parsed = parseReleasesApi(releasesJson, currentVersion, includePrerelease)
                if (parsed != null) return@withContext parsed
            }

            // 2. Dự phòng qua GitHub Atom Feed nếu REST API bị Rate Limit
            try {
                val atomRequest = Request.Builder()
                    .url(GITHUB_ATOM_URL)
                    .header("User-Agent", "VNBUSARCHIVE-Android-App")
                    .build()

                val atomResponse = httpClient.newCall(atomRequest).execute()
                if (atomResponse.isSuccessful) {
                    val atomBody = atomResponse.body?.string() ?: ""
                    atomResponse.close()
                    val parsedAtom = parseAtomFeed(atomBody, currentVersion)
                    if (parsedAtom != null) return@withContext parsedAtom
                } else {
                    atomResponse.close()
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }

            return@withContext ReleaseInfo(
                hasUpdate = false,
                latestVersion = currentVersion,
                downloadUrl = "",
                notes = "Đang ở phiên bản mới nhất.",
                isPrerelease = false,
                currentVersion = currentVersion
            )
        }

    private fun parseReleasesApi(json: String, currentVersion: String, includePrerelease: Boolean): ReleaseInfo? {
        try {
            val array = JSONArray(json)
            for (i in 0 until array.length()) {
                val item = array.getJSONObject(i)
                val isDraft = item.optBoolean("draft", false)
                if (isDraft) continue

                val isPrerelease = item.optBoolean("prerelease", false)
                if (isPrerelease && !includePrerelease) continue

                val tagName = item.optString("tag_name", "").removePrefix("v")
                val notes = item.optString("body", "")

                var apkUrl = ""
                val assets = item.optJSONArray("assets")
                if (assets != null) {
                    for (j in 0 until assets.length()) {
                        val asset = assets.getJSONObject(j)
                        val name = asset.optString("name", "")
                        if (name.endsWith(".apk", ignoreCase = true)) {
                            apkUrl = asset.optString("browser_download_url", "")
                            break
                        }
                    }
                }

                val hasUpdate = isNewerVersion(tagName, currentVersion)
                return ReleaseInfo(
                    hasUpdate = hasUpdate,
                    latestVersion = tagName,
                    downloadUrl = apkUrl,
                    notes = notes,
                    isPrerelease = isPrerelease,
                    currentVersion = currentVersion
                )
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return null
    }

    private fun parseAtomFeed(xml: String, currentVersion: String): ReleaseInfo? {
        try {
            val pattern = Pattern.compile("releases/tag/v?([0-9]+\\.[0-9]+\\.[0-9]+)")
            val matcher = pattern.matcher(xml)
            if (matcher.find()) {
                val tagName = matcher.group(1) ?: return null
                val hasUpdate = isNewerVersion(tagName, currentVersion)
                val downloadUrl = "https://github.com/hoyuuna/VNBUSARCHIVE/releases/download/v$tagName/VNBUSARCHIVE-v$tagName.apk"
                return ReleaseInfo(
                    hasUpdate = hasUpdate,
                    latestVersion = tagName,
                    downloadUrl = downloadUrl,
                    notes = "Phiên bản mới nhất trên GitHub.",
                    isPrerelease = false,
                    currentVersion = currentVersion
                )
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return null
    }

    fun showUpdateNotification(context: Context, latestVersion: String) {
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                NOTIFICATION_CHANNEL_ID,
                "Cập nhật ứng dụng",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Thông báo khi có phiên bản VNBUSARCHIVE mới"
            }
            notificationManager.createNotificationChannel(channel)
        }

        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra("open_tab", "app")
        }

        val pendingIntent = PendingIntent.getActivity(
            context,
            202,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
        )

        val notification = NotificationCompat.Builder(context, NOTIFICATION_CHANNEL_ID)
            .setContentTitle("Có bản cập nhật mới: VNBUSARCHIVE v$latestVersion")
            .setContentText("Bấm để kiểm tra và cập nhật ứng dụng.")
            .setSmallIcon(android.R.drawable.stat_sys_download_done)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .build()

        notificationManager.notify(NOTIFICATION_ID, notification)
    }

    suspend fun downloadAndInstallApk(context: Context, downloadUrl: String, onProgress: (Int) -> Unit) = withContext(Dispatchers.IO) {
        try {
            val request = Request.Builder().url(downloadUrl).build()
            val response = httpClient.newCall(request).execute()

            if (!response.isSuccessful) {
                withContext(Dispatchers.Main) {
                    Toast.makeText(context, "Lỗi khi tải file APK: HTTP ${response.code}", Toast.LENGTH_LONG).show()
                }
                response.close()
                return@withContext
            }

            val body = response.body ?: return@withContext
            val contentLength = body.contentLength()
            val destFile = File(context.getExternalFilesDir(null), "vnbusarchive_update.apk")

            body.byteStream().use { input ->
                FileOutputStream(destFile).use { output ->
                    val buffer = ByteArray(8192)
                    var bytesRead: Int
                    var totalRead: Long = 0

                    while (input.read(buffer).also { bytesRead = it } != -1) {
                        output.write(buffer, 0, bytesRead)
                        totalRead += bytesRead
                        if (contentLength > 0) {
                            val progress = ((totalRead * 100) / contentLength).toInt()
                            withContext(Dispatchers.Main) { onProgress(progress) }
                        }
                    }
                    output.flush()
                }
            }
            response.close()

            withContext(Dispatchers.Main) {
                installApk(context, destFile)
            }
        } catch (e: Exception) {
            e.printStackTrace()
            withContext(Dispatchers.Main) {
                Toast.makeText(context, "Lỗi tải cập nhật: ${e.message}", Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun installApk(context: Context, file: File) {
        try {
            val apkUri: Uri = FileProvider.getUriForFile(
                context,
                "${context.packageName}.fileprovider",
                file
            )

            val intent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(apkUri, "application/vnd.android.package-archive")
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
        } catch (e: Exception) {
            Toast.makeText(context, "Không thể mở file cài đặt: ${e.message}", Toast.LENGTH_LONG).show()
        }
    }
}
