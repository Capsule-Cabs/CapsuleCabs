package com.capsulecabs.app;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.zoho.paymentsdk.CheckoutSDK;
import com.zoho.paymentsdk.ZohoPaymentsCheckoutCallback;

@CapacitorPlugin(name = "ZohoPay")
public class ZohoPayPlugin extends Plugin {

    @PluginMethod
    public void startPayment(PluginCall call) {
        String sessionId = call.getString("sessionId");
        String apiKey = call.getString("apiKey");
        String accountId = call.getString("accountId");

        getActivity().runOnUiThread(() -> {
            CheckoutSDK.initialize(apiKey, accountId);

            CheckoutSDK.presentPayment(getActivity(),
            sessionId, new ZohoPaymentsCheckoutCallback() {
                @Override
                public void onPaymentSuccess(String paymentId, String signature) {
                    JSObject ret = new JSObject();
                    ret.put("status", "success");
                    ret.put("paymentId", paymentId);
                    call.resolve(ret);
                }

                @Override
                public void onPaymentFailure(String error) {
                    call.reject(error);
                }
            });
        })
    }
}