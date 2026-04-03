package smart_campus_backend.auth.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import smart_campus_backend.auth.dto.AuthResponse;
import smart_campus_backend.auth.dto.LoginRequest;
import smart_campus_backend.auth.dto.RegisterRequest;
import smart_campus_backend.auth.entity.AuthProvider;
import smart_campus_backend.auth.entity.Role;
import smart_campus_backend.auth.entity.User;
import smart_campus_backend.auth.repository.UserRepository;
import smart_campus_backend.auth.security.CustomUserDetailsService;
import smart_campus_backend.auth.security.JwtUtil;

import java.util.Collections;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final CustomUserDetailsService userDetailsService;

    @Value("${google.client-id}")
    private String googleClientId;

    // ───── Register ─────────────────────────────────────────────────────────
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email is already registered");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .provider(AuthProvider.LOCAL)
                .role(Role.USER)
                .build();

        user = userRepository.save(user);

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtUtil.generateToken(userDetails);

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }

    // ───── Email / Password Login ────────────────────────────────────────────
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtUtil.generateToken(userDetails);

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }

    // ───── Google OAuth Login ────────────────────────────────────────────────
    public AuthResponse googleLogin(String idToken) {
        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(), GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(googleClientId))
                .build();

        GoogleIdToken googleIdToken;
        try {
            googleIdToken = verifier.verify(idToken);
        } catch (Exception e) {
            throw new RuntimeException("Failed to verify Google ID token", e);
        }

        if (googleIdToken == null) {
            throw new RuntimeException("Invalid Google ID token");
        }

        GoogleIdToken.Payload payload = googleIdToken.getPayload();
        String email = payload.getEmail();
        String name = (String) payload.get("name");
        String sub  = payload.getSubject();   // Google user ID

        // Upsert the user
        User user = userRepository.findByEmail(email).orElseGet(() ->
                User.builder()
                        .name(name != null ? name : email)
                        .email(email)
                        .provider(AuthProvider.GOOGLE)
                        .providerId(sub)
                        .role(Role.USER)
                        .build()
        );

        // Keep providerId in sync if user already existed
        if (user.getId() != null) {
            user.setProviderId(sub);
        }
        userRepository.save(user);

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtUtil.generateToken(userDetails);

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }
}
