package kitchen.spoonful;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.Dialog;
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
import android.os.Message;
import android.view.ViewGroup;
import android.view.Window;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import java.io.IOException;
import java.io.InputStream;
import java.util.Calendar;
import java.util.HashMap;
import java.util.Map;
import org.json.JSONObject;

public class MainActivity extends Activity implements SensorEventListener {
    private static final String LIVE = "https://pixel-bloom-monarch-arch.grok.me";
    private static final int FILE_CHOOSER = 7;
    private static final int HEALTH_PERMS = 8;

    private ValueCallback<Uri[]> filePathCallback;
    private WebView web;
    private SensorManager sensors;
    private float todaySteps = 0f;
    private float heartRate = 0f;
    private SharedPreferences prefs;
    private Dialog popupDialog;

    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        prefs = getSharedPreferences("spoonful-health", MODE_PRIVATE);
        restoreToday();

        CookieManager cookies = CookieManager.getInstance();
        cookies.setAcceptCookie(true);

        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#F3E0C8"));
        tune(web.getSettings());
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            cookies.setAcceptThirdPartyCookies(web, true);
        }
        web.addJavascriptInterface(new SpoonfulHealth(), "SpoonfulHealth");
        web.setWebChromeClient(new Chrome());
        web.setWebViewClient(new Client());
        setContentView(web);
        web.loadUrl(LIVE);
        askHealthPerms();
    }

    private void tune(WebSettings s) {
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(true);
        s.setMediaPlaybackRequiresUserGesture(false);
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
            String path = uri.getPath();
            if (path == null || !path.startsWith("/food/")) return null;
            String name = path.substring("/food/".length());
            if (name.contains("..") || name.contains("/")) return null;
            try {
                InputStream is = getAssets().open("www/food/" + name);
                Map<String, String> headers = new HashMap<>();
                headers.put("Access-Control-Allow-Origin", "*");
                headers.put("Cache-Control", "public, max-age=86400");
                String mime = name.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
                return new WebResourceResponse(mime, null, 200, "OK", headers, is);
            } catch (IOException missing) {
                return null;
            }
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, android.webkit.WebResourceRequest request) {
            Uri uri = request.getUrl();
            if (uri == null) return false;
            String host = uri.getHost() == null ? "" : uri.getHost();
            String scheme = uri.getScheme() == null ? "" : uri.getScheme();
            if (scheme.equals("http") || scheme.equals("https")) {
                if (host.contains("grok.me")
                    || host.contains("accounts.google.com")
                    || host.contains("google.com")
                    || host.contains("x.com")
                    || host.contains("twitter.com")
                    || host.contains("auth.grok.me")) {
                    return false;
                }
            }
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, uri));
                return true;
            } catch (Exception e) {
                return false;
            }
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
                Manifest.permission.BODY_SENSORS,
                Manifest.permission.CAMERA
            },
            HEALTH_PERMS
        );
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == HEALTH_PERMS) bindSensors();
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
    }

    @Override
    public void onBackPressed() {
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

    @Override
    protected void onDestroy() {
        if (sensors != null) sensors.unregisterListener(this);
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
