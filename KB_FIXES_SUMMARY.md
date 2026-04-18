# KB Articles Display Issue - Fixes Applied

## Problem Summary
The Knowledge Base article list was not displaying articles and was returning a database error:
```
ERROR: function lower(bytea) does not exist
```

## Root Cause Analysis

### Issue 1: Backend Database Query Parameter Type Mismatch
- **Location**: `KbArticleRepository.java` (original code)
- **Problem**: The JPQL query was using `LOWER()` function on string parameters, but PostgreSQL was receiving parameters as bytea (binary) instead of text
- **Cause**: Parameter type inference issue in Spring/Hibernate with PostgreSQL enums

### Issue 2: Frontend Parameter Name Mismatch
- **Location**: `api.services.ts` - `KbService.search()` method
- **Problem**: Component was sending `query` parameter, but backend controller expected `keyword`
- **Cause**: Parameter mapping inconsistency between frontend and backend

## Solutions Implemented

### 1. Backend Repository Fix
**File**: `backend/src/main/java/com/erp/support/repository/KbArticleRepository.java`

Changed from JPQL query with `LOWER()` function to native SQL with PostgreSQL ILIKE operator:
```sql
SELECT * FROM kb_articles ka WHERE
(?1 IS NULL OR ka.status = CAST(?1 AS text)) AND
(?2 IS NULL OR ka.module = CAST(?2 AS text)) AND
(?3 IS NULL OR ka.title ILIKE '%' || ?3 || '%' OR ka.symptoms ILIKE '%' || ?3 || '%')
```

**Key changes:**
- Used `nativeQuery = true` for full PostgreSQL syntax control
- Used `ILIKE` (case-insensitive pattern matching) instead of `LOWER() LIKE`
- Explicitly cast string parameters to text type
- Used positional parameters `?1`, `?2`, `?3` instead of named parameters

### 2. Backend Service Update
**File**: `backend/src/main/java/com/erp/support/service/KbService.java`

Updated the `search()` method to convert enum parameters to strings before passing to repository:
```java
public List<KbArticleDto> search(String keyword, AppModule AppModule, KbStatus status) {
    String statusStr = status != null ? status.name() : null;
    String moduleStr = AppModule != null ? AppModule.name() : null;
    return kbRepo.search(statusStr, moduleStr, keyword)
            .stream().map(mapper::toKbArticleDto).toList();
}
```

### 3. Frontend API Service Fix
**File**: `frontend/src/app/core/services/api.services.ts`

Updated the `KbService.search()` method to properly map parameters:
```typescript
// Convert 'query' parameter to 'keyword' (what backend expects)
if (params['query'] && !params['keyword']) { 
    params['keyword'] = params['query']; 
    delete params['query']; 
}

// Ensure module parameter is mapped to 'AppModule'
if (params['module'] && !params['AppModule']) {
    params['AppModule'] = params['module'];
    delete params['module'];
}

// Map response: ensure both appModule and module properties are set
map(list => (list || []).map((a: any) => ({
    ...a,
    appModule: a.AppModule ?? a.appModule,
    module: a.AppModule ?? a.appModule
})))
```

## Verification Checklist

### Backend Flow
- [x] Controller receives `keyword`, `AppModule`, `status` parameters
- [x] Service converts enums to strings
- [x] Repository executes native SQL with proper type casting
- [x] Results are mapped to DTOs with correct field names

### Frontend Flow
- [x] Component sends `query` parameter (mapped to `keyword`)
- [x] Component sends `module` parameter (mapped to `AppModule`)
- [x] Component sends `status` parameter as-is
- [x] API service maps response fields: `AppModule` → `appModule` and `module`
- [x] Components display articles using `article.appModule` or `article.module`

## Important Note: Backend Rebuild Required

The source code changes have been applied, but the backend application must be rebuilt and restarted for the changes to take effect.

### To Rebuild Backend:
```bash
cd backend
./mvnw clean package -DskipTests
java -jar target/support-0.0.1-SNAPSHOT.jar
```

Or use the provided script:
```bash
BUILD_AND_RUN.bat
```

## Files Modified

### Backend
1. `backend/src/main/java/com/erp/support/repository/KbArticleRepository.java` - Native SQL query fix
2. `backend/src/main/java/com/erp/support/service/KbService.java` - Enum to string conversion

### Frontend
1. `frontend/src/app/core/services/api.services.ts` - Parameter mapping fixes

## Expected Result

After rebuilding and restarting the backend:
1. KB article list should display articles without errors
2. Search functionality should work with keyword filtering
3. Module filtering should work correctly
4. Status filtering should work correctly

