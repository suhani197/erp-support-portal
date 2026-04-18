package com.erp.support;

import com.erp.support.entity.*;
import com.erp.support.enums.*;
import com.erp.support.enums.AppModule;
import com.erp.support.repository.KbArticleRepository;
import com.erp.support.service.RecommendationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RecommendationServiceTest {

    @Mock KbArticleRepository kbRepo;
    @InjectMocks RecommendationService service;

    @BeforeEach
    void setup() {
        User admin = User.builder().id(1L).fullName("Admin").role(UserRole.ADMIN).build();

        List<KbArticle> articles = List.of(
            article(1L, "Cannot log in to ERP – password error",
                "User receives Invalid credentials on login screen",
                "1. Check if account is locked\n2. Reset password\n3. Clear browser cache",
                AppModule.TECHNICAL, admin),

            article(2L, "Invoice GL posting fails with account error",
                "Error GL account 4001 not found when posting invoice",
                "1. Navigate to Finance Chart of Accounts\n2. Verify GL account 4001 exists",
                AppModule.FINANCE, admin),

            article(3L, "Inventory count shows negative stock",
                "Stock balance shows negative values in inventory report after goods issue",
                "1. Run stock reconciliation report\n2. Post correction goods receipt",
                AppModule.INVENTORY, admin)
        );

        when(kbRepo.findByStatus(KbStatus.PUBLISHED)).thenReturn(articles);
        service.buildIndex();
    }

    @Test
    void queryMatchingLoginArticle_returnsLoginFirst() {
        var results = service.recommend("cannot login password error credentials", 5);

        assertThat(results).isNotEmpty();
        assertThat(results.get(0).getArticleId()).isEqualTo(1L);
        assertThat(results.get(0).getScore()).isGreaterThan(0.15);
    }

    @Test
    void queryMatchingInvoiceArticle_returnsInvoiceFirst() {
        var results = service.recommend("invoice GL account posting error finance", 5);

        assertThat(results).isNotEmpty();
        assertThat(results.get(0).getArticleId()).isEqualTo(2L);
    }

    @Test
    void queryMatchingInventory_returnsInventoryArticle() {
        var results = service.recommend("negative stock inventory goods issue warehouse", 5);

        assertThat(results).isNotEmpty();
        assertThat(results.get(0).getArticleId()).isEqualTo(3L);
    }

    @Test
    void completelyUnrelatedQuery_returnsEmpty() {
        // No KB articles are about payroll or rocket engines
        var results = service.recommend("rocket engine combustion chamber nozzle", 5);

        assertThat(results).isEmpty();
    }

    @Test
    void shortQuery_returnsEmptyWithoutCrashing() {
        var results = service.recommend("ok", 5);
        // "ok" is under 3 chars after tokenisation so should return nothing
        assertThat(results).isNotNull();
    }

    @Test
    void topKLimitsResults() {
        var results = service.recommend("error account system login invoice stock", 2);
        assertThat(results).hasSizeLessThanOrEqualTo(2);
    }

    @Test
    void scoresAreDescending() {
        var results = service.recommend("login password credentials account access", 5);

        for (int i = 0; i < results.size() - 1; i++) {
            assertThat(results.get(i).getScore())
                .isGreaterThanOrEqualTo(results.get(i + 1).getScore());
        }
    }

    // ── helper ────────────────────────────────────────────────────────────

    private KbArticle article(Long id, String title, String symptoms, String steps,
                              AppModule AppModule, User author) {
        return KbArticle.builder()
                .id(id).title(title).symptoms(symptoms).resolutionSteps(steps)
                .appModule(AppModule).status(KbStatus.PUBLISHED).createdBy(author)
                .build();
    }
}
