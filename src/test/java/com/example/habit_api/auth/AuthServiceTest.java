package com.example.habit_api.auth;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import com.example.habit_api.auth.dto.*;
import com.example.habit_api.users.*;

class AuthServiceTest {
    private final UserRepository users = mock(UserRepository.class);
    private final JwtService jwt = mock(JwtService.class);
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(4);
    private final AuthService auth = new AuthService(users, encoder, jwt);

    @Test
    void signupNormalizesEmailAndHashesPassword() {
        UUID id = UUID.randomUUID();
        when(users.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            ReflectionTestUtils.setField(user, "id", id);
            return user;
        });
        when(jwt.createToken(id)).thenReturn("signup-token");
        assertThat(auth.signup(new SignupRequest("JAMES@example.com", "password123", "James")))
            .isEqualTo("signup-token");
        var saved = ArgumentCaptor.forClass(User.class);
        verify(users).save(saved.capture());
        assertThat(saved.getValue().getEmail()).isEqualTo("james@example.com");
        assertThat(saved.getValue().getPasswordHash()).isNotEqualTo("password123");
        assertThat(encoder.matches("password123", saved.getValue().getPasswordHash())).isTrue();
        verify(jwt).createToken(id);
    }

    @Test
    void duplicateActiveEmailDoesNotCreateAccountOrIssueToken() {
        when(users.existsByEmailAndDeletedAtIsNull("james@example.com")).thenReturn(true);
        assertThatThrownBy(() -> auth.signup(new SignupRequest("james@example.com", "password123", "James")))
            .isInstanceOf(RuntimeException.class);
        verify(users, never()).save(any());
        verifyNoInteractions(jwt);
    }

    @Test
    void correctPasswordIssuesToken() {
        User user = new User();
        ReflectionTestUtils.setField(user, "id", UUID.randomUUID());
        user.setPasswordHash(encoder.encode("password123"));
        when(users.findByEmailAndDeletedAtIsNull("james@example.com")).thenReturn(Optional.of(user));
        when(jwt.createToken(user.getId())).thenReturn("token");
        assertThat(auth.login(new LoginRequest("JAMES@example.com", "password123"))).isEqualTo("token");
    }

    @Test
    void wrongPasswordDoesNotIssueToken() {
        User user = new User();
        user.setPasswordHash(encoder.encode("password123"));
        when(users.findByEmailAndDeletedAtIsNull("james@example.com")).thenReturn(Optional.of(user));
        assertThatThrownBy(() -> auth.login(new LoginRequest("james@example.com", "wrong")))
            .isInstanceOf(RuntimeException.class);
        verifyNoInteractions(jwt);
    }

    @Test
    void missingOrDeletedAccountDoesNotIssueToken() {
        when(users.findByEmailAndDeletedAtIsNull("james@example.com")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> auth.login(new LoginRequest("james@example.com", "password123")))
            .isInstanceOf(RuntimeException.class);
        verifyNoInteractions(jwt);
    }
}
