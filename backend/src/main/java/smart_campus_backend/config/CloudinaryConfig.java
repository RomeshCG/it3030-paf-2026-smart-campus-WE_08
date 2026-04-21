package smart_campus_backend.config;

import com.cloudinary.Cloudinary;
import org.springframework.core.env.Environment;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class CloudinaryConfig {

    @Bean
    public Cloudinary cloudinary(
            Environment environment
    ) {
        String cloudName = environment.getProperty("cloudinary.cloud-name", "demo");
        String apiKey = environment.getProperty("cloudinary.api-key", "test");
        String apiSecret = environment.getProperty("cloudinary.api-secret", "test");

        Map<String, String> config = new HashMap<>();
        config.put("cloud_name", cloudName);
        config.put("api_key", apiKey);
        config.put("api_secret", apiSecret);
        config.put("secure", "true");
        return new Cloudinary(config);
    }
}
