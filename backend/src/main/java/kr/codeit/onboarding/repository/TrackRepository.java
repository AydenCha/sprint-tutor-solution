package kr.codeit.onboarding.repository;

import kr.codeit.onboarding.domain.entity.Track;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TrackRepository extends JpaRepository<Track, Long> {

    Optional<Track> findByCode(String code);
    
    Optional<Track> findByName(String name);
    
    Optional<Track> findByKoreanName(String koreanName);
    
    List<Track> findByEnabledTrueOrderByNameAsc();
    
    boolean existsByCode(String code);
    
    boolean existsByName(String name);
    
    boolean existsByKoreanName(String koreanName);
}

