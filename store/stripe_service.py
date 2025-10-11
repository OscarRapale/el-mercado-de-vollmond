import stripe
from django.conf import settings
from decimal import Decimal

stripe.api_key = settings.STRIPE_SECRET_KEY

class StripeService:
    """
    Service class for Stripe operations
    Handles payment intents, checkout sessions, etc.
    """

    @staticmethod
    def create_payment_intend(order):
        """
        Create a Stripe Payment Intent for an order
        
        Args:
            order: Order object
            
        Returns:
            Payment Intent object from Stripe
        """
        try:
            # Amount must be in cents (smallest currency unit)
            amount_cents = int(order.total * 100)

            # Create payment intent with idempotency key for safety
            intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency="usd",
                metadata={
                    "order_number": order.order_number,
                    "order_id": order.id,
                },
                idempotency_key=str(order.idempotency_key),
            )

            return intent
        
        except stripe.error.StripeError as e:
            # Handle Stripe erros
            raise Exception(f"Stripe error: {str(e)}")
        
    @staticmethod
    def create_checkout_session(order, success_url, cancel_url):
        """
        Create a Stripe Checkout Session
        This redirects user to Stripe's hosted checkout page
        
        Args:
            order: Order object
            success_url: URL to redirect after successful payment
            cancel_url: URL to redirect if user cancels
            
        Returns:
            Checkout Session object from Stripe
        """
        try:
            # Prepare line items for Stripe
            line_items = []

            for item in order.items.all():
                line_items.append({
                    "price_data": {
                        "currency": "usd",
                        "product_data": {
                            "name": item.product_name,
                        },
                        "unit_amount": int(item.product_price * 100),
                    },
                    "quantity": item.quantity,
                })

            # Add shipping as a line item if applicable
            if order.shipping_cost > 0:
                line_items.append({
                    "price_data": {
                        "currency": "usd",
                        "product_data": {
                            "name": "Shipping",
                        },
                        "unit_amount": int(order.shipping_cost * 100),
                    },
                    "quantity": 1,
                })

            # Add tax as a line item if applicable
            if order.tax > 0:
                line_items.append({
                    "price_data": {
                      "currency": "usd",
                      "product_data": {
                          "name": "Tax",
                      },
                      "unit_amount": int(order.tax * 100),
                    },
                    "quantity": 1,
                })

            # Create checkout session
            session = stripe.checkout.Session.create(
                payment_method_types=["card"],
                line_items=line_items,
                mode="payment",
                success_url=success_url,
                cancel_url=cancel_url,
                client_reference_id=str(order.id),
                metadata={
                    "order_number": order.order_number,
                    "order_id": order.id,
                },
                idempotency_key=str(order.idempotency_key),

            )
            return session
        
        except stripe.error.StripeError as e:
            raise Exception(f"Stripe error: {str(e)}")
        
    @staticmethod
    def retrieve_payment_intent(payment_intent_id):
        """
        Retrieve a Payment Intent from Stripe
        
        Args:
            payment_intent_id: Stripe Payment Intent ID
            
        Returns:
            Payment Intent object
        """
        try:
            return stripe.PaymentIntent.retrieve(payment_intent_id)
        except stripe.error.StripeError as e:
            raise Exception(f"Stripe error: {str(e)}")
        
    @staticmethod
    def retrieve_checkout_session(session_id):
        """
        Retrieve a Checkout Session from Stripe
        
        Args:
            session_id: Stripe Checkout Session ID
            
        Returns:
            Checkout Session object
        """
        try:
            return stripe.checkout.Session.retrieve(session_id)
        except stripe.error.StripeError as e:
            raise Exception(f"Stripe error: {str(e)}")
