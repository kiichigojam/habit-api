package com.example.habit_api.habits;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class HabitService {
    private final HabitRepository habits;
    private final HabitCheckinRepository checkins;

    public HabitService(HabitRepository habits, HabitCheckinRepository checkins) {
        this.habits = habits;
        this.checkins = checkins;
    }

    public List<HabitResponse> listHabits(UUID userId) {
        return habits.findAllByUserIdOrderByCreatedAtDesc(userId).stream().map(HabitResponse::from).toList();
    }

    public HabitResponse getHabit(UUID userId, UUID habitId) {
        return HabitResponse.from(ownedHabit(userId, habitId));
    }

    @Transactional
    public HabitResponse createHabit(UUID userId, CreateHabitRequest request) {
        Habit habit = new Habit();
        habit.setUserId(userId);
        habit.setTitle(request.title().trim());
        habit.setNotes(normalizeNotes(request.notes()));
        habits.save(habit);
        return HabitResponse.from(habit);
    }

    @Transactional
    public HabitResponse updateHabit(UUID userId, UUID habitId, UpdateHabitRequest request) {
        Habit habit = ownedHabit(userId, habitId);
        if (request.title() != null) {
            if (request.title().isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Title must not be blank");
            habit.setTitle(request.title().trim());
        }
        if (request.notes() != null) habit.setNotes(normalizeNotes(request.notes()));
        if (request.isActive() != null) habit.setActive(request.isActive());
        habits.save(habit);
        return HabitResponse.from(habit);
    }

    @Transactional
    public void deleteHabit(UUID userId, UUID habitId) {
        habits.delete(ownedHabit(userId, habitId));
    }

    public List<HabitCheckinResponse> listCheckins(UUID userId, UUID habitId) {
        ownedHabit(userId, habitId);
        return checkins.findAllByHabitIdAndUserIdOrderByCheckinDateDesc(habitId, userId)
            .stream().map(HabitCheckinResponse::from).toList();
    }

    public List<WorkoutDayResponse> listCheckinsGrouped(UUID userId, int days) {
        int safeDays = Math.max(1, Math.min(days, 30));
        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(safeDays - 1L);
        Map<UUID, String> titles = habits.findAllByUserIdOrderByCreatedAtDesc(userId).stream()
            .collect(Collectors.toMap(Habit::getId, Habit::getTitle));
        return checkins.findAllByUserIdAndCheckinDateBetweenOrderByCheckinDateDescCreatedAtDesc(userId, start, end)
            .stream().map(c -> new WorkoutEntryResponse(c.getId(), c.getHabitId(),
                titles.getOrDefault(c.getHabitId(), "Unknown habit"), c.getCheckinDate(), c.getCreatedAt()))
            .collect(Collectors.groupingBy(WorkoutEntryResponse::checkinDate, LinkedHashMap::new, Collectors.toList()))
            .entrySet().stream().map(e -> new WorkoutDayResponse(e.getKey(), e.getValue().size(), e.getValue())).toList();
    }

    @Transactional
    public HabitCheckinResponse createCheckin(UUID userId, UUID habitId, CreateHabitCheckinRequest request) {
        ownedHabit(userId, habitId);
        LocalDate date = request != null && request.checkinDate() != null ? request.checkinDate() : LocalDate.now();
        if (checkins.existsByHabitIdAndUserIdAndCheckinDate(habitId, userId, date)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Habit already checked in on this date");
        }
        HabitCheckin checkin = new HabitCheckin();
        checkin.setHabitId(habitId);
        checkin.setUserId(userId);
        checkin.setCheckinDate(date);
        checkins.save(checkin);
        return HabitCheckinResponse.from(checkin);
    }

    @Transactional
    public void deleteCheckin(UUID userId, UUID habitId, LocalDate date) {
        ownedHabit(userId, habitId);
        var checkin = checkins.findByHabitIdAndUserIdAndCheckinDate(habitId, userId, date)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Check-in not found"));
        checkins.delete(checkin);
    }

    private Habit ownedHabit(UUID userId, UUID habitId) {
        return habits.findByIdAndUserId(habitId, userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Habit not found"));
    }

    private String normalizeNotes(String notes) {
        return notes == null || notes.isBlank() ? null : notes.trim();
    }
}
