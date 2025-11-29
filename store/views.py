from decimal import Decimal
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import authenticate, login, logout
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from django.middleware.csrf import get_token
from django.http import JsonResponse
import stripe
from .stripe_service import StripeService
from django.db import transaction
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAuthenticatedOrReadOnly
from django.contrib.auth.models import User
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from django.utils.decorators import method_decorator
from .analytics import AnalyticsService
from rest_framework.permissions import IsAdminUser
import json
from .models import Category, Product, Cart, CartItem, Order, OrderItem, Coupon, ProductReview
from .serializers import (
    CategorySerializer,
    ProductSerializer,
    CartSerializer,
    CartItemSerializer,
    OrderSerializer,
    UserSerializer,
    ProductReviewSerializer
)

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for categories
    ReadOnly = GET only (list and detail)
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]
    lookup_field = "slug"

class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for products
    """
    queryset = Product.objects.filter(is_available=True)
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]
    lookup_field = "slug"

    def get_queryset(self):
        """
        Filter products by category if specified
        """
        queryset = super().get_queryset()
        category_slug = self.request.query_params.get("category", None)

        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)

        return queryset
    
    @action(detail=True, methods=["get"])
    def reviews(self, request, slug=None):
        """
        GET /api/products/{slug}/reviews/
        Get all approved reviews for a product
        """
        product = self.get_object()
        reviews = product.reviews.filter(is_approved=True)
        serializer = ProductReviewSerializer(reviews, many=True)
        
        return Response({
            "product_id": product.id,
            "product_name": product.name,
            "average_rating": product.average_rating,
            "total_reviews": product.review_count,
            "rating_distribution": product.rating_distribution,
            "reviews": serializer.data
        })

class CartViewSet(viewsets.ModelViewSet):
    """
    API endpoint for shopping cart
    """
    serializer_class = CartSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Return cart for current user only
        """
        return Cart.objects.filter(user=self.request.user)
    
    def get_object(self):
        """
        Get or create cart for current user
        """
        cart, created = Cart.objects.get_or_create(user=self.request.user)
        return cart
    
    @action(detail=False, methods=["get"])
    def current(self, request):
        """
        GET /api/cart/current/ - Get current user's cart
        """
        cart = self.get_object()
        serializer = self.get_serializer(cart)
        return Response(serializer.data)
    
    @action(detail=False, methods=["post"])
    def add_item(self, request):
        """
        POST /api/cart/add_item/ - Add item to cart
        Body: {"product_id": 1, "quantity": 2}
        """
        cart = self.get_object()
        product_id = request.data.get("product_id")
        quantity = request.data.get("quantity", 1)

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response(
                {"error": "Product not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if item already in cart
        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={"quantity": quantity}
        )

        if not created:
            # Item exists. increase quantity
            cart_item.quantity += quantity
            cart_item.save()

        serializer = CartSerializer(cart)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def update_item(self, request):
        """
        POST /api/cart/update_item/ - Update item quantity
        Body: {"cart_item_id": 1, "quantity": 3}
        """
        cart = self.get_object()
        cart_item_id = request.data.get('cart_item_id')
        quantity = request.data.get('quantity')
        
        try:
            cart_item = CartItem.objects.get(id=cart_item_id, cart=cart)
        except CartItem.DoesNotExist:
            return Response(
                {'error': 'Cart item not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if quantity <= 0:
            cart_item.delete()
        else:
            cart_item.quantity = quantity
            cart_item.save()
        
        serializer = CartSerializer(cart)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def remove_item(self, request):
        """
        POST /api/cart/remove_item/ - Remove item from cart
        Body: {"cart_item_id": 1}
        """
        cart = self.get_object()
        cart_item_id = request.data.get('cart_item_id')
        
        try:
            cart_item = CartItem.objects.get(id=cart_item_id, cart=cart)
            cart_item.delete()
        except CartItem.DoesNotExist:
            return Response(
                {'error': 'Cart item not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = CartSerializer(cart)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def clear(self, request):
        """
        POST /api/cart/clear/ - Clear all items from cart
        """
        cart = self.get_object()
        cart.items.all().delete()
        serializer = CartSerializer(cart)
        return Response(serializer.data)
    
    @action(detail=False, methods=["post"])
    def create_order(self, request):
        """
        POST /api/cart/create_order/
        Create an order from cart and initiate Stripe checkout
        
        Body: {
            "email": "customer@example.com",
            "first_name": "John",
            "last_name": "Doe",
            "address_line1": "123 Main St",
            "address_line2": "Apt 4",
            "city": "New York",
            "state": "NY",
            "postal_code": "10001",
            "country": "US",
            "phone": "555-1234"
        }
        """
        cart = self.get_object()

        # Validate cart has items
        if not cart.items.exists():
            return Response(
                {"error": "Cart is empty"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get shipping/billing info from request
        shipping_data = {
            "email": request.data.get("email"),
            "first_name": request.data.get("first_name"),
            "last_name": request.data.get("last_name"),
            "address_line1": request.data.get("address_line1"),
            "address_line2": request.data.get("address_line2", ""),
            "city": request.data.get("city"),
            "state": request.data.get("state"),
            "postal_code": request.data.get("postal_code"),
            "country": request.data.get("country", "US"),
            "phone": request.data.get("phone"),
        }

        # Validate required fields
        required_fields = ["email", "first_name", "last_name", "address_line1",
                        "city", "state", "postal_code", "phone"]
        for field in required_fields:
            if not shipping_data.get(field):
                return Response(
                    {"error": f"{field} is required"}
                )
            
        # Get coupon code if provided - NEW!
        coupon_code = request.data.get('coupon_code', '').strip()
        coupon = None
        discount_amount = Decimal('0.00')
        
        if coupon_code:
            try:
                coupon = Coupon.objects.get(code__iexact=coupon_code)
                
                # Validate coupon
                subtotal = cart.subtotal
                
                if not coupon.is_valid():
                    return Response(
                        {'error': 'Invalid or expired coupon code'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                if not coupon.can_be_used_for_order(subtotal):
                    return Response(
                        {'error': f'Minimum purchase of ${coupon.minimum_purchase} required'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Calculate discount
                discount_amount = coupon.calculate_discount(subtotal)
                
            except Coupon.DoesNotExist:
                return Response(
                    {'error': 'Invalid coupon code'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
        try:
            # Use transaction to ensure data consistency
            with transaction.atomic():
                # Calculate totals
                subtotal = cart.subtotal
                shipping_cost = Decimal("5.00")

                # Apply discount before calculation tax
                discounted_subtotal = subtotal - discount_amount

                # Calculate tax on discounted amount
                tax = subtotal * Decimal("0.08")
                #Final total
                total = discounted_subtotal + shipping_cost + tax

                # Create order
                order = Order.objects.create(
                    user=request.user,
                    email=shipping_data['email'],
                    first_name=shipping_data['first_name'],
                    last_name=shipping_data['last_name'],
                    address_line1=shipping_data['address_line1'],
                    address_line2=shipping_data['address_line2'],
                    city=shipping_data['city'],
                    state=shipping_data['state'],
                    postal_code=shipping_data['postal_code'],
                    country=shipping_data['country'],
                    phone=shipping_data['phone'],
                    subtotal=subtotal,
                    coupon=coupon,
                    discount_amount=discount_amount,
                    shipping_cost=shipping_cost,
                    tax=tax,
                    total=total,
                    status='pending',
                    payment_status='pending',
                )

                # Increment coupon usage
                if coupon:
                    coupon.times_used += 1
                    coupon.save()

                # Create order items from cart items
                for cart_item in cart.items.all():
                    OrderItem.objects.create(
                        order=order,
                        product=cart_item.product,
                        product_name=cart_item.product.name,
                        product_price=cart_item.product.price,
                        quantity=cart_item.quantity,
                    )

                    # Reduce product stock
                    product = cart_item.product
                    product.stock -= cart_item.quantity

                    # Auto-disable if out of stock
                    if product.stock == 0:
                        product.is_available = False

                    product.save()

                # Create Stripe checkout session
                success_url = request.data.get(
                    'success_url', 
                    'http://localhost:3000/order/success?session_id={CHECKOUT_SESSION_ID}'
                )
                cancel_url = request.data.get(
                    'cancel_url',
                    'http://localhost:3000/order/cancel'
                )
            
                checkout_session = StripeService.create_checkout_session(
                    order=order,
                    success_url=success_url,
                    cancel_url=cancel_url,
                )

                # Store Stripe session ID
                order.stripe_payment_intent_id = checkout_session.id
                order.save()
            
                # Clear the cart after order creation
                cart.items.all().delete()
            
                return Response({
                    'order_id': order.id,
                    'order_number': order.order_number,
                    'checkout_url': checkout_session.url,
                    'session_id': checkout_session.id,
                    'discount_applied': discount_amount > 0,
                    'discount_amount': str(discount_amount),
                }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
    @action(detail=False, methods=['post'])
    def apply_coupon(self, request):
        """
        POST /api/cart/apply_coupon/
        Apply a coupon code to calculate discount
        Body: {"code": "SAVE10"}
        """
        cart = self.get_object()
        coupon_code = request.data.get('code', '').strip().upper()
        
        if not coupon_code:
            return Response(
                {'error': 'Coupon code is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            coupon = Coupon.objects.get(code__iexact=coupon_code)
        except Coupon.DoesNotExist:
            return Response(
                {'error': 'Invalid coupon code'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if coupon is valid
        if not coupon.is_valid():
            if not coupon.is_active:
                return Response(
                    {'error': 'This coupon is no longer active'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            elif coupon.times_used >= coupon.max_uses:
                return Response(
                    {'error': 'This coupon has reached its usage limit'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            else:
                return Response(
                    {'error': 'This coupon has expired'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Check minimum purchase requirement
        subtotal = cart.subtotal
        if subtotal < coupon.minimum_purchase:
            return Response(
                {
                    'error': f'Minimum purchase of ${coupon.minimum_purchase} required. Your cart is ${subtotal}.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calculate discount
        discount_amount = coupon.calculate_discount(subtotal)
        shipping_cost = Decimal('5.00')
        tax = (subtotal - discount_amount + shipping_cost) * Decimal('0.08')
        total = subtotal - discount_amount + shipping_cost + tax
        
        return Response({
            'valid': True,
            'coupon_code': coupon.code,
            'discount_type': coupon.discount_type,
            'discount_display': coupon.get_discount_display(),
            'subtotal': subtotal,
            'discount_amount': discount_amount,
            'shipping_cost': shipping_cost,
            'tax': tax,
            'total': total,
            'message': f'Coupon "{coupon.code}" applied! You save ${discount_amount}'
        })

        
class OrderViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for orders
    ReadOnly for now - creation happens via Stripe webhook
    """
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Return orders for current user only
        """
        return Order.objects.filter(user=self.request.user)

    @action(detail=True, methods=['get'])
    def tracking(self, request, pk=None):
        """
        GET /api/orders/{id}/tracking/
        Get tracking information for an order
        """
        order = self.get_object()
        
        if not order.tracking_number:
            return Response({
                'status': 'pending',
                'message': 'Tracking information not available yet.'
            })
        
        # Generate tracking URL based on carrier
        tracking_urls = {
            'USPS': f'https://tools.usps.com/go/TrackConfirmAction?qtc_tLabels1={order.tracking_number}',
            'FedEx': f'https://www.fedex.com/fedextrack/?trknbr={order.tracking_number}',
            'UPS': f'https://www.ups.com/track?tracknum={order.tracking_number}',
            'DHL': f'https://www.dhl.com/en/express/tracking.html?AWB={order.tracking_number}',
        }
        
        return Response({
            'order_number': order.order_number,
            'status': order.status,
            'tracking_number': order.tracking_number,
            'carrier': order.carrier,
            'tracking_url': tracking_urls.get(order.carrier, ''),
            'shipped_at': order.shipped_at,
            'delivered_at': order.delivered_at,
        })

class ProductReviewViewSet(viewsets.ModelViewSet):
    """
    API endpoint for product reviews
    """
    serializer_class = ProductReviewSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        """
        Return reviews for a specific product
        Only show approved reviews to non-staff users
        """
        queryset = ProductReview.objects.all()

        # Filter by product if specified
        product_id = self.request.query_params.get("product", None)
        if product_id:
            queryset = queryset.filter(product_id=product_id)

        # Non-staff users only see approved reviews
        if not self.request.user.is_staff:
            queryset = queryset.filter(is_approved=True)

        return queryset
    
    def perform_create(self, serializer):
        """
        Create review with current user
        Check if user purchased the product
        """
        product = serializer.validated_data["product"]
        user = self.request.user

        # Check if user has purchased this product
        purchased_order = Order.objects.filter(
            user=user,
            items__product=product,
            payment_status="completed"
        ).first()

        # Save review with user and order (if found)
        serializer.save(
            user=user,
            order=purchased_order
        )

    @action(detail=False, methods=["get"])
    def my_reviews(self, request):
        """
        GET /api/reviews/my_reviews/
        Get all reviews by current user
        """
        reviews = ProductReview.objects.filter(user=request.user)
        serializer= self.get_serializer(reviews, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=["get"])
    def rating_distribution(self, request, pk=None):
        """
        GET /api/reviews/{id}/rating_distribution/
        Get rating distribution for a product
        """
        review = self.get_object()
        product = review.product
        distribution = product.rating_distribution

        return Response({
            "product_id": product.id,
            "product_name": product.name,
            "avarage_rating": product.avarage_rating,
            "total_reviews": product.review_count,
            "distribution": distribution
        })
 
class UserViewSet(viewsets.ModelViewSet):
    """
    API endpoint for user registration
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]
    
    def get_permissions(self):
        """
        Allow anyone to create (register), but only authenticated to update
        """
        if self.action == "create":
            return [AllowAny()]
        return [IsAuthenticated()]

class RegisterView(APIView):
    """
    User registration endpoint
    POST /api/auth/register/
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.save()

            # Automaitically log in after registration
            login(request, user)

            return Response({
                "user": UserSerializer(user).data,
                "message": "User registered successfully"
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class LoginView(APIView):
    """
    User login endpoint
    POST /api/auth/login/
    Body: {"username": "john", "password": "password123"}
    """
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        if not username or not password:
            return Response(
                {"error": "Please provide both username and password"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Authenticate user
        user = authenticate(request, username=username, password=password)

        if user is not None:
            # Login successful
            login(request, user)
            return Response({
                "user": UserSerializer(user).data,
                "message": "Login successful"
            })
        else:
            # Invalid credentials
            return Response(
                {"error": "Invalid username or password"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
class LogoutView(APIView):
    """
    User logout endpoint
    POST /api/auth/logout/
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        logout(request)
        return Response({
            'message': 'Logout successful'
        })


class CurrentUserView(APIView):
    """
    Get current logged-in user
    GET /api/auth/user/
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
@ensure_csrf_cookie  # This decorator ensures the CSRF cookie is set
def get_csrf_token(request):
    """
    Get CSRF token for frontend
    GET /api/csrf/
    This endpoint sets the CSRF cookie and returns the token
    """
    csrf_token = get_token(request)
    response = JsonResponse({"csrfToken": csrf_token})
    return response

@api_view(['GET'])
@permission_classes([AllowAny])
def get_stripe_public_key(request):
    """
    Get Stripe publishable key for frontend
    GET /api/stripe/config/
    """
    return Response({
        "publicKey": settings.STRIPE_PUBLIC_KEY
    })

@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def stripe_webhook(request):
    """
    Stripe webhook endpoint
    POST /api/stripe/webhook/
    """
    payload = request.body
    sig_header = request.META.get("HTTP_STRIPE_SIGNATURE")
    webhook_secret = settings.STRIPE_WEBHOOK_SECRET

    if not webhook_secret:
        return Response({"status": "webhook secret not configured."})

    try:
        # Verify webhook signature
        event = stripe.Webhook.construct_event(
            payload, sig_header, webhook_secret
        )
    except ValueError as e:
        # Invalid payload
        return Response({"error": "Invalid payload"}, status=400)
    except stripe._error.SignatureVerificationError as e:
        # Invalid signature
        return Response({"error": "Invalid signature"}, status=400)

    # Handle the event
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        
        # Get the order
        order_id = session.get("client_reference_id")

        try:
            order = Order.objects.get(id=order_id)

            # Update order status
            order.payment_status = "completed"
            order.status = "processing"
            order.save()

            # Send order comfirmation email
            from .email_service import EmailService
            EmailService.send_order_confirmation(order)

            print(f"✅ Payment successful for order {order.order_number}")
            
        except Order.DoesNotExist:
            print(f"❌ Order {order_id} not found")

    elif event["type"] == "checkout.session.expired":
        session = event["data"]["object"]
        order_id = session.get("client_reference_id")

        try:
            order = Order.objects.get(id=order_id)
            order.payment_status = "failed"
            order.status = "cancelled"
            order.save()

            # Restore product stock
            for item in order.items.all():
                product = item.product
                if product:
                    product.stock += item.quantity
                    product.save()
            
            print(f"Checkout expired for order {order.order_number}")

        except Order.DoesNotExist:
            print(f"❌ Order {order_id} not found")

    return Response({"status": "success"})

@api_view(['GET'])
@permission_classes([IsAdminUser])
def analytics_dashboard(request):
    """
    GET /api/analytics/dashboard/
    Get complete dashboard analytics (Admin only)
    """
    data = AnalyticsService.get_complete_dashboard()
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def analytics_sales_overview(request):
    """
    GET /api/analytics/sales/
    Get sales overview (Admin only)
    """
    data = AnalyticsService.get_sales_overview()
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def analytics_top_products(request):
    """
    GET /api/analytics/top-products/
    Get top-selling products (Admin only)
    """
    limit = int(request.query_params.get('limit', 5))
    data = AnalyticsService.get_top_products(limit)
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def analytics_daily_sales(request):
    """
    GET /api/analytics/daily-sales/
    Get daily sales chart data (Admin only)
    """
    days = int(request.query_params.get('days', 30))
    data = AnalyticsService.get_daily_sales(days)
    return Response(data)
