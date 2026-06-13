import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { StoreProduct, stateProps } from "@/type";
import { SiMediamarkt } from "react-icons/si";
import FormattedPrice from "./FormattedPrice";
import { useRazorpay } from "../hooks/useRazorpay";
import { resetCart } from "../store/nextSlice";

const CartPayment = () => {
  const { productData, userInfo } = useSelector((state: stateProps) => state.next);
  const [totalAmount, setTotalAmount] = useState(0);
  const { initiatePayment, loading } = useRazorpay();
  const dispatch = useDispatch();

  useEffect(() => {
    let amount = 0;
    productData.forEach((item: StoreProduct) => {
      amount += item.price * 10 * item.quantity;
    });
    setTotalAmount(amount);
  }, [productData]);

  const handlePayment = () => {
    initiatePayment({
      amount: Math.round(totalAmount), // Round to avoid decimal issues
      onSuccess: (paymentId) => {
        alert(`Payment successful! Payment ID: ${paymentId}`);
        // Clear the cart after successful payment
        dispatch(resetCart());
        // You can also redirect to a success page here
        // router.push('/order-success');
      },
      onFailure: (error) => {
        console.error('Payment failed:', error);
        alert('Payment failed. Please try again.');
      },
      onCancel: () => {
        console.log('Payment was cancelled by user');
        // No error alert for cancellation - user intentionally cancelled
      },
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-5 w-full max-w-sm mx-auto">
      {/* Free Shipping Info */}
      <div className="flex items-start gap-3">
        <span className="bg-green-600 rounded-full p-1 h-6 w-6 text-sm text-white flex items-center justify-center mt-1">
          <SiMediamarkt />
        </span>
        <p className="text-sm text-gray-700">
          Your order qualifies for <span className="font-medium">FREE Shipping</span>. Continue for more details.
        </p>
      </div>

      {/* Total Price */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-sm font-semibold text-gray-800">Total Price:</p>
        <span className="font-bold text-xl text-gray-900">
          <FormattedPrice amount={totalAmount} />
        </span>
      </div>

      {/* Checkout Button and Login Prompt */}
      <div className="mt-6 flex flex-col items-center">
        <button
          onClick={handlePayment}
          disabled={!userInfo || productData.length === 0 || loading}
          className={`w-full h-10 text-sm font-semibold text-white rounded-lg transition-colors ${
            userInfo && productData.length > 0 && !loading
              ? 'bg-amazon_blue hover:bg-amazon_blue-dark' 
              : 'bg-amazon_blue bg-opacity-50 cursor-not-allowed'
          }`}
        >
          {loading ? 'Processing...' : 'Pay with Razorpay'}
        </button>

        {!userInfo && (
          <p className="text-xs mt-2 text-red-500 font-semibold animate-bounce text-center">
            Please Login to Continue
          </p>
        )}
        
        {userInfo && productData.length === 0 && (
          <p className="text-xs mt-2 text-orange-500 font-semibold text-center">
            Your cart is empty
          </p>
        )}
      </div>
    </div>
  );
};

export default CartPayment;
