from django.contrib import admin
from .models import Category, Product, Cart, CartItem, Order, OrderItem, Coupon, ProductReview

admin.site.site_header = "Adminstración El Mercado de Vollmond"
admin.site.site_title = "El Mercado de Vollmond Admin"
admin.site.index_title = "Panel de Admin El Mercado de Vollmond"

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    """Admin interface for Category model"""
    list_display = ["name", "slug", "created_at"]
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ["name"]

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    """Admin interface for Product model"""
    list_display = [
        "name",
        "category",
        "price",
        "stock",
        "low_stock_threshold",
        "stock_status",
        "avarage_rating_display",
        "review_count",
        "is_available",
        "in_stock",
        "created_at"
    ]
    list_filter = ["category", "is_available", "created_at"]
    list_editable = ["price", "stock", "low_stock_threshold", "is_available"]
    search_fields = ["name", "description"]
    prepopulated_fields = {"slug": ("name",)}

    fieldsets = (
        ("Basic Information", {
            "fields": ("category", "name", "slug", "description", "short_description")
        }),
        ("Pricing & Inventory", {
            "fields": ("price", "stock", "is_available")
        }),
        ("Media", {
            "fields": ("image", "alternative_image")
        }),
    )

    readonly_fields = ["created_at", "updated_at"]

    def stock_status(self, obj):
        """Display stock status with color coding"""
        if obj.is_out_of_stock:
            return "🔴 Out of Stock"
        elif obj.is_low_stock:
            return "⚠️ Low Stock"
        else:
            return "✅ In Stock"
    
    stock_status.short_description = "Stock Status"

    actions = ["check_low_stock"]

    def check_low_stock(self, request, queryset):
        """Admin action: Check selected products for low stock"""
        from django.db.models import Q, F

        low_stock = queryset.filter(
            Q(stock__lte=F("low_stock_threshold")),
            Q(stock__gt=0)
        )

        out_of_stock = queryset.filter(stock=0)

        message_parts = []
        
        if low_stock.exists():
            message_parts.append(f"{low_stock.count()} product(s) are low on stock")
        
        if out_of_stock.exists():
            message_parts.append(f"{out_of_stock.count()} product(s) are out of stock")
        
        if not low_stock.exists() and not out_of_stock.exists():
            message_parts.append("All selected products have healthy stock levels")
        
        self.message_user(request, ' | '.join(message_parts))
    
    check_low_stock.short_description = "Check stock levels"

    def avarage_rating_display(self, obj):
        """Display average rating"""
        avg = obj.avarage_rating
        if avg:
            stars = '⭐' * int(avg)
            return f"{stars} {avg}"
        return "No reviews"
    avarage_rating_display.short_description = 'Avg Rating'
    
    def review_count(self, obj):
        """Display number of reviews"""
        count = obj.review_count
        return f"{count} review{'s' if count != 1 else ''}"
    review_count.short_description = 'Reviews'

class CartItemInline(admin.TabularInline):
    """Show cart items inside the Cart admin page"""
    model = CartItem
    extra = 0
    readonly_fields = ["product", "quantity", "total_price", "added_at"]
    can_delete = False

    def total_price(self, obj):
        return f"${obj.total_price:.2f}"
    total_price.short_description = "Total"

@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    """Admin interface for Cart model"""
    list_display = ["id", "user", "session_key", "total_items", "subtotal", "created_at"]
    list_filter = ["created_at"]
    search_fields = ["user__username", "session_key"]
    readonly_fields = ["created_at", "updated_at", "total_items", "subtotal"]

    inlines = [CartItemInline]

    def total_items(self, obj):
        return obj.total_items
    total_items.short_description = "Items"

    def subtotal(self, obj):
        return f"${obj.subtotal:.2f}"
    subtotal.short_decription = "Subtotal"

