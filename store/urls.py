from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import get_csrf_token, get_stripe_public_key, stripe_webhook
from .views import (
    CategoryViewSet,
    ProductViewSet,
    CartViewSet,
    OrderViewSet,
    UserViewSet,
    ProductReviewViewSet,
    analytics_dashboard,
    analytics_sales_overview,
    analytics_top_products,
    analytics_daily_sales,
)

router = DefaultRouter()
router.register(r"categories", CategoryViewSet, basename="category")
router.register(r"products", ProductViewSet, basename="product")
router.register(r"cart", CartViewSet, basename="cart")
router.register(r"orders", OrderViewSet, basename="order")
router.register(r"users", UserViewSet, basename="user")
router.register(r"reviews", ProductReviewViewSet, basename="review")

urlpatterns = [
    path("", include(router.urls)),
    path("auth/", include("store.auth_urls")),
    path("csrf/", get_csrf_token, name="csrf"),
    path("stripe/config/", get_stripe_public_key, name="stripe-config"),
    path("stripe/webhook/", stripe_webhook, name="stripe-webhook"),

    # Analytics endpoints
    path('analytics/dashboard/', analytics_dashboard, name='analytics-dashboard'),
    path('analytics/sales/', analytics_sales_overview, name='analytics-sales'),
    path('analytics/top-products/', analytics_top_products, name='analytics-top-products'),
    path('analytics/daily-sales/', analytics_daily_sales, name='analytics-daily-sales'),
]
