from rest_framework import serializers
from .models import Category, Product, Cart, CartItem, Order, OrderItem, Coupon, ProductReview
from django.contrib.auth.models import User
from decimal import Decimal

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
    Serializer for Product model
    """
    category_name = serializers.CharField(source="category.name", read_only=True)
    in_stock = serializers.BooleanField(read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)
    is_out_of_stock = serializers.BooleanField(read_only=True)
    review_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "category",
            "category_name",
            "name",
            "slug",
            "description",
            "short_description",
            "price",
            "stock",
            "low_stock_threshold",
            "is_available",
            "in_stock",
            "is_low_stock",
            "is_out_of_stock",
            "review_count",
            "image",
            "alternative_image",
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
    Now includes total, shipping_cost, and discount_amount for frontend calculations
    """
    items = CartItemSerializer(many=True, read_only=True)
    total_items = serializers.IntegerField(read_only=True)
    subtotal = serializers.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        read_only=True
    )
    # New computed fields for checkout
    shipping_cost = serializers.SerializerMethodField()
    discount_amount = serializers.SerializerMethodField()
    total = serializers.SerializerMethodField()
    coupon = serializers.SerializerMethodField()
    
    class Meta:
        model = Cart
        fields = [
            'id',
            'user',
            'items',
            'total_items',
            'subtotal',
            'shipping_cost',
            'discount_amount',
            'coupon',
            'total',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['user', 'created_at', 'updated_at']
    
    def get_shipping_cost(self, obj):
        """
        Calculate shipping cost
        Free shipping over $50, otherwise $5
        """
        subtotal = obj.subtotal or Decimal('0')
        if not obj.items.exists():
            return Decimal('0.00')
        if subtotal >= Decimal('50.00'):
            return Decimal('0.00')
        return Decimal('5.00')
    
    def get_discount_amount(self, obj):
        """
        Get discount from context (set when coupon is applied)
        """
        return self.context.get('discount_amount', Decimal('0.00'))
    
    def get_coupon(self, obj):
        """
        Get coupon info from context
        """
        return self.context.get('coupon_data', None)
    
    def get_total(self, obj):
        """
        Calculate total: subtotal + shipping - discount
        """
        subtotal = obj.subtotal or Decimal('0')
        shipping = self.get_shipping_cost(obj)
        discount = self.get_discount_amount(obj)
        return subtotal + shipping - discount
    
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
    coupon_code = serializers.SerializerMethodField()
    
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
            'coupon',
            'coupon_code',
            'discount_amount',
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
    
    def get_coupon_code(self, obj):
        """Return coupon code if exists"""
        return obj.coupon.code if obj.coupon else None

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

class CouponSerializer(serializers.ModelSerializer):
    """
    Serializer for Coupon model
    """
    discount_display = serializers.CharField(source='get_discount_display', read_only=True)
    is_currently_valid = serializers.BooleanField(source='is_valid', read_only=True)
    
    class Meta:
        model = Coupon
        fields = [
            'id',
            'code',
            'description',
            'discount_type',
            'discount_value',
            'discount_display',
            'minimum_purchase',
            'valid_from',
            'valid_until',
            'max_uses',
            'times_used',
            'is_active',
            'is_currently_valid'
        ]
        read_only_fields = ['times_used']

class ProductReviewSerializer(serializers.ModelSerializer):
    """
    Serializer for ProductReview model
    """
    user_name = serializers.CharField(source='user.username', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    is_verified_purchase = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = ProductReview
        fields = [
            'id',
            'product',
            'user',
            'user_name',
            'first_name',
            'rating',
            'title',
            'comment',
            'is_approved',
            'is_verified_purchase',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['user', 'is_approved', 'created_at', 'updated_at']
    
    def validate_rating(self, value):
        """Validate rating is between 1 and 5"""
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value
    
    def validate(self, data):
        """Check if user already reviewed this product"""
        request = self.context.get('request')
        product = data.get('product')
        
        # Check if updating existing review
        if self.instance:
            return data
        
        # Check if user already has a review for this product
        if request and product:
            existing_review = ProductReview.objects.filter(
                user=request.user,
                product=product
            ).exists()
            
            if existing_review:
                raise serializers.ValidationError(
                    "You have already reviewed this product"
                )
        
        return data
