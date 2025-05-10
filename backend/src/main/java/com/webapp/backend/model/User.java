package com.webapp.backend.model;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id") 
    private Long id;
    
    @NotBlank(message = "Username is required")
    @Column(unique = true)
    private String username;
    
    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email")
    @Column(unique = true)
    private String email;
    
    @NotBlank(message = "Password is required")
    private String password;
    
    private String firstName;
    private String lastName;
    
    @Enumerated(EnumType.STRING) // Store enum name as string
    @Column(nullable = false)
    private Role role = Role.USER; // Default role is USER

    @Column(nullable = false)
    private Boolean banned = false;
    
    @Transient
    private String token;
    
    @OneToOne(mappedBy = "user", cascade = jakarta.persistence.CascadeType.ALL, orphanRemoval = true)
    private Cart cart;
    
    @OneToMany(mappedBy = "user", cascade = jakarta.persistence.CascadeType.ALL, orphanRemoval = true)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"user", "cart"})
    private List<Address> addresses = new ArrayList<>();

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    // Getter and Setter for role
    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public Boolean getBanned() {
        return banned;
    }

    public void setBanned(Boolean banned) {
        this.banned = banned;
    }

    public Cart getCart() {
        return cart;
    }

    public void setCart(Cart cart) {
        this.cart = cart;
    }
    
    public List<Address> getAddresses() {
        return addresses;
    }
    
    public void setAddresses(List<Address> addresses) {
        this.addresses = addresses;
    }
    
    // Adres eklemek için yardımcı metod
    public void addAddress(Address address) {
        address.setUser(this);
        this.addresses.add(address);
    }
    
    // Adres silmek için yardımcı metod
    public void removeAddress(Address address) {
        this.addresses.remove(address);
    }

    public void setRole(String roleName) {
        try {
            this.role = Role.valueOf(roleName);
        } catch (IllegalArgumentException e) {
            // Eğer geçersiz bir rol adı girilirse varsayılan olarak USER rolünü ata
            this.role = Role.USER;
        }
    }
}