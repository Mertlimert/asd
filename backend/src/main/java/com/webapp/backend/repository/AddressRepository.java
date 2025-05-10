package com.webapp.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.webapp.backend.model.Address;
import com.webapp.backend.model.User;

@Repository
public interface AddressRepository extends JpaRepository<Address, Long> {
    List<Address> findByUser(User user);
    List<Address> findByUserAndIsDefaultTrue(User user);
    Address findByUserAndId(User user, Long id);
} 