package com.webapp.backend.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.Customer;
import com.stripe.model.PaymentIntent;
import com.stripe.model.PaymentMethod;
import com.stripe.model.Refund;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import com.webapp.backend.model.Order;
import com.webapp.backend.model.OrderItem;
import com.webapp.backend.model.PaymentStatus;
import com.webapp.backend.model.StripeCustomer;
import com.webapp.backend.model.StripePayment;
import com.webapp.backend.model.StripePaymentMethod;
import com.webapp.backend.model.User;
import com.webapp.backend.repository.StripeCustomerRepository;
import com.webapp.backend.repository.StripePaymentMethodRepository;
import com.webapp.backend.repository.StripePaymentRepository;

@Service
public class StripeService {
    
    @Value("${stripe.api.key}")
    private String stripeApiKey;
    
    @Value("${stripe.public.key}")
    private String stripePublicKey;
    
    @Autowired
    private StripeCustomerRepository stripeCustomerRepository;
    
    @Autowired
    private StripePaymentMethodRepository stripePaymentMethodRepository;
    
    @Autowired
    private StripePaymentRepository stripePaymentRepository;
    
    @Autowired
    private OrderService orderService;
    
    // Stripe API'yi başlat
    public void init() {
        Stripe.apiKey = stripeApiKey;
    }
    
    // Stripe müşterisi oluşturma veya getirme
    @Transactional
    public StripeCustomer getOrCreateStripeCustomer(User user) {
        init();
        StripeCustomer customer = stripeCustomerRepository.findByUser(user);
        
        if (customer == null) {
            try {
                Map<String, Object> params = new HashMap<>();
                params.put("name", user.getFirstName() + " " + user.getLastName());
                params.put("email", user.getEmail());
                
                // Stripe API call
                Customer stripeCustomer = Customer.create(params);
                
                customer = new StripeCustomer();
                customer.setUser(user);
                customer.setStripeCustomerId(stripeCustomer.getId());
                customer.setCreatedAt(LocalDateTime.now());
                customer.setUpdatedAt(LocalDateTime.now());
                
                stripeCustomerRepository.save(customer);
            } catch (StripeException e) {
                throw new RuntimeException("Stripe müşteri oluşturulurken hata: " + e.getMessage(), e);
            }
        }
        
        return customer;
    }
    
    // Ödeme metodu ekleme
    @Transactional
    public StripePaymentMethod addPaymentMethod(User user, String cardNumber, int expiryMonth, 
            int expiryYear, String cvc, String cardHolderName, boolean makeDefault) {
        init();
        StripeCustomer customer = getOrCreateStripeCustomer(user);
        
        try {
            // Stripe API çağrısı ile kart bilgilerini eklemek gerçek uygulamada
            // frontend tarafında yapılacak güvenlik sebebiyle. Şimdi test amaçlı yapıyoruz
            Map<String, Object> card = new HashMap<>();
            card.put("number", cardNumber);
            card.put("exp_month", expiryMonth);
            card.put("exp_year", expiryYear);
            card.put("cvc", cvc);
            
            Map<String, Object> params = new HashMap<>();
            params.put("type", "card");
            params.put("card", card);
            
            PaymentMethod paymentMethod = PaymentMethod.create(params);
            
            // Müşteri ile ilişkilendir
            paymentMethod.attach(Map.of("customer", customer.getStripeCustomerId()));
            
            if (makeDefault) {
                Map<String, Object> customerParams = new HashMap<>();
                customerParams.put("invoice_settings", 
                        Map.of("default_payment_method", paymentMethod.getId()));
                Customer.retrieve(customer.getStripeCustomerId()).update(customerParams);
            }
            
            StripePaymentMethod stripePaymentMethod = new StripePaymentMethod();
            stripePaymentMethod.setUser(user);
            stripePaymentMethod.setStripePaymentMethodId(paymentMethod.getId());
            stripePaymentMethod.setCardBrand(paymentMethod.getCard().getBrand());
            stripePaymentMethod.setCardLastFour(paymentMethod.getCard().getLast4());
            stripePaymentMethod.setCardExpiryMonth(paymentMethod.getCard().getExpMonth().intValue());
            stripePaymentMethod.setCardExpiryYear(paymentMethod.getCard().getExpYear().intValue());
            stripePaymentMethod.setCreatedAt(LocalDateTime.now());
            
            if (makeDefault) {
                clearDefaultPaymentMethods(user);
                stripePaymentMethod.setIsDefault(true);
            }
            
            return stripePaymentMethodRepository.save(stripePaymentMethod);
        } catch (StripeException e) {
            throw new RuntimeException("Ödeme yöntemi eklenirken hata: " + e.getMessage(), e);
        }
    }
    
