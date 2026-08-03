import React, { useState } from 'react';
import {
  Check,
  Clock,
  AlertCircle,
  ShoppingBag,
  Truck,
  Package,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Order } from '../types';
import { formatCurrency } from '../utils/payment';
import { getEscrowStatusExplanation } from '../utils/payment';

interface EscrowOrderTrackingProps {
  order: Order;
  userRole: 'buyer' | 'seller' | 'admin';
  onConfirmDelivery?: () => void;
  onShipItem?: () => void;
  onCancelOrder?: () => void;
  onRaiseDispute?: () => void;
  isLoading?: boolean;
}

const STATUS_STEPS = [
  { key: 'pending', label: 'Order Placed', icon: ShoppingBag },
  { key: 'accepted', label: 'Accepted', icon: Check },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: Package },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle },
  { key: 'completed', label: 'Completed', icon: CheckCircle },
];

export function EscrowOrderTracking({
  order,
  userRole,
  onConfirmDelivery,
  onShipItem,
  onCancelOrder,
  onRaiseDispute,
  isLoading = false,
}: EscrowOrderTrackingProps) {
  const [showDetails, setShowDetails] = useState(false);

  const currentStepIndex = STATUS_STEPS.findIndex(
    (step) => step.key === order.status
  );
  const currentStep = STATUS_STEPS[currentStepIndex];

  const getStatusIcon = (stepKey: string) => {
    if (
      currentStepIndex > STATUS_STEPS.findIndex((s) => s.key === stepKey)
    ) {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
    if (currentStep?.key === stepKey) {
      return <Clock className="w-5 h-5 text-blue-600" />;
    }
    return <Circle className="w-5 h-5 text-gray-300" />;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Order #{order.id.slice(0, 8)}
        </h3>
        <p className="text-sm text-gray-600">{order.listingTitle}</p>
      </div>

      {/* Payment Status Alert */}
      <div
        className={`rounded-lg p-3 mb-6 flex gap-3 ${
          order.paymentStatus === 'completed'
            ? 'bg-green-50 border border-green-200'
            : 'bg-yellow-50 border border-yellow-200'
        }`}
      >
        {order.paymentStatus === 'completed' ? (
          <>
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-green-900">Payment Secured</p>
              <p className="text-green-800">
                {formatCurrency(order.price)} held in escrow. Will be released to seller upon
                your confirmation.
              </p>
            </div>
          </>
        ) : (
          <>
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-yellow-900">Payment Pending</p>
              <p className="text-yellow-800">Complete payment to proceed with this order.</p>
            </div>
          </>
        )}
      </div>

      {/* Timeline Progress */}
      <div className="mb-8">
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {STATUS_STEPS.map((step, idx) => {
            const StepIcon = step.icon;
            const isCompleted = currentStepIndex >= idx;
            const isCurrent = currentStep?.key === step.key;

            return (
              <div key={step.key} className="flex flex-col items-center flex-shrink-0">
                <div
                  className={`p-2 rounded-full mb-1 ${
                    isCompleted ? 'bg-green-100' : isCurrent ? 'bg-blue-100' : 'bg-gray-100'
                  }`}
                >
                  <StepIcon
                    className={`w-5 h-5 ${
                      isCompleted
                        ? 'text-green-600'
                        : isCurrent
                          ? 'text-blue-600'
                          : 'text-gray-400'
                    }`}
                  />
                </div>
                <p className="text-xs font-medium text-gray-700 text-center max-w-16">
                  {step.label}
                </p>
              </div>
            );
          })}
        </div>

        {/* Current Status Explanation */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-900">
            <strong>Status:</strong> {getEscrowStatusExplanation(order.status)}
          </p>
        </div>
      </div>

      {/* Order Details */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="text-sm text-blue-600 hover:text-blue-700 font-medium mb-4"
      >
        {showDetails ? 'Hide' : 'Show'} Order Details
      </button>

      {showDetails && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Order ID:</span>
            <span className="font-mono">{order.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Seller:</span>
            <span className="font-medium">{order.sellerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Price:</span>
            <span className="font-medium">{formatCurrency(order.price)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Payment Status:</span>
            <span
              className={`font-medium ${
                order.paymentStatus === 'completed'
                  ? 'text-green-600'
                  : order.paymentStatus === 'failed'
                    ? 'text-red-600'
                    : 'text-yellow-600'
              }`}
            >
              {order.paymentStatus}
            </span>
          </div>
          {order.deliveryDetails?.method && (
            <div className="flex justify-between">
              <span className="text-gray-600">Delivery:</span>
              <span className="font-medium">
                {order.deliveryDetails.method === 'meetup'
                  ? 'Meet Buyer'
                  : 'Shipping'}
              </span>
            </div>
          )}
          {order.deliveryDetails?.trackingNumber && (
            <div className="flex justify-between">
              <span className="text-gray-600">Tracking:</span>
              <span className="font-mono text-blue-600">{order.deliveryDetails.trackingNumber}</span>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="border-t border-gray-200 pt-6 space-y-3">
        {/* Buyer Actions */}
        {userRole === 'buyer' && (
          <>
            {order.status === 'delivered' && order.paymentStatus === 'completed' && (
              <div className="space-y-3">
                <button
                  onClick={onConfirmDelivery}
                  disabled={isLoading}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 rounded-lg transition"
                >
                  ✓ Confirm Delivery & Release Payment
                </button>
                <button
                  onClick={onRaiseDispute}
                  disabled={isLoading}
                  className="w-full bg-orange-100 hover:bg-orange-200 text-orange-900 font-medium py-2 rounded-lg transition"
                >
                  ⚠️ Report Issue / Raise Dispute
                </button>
              </div>
            )}
            {order.status === 'pending' && (
              <button
                onClick={onCancelOrder}
                disabled={isLoading}
                className="w-full bg-red-100 hover:bg-red-200 text-red-900 font-medium py-2 rounded-lg transition"
              >
                Cancel Order
              </button>
            )}
            {['pending', 'accepted', 'shipped'].includes(order.status) && (
              <p className="text-sm text-gray-600 text-center">
                ⏳ Waiting for seller...
              </p>
            )}
          </>
        )}

        {/* Seller Actions */}
        {userRole === 'seller' && (
          <>
            {order.status === 'pending' && (
              <button
                onClick={() => {}}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-lg transition"
              >
                ✓ Accept Order
              </button>
            )}
            {order.status === 'accepted' && (
              <button
                onClick={onShipItem}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 rounded-lg transition"
              >
                📦 Mark as Shipped
              </button>
            )}
            {['pending', 'accepted', 'shipped'].includes(order.status) && (
              <p className="text-sm text-gray-600 text-center">
                💰 Payment held in escrow. You'll receive it when buyer confirms.
              </p>
            )}
            {order.status === 'completed' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center text-sm text-green-900">
                <p>✓ Order completed and payment released!</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Helper Circle component
function Circle({ className }: { className?: string }) {
  return <div className={`rounded-full ${className || ''}`} />;
}
