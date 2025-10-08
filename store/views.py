from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAuthenticatedOrReadOnly
from django.contrib.auth.models import User
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
