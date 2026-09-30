package com.example.habit_api.users;

import java.time.Instant;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class UserService {
    private final UserRepository users;
    public UserService(UserRepository users) { this.users = users; }

    public UserResponse getCurrentUser(UUID userId) {
        User user = activeUser(userId);
        return new UserResponse(user.getId(), user.getEmail(), user.getName(), user.getCreatedAt());
    }

    @Transactional
    public void deleteCurrentUser(UUID userId) {
        User user = activeUser(userId);
        user.setDeletedAt(Instant.now());
        users.save(user);
    }

    private User activeUser(UUID userId) {
        return users.findByIdAndDeletedAtIsNull(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }
}
