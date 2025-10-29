from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import get_csrf_token, get_stripe_public_key, stripe_webhook
from .views import (
    CategoryViewSet,
    ProductViewSet,
    CartViewSet,
    OrderViewSet,
    UserViewSet,
    ProductReviewViewSet
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
]
