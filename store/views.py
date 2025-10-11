from decimal import Decimal
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import authenticate, login, logout
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from django.middleware.csrf import get_token
from django.http import JsonResponse
from .stripe_service import StripeService
from django.db import transaction
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAuthenticatedOrReadOnly
from django.contrib.auth.models import User
from django.conf import settings
from .models import Category, Product, Cart, CartItem, Order, OrderItem
from .serializers import (
    CategorySerializer,
    ProductSerializer,
    CartSerializer,
    CartItemSerializer,
    OrderSerializer,
    UserSerializer
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
            
        try:
            # Use transaction to ensure data consistency
            with transaction.atomic():
                # Calculate totals
                subtotal = cart.subtotal
                shipping_cost = Decimal("5.00")
                tax = subtotal * Decimal("0.08")
                total = subtotal + shipping_cost + tax

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
                    shipping_cost=shipping_cost,
                    tax=tax,
                    total=total,
                    status='pending',
                    payment_status='pending',
                )

                # Create order items from cart items
                for cart_item in cart.items.all():
                    OrderItem.objects.create(
                        order=order,
                        product=cart_item.product,
                        product_name=cart_item.product.name,
                        product_price=cart_item.product.name,
                        quantity=cart_item.quantity,
                    )

                    # Reduce product stock
                    product = cart_item.product
                    product.stock -= cart_item.quantity
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
                }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        
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
        if self.action == 'create':
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
def get_csrf_token(request):
    """
    Get CSRF token for frontend
    GET /api/csrf/
    """
    csrf_token = get_token(request)
    return JsonResponse({"csrfToken": csrf_token})

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
