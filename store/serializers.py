from rest_framework import serializers
from .models import Category, Product, Cart, CartItem, Order, OrderItem
from django.contrib.auth.models import User

class CategorySerializer(serializers.ModelSerializer):
    """
    Serializer for Category model
    Converts Category objects to/from JSON
    """
    class Meta:
        model = Category
        fields = ["id", "name", "slug", "description"]

class ProductSerializer(serializers.ModelSerializer):
    """
    Serializer for Category model
    """
    category_name = serializers.CharField(source="category.name", read_only=True)
    in_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "category",
            "category_name",
            "name",
            "slug",
            "description",
            "price",
            "stock",
            "is_available",
            "in_stock",
            "image",
            "created_at",
            "updated_at"
        ]
        read_only_fields = ["created_at", "updated_at"]

class CartItemSerializer(serializers.ModelSerializer):
    """
    Serializer for CartItem model
    """
    product = ProductSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)
    total_price = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True
    )

    class Meta:
        model = CartItem
        fields = [
            "id",
            "product",
            "product_id",
            "quantity",
            "total_price",
            "added_at"
        ]

    def validate_quantity(self, value):
        """
        Custom validation for quantity
        """
        if value < 1:
            raise serializers.ValidationError("Quantity must be at least 1.")
        return value
    
    def validate(self, data):
        product_id = data.get("product_id")
        quantity = data.get("quantity", 1)

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            raise serializers.ValidationError("Product not found.")

        if quantity > product.stock:
            raise serializers.ValidationError(
                f"Only {product.stock} items available in stock."
            )  
        
        if not product.is_available:
            raise serializers.ValidationError("Product is not available.")
        
        return data
    
class CartSerializer(serializers.ModelSerializer):
    """
    Serializer for Cart model
    """
    items = CartItemSerializer(many=True, read_only=True)
    total_items = serializers.IntegerField(read_only=True)
    subtotal = serializers.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        read_only=True
    )
    
    class Meta:
        model = Cart
        fields = [
            'id',
            'user',
            'items',
            'total_items',
            'subtotal',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['user', 'created_at', 'updated_at']
    
class OrderItemSerializer(serializers.ModelSerializer):
    """
    Serializer for OrderItem model
    """
    class Meta:
        model = OrderItem
        fields = [
            'id',
            'product',
            'product_name',
            'product_price',
            'quantity',
            'total_price'
        ]  

class OrderSerializer(serializers.ModelSerializer):
    """
    Serializer for Order model
    """
    items = OrderItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id',
            'order_number',
            'user',
            'email',
            'first_name',
            'last_name',
            'address_line1',
            'address_line2',
            'city',
            'state',
            'postal_code',
            'country',
            'phone',
            'subtotal',
            'shipping_cost',
            'tax',
            'total',
            'status',
            'payment_status',
            'stripe_payment_intent_id',
            'tracking_number',
            'carrier',
            'shipped_at',
            'delivered_at',
            'items',
            'created_at',
            'updated_at'
        ]
        read_only_fields = [
            'order_number',
            'stripe_payment_intent_id',
            'idempotency_key',
            'created_at',
            'updated_at'
        ]

class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for User model
    """
    password = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name']
        extra_kwargs = {
            'password': {'write_only': True}
        }
    
    def create(self, validated_data):
        """
        Create user with hashed password
        """
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user
