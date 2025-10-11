from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import get_csrf_token, get_stripe_public_key
from .views import (
    CategoryViewSet,
    ProductViewSet,
    CartViewSet,
    OrderViewSet,
    UserViewSet
)

router = DefaultRouter()
router.register(r"categories", CategoryViewSet, basename="category")
router.register(r"products", ProductViewSet, basename="product")
router.register(r"cart", CartViewSet, basename="cart")
router.register(r"orders", OrderViewSet, basename="order")
router.register(r"users", UserViewSet, basename="user")

urlpatterns = [
    path("", include(router.urls)),
    path("auth/", include("store.auth_urls")),
    path("csrf/", get_csrf_token, name="csrf"),
    path("stripe/config/", get_stripe_public_key, name="stripe-config")
]
