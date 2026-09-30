package com.example.habit_api.security;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.util.UUID;
import org.junit.jupiter.api.*;
import org.springframework.mock.web.*;
import org.springframework.security.core.context.SecurityContextHolder;
import com.example.habit_api.auth.JwtService;
import com.example.habit_api.users.UserRepository;
import jakarta.servlet.FilterChain;

class UserAuthFilterTest {
    private final JwtService jwt = new JwtService("test-only-signing-secret-at-least-32-bytes-long", 60);
    private final UserRepository users = mock(UserRepository.class);
    private final UserAuthFilter filter = new UserAuthFilter(jwt, users);
    private final FilterChain chain = mock(FilterChain.class);
    private final UUID userId = UUID.randomUUID();

    @BeforeEach
    @AfterEach
    void clearContext() { SecurityContextHolder.clearContext(); }

    @Test
    void validTokenForActiveAccountAuthenticatesRequest() throws Exception {
        when(users.existsByIdAndDeletedAtIsNull(userId)).thenReturn(true);
        var request = request(jwt.createToken(userId));
        var response = new MockHttpServletResponse();
        filter.doFilter(request, response, chain);
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        assertThat(authentication).isNotNull();
        assertThat(authentication.getPrincipal()).isEqualTo(userId);
        assertThat(authentication.isAuthenticated()).isTrue();
        verify(chain).doFilter(request, response);
    }

    @Test
    void validTokenForDeletedAccountDoesNotAuthenticate() throws Exception {
        when(users.existsByIdAndDeletedAtIsNull(userId)).thenReturn(false);
        filter.doFilter(request(jwt.createToken(userId)), new MockHttpServletResponse(), chain);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(users).existsByIdAndDeletedAtIsNull(userId);
    }

    @Test
    void malformedTokenDoesNotAuthenticateOrQueryDatabase() throws Exception {
        var request = request("invalid-token");
        var response = new MockHttpServletResponse();
        filter.doFilter(request, response, chain);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verifyNoInteractions(users);
        verify(chain).doFilter(request, response);
    }

    private MockHttpServletRequest request(String token) {
        var request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + token);
        return request;
    }
}
