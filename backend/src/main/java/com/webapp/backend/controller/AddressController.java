package com.webapp.backend.controller;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.webapp.backend.dto.AddressDto;
import com.webapp.backend.exception.AddressException;
import com.webapp.backend.exception.ErrorCodes;
import com.webapp.backend.exception.ResourceNotFoundException;
import com.webapp.backend.model.Address;
import com.webapp.backend.model.User;
import com.webapp.backend.service.AddressService;
import com.webapp.backend.service.UserService;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/api/addresses")
public class AddressController {

    @Autowired
    private AddressService addressService;
    
    @Autowired
    private UserService userService;
    
    /**
     * Kullanıcıya ait tüm adresleri getirme endpoint'i
     */
    @GetMapping("/{userId}")
    public ResponseEntity<List<AddressDto>> getUserAddresses(@PathVariable Long userId) {
        // Kullanıcıyı bul
        User user = userService.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        // Kullanıcının adreslerini getir
        List<Address> addresses = addressService.getUserAddresses(user);
        
        // AddressDto listesine dönüştür
        List<AddressDto> addressDtos = addresses.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(addressDtos);
    }
    
    /**
     * Varsayılan adresi getirme endpoint'i
     */
    @GetMapping("/{userId}/default")
    public ResponseEntity<AddressDto> getDefaultAddress(@PathVariable Long userId) {
        // Kullanıcıyı bul
        User user = userService.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        // Varsayılan adresi getir
        Optional<Address> defaultAddress = addressService.getDefaultAddress(user);
        
        // Varsayılan adres yoksa 404 yerine özel hata döndür
        if (!defaultAddress.isPresent()) {
            throw new AddressException("Kullanıcı için varsayılan adres bulunamadı", 
                    ErrorCodes.ADDRESS_INVALID);
        }
        
        // AddressDto'ya dönüştür
        AddressDto addressDto = convertToDto(defaultAddress.get());
        return ResponseEntity.ok(addressDto);
    }
    
    /**
     * Belirli bir adresi getirme endpoint'i
     */
    @GetMapping("/{userId}/address/{addressId}")
    public ResponseEntity<AddressDto> getAddressById(
            @PathVariable Long userId,
            @PathVariable Long addressId) {
        
        // Kullanıcıyı bul
        User user = userService.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        // Adresi bul
        Address address = addressService.getUserAddressById(user, addressId);
        if (address == null) {
            throw new ResourceNotFoundException("Address", "id", addressId);
        }
        
        // AddressDto'ya dönüştür
        AddressDto addressDto = convertToDto(address);
        return ResponseEntity.ok(addressDto);
    }
    