class OrderItemInline(admin.TabularInline):
    """Show order items inside the Order admin page"""
    model = OrderItem
    extra = 0
    readonly_fields = [
        "product",
        "product_name",
        "product_price",
        "quantity",
        "item_total"
    ]
    can_delete = False

    def item_total(self, obj):
        return f"${obj.total_price:.2f}"
    item_total.short_description = "Total"

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    """Admin interface for Order model"""
    list_display= [
        "order_number",
        "user",
        "email",
        "subtotal",
        "discount_amount",
        "total",
        "status",
        "payment_status",
        "tracking_number",
        "carrier",
        "created_at"
    ]
    list_editable = [
        "status", 
        "tracking_number", 
        "carrier"
    ]
    list_filter = [
        "status",
        "payment_status",
        "carrier",
        "created_at"
    ]
    search_fields = [
        "order_number",
        "email",
        "user__username",
        "first_name",
        "last_name",
        "tracking_number"
    ]
    readonly_fields = [
        "order_number",
        "idempotency_key",
        "stripe_payment_intent_id",
        "created_at",
        "updated_at",
        "subtotal",
        "total"
    ]

    fieldsets = (
        ("Order Information", {
            "fields": (
                "order_number",
                "user",
                "status",
                "payment_status"
            )
        }),
        ("Customer Details", {
            "fields": (
                "email",
                "first_name",
                "last_name",
                "phone"
            )
        }),
        ("Shipping Address", {
            "fields": (
                "address_line1",
                "address_line2",
                "city",
                "state",
                "postal_code",
                "country"
            )
        }),
        ('Shipping Tracking', {
            'fields': (
                'tracking_number',
                'carrier',
                'shipped_at',
                'delivered_at'
            )
        }),
        ("Payment Details", {
            "fields": (
                "subtotal",
                "coupon",
                "discount_amount",
                "shipping_cost",
                "tax",
                "total",
                "stripe_payment_intent_id",
                "idempotency_key"
            )
        }),
        ("Timestamp", {
            "fields": ("created_at", "updated_at")
        }),
    )

    inlines = [OrderItemInline]

    actions = ["mark_as_processing", "mark_as_shipped", "mark_as_delivered"]

    def mark_as_processing(self, request, queryset):
        """Bulk action: Mark orders as processing"""
        updated = queryset.update(status="processing")
        self.message_user(request, f"{updated} order(s) marked as processing.")
    mark_as_processing.short_description = "Mark selected orders as Processing"
    
    def mark_as_shipped(self, request, queryset):
        """Bulk action: Mark orders as shipped"""
        from django.utils import timezone
        from store.email_service import EmailService
        
        updated = 0
        for order in queryset:
            order.status = 'shipped'
            if not order.shipped_at:
                order.shipped_at = timezone.now()
            order.save()
            
            # Send shipping notification email
            EmailService.send_shipping_notification(order)
            updated += 1
            
        self.message_user(request, f'{updated} order(s) marked as shipped and emails sent.')
    mark_as_shipped.short_description = 'Mark selected orders as Shipped (sends email)'
    
    def mark_as_delivered(self, request, queryset):
        """Bulk action: Mark orders as delivered"""
        from django.utils import timezone
        from store.email_service import EmailService
        
        updated = 0
        for order in queryset:
            order.status = 'delivered'
            if not order.delivered_at:
                order.delivered_at = timezone.now()
            order.save()
            
            # Send delivery notification email
            EmailService.send_order_delivered_notification(order)
            updated += 1
            
        self.message_user(request, f'{updated} order(s) marked as delivered and emails sent.')
    mark_as_delivered.short_description = 'Mark selected orders as Delivered (sends email)'

@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    """
    Admin interface for Coupon model
    """
    list_display = [
        "code",
        "discount_type",
        "discount_value",
        "times_used",
        "max_uses",
        "minimum_purchase",
        "valid_from",
        "valid_until",
        "is_active",
        "status_display"
    ]

    list_filter = ["discount_type", "is_active", "valid_from", "valid_until"]

    search_fields = ["code", "description"]

    list_editable = ["is_active"]

    fieldsets = (
        ("Coupon Information", {
            "fields": ("code", "description", "is_active")
        }),
        ("Discount Details", {
            "fields": ("discount_type", "discount_value", "minimum_purchase")
        }),
        ("Usage & Validit", {
            "fields": (
                ("valid_from", "valid_until"),
                ("max_uses", "times_used")
            )
        }),
    )

    readonly_fields = ["times_used", "created_at", "updated_at"]

    def status_display(self, obj):
        """Display coupon status"""
        if not obj.is_active:
            return "⚫ Inactive"
        elif not obj.is_valid():
            if obj.times_used >= obj.max_uses:
                return "🔴 Fully Used"
            else:
                return "⏰ Expired"
        else:
            remaining = obj.max_uses - obj.times_used
            return f"✅ Active ({remaining} uses left)"
        
    status_display.short_description = "Status"

    actions = ["deactivate_coupons", "activate_coupons"]

    def deactivate_coupons(self, request, queryset):
        """Bulk action: Deactivate coupons"""
        updated = queryset.update(is_active=False)
        self.message_user(request, f"{updated} coupon(s) deactivated.")
    deactivate_coupons.short_description = "Deactivate selected coupons"
    
    def activate_coupons(self, request, queryset):
        """Bulk action: Activate coupons"""
        updated = queryset.update(is_active=True)
        self.message_user(request, f"{updated} coupon(s) activated.")
    activate_coupons.short_description = "Activate selected coupons"

@admin.register(ProductReview)
class ProductReviewAdmin(admin.ModelAdmin):
    """
    Admin interface for ProductReview model
    """
    list_display = [
        'product',
        'user',
        'rating_display',
        'title',
        'is_approved',
        'is_verified_purchase',
        'created_at'
    ]
    
    list_filter = [
        'rating',
        'is_approved',
        'created_at'
    ]
    
    search_fields = [
        'product__name',
        'user__username',
        'title',
        'comment'
    ]
    
    list_editable = ['is_approved']
    
    readonly_fields = ['user', 'product', 'order', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Review Information', {
            'fields': ('product', 'user', 'order', 'is_approved')
        }),
        ('Review Content', {
            'fields': ('rating', 'title', 'comment')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    actions = ['approve_reviews', 'reject_reviews']
    
    def rating_display(self, obj):
        """Display rating with stars"""
        stars = '⭐' * obj.rating
        return f"{stars} ({obj.rating})"
    rating_display.short_description = 'Rating'
    
    def approve_reviews(self, request, queryset):
        """Bulk action: Approve reviews"""
        updated = queryset.update(is_approved=True)
        self.message_user(request, f'{updated} review(s) approved.')
    approve_reviews.short_description = 'Approve selected reviews'
    
    def reject_reviews(self, request, queryset):
        """Bulk action: Reject reviews"""
        updated = queryset.update(is_approved=False)
        self.message_user(request, f'{updated} review(s) rejected.')
    reject_reviews.short_description = 'Reject selected reviews'
