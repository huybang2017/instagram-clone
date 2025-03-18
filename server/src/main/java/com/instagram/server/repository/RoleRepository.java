package com.instagram.server.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.instagram.server.entity.Role;

@Repository
public interface RoleRepository extends JpaRepository<Role, String> {
}

