package kr.codeit.onboarding.repository;

import kr.codeit.onboarding.domain.entity.PasswordResetToken;
import kr.codeit.onboarding.domain.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByToken(String token);

    Optional<PasswordResetToken> findByUser_Id(Long userId);

    void deleteByUser(User user);
}
