# Data Model Patch

## Naming Rule

Use:

```ts
jobTitle: string
jobField: JobField
```

Do not use arbitrary `jobCategory` values.

## Prisma Enum

```prisma
enum JobField {
  PRODUCT_UX
  GRAPHIC_BRAND_IDENTITY
  SOFTWARE_ENGINEERING
  DATA_AI
  MARKETING_BRAND
  BUSINESS_ANALYSIS_DEVELOPMENT
  OPERATIONS
  CUSTOMER_EXPERIENCE
  CUSTOMER_SUPPORT
  SALES_COMMERCE
  STRATEGY_BUSINESS_MODEL
  FINANCE_LEGAL_INVESTMENT
  HR_ORG_CULTURE
  MANAGEMENT_LEADERSHIP_ENTREPRENEURSHIP
}
```

## Label Mapping

```ts
export const JOB_FIELD_LABELS: Record<JobField, string> = {
  PRODUCT_UX: "محصول و تجربه کاربر",
  GRAPHIC_BRAND_IDENTITY: "طراحی گرافیک و هویت بصری",
  SOFTWARE_ENGINEERING: "فنی و مهندسی نرم‌افزار",
  DATA_AI: "علوم داده و هوش مصنوعی",
  MARKETING_BRAND: "مارکتینگ و برند",
  BUSINESS_ANALYSIS_DEVELOPMENT: "تحلیل و توسعه کسب‌وکار",
  OPERATIONS: "عملیات",
  CUSTOMER_EXPERIENCE: "تجربه مشتری",
  CUSTOMER_SUPPORT: "پشتیبانی مشتریان",
  SALES_COMMERCE: "فروش و بازرگانی",
  STRATEGY_BUSINESS_MODEL: "استراتژی و مدل کسب‌وکار",
  FINANCE_LEGAL_INVESTMENT: "مالی، حقوقی و سرمایه‌گذاری",
  HR_ORG_CULTURE: "منابع انسانی و فرهنگ سازمانی",
  MANAGEMENT_LEADERSHIP_ENTREPRENEURSHIP: "مدیریت، رهبری و کارآفرینی"
};
```

## ExperienceTimelineItem Patch

```prisma
model ExperienceTimelineItem {
  id             String            @id @default(cuid())
  profileId      String
  profile        ExperienceProfile @relation(fields: [profileId], references: [id], onDelete: Cascade)

  jobTitle       String
  jobField       JobField
  orgLevel       OrgLevel

  companyName    String
  companyCountry String
  companyIndustry String?

  startYear      Int
  startMonth     Int?
  endYear        Int?
  endMonth       Int?
  isCurrent      Boolean           @default(false)

  description    String?
  sortOrder      Int?

  createdAt      DateTime          @default(now())
  updatedAt      DateTime          @updatedAt

  @@index([profileId])
  @@index([profileId, isCurrent])
  @@index([jobField])
  @@index([companyName])
  @@index([companyCountry])
}
```

## ExperienceProfile Patch

If the profile has a top-level job field list, it must also use `JobField[]` or a join table with the same fixed taxonomy.

Top-level `roleTitle` remains free text if used.
