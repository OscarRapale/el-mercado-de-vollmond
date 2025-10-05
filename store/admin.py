from django.contrib import admin
from .models import Category, Product, Cart, CartItem, Order, OrderItem

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
        "is_available",
        "in_stock",
        "created_at"
    ]
    list_filter = ["category", "is_available", "created_at"]
    list_editable = ["price", "stock", "is_available"]
    search_fields = ["name", "description"]
    prepopulated_fields = {"slug": ("name",)}

    fieldsets = (
        ("Basic Information", {
            "field": ("category", "name", "slug", "description")
        }),
        ("Pricing & Inventory", {
            "fields": ("price", "stock", "is_available")
        }),
        ("Media", {
            "fields": ("image",)
        }),
    )

    readonly_fields = ["created_at", "updated_at"]

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
        "total",
        "status",
        "payment_status",
        "created_at"
    ]
    list_filter = [
        "status",
        "payment_status",
        "created_at"
    ]
    search_fields = [
        "order_number",
        "email",
        "user__username",
        "first_name",
        "last_name"
    ]
    readonly_fields = [
        "order_number",
        "idempotency_key",
        "stripe_payment_intend_id",
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
        ("Payment Details", {
            "fields": (
                "subtotal",
                "shipping_cost",
                "tax",
                "total",
                "stripe_payment_intent_id",
                "idempontency_key"
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
        updated = queryset.update(status='shipped')
        self.message_user(request, f"{updated} order(s) marked as shipped.")
    mark_as_shipped.short_description = "Mark selected orders as Shipped"
    
    def mark_as_delivered(self, request, queryset):
        """Bulk action: Mark orders as delivered"""
        updated = queryset.update(status="delivered")
        self.message_user(request, f"{updated} order(s) marked as delivered.")
    mark_as_delivered.short_description = "Mark selected orders as Delivered"
