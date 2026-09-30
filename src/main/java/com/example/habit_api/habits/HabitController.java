package com.example.habit_api.habits;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.habit_api.security.CurrentUser;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/habits")
public class HabitController {
    private final HabitService habits;
    public HabitController(HabitService habits) { this.habits = habits; }

    @GetMapping
    public List<HabitResponse> listHabits() { return habits.listHabits(CurrentUser.id()); }

    @GetMapping("/{habitId}")
    public HabitResponse getHabit(@PathVariable UUID habitId) {
        return habits.getHabit(CurrentUser.id(), habitId);
    }

    @PostMapping
    public ResponseEntity<HabitResponse> createHabit(@Valid @RequestBody CreateHabitRequest request) {
        return ResponseEntity.status(201).body(habits.createHabit(CurrentUser.id(), request));
    }

    @PatchMapping("/{habitId}")
    public HabitResponse updateHabit(@PathVariable UUID habitId, @Valid @RequestBody UpdateHabitRequest request) {
        return habits.updateHabit(CurrentUser.id(), habitId, request);
    }

    @DeleteMapping("/{habitId}")
    public ResponseEntity<Void> deleteHabit(@PathVariable UUID habitId) {
        habits.deleteHabit(CurrentUser.id(), habitId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{habitId}/checkins")
    public List<HabitCheckinResponse> listCheckins(@PathVariable UUID habitId) {
        return habits.listCheckins(CurrentUser.id(), habitId);
    }

    @GetMapping("/checkins/grouped")
    public List<WorkoutDayResponse> listCheckinsGrouped(@RequestParam(value = "days", defaultValue = "7") int days) {
        return habits.listCheckinsGrouped(CurrentUser.id(), days);
    }

    @PostMapping("/{habitId}/checkins")
    public ResponseEntity<HabitCheckinResponse> createCheckin(@PathVariable UUID habitId,
            @RequestBody(required = false) CreateHabitCheckinRequest request) {
        return ResponseEntity.status(201).body(habits.createCheckin(CurrentUser.id(), habitId, request));
    }

    @DeleteMapping("/{habitId}/checkins/{checkinDate}")
    public ResponseEntity<Void> deleteCheckin(@PathVariable UUID habitId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkinDate) {
        habits.deleteCheckin(CurrentUser.id(), habitId, checkinDate);
        return ResponseEntity.noContent().build();
    }
}
