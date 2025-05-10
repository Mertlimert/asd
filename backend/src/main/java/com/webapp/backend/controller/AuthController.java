package com.webapp.backend.controller;

import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.webapp.backend.dto.JwtResponseDto;
import com.webapp.backend.dto.LoginDto;
import com.webapp.backend.dto.RegisterDto;
import com.webapp.backend.exception.AuthException;
import com.webapp.backend.exception.DuplicateResourceException;
import com.webapp.backend.exception.ResourceNotFoundException;
import com.webapp.backend.model.User;
import com.webapp.backend.security.JwtUtil;
import com.webapp.backend.security.UserDetailsImpl;
import com.webapp.backend.service.UserService;

import jakarta.validation.Valid;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserService userService;

    @Autowired
    JwtUtil jwtUtils;

    @PostMapping("/signin")
    public ResponseEntity<JwtResponseDto> authenticateUser(@Valid @RequestBody LoginDto loginDto) {
        // E-posta ile kimlik doğrulama
        User user = userService.findByEmail(loginDto.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", loginDto.getEmail()));
        
        // Kullanıcı banlanmış mı kontrol et
        if (user.getBanned()) {
            throw new AuthException("Your account has been banned");
        }
        
        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(user.getUsername(), loginDto.getPassword()));
        } catch (Exception e) {
            throw new AuthException("Invalid email or password");
        }

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        // Yetki bilgisini string olarak al
        String role = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.joining(","));

        JwtResponseDto responseDto = new JwtResponseDto(
            jwt,
            userDetails.getId(),
            user.getUsername(),
            userDetails.getEmail(),
            role,
            user.getFirstName(),
            user.getLastName()
        );

        return ResponseEntity.ok(responseDto);
    }

    @PostMapping("/signup")
    public ResponseEntity<JwtResponseDto> registerUser(@Valid @RequestBody RegisterDto registerDto) {
        // Kullanıcı adı kontrolü
        if (userService.existsByUsername(registerDto.getUsername())) {
            throw new DuplicateResourceException("User", "username", registerDto.getUsername());
        }

        // Email kontrolü
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

        // Kullanıcıyı kaydet
        User savedUser = userService.registerUser(user);
        
        // Kaydedilen kullanıcı için token oluştur
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        registerDto.getUsername(),
                        registerDto.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);
        
        // Kullanıcıyı JwtResponseDto'ya dönüştür
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        
        String role = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.joining(","));
        
        JwtResponseDto responseDto = new JwtResponseDto(
            jwt,
            savedUser.getId(),
            savedUser.getUsername(),
            savedUser.getEmail(),
            savedUser.getRole().name(),
            savedUser.getFirstName(),
            savedUser.getLastName()
        );

        return ResponseEntity.ok(responseDto);
    }
}