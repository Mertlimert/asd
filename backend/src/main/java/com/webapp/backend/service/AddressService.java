package com.webapp.backend.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.webapp.backend.model.Address;
import com.webapp.backend.model.User;
import com.webapp.backend.repository.AddressRepository;

@Service
public class AddressService {
    
    @Autowired
    private AddressRepository addressRepository;
    
    @Autowired
    private UserService userService;
    
    public List<Address> getUserAddresses(User user) {
        return addressRepository.findByUser(user);
    }
    
    public Address getUserAddressById(User user, Long addressId) {
        return addressRepository.findByUserAndId(user, addressId);
    }
    
    public Optional<Address> getDefaultAddress(User user) {
        List<Address> defaultAddresses = addressRepository.findByUserAndIsDefaultTrue(user);
        return defaultAddresses.isEmpty() ? Optional.empty() : Optional.of(defaultAddresses.get(0));
    }
    
    @Transactional
    public Address createAddress(User user, Address address) {
        address.setUser(user);
        
        // Eğer bu adres varsayılan olarak ayarlanmışsa, diğer varsayılan adresleri kaldır
        if (Boolean.TRUE.equals(address.getIsDefault())) {
            clearDefaultAddresses(user);
        }
        
        return addressRepository.save(address);
    }
    
    @Transactional
    public Address updateAddress(Address existingAddress, Address updatedAddress) {
        existingAddress.setAddressLine1(updatedAddress.getAddressLine1());
        existingAddress.setAddressLine2(updatedAddress.getAddressLine2());
        existingAddress.setCity(updatedAddress.getCity());
        existingAddress.setState(updatedAddress.getState());
        existingAddress.setPostalCode(updatedAddress.getPostalCode());
        existingAddress.setCountry(updatedAddress.getCountry());
        existingAddress.setPhoneNumber(updatedAddress.getPhoneNumber());
        existingAddress.setAddressName(updatedAddress.getAddressName());
        existingAddress.setRecipientName(updatedAddress.getRecipientName());
        
        // Eğer bu adres varsayılan olarak ayarlanmışsa ve daha önce varsayılan değilse
        if (Boolean.TRUE.equals(updatedAddress.getIsDefault()) && !Boolean.TRUE.equals(existingAddress.getIsDefault())) {
            clearDefaultAddresses(existingAddress.getUser());
            existingAddress.setIsDefault(true);
        }
        
        return addressRepository.save(existingAddress);
    }
    
    @Transactional
    public void deleteAddress(Address address) {
        addressRepository.delete(address);
    }
    
    @Transactional
    public Address setAsDefaultAddress(Address address) {
        User user = address.getUser();
        clearDefaultAddresses(user);
        address.setIsDefault(true);
        return addressRepository.save(address);
    }
    
    private void clearDefaultAddresses(User user) {
        List<Address> defaultAddresses = addressRepository.findByUserAndIsDefaultTrue(user);
        for (Address defaultAddress : defaultAddresses) {
            defaultAddress.setIsDefault(false);
            addressRepository.save(defaultAddress);
        }
    }
} 