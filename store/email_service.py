from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.utils.html import strip_tags

class EmailService:
    """
    Service class for sending emails
    """
    @staticmethod
    def send_order_confirmation(order):
        """
        Send order confirmation email to customer
        """
        subject = f"Order Confirmation - {order.order_number}"

        # Context for email template
        context = {
            "order": order,
            "items": order.items.all(),
            "customer_name": f"{order.first_name} {order.last_name}",
        }

        # Render HTML email
        html_message = render_to_string("emails/order_confirmation.html", context)
        plain_message = strip_tags(html_message)

        try:
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[order.email],
                html_message=html_message,
                fail_silently=False,
            )
            print(f"✅ Order confirmation email sent to {order.email}")
            return True
        except Exception as e:
            print(f"❌ Failed to send email: {str(e)}")
            return False

    @staticmethod
    def send_shipping_notification(order):
        """
        Send shipping notification emailto customer
        """
        subject = f"Your Order Has Shipped = {order.order_number}"

        context = {
            "order": order,
            "customer_name": f"{order.first_name} {order.last_name}",
        }

        html_message = render_to_string("emails/shipping_notification.html", context)
        plain_message = strip_tags(html_message)

        try:
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[order.email],
                html_message=html_message,
                fail_silently=False,
            )
            print(f"✅ Shipping notification sent to {order.email}")
            return True
        except Exception as e:
            print(f"❌ Failed to send email: {str(e)}")
            return False

    @staticmethod
    def send_order_delivered_notification(order):
        """
        Send delivery confirmation email to customer
        """
        subject = f'Your Order Has Been Delivered - {order.order_number}'
        
        context = {
            "order": order,
            "customer_name": f"{order.first_name} {order.last_name}",
        }
        
        html_message = render_to_string("emails/order_delivered.html", context)
        plain_message = strip_tags(html_message)

        try:
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[order.email],
                html_message=html_message,
                fail_silently=False,
            )
            print(f"✅ Delivery notification sent to {order.email}")
            return True
        except Exception as e:
            print(f"❌ Failed to send email: {str(e)}")
            return False
        
    @staticmethod
    def send_low_stock_alert(products):
        """
        Send low stock alert email to admin
        """
        subject = f"Low Stock Alert - {len(products)} Products"

        context = {
            "products": products,
        }

        html_message = render_to_string("emails/low_stock_alert.html", context)
        plain_message = strip_tags(html_message)
        
        # Send to admin email
        admin_email = settings.EMAIL_HOST_USER
        
        try:
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[admin_email],
                html_message=html_message,
                fail_silently=False,
            )
            print(f"✅ Low stock alert sent to admin")
            return True
        except Exception as e:
            print(f"❌ Failed to send email: {str(e)}")
            return False
