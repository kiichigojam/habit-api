package com.example.habit_api.auth;

import static org.assertj.core.api.Assertions.*;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.ExpiredJwtException;

class JwtServiceTest {
    private final String secret = "test-only-signing-secret-at-least-32-bytes-long";

    @Test
    void signedTokenRestoresUserIdentity() {
        var jwt = new JwtService(secret, 60);
        UUID userId = UUID.randomUUID();
        assertThat(jwt.parseUserId(jwt.createToken(userId))).isEqualTo(userId);
    }

    @Test
    void tokenSignedWithAnotherKeyIsRejected() {
        String token = new JwtService(secret, 60).createToken(UUID.randomUUID());
        var other = new JwtService("another-test-secret-with-at-least-32-bytes", 60);
        assertThatThrownBy(() -> other.parseUserId(token)).isInstanceOf(JwtException.class);
    }

    @Test
    void expiredTokenIsRejected() {
        var jwt = new JwtService(secret, -1);
        String token = jwt.createToken(UUID.randomUUID());
        assertThatThrownBy(() -> jwt.parseUserId(token)).isInstanceOf(ExpiredJwtException.class);
    }
}
