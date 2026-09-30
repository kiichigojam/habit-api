package com.example.habit_api.users;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.habit_api.security.CurrentUser;

@RestController
@RequestMapping("/users")
public class UserController {
    private final UserService users;
    public UserController(UserService users) { this.users = users; }

    @GetMapping("/me")
    public UserResponse getCurrentUser() { return users.getCurrentUser(CurrentUser.id()); }

    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteCurrentUser() {
        users.deleteCurrentUser(CurrentUser.id());
        return ResponseEntity.noContent().build();
    }
}
