package com.webapp.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    public JwtAuthenticationFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        final String authorizationHeader = request.getHeader("Authorization");

        String email = null;
        String jwt = null;

        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            jwt = authorizationHeader.substring(7);
            try {
                email = jwtUtil.getEmailFromToken(jwt);
            } catch (Exception e) {
                // Token is invalid
            }
        }

        if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            if (jwtUtil.validateToken(jwt)) {
                // Token'dan rol bilgisini al
                try {
                    String roleStr = jwtUtil.getAllClaimsFromToken(jwt).get("role", String.class);
                    UsernamePasswordAuthenticationToken authToken;
                    
                    // Virgülle ayrılmış rolleri listeye dönüştür
                    if (roleStr != null && !roleStr.isEmpty()) {
                        List<SimpleGrantedAuthority> authorities = Arrays.stream(roleStr.split(","))
                            .map(SimpleGrantedAuthority::new)
                            .collect(Collectors.toList());
                        
                        authToken = new UsernamePasswordAuthenticationToken(
                            email, null, authorities
                        );
                    } else {
                        // Rol bulunamazsa boş yetki listesi kullan
                        authToken = new UsernamePasswordAuthenticationToken(
                            email, null, Collections.emptyList()
                        );
                    }
                    
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                } catch (Exception e) {
                    // Rol işleme hatası
                }
            }
        }
        filterChain.doFilter(request, response);
    }
}