    /**
     * Yeni adres ekleme endpoint'i
     */
    @PostMapping("/{userId}")
    public ResponseEntity<AddressDto> createAddress(
            @PathVariable Long userId,
            @RequestBody AddressDto addressDto) {
        
        // Kullanıcıyı bul
        User user = userService.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        // Adres bilgilerinin geçerliliğini kontrol et
        validateAddressData(addressDto);
        
        // AddressDto'yu Address entity'sine dönüştür
        Address address = convertToEntity(addressDto);
        
        // Adresi kaydet
        Address createdAddress = addressService.createAddress(user, address);
        
        // Oluşturulan adresi AddressDto'ya dönüştür
        AddressDto createdAddressDto = convertToDto(createdAddress);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdAddressDto);
    }
    
    /**
     * Mevcut bir adresi güncelleme endpoint'i
     */
    @PutMapping("/{userId}/address/{addressId}")
    public ResponseEntity<AddressDto> updateAddress(
            @PathVariable Long userId,
            @PathVariable Long addressId,
            @RequestBody AddressDto addressDto) {
        
        // Kullanıcıyı bul
        User user = userService.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        // Güncellenecek adresi bul
        Address existingAddress = addressService.getUserAddressById(user, addressId);
        if (existingAddress == null) {
            throw new ResourceNotFoundException("Address", "id", addressId);
        }
        
        // Adres bilgilerinin geçerliliğini kontrol et
        validateAddressData(addressDto);
        
        // AddressDto'yu Address entity'sine dönüştür
        Address updatedAddress = convertToEntity(addressDto);
        
        // Adresi güncelle
        Address savedAddress = addressService.updateAddress(existingAddress, updatedAddress);
        
        // Güncellenen adresi AddressDto'ya dönüştür
        AddressDto updatedAddressDto = convertToDto(savedAddress);
        return ResponseEntity.ok(updatedAddressDto);
    }
    
    /**
     * Bir adresi varsayılan olarak ayarlama endpoint'i
     */
    @PutMapping("/{userId}/address/{addressId}/default")
    public ResponseEntity<AddressDto> setAsDefaultAddress(
            @PathVariable Long userId,
            @PathVariable Long addressId) {
        
        // Kullanıcıyı bul
        User user = userService.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        // Varsayılan olarak ayarlanacak adresi bul
        Address address = addressService.getUserAddressById(user, addressId);
        if (address == null) {
            throw new ResourceNotFoundException("Address", "id", addressId);
        }
        
        // Adresi varsayılan olarak ayarla
        Address defaultAddress = addressService.setAsDefaultAddress(address);
        
        // Güncellenen adresi AddressDto'ya dönüştür
        AddressDto addressDto = convertToDto(defaultAddress);
        return ResponseEntity.ok(addressDto);
    }
    
    /**
     * Bir adresi silme endpoint'i
     */
    @DeleteMapping("/{userId}/address/{addressId}")
    public ResponseEntity<Void> deleteAddress(
            @PathVariable Long userId,
            @PathVariable Long addressId) {
        
        // Kullanıcıyı bul
        User user = userService.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        // Silinecek adresi bul
        Address address = addressService.getUserAddressById(user, addressId);
        if (address == null) {
            throw new ResourceNotFoundException("Address", "id", addressId);
        }
        
        // Varsayılan adres silinmeye çalışılıyorsa hata ver
        if (Boolean.TRUE.equals(address.getIsDefault())) {
            throw new AddressException(
                "Varsayılan adres silinemez. Önce başka bir adresi varsayılan olarak ayarlayın.",
                ErrorCodes.ADDRESS_DELETE_CONSTRAINT
            );
        }
        
        try {
            // Adresi sil
            addressService.deleteAddress(address);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            // Adres bir siparişte kullanılıyorsa veya başka bir kısıtlama varsa
            throw new AddressException(
                "Bu adres aktif bir siparişle ilişkili olduğu için silinemiyor.",
                ErrorCodes.ADDRESS_DELETE_CONSTRAINT
            );
        }
    }
    
    /**
     * Address entity'sini AddressDto'ya dönüştürür
     */
    private AddressDto convertToDto(Address address) {
        AddressDto dto = new AddressDto();
        dto.setId(address.getId());
        dto.setAddressLine1(address.getAddressLine1());
        dto.setAddressLine2(address.getAddressLine2());
        dto.setCity(address.getCity());
        dto.setState(address.getState());
        dto.setPostalCode(address.getPostalCode());
        dto.setCountry(address.getCountry());
        dto.setPhoneNumber(address.getPhoneNumber());
        dto.setAddressName(address.getAddressName());
        dto.setRecipientName(address.getRecipientName());
        dto.setIsDefault(address.getIsDefault());
        return dto;
    }
    
    /**
     * AddressDto'yu Address entity'sine dönüştürür
     */
    private Address convertToEntity(AddressDto dto) {
        Address address = new Address();
        address.setAddressLine1(dto.getAddressLine1());
        address.setAddressLine2(dto.getAddressLine2());
        address.setCity(dto.getCity());
        address.setState(dto.getState());
        address.setPostalCode(dto.getPostalCode());
        address.setCountry(dto.getCountry());
        address.setPhoneNumber(dto.getPhoneNumber());
        address.setAddressName(dto.getAddressName());
        address.setRecipientName(dto.getRecipientName());
        address.setIsDefault(dto.getIsDefault());
        return address;
    }
    
    /**
     * Adres verisinin geçerliliğini kontrol eder
     */
    private void validateAddressData(AddressDto addressDto) {
        if (addressDto.getAddressLine1() == null || addressDto.getAddressLine1().trim().isEmpty()) {
            throw new AddressException("Adres satırı 1 boş olamaz", ErrorCodes.ADDRESS_INVALID);
        }
        
        if (addressDto.getCity() == null || addressDto.getCity().trim().isEmpty()) {
            throw new AddressException("Şehir boş olamaz", ErrorCodes.ADDRESS_INVALID);
        }
        
        if (addressDto.getCountry() == null || addressDto.getCountry().trim().isEmpty()) {
            throw new AddressException("Ülke boş olamaz", ErrorCodes.ADDRESS_INVALID);
        }
        
        if (addressDto.getPostalCode() == null || addressDto.getPostalCode().trim().isEmpty()) {
            throw new AddressException("Posta kodu boş olamaz", ErrorCodes.ADDRESS_INVALID);
        }
        
        if (addressDto.getRecipientName() == null || addressDto.getRecipientName().trim().isEmpty()) {
            throw new AddressException("Alıcı adı boş olamaz", ErrorCodes.ADDRESS_INVALID);
        }
    }
} 