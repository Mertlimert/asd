package com.webapp.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import com.webapp.backend.model.User;
import com.webapp.backend.model.Role;
import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class JwtUtil {
    private final Key key = Keys.secretKeyFor(SignatureAlgorithm.HS256);
    private final long JWT_TOKEN_VALIDITY = 5 * 60 * 60 * 1000; // 5 hours

    public String generateToken(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", user.getRole().name());
        return createToken(claims, user.getEmail());
    }
    
    public String generateJwtToken(Authentication authentication) {
        // Authentication nesnesinden kullanıcı bilgilerini çıkar
        String username = authentication.getName();
        
        // Rol bilgisini al
        String roles = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.joining(","));
        
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", roles);
        
        return createToken(claims, username);
    }

    private String createToken(Map<String, Object> claims, String subject) {
        return Jwts.builder()
            .setClaims(claims)
            .setSubject(subject)
            .setIssuedAt(new Date(System.currentTimeMillis()))
            .setExpiration(new Date(System.currentTimeMillis() + JWT_TOKEN_VALIDITY))
            .signWith(key)
            .compact();
    }

    public Boolean validateToken(String token) {
        try {
            return !isTokenExpired(token);
        } catch (Exception e) {
            return false;
        }
    }

    public String getEmailFromToken(String token) {
        return getClaimFromToken(token, Claims::getSubject);
    }

    public Boolean isAdmin(String token) {
        final Claims claims = getAllClaimsFromToken(token);
        String role = claims.get("role", String.class);
        return Role.ADMIN.name().equals(role);
    }

    public Role getRole(String token) {
        final Claims claims = getAllClaimsFromToken(token);
        String roleStr = claims.get("role", String.class);
        return roleStr != null ? Role.valueOf(roleStr) : Role.USER;
    }

    private Date getExpirationDateFromToken(String token) {
        return getClaimFromToken(token, Claims::getExpiration);
    }

    private <T> T getClaimFromToken(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = getAllClaimsFromToken(token);
        return claimsResolver.apply(claims);
    }

    public Claims getAllClaimsFromToken(String token) {
        return Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token).getBody();
    }

    private Boolean isTokenExpired(String token) {
        final Date expiration = getExpirationDateFromToken(token);
        return expiration.before(new Date());
    }
}