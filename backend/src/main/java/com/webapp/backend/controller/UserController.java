package com.webapp.backend.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.webapp.backend.dto.JwtResponseDto;
import com.webapp.backend.dto.LoginDto;
import com.webapp.backend.dto.RegisterDto;
import com.webapp.backend.dto.UserProfileDto;
import com.webapp.backend.exception.AuthException;
import com.webapp.backend.exception.DuplicateResourceException;
import com.webapp.backend.exception.ResourceNotFoundException;
import com.webapp.backend.model.User;
import com.webapp.backend.security.JwtUtil;
import com.webapp.backend.service.UserService;

import jakarta.validation.Valid;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    
    @Autowired
    private JwtUtil jwtUtils;
    
    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<List<UserProfileDto>> getAllUsers() {
        List<User> users = userService.findAllUsers();
        List<UserProfileDto> userDtos = users.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(userDtos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserProfileDto> getUserById(@PathVariable Long id) {
        User user = userService.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        
        UserProfileDto userDto = convertToDto(user);
        return ResponseEntity.ok(userDto);
    }

    @PostMapping("/register")
    public ResponseEntity<JwtResponseDto> registerUser(@Valid @RequestBody RegisterDto registerDto) {
        // Kullanıcı adı kontrolü
        if (userService.existsByUsername(registerDto.getUsername())) {
            throw new DuplicateResourceException("User", "username", registerDto.getUsername());
        }

        // E-posta kontrolü
        if (userService.existsByEmail(registerDto.getEmail())) {
            throw new DuplicateResourceException("User", "email", registerDto.getEmail());
        }

        // RegisterDto'yu User entity'sine dönüştür
        User user = new User();
        user.setUsername(registerDto.getUsername());
        user.setEmail(registerDto.getEmail());
        user.setPassword(registerDto.getPassword());
        user.setFirstName(registerDto.getFirstName());
        user.setLastName(registerDto.getLastName());
        
        // Form seçimine göre kullanıcı rolünü ayarla
        if (registerDto.getRole() != null && registerDto.getRole().equals("SELLER")) {
            user.setRole("SELLER");
        } else {
            user.setRole("USER"); // Varsayılan rol
        }

        // Kullanıcıyı kaydet
        User registeredUser = userService.registerUser(user);

        try {
            // Spring Security ile kimlik doğrulama
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(registerDto.getUsername(), registerDto.getPassword())
            );
            
            SecurityContextHolder.getContext().setAuthentication(authentication);
            
            // JWT token oluştur
            String token = jwtUtils.generateJwtToken(authentication);
            
            // JwtResponseDto oluştur
            JwtResponseDto responseDto = new JwtResponseDto(
                token,
                registeredUser.getId(),
                registeredUser.getUsername(),
                registeredUser.getEmail(),
                registeredUser.getRole().name(),
                registeredUser.getFirstName(),
                registeredUser.getLastName()
            );
            
            return ResponseEntity.status(HttpStatus.CREATED).body(responseDto);
        } catch (Exception e) {
            System.err.println("Token generation error on registration: " + e.getMessage());
            
            // Hata durumunda da kullanıcı kaydı yapılmasını sağla ama token olmadan
            UserProfileDto userDto = convertToDto(registeredUser);
            return ResponseEntity.status(HttpStatus.CREATED).body(
                new JwtResponseDto(
                    null, 
                    userDto.getId(), 
                    userDto.getUsername(), 
                    userDto.getEmail(), 
                    userDto.getRole(),
                    userDto.getFirstName(),
                    userDto.getLastName()
                )
            );
        }
    }

    @PostMapping("/login")
    public ResponseEntity<JwtResponseDto> loginUser(@Valid @RequestBody LoginDto loginDto) {
        // Kullanıcıyı e-posta ile ara
        User user = userService.findByEmail(loginDto.getEmail())
                .orElseThrow(() -> new AuthException("Invalid email or password"));

        // Şifre kontrolü
        if (!userService.validatePassword(user, loginDto.getPassword())) {
            throw new AuthException("Invalid email or password");
        }

        // Kullanıcı banlanmış mı kontrolü
        if (user.getBanned()) {
            throw new AuthException("Your account has been banned");
        }

        try {
            // Spring Security ile kimlik doğrulama
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(user.getUsername(), loginDto.getPassword())
            );
            
            SecurityContextHolder.getContext().setAuthentication(authentication);
            
            // JWT token oluştur
            String token = jwtUtils.generateJwtToken(authentication);
            
            System.out.println("Generated token: " + token);
            
            // JwtResponseDto oluştur
            JwtResponseDto responseDto = new JwtResponseDto(
                token,
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole().name(),
                user.getFirstName(),
                user.getLastName()
            );
            
            return ResponseEntity.ok(responseDto);
        } catch (Exception e) {
            System.err.println("Token generation error: " + e.getMessage());
            throw new AuthException("Authentication failed: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserProfileDto> updateUser(@PathVariable Long id, @Valid @RequestBody RegisterDto userDetails) {
        User existingUser = userService.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        
        // Kullanıcı bilgilerini güncelle
        existingUser.setFirstName(userDetails.getFirstName());
        existingUser.setLastName(userDetails.getLastName());
        
        // E-posta değişikliği varsa ve başka bir kullanıcı tarafından kullanılıyorsa hata döndür
        if (!existingUser.getEmail().equals(userDetails.getEmail()) && 
            userService.existsByEmail(userDetails.getEmail())) {
            throw new DuplicateResourceException("User", "email", userDetails.getEmail());
        }
        existingUser.setEmail(userDetails.getEmail());
        
        // Kullanıcı adı değiştirme isteği varsa ve başka bir kullanıcı tarafından kullanılıyorsa hata döndür
        if (!existingUser.getUsername().equals(userDetails.getUsername()) && 
            userService.existsByUsername(userDetails.getUsername())) {
            throw new DuplicateResourceException("User", "username", userDetails.getUsername());
        }
        existingUser.setUsername(userDetails.getUsername());
        
        // Şifre değişikliği varsa güncelle ve hashle
        if (userDetails.getPassword() != null && !userDetails.getPassword().isEmpty()) {
            // Şifreyi PasswordEncoder ile hashle
            existingUser = userService.changePassword(existingUser, userDetails.getPassword());
        }
        
        // Rol güncelleme (sadece admin tarafından yapılabilir)
        if (userDetails.getRole() != null) {
            // Role enum'a çevir
            try {
                existingUser.setRole(userDetails.getRole());
            } catch (Exception e) {
                System.err.println("Role conversion error: " + e.getMessage());
            }
        }
        
        // Banned durumu güncelleme
        if (userDetails.getBanned() != null) {
            existingUser.setBanned(userDetails.getBanned());
        }
        
        User updatedUser = userService.updateUser(existingUser);
        
        // Kullanıcıyı UserProfileDto'ya dönüştür
        UserProfileDto userDto = convertToDto(updatedUser);
        
        return ResponseEntity.ok(userDto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Boolean>> deleteUser(@PathVariable Long id) {
        User user = userService.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        
        userService.deleteUser(id);
        
        Map<String, Boolean> response = new HashMap<>();
        response.put("deleted", Boolean.TRUE);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * User entity'sini UserProfileDto'ya dönüştürür
     */
    private UserProfileDto convertToDto(User user) {
        UserProfileDto dto = new UserProfileDto();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setRole(user.getRole().name());
        dto.setBanned(user.getBanned());
        return dto;
    }
}