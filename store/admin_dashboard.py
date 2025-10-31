# store/admin_dashboard.py
from django.contrib import admin
from django.urls import path
from django.shortcuts import render
from django.contrib.admin.views.decorators import staff_member_required
from .analytics import AnalyticsService


@staff_member_required
def dashboard_view(request):
    """
    Custom dashboard view for admin
    """
    context = {
        **admin.site.each_context(request),
        'title': 'Dashboard',
        'dashboard_data': AnalyticsService.get_complete_dashboard(),
    }
    return render(request, 'admin/dashboard.html', context)


class DashboardAdminSite(admin.AdminSite):
    """
    Custom admin site with dashboard
    """
    site_header = "Author Store Administration"
    site_title = "Author Store Admin"
    index_title = "Store Dashboard"
    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('dashboard/', self.admin_view(dashboard_view), name='dashboard'),
        ]
        return custom_urls + urls
