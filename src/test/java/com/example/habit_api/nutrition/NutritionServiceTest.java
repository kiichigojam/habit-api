package com.example.habit_api.nutrition;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.web.server.ResponseStatusException;

class NutritionServiceTest {
    private final NutritionSearchCacheRepository cache = mock(NutritionSearchCacheRepository.class);
    private final NutritionEntryRepository entries = mock(NutritionEntryRepository.class);
    private final UsdaFoodClient usda = mock(UsdaFoodClient.class);
    private final NutritionService service = new NutritionService(cache, entries, usda,
        new NutritionConfig().objectMapper(), 720);
    private final UUID userId = UUID.randomUUID();
    private final LocalDate date = LocalDate.of(2026, 9, 20);

    @Test
    void fractionalServingsCalculateTotalCaloriesWithHalfUpRounding() {
        var response = service.createEntry(userId, new CreateNutritionEntryRequest(
            " Banana ", "  ", 123L, date, new BigDecimal("1.25"),
            new BigDecimal("89.01"), new BigDecimal("100"), " g "));
        assertThat(response.calories()).isEqualByComparingTo("111.26");
        assertThat(response.foodName()).isEqualTo("Banana");
        assertThat(response.brandName()).isNull();
        var saved = ArgumentCaptor.forClass(NutritionEntry.class);
        verify(entries).save(saved.capture());
        assertThat(saved.getValue().getUserId()).isEqualTo(userId);
        assertThat(response.consumedOn()).isEqualTo(date);
    }

    @Test
    void dailyTotalsSumEntryCaloriesAndEmptyDayIsZero() {
        when(entries.findAllByUserIdAndConsumedOnOrderByCreatedAtDesc(userId, date))
            .thenReturn(List.of(entry(date, "100.25"), entry(date, "50.75")));
        assertThat(service.listEntries(userId, date).totalCalories()).isEqualByComparingTo("151.00");
        when(entries.findAllByUserIdAndConsumedOnOrderByCreatedAtDesc(userId, date)).thenReturn(List.of());
        assertThat(service.listEntries(userId, date).totalCalories()).isEqualByComparingTo("0");
    }

    @Test
    void groupedHistoryKeepsDatesSeparateAndSumsEachDay() {
        LocalDate today = LocalDate.now();
        when(entries.findAllByUserIdAndConsumedOnBetweenOrderByConsumedOnDescCreatedAtDesc(
            userId, today.minusDays(6), today)).thenReturn(List.of(
                entry(today, "100"), entry(today, "25"), entry(today.minusDays(1), "50")));
        var history = service.listEntriesGrouped(userId, 7);
        assertThat(history).hasSize(2);
        assertThat(history.getFirst().totalCalories()).isEqualByComparingTo("125");
        assertThat(history.getFirst().entries()).hasSize(2);
        assertThat(history.get(1).consumedOn()).isEqualTo(today.minusDays(1));
        assertThat(history.get(1).totalCalories()).isEqualByComparingTo("50");
    }

    @Test
    void anotherUsersEntryCannotBeUpdatedOrDeleted() {
        UUID id = UUID.randomUUID();
        when(entries.findByIdAndUserId(id, userId)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.deleteEntry(userId, id))
            .isInstanceOfSatisfying(ResponseStatusException.class, e -> assertThat(e.getStatusCode().value()).isEqualTo(404));
        assertThatThrownBy(() -> service.updateEntry(userId, id, new UpdateNutritionEntryRequest(
            "Banana", null, null, date, BigDecimal.ONE, BigDecimal.TEN, null, null)))
            .isInstanceOfSatisfying(ResponseStatusException.class, e -> assertThat(e.getStatusCode().value()).isEqualTo(404));
        verify(entries, never()).save(any());
        verify(entries, never()).delete(any());
    }

    @Test
    void editingRecalculatesCalories() {
        UUID id = UUID.randomUUID();
        when(entries.findByIdAndUserId(id, userId)).thenReturn(Optional.of(entry(date, "99")));
        var response = service.updateEntry(userId, id, new UpdateNutritionEntryRequest(
            "Banana", null, null, date, new BigDecimal("1.50"), new BigDecimal("89"), null, null));
        assertThat(response.calories()).isEqualByComparingTo("133.50");
    }

    @Test
    void deletingDayUsesOnlyRequestedUsersEntries() {
        var selected = List.of(entry(date, "100"));
        when(entries.findAllByUserIdAndConsumedOn(userId, date)).thenReturn(selected);
        service.deleteEntriesByDate(userId, date);
        verify(entries).deleteAll(selected);
    }

    @Test
    void freshCacheAvoidsUsdaCall() {
        NutritionSearchCache cached = new NutritionSearchCache();
        cached.setFetchedAt(Instant.now());
        cached.setResponseJson("[]");
        when(cache.findByNormalizedQuery("v2|greek yogurt|page=2|size=10")).thenReturn(Optional.of(cached));
        assertThat(service.searchFoods("  GREEK   Yogurt  ", 2, 10)).isEmpty();
        verifyNoInteractions(usda);
        verify(cache, never()).save(any());
    }

    @Test
    void staleCacheIsRefreshedAndFreshResultsRoundTrip() {
        NutritionSearchCache cached = new NutritionSearchCache();
        cached.setFetchedAt(Instant.now().minusSeconds(721 * 60));
        when(cache.findByNormalizedQuery("v2|banana|page=1|size=10")).thenReturn(Optional.of(cached));
        var result = new FoodSearchResultResponse(123L, "Banana", null, "SR Legacy",
            new BigDecimal("89"), new BigDecimal("100"), "g", "per_100g");
        when(usda.searchFoods("banana", 1, 10)).thenReturn(List.of(result));
        assertThat(service.searchFoods("banana", 1, 10)).containsExactly(result);
        verify(cache).save(cached);
        assertThat(service.searchFoods("banana", 1, 10)).containsExactly(result);
        verify(usda, times(1)).searchFoods("banana", 1, 10);
    }

    @Test
    void blankQueryIsRejectedBeforeExternalAccess() {
        assertThatThrownBy(() -> service.searchFoods("   ", 1, 10))
            .isInstanceOfSatisfying(ResponseStatusException.class, e -> assertThat(e.getStatusCode().value()).isEqualTo(400));
        verifyNoInteractions(cache, usda);
    }

    private NutritionEntry entry(LocalDate day, String calories) {
        var entry = new NutritionEntry();
        entry.setUserId(userId);
        entry.setConsumedOn(day);
        entry.setCalories(new BigDecimal(calories));
        return entry;
    }
}