    // Checkout session oluşturma
    @Transactional
    public String createCheckoutSession(Order order, String successUrl, String cancelUrl) {
        init();
        try {
            System.out.println("createCheckoutSession başlatıldı. Order ID: " + order.getId());
            System.out.println("Success URL: " + successUrl);
            System.out.println("Cancel URL: " + cancelUrl);
            
            // Stripe API anahtarını kontrol et
            if (stripeApiKey == null || stripeApiKey.isEmpty()) {
                throw new IllegalStateException("Stripe API anahtarı tanımlanmamış. Lütfen application.properties'i kontrol edin.");
            }
            
            // Siparişin toplam tutarını kontrol et
            if (order.getTotalAmount() == null || order.getTotalAmount().doubleValue() <= 0) {
                throw new IllegalArgumentException("Sipariş tutarı geçersiz");
            }
            
            // Sipariş öğelerini kontrol et
            if (order.getOrderItems() == null || order.getOrderItems().isEmpty()) {
                throw new IllegalArgumentException("Sipariş öğeleri bulunamadı");
            }
            
            List<SessionCreateParams.LineItem> lineItems = new ArrayList<>();
            
            // Siparişin her bir ürünü için Stripe line item oluştur
            for (OrderItem item : order.getOrderItems()) {
                if (item.getProduct() == null) {
                    System.err.println("Ürün bilgisi bulunamadı: OrderItemId=" + item.getId());
                    continue; // Bu öğeyi atla
                }
                
                System.out.println("Ürün ekleniyor: " + item.getProduct().getName() + ", Fiyat: " + item.getPrice() + ", Miktar: " + item.getQuantity());
                
                // Ürün adı ve açıklaması kontrolü
                String productName = item.getProduct().getName() != null ? item.getProduct().getName() : "Ürün";
                String productDesc = item.getProduct().getDescription() != null ? item.getProduct().getDescription() : "";
                
                SessionCreateParams.LineItem.PriceData.ProductData productData = 
                    SessionCreateParams.LineItem.PriceData.ProductData.builder()
                        .setName(productName)
                        .setDescription(productDesc.substring(0, Math.min(productDesc.length(), 250))) // Açıklama çok uzun ise kısalt
                        .build();
                
                // Fiyat ve miktar kontrolü
                if (item.getPrice() == null || item.getPrice().doubleValue() <= 0) {
                    System.err.println("Geçersiz fiyat: " + item.getPrice() + ", ProductId=" + item.getProduct().getId());
                    continue; // Bu öğeyi atla
                }
                
                if (item.getQuantity() <= 0) {
                    System.err.println("Geçersiz miktar: " + item.getQuantity() + ", ProductId=" + item.getProduct().getId());
                    continue; // Bu öğeyi atla
                }
                
                // Fiyat bilgisi (Stripe'da kuruş cinsinden)
                long unitAmountInCents = (long)(item.getPrice().doubleValue() * 100);
                System.out.println("Fiyat (kuruş): " + unitAmountInCents);
                
                SessionCreateParams.LineItem.PriceData priceData = 
                    SessionCreateParams.LineItem.PriceData.builder()
                        .setCurrency("try")
                        .setUnitAmount(unitAmountInCents)
                        .setProductData(productData)
                        .build();
                
                SessionCreateParams.LineItem lineItem = 
                    SessionCreateParams.LineItem.builder()
                        .setQuantity((long)item.getQuantity())
                        .setPriceData(priceData)
                        .build();
                
                lineItems.add(lineItem);
            }
            
            // Eğer hiç geçerli ürün yoksa hata ver
            if (lineItems.isEmpty()) {
                throw new IllegalArgumentException("Sipariş için geçerli ürün bulunamadı");
            }
            
            // Checkout Session oluştur
            System.out.println("SessionCreateParams oluşturuluyor...");
            SessionCreateParams.Builder paramsBuilder = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(successUrl)
                .setCancelUrl(cancelUrl)
                .setClientReferenceId(order.getId().toString());
                
            // Tüm ürünleri ekle
            lineItems.forEach(paramsBuilder::addLineItem);
                
            // Ödeme yöntemini ekle (Stripe API versiyonuna göre değişir)
            try {
                paramsBuilder.addPaymentMethodType(SessionCreateParams.PaymentMethodType.CARD);
            } catch (Exception e) {
                System.err.println("Ödeme yöntemi eklenirken hata: " + e.getMessage());
                // Bu hata olursa, yine de devam et
            }
            
            SessionCreateParams params = paramsBuilder.build();
            
            System.out.println("Stripe API'ye istek gönderiliyor...");
            
            try {
                Session session = Session.create(params);
                System.out.println("Stripe session oluşturuldu. Session ID: " + session.getId());
                System.out.println("Session URL: " + session.getUrl());
                
                // URL kontrolü
                if (session.getUrl() == null || session.getUrl().isEmpty()) {
                    throw new RuntimeException("Stripe checkout URL'si alınamadı");
                }
                
                // Ödeme bilgilerini kaydet
                StripePayment payment = new StripePayment();
                payment.setOrder(order);
                
                // PaymentIntent null kontrolü (Stripe bazı durumlarda bunu dönmeyebilir)
                if (session.getPaymentIntent() != null) {
                    payment.setPaymentIntentId(session.getPaymentIntent());
                } else {
                    // Bu durumda benzersiz bir ID kullanabiliriz
                    payment.setPaymentIntentId("manual_" + System.currentTimeMillis());
                }
                
                payment.setAmount(order.getTotalAmount());
                payment.setCurrency("TRY");
                payment.setStatus(PaymentStatus.PENDING);
                payment.setPaymentDate(LocalDateTime.now());
                
                // stripePaymentId alanı için değer ata (nullable=false)
                if (session.getId() != null) {
                    payment.setStripePaymentId(session.getId());
                } else {
                    // Eğer session ID yoksa benzersiz bir değer ata
                    payment.setStripePaymentId("session_" + System.currentTimeMillis());
                }
                
                try {
                    stripePaymentRepository.save(payment);
                    System.out.println("Ödeme kaydedildi. Payment ID: " + payment.getId());
                } catch (Exception e) {
                    System.err.println("Ödeme kaydedilirken hata: " + e.getMessage());
                    e.printStackTrace();
                    // Kaydedilemese bile session URL'i dönebiliriz
                }
                
                // Stripe Checkout sayfası URL'i döndür
                return session.getUrl();
                
            } catch (StripeException se) {
                System.err.println("Stripe API hatası: " + se.getMessage());
                System.err.println("Hata kodu: " + se.getCode());
                System.err.println("Stripe status: " + se.getStatusCode());
                System.err.println("Hata detayı: " + se.getStripeError());
                throw se; // Yukarıdaki catch bloğuna ilet
            }
            
        } catch (StripeException e) {
            System.err.println("Stripe hatası: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Checkout session oluşturulurken hata: " + e.getMessage(), e);
        } catch (Exception e) {
            System.err.println("Beklenmeyen hata: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Checkout session oluşturulurken beklenmeyen hata: " + e.getMessage(), e);
        }
    }
    
