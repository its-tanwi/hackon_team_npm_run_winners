import { useState } from 'react';
import loadRazorpay from '../utils/loadRazorPay';
import { useAuth } from './useAuth';

interface PaymentOptions {
  amount: number;
  onSuccess?: (paymentId: string) => void;
  onFailure?: (error: any) => void;
  onCancel?: () => void;
}

export const useRazorpay = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const initiatePayment = async ({ amount, onSuccess, onFailure, onCancel }: PaymentOptions) => {
    try {
      setLoading(true);

      // Load Razorpay script
      const res = await loadRazorpay();
      if (!res) {
        throw new Error('Razorpay SDK failed to load');
      }

      // Create order
      const orderResponse = await fetch('/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to create order');
      }

      const orderData = await orderResponse.json();

      // Razorpay options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Amazon Clone',
        description: 'Purchase from Amazon Clone',
        order_id: orderData.orderId,
        prefill: {
          name: user?.displayName || '',
          email: user?.email || '',
        },
        theme: {
          color: '#FF9900', // Amazon orange color
        },
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyResponse = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              onSuccess?.(response.razorpay_payment_id);
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            onFailure?.(error);
          }
        },
        modal: {
          ondismiss: function () {
            console.log('Payment cancelled by user');
            // Call the cancel callback if provided
            onCancel?.();
          },
        },
      };

      // Open Razorpay checkout
      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Payment initiation error:', error);
      onFailure?.(error);
    } finally {
      setLoading(false);
    }
  };

  return {
    initiatePayment,
    loading,
  };
};
