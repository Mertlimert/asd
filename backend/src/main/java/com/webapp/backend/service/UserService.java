package com.webapp.backend.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.webapp.backend.model.Cart;
import com.webapp.backend.model.User;
import com.webapp.backend.repository.CartRepository;
import com.webapp.backend.repository.UserRepository;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final CartRepository cartRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public UserService(UserRepository userRepository, CartRepository cartRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.cartRepository = cartRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<User> findAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }
    
    /**
     * ID ile kullanıcıyı alır. ReviewController tarafından kullanılır.
     */
    public User getUserById(Long id) {
        return userRepository.findById(id).orElse(null);
    }

    /**
     * Kullanıcı adı ile kullanıcı bulma.
     * NOT: Uygulama artık e-posta tabanlı kimlik doğrulama kullanıyor.
     * Bu metot sadece geriye dönük uyumluluk için korunmuştur.
     */
    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    /**
     * E-posta ile kullanıcı bulma.
     * Bu, önerilen kullanıcı arama yöntemidir.
     */
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public User registerUser(User user) {
        // Şifreyi hashle
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        
        // Kullanıcıyı kaydet
        User savedUser = userRepository.save(user);
        
        // Kullanıcıya bir sepet oluştur
        Cart cart = new Cart();
        cart.setUser(savedUser);
        cartRepository.save(cart);
        
        return savedUser;
    }

    /**
     * Kullanıcı adının varlığını kontrol eder.
     * NOT: Uygulama artık e-posta tabanlı kimlik doğrulama kullanıyor.
     * Bu metot sadece geriye dönük uyumluluk için korunmuştur.
     */
    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    /**
     * E-posta adresinin varlığını kontrol eder.
     * Bu, önerilen kullanıcı doğrulama yöntemidir.
     */
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    public User updateUser(User user) {
        return userRepository.save(user);
    }

    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }
    
    public boolean validatePassword(User user, String rawPassword) {
        return passwordEncoder.matches(rawPassword, user.getPassword());
    }
    
    public User changePassword(User user, String newPassword) {
        user.setPassword(passwordEncoder.encode(newPassword));
        return userRepository.save(user);
    }
    
    /**
     * E-posta ile kullanıcıyı doğrular ve şifreyi kontrol eder.
     * Bu, önerilen kimlik doğrulama yöntemidir.
     */
    public Optional<User> authenticateByEmail(String email, String rawPassword) {
        Optional<User> userOpt = findByEmail(email);
        if (userOpt.isPresent() && validatePassword(userOpt.get(), rawPassword)) {
            return userOpt;
        }
        return Optional.empty();
    }
    
    /**
     * Oturum açmış kullanıcıyı getirir
     */
    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return findByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException("Oturum açmış kullanıcı bulunamadı: " + email));
    }
    
    /**
     * Kullanıcının admin olup olmadığını kontrol eder
     */
    public boolean isAdmin(User user) {
        return user.getRole() != null && user.getRole().name().equals("ADMIN");
    }
}