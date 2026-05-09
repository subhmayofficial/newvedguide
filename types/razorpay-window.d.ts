export {};

declare global {
  interface Window {
    /** Razorpay Checkout (loaded from checkout.razorpay.com/v1/checkout.js) */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}
