# store/analytics.py
from django.db.models import Sum, Count, Avg, Q, F
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from .models import Order, Product, OrderItem, User, ProductReview


class AnalyticsService:
    """
    Service class for analytics and dashboard statistics
    """
    
    @staticmethod
    def get_date_ranges():
        """Get date ranges for analytics"""
        now = timezone.now()
        today = now.date()
        
        return {
            'today_start': timezone.make_aware(timezone.datetime.combine(today, timezone.datetime.min.time())),
            'week_start': now - timedelta(days=7),
            'month_start': now - timedelta(days=30),
            'year_start': now - timedelta(days=365),
        }
    
    @staticmethod
    def get_sales_overview():
        """Get overall sales statistics"""
        dates = AnalyticsService.get_date_ranges()
        
        # Total completed orders
        total_orders = Order.objects.filter(payment_status='completed').count()
        
        # Orders by time period
        orders_today = Order.objects.filter(
            payment_status='completed',
            created_at__gte=dates['today_start']
        ).count()
        
        orders_this_week = Order.objects.filter(
            payment_status='completed',
            created_at__gte=dates['week_start']
        ).count()
        
        orders_this_month = Order.objects.filter(
            payment_status='completed',
            created_at__gte=dates['month_start']
        ).count()
        
        # Total revenue
        total_revenue = Order.objects.filter(
            payment_status='completed'
        ).aggregate(total=Sum('total'))['total'] or Decimal('0')
        
        # Revenue by time period
        revenue_today = Order.objects.filter(
            payment_status='completed',
            created_at__gte=dates['today_start']
        ).aggregate(total=Sum('total'))['total'] or Decimal('0')
        
        revenue_this_week = Order.objects.filter(
            payment_status='completed',
            created_at__gte=dates['week_start']
        ).aggregate(total=Sum('total'))['total'] or Decimal('0')
        
        revenue_this_month = Order.objects.filter(
            payment_status='completed',
            created_at__gte=dates['month_start']
        ).aggregate(total=Sum('total'))['total'] or Decimal('0')
        
        # Average order value
        avg_order_value = Order.objects.filter(
            payment_status='completed'
        ).aggregate(avg=Avg('total'))['avg'] or Decimal('0')
        
        return {
            'total_orders': total_orders,
            'orders_today': orders_today,
            'orders_this_week': orders_this_week,
            'orders_this_month': orders_this_month,
            'total_revenue': float(total_revenue),
            'revenue_today': float(revenue_today),
            'revenue_this_week': float(revenue_this_week),
            'revenue_this_month': float(revenue_this_month),
            'average_order_value': float(avg_order_value),
        }
    
    @staticmethod
    def get_top_products(limit=5):
        """Get top-selling products"""
        top_products = OrderItem.objects.filter(
            order__payment_status='completed'
        ).values(
            'product_id',
            'product_name'
        ).annotate(
            total_sold=Sum('quantity'),
            revenue=Sum(F('quantity') * F('product_price'))
        ).order_by('-total_sold')[:limit]
        
        return list(top_products)
    
    @staticmethod
    def get_recent_orders(limit=10):
        """Get recent orders"""
        return Order.objects.select_related('user').order_by('-created_at')[:limit]
    
    @staticmethod
    def get_order_status_breakdown():
        """Get count of orders by status"""
        breakdown = Order.objects.values('status').annotate(
            count=Count('id')
        ).order_by('status')
        
        return {item['status']: item['count'] for item in breakdown}
    
    @staticmethod
    def get_payment_status_breakdown():
        """Get count of orders by payment status"""
        breakdown = Order.objects.values('payment_status').annotate(
            count=Count('id')
        ).order_by('payment_status')
        
        return {item['payment_status']: item['count'] for item in breakdown}
    
    @staticmethod
    def get_customer_statistics():
        """Get customer statistics"""
        total_customers = User.objects.filter(is_staff=False).count()
        
        # Customers with orders
        customers_with_orders = User.objects.filter(
            orders__payment_status='completed'
        ).distinct().count()
        
        # New customers this month
        dates = AnalyticsService.get_date_ranges()
        new_customers_this_month = User.objects.filter(
            is_staff=False,
            date_joined__gte=dates['month_start']
        ).count()
        
        return {
            'total_customers': total_customers,
            'customers_with_orders': customers_with_orders,
            'new_customers_this_month': new_customers_this_month,
        }
    
    @staticmethod
    def get_inventory_alerts():
        """Get products with low stock or out of stock"""
        low_stock = Product.objects.filter(
            Q(stock__lte=F('low_stock_threshold')),
            Q(stock__gt=0),
            is_available=True
        ).count()
        
        out_of_stock = Product.objects.filter(
            stock=0
        ).count()
        
        return {
            'low_stock_count': low_stock,
            'out_of_stock_count': out_of_stock,
        }
    
    @staticmethod
    def get_review_statistics():
        """Get review statistics"""
        total_reviews = ProductReview.objects.count()
        approved_reviews = ProductReview.objects.filter(is_approved=True).count()
        pending_reviews = ProductReview.objects.filter(is_approved=False).count()
        
        avg_rating = ProductReview.objects.filter(
            is_approved=True
        ).aggregate(avg=Avg('rating'))['avg']
        
        return {
            'total_reviews': total_reviews,
            'approved_reviews': approved_reviews,
            'pending_reviews': pending_reviews,
            'average_rating': round(float(avg_rating), 1) if avg_rating else 0,
        }
    
    @staticmethod
    def get_daily_sales(days=30):
        """Get daily sales for the last N days"""
        from django.db.models.functions import TruncDate
        
        dates = AnalyticsService.get_date_ranges()
        start_date = timezone.now() - timedelta(days=days)
        
        daily_sales = Order.objects.filter(
            payment_status='completed',
            created_at__gte=start_date
        ).annotate(
            date=TruncDate('created_at')
        ).values('date').annotate(
            orders=Count('id'),
            revenue=Sum('total')
        ).order_by('date')
        
        return list(daily_sales)
    
    @staticmethod
    def get_complete_dashboard():
        """Get all dashboard data in one call"""
        return {
            'sales_overview': AnalyticsService.get_sales_overview(),
            'top_products': AnalyticsService.get_top_products(),
            'recent_orders': [
                {
                    'id': order.id,
                    'order_number': order.order_number,
                    'customer': order.user.username if order.user else 'Guest',
                    'email': order.email,
                    'total': float(order.total),
                    'status': order.status,
                    'payment_status': order.payment_status,
                    'created_at': order.created_at,
                }
                for order in AnalyticsService.get_recent_orders()
            ],
            'order_status_breakdown': AnalyticsService.get_order_status_breakdown(),
            'payment_status_breakdown': AnalyticsService.get_payment_status_breakdown(),
            'customer_statistics': AnalyticsService.get_customer_statistics(),
            'inventory_alerts': AnalyticsService.get_inventory_alerts(),
            'review_statistics': AnalyticsService.get_review_statistics(),
            'daily_sales': AnalyticsService.get_daily_sales(30),
        }
