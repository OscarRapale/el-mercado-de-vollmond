# store/management/commands/check_inventory.py
from django.core.management.base import BaseCommand
from django.db.models import Q, F
from store.models import Product
from store.email_service import EmailService


class Command(BaseCommand):
    help = 'Check inventory levels and send alerts for low stock products'

    def add_arguments(self, parser):
        parser.add_argument(
            '--send-email',
            action='store_true',
            help='Send email alert if low stock products found',
        )

    def handle(self, *args, **options):
        self.stdout.write('Checking inventory levels...\n')
        
        # Find low stock products
        low_stock_products = Product.objects.filter(
            Q(stock__lte=F('low_stock_threshold')),
            Q(stock__gt=0),
            is_available=True
        )
        
        # Find out of stock products
        out_of_stock_products = Product.objects.filter(
            stock=0,
            is_available=True
        )
        
        # Display results
        if low_stock_products.exists():
            self.stdout.write(self.style.WARNING(
                f'\n⚠️  {low_stock_products.count()} product(s) are low on stock:'
            ))
            for product in low_stock_products:
                self.stdout.write(
                    f'  - {product.name}: {product.stock} units '
                    f'(threshold: {product.low_stock_threshold})'
                )
        else:
            self.stdout.write(self.style.SUCCESS('✅ No products are low on stock'))
        
        if out_of_stock_products.exists():
            self.stdout.write(self.style.ERROR(
                f'\n🔴 {out_of_stock_products.count()} product(s) are out of stock:'
            ))
            for product in out_of_stock_products:
                self.stdout.write(f'  - {product.name}')
                # Auto-disable out of stock products
                product.is_available = False
                product.save()
                self.stdout.write(
                    self.style.WARNING(f'    → Disabled {product.name}')
                )
        else:
            self.stdout.write(self.style.SUCCESS('✅ No products are out of stock'))
        
        # Send email alert if requested and there are low stock products
        if options['send_email'] and low_stock_products.exists():
            self.stdout.write('\n📧 Sending email alert...')
            result = EmailService.send_low_stock_alert(low_stock_products)
            if result:
                self.stdout.write(self.style.SUCCESS('✅ Email sent successfully'))
            else:
                self.stdout.write(self.style.ERROR('❌ Failed to send email'))
        
        self.stdout.write(self.style.SUCCESS('\n✨ Inventory check complete!\n'))
