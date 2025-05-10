package com.webapp.backend.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.webapp.backend.model.User;
import com.webapp.backend.repository.UserRepository;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {
    @Autowired
    UserRepository userRepository;

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // Spring Security UserDetailsService arabirimi, yalnızca kullanıcı adı ile kimlik doğrulamayı destekler
        // Bu nedenle, username parametresi aslında e-posta veya gerçek kullanıcı adı olabilir
        
        User user = userRepository.findByEmail(username)
                .orElseGet(() -> userRepository.findByUsername(username)
                        .orElseThrow(() -> new UsernameNotFoundException("User Not Found with username or email: " + username)));

        return UserDetailsImpl.build(user);
    }
}