from django.db import models
from django.contrib.auth.models import User
import uuid

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ["name"]

    def __str__(self):
        return self.name
    

class Product(models.Model):
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name="products"
    )
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True)
    description = models.TextField()
    short_description = models.TextField(default="", blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    # Inventory
    stock = models.PositiveIntegerField(default=0)
    is_available = models.BooleanField(default=True)
    low_stock_threshold = models.PositiveIntegerField(default=5)
    # Images
    image = models.ImageField(upload_to="products/", blank=True, null=True)
    alternative_image = models.ImageField(upload_to='products/alt/', blank=True, null=True)
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name
    
    @property
    def in_stock(self):
        """Check if product is in stock"""
        return self.stock > 0 and self.is_available
    
    @property
    def is_low_stock(self):
        """Check if product is below threshold"""
        return 0 < self.stock <= self.low_stock_threshold and self.is_available
    
    @property
    def is_out_of_stock(self):
        """Check if product is out of stock"""
        return self.stock == 0
    
    @property
    def review_count(self):
        """Count of approved reviews"""
        return self.reviews.filter(is_approved=True).count()
    
    @property
    def rating_distribution(self):
        """Get distribution of ratings (how many 5-star, 4-star, etc.)"""
        distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        approved_reviews = self.reviews.filter(is_approved=True)
        
        for review in approved_reviews:
            distribution[review.rating] += 1
        
        return distribution

class Cart(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    session_key = models.CharField(max_length=40, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        if self.user:
            return f"Cart - {self.user.username}"
        return f"Cart - Guest ({self.session_key})"
    
    @property
    def total_items(self):
        """Total of items in cart"""
        return sum(item.quantity for item in self.items.all())
    
    @property
    def subtotal(self):
        """Calculate cart subtotal"""
        return sum(item.total_price for item in self.items.all())

class CartItem(models.Model):
    cart = models.ForeignKey(
        Cart,
        on_delete=models.CASCADE,
        related_name="items"
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE
    )
    quantity = models.PositiveIntegerField(default=1)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("cart", "product") # Same product can't be added twice
        ordering = ["added_at"]

    def __str__(self):
        return f"{self.quantity}x {self.product.name}"
    
    @property
    def total_price(self):
        """Calculate total price for this item"""
        return self.quantity * self.product.price
    
    def clean(self):
        """Validate before saving"""
        from django.core.exceptions import ValidationError
        if self.quantity > self.product.stock:
            raise ValidationError(f"Only {self.product.stock} items available in stock.")
        
class Order(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("processing", "Processing"),
        ("shipped", "Shipped"),
        ("delivered", "Delivered"),
        ("cancelled", "Cancelled"),
    ]

    PAYMENT_STATUS_CHOICES = [
        ("pending", "Pending"),
        ("completed", "Completed"),
        ("failed", "Failed"),
        ("refunded", "Refunded"),
    ]

    # Order identification
    order_number = models.CharField(max_length=100, unique=True, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="orders"
    )

    # Customer information (stored here in case user is deleted)
    email = models.EmailField()
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)

    # Shipping address
    address_line1 = models.CharField(max_length=255)
    address_line2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    country = models.CharField(max_length=100, default="US")
    phone = models.CharField(max_length=20)

    # Order details
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    shipping_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Coupon/Discount
    coupon = models.ForeignKey(
        "Coupon",  # String reference since Coupon might be defined after Order
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders"
    )
    discount_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0,
        help_text="Amount discounted by coupon"
    )

    total = models.DecimalField(max_digits=10, decimal_places=2)

    # Status tracking
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending"
    )
    payment_status = models.CharField(
        max_length=20,
        choices=PAYMENT_STATUS_CHOICES,
        default="pending"
    )

    # Stripe integration
    stripe_payment_intent_id = models.CharField(max_length=255, blank=True)
    idempotency_key = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)

    # Shipping tracking
    tracking_number = models.CharField(max_length=100, blank=True)
    carrier = models.CharField(
        max_length=50,
        blank=True,
        choices=[
           ("USPS", "USPS"),
            ("FedEx", "FedEx"),
            ("UPS", "UPS"),
            ("DHL", "DHL"),
            ("Other", "Other"), 
        ]
    )
    shipped_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Order {self.order_number}"
    
    def save(self, *args, **kwargs):
        """Generate order number on creation"""
        if not self.order_number:
            # Generate unique order number
            from datetime import datetime
            date_str = datetime.now().strftime("%Y%m%d")
            unique_id = str(uuid.uuid4())[:8].upper()
            self.order_number = f"ORD-{date_str}-{unique_id}"
        super().save(*args, **kwargs)

