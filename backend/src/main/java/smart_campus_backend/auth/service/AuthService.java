package smart_campus_backend.auth.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import smart_campus_backend.auth.dto.AuthResponse;
import smart_campus_backend.auth.dto.CurrentUserResponse;
import smart_campus_backend.auth.dto.InviteRegisterRequest;
import smart_campus_backend.auth.dto.LoginRequest;
import smart_campus_backend.auth.dto.RegisterRequest;
import smart_campus_backend.auth.dto.UpdateProfileRequest;
import smart_campus_backend.auth.entity.AdminInvite;
import smart_campus_backend.auth.entity.AuthProvider;
import smart_campus_backend.auth.entity.InviteStatus;
import smart_campus_backend.auth.entity.Role;
import smart_campus_backend.auth.entity.User;
import smart_campus_backend.auth.repository.AdminInviteRepository;
import smart_campus_backend.auth.repository.UserRepository;
import smart_campus_backend.auth.security.CustomUserDetailsService;
import smart_campus_backend.auth.security.JwtUtil;

import java.time.LocalDateTime;
import java.util.Collections;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final CustomUserDetailsService userDetailsService;
    private final AdminInviteRepository adminInviteRepository;
    private final ProfileImageService profileImageService;

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
                .profileImageUrl(user.getProfileImageUrl())
                .role(user.getRole().name())
                .build();
    }

    public AuthResponse registerWithInvite(InviteRegisterRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        AdminInvite invite = adminInviteRepository.findByToken(request.getToken().trim())
                .orElseThrow(() -> new RuntimeException("Invalid invite token"));

        if (invite.getStatus() != InviteStatus.PENDING) {
            throw new RuntimeException("Invite is not active");
        }
        if (invite.getExpiresAt().isBefore(LocalDateTime.now())) {
            invite.setStatus(InviteStatus.EXPIRED);
            adminInviteRepository.save(invite);
            throw new RuntimeException("Invite has expired");
        }
        if (!invite.getEmail().equalsIgnoreCase(normalizedEmail)) {
            throw new RuntimeException("This invite is issued for a different email");
        }
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new RuntimeException("Email is already registered");
        }

        User user = User.builder()
                .name(request.getName().trim())
                .email(normalizedEmail)
                .password(passwordEncoder.encode(request.getPassword()))
                .provider(AuthProvider.LOCAL)
                .role(invite.getTargetRole())
                .build();
        userRepository.save(user);

        invite.setStatus(InviteStatus.USED);
        adminInviteRepository.save(invite);

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtUtil.generateToken(userDetails);

        return AuthResponse.builder()
                .token(token)
                .name(user.getName())
                .email(user.getEmail())
                .profileImageUrl(user.getProfileImageUrl())
                .role(user.getRole().name())
                .build();
    }

    // ───── Email / Password Login ────────────────────────────────────────────
    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("No account found for this email"));

        if (!user.isEnabled()) {
            throw new RuntimeException("Your account has been banned. Please contact support.");
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, request.getPassword())
            );
        } catch (BadCredentialsException ex) {
            throw new RuntimeException("Incorrect password");
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtUtil.generateToken(userDetails);

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .profileImageUrl(user.getProfileImageUrl())
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
                .profileImageUrl(user.getProfileImageUrl())
                .role(user.getRole().name())
                .build();
    }

    public CurrentUserResponse currentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        if (!user.isEnabled()) {
            throw new RuntimeException("User is disabled");
        }

        return CurrentUserResponse.builder()
                .name(user.getName())
                .email(user.getEmail())
                .profileImageUrl(user.getProfileImageUrl())
                .role(user.getRole().name())
                .build();
    }

    public AuthResponse updateCurrentUser(String currentEmail, UpdateProfileRequest request) {
        String normalizedCurrentEmail = currentEmail.trim().toLowerCase();
        String normalizedName = request.getName().trim();
        String normalizedProfileImageUrl = request.getProfileImageUrl() == null
                ? null
                : request.getProfileImageUrl().trim();

        User user = userRepository.findByEmail(normalizedCurrentEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        if (!user.isEnabled()) {
            throw new RuntimeException("User is disabled");
        }

        user.setName(normalizedName);
        user.setProfileImageUrl(normalizedProfileImageUrl == null || normalizedProfileImageUrl.isBlank()
                ? null
                : normalizedProfileImageUrl);
        user = userRepository.save(user);

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtUtil.generateToken(userDetails);

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .profileImageUrl(user.getProfileImageUrl())
                .role(user.getRole().name())
                .build();
    }

    public AuthResponse uploadCurrentUserProfileImage(String currentEmail, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("Please select an image to upload");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new RuntimeException("Only image files are allowed");
        }

        if (file.getSize() > 5L * 1024L * 1024L) {
            throw new RuntimeException("Profile image must be smaller than 5MB");
        }

        User user = userRepository.findByEmail(currentEmail.trim().toLowerCase())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        String imageUrl = profileImageService.uploadProfileImage(file, user.getId());
        user.setProfileImageUrl(imageUrl);
        user = userRepository.save(user);

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtUtil.generateToken(userDetails);

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .profileImageUrl(user.getProfileImageUrl())
                .role(user.getRole().name())
                .build();
    }
}
