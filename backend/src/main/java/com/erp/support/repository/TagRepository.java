package com.erp.support.repository;
import com.erp.support.entity.Tag;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface TagRepository extends JpaRepository<Tag, Long> {
    Optional<Tag> findByName(String name);
}
