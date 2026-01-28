package kr.codeit.onboarding.repository;

import kr.codeit.onboarding.domain.entity.FileUpload;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FileUploadRepository extends JpaRepository<FileUpload, Long> {

    List<FileUpload> findByTaskId(Long taskId);

    List<FileUpload> findByInstructorId(Long instructorId);

    List<FileUpload> findByTaskIdAndInstructorId(Long taskId, Long instructorId);
}