    // Ödeme durumunu güncelleme
    @Transactional
    public StripePayment handlePaymentSuccess(String paymentIntentId) {
        init();
        try {
            PaymentIntent paymentIntent = PaymentIntent.retrieve(paymentIntentId);
            StripePayment payment = stripePaymentRepository.findByPaymentIntentId(paymentIntentId);
            
            if (payment != null) {
                payment.setStripePaymentId(paymentIntent.getLatestCharge());
                payment.setStatus(PaymentStatus.COMPLETED);
                payment.setReceiptUrl("https://dashboard.stripe.com/payments/" + paymentIntent.getId());
                
                // Siparişin ödeme durumunu güncelle
                orderService.updatePaymentStatus(payment.getOrder(), PaymentStatus.COMPLETED);
                
                return stripePaymentRepository.save(payment);
            } else {
                throw new RuntimeException("Ödeme kaydı bulunamadı: " + paymentIntentId);
            }
        } catch (StripeException e) {
            throw new RuntimeException("Ödeme durumu güncellenirken hata: " + e.getMessage(), e);
        }
    }
    
    // İade işlemi
    @Transactional
    public StripePayment refundPayment(StripePayment payment, BigDecimal refundAmount) {
        init();
        // Ödeme kontrolü
        if (payment == null || payment.getStatus() != PaymentStatus.COMPLETED) {
            throw new IllegalArgumentException("Geçerli bir ödeme bulunamadı");
        }
        
        try {
            Map<String, Object> params = new HashMap<>();
            params.put("payment_intent", payment.getPaymentIntentId());
            params.put("amount", (long)(refundAmount.doubleValue() * 100)); // Kuruş cinsinden
            
            Refund refund = Refund.create(params);
            
            // Tam iade mi, kısmi iade mi?
            PaymentStatus newStatus = payment.getAmount().compareTo(refundAmount) == 0 
                    ? PaymentStatus.REFUNDED 
                    : PaymentStatus.PARTIALLY_REFUNDED;
            
            payment.setStatus(newStatus);
            
            // Siparişin ödeme durumunu güncelle
            orderService.updatePaymentStatus(payment.getOrder(), newStatus);
            
            return stripePaymentRepository.save(payment);
        } catch (StripeException e) {
            payment.setLastError(e.getMessage());
            stripePaymentRepository.save(payment);
            throw new RuntimeException("İade işlemi sırasında hata: " + e.getMessage(), e);
        }
    }
    
