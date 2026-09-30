package com.example.habit_api.habits;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.time.LocalDate;
import java.util.*;
import org.junit.jupiter.api.*;
import org.mockito.ArgumentCaptor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

class HabitControllerTest {
    private final HabitRepository habits = mock(HabitRepository.class);
    private final HabitCheckinRepository checkins = mock(HabitCheckinRepository.class);
    private final HabitController controller = new HabitController(habits, checkins);
    private final UUID userId = UUID.randomUUID();
    private final UUID habitId = UUID.randomUUID();
    private final LocalDate date = LocalDate.of(2026, 9, 20);

    @BeforeEach
    void authenticate() {
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken(userId, null, List.of()));
    }

    @AfterEach
    void clearAuthentication() { SecurityContextHolder.clearContext(); }

    @Test
    void anotherUsersHabitCannotBeReadUpdatedDeletedOrCheckedIn() {
        when(habits.findByIdAndUserId(habitId, userId)).thenReturn(Optional.empty());
        assertThat(controller.getHabit(habitId).getStatusCode().value()).isEqualTo(404);
        assertThat(controller.updateHabit(habitId, new UpdateHabitRequest("new", null, null)).getStatusCode().value()).isEqualTo(404);
        assertThat(controller.deleteHabit(habitId).getStatusCode().value()).isEqualTo(404);
        assertThat(controller.createCheckin(habitId, new CreateHabitCheckinRequest(date)).getStatusCode().value()).isEqualTo(404);
        assertThat(controller.listCheckins(habitId).getStatusCode().value()).isEqualTo(404);
        assertThat(controller.deleteCheckin(habitId, date).getStatusCode().value()).isEqualTo(404);
        verify(habits, never()).save(any());
        verify(habits, never()).delete(any());
        verifyNoInteractions(checkins);
    }

    @Test
    void duplicateCheckinReturnsConflictWithoutSaving() {
        when(habits.findByIdAndUserId(habitId, userId)).thenReturn(Optional.of(new Habit()));
        when(checkins.existsByHabitIdAndUserIdAndCheckinDate(habitId, userId, date)).thenReturn(true);
        assertThat(controller.createCheckin(habitId, new CreateHabitCheckinRequest(date)).getStatusCode().value()).isEqualTo(409);
        verify(checkins, never()).save(any());
    }

    @Test
    void explicitCheckinDateAndOwnershipArePreserved() {
        when(habits.findByIdAndUserId(habitId, userId)).thenReturn(Optional.of(new Habit()));
        var response = controller.createCheckin(habitId, new CreateHabitCheckinRequest(date));
        var saved = ArgumentCaptor.forClass(HabitCheckin.class);
        verify(checkins).save(saved.capture());
        assertThat(response.getStatusCode().value()).isEqualTo(201);
        assertThat(saved.getValue().getUserId()).isEqualTo(userId);
        assertThat(saved.getValue().getHabitId()).isEqualTo(habitId);
        assertThat(saved.getValue().getCheckinDate()).isEqualTo(date);
    }

    @Test
    void absentCheckinBodyDefaultsToToday() {
        when(habits.findByIdAndUserId(habitId, userId)).thenReturn(Optional.of(new Habit()));
        LocalDate before = LocalDate.now();
        var response = controller.createCheckin(habitId, null);
        assertThat(response.getBody().checkinDate()).isBetween(before, LocalDate.now());
    }

    @Test
    void missingCheckinReturnsNotFoundWithoutDeleting() {
        when(habits.findByIdAndUserId(habitId, userId)).thenReturn(Optional.of(new Habit()));
        when(checkins.findByHabitIdAndUserIdAndCheckinDate(habitId, userId, date)).thenReturn(Optional.empty());
        assertThat(controller.deleteCheckin(habitId, date).getStatusCode().value()).isEqualTo(404);
        verify(checkins, never()).delete(any());
    }
}
