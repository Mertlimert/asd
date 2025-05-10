import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { User, UserRole } from '../../../../models/user.model';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="user-management-container">
      <div class="header-section">
        <h2>Kullanıcı Yönetimi</h2>
        <button class="add-button" (click)="createUser()">
          <i class="btn-icon">➕</i> Yeni Kullanıcı Ekle
        </button>
      </div>

      <div *ngIf="editingUser" class="edit-form-container">
        <div class="card">
          <div class="card-header">
            <h3>{{ editingUser.id ? 'Kullanıcıyı Düzenle' : 'Yeni Kullanıcı Oluştur' }}</h3>
          </div>
          <div class="card-body">
            <form [formGroup]="userForm" (ngSubmit)="saveUser()">
              <div class="form-grid">
                <div class="form-group">
                  <label for="firstName">Ad</label>
                  <input type="text" id="firstName" formControlName="firstName" class="form-control"
                         [class.is-invalid]="userForm.get('firstName')?.invalid && userForm.get('firstName')?.touched">
                  <div class="validation-error" *ngIf="userForm.get('firstName')?.invalid && userForm.get('firstName')?.touched">
                    Ad alanı gereklidir
                  </div>
                </div>

                <div class="form-group">
                  <label for="lastName">Soyad</label>
                  <input type="text" id="lastName" formControlName="lastName" class="form-control"
                         [class.is-invalid]="userForm.get('lastName')?.invalid && userForm.get('lastName')?.touched">
                  <div class="validation-error" *ngIf="userForm.get('lastName')?.invalid && userForm.get('lastName')?.touched">
                    Soyad alanı gereklidir
                  </div>
                </div>
              </div>

              <div class="form-grid">
                <div class="form-group">
                  <label for="username">Kullanıcı Adı</label>
                  <input type="text" id="username" formControlName="username" class="form-control"
                         [class.is-invalid]="userForm.get('username')?.invalid && userForm.get('username')?.touched">
                  <div class="validation-error" *ngIf="userForm.get('username')?.invalid && userForm.get('username')?.touched">
                    Kullanıcı adı gereklidir
                  </div>
                </div>

                <div class="form-group">
                  <label for="email">E-posta</label>
                  <input type="email" id="email" formControlName="email" class="form-control"
                         [class.is-invalid]="userForm.get('email')?.invalid && userForm.get('email')?.touched">
                  <div class="validation-error" *ngIf="userForm.get('email')?.invalid && userForm.get('email')?.touched">
                    Geçerli bir e-posta girin
                  </div>
                </div>
              </div>

              <!-- Şifre değiştirme seçeneği -->
              <div class="form-group" *ngIf="editingUser.id">
                <div class="checkbox-container">
                  <input type="checkbox" id="changePassword" [(ngModel)]="showPasswordField"
                         [ngModelOptions]="{standalone: true}"
                         (change)="onChangePasswordOptionChange()">
                  <label for="changePassword">Şifre Değiştir</label>
                </div>
              </div>

              <!-- Şifre alanı - Sadece yeni kullanıcıda veya şifre değiştirme seçildiğinde göster -->
              <div class="form-group" *ngIf="!editingUser.id || showPasswordField">
                <label for="password">Şifre</label>
                <div class="password-input">
                  <input type="password" id="password" formControlName="password" class="form-control"
                        placeholder="{{ editingUser.id ? 'Yeni şifre girin' : 'Şifre girin' }}">
                </div>
                <div class="validation-error" *ngIf="(!editingUser.id || showPasswordField) && userForm.get('password')?.invalid && userForm.get('password')?.touched">
                  Şifre en az 6 karakter olmalıdır
                </div>
              </div>

              <div class="form-grid">
                <div class="form-group">
                  <label for="role">Kullanıcı Rolü</label>
                  <select id="role" formControlName="role" class="form-control">
                    <option [value]="UserRole.USER">Kullanıcı</option>
                    <option [value]="UserRole.SELLER">Satıcı</option>
                    <option [value]="UserRole.ADMIN">Admin</option>
                  </select>
                </div>

                <div class="form-group checkbox-group">
                  <label class="checkbox-container">
                    <input type="checkbox" formControlName="banned">
                    <span class="checkbox-text">Yasaklı</span>
                  </label>
                </div>
              </div>

              <div class="form-actions">
                <button type="button" class="btn btn-cancel" (click)="cancelEdit()">İptal</button>
                <button type="submit" class="btn btn-save" [disabled]="userForm.invalid || isSaving">
                  <div class="spinner" *ngIf="isSaving"></div>
                  <span *ngIf="!isSaving">{{ editingUser.id ? 'Güncelle' : 'Kaydet' }}</span>
                  <span *ngIf="isSaving">Kaydediliyor...</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div class="user-list-container card">
        <div class="card-body">
          <div class="table-responsive">
            <table class="user-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Ad</th>
                  <th>Soyad</th>
                  <th>Kullanıcı Adı</th>
                  <th>E-posta</th>
                  <th>Rol</th>
                  <th>Durum</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let user of users" [class.banned-user]="user.banned">
                  <td>{{user.id || '-'}}</td>
                  <td>{{user.firstName}}</td>
                  <td>{{user.lastName}}</td>
                  <td>{{user.username}}</td>
                  <td>{{user.email}}</td>
                  <td>
                    <span class="role-badge"
                          [class.admin-role]="user.role === UserRole.ADMIN"
                          [class.seller-role]="user.role === UserRole.SELLER"
                          [class.user-role]="user.role === UserRole.USER">
                      {{user.role}}
                    </span>
                  </td>
                  <td>
                    <span class="status-badge" [class.status-banned]="user.banned" [class.status-active]="!user.banned">
                      {{user.banned ? 'Yasaklı' : 'Aktif'}}
                    </span>
                  </td>
                  <td class="action-buttons">
                    <button (click)="editUser(user)" class="btn-icon-action btn-edit" title="Düzenle">
                      <i class="icon">✏️</i>
                    </button>
                    <button (click)="toggleBan(user)" class="btn-icon-action"
                            [class.btn-unban]="user.banned"
                            [class.btn-ban]="!user.banned"
                            [title]="user.banned ? 'Yasaklamayı Kaldır' : 'Yasakla'">
                      <i class="icon">{{ user.banned ? '✓' : '🚫' }}</i>
                    </button>
                    <button (click)="promoteToAdmin(user)" class="btn-icon-action"
                            [class.btn-admin-remove]="user.role === UserRole.ADMIN"
                            [class.btn-admin-add]="user.role !== UserRole.ADMIN"
                            [title]="user.role === UserRole.ADMIN ? 'Admin Rolünü Kaldır' : 'Admin Yap'">
                      <i class="icon">{{ user.role === UserRole.ADMIN ? '⭐' : '👑' }}</i>
                    </button>
                    <button (click)="deleteUser(user)" class="btn-icon-action btn-delete" title="Sil" [disabled]="!user.id">
                      <i class="icon">🗑️</i>
                    </button>
                  </td>
                </tr>
                <tr *ngIf="users.length === 0">
                  <td colspan="6" class="no-users">Henüz kullanıcı bulunmuyor</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .user-management-container {
      padding: 20px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .header-section h2 {
      margin: 0;
      color: #333;
      font-size: 26px;
      font-weight: 500;
    }

    .add-button {
      display: flex;
      align-items: center;
      background-color: #4CAF50;
      color: white;
      border: none;
      padding: 10px 16px;
      font-size: 14px;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.3s;
    }

    .add-button:hover {
      background-color: #45a049;
    }

    .btn-icon {
      margin-right: 8px;
    }

    .card {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
      margin-bottom: 24px;
      overflow: hidden;
    }

    .card-header {
      background-color: #f8f9fa;
      padding: 16px 24px;
      border-bottom: 1px solid #e9ecef;
    }

    .card-header h3 {
      margin: 0;
      color: #495057;
      font-size: 18px;
      font-weight: 500;
    }

    .card-body {
      padding: 24px;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      color: #495057;
      font-weight: 500;
    }

    .form-control {
      width: 100%;
      padding: 10px 12px;
      font-size: 15px;
      border: 1px solid #ced4da;
      border-radius: 4px;
      transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
    }

    .form-control:focus {
      border-color: #80bdff;
      outline: 0;
      box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
    }

    .is-invalid {
      border-color: #dc3545;
    }

    .is-invalid:focus {
      border-color: #dc3545;
      box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
    }

    .validation-error {
      color: #dc3545;
      font-size: 13px;
      margin-top: 5px;
    }

    .checkbox-container {
      display: flex;
      align-items: center;
      cursor: pointer;
      margin-top: 24px;
    }

    .checkbox-container input {
      margin-right: 10px;
      width: 18px;
      height: 18px;
    }

    .checkbox-text {
      font-weight: normal;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid #e9ecef;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 10px 24px;
      font-size: 15px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease-in-out;
    }

    .btn-cancel {
      background-color: #f8f9fa;
      color: #495057;
      border: 1px solid #ced4da;
    }

    .btn-cancel:hover {
      background-color: #e9ecef;
    }

    .btn-save {
      background-color: #007bff;
      color: white;
    }

    .btn-save:hover {
      background-color: #0069d9;
    }

    .btn-save:disabled {
      background-color: #7abaff;
      cursor: not-allowed;
    }

    .spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 3px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: #fff;
      animation: spin 1s ease-in-out infinite;
      margin-right: 10px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .table-responsive {
      overflow-x: auto;
    }

    .user-table {
      width: 100%;
      border-collapse: collapse;
    }

    .user-table th,
    .user-table td {
      padding: 14px;
      text-align: left;
      vertical-align: middle;
      border-bottom: 1px solid #e9ecef;
    }

    .user-table th {
      font-weight: 600;
      color: #495057;
      background-color: #f8f9fa;
    }

    .user-table tbody tr:hover {
      background-color: rgba(0, 0, 0, 0.025);
    }

    .banned-user {
      background-color: #fff8f8;
    }

    .role-badge, .status-badge {
      display: inline-block;
      padding: 4px 8px;
      font-size: 12px;
      font-weight: 600;
      border-radius: 20px;
    }

    .admin-role {
      background-color: #9c27b0;
      color: white;
    }

    .seller-role {
      background-color: #2196f3;
      color: white;
    }

    .user-role {
      background-color: #8bc34a;
      color: white;
    }

    .status-active {
      background-color: #e8f5e9;
      color: #2e7d32;
    }

    .status-banned {
      background-color: #ffebee;
      color: #c62828;
    }

    .action-buttons {
      display: flex;
      gap: 8px;
    }

    .btn-icon-action {
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .btn-edit {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .btn-edit:hover {
      background-color: #bbdefb;
    }

    .btn-ban {
      background-color: #ffebee;
      color: #c62828;
    }

    .btn-ban:hover {
      background-color: #ffcdd2;
    }

    .btn-unban {
      background-color: #e8f5e9;
      color: #2e7d32;
    }

    .btn-unban:hover {
      background-color: #c8e6c9;
    }

    .btn-admin-add {
      background-color: #e8f5e9;
      color: #2e7d32;
    }

    .btn-admin-add:hover {
      background-color: #c8e6c9;
    }

    .btn-admin-remove {
      background-color: #fff8e1;
      color: #f57f17;
    }

    .btn-admin-remove:hover {
      background-color: #ffecb3;
    }

    .btn-delete {
      background-color: #ffebee;
      color: #c62828;
    }

    .btn-delete:hover {
      background-color: #ffcdd2;
    }

    .btn-icon-action:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .icon {
      font-size: 16px;
    }

    .no-users {
      text-align: center;
      color: #6c757d;
      padding: 30px;
    }

    @media (max-width: 992px) {
      .form-grid {
        grid-template-columns: 1fr;
        gap: 10px;
      }
    }

    @media (max-width: 576px) {
      .header-section {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }

      .action-buttons {
        flex-wrap: wrap;
      }

      .card-body {
        padding: 16px;
      }
    }
  `]
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  editingUser: User | null = null;
  userForm: FormGroup;
  isSaving = false;
  UserRole = UserRole;
  showPasswordField = false; // Şifre değiştirme alanını gösterme durumu

  constructor(
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.userForm = this.createUserForm();
  }

  ngOnInit() {
    this.loadUsers();
  }

  private loadUsers() {
    this.authService.getUsers().subscribe(
      users => this.users = users
    );
  }

  private createUserForm(user?: User): FormGroup {
    // Şifre validasyonu için temel kurallar
    const passwordValidators = user?.id ? [] : [Validators.required, Validators.minLength(6)];

    return this.fb.group({
      firstName: [user?.firstName || '', [Validators.required]],
      lastName: [user?.lastName || '', [Validators.required]],
      username: [user?.username || '', [Validators.required]],
      email: [user?.email || '', [Validators.required, Validators.email]],
      password: ['', passwordValidators], // Yeni kullanıcıda zorunlu, mevcut kullanıcıda opsiyonel
      role: [user?.role || UserRole.USER],
      banned: [user?.banned === true]  // Boole değerine dönüştür
    });
  }

  // Şifre değiştirme seçeneği değiştiğinde validasyonu güncelle
  onChangePasswordOptionChange(): void {
    const passwordControl = this.userForm.get('password');

    if (this.showPasswordField) {
      // Şifre değiştirme seçildi, validasyonu aktif et
      passwordControl?.setValidators([Validators.required, Validators.minLength(6)]);
    } else {
      // Şifre değiştirme seçilmedi, validasyonu kaldır
      passwordControl?.clearValidators();
    }

    // Validasyon durumunu güncelle
    passwordControl?.updateValueAndValidity();
  }

  private direktKayit(userData: User): Promise<User> {
    this.isSaving = true;

    const apiUrl = 'http://localhost:8080/api/users/register';
    const currentToken = this.authService.getAuthToken();

    // Angular HttpClient'i bypass ederek doğrudan fetch API kullanıyoruz
    return fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': currentToken ? `Bearer ${currentToken}` : ''
      },
      body: JSON.stringify(userData)
    })
    .then(response => {
      if (!response.ok) {
        // Daha detaylı hata bilgisi almak için JSON'a dönüştür
        return response.json().then(err => {
          console.error('Sunucu hatası:', err);

          // 409 Conflict - Kullanıcı adı veya email zaten var
          if (response.status === 409) {
            throw new Error('Bu kullanıcı adı veya e-posta adresi zaten kullanımda');
          }

          throw new Error(err.message || 'Kullanıcı kaydı başarısız: ' + response.statusText);
        }).catch(jsonError => {
          // JSON parse hatası varsa orijinal metni kullan
          throw new Error('Kullanıcı kaydı başarısız: ' + response.statusText);
        });
      }
      return response.json();
    })
    .then(data => {
      console.log('Kullanıcı başarıyla kaydedildi:', data);
      // Mevcut oturumu LOCAL STORAGE'dan tekrar yükleyerek olası kaybı önlüyoruz
      if (localStorage.getItem('currentUser')) {
        try {
          const savedUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
          if (savedUser && savedUser.token) {
            console.log('Oturum korunuyor, önceki kullanıcı oturumu devam ediyor');
          }
        } catch (e) {
          console.error('Oturum koruma hatası:', e);
        }
      }
      return data as User;
    })
    .catch(error => {
      console.error('Kullanıcı oluşturma hatası:', error.message);
      this.isSaving = false;
      throw error;
    })
    .finally(() => {
      this.isSaving = false;
    });
  }

  createUser() {
    this.editingUser = {
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      role: UserRole.USER,
      banned: false,
      password: ''
    };
    this.userForm = this.createUserForm();
  }

  editUser(user: User) {
    this.editingUser = { ...user };
    this.userForm = this.createUserForm(user);
    this.showPasswordField = false; // Şifre değiştirme alanını gizle
  }

  toggleBan(user: User) {
    if (!user.id) return;

    const updatedUserData: User = {
      username: user.username,
      email: user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: user.role,
      banned: !user.banned,
      password: ''  // Boş gönderiyoruz, şifre değişmeyecek
    };

    this.authService.updateUser(user.id, updatedUserData).subscribe({
      next: (response) => {
        // Başarılı cevap geldiğinde liste elemanını güncelle
        const index = this.users.findIndex(u => u.id === user.id);
        if (index !== -1) {
          this.users[index].banned = !user.banned;
        }
        console.log('Kullanıcı ban durumu güncellendi:', response);
      },
      error: (err) => {
        console.error('Ban durumu güncellenirken hata oluştu:', err);
        alert('Ban durumu güncellenirken hata oluştu!');
      }
    });
  }

  promoteToAdmin(user: User) {
    if (!user.id) return;

    const newRole = user.role === UserRole.ADMIN ? UserRole.USER : UserRole.ADMIN;
    const updatedUserData: User = {
      username: user.username,
      email: user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: newRole,
      banned: user.banned,
      password: ''  // Boş gönderiyoruz, şifre değişmeyecek
    };

    this.authService.updateUser(user.id, updatedUserData).subscribe({
      next: (response) => {
        // Başarılı cevap geldiğinde liste elemanını güncelle
        const index = this.users.findIndex(u => u.id === user.id);
        if (index !== -1) {
          this.users[index].role = newRole;
        }
        console.log('Kullanıcı rolü güncellendi:', response);
      },
      error: (err) => {
        console.error('Rol güncellenirken hata oluştu:', err);
        alert('Rol güncellenirken hata oluştu!');
      }
    });
  }

  cancelEdit() {
    this.editingUser = null;
  }

  // Email ve kullanıcı adının sistemde olup olmadığını kontrol eden yeni metod
  private checkUserExists(username: string, email: string): Promise<boolean> {
    // Basit bir kontrol - eğer mevcut kullanıcılar arasında aynı kullanıcı adı veya email varsa
    const userExists = this.users.some(user =>
      user.username === username || user.email === email
    );

    if (userExists) {
      return Promise.resolve(true); // Kullanıcı zaten var
    }

    // Eğer yerel listede yoksa, backend'e sorabilirsiniz (opsiyonel)
    return Promise.resolve(false); // Kullanıcı yok
  }

  saveUser() {
    if (this.userForm.invalid) {
      return;
    }

    this.isSaving = true;

    // Formdan değerleri al
    const values = this.userForm.value;

    // Sadece DTO'da olan alanları içeren veri objesi oluştur
    const userData: User = {
      username: values.username,
      email: values.email,
      firstName: values.firstName || '',
      lastName: values.lastName || '',
      role: values.role,
      banned: !!values.banned,
      password: '' // Varsayılan değer
    };

    // Şifre değiştirme seçildiyse veya yeni kullanıcı oluşturuluyorsa şifreyi ekle
    if (!this.editingUser?.id || this.showPasswordField) {
      userData.password = values.password || '';
    }

    console.log('Kaydedilecek kullanıcı verisi:', userData);
    console.log('Şifre değiştiriliyor mu:', !this.editingUser?.id || this.showPasswordField);

    try {
      if (this.editingUser?.id) {
        // Mevcut kullanıcıyı güncelle
        this.authService.updateUser(this.editingUser.id, userData).subscribe({
          next: (updatedUser) => {
            const index = this.users.findIndex(u => u.id === updatedUser.id);
            if (index !== -1) {
              this.users[index] = updatedUser;
            }
            this.editingUser = null;
            this.isSaving = false;
            alert('Kullanıcı başarıyla güncellendi');
          },
          error: (error) => {
            console.error('Kullanıcı güncellenirken hata oluştu:', error);
            this.isSaving = false;
            alert('Kullanıcı güncellenirken hata oluştu: ' + error);
          }
        });
      } else {
        // Önce kullanıcı adı ve email kontrolü yap
        this.checkUserExists(userData.username, userData.email)
          .then(exists => {
            if (exists) {
              throw new Error('Bu kullanıcı adı veya e-posta adresi zaten kullanımda');
            }

            // Kullanıcı yoksa oluştur
            return this.direktKayit(userData);
          })
          .then(newUser => {
            this.users.push(newUser);
            this.editingUser = null;
            this.isSaving = false;
            alert('Kullanıcı başarıyla oluşturuldu');
          })
          .catch(error => {
            console.error('Kullanıcı oluşturulurken hata oluştu:', error);
            this.isSaving = false;
            // Daha kullanıcı dostu hata mesajı göster
            alert('Kullanıcı oluşturulamadı: ' + error.message);
          });
      }
    } catch (error) {
      console.error('İşlem sırasında hata oluştu:', error);
      this.isSaving = false;
      alert('İşlem sırasında beklenmeyen bir hata oluştu');
    }
  }

  deleteUser(user: User) {
    if (!user.id) return;

    if (confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) {
      this.authService.deleteUser(user.id).subscribe({
        next: () => {
          this.loadUsers();
        }
      });
    }
  }
}