class OrderItem(models.Model):
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="items"
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.SET_NULL,
        null=True
    )
    product_name = models.CharField(max_length=200)
    product_price = models.DecimalField(max_digits=10, decimal_places=2)
    product_image = models.URLField(max_length=500, blank=True, null=True)
    quantity = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"{self.quantity}x {self.product_name}"
    
    @property
    def total_price(self):
        """Calculate total price for this order item"""
        return self.quantity * self.product_price

class Coupon(models.Model):
    """Disscount coupons for orders"""
    DISCOUNT_TYPES = [
        ("percentage", "Percentage"),
        ("fixed", 'Fixed Amount'),
    ]

    # Coupon identification
    code = models.CharField(max_length=50, unique=True, db_index=True)
    description = models.TextField(blank=True)
    # Discount configuration
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPES)
    discount_value = models.DecimalField(max_digits=10, decimal_places=2)
    # Usage restrictions
    valid_from =  models.DateField()
    valid_until = models.DateField()
    max_uses = models.PositiveIntegerField(default=1)
    times_used = models.PositiveIntegerField(default=0)
    minimum_purchase = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Minimum order subtotal required to use this coupon"
    )
    # Status
    is_active = models.BooleanField(default=True)
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.code} - {self.get_discount_display()}"
    
    def get_discount_display(self):
        """Display discount in human-readable format"""
        if self.discount_type == "percentage":
            return f"{self.discount_value}% off"
        else:
            return f"${self.discount_value} off"
        
    def is_valid(self):
        """Check if coupon is currently valid"""
        from django.utils import timezone
        now = timezone.now().date()
        return (
            self.is_active and
            self.valid_from <= now <= self.valid_until and
            self.times_used < self.max_uses
        )
    
    def can_be_used_for_order(self, order_subtotal):
        """Check if coupon can be used for a given order subtotal"""
        return self.is_valid() and order_subtotal >= self.minimum_purchase
    
    def calculate_discount(self, subtotal):
        """Calculate discount amount for a given subtotal"""
        from decimal import Decimal
        
        if self.discount_type == "percentage":
            discount = subtotal * (self.discount_value / Decimal("100"))
        else:
            discount = self.discount_value
        
        # Discount can't be more than subtotal
        return min(discount, subtotal)

class ProductReview(models.Model):
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="reviews"
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="reviews"
    )
    # Review content
    rating = models.PositiveIntegerField(
        choices=[(1, '1 Star'), (2, '2 Stars'), (3, '3 Stars'), (4, '4 Stars'), (5, '5 Stars')],
        help_text="Rating from 1 to 5 stars"
    )
    title = models.CharField(max_length=200)
    comment = models.TextField()
    # Moderation
    is_approved = models.BooleanField(
        default=False,
        help_text="Reviews must be approved before appearing publicly"
    )
    # Verified purchase tracking
    order = models.ForeignKey(
        Order,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviews",
        help_text="Order associated with this review (verified purchase)"
    )
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ('product', 'user')  # One review per user per product
        indexes = [
            models.Index(fields=['product', 'is_approved']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.product.name} ({self.rating}★)"
    
    @property
    def is_verified_purchase(self):
        """Check if this review is from a verified purchase"""
        return self.order is not None
