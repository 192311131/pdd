package com.cielinfitech.aestheticshade;

import android.content.Context;
import android.os.Bundle;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Expose window.AndroidPrinter.print() to the web layer so the report's
        // "Print / Export PDF" button can use Android's native print framework
        // (which includes "Save as PDF"). window.print() alone is a no-op in the
        // Android WebView.
        WebView webView = getBridge().getWebView();
        webView.addJavascriptInterface(new PrinterBridge(), "AndroidPrinter");
    }

    private class PrinterBridge {
        @JavascriptInterface
        public void print() {
            runOnUiThread(() -> {
                WebView webView = getBridge().getWebView();
                PrintManager printManager = (PrintManager) getSystemService(Context.PRINT_SERVICE);
                if (printManager == null) return;
                String jobName = "AestheticShade AI Report";
                PrintDocumentAdapter adapter = webView.createPrintDocumentAdapter(jobName);
                printManager.print(jobName, adapter, new PrintAttributes.Builder().build());
            });
        }
    }
}
