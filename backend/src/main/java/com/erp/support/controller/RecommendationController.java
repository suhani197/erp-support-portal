package com.erp.support.controller;

import com.erp.support.dto.KbSuggestionDto;
import com.erp.support.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;

    /**
     * GET /api/recommendations/kb?query=invoice+error&topK=5
     * Returns KB articles most similar to the query using TF-IDF cosine similarity.
     * Only returns suggestions with score >= 0.15.
     */
    @GetMapping("/kb")
    public ResponseEntity<List<KbSuggestionDto>> recommend(
            @RequestParam String query,
            @RequestParam(defaultValue = "5") int topK) {
        return ResponseEntity.ok(recommendationService.recommend(query, topK));
    }
}
