package hoyu.app.vnbusarchive

import android.Manifest
import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Parcelable
import android.view.View
import android.view.WindowManager
import java.io.File
import android.webkit.CookieManager
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.json.JSONArray

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView

    private var fileUploadCallback: ValueCallback<Array<Uri>>? = null
    private val pendingSharedUris = mutableListOf<String>()
    private var pendingOpenTab: String? = null

    private val filePickerLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (fileUploadCallback == null) return@registerForActivityResult

        var results: Array<Uri>? = null
        if (result.resultCode == RESULT_OK && result.data != null) {
            val data = result.data
            val clipData = data?.clipData
            if (clipData != null && clipData.itemCount > 0) {
                val list = mutableListOf<Uri>()
                for (i in 0 until clipData.itemCount) {
                    list.add(clipData.getItemAt(i).uri)
                }
                results = list.toTypedArray()
            } else if (data?.data != null) {
                results = arrayOf(data.data!!)
            }
        }
        fileUploadCallback?.onReceiveValue(results)
        fileUploadCallback = null
    }

    private val requestNotificationPermission = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { /* User permission response */ }

    private var geolocationCallback: android.webkit.GeolocationPermissions.Callback? = null
    private var geolocationOrigin: String? = null

    private val requestLocationPermission = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val granted = permissions[Manifest.permission.ACCESS_FINE_LOCATION] == true ||
                      permissions[Manifest.permission.ACCESS_COARSE_LOCATION] == true
        geolocationCallback?.invoke(geolocationOrigin, granted, false)
        geolocationCallback = null
        geolocationOrigin = null
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_PAN)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(
                    this,
                    Manifest.permission.POST_NOTIFICATIONS
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                requestNotificationPermission.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }

        handleIncomingIntent(intent)
        setupWebView()
        setupBackNavigation()

        triggerAutoUpdateCheck()

        if (savedInstanceState == null) {
            val targetUrl = when {
                pendingSharedUris.isNotEmpty() -> "https://vnbusarchive.io.vn/upload"
                intent?.data != null -> intent.data.toString()
                else -> "https://vnbusarchive.io.vn"
            }
            webView.loadUrl(targetUrl)
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleIncomingIntent(intent)

        if (pendingSharedUris.isNotEmpty()) {
            webView.loadUrl("https://vnbusarchive.io.vn/upload")
        } else if (intent.data != null) {
            webView.loadUrl(intent.data.toString())
        } else if (pendingOpenTab != null) {
            webView.evaluateJavascript("if (window.app && app.settings) { app.settings.open('$pendingOpenTab'); }", null)
        }
    }

    private fun handleIncomingIntent(intent: Intent?) {
        if (intent == null) return
        val action = intent.action
        val type = intent.type

        if (intent.hasExtra("open_tab")) {
            pendingOpenTab = intent.getStringExtra("open_tab")
        }

        if (Intent.ACTION_SEND == action && type?.startsWith("image/") == true) {
            val imageUri = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                intent.getParcelableExtra(Intent.EXTRA_STREAM, Uri::class.java)
            } else {
                @Suppress("DEPRECATION")
                intent.getParcelableExtra<Parcelable>(Intent.EXTRA_STREAM) as? Uri
            }
            imageUri?.let { pendingSharedUris.add(it.toString()) }
        } else if (Intent.ACTION_SEND_MULTIPLE == action && type?.startsWith("image/") == true) {
            val imageUris = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                intent.getParcelableArrayListExtra(Intent.EXTRA_STREAM, Uri::class.java)
            } else {
                @Suppress("DEPRECATION")
                intent.getParcelableArrayListExtra<Uri>(Intent.EXTRA_STREAM)
            }
            imageUris?.forEach { pendingSharedUris.add(it.toString()) }
        }
    }

    fun consumePendingSharedImagesJson(): String {
        val array = JSONArray(pendingSharedUris)
        pendingSharedUris.clear()
        return array.toString()
    }

    fun consumePendingOpenTab(): String {
        val tab = pendingOpenTab ?: ""
        pendingOpenTab = null
        return tab
    }

    fun setSwipeRefreshEnabled(enabled: Boolean) {
        // Native SwipeRefreshLayout removed - handled by custom Web UI
    }

    private fun triggerAutoUpdateCheck() {
        if (UpdateManager.isAutoCheckEnabled(this)) {
            lifecycleScope.launch(Dispatchers.IO) {
                try {
                    val info = UpdateManager.checkUpdate(this@MainActivity)
                    if (info.hasUpdate) {
                        UpdateManager.showUpdateNotification(this@MainActivity, info.latestVersion)
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        }
    }

    private fun isInternalOrAuthDomain(host: String): Boolean {
        val h = host.lowercase()
        return h.contains("vnbusarchive.io.vn") ||
               h.contains("supabase.co") ||
               h.contains("discord.com") ||
               h.contains("discordapp.com") ||
               h.contains("accounts.google.com") ||
               h.contains("google.com") ||
               h.contains("github.com") ||
               h.contains("facebook.com") ||
               h.contains("appleid.apple.com") ||
               h.contains("hcaptcha.com") ||
               h.contains("cloudflare.com")
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        webView.overScrollMode = View.OVER_SCROLL_NEVER
        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.setGeolocationEnabled(true)
        settings.allowFileAccess = true
        settings.cacheMode = WebSettings.LOAD_DEFAULT
        // Bật AppCache và DOM Storage để tự động lưu đệm HTML/JS/CSS cục bộ
        // Mỗi lần mở app sẽ nạp ngay từ cache máy (0ms) và đồng thời revalidate cập nhật bản mới từ mạng
        val appCacheDir = File(cacheDir, "webview_cache")
        if (!appCacheDir.exists()) appCacheDir.mkdirs()

        val cookieManager = CookieManager.getInstance()
        cookieManager.setAcceptCookie(true)
        cookieManager.setAcceptThirdPartyCookies(webView, true)

        val rawUa = settings.userAgentString
        settings.userAgentString = rawUa.replace("; wv", "").replace("Version/4.0 ", "")

        webView.addJavascriptInterface(AndroidBridge(this, webView), "AndroidBridge")

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url?.toString() ?: return false
                val host = request.url.host ?: ""

                if (isInternalOrAuthDomain(host)) {
                    return false
                }

                return try {
                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                    startActivity(intent)
                    true
                } catch (e: Exception) {
                    false
                }
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)

                pendingOpenTab?.let { tab ->
                    webView.evaluateJavascript("if (window.app && app.settings) { app.settings.open('$tab'); }", null)
                    pendingOpenTab = null
                }
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onGeolocationPermissionsShowPrompt(
                origin: String?,
                callback: android.webkit.GeolocationPermissions.Callback?
            ) {
                if (ContextCompat.checkSelfPermission(
                        this@MainActivity,
                        Manifest.permission.ACCESS_FINE_LOCATION
                    ) == PackageManager.PERMISSION_GRANTED ||
                    ContextCompat.checkSelfPermission(
                        this@MainActivity,
                        Manifest.permission.ACCESS_COARSE_LOCATION
                    ) == PackageManager.PERMISSION_GRANTED
                ) {
                    callback?.invoke(origin, true, false)
                } else {
                    geolocationCallback = callback
                    geolocationOrigin = origin
                    requestLocationPermission.launch(
                        arrayOf(
                            Manifest.permission.ACCESS_FINE_LOCATION,
                            Manifest.permission.ACCESS_COARSE_LOCATION
                        )
                    )
                }
            }

            override fun onGeolocationPermissionsHidePrompt() {
                geolocationCallback = null
                geolocationOrigin = null
            }

            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                fileUploadCallback?.onReceiveValue(null)
                fileUploadCallback = filePathCallback

                val allowsMultiple = fileChooserParams?.mode == FileChooserParams.MODE_OPEN_MULTIPLE
                val intent = Intent(Intent.ACTION_GET_CONTENT).apply {
                    type = "image/*"
                    addCategory(Intent.CATEGORY_OPENABLE)
                    putExtra(Intent.EXTRA_ALLOW_MULTIPLE, allowsMultiple)
                }

                try {
                    filePickerLauncher.launch(Intent.createChooser(intent, "Chọn ảnh"))
                } catch (e: Exception) {
                    fileUploadCallback?.onReceiveValue(null)
                    fileUploadCallback = null
                    return false
                }
                return true
            }
        }
    }

    fun launchNativePhotoPicker(multiple: Boolean) {
        val intent = Intent(Intent.ACTION_GET_CONTENT).apply {
            type = "image/*"
            addCategory(Intent.CATEGORY_OPENABLE)
            putExtra(Intent.EXTRA_ALLOW_MULTIPLE, multiple)
        }
        filePickerLauncher.launch(Intent.createChooser(intent, "Chọn ảnh"))
    }

    

    private fun setupBackNavigation() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    finish()
                }
            }
        })
    }
}
