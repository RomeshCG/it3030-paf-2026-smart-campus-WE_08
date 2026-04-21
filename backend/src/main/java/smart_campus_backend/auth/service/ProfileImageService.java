package smart_campus_backend.auth.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ProfileImageService {

    private final Cloudinary cloudinary;

    public String uploadProfileImage(MultipartFile file, Long userId) {
        try {
            Map<?, ?> uploadResult = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", "smart-campus/profile-images",
                            "public_id", "user-" + userId,
                            "overwrite", true,
                            "invalidate", true,
                            "resource_type", "image",
                            "transformation", "f_auto,q_auto:good"
                    )
            );
            Object secureUrl = uploadResult.get("secure_url");
            if (secureUrl == null) {
                throw new RuntimeException("Cloudinary did not return an image URL");
            }
            return secureUrl.toString();
        } catch (IOException ex) {
            throw new RuntimeException("Failed to upload profile image", ex);
        }
    }
}
