import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserProfileService, Address } from '../../services/user-profile.service';
import { User, UserRole } from '../../models/user.model';
import { AlertService } from '../../services/alert.service';
import { OrderService, OrderResponse } from '../../services/order.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  // Kullanıcı ve profil bilgileri
  currentUser: User | null = null;
  user: User | null = null; // HTML şablonunda kullanılan yeni isim

  // UI durum değişkenleri
  editMode: boolean = false;
  loading: boolean = false;
  isLoading: boolean = false; // HTML şablonunda kullanılan isim

  // Formlar ve veri
  updatedUser: any = {};
  passwordChange: { currentPassword: string, newPassword: string, confirmPassword: string } = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  // Yeni şifre değiştirme veri modeli
  passwordData: { currentPassword: string, newPassword: string, confirmPassword: string } = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  showPasswordForm: boolean = false;

  // Aktif bölüm/sekme - HTML'de activeTab olarak kullanılıyor
  activeSection: string = 'profile';
  activeTab: string = 'profile'; // Yeni isim

  // Adres yönetimi için değişkenler
  addresses: Address[] = [];
  currentAddress: Address = this.createEmptyAddress();
  showingAddressForm: boolean = false;
  editingAddress: boolean = false;

  // Siparişler için değişkenler
  orders: OrderResponse[] = [];
  loadingOrders: boolean = false;
  
  // Sipariş detayları için değişkenler
  selectedOrder: OrderResponse | null = null;
  showOrderDetails: boolean = false;

  constructor(
    private authService: AuthService,
    private profileService: UserProfileService,
    private alertService: AlertService,
    private orderService: OrderService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // URL'deki bölüm parametresini kontrol et
    this.route.data.subscribe(data => {
      if (data['section']) {
        this.activeSection = data['section'];
        this.activeTab = data['section']; // Yeni sekme değişkenini güncelle
      }
    });

    this.loadUserProfile();
    
    // Adres listesini başlangıçta yükle
    setTimeout(() => {
      this.loadAddresses();
      
      // Siparişleri yükle
      if (this.activeSection === 'orders') {
        this.loadOrders();
      }
    }, 1000);
  }

  // Sekme değiştirme yöntemi - eski ve yeni adlar için
  setActiveSection(section: string): void {
    this.activeSection = section;
    this.activeTab = section; // Yeni sekme değişkenini güncelle
    
    // Orders sekmesi seçildiğinde siparişleri yükle
    if (section === 'orders') {
      this.loadOrders();
    }
  }

  // Yeni sekme değiştirme yöntemi (HTML'de kullanılıyor)
  setActiveTab(tab: string): void {
    this.activeTab = tab;
    this.activeSection = tab; // Eski değişkeni de güncelle

    // Adresler sekmesi açıldığında adresleri yükle
    if (tab === 'addresses') {
      this.loadAddresses();
    }
  }

  // Rol adını döndüren yardımcı metot
  getRoleName(role?: UserRole): string {
    if (!role) return 'Kullanıcı';

    switch (role) {
      case UserRole.ADMIN:
        return 'Yönetici';
      case UserRole.SELLER:
        return 'Satıcı';
      case UserRole.USER:
      default:
        return 'Kullanıcı';
    }
  }

  loadUserProfile(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.user = user; // Yeni değişkeni güncelle

      if (this.currentUser && this.currentUser.id) {
        this.loading = true;
        this.isLoading = true; // Yeni değişkeni güncelle

        // Kullanıcı oturum açmışsa profil bilgilerini al
        this.profileService.getUserProfile(this.currentUser.id).subscribe({
          next: (profile) => {
            // Kullanıcı bilgilerini güncelle
            this.currentUser = {
              ...this.currentUser!,
              ...profile
            };
            this.user = this.currentUser; // Yeni değişkeni güncelle

            // Form için bilgileri hazırla
            this.prepareUserData();
            this.loading = false;
            this.isLoading = false; // Yeni değişkeni güncelle

            // Adresler sekmesi açıksa adresleri yükle
            if (this.activeTab === 'addresses') {
              this.loadAddresses();
            }
          },
          error: (err) => {
            console.error('Profil yüklenirken hata:', err);
            this.loading = false;
            this.isLoading = false; // Yeni değişkeni güncelle

            // Hata durumunda mevcut bilgilerle devam et
            this.prepareUserData();
          }
        });
      } else {
        // Kullanıcı bilgisi yoksa, formları sıfırla
        this.updatedUser = {};
      }
    });
  }

  prepareUserData(): void {
    if (this.currentUser) {
      this.updatedUser = {
        id: this.currentUser.id,
        username: this.currentUser.username,
        email: this.currentUser.email,
        firstName: this.currentUser.firstName || '',
        lastName: this.currentUser.lastName || ''
      };
    }
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;

    // Düzenleme iptal edilirse, değerleri sıfırla
    if (!this.editMode) {
      this.prepareUserData();
    }
  }

  // Profil Güncelleme - HTML'de updateProfile olarak çağrılıyor
  updateProfile(): void {
    if (!this.user || !this.user.id) return;

    this.loading = true;
    this.isLoading = true;

    this.profileService.updateProfile(this.user.id, this.user).subscribe({
      next: (updatedUser) => {
        this.alertService.success('Profil bilgileriniz başarıyla güncellendi.');
        this.loading = false;
        this.isLoading = false;

        // Kullanıcı bilgilerini güncelle
        const updatedCurrentUser = {
          ...this.user!,
          ...updatedUser
        };

        // Auth servisindeki yeni metodu kullanarak güncelleme yap
        this.authService.updateCurrentUser(updatedCurrentUser);
        this.currentUser = updatedCurrentUser;
        this.user = updatedCurrentUser;
      },
      error: (err) => {
        this.loading = false;
        this.isLoading = false;
        this.alertService.error('Profil güncellenemedi: ' + (err.message || 'Bilinmeyen hata'));
      }
    });
  }

  // saveProfile metodu - HTML'de kullanılan ad
  saveProfile(): void {
    // Varolan updateProfile metodunu çağır
    this.updateProfile();
    this.editMode = false; // Düzenleme modunu kapat
  }

  togglePasswordForm(): void {
    this.showPasswordForm = !this.showPasswordForm;

    // Form kapatılırsa değerleri sıfırla
    if (!this.showPasswordForm) {
      this.passwordChange = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      };
      this.passwordData = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      };
    }
  }

  // HTML'de changePassword olarak çağrılıyor
  changePassword(): void {
    if (!this.user || !this.user.id) return;

    // Şifre doğrulama kontrolleri
    if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
      this.alertService.error('Yeni şifreler eşleşmiyor.');
      return;
    }

    if (this.passwordData.newPassword.length < 6) {
      this.alertService.error('Şifre en az 6 karakter olmalıdır.');
      return;
    }

    this.loading = true;
    this.isLoading = true;

    this.profileService.changePassword(this.user.id, {
      currentPassword: this.passwordData.currentPassword,
      newPassword: this.passwordData.newPassword
    }).subscribe({
      next: () => {
        this.alertService.success('Şifreniz başarıyla değiştirildi.');
        this.passwordData = {
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        };
        this.loading = false;
        this.isLoading = false;
      },
      error: (err) => {
        this.loading = false;
        this.isLoading = false;
        this.alertService.error('Şifre değiştirilemedi: ' + (err.message || 'Bilinmeyen hata'));
      }
    });
  }

  // Kullanıcının adreslerini yükle
  loadAddresses(): void {
    console.log('Adresler yükleniyor');
    
    // Kullanıcı ID'sini doğrudan AuthService'den al
    const userId = this.authService.getCurrentUserId();
    console.log('AuthService\'den alınan kullanıcı ID:', userId);
    
    if (!userId) {
      console.error('Adresler yüklenemedi: Kullanıcı ID bulunamadı');
      this.alertService.error('Kullanıcı bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
      return;
    }

    this.loading = true;
    this.isLoading = true;

    console.log(`Adres API isteği yapılıyor: ${this.profileService['addressApiUrl']}/${userId}`);
    
    this.profileService.getUserAddresses(userId).subscribe({
      next: (addresses) => {
        console.log('Adresler başarıyla yüklendi:', addresses);
        this.addresses = addresses;
        this.loading = false;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Adresler yüklenirken hata:', err);
        console.error('Hata detayları:', JSON.stringify(err));
        this.alertService.error('Adresler yüklenemedi: ' + (err.message || 'Bilinmeyen hata'));
        this.loading = false;
        this.isLoading = false;
      }
    });
  }

  // Adres formunu göster
  showAddressForm(): void {
    console.log('Adres formu gösteriliyor');
    this.showingAddressForm = true;
    this.editingAddress = false;
    this.currentAddress = this.createEmptyAddress();
    
    // Eğer HTML'de adres formu templati yoksa, burada hata olmaz ama form görünmeyecektir
    // Log ekleyerek durumu denetliyoruz
    console.log('Adres formu durumu:', this.showingAddressForm);
    console.log('Güncel adres:', this.currentAddress);
  }

  // Boş adres objesi oluştur
  createEmptyAddress(): Address {
    return {
      addressName: '',       // Eski title
      recipientName: '',     // Eski fullName
      phoneNumber: '',       // Eski phone
      city: '',              // Aynı kaldı
      state: '',             // Eski district
      postalCode: '',        // Eski zipCode
      addressLine1: '',      // Eski addressLine
      addressLine2: '',      // Yeni eklendi
      country: 'Türkiye',    // Yeni eklendi, varsayılan olarak Türkiye
      isDefault: false       // Aynı kaldı
    };
  }

  // Adres formu iptal
  cancelAddressForm(): void {
    console.log('Adres formu iptal edildi');
    this.showingAddressForm = false;
    this.editingAddress = false;
    this.currentAddress = this.createEmptyAddress();
  }

  // Adres kaydetme
  saveAddress(): void {
    console.log('Adres kaydediliyor:', this.currentAddress);
    console.log('Mevcut kullanıcı:', this.user);
    
    // Kullanıcı ID'sini doğrudan AuthService'den alalım
    const userId = this.authService.getCurrentUserId();
    console.log('AuthService\'den alınan kullanıcı ID:', userId);
    
    if (!userId) {
      this.alertService.error('Kullanıcı bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
      return;
    }

    // Form alanlarının dolu olup olmadığını detaylı kontrol et
    console.log('Form alanlarının durumu:');
    console.log('addressName:', this.currentAddress.addressName);
    console.log('recipientName:', this.currentAddress.recipientName, this.currentAddress.recipientName ? 'DOLU' : 'BOŞ');
    console.log('phoneNumber:', this.currentAddress.phoneNumber);
    console.log('city:', this.currentAddress.city, this.currentAddress.city ? 'DOLU' : 'BOŞ');
    console.log('state:', this.currentAddress.state);
    console.log('postalCode:', this.currentAddress.postalCode, this.currentAddress.postalCode ? 'DOLU' : 'BOŞ');
    console.log('addressLine1:', this.currentAddress.addressLine1, this.currentAddress.addressLine1 ? 'DOLU' : 'BOŞ');
    console.log('addressLine2:', this.currentAddress.addressLine2);
    console.log('country:', this.currentAddress.country, this.currentAddress.country ? 'DOLU' : 'BOŞ');

    // SQL NOT NULL alanlarının validasyonu
    if (!this.currentAddress.addressLine1?.trim() || 
        !this.currentAddress.city?.trim() || 
        !this.currentAddress.postalCode?.trim() || 
        !this.currentAddress.country?.trim()) {
      this.alertService.error('Lütfen zorunlu alanları doldurun (Adres Detayı, İl, Posta Kodu, Ülke)');
      return;
    }

    // Alıcı adı kontrolü - recipientName backend'de zorunlu
    if (!this.currentAddress.recipientName?.trim()) {
      this.alertService.error('Lütfen Ad Soyad alanını doldurun');
      return;
    }

    // Form verilerini temizle ve hazırla (boşlukları kaldır)
    const addressToSave = {
      addressName: this.currentAddress.addressName?.trim() || '',
      recipientName: this.currentAddress.recipientName.trim(),
      phoneNumber: this.currentAddress.phoneNumber?.trim() || '',
      city: this.currentAddress.city.trim(),
      state: this.currentAddress.state?.trim() || '',
      postalCode: this.currentAddress.postalCode.trim(),
      addressLine1: this.currentAddress.addressLine1.trim(),
      addressLine2: this.currentAddress.addressLine2?.trim() || '',
      country: this.currentAddress.country.trim(),
      isDefault: this.currentAddress.isDefault || false
    };

    console.log('Backend\'e gönderilecek adres:', addressToSave);

    this.loading = true;
    this.isLoading = true;

    if (this.editingAddress && this.currentAddress.id) {
      // Mevcut adresi güncelle
      this.profileService.updateAddress(userId, this.currentAddress.id, addressToSave)
        .subscribe({
          next: (updatedAddress) => {
            this.alertService.success('Adres başarıyla güncellendi');
            this.loading = false;
            this.isLoading = false;
            this.showingAddressForm = false;
            
            // Adresleri yeniden yükle
            this.loadAddresses();
          },
          error: (err) => {
            this.loading = false;
            this.isLoading = false;
            this.alertService.error('Adres güncellenemedi: ' + (err.message || 'Bilinmeyen hata'));
            console.error('Adres güncelleme hatası:', err);
          }
        });
    } else {
      // Yeni adres ekle
      this.profileService.addAddress(userId, addressToSave)
        .subscribe({
          next: (newAddress) => {
            this.alertService.success('Adres başarıyla eklendi');
            this.loading = false;
            this.isLoading = false;
            this.showingAddressForm = false;
            
            // Adresleri yeniden yükle
            this.loadAddresses();
          },
          error: (err) => {
            this.loading = false;
            this.isLoading = false;
            this.alertService.error('Adres eklenemedi: ' + (err.message || 'Bilinmeyen hata'));
            console.error('Adres ekleme hatası:', err);
            console.error('Hata detayları:', JSON.stringify(err));
          }
        });
    }
  }

  // Adres düzenleme
  editAddress(address: Address): void {
    this.currentAddress = {...address};
    this.showingAddressForm = true;
    this.editingAddress = true;
  }

  // Adres silme
  deleteAddress(addressId: number): void {
    // Kullanıcı ID'sini doğrudan AuthService'den al
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      this.alertService.error('Kullanıcı bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
      return;
    }

    if (confirm('Bu adresi silmek istediğinizden emin misiniz?')) {
      this.loading = true;
      this.isLoading = true;

      this.profileService.deleteAddress(userId, addressId).subscribe({
        next: () => {
          this.alertService.success('Adres başarıyla silindi.');
          this.loadAddresses(); // Adresleri yeniden yükle
        },
        error: (err) => {
          this.loading = false;
          this.isLoading = false;
          this.alertService.error('Adres silinemedi: ' + (err.message || 'Bilinmeyen hata'));
          console.error('Adres silme hatası:', err);
        }
      });
    }
  }

  // Varsayılan adres yapma
  setDefaultAddress(addressId: number): void {
    // Kullanıcı ID'sini doğrudan AuthService'den al
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      this.alertService.error('Kullanıcı bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
      return;
    }

    this.loading = true;
    this.isLoading = true;

    this.profileService.setDefaultAddress(userId, addressId).subscribe({
      next: () => {
        this.alertService.success('Varsayılan adres güncellendi.');
        this.loadAddresses(); // Adresleri yeniden yükle
      },
      error: (err) => {
        this.loading = false;
        this.isLoading = false;
        this.alertService.error('Varsayılan adres güncellenemedi: ' + (err.message || 'Bilinmeyen hata'));
        console.error('Varsayılan adres güncelleme hatası:', err);
      }
    });
  }

  // Kullanıcının siparişlerini getir
  loadOrders(): void {
    if (!this.currentUser || !this.currentUser.id) {
      return;
    }
    
    this.loadingOrders = true;
    this.orders = [];
    
    this.orderService.getUserOrders().subscribe({
      next: (orders) => {
        this.orders = orders;
        this.loadingOrders = false;
      },
      error: (err) => {
        console.error('Siparişler yüklenirken hata:', err);
        this.loadingOrders = false;
        this.alertService.error('Siparişleriniz yüklenemedi: ' + (err.message || 'Bilinmeyen hata'));
      }
    });
  }

  // Sipariş iptal etme
  cancelOrder(orderId: number): void {
    if (!confirm('Bu siparişi iptal etmek istediğinize emin misiniz?')) {
      return;
    }
    
    this.loadingOrders = true;
    
    this.orderService.cancelOrder(orderId).subscribe({
      next: (result) => {
        this.loadingOrders = false;
        this.alertService.success('Sipariş başarıyla iptal edildi');
        
        // Güncel sipariş listesini yeniden yükle
        this.loadOrders();
      },
      error: (err) => {
        this.loadingOrders = false;
        console.error('Sipariş iptal edilirken hata:', err);
        this.alertService.error('Sipariş iptal edilemedi: ' + (err.message || 'Bilinmeyen hata'));
      }
    });
  }
  
  // Sipariş detaylarını gösterme
  showOrderDetail(order: OrderResponse): void {
    this.selectedOrder = order;
    this.showOrderDetails = true;
  }
  
  // Sipariş detay penceresini kapatma
  closeOrderDetails(): void {
    this.selectedOrder = null;
    this.showOrderDetails = false;
  }
}
