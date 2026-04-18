package com.erp.support.service;

import com.erp.support.dto.KbSuggestionDto;
import com.erp.support.entity.KbArticle;
import com.erp.support.enums.KbStatus;
import com.erp.support.repository.KbArticleRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Lightweight TF-IDF recommendation engine.
 *
 * Why TF-IDF?
 *   - Zero external dependencies or paid APIs
 *   - Fully explainable: score = how uniquely relevant this word is to this article
 *   - Fast enough for hundreds-to-thousands of KB articles in memory
 *   - Term Frequency (TF): how often a word appears in this article (normalised)
 *   - Inverse Document Frequency (IDF): log(total_docs / docs_containing_word)
 *     → common words like "the" get low IDF; rare words like "reconciliation" get high IDF
 *   - TF-IDF vector per article; cosine similarity against the query vector
 *
 * Rebuild triggers: KB publish / unpublish (called by KbService)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RecommendationService {

    private static final double MIN_SCORE = 0.15;
    private static final Set<String> STOP_WORDS = Set.of(
        "a","an","the","is","are","was","were","be","been","being",
        "have","has","had","do","does","did","will","would","could","should",
        "may","might","to","of","in","on","at","for","with","by","from",
        "and","or","but","not","this","that","it","its","their","they",
        "we","you","i","he","she","after","before","when","if","as","into"
    );

    private final KbArticleRepository kbRepo;

    // articleId -> TF-IDF vector
    private Map<Long, Map<String, Double>> articleVectors = new HashMap<>();
    // word -> IDF score
    private Map<String, Double> idfScores = new HashMap<>();
    // snapshot of articles for returning metadata
    private Map<Long, KbArticle> articleIndex = new HashMap<>();

    @PostConstruct
    public void buildIndex() {
        log.info("Building TF-IDF index...");
        List<KbArticle> articles = kbRepo.findByStatus(KbStatus.PUBLISHED);

        articleIndex = articles.stream()
                .collect(Collectors.toMap(KbArticle::getId, a -> a));

        // Step 1: tokenise all articles
        Map<Long, List<String>> tokenised = new HashMap<>();
        for (KbArticle a : articles) {
            tokenised.put(a.getId(), tokenise(getText(a)));
        }

        // Step 2: compute IDF for every term
        Map<String, Integer> docFreq = new HashMap<>();
        for (List<String> tokens : tokenised.values()) {
            new HashSet<>(tokens).forEach(t -> docFreq.merge(t, 1, Integer::sum));
        }
        int n = articles.size();
        idfScores = docFreq.entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        e -> Math.log((double)(n + 1) / (e.getValue() + 1)) + 1.0
                ));

        // Step 3: compute TF-IDF vectors
        articleVectors = new HashMap<>();
        for (Map.Entry<Long, List<String>> entry : tokenised.entrySet()) {
            articleVectors.put(entry.getKey(), tfidfVector(entry.getValue()));
        }
        log.info("TF-IDF index built: {} articles, {} unique terms", articles.size(), idfScores.size());
    }

    public List<KbSuggestionDto> recommend(String query, int topK) {
        if (articleVectors.isEmpty()) return List.of();

        List<String> queryTokens = tokenise(query);
        Map<String, Double> queryVector = tfidfVector(queryTokens);

        return articleVectors.entrySet().stream()
                .map(e -> {
                    double score = cosineSimilarity(queryVector, e.getValue());
                    KbArticle article = articleIndex.get(e.getKey());
                    var dto = new KbSuggestionDto();
                    dto.setArticleId(e.getKey());
                    dto.setTitle(article.getTitle());
                    dto.setAppModule(article.getAppModule());
                    dto.setSymptoms(article.getSymptoms());
                    dto.setScore(Math.round(score * 1000.0) / 1000.0);
                    return dto;
                })
                .filter(d -> d.getScore() >= MIN_SCORE)
                .sorted(Comparator.comparingDouble(KbSuggestionDto::getScore).reversed())
                .limit(topK)
                .toList();
    }

    // ── private helpers ───────────────────────────────────────────────────────

    private String getText(KbArticle a) {
        return String.join(" ", a.getTitle(),
                a.getSymptoms() != null ? a.getSymptoms() : "",
                a.getResolutionSteps());
    }

    private List<String> tokenise(String text) {
        return Arrays.stream(text.toLowerCase()
                        .replaceAll("[^a-z0-9 ]", " ")
                        .split("\\s+"))
                .filter(t -> t.length() > 2 && !STOP_WORDS.contains(t))
                .toList();
    }

    private Map<String, Double> tfidfVector(List<String> tokens) {
        if (tokens.isEmpty()) return Map.of();
        Map<String, Long> tf = tokens.stream()
                .collect(Collectors.groupingBy(t -> t, Collectors.counting()));
        int maxFreq = tf.values().stream().mapToInt(Long::intValue).max().orElse(1);

        Map<String, Double> vec = new HashMap<>();
        tf.forEach((term, freq) -> {
            double termFreq = (double) freq / maxFreq;
            double idf = idfScores.getOrDefault(term, Math.log(2.0) + 1.0);
            vec.put(term, termFreq * idf);
        });
        return vec;
    }

    private double cosineSimilarity(Map<String, Double> a, Map<String, Double> b) {
        double dot = 0, normA = 0, normB = 0;
        for (Map.Entry<String, Double> e : a.entrySet()) {
            dot += e.getValue() * b.getOrDefault(e.getKey(), 0.0);
            normA += e.getValue() * e.getValue();
        }
        for (double v : b.values()) normB += v * v;
        if (normA == 0 || normB == 0) return 0;
        return dot / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}
