package hoyu.app.vnbusarchive

import android.Manifest
import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Parcelable
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
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.json.JSONArray

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var swipeRefreshLayout: SwipeRefreshLayout

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

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        swipeRefreshLayout = findViewById(R.id.swipeRefreshLayout)

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
        setupSwipeRefresh()
        setupBackNavigation()

        // Tự động kiểm tra bản cập nhật khi vào app (nếu người dùng bật)
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
            // Mở modal cài đặt
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
        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.allowFileAccess = true
        settings.cacheMode = WebSettings.LOAD_DEFAULT

        // Cho phép cookie bên thứ 3 để quá trình đăng nhập OAuth (Discord, Google, v.v.) không bị rớt session
        val cookieManager = CookieManager.getInstance()
        cookieManager.setAcceptCookie(true)
        cookieManager.setAcceptThirdPartyCookies(webView, true)

        // Loại bỏ 'wv' và 'Version/4.0' để tránh Google/OAuth chặn với lỗi "disallowed_useragent"
        val rawUa = settings.userAgentString
        settings.userAgentString = rawUa.replace("; wv", "").replace("Version/4.0 ", "")

        webView.addJavascriptInterface(AndroidBridge(this, webView), "AndroidBridge")

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url?.toString() ?: return false
                val host = request.url.host ?: ""

                // Giữ lại bên trong WebView cho cả domain hệ thống và các domain xác thực OAuth (Discord, Google, GitHub...)
                if (isInternalOrAuthDomain(host)) {
                    return false
                }

                // Link bên ngoài (YouTube, Facebook pages, báo chí...): Mở bằng trình duyệt ngoài
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
                swipeRefreshLayout.isRefreshing = false

                // Nếu có tab đang chờ mở (từ notification)
                pendingOpenTab?.let { tab ->
                    webView.evaluateJavascript("if (window.app && app.settings) { app.settings.open('$tab'); }", null)
                    pendingOpenTab = null
                }
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
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

    private fun setupSwipeRefresh() {
        swipeRefreshLayout.setColorSchemeColors(0xFFFFFFFF.toInt())
        swipeRefreshLayout.setProgressBackgroundColorSchemeColor(0xFF18181B.toInt())
        swipeRefreshLayout.setOnChildScrollUpCallback { _, _ ->
            webView.scrollY > 0
        }
        swipeRefreshLayout.setOnRefreshListener {
            webView.reload()
        }
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
