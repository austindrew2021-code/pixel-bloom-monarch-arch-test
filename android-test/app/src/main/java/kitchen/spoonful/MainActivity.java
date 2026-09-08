package kitchen.spoonful;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.Dialog;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.PowerManager;
import android.media.AudioAttributes;
import android.speech.tts.TextToSpeech;
import android.speech.tts.Voice;
import android.util.Base64;
import android.view.ViewGroup;
import android.view.Window;
import android.webkit.CookieManager;
import android.webkit.GeolocationPermissions;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Calendar;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import org.json.JSONArray;
import org.json.JSONObject;

public class MainActivity extends Activity implements SensorEventListener {
    private static final String LIVE = "https://pixel-bloom-monarch-arch.grok.me";
    private static final int FILE_CHOOSER = 7;
    private static final int HEALTH_PERMS = 8;
    private static final int CAMERA_PERMS = 9;
    private static final int NOTIFY_PERMS = 11;
    private PowerManager.WakeLock shopLock;
    private static final String[] STORE_PACKAGES = {
        "pc.express.grocery.pickup"
    };

    private ValueCallback<Uri[]> filePathCallback;
    private WebView web;
    private SensorManager sensors;
    private float todaySteps = 0f;
    private float heartRate = 0f;
    private SharedPreferences prefs;
    private Dialog popupDialog;
    private Dialog storeDialog;
    private WebView storeWeb;
    private String storeCartId = "";
    private String storePickupId = "0357";
    private String storeBagJson = "";
    private String bagJs = "";
    private long bagJsAt = 0;
    private PermissionRequest pendingWebPermission;
    private GeolocationPermissions.Callback pendingGeo;
    private String pendingGeoOrigin;
    private TextToSpeech tts;
    private volatile boolean ttsReady = false;
    private String pendingSpeakText;
    private String pendingSpeakOpts;

    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        prefs = getSharedPreferences("spoonful-health", MODE_PRIVATE);
        restoreToday();