    // Varsayılan ödeme yöntemini ayarlama
    @Transactional
    public StripePaymentMethod setDefaultPaymentMethod(StripePaymentMethod paymentMethod) {
        init();
        try {
            StripeCustomer customer = stripeCustomerRepository.findByUser(paymentMethod.getUser());
            
            Map<String, Object> params = new HashMap<>();
            params.put("invoice_settings", 
                    Map.of("default_payment_method", paymentMethod.getStripePaymentMethodId()));
            Customer.retrieve(customer.getStripeCustomerId()).update(params);
            
            clearDefaultPaymentMethods(paymentMethod.getUser());
            paymentMethod.setIsDefault(true);
            return stripePaymentMethodRepository.save(paymentMethod);
        } catch (StripeException e) {
            throw new RuntimeException("Varsayılan ödeme yöntemi ayarlanırken hata: " + e.getMessage(), e);
        }
    }
    
    // Stripe public key'i getir
    public String getPublicKey() {
        return stripePublicKey;
    }
    
    // Yardımcı metodlar
    private void clearDefaultPaymentMethods(User user) {
        StripePaymentMethod defaultMethod = stripePaymentMethodRepository.findByUserAndIsDefaultTrue(user);
        if (defaultMethod != null) {
            defaultMethod.setIsDefault(false);
            stripePaymentMethodRepository.save(defaultMethod);
        }
    }
    
    private String generateRandomString(int length) {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < length; i++) {
            int index = (int) (Math.random() * chars.length());
            sb.append(chars.charAt(index));
        }
        return sb.toString();
    }
} 