package com.erp.support.service;

import com.erp.support.dto.*;
import com.erp.support.entity.*;
import com.erp.support.enums.AppModule;
import com.erp.support.enums.KbStatus;
import com.erp.support.exception.ResourceNotFoundException;
import com.erp.support.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class KbService {

    private final KbArticleRepository kbRepo;
    private final TagRepository tagRepo;
    private final RecommendationService recommendationService;
    private final DtoMapper mapper;

    @Transactional
    public KbArticleDto create(CreateKbArticleRequest req, User currentUser) {
        var article = KbArticle.builder()
                .title(req.getTitle())
                .appModule(req.getAppModule())
                .symptoms(req.getSymptoms())
                .rootCause(req.getRootCause())
                .resolutionSteps(req.getResolutionSteps())
                .status(KbStatus.DRAFT)
                .createdBy(currentUser)
                .build();

        if (req.getTags() != null) {
            article.setTags(resolveTags(req.getTags()));
        }
        return mapper.toKbArticleDto(kbRepo.save(article));
    }

    @Transactional
    public KbArticleDto update(Long id, CreateKbArticleRequest req) {
        KbArticle article = findArticle(id);
        article.setTitle(req.getTitle());
        article.setAppModule(req.getAppModule());
        article.setSymptoms(req.getSymptoms());
        article.setRootCause(req.getRootCause());
        article.setResolutionSteps(req.getResolutionSteps());
        if (req.getTags() != null) article.setTags(resolveTags(req.getTags()));
        return mapper.toKbArticleDto(kbRepo.save(article));
    }

    @Transactional
    public KbArticleDto publish(Long id) {
        KbArticle article = findArticle(id);
        article.setStatus(KbStatus.PUBLISHED);
        var saved = kbRepo.save(article);
        recommendationService.buildIndex(); // rebuild TF-IDF index
        return mapper.toKbArticleDto(saved);
    }

    @Transactional
    public KbArticleDto unpublish(Long id) {
        KbArticle article = findArticle(id);
        article.setStatus(KbStatus.DRAFT);
        var saved = kbRepo.save(article);
        recommendationService.buildIndex();
        return mapper.toKbArticleDto(saved);
    }

    public List<KbArticleDto> search(String keyword, AppModule AppModule, KbStatus status) {
        String statusStr = status != null ? status.name() : null;
        String moduleStr = AppModule != null ? AppModule.name() : null;
        return kbRepo.search(statusStr, moduleStr, keyword)
                .stream().map(mapper::toKbArticleDto).toList();
    }

    public KbArticleDto getById(Long id) {
        return mapper.toKbArticleDto(findArticle(id));
    }

    private KbArticle findArticle(Long id) {
        return kbRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("KB article not found: " + id));
    }

    private Set<Tag> resolveTags(Set<String> tagNames) {
        return tagNames.stream()
                .map(name -> tagRepo.findByName(name)
                        .orElseGet(() -> tagRepo.save(Tag.builder().name(name).build())))
                .collect(Collectors.toSet());
    }
}
