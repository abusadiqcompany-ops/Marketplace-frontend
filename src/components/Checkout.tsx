import React, { useState } from 'react';
import { ShoppingBag, AlertCircle, Check, MapPin } from 'lucide-react';
import { Listing, Location } from '../types';
import { formatCurrency, calculateFees } from '../utils/payment';

interface CheckoutProps {
  listing: Listing;
  buyerLocation?: Location;
  onPaymentMethodSelect?: (method: 'paystack' | 'flutterwave') => void;
  onConfirmPurchase?: (deliveryMethod: 'meetup' | 'shipping') => void;
  isLoading?: boolean;
}

export function Checkout({
  listing,
  buyerLocation,
  onPaymentMethodSelect,
  onConfirmPurchase,
  isLoading = false,
}: CheckoutProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    'paystack' | 'flutterwave'
  >('paystack');
  const [selectedDeliveryMethod, setSelectedDeliveryMethod] = useState<
    'meetup' | 'shipping'
  >('meetup');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const fees = calculateFees(listing.price, selectedPaymentMethod);
  const totalAmount = listing.price + fees.total;

  const handleProceedToPayment = () => {
    if (agreedToTerms) {
      onPaymentMethodSelect?.(selectedPaymentMethod);
    }
  };

  const handleConfirmPurchase = () => {
    if (agreedToTerms) {
      onConfirmPurchase?.(selectedDeliveryMethod);
    }
  };

  const locationLabel =
    typeof listing.location === 'string'
      ? listing.location
      : `${listing.location.city}, ${listing.location.state}`;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden max-w-2xl">
      {/* Product Summary */}
      <div className="border-b border-gray-200 p-6 bg-gray-50">
        <div className="flex gap-4 mb-4">
          <img
            src={listing.images?.[0] || 'https://via.placeholder.com/80'}
            alt={listing.title}
            width="80"
            height="80"
            loading="lazy"
            decoding="async"
            className="h-20 w-20 rounded-lg object-cover"
          />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{listing.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{listing.category}</p>
            <p className="text-lg font-bold text-blue-600 mt-2">
              {formatCurrency(listing.price)}
            </p>
          </div>
        </div>

        {/* Location Info */}
        {listing.location && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4" />
            <span>{locationLabel}</span>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Delivery Method Selection */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Delivery Method</h4>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="delivery"
                value="meetup"
                checked={selectedDeliveryMethod === 'meetup'}
                onChange={(e) => setSelectedDeliveryMethod(e.target.value as 'meetup' | 'shipping')}
                className="w-4 h-4"
              />
              <div>
                <p className="font-medium text-gray-900">Meet Seller</p>
                <p className="text-sm text-gray-600">Arrange local pickup with seller</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="delivery"
                value="shipping"
                checked={selectedDeliveryMethod === 'shipping'}
                onChange={(e) => setSelectedDeliveryMethod(e.target.value as 'meetup' | 'shipping')}
                className="w-4 h-4"
              />
              <div>
                <p className="font-medium text-gray-900">Shipping</p>
                <p className="text-sm text-gray-600">Seller ships to your address</p>
              </div>
            </label>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Payment Method</h4>
          <div className="space-y-2">
            {[
              {
                id: 'paystack',
                name: 'Paystack',
                description: 'Fast and secure payments',
                fee: '1.5% + ₦100',
              },
              {
                id: 'flutterwave',
                name: 'Flutterwave',
                description: 'Multiple payment options',
                fee: '1.4% + ₦50',
              },
            ].map((method) => (
              <label
                key={method.id}
                className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition"
              >
                <input
                  type="radio"
                  name="payment"
                  value={method.id}
                  checked={selectedPaymentMethod === method.id}
                  onChange={(e) =>
                    setSelectedPaymentMethod(
                      e.target.value as 'paystack' | 'flutterwave'
                    )
                  }
                  className="w-4 h-4"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{method.name}</p>
                  <p className="text-sm text-gray-600">{method.description}</p>
                </div>
                <p className="text-sm font-medium text-gray-700">{method.fee}</p>
              </label>
            ))}
          </div>
        </div>

        {/* Escrow Protection Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">🛡️ Buyer Protection</p>
            <p>
              Your payment will be held securely in escrow. It's only released to the seller after
              you confirm the item is received and in good condition.
            </p>
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Item Price</span>
            <span className="font-medium">{formatCurrency(listing.price)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Platform Fee (3%)</span>
            <span className="font-medium">{formatCurrency(fees.platformFee)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Gateway Fee</span>
            <span className="font-medium">{formatCurrency(fees.gatewayFee)}</span>
          </div>
          <div className="border-t border-gray-200 pt-2 flex justify-between">
            <span className="font-semibold">Total</span>
            <span className="font-bold text-lg text-blue-600">
              {formatCurrency(totalAmount)}
            </span>
          </div>
        </div>

        {/* Terms Agreement */}
        <label htmlFor="agreeTerms" className="flex items-start gap-3 cursor-pointer">
          <input
            id="agreeTerms"
            name="agreeTerms"
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="w-4 h-4 mt-1"
          />
          <span className="text-sm text-gray-700">
            I agree to the purchase terms and understand that payment will be held in escrow until
            I confirm delivery. I also agree to the{' '}
            <a href="#" className="text-blue-600 hover:underline">
              Terms of Service
            </a>
            .
          </span>
        </label>

        {/* Action Buttons */}
        <div className="space-y-3 border-t border-gray-200 pt-6">
          <button
            onClick={handleProceedToPayment}
            disabled={!agreedToTerms || isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-5 h-5" />
            {isLoading ? 'Processing...' : `Proceed to Payment - ${formatCurrency(totalAmount)}`}
          </button>

          <p className="text-xs text-gray-500 text-center">
            By clicking "Proceed to Payment", you'll be taken to {selectedPaymentMethod} to
            complete your purchase securely.
          </p>
        </div>
      </div>
    </div>
  );
}
