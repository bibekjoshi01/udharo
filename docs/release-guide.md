# Release Guide

This guide explains how to release new versions safely and how to handle future updates without breaking existing users.

## 1) Versioning Rules (Must Follow)

We use **semantic versioning**:
- **MAJOR** (2.0.0): breaking changes or big redesigns
- **MINOR** (1.1.0): new features that are backward compatible
- **PATCH** (1.0.1): bug fixes only

Expo needs two versions:
- **User-visible**: `expo.version` (e.g., `1.1.0`)
- **Build number**: `expo.android.versionCode` (integer, must always increase)

### Example
```
expo.version: 1.1.0
android.versionCode: 2
```

## 2) Before You Release (Checklist)

- Run type check:
```
npx tsc -p tsconfig.json --noEmit
```

- Run lint:
```
npm run lint
```

- Run in dev once and test:
  - Add customer
  - Add credit/payment
  - PDF export
  - Backup export/import
  - Reports

## 3) Update Versions

Edit `app.json`:
- Update `expo.version`
- Increment `android.versionCode`

Example for v1.1.0:
```json
{
  "expo": {
    "version": "1.1.0",
    "android": {
      "versionCode": 2
    }
  }
}
```

## 4) Build Release

For Play Store (recommended):
```
eas build -p android --profile production
```

For test APK:
```
eas build -p android --profile preview
```

## 5) Upload to Play Store

- Go to **Google Play Console**
- Create a new release
- Upload the **AAB** from EAS
- Review and publish

---

# Handle Future App Updates (No Data Loss)

The app uses **local SQLite** storage. To avoid breaking existing installs:

## A) Database Migrations

When you change the schema (add columns or tables), do it safely:

1. **Keep migrations incremental**
2. **Never drop columns/tables** unless absolutely required
3. Add migration logic inside `src/db/database.ts`

Example pattern:
- Store schema version in `schema_migrations`
- If older version detected, run `ALTER TABLE` or create new tables

## B) Backward Compatibility

When adding new fields:
- Keep them **nullable**
- Provide default values in UI and export/import

## C) Export / Import Compatibility

Backup import/export already handles:
- Extra fields
- Missing fields

If new fields are added, update:
- `src/db/backup.ts` (add migration guard if needed)
- `src/utils/pdf.ts` if report output changes

## D) When to bump MAJOR

Use MAJOR version when:
- You remove data or break old behavior
- You redesign core logic or data structures

---

# Quick Release Summary

1. Update version + versionCode
2. Run type check + lint
3. Build with EAS
4. Upload to Play Store