        CookieManager cookies = CookieManager.getInstance();
        cookies.setAcceptCookie(true);

        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#0C0718"));
        tune(web.getSettings());
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            cookies.setAcceptThirdPartyCookies(web, true);
        }
        web.addJavascriptInterface(new SpoonfulHealth(), "SpoonfulHealth");
        web.setWebChromeClient(new Chrome());
        web.setWebViewClient(new Client());
        setContentView(web);
        web.loadUrl(LIVE + "/");
        askHealthPerms();
        initTts();
        ensureShopChannel();
    }

    /** Serve the packed kitchen as the live origin so /assets/spoonful.js hits the intercept. */
    private void openPackedKitchen() {
        try {
            String html = readAsset("www/index.html");
            web.loadDataWithBaseURL(LIVE + "/", html, "text/html", "UTF-8", LIVE + "/");
        } catch (Exception e) {
            web.loadUrl(LIVE + "/");
        }
    }

    private void tune(WebSettings s) {
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(true);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN) {
            s.setAllowFileAccessFromFileURLs(true);
            s.setAllowUniversalAccessFromFileURLs(true);
        }
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setGeolocationEnabled(true);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        s.setSupportMultipleWindows(true);
        s.setJavaScriptCanOpenWindowsAutomatically(true);
        String ua = s.getUserAgentString().replace("; wv", "").replace(" Version/4.0", "");
        s.setUserAgentString(ua);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            s.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
        }
    }

    private class Client extends WebViewClient {
        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            Uri uri = request.getUrl();
            if (uri == null) return null;
            if (isStoreHost(uri)) return null;
            String scheme = uri.getScheme() == null ? "" : uri.getScheme();
            if (scheme.equals("file")) {
                return serveAssetFile(uri.getPath());
            }
            String host = uri.getHost() == null ? "" : uri.getHost();
            if (host.contains("pixel-bloom-monarch-arch.grok.me")) {
                return serveKitchenPath(uri.getPath());
            }
            return null;
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, android.webkit.WebResourceRequest request) {
            Uri uri = request.getUrl();
            if (isStoreHost(uri)) {
                attachStore(uri.toString(), storeCartId, true);
                return true;
            }
            if (handOff(uri)) return true;
            return false;
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            view.evaluateJavascript("window.__SPOONFUL_APK__=true;", null);
            pushHealth();
        }
    }

    private class Chrome extends WebChromeClient {
        @Override
        public boolean onShowFileChooser(
            WebView view,
            ValueCallback<Uri[]> callback,
            FileChooserParams params
        ) {
            if (filePathCallback != null) filePathCallback.onReceiveValue(null);
            filePathCallback = callback;
            try {
                startActivityForResult(params.createIntent(), FILE_CHOOSER);
            } catch (Exception e) {
                filePathCallback = null;
                return false;
            }
            return true;
        }

        @Override
        public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
            WebView popup = new WebView(MainActivity.this);
            tune(popup.getSettings());
            popup.setWebViewClient(new WebViewClient() {
                @Override
                public boolean shouldOverrideUrlLoading(WebView v, android.webkit.WebResourceRequest request) {
                    Uri uri = request.getUrl();
                    if (isStoreHost(uri)) {
                        attachStore(uri.toString(), storeCartId, true);
                        closePopup();
                        return true;
                    }
                    if (keepInWebView(uri)) return false;
                    if (handOff(uri)) {
                        closePopup();
                        return true;
                    }
                    return false;
                }

                @Override
                public void onPageFinished(WebView v, String url) {
                    if (url != null && url.contains("pixel-bloom-monarch-arch.grok.me") && !url.contains("/auth/popup")) {
                        closePopup();
                        web.reload();
                    }
                }
            });
            popup.setWebChromeClient(new WebChromeClient() {
                @Override
                public void onCloseWindow(WebView window) {
                    closePopup();
                }
            });
            CookieManager.getInstance().setAcceptThirdPartyCookies(popup, true);
            popupDialog = new Dialog(MainActivity.this);
            popupDialog.requestWindowFeature(Window.FEATURE_NO_TITLE);
            FrameLayout box = new FrameLayout(MainActivity.this);
            box.addView(popup, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            ));
            popupDialog.setContentView(box);
            popupDialog.setOnDismissListener(d -> closePopup());
            Window w = popupDialog.getWindow();
            if (w != null) w.setLayout(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT);
            popupDialog.show();
            WebView.WebViewTransport transport = (WebView.WebViewTransport) resultMsg.obj;
            transport.setWebView(popup);
            resultMsg.sendToTarget();
            return true;
        }

        @Override
        public void onCloseWindow(WebView window) {
            closePopup();
        }

        @Override
        public void onPermissionRequest(final PermissionRequest request) {
            runOnUiThread(() -> handleWebPermission(request));
        }

        @Override
        public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
            if (hasLocation()) {
                callback.invoke(origin, true, false);
                return;
            }
            pendingGeo = callback;
            pendingGeoOrigin = origin;
            requestPermissions(
                new String[] {
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_COARSE_LOCATION
                },
                GEO_PERMS
            );
        }
    }

    private boolean keepInWebView(Uri uri) {
        if (uri == null) return true;
        String host = uri.getHost() == null ? "" : uri.getHost();
        String scheme = uri.getScheme() == null ? "" : uri.getScheme();
        if (!(scheme.equals("http") || scheme.equals("https"))) return false;
        if (isStoreHost(uri)) return true;
        return host.contains("grok.me")
            || host.contains("accounts.google.com")
            || host.contains("google.com")
            || host.contains("apple.com")
            || host.contains("appleid.apple.com")
            || host.contains("okta.com")
            || host.contains("auth0.com")
            || host.contains("microsoftonline.com")
            || host.contains("x.com")
            || host.contains("twitter.com")
            || host.contains("auth.grok.me");
    }

    private boolean handOff(Uri uri) {
        if (uri == null || keepInWebView(uri)) return false;
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW, uri);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            intent.putExtra("create_new_tab", true);
            startActivity(intent);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private void closePopup() {
        if (popupDialog != null) {
            try {
                popupDialog.dismiss();
            } catch (Exception ignored) {}
            popupDialog = null;
        }
    }

    private void askHealthPerms() {
        if (Build.VERSION.SDK_INT < 29) {
            bindSensors();
            return;
        }
        boolean steps = checkSelfPermission(Manifest.permission.ACTIVITY_RECOGNITION) == PackageManager.PERMISSION_GRANTED;
        boolean body = checkSelfPermission(Manifest.permission.BODY_SENSORS) == PackageManager.PERMISSION_GRANTED;
        if (steps && body) {
            bindSensors();
            return;
        }
        requestPermissions(
            new String[] {
                Manifest.permission.ACTIVITY_RECOGNITION,
                Manifest.permission.BODY_SENSORS
            },
            HEALTH_PERMS
        );
    }

    private boolean hasCamera() {
        return checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED;
    }

    private boolean hasLocation() {
        return checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
            || checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }

    private void handleWebPermission(PermissionRequest request) {
        String[] resources = request.getResources();
        boolean wantCamera = false;
        java.util.ArrayList<String> grant = new java.util.ArrayList<>();
        for (String r : resources) {
            if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(r)) wantCamera = true;
        }
        if (wantCamera && !hasCamera()) {
            pendingWebPermission = request;
            requestPermissions(new String[] { Manifest.permission.CAMERA }, CAMERA_PERMS);
            return;
        }
        if (wantCamera) grant.add(PermissionRequest.RESOURCE_VIDEO_CAPTURE);
        if (grant.isEmpty()) {
            request.deny();
            return;
        }
        request.grant(grant.toArray(new String[0]));
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == HEALTH_PERMS) bindSensors();
        if (requestCode == CAMERA_PERMS && pendingWebPermission != null) {
            PermissionRequest req = pendingWebPermission;
            pendingWebPermission = null;
            if (hasCamera()) {
                req.grant(new String[] { PermissionRequest.RESOURCE_VIDEO_CAPTURE });
            } else {
                req.deny();
            }
        }
        if (requestCode == GEO_PERMS && pendingGeo != null) {
            GeolocationPermissions.Callback cb = pendingGeo;
            String origin = pendingGeoOrigin;
            pendingGeo = null;
            pendingGeoOrigin = null;
            cb.invoke(origin, hasLocation(), false);
        }
    }

    private void bindSensors() {
        sensors = (SensorManager) getSystemService(SENSOR_SERVICE);
        if (sensors == null) return;
        Sensor step = sensors.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);
        if (step != null) sensors.registerListener(this, step, SensorManager.SENSOR_DELAY_NORMAL);
        Sensor hr = sensors.getDefaultSensor(Sensor.TYPE_HEART_RATE);
        if (hr != null) sensors.registerListener(this, hr, SensorManager.SENSOR_DELAY_NORMAL);
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event.sensor.getType() == Sensor.TYPE_STEP_COUNTER) {
            float total = event.values[0];
            String day = dayKey();
            String storedDay = prefs.getString("day", "");
            float baseline = prefs.getFloat("baseline", -1f);
            if (!day.equals(storedDay) || baseline < 0) {
                baseline = total;
                prefs.edit().putString("day", day).putFloat("baseline", baseline).apply();
            }
            todaySteps = Math.max(0, total - baseline);
            prefs.edit().putFloat("steps", todaySteps).apply();
            pushHealth();
        } else if (event.sensor.getType() == Sensor.TYPE_HEART_RATE) {
            heartRate = event.values[0];
            pushHealth();
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {}

    private void restoreToday() {
        if (dayKey().equals(prefs.getString("day", ""))) {
            todaySteps = prefs.getFloat("steps", 0f);
        }
    }

    private String dayKey() {
        Calendar c = Calendar.getInstance();
        return c.get(Calendar.YEAR) + "-" + (c.get(Calendar.MONTH) + 1) + "-" + c.get(Calendar.DAY_OF_MONTH);
    }

    private String healthJson() {
        try {
            JSONObject o = new JSONObject();
            o.put("date", String.format(
                "%04d-%02d-%02d",
                Calendar.getInstance().get(Calendar.YEAR),
                Calendar.getInstance().get(Calendar.MONTH) + 1,
                Calendar.getInstance().get(Calendar.DAY_OF_MONTH)
            ));
            o.put("steps", Math.round(todaySteps));
            o.put("heartRate", Math.round(heartRate));
            o.put("distanceKm", Math.round((todaySteps / 1280f) * 100f) / 100.0);
            return o.toString();
        } catch (Exception e) {
            return "{\"steps\":0,\"heartRate\":0}";
        }
    }

    private void pushHealth() {
        if (web == null) return;
        final String json = healthJson();
        web.post(() -> web.evaluateJavascript(
            "window.__spoonfulHealth && window.__spoonfulHealth(" + json + ")",
            null
        ));
    }

    public class SpoonfulHealth {
        @JavascriptInterface
        public String readToday() {
            return healthJson();
        }

        @JavascriptInterface
        public void request() {
            runOnUiThread(() -> {
                askHealthPerms();
                pushHealth();
            });
        }

        @JavascriptInterface
        public void requestCamera() {
            runOnUiThread(() -> {
                if (!hasCamera()) {
                    requestPermissions(new String[] { Manifest.permission.CAMERA }, CAMERA_PERMS);
                }
            });
        }

        @JavascriptInterface
        public void requestLocation() {
            runOnUiThread(() -> {
                if (!hasLocation()) {
                    requestPermissions(
                        new String[] {
                            Manifest.permission.ACCESS_FINE_LOCATION,
                            Manifest.permission.ACCESS_COARSE_LOCATION
                        },
                        GEO_PERMS
                    );
                }
            });
        }

        @JavascriptInterface
        public void warmStoreCart(String url, String cartId) {
            runOnUiThread(() -> attachStore(url, cartId, false));
        }

        @JavascriptInterface
        public void openStoreCart(String url, String cartId) {
            runOnUiThread(() -> attachStore(url, cartId, true));
        }

        @JavascriptInterface
        public void setStoreBag(String json) {
            storeBagJson = json == null ? "" : json;
            try {
                JSONObject bag = new JSONObject(storeBagJson);
                String sid = bag.optString("storeId", "");
                if (sid.matches("\\d{3,8}")) storePickupId = sid;
                String cid = bag.optString("cartId", "");
                if (cid.matches("[0-9a-fA-F-]{36}")) storeCartId = cid;
            } catch (Exception ignored) {}
            runOnUiThread(() -> {
                if (storeWeb != null) injectStoreBag(storeWeb);
            });
        }

        @JavascriptInterface
        public boolean hasStoreApp() {
            for (String pkg : STORE_PACKAGES) {
                try {
                    getPackageManager().getPackageInfo(pkg, 0);
                    return true;
                } catch (PackageManager.NameNotFoundException ignored) {}
            }
            return false;
        }

        @JavascriptInterface
        public void openStoreApp() {
            runOnUiThread(() -> {
                for (String pkg : STORE_PACKAGES) {
                    Intent launch = getPackageManager().getLaunchIntentForPackage(pkg);
                    if (launch == null) continue;
                    launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    try {
                        startActivity(launch);
                        return;
                    } catch (Exception ignored) {}
                }
            });
        }

        @JavascriptInterface
        public boolean speak(String text, String optsJson) {
            if (text == null || text.trim().isEmpty()) return false;
            runOnUiThread(() -> speakNow(text, optsJson));
            return true;
        }

        @JavascriptInterface
        public void notify(String title, String body) {
            shopNotify(title, body);
        }

        @JavascriptInterface
        public void hush() {
            runOnUiThread(() -> {
                if (tts != null) tts.stop();
            });
        }

        @JavascriptInterface
        public void openUrls(String json) {
            runOnUiThread(() -> {
                try {
                    JSONArray arr = new JSONArray(json);
                    Handler handler = new Handler(Looper.getMainLooper());
                    int n = Math.min(arr.length(), 20);
                    for (int i = 0; i < n; i++) {
                        final String url = arr.optString(i, "");
                        if (!url.startsWith("https://")) continue;
                        final int delay = i * 350;
                        handler.postDelayed(() -> {
                            try {
                                Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                                intent.putExtra("create_new_tab", true);
                                startActivity(intent);
                            } catch (Exception ignored) {}
                        }, delay);
                    }
                } catch (Exception ignored) {}
            });
        }
    }

    private boolean isPcxHost(Uri uri) {
        return isStoreHost(uri);
    }

    private boolean isStoreHost(Uri uri) {
        if (uri == null || uri.getHost() == null) return false;
        String host = uri.getHost().toLowerCase();
        String[] hosts = {
            "atlanticsuperstore.ca",
            "realcanadiansuperstore.ca",
            "yourindependentgrocer.ca",
            "independentcitymarket.ca",
            "nofrills.ca",
            "loblaws.ca",
            "loblaw.ca",
            "pcexpress.ca",
            "pcid.ca",
            "pcoptimum.ca",
            "zehrs.ca",
            "fortinos.ca",
            "maxi.ca",
            "provigo.ca",
            "wholesaleclub.ca",
            "valumart.ca",
            "dominiongrocerystores.ca",
            "voila.ca",
            "sobeys.com",
            "foodland.ca",
            "freshco.com",
            "walmart.ca",
            "walmart.com",
            "instacart.ca",
            "instacart.com",
            "iga.net",
            "loblawdigital.com"
        };
        for (String h : hosts) {
            if (host.equals(h) || host.endsWith("." + h)) return true;
        }
        return false;
    }

    private void attachStore(String url, String cartId, boolean show) {
        if (url == null || !url.startsWith("https://")) return;
        if (cartId != null && cartId.matches("[0-9a-fA-F-]{36}")) storeCartId = cartId;
        url = heliosHome(url);
        if (storeWeb == null) {
            storeWeb = new WebView(this);
            tune(storeWeb.getSettings());
            storeWeb.getSettings().setSupportMultipleWindows(true);
            storeWeb.getSettings().setJavaScriptCanOpenWindowsAutomatically(true);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                CookieManager.getInstance().setAcceptThirdPartyCookies(storeWeb, true);
            }
            storeWeb.addJavascriptInterface(new StoreBagBridge(), "SpoonfulBag");
            storeWeb.setWebViewClient(new WebViewClient() {
                @Override
                public boolean shouldOverrideUrlLoading(WebView v, android.webkit.WebResourceRequest request) {
                    Uri uri = request.getUrl();
                    String scheme = uri == null || uri.getScheme() == null ? "" : uri.getScheme();
                    if (scheme.equals("http") || scheme.equals("https")) return false;
                    return handOff(uri);
                }

                @Override
                public void onPageFinished(WebView v, String loaded) {
                    injectStoreCart(v);
                    injectStoreBag(v);
                }
            });
            storeWeb.setWebChromeClient(new WebChromeClient() {
                @Override
                public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
                    WebView catcher = new WebView(MainActivity.this);
                    catcher.setWebViewClient(new WebViewClient() {
                        @Override
                        public boolean shouldOverrideUrlLoading(WebView v, android.webkit.WebResourceRequest request) {
                            Uri uri = request.getUrl();
                            if (uri != null && ("http".equals(uri.getScheme()) || "https".equals(uri.getScheme()))) {
                                storeWeb.loadUrl(uri.toString());
                                return true;
                            }
                            return handOff(uri);
                        }
                    });
                    WebView.WebViewTransport transport = (WebView.WebViewTransport) resultMsg.obj;
                    transport.setWebView(catcher);
                    resultMsg.sendToTarget();
                    return true;
                }
            });
            storeDialog = new Dialog(this);
            storeDialog.requestWindowFeature(Window.FEATURE_NO_TITLE);
            FrameLayout box = new FrameLayout(this);
            box.addView(storeWeb, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            ));
            storeDialog.setContentView(box);
            storeDialog.setOnDismissListener(d -> { /* keep WebView so the cart stays warm */ });
            Window w = storeDialog.getWindow();
            if (w != null) w.setLayout(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT);
        }
        if (show || storeWeb.getUrl() == null) {
            storeWeb.loadUrl(url);
        } else {
            injectStoreCart(storeWeb);
            injectStoreBag(storeWeb);
        }
        if (show && storeDialog != null && !storeDialog.isShowing()) storeDialog.show();
        try {
            JSONObject bag = new JSONObject(storeBagJson == null ? "{}" : storeBagJson);
            if (bag.optBoolean("handsOff", false)) holdShopWake();
        } catch (Exception ignored) {}
    }

    private String heliosHome(String url) {
        try {
            Uri uri = Uri.parse(url);
            if (!isHeliosHost(uri) || uri.getHost() == null) return url;
            String pickup = uri.getQueryParameter("sf_store");
            if (pickup != null && pickup.matches("\\d{3,8}")) storePickupId = pickup;
            return "https://" + uri.getHost() + "/en";
        } catch (Exception ignored) {
            return url;
        }
    }

    private boolean isHeliosHost(Uri uri) {
        if (uri == null || uri.getHost() == null) return false;
        String host = uri.getHost().toLowerCase();
        String[] hosts = {
            "atlanticsuperstore.ca",
            "realcanadiansuperstore.ca",
            "yourindependentgrocer.ca",
            "independentcitymarket.ca",
            "nofrills.ca",
            "loblaws.ca",
            "zehrs.ca",
            "fortinos.ca",
            "maxi.ca",
            "provigo.ca",
            "wholesaleclub.ca"
        };
        for (String h : hosts) {
            if (host.equals(h) || host.endsWith("." + h)) return true;
        }
        return false;
    }

    private void injectStoreCart(WebView view) {
        if (view == null || storeCartId.isEmpty()) return;
        try {
            String loaded = view.getUrl();
            if (loaded != null && !isHeliosHost(Uri.parse(loaded))) return;
        } catch (Exception ignored) {}
        String id = storeCartId.replace("'", "").replace("\\", "");
        String store = storePickupId.replace("'", "").replace("\\", "");
        String js =
            "(function(id,store){try{"
                + "localStorage.setItem('lcl-cart-id-banner',id);"
                + "localStorage.setItem('lcl-cart-id-rapid',id);"
                + "if(store)localStorage.setItem('last_selected_store',store);"
                + "try{sessionStorage.removeItem('lcl-grocery-data-cart');}catch(e){}"
                + "if(sessionStorage.getItem('sf-id')===id)return;"
                + "sessionStorage.setItem('sf-id',id);"
                + "location.reload();"
                + "}catch(e){}})('" + id + "','" + store + "')";
        view.evaluateJavascript(js, null);
    }

    public class StoreBagBridge {
        @JavascriptInterface
        public void notify(String title, String body) {
            shopNotify(title, body);
        }

        @JavascriptInterface
        public void filling(int packed, int total) {
            shopNotify("Filling your cart", packed + " of " + total + " packs in the bag");
            holdShopWake();
        }

        @JavascriptInterface
        public void needYou(String why) {
            shopNotify("Spoonful needs you", why == null ? "The store needs a quick check" : why);
            runOnUiThread(() -> {
                if (storeDialog != null && !storeDialog.isShowing()) storeDialog.show();
            });
        }
    }

    private void ensureShopChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (nm == null) return;
        NotificationChannel ch = new NotificationChannel("shop", "Cart fill", NotificationManager.IMPORTANCE_DEFAULT);
        ch.setDescription("When Spoonful finishes packing a grocery cart");
        nm.createNotificationChannel(ch);
    }

    private void shopNotify(String title, String body) {
        if (Build.VERSION.SDK_INT >= 33) {
            if (checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                requestPermissions(new String[] { Manifest.permission.POST_NOTIFICATIONS }, NOTIFY_PERMS);
            }
        }
        runOnUiThread(() -> {
            try {
                ensureShopChannel();
                NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
                if (nm == null) return;
                PendingIntent tap = PendingIntent.getActivity(
                    this,
                    0,
                    new Intent(this, MainActivity.class),
                    Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0
                );
                Notification.Builder b = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                    ? new Notification.Builder(this, "shop")
                    : new Notification.Builder(this);
                Notification n = b
                    .setContentTitle(title == null || title.isEmpty() ? "Spoonful" : title)
                    .setContentText(body == null ? "" : body)
                    .setSmallIcon(android.R.drawable.ic_dialog_info)
                    .setContentIntent(tap)
                    .setAutoCancel(true)
                    .build();
                nm.notify(42, n);
            } catch (Exception ignored) {}
        });
    }

    private void holdShopWake() {
        runOnUiThread(() -> {
            try {
                if (shopLock != null && shopLock.isHeld()) return;
                PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
                if (pm == null) return;
                shopLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "spoonful:shop");
                shopLock.acquire(30 * 60 * 1000L);
            } catch (Exception ignored) {}
        });
    }

    private void injectStoreBag(WebView view) {
        if (view == null || storeBagJson == null || storeBagJson.isEmpty()) return;
        new Thread(() -> {
            String js = bagJs;
            if (js == null || js.isEmpty() || System.currentTimeMillis() - bagJsAt > 60_000L) {
                String live = fetchLiveText("/sf-bag.js");
                if (live != null && live.contains("__sfBag")) {
                    js = live;
                    bagJs = live;
                    bagJsAt = System.currentTimeMillis();
                } else if (js == null || js.isEmpty()) {
                    try {
                        js = readAsset("www/sf-bag.js");
                        bagJs = js;
                    } catch (IOException ignored) {
                        return;
                    }
                }
            }
            if (js == null || js.isEmpty()) return;
            final String script = js;
            final String b64 = Base64.encodeToString(storeBagJson.getBytes(StandardCharsets.UTF_8), Base64.NO_WRAP);
            runOnUiThread(() -> {
                try {
                    view.evaluateJavascript(script + "\nwindow.__sfBag && window.__sfBag('" + b64 + "');", null);
                } catch (Exception ignored) {}
            });
        }).start();
    }

    private String fetchLiveText(String path) {
        HttpURLConnection conn = null;
        try {
            URL url = new URL(LIVE + path);
            conn = (HttpURLConnection) url.openConnection();
            conn.setInstanceFollowRedirects(true);
            conn.setConnectTimeout(6000);
            conn.setReadTimeout(12000);
            conn.setRequestProperty("Accept", "application/javascript,*/*");
            int code = conn.getResponseCode();
            if (code < 200 || code >= 400) return null;
            try (InputStream is = conn.getInputStream(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
                byte[] buf = new byte[4096];
                int n;
                while ((n = is.read(buf)) != -1) out.write(buf, 0, n);
                return out.toString(StandardCharsets.UTF_8.name());
            }
        } catch (Exception e) {
            return null;
        } finally {
            if (conn != null) conn.disconnect();
        }
    }

    private String readAsset(String path) throws IOException {
        try (InputStream is = getAssets().open(path); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            byte[] buf = new byte[4096];
            int n;
            while ((n = is.read(buf)) != -1) out.write(buf, 0, n);
            return out.toString(StandardCharsets.UTF_8.name());
        }
    }

    private WebResourceResponse serveAssetFile(String path) {
        if (path == null || path.contains("..")) return null;
        String rest = path;
        if (rest.startsWith("/android_asset/")) rest = rest.substring("/android_asset/".length());
        else if (rest.startsWith("/")) rest = rest.substring(1);
        if (rest.isEmpty()) return null;
        try {
            return kitchenResponse(mimeFor(rest), getAssets().open(rest));
        } catch (IOException missing) {
            return null;
        }
    }

    private WebResourceResponse serveKitchenPath(String path) {
        if (path == null || path.contains("..")) return null;
        // HTML, JS and CSS must come from the live kitchen so Publish
        // actually updates the phone. Only cache photos and the bag helper.
        boolean packed =
            path.startsWith("/food/")
                || path.startsWith("/exercise-db/")
                || path.startsWith("/themes/")
                || path.startsWith("/icons/")
                || path.equals("/favicon.svg")
                || path.equals("/og.jpg")
                || path.equals("/sf-bag.js");
        if (!packed) return null;
        String asset = path.equals("/sf-bag.js") ? "www/sf-bag.js" : "www" + path;
        try {
            InputStream is = getAssets().open(asset);
            return kitchenResponse(mimeFor(path), is);
        } catch (IOException missing) {
            if (path.startsWith("/food/")
                || path.startsWith("/exercise-db/")
                || path.startsWith("/themes/")
                || path.startsWith("/assets/")) {
                return fetchLive(path);
            }
            return null;
        }
    }

    private WebResourceResponse fetchLive(String path) {
        HttpURLConnection conn = null;
        try {
            URL url = new URL(LIVE + path);
            conn = (HttpURLConnection) url.openConnection();
            conn.setInstanceFollowRedirects(true);
            conn.setConnectTimeout(8000);
            conn.setReadTimeout(20000);
            conn.setRequestProperty("Accept", "*/*");
            int code = conn.getResponseCode();
            if (code < 200 || code >= 400) return null;
            String mime = conn.getContentType();
            if (mime == null || mime.isEmpty() || mime.contains("text/html")) mime = mimeFor(path);
            if (mime.contains(";")) mime = mime.substring(0, mime.indexOf(";")).trim();
            return kitchenResponse(mime, conn.getInputStream());
        } catch (Exception e) {
            if (conn != null) conn.disconnect();
            return null;
        }
    }

    private WebResourceResponse kitchenResponse(String mime, InputStream is) {
        Map<String, String> headers = new HashMap<>();
        headers.put("Access-Control-Allow-Origin", "*");
        headers.put("Cache-Control", "public, max-age=86400");
        boolean text =
            mime.startsWith("text/")
                || mime.contains("javascript")
                || mime.contains("json")
                || mime.contains("svg")
                || mime.contains("xml");
        return new WebResourceResponse(mime, text ? "utf-8" : null, 200, "OK", headers, is);
    }

    private String mimeFor(String path) {
        String p = path.toLowerCase();
        if (p.endsWith(".html") || p.endsWith(".htm")) return "text/html";
        if (p.endsWith(".png")) return "image/png";
        if (p.endsWith(".jpg") || p.endsWith(".jpeg")) return "image/jpeg";
        if (p.endsWith(".gif")) return "image/gif";
        if (p.endsWith(".svg")) return "image/svg+xml";
        if (p.endsWith(".css")) return "text/css";
        if (p.endsWith(".js")) return "application/javascript";
        if (p.endsWith(".webp")) return "image/webp";
        return "application/octet-stream";
    }

    @Override
    public void onBackPressed() {
        if (storeDialog != null && storeDialog.isShowing()) {
            storeDialog.dismiss();
            return;
        }
        if (popupDialog != null && popupDialog.isShowing()) {
            closePopup();
            return;
        }
        if (web != null && web.canGoBack()) {
            web.goBack();
            return;
        }
        super.onBackPressed();
    }

    private void initTts() {
        if (tts != null) return;
        tts = new TextToSpeech(this, status -> {
            ttsReady = status == TextToSpeech.SUCCESS;
            if (ttsReady) {
                try {
                    tts.setAudioAttributes(
                        new AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_ASSISTANT)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                            .build()
                    );
                } catch (Exception ignored) {}
            }
            if (ttsReady && pendingSpeakText != null) {
                String queued = pendingSpeakText;
                String queuedOpts = pendingSpeakOpts;
                pendingSpeakText = null;
                pendingSpeakOpts = null;
                speakNow(queued, queuedOpts);
            }
        });
    }

    private Locale localeFor(String lang) {
        if (lang == null || lang.isEmpty()) return Locale.US;
        String l = lang.toLowerCase(Locale.ROOT);
        if (l.startsWith("en-gb")) return Locale.UK;
        if (l.startsWith("en-au")) return new Locale("en", "AU");
        if (l.startsWith("en-ie")) return new Locale("en", "IE");
        if (l.startsWith("en-in")) return new Locale("en", "IN");
        if (l.startsWith("en-ca")) return Locale.CANADA;
        if (l.startsWith("fr")) return Locale.CANADA_FRENCH;
        String[] parts = l.split("[-_]");
        if (parts.length >= 2) return new Locale(parts[0], parts[1].toUpperCase(Locale.ROOT));
        if (parts.length == 1) return new Locale(parts[0]);
        return Locale.US;
    }

    private Voice pickTtsVoice(String lang, String voiceId) {
        if (tts == null) return null;
        Set<Voice> voices;
        try {
            voices = tts.getVoices();
        } catch (Exception e) {
            return null;
        }
        if (voices == null || voices.isEmpty()) return null;
        String id = voiceId == null ? "" : voiceId.toLowerCase(Locale.ROOT);
        String want = (lang == null || lang.isEmpty() ? "en-us" : lang).toLowerCase(Locale.ROOT).replace('_', '-');
        Voice best = null;
        int bestScore = -999;
        for (Voice v : voices) {
            if (v == null) continue;
            Locale vl = v.getLocale();
            String langTag = vl == null || vl.getLanguage() == null ? "" : vl.getLanguage().toLowerCase(Locale.ROOT);
            if (!(langTag.equals("en") || langTag.equals("fr") || langTag.equals("es"))) continue;
            String name = v.getName() == null ? "" : v.getName().toLowerCase(Locale.ROOT);
            String loc = vl == null ? "" : vl.toString().toLowerCase(Locale.ROOT).replace('_', '-');
            int score = 0;
            if (v.isNetworkConnectionRequired()) score -= 4;
            if (v.getQuality() >= Voice.QUALITY_HIGH) score += 5;
            if (loc.startsWith(want) || loc.equals(want)) score += 16;
            if (langTag.equals("en")) score += 3;
            if ("british".equals(id) && (loc.contains("gb") || name.contains("gb") || name.contains("uk") || name.contains("british"))) score += 30;
            if ("australian".equals(id) && (loc.contains("au") || name.contains("au") || name.contains("australian"))) score += 30;
            if ("irish".equals(id) && (loc.contains("ie") || name.contains("ie") || name.contains("irish"))) score += 30;
            if ("indian".equals(id) && (loc.contains("in") || name.contains("indian") || name.contains("en-in"))) score += 30;
            if ("american".equals(id) && (loc.contains("us") || name.contains("us"))) score += 18;
            if ("cowboy".equals(id) && (loc.contains("us") || loc.contains("en-us"))) score += 14;
            if ("cowboy".equals(id) && (name.contains("male") || name.contains("dmy") || name.contains("sfg") || name.contains("ioh") || name.contains("low"))) score += 10;
            if (score > bestScore) {
                bestScore = score;
                best = v;
            }
        }
        return best;
    }

    private void speakNow(String text, String optsJson) {
        initTts();
        if (tts == null) return;
        if (!ttsReady) {
            pendingSpeakText = text;
            pendingSpeakOpts = optsJson;
            return;
        }
        String lang = "en-US";
        String voiceId = "";
        float pitch = 1f;
        float rate = 0.96f;
        try {
            if (optsJson != null && !optsJson.isEmpty()) {
                JSONObject o = new JSONObject(optsJson);
                lang = o.optString("lang", lang);
                voiceId = o.optString("voice", o.optString("voiceURI", ""));
                pitch = (float) o.optDouble("pitch", pitch);
                rate = (float) o.optDouble("rate", rate);
            }
        } catch (Exception ignored) {}
        Voice chosen = null;
        try {
            tts.setLanguage(localeFor(lang));
        } catch (Exception ignored) {}
        chosen = pickTtsVoice(lang, voiceId);
        boolean voiced = false;
        if (chosen != null) {
            try {
                tts.setVoice(chosen);
                voiced = true;
            } catch (Exception ignored) {}
        }
        if (!voiced) {
            int ok = tts.setLanguage(localeFor(lang));
            if (ok == TextToSpeech.LANG_MISSING_DATA || ok == TextToSpeech.LANG_NOT_SUPPORTED) {
                if (tts.setLanguage(Locale.UK) < 0) tts.setLanguage(Locale.US);
            }
        }
        tts.setPitch(Math.max(0.5f, Math.min(2f, pitch)));
        tts.setSpeechRate(Math.max(0.5f, Math.min(1.6f, rate)));
        tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "spoonful-coach");
    }

    @Override
    protected void onDestroy() {
        if (sensors != null) sensors.unregisterListener(this);
        if (tts != null) {
            tts.stop();
            tts.shutdown();
            tts = null;
        }
        closePopup();
        super.onDestroy();
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != FILE_CHOOSER || filePathCallback == null) return;
        Uri[] result = WebChromeClient.FileChooserParams.parseResult(resultCode, data);
        filePathCallback.onReceiveValue(result);
        filePathCallback = null;
    }
